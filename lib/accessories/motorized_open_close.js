let Homebridge, Characteristic, Service;
let Identifier;

let MODUS = {OCS: "OpenCloseSwitch", OCPB: "OpenClosePushButton"};

module.exports = function (homebridge, identifier) {
    Homebridge = homebridge;
    Characteristic = homebridge.hap.Characteristic;
    Service = homebridge.hap.Service;
    Identifier = identifier;
    return MotorizedOpenClose;
};

class MotorizedOpenClose extends require('../abstract_accessory.js').AbstractAccessory {


    constructor(log, config) {
        super(log, config, Homebridge, Identifier);
    }

    loadConfiguration() {
        this.modus = this.config.modus || MODUS.OCPB;

        this.invokeTimeout = this.config.invokeTimeout || 500;

        this.pinOpen = this.config.pinOpen;
        this.invertHighLowOpen = this.config.invertHighLowOpen || false;
        this.pinClose = this.config.pinClose;
        this.invertHighLowClose = this.config.invertHighLowClose || false;

        this.pinContactOpen = this.config.pinContactOpen;
        this.invertHighLowContactOpen = this.config.invertHighLowContactOpen || false;
        this.pinContactClose = this.config.pinContactClose;
        this.invertHighLowContactClose = this.config.invertHighLowContactClose || false;

        this.timeOpen = this.config.timeOpen;
        this.timeClose = this.config.timeClose;
    }

    initService() {
        switch (Identifier) {
            case "GPIO-Door-Service":
                this.service = new Service.Door(this.name);
                break;
            case "GPIO-Window-Service":
                this.service = new Service.Window(this.name);
                break;
            case "GPIO-WindowCovering-Service":
            default:
                this.service = new Service.WindowCovering(this.name);
                break;
        }

        this.service.isPrimaryService = true;

        this.hap = {};

        this.hap.characteristicCurrentPosition = this.service.getCharacteristic(Characteristic.CurrentPosition);
        this.hap.characteristicCurrentPosition.on('get', this.onGetCurrentPosition.bind(this));
        this.hap.characteristicCurrentPosition.updateValue(50);

        this.hap.characteristicTargetPosition = this.service.getCharacteristic(Characteristic.TargetPosition);
        this.hap.characteristicTargetPosition.on('set', this.onSetTargetPosition.bind(this));
        this.hap.characteristicTargetPosition.updateValue(50);

        this.hap.characteristicPositionState = this.service.getCharacteristic(Characteristic.PositionState);
        this.hap.characteristicPositionState.on('change', this.onChangePositionState.bind(this));
        this.hap.characteristicPositionState.updateValue(Characteristic.PositionState.STOPPED);

        this.engineStartStop = new Service.Switch(this.name + "engineStop").getCharacteristic(Characteristic.On);
        new (require('../gpio_actuators.js')).GpioOutput(this.log, this.engineStartStop, this.pin, this.invertHighLow);

        this.engineOpen = new Service.Switch(this.name + "engineOpen").getCharacteristic(Characteristic.On);
        new (require('../gpio_actuators.js')).GpioOutput(this.log, this.engineOpen, this.pinOpen, this.invertHighLowOpen);

        this.engineClose = new Service.Switch(this.name + "engineClose").getCharacteristic(Characteristic.On);
        new (require('../gpio_actuators.js')).GpioOutput(this.log, this.engineClose, this.pinClose, this.invertHighLowClose);

        if (this.pinContactOpen !== undefined) {
            this.log("adding open contact sensor.");
            this.contactOpen = new Service.ContactSensor(this.name + "openSensor").getCharacteristic(Characteristic.ContactSensorState);
            new (require('../gpio_actuators.js')).GpioInput(this.log, this.contactOpen, this.pinContactOpen, this.invertHighLowContactOpen, this.onChangeContactOpen.bind(this));
        }

        if (this.pinContactClose !== undefined) {
            this.log("adding close contact sensor.");
            this.contactClose = new Service.ContactSensor(this.name + "closeSensor").getCharacteristic(Characteristic.ContactSensorState);
            new (require('../gpio_actuators.js')).GpioInput(this.log, this.contactClose, this.pinContactClose, this.invertHighLowContactClose, this.onChangeContactClose.bind(this));
        }
    }

    onChangeContactClose(contactClose, context) {
        if (contactClose.newValue) {
            this.enginesStop(0);
        }
    }

    onChangeContactOpen(contactOpen, context) {
        if (contactOpen.newValue) {
            this.enginesStop(100);
        }
    }

    onChangePositionState(positionState, context) {
        switch (positionState.newValue) {
            case Characteristic.PositionState.DECREASING:
                this.log("Status: CLOSING");
                break;
            case Characteristic.PositionState.INCREASING:
                this.log("Status: OPENING");
                break;
            case Characteristic.PositionState.STOPPED:
                this.log("Status: STOPPED");
                break;
            default:
                this.log("Status: RESERVED " + positionState.newValue);
                break;
        }
    }

    onGetCurrentPosition(callback, context) {
        let timeNow = (new Date()).getTime();
        let timeOld = this.timeStart;
        let positionBefore = this.oldPosition;
        let newPosition = 50;

        switch (this.hap.characteristicTargetPosition) {
            case Characteristic.PositionState.DECREASING:
                newPosition = positionBefore - (((timeNow - timeOld) / this.timeClose) * 100);
                newPosition = newPosition <= 0 ? 0 : newPosition;
                break;
            case Characteristic.PositionState.INCREASING:
                newPosition = positionBefore + (((timeNow - this.timeStart) / this.timeOpen) * 100);
                newPosition = newPosition >= 100 ? 100 : newPosition;
                break;
            case Characteristic.PositionState.STOPPED:
            default:
                newPosition = this.hap.characteristicCurrentPosition.value;
                break;
        }
        callback(null, newPosition);
        return newPosition;
    }

    onSetTargetPosition(value, callback, context) {
        let tmpCurrentPosition = this.hap.characteristicCurrentPosition.getValue();
        let tmpTargetPosition = value;
        this.timeStart = (new Date()).getTime();

        let tmpTimeToRun;

        if (tmpTargetPosition === 0) {
            tmpTimeToRun = this.timeClose;
            this.close();
        } else if (tmpTargetPosition === 100) {
            tmpTimeToRun = this.timeOpen;
            this.open();
        } else if (tmpTargetPosition > tmpCurrentPosition) {
            tmpTimeToRun = ((tmpTargetPosition - tmpCurrentPosition) / 100) * this.timeOpen;
            this.open();
        } else if (tmpTargetPosition < tmpCurrentPosition) {
            tmpTimeToRun = ((tmpCurrentPosition - tmpTargetPosition) / 100) * this.timeClose;
            this.close();
        } else {
            // do nothing current position is target position
        }
        clearTimeout(this.newPosTimer);
        this.newPosTimer = setTimeout(() => {
            this.stop();
            this.hap.characteristicCurrentPosition.updateValue(tmpTargetPosition);
            this.hap.characteristicTargetPosition.updateValue(tmpTargetPosition);
        }, tmpTimeToRun);
        return callback(null);
    }

    open() {
        switch (this.modus) {
            case MODUS.OCPB:
                this.openOCPB();
                break;
            case MODUS.OCS:
                this.openOCS();
                break;
        }
        this.hap.characteristicPositionState.updateValue(Characteristic.PositionState.INCREASING);
    }

    openOCPB() {
        switch (this.hap.characteristicPositionState.value) {
            case Characteristic.PositionState.DECREASING:
            case Characteristic.PositionState.STOPPED:
                this.engineOpen.updateValue(1);
                setTimeout(() => {
                    this.engineOpen.updateValue(0);
                }, this.invokeTimeout);
                break;
        }
    }

    openOCS() {
    }

    close() {
        switch (this.modus) {
            case MODUS.OCPB:
                this.closeOCPB();
                break;
            case MODUS.OCS:
                this.closeOCS();
                break;
        }
        this.hap.characteristicPositionState.updateValue(Characteristic.PositionState.DECREASING);
    }

    closeOCPB() {
        switch (this.hap.characteristicPositionState.value) {
            case Characteristic.PositionState.INCREASING:
            case Characteristic.PositionState.STOPPED:
                this.engineClose.updateValue(1);
                setTimeout(() => {
                    this.engineClose.updateValue(0);
                }, this.invokeTimeout);
                break;
        }
    }

    closeOCS() {

    }

    stop() {
        switch (this.modus) {
            case MODUS.OCPB:
                this.stopOCPB();
                break;
            case MODUS.OCS:
                this.stopOCS();
                break;
        }
        this.hap.characteristicPositionState.updateValue(Characteristic.PositionState.STOPPED);
    }

    stopOCPB() {
        switch (this.hap.characteristicPositionState.value) {
            case Characteristic.PositionState.DECREASING:
                this.engineClose.updateValue(1);
                setTimeout(() => {
                    this.engineClose.updateValue(0);
                }, this.invokeTimeout);
                break;
            case Characteristic.PositionState.INCREASING:
                this.engineOpen.updateValue(1);
                setTimeout(() => {
                    this.engineOpen.updateValue(0);
                }, this.invokeTimeout);
                break;
            case Characteristic.PositionState.STOPPED:
            default:
                break;
        }
    }

    stopOCS() {

    }
}
