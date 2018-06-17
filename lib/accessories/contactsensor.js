let Accessory, Service, Characteristic, UUIDGen;
let Identifier;

module.exports = function (homebridge, identifier) {
    Accessory = homebridge.platformAccessory;
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;

    Identifier = identifier;

    return ContactSensor;
};

function ContactSensor(log, config) {
    this.log = log;
    this.config = config;
    this.version = require("../../package.json").version;

    this.loadConfiguration();

    this.initService();
}

ContactSensor.prototype.getServices = function () {
    return [this.informationService, this.service];
};

ContactSensor.prototype.loadConfiguration = function () {
    this.name = this.config.name;
    this.pin = this.config.pin;
    this.log("GPIO" + this.pin);
    this.invertHighLow = this.config.invertHighLow || false;
};

ContactSensor.prototype.initService = function () {
    this.informationService = new Service.AccessoryInformation();
    this.informationService
        .setCharacteristic(Characteristic.Manufacturer, "Sebastian Pobel")
        .setCharacteristic(Characteristic.Model, Identifier)
        .setCharacteristic(Characteristic.SerialNumber, "GPIO" + this.pin)
        .setCharacteristic(Characteristic.FirmwareRevision, this.version);

    this.service = new Service.ContactSensor(this.name);
    this.service.isPrimaryService = true;

    this.hap = {};

    this.hap.contactSensorState = this.service.getCharacteristic(Characteristic.ContactSensorState);
    new (require("../gpioCharacteristics.js"))
        .GpioCharacteristicContactSensorState(this.log, this.hap.contactSensorState, this.pin, this.invertHighLow);

    this.log(Identifier + " service initialized.");
};