let Accessory, Service, Characteristic, UUIDGen;
let Persistence, Identifier;

const Gpio = require("onoff").Gpio;

module.exports = function (homebridge, persistence, identifier) {
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
    this.version = require("./package.json").version;

    this.loadConfiguration();

    this.initService();

    this.initGPIO();
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
    this.hap.contactSensorState.on('change', this.changeContactSensorState.bind(this));

    this.log(Identifier + " service initialized.");
};

ContactSensor.prototype.changeContactSensorState = function () {
    this.log("" + (this.hap.contactSensorState.value ? "Contact is not detected." : "Contact is detected."));
};

ContactSensor.prototype.initGPIO = function () {
    this.gpioContactSensor = new Gpio(this.pin, 'in', 'both');
    this.gpioContactSensor.watch((err, value) => {
        if (err) {
        } else {
            this.updateStatus(value);
        }
    });
    this.updateStatus(this.gpioContactSensor.readSync());
};

ContactSensor.prototype.updateStatus = function (value) {
    let contactValue = (!this.invertHighLow)? 0 : 1;
    let noContactValue = (!this.invertHighLow)? 1 : 0;
    this.hap.contactSensorState.updateValue(value ? contactValue : noContactValue);
};