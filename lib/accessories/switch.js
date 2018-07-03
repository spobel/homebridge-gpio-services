let Homebridge, Characteristic, Service;
let Identifier;

module.exports = function (homebridge, identifier) {
    Homebridge = homebridge;
    Characteristic = homebridge.hap.Characteristic;
    Service = homebridge.hap.Service;
    Identifier = identifier;
    return Switch;
};

class Switch extends require('../abstract_accessory.js').AbstractAccessory {
    constructor(log, config) {
        super(log, config, Homebridge, Identifier);
    }

    initService() {
        this.service = new Service.Switch(this.name);
        this.service.isPrimaryService = true;

        this.hap = {};

        this.hap.characteristicOn = this.service.getCharacteristic(Characteristic.On);
        new (require("../gpio_actuators.js")).GpioOutput(this.log, this.hap.characteristicOn, this.pin, this.invertHighLow);
    }
}
