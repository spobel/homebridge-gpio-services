let Homebridge, Characteristic, Service;
let Identifier;

module.exports = function (homebridge, identifier) {
    Homebridge = homebridge;
    Characteristic = homebridge.hap.Characteristic;
    Service = homebridge.hap.Service;
    Identifier = identifier;
    return ContactSensor;
};

class ContactSensor extends require('./abstract_accessory.js').AbstractAccessory {
    constructor(log, config) {
        super(log, config, Homebridge, Identifier);
    }

    initService() {
        this.service = new Service.ContactSensor(this.name);
        this.service.isPrimaryService = true;

        this.hap = {};

        this.hap.contactSensorState = this.service.getCharacteristic(Characteristic.ContactSensorState);
        new (require("../gpio/gpio_actuators.js"))
            .GpioInput(this.log, this.hap.contactSensorState, this.pin, this.invertHighLow);
    }
}
