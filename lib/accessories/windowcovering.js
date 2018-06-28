let Homebridge, Characteristic, Service;
let Identifier;

const EventEmitter = require('events');

module.exports = function (homebridge, identifier) {
    Homebridge = homebridge;
    Characteristic = homebridge.hap.Characteristic;
    Service = homebridge.hap.Service;
    Identifier = identifier;
    return WindowCovering;
};

class WindowCovering extends require('../gpioAccessory.js').GPIOAccessory {
    constructor(log, config) {
        super(log, config, Homebridge, Identifier);
    }

    loadConfiguration() {
        this.pinDown = this.config.pinDown;
        this.invertHighLowDown = this.config.invertHighLowDown;
        this.pinContactOpen = this.config.pinContactOpen;
        this.invertHighLowContactOpen = this.config.invertHighLowContactOpen;
        this.pinContactClose = this.config.pinContactClose;
        this.invertHighLowContactClose = this.config.invertHighLowContactClose;
    }

    initService() {
        this.service = new Service.Window(this.name);
        this.service.isPrimaryService = true;

        this.hap = {};

        this.hap.characteristicCurrentPosition = this.service.getCharacteristic(Characteristic.CurrentPosition);

        this.hap.characteristicTargetPosition = this.service.getCharacteristic(Characteristic.TargetPosition);
        this.hap.characteristicPositionState = this.service.getCharacteristic(Characteristic.PositionState);

        this.contactOpen = new Service.ContactSensor(this.name + "openSensor").getCharacteristic(Characteristic.ContactSensorState);
        new (require('../gpioCharacteristics.js')).GpioContact(this.log, this.contactOpen, this.pinContactOpen, this.invertHighLowContactOpen, this.onChangeContactOpen.bind(this));

        this.contactClose = new Service.ContactSensor(this.name + "closeSensor").getCharacteristic(Characteristic.ContactSensorState);
        new (require('../gpioCharacteristics.js')).GpioContact(this.log, this.contactClose, this.pinContactClose, this.invertHighLowContactClose, this.onChangeContactClose.bind(this));

        this.log(Identifier + " service initialized.");
    }

    onChangeContactOpen() {
        if (this.contactOpen.value) {
            this.hap.characteristicCurrentPosition.updateValue(100);
        }
    }

    onChangeContactClose() {
        if (this.contactClose.value) {
            this.hap.characteristicCurrentPosition.updateValue(0);
        }
    }
}