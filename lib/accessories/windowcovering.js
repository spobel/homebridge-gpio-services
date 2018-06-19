let Accessory, Service, Characteristic, UUIDGen;
let Identifier;

module.exports = function (homebridge, persistence, identifier) {
    Accessory = homebridge.platformAccessory;
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;

    Identifier = identifier;

    return WindowCovering;
};

function WindowCovering(log, config) {
    this.log = log;
    this.config = config;
    this.version = require("../../package.json").version;

    this.loadConfiguration();

    this.initService();
}

WindowCovering.prototype.getServices = function () {
    return [this.informationService, this.service];
};

WindowCovering.prototype.loadConfiguration = function () {
    this.name = this.config.name;
    this.pin = this.config.pin;
    this.log("GPIO" + this.pin);
    this.invertHighLow = this.config.invertHighLow || false;
};

WindowCovering.prototype.initService = function () {
    this.informationService = new Service.AccessoryInformation();
    this.informationService
        .setCharacteristic(Characteristic.Manufacturer, "Sebastian Pobel")
        .setCharacteristic(Characteristic.Model, Identifier)
        .setCharacteristic(Characteristic.SerialNumber, "GPIO" + this.pin)
        .setCharacteristic(Characteristic.FirmwareRevision, this.version);

    this.service = new Service.Switch(this.name);
    this.service.isPrimaryService = true;

    this.hap = {};

    this.hap.characteristicOn = this.service.getCharacteristic(Characteristic.On);
    new (require("../gpioCharacteristics.js")).GpioCharacteristicOn(this.log, this.hap.characteristicOn, this.pin, this.invertHighLow);

    this.log(Identifier + " service initialized.");
};