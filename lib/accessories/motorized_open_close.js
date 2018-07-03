let Homebridge, Characteristic, Service;
let Identifier;

const EventEmitter = require('events');

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

        this.invokeTimeout = this.config.invokeTimeout || 500;
    }

    initService() {
        switch(Identifier) {
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
        this.hap.characteristicCurrentPosition.on('change', this.onChangeCurrentPosition.bind(this));
        this.hap.characteristicCurrentPosition.updateValue(50);

        this.hap.characteristicTargetPosition = this.service.getCharacteristic(Characteristic.TargetPosition);
        this.hap.characteristicTargetPosition.on('set', this.onSetTargetPosition.bind(this));
        this.hap.characteristicTargetPosition.updateValue(50);

        this.hap.characteristicPositionState = this.service.getCharacteristic(Characteristic.PositionState);
        this.hap.characteristicPositionState.on('change', this.onChangePositionState.bind(this));
        this.hap.characteristicPositionState.updateValue(Characteristic.PositionState.STOPPED);

        this.hap.characteristicHoldPosition = this.service.addCharacteristic(Characteristic.HoldPosition);
        this.hap.characteristicHoldPosition.on('change', this.onChangeHoldPosition.bind(this));

        this.engineStop = new Service.Switch(this.name + "engineStop").getCharacteristic(Characteristic.On);
        new (require('../gpio_actuators.js')).GpioOutput(this.log, this.engineStop, this.pin, this.invertHighLow, this.onChangeEngineStop.bind(this));

        this.engineUp = new Service.Switch(this.name + "engineOpen").getCharacteristic(Characteristic.On);
        new (require('../gpio_actuators.js')).GpioOutput(this.log, this.engineUp, this.pinOpen, this.invertHighLowOpen, this.onChangeEngineOpen.bind(this));

        this.engineDown = new Service.Switch(this.name + "engineClose").getCharacteristic(Characteristic.On);
        new (require('../gpio_actuators.js')).GpioOutput(this.log, this.engineDown, this.pinClose, this.invertHighLowClose, this.onChangeEngineClose.bind(this));

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

    onChangeContactOpen() {
        if (this.contactOpen.value) {
            this.enginesStop(100);
        }
    }

    onChangeContactClose() {
        if (this.contactClose.value) {
            this.enginesStop(0);
        }
    }

    onChangeCurrentPosition() {
        this.log("Current Position: " + this.hap.characteristicCurrentPosition.value + "%");
    }

    onChangeEngineClose() {
        if (this.engineDown.value) {
            this.log("trigger off in " + this.invokeTimeout + "ms.");
            setTimeout(() => {
                this.engineDown.updateValue(0);
            }, this.invokeTimeout);
        }
    }
    onChangeEngineStop() {
        if (this.engineStop.value) {
            this.log("trigger off in " + this.invokeTimeout + "ms.");
            setTimeout(() => {
                this.engineStop.updateValue(0);
            }, this.invokeTimeout);
        }
    }

    onChangeEngineOpen() {
        if (this.engineUp.value) {
            this.log("trigger off in " + this.invokeTimeout + "ms.");
            setTimeout(() => {
                this.engineUp.updateValue(0);
            }, this.invokeTimeout);
        }
    }

    onChangeHoldPosition() {
        if (this.hap.characteristicHoldPosition.value) {
            this.enginesStop();
            this.hap.characteristicTargetPosition.updateValue(this.hap.characteristicCurrentPosition.value);
        }
    }

    onChangePositionState() {
        switch(this.hap.characteristicPositionState.value) {
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
                this.log("Status: RESERVED " + this.hap.characteristicPositionState.value);
        }
    }

    onSetTargetPosition(targetPosition, next) {
        clearTimeout(this.newPosTimer);
        if (this.hap.characteristicPositionState.value !== Characteristic.PositionState.STOPPED) {
            this.enginesStop();
            this.newPosTimer = setTimeout((targetPosition) => {
                this.setNewTargetPosition(targetPosition);
            }, 500);
        } else {
            this.setNewTargetPosition(targetPosition);
        }
        return next();
    }

    setNewTargetPosition(tmpTargetPosition) {
        let tmpCurrentPosition = this.hap.characteristicCurrentPosition.value;
        if (tmpTargetPosition === 0) {
            this.engineClose(this.timeClose, 0);

        } else if (tmpTargetPosition === 100) {
            this.engineOpen(this.timeOpen, 100);

        } else if (tmpTargetPosition > tmpCurrentPosition) {
            let tmpTimeOpen = ((tmpTargetPosition - tmpCurrentPosition) / 100) * this.timeOpen;
            this.engineOpen(tmpTimeOpen, tmpTargetPosition);

        } else if (tmpTargetPosition < tmpCurrentPosition) {
            let tmpTimeClose = ((tmpCurrentPosition - tmpTargetPosition) / 100) * this.timeClose;
            this.engineClose(tmpTimeClose, tmpTargetPosition);
        } else {
            this.hap.characteristicTargetPosition.updateValue(this.hap.characteristicCurrentPosition.value);
        }
    }

    engineOpen(duration, targetPosition) {
        this.timeStart = (new Date()).getTime();
        this.hap.characteristicPositionState.updateValue(Characteristic.PositionState.INCREASING);

        this.timer = setTimeout(() => {
            this.enginesStop(targetPosition);
        }, duration);

        this.engineUp.updateValue(1);
    }

    engineClose(duration, targetPosition) {
        this.timeStart = (new Date()).getTime();
        this.hap.characteristicPositionState.updateValue(Characteristic.PositionState.DECREASING);

        this.timer = setTimeout(() => {
            this.enginesStop(targetPosition);
        }, duration);

        this.engineDown.updateValue(1);
    }

    enginesStop(currentPosition) {
        let timeNow = (new Date()).getTime();
        clearTimeout(this.timer);
        this.engineStop.updateValue(1);

        if (currentPosition === undefined) {
            currentPosition = this.generateInterruptCurrentPosition(timeNow);
        }
        this.timeStart = null;
        this.hap.characteristicCurrentPosition.updateValue(currentPosition);
        this.hap.characteristicTargetPosition.updateValue(currentPosition);
        this.hap.characteristicPositionState.updateValue(Characteristic.PositionState.STOPPED);
    }

    generateInterruptCurrentPosition(timeNow) {
        let positionBefore = this.hap.characteristicCurrentPosition.value;
        if (this.hap.characteristicTargetPosition === Characteristic.PositionState.DECREASING) {
            let newPosition = positionBefore - (((timeNow - this.timeStart) / this.timeClose) * 100);
            return newPosition <= 0 ? 0 : newPosition;
        } else if (this.hap.characteristicTargetPosition === Characteristic.PositionState.INCREASING) {
            let newPosition = positionBefore + (((timeNow - this.timeStart) / this.timeOpen) * 100);
            return newPosition >= 100 ? 100 : newPosition;
        } else {
            return 50;
        }
    }
}
