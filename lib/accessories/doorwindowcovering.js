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

class MotorizedOpenClose extends require('../gpioAccessory.js').GPIOAccessory {
    constructor(log, config) {
        super(log, config, Homebridge, Identifier);
    }

    loadConfiguration() {
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
        this.hap.characteristicCurrentPosition.updateValue(50);

        this.hap.characteristicTargetPosition = this.service.getCharacteristic(Characteristic.TargetPosition);
        this.hap.characteristicTargetPosition.on('set', this.onSetTargetPosition.bind(this));
        this.hap.characteristicTargetPosition.updateValue(50);

        this.hap.characteristicPositionState = this.service.getCharacteristic(Characteristic.PositionState);
        this.hap.characteristicPositionState.on('change', this.onChangePositionState.bind(this));
        this.hap.characteristicPositionState.updateValue(Characteristic.PositionState.STOPPED);

        this.hap.characteristicHoldPosition = this.service.addCharacteristic(Characteristic.HoldPosition);
        this.hap.characteristicHoldPosition.on('change', this.onChangeHoldPosition.bind(this));

        this.engineUp = new Service.Switch(this.name + "engineUp").getCharacteristic(Characteristic.On);
        new (require('../gpioCharacteristics.js')).GpioSwitch(this.log, this.engineUp, this.pin, this.invertHighLow);

        this.engineDown = new Service.Switch(this.name + "engineDown").getCharacteristic(Characteristic.On);
        new (require('../gpioCharacteristics.js')).GpioSwitch(this.log, this.engineDown, this.pinClose, this.invertHighLowClose);

        if (this.pinContactOpen !== undefined) {
            this.log("adding open contact sensor.");
            this.contactOpen = new Service.ContactSensor(this.name + "openSensor").getCharacteristic(Characteristic.ContactSensorState);
            new (require('../gpioCharacteristics.js')).GpioContact(this.log, this.contactOpen, this.pinContactOpen, this.invertHighLowContactOpen, this.onChangeContactOpen.bind(this));
        }

        if (this.pinContactClose !== undefined) {
            this.log("adding close contact sensor.");
            this.contactClose = new Service.ContactSensor(this.name + "closeSensor").getCharacteristic(Characteristic.ContactSensorState);
            new (require('../gpioCharacteristics.js')).GpioContact(this.log, this.contactClose, this.pinContactClose, this.invertHighLowContactClose, this.onChangeContactClose.bind(this));
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

    onChangeHoldPosition() {
        if (this.hap.characteristicHoldPosition.value) {
            this.enginesStop();
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

    onSetTargetPosition(tmpTargetPosition, next) {
        if (this.hap.characteristicPositionState.value !== Characteristic.PositionState.STOPPED) {
            this.enginesStop();
        }
        let tmpCurrentPosition = this.hap.characteristicCurrentPosition.value;
        if (tmpTargetPosition === 0) {
            this.enginesDown(this.timeDown, tmpTargetPosition);
        } else if (tmpTargetPosition === 100) {
            this.enginesUp(this.timeUp, tmpTargetPosition);
        } else if (tmpTargetPosition > tmpCurrentPosition) {
            let tmpTimeUp = ((tmpTargetPosition - tmpCurrentPosition) / 100) * this.timeUp;
            this.enginesUp(tmpTimeUp, tmpTargetPosition);
        } else if (tmpTargetPosition < tmpCurrentPosition) {
            let tmpTimeDown = ((tmpCurrentPosition - tmpTargetPosition) / 100) * this.timeDown;
            this.enginesDown(tmpTimeDown, tmpTargetPosition);
        }
        return next();
    }

    enginesUp(duration, targetPosition) {
        this.hap.characteristicPositionState.updateValue(Characteristic.PositionState.INCREASING);
        this.timeStart = (new Date()).getTime();
        this.timer = setTimeout(() => {
            this.enginesStop(targetPosition);
        }, duration);

        this.engineDown.updateValue(0);
        this.engineUp.updateValue(1);
    }

    enginesDown(duration, targetPosition) {
        this.hap.characteristicPositionState.updateValue(Characteristic.PositionState.DECREASING);

        this.timeStart = (new Date()).getTime();
        this.timer = setTimeout(() => {
            this.enginesStop(targetPosition);
        }, duration);

        this.engineUp.updateValue(0);
        this.engineDown.updateValue(1);
    }

    enginesStop(targetPosition) {
        if (targetPosition === undefined) {
            targetPosition = this.generateInterruptCurrentPosition();
        }
        this.timeStart = null;
        this.hap.characteristicCurrentPosition.updateValue(targetPosition);
        this.hap.characteristicTargetPosition.updateValue(targetPosition);
        this.hap.characteristicPositionState.updateValue(Characteristic.PositionState.STOPPED);
        clearTimeout(this.timer);
        this.engineUp.updateValue(0);
        this.engineDown.updateValue(0);
    }

    generateInterruptCurrentPosition() {
        let timeNow = (new Date()).getTime();
        let positionBefore = this.hap.characteristicCurrentPosition.value;
        if (this.hap.characteristicTargetPosition === Characteristic.PositionState.DECREASING) {
            let newPosition = positionBefore - (((timeNow - this.timeStart) / this.timeDown) * 100);
            return newPosition <= 0 ? 0 : newPosition;
        } else {
            let newPosition = positionBefore + (((timeNow - this.timeStart) / this.timeDown) * 100);
            return newPosition >= 100 ? 100 : newPosition;
        }
    }
}
