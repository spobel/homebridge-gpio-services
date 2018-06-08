let Accessory, Service, Characteristic, UUIDGen;
let Persistence, Identifier;

const Gpio = require("onoff").Gpio;

module.exports = function (homebridge, persistence, identifier) {
    Accessory = homebridge.platformAccessory;
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;

    Identifier = identifier;

    return GarageDoorOpener;
};

function GarageDoorOpener(log, config) {
    this.log = log;
    this.config = config;
    this.version = require("./package.json").version;

    this.loadConfiguration();

    this.initGPIO();

    this.initService();
}

GarageDoorOpener.prototype.getServices = function () {
    return [this.informationService, this.service];
};

GarageDoorOpener.prototype.loadConfiguration = function () {
    this.name = this.config.name;

    this.pin = this.config.pin;
    this.log("GPIO" + this.pin);
    this.pinIsOpen = this.config.pinIsOpen;
    this.pinIsClose= this.config.pinIsClose;

    this.invertHighLow = this.config.invertHighLow || false;
};

GarageDoorOpener.prototype.initService = function () {
    this.informationService = new Service.AccessoryInformation();
    this.informationService
        .setCharacteristic(Characteristic.Manufacturer, "Sebastian Pobel")
        .setCharacteristic(Characteristic.Model, Identifier)
        .setCharacteristic(Characteristic.SerialNumber, "GPIO" + this.pin)
        .setCharacteristic(Characteristic.FirmwareRevision, this.version);

    this.service = new Service.GarageDoorOpener(this.name);
    this.service.isPrimaryService = true;

    this.hap = {};
    this.hap.characteristicOn = this.service.getCharacteristic(Characteristic.On);
    this.hap.characteristicOn.updateValue(false);
    this.hap.characteristicOn.on('change', this.changeCharacteristicOn.bind(this));

    this.log(Identifier + " service initialized.");
};

GarageDoorOpener.prototype.changeCharacteristicOn = function () {
    if (this.hap.characteristicOn.value) {
        this.switchOn();
    } else {
        this.switchOff();
    }
};

GarageDoorOpener.prototype.garageDoorOpen = function () {
    this.log("switching on...");
    this.gpioValve.writeSync(((!this.invertHighLow)? Gpio.HIGH : Gpio.LOW));
    this.log("switched on");
};

GarageDoorOpener.prototype.garageDoorClose = function () {
    this.log("switching off...");
    this.gpioValve.writeSync(((!this.invertHighLow)? Gpio.LOW : Gpio.HIGH));
    this.log("switched off");
};

GarageDoorOpener.prototype.initGPIO = function () {
    this.gpioValve = new Gpio(this.pin, 'out');
    this.gpioValve.writeSync(((!this.invertHighLow)? Gpio.LOW : Gpio.HIGH));
};