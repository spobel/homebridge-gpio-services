let Homebridge, Characteristic, Service;

class AbstractAccessory {

    constructor(log, config, homebridge, identifier) {
        this.log = log;
        this.config = config;
        Homebridge = homebridge;
        Characteristic = homebridge.hap.Characteristic;
        Service = homebridge.hap.Service;
        this.version = require("../package.json").version;

        this.name = this.config.name;
        this.pin = this.config.pin;
        this.log("GPIO" + this.pin);
        this.invertHighLow = this.config.invertHighLow || false;

        this.informationService = new Service.AccessoryInformation();
        this.informationService
            .setCharacteristic(Characteristic.Manufacturer, "Sebastian Pobel")
            .setCharacteristic(Characteristic.Model, identifier)
            .setCharacteristic(Characteristic.SerialNumber, "GPIO" + this.pin)
            .setCharacteristic(Characteristic.FirmwareRevision, this.version);

        if (typeof this.loadConfiguration === 'function') {
            this.loadConfiguration();
        }

        if (typeof this.initService === 'function') {
            this.initService();
        }

        this.log(identifier + " service initialized.");
    }

    getServices() {
        return [this.informationService, this.service];
    }
}

module.exports = {AbstractAccessory: AbstractAccessory};
