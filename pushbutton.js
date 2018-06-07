let Accessory, Service, Characteristic, UUIDGen;
let Persistence;

const Gpio = require("onoff").Gpio;

module.exports = function (homebridge, persistence) {
    Accessory = homebridge.platformAccessory;
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;

    return PushButton;
};

function PushButton(log, config) {
    this.log = log;
    this.config = config;
    this.version = require("./package.json").version;

    this.loadConfiguration();

    this.initGPIO();

    this.initService();
}

PushButton.prototype.getServices = function () {
    return [this.informationService, this.service];
};

PushButton.prototype.loadConfiguration = function () {
    this.name = this.config.name;
    this.pin = this.config.pin;
    this.log("Pin: " + this.pin);
    this.invokeTimeout = this.config.invokeTimeout || 500;
    this.invertHighLow = this.config.invertHighLow || false;
};

PushButton.prototype.initService = function () {
    this.informationService = new Service.AccessoryInformation();
    this.informationService
        .setCharacteristic(Characteristic.Manufacturer, "Sebastian Pobel")
        .setCharacteristic(Characteristic.Model, "GPIO Switch")
        .setCharacteristic(Characteristic.SerialNumber, "Pin: GPIO" + this.pin)
        .setCharacteristic(Characteristic.FirmwareRevision, this.version);

    this.service = new Service.Switch(this.name);
    this.service.isPrimaryService = true;

    this.hap = {};
    this.hap.characteristicOn = this.service.getCharacteristic(Characteristic.On);
    this.hap.characteristicOn.updateValue(false);
    this.hap.characteristicOn.on('change', this.changeCharacteristicOn.bind(this));

    this.log("Switch service initialized.");
};

PushButton.prototype.changeCharacteristicOn = function () {
    if (this.hap.characteristicOn.value) {
        this.switchOn();
    } else {
        this.switchOff();
    }
};

PushButton.prototype.switchOn = function () {
    this.gpioValve.writeSync(((!this.invertHighLow) ? Gpio.HIGH : Gpio.LOW));
    setTimeout(() => {this.hap.characteristicOn.updateValue(0);},this.invokeTimeout);
};

PushButton.prototype.switchOff = function () {
    this.gpioValve.writeSync(((!this.invertHighLow) ? Gpio.LOW : Gpio.HIGH));
    this.log("triggerd");
};

PushButton.prototype.initGPIO = function () {
    this.gpioValve = new Gpio(this.pin, 'out');
    this.gpioValve.writeSync(((!this.invertHighLow) ? Gpio.LOW : Gpio.HIGH));
};