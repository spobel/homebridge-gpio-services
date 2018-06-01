let Accessory, Service, Characteristic, UUIDGen;
let Persistence;

//const rpio = require("rpio");
const fs = require('fs');

module.exports = function (homebridge, persistence) {
    Accessory = homebridge.platformAccessory;
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;

    Persistence = new persistence(homebridge.user.persistPath() + "/homebridge-gpio-valve_cache.json");

    return Valve;
};

function Valve(log, config) {
    this.log = log;
    this.config = config;
    this.version = require("./package.json").version;

    this.name = this.config.name;
    this.pin = this.config.pin;
    this.valveType = this.config.valveType;

    this.automationDatetime = this.config.automationDatetime;
    this.automationDuration = this.config.automationDuration || 300;
    this.configurationFlag = this.automationDatetime !== undefined;

    this.initService();
}

Valve.prototype.getServices = function () {
    return [this.informationService, this.service];
};

Valve.prototype.initService = function () {
    this.informationService = new Service.AccessoryInformation();
    this.informationService
        .setCharacteristic(Characteristic.Manufacturer, "Sebastian Pobel")
        .setCharacteristic(Characteristic.Model, "GPIO " + this.valveType)
        .setCharacteristic(Characteristic.SerialNumber, "GPIO Pin: " + this.pin)
        .setCharacteristic(Characteristic.FirmwareRevision, this.version);

    this.service = new Service.Valve(this.name);
    this.service.isPrimaryService = true;

    let savedValve = Persistence.getValve(this);

    switch (this.valveType) {
        case "Faucet":
            this.service.getCharacteristic(Characteristic.ValveType).updateValue(Characteristic.ValveType.WATER_FAUCET);
            break;
        case "ShowerHead":
            this.service.getCharacteristic(Characteristic.ValveType).updateValue(Characteristic.ValveType.SHOWER_HEAD);
            break;
        case "Sprinkler":
            this.service.getCharacteristic(Characteristic.ValveType).updateValue(Characteristic.ValveType.IRRIGATION);
            break;
        case "GenericValve":
        default:
            this.service.getCharacteristic(Characteristic.ValveType).updateValue(Characteristic.ValveType.GENERIC_VALVE);
            break;
    }

    this.inUse = this.service.getCharacteristic(Characteristic.InUse);
    this.inUse.updateValue(0);

    this.active = this.service.getCharacteristic(Characteristic.Active);
    this.active.on('change', this.changeActive.bind(this));

    this.remainingDuration = this.service.addCharacteristic(Characteristic.RemainingDuration);
    this.remainingDuration.on('get', this.getRemainingDuration.bind(this));

    this.setDuration = this.service.addCharacteristic(Characteristic.SetDuration);
    this.setDuration.updateValue((savedValve !== undefined && savedValve.setDuration !== undefined) ?
        savedValve.setDuration : 300);
    this.setDuration.on('change', this.changeSetDuration.bind(this));

    if (this.configurationFlag) {
        this.isConfigured = this.service.addCharacteristic(Characteristic.IsConfigured);
        this.isConfigured.updateValue((savedValve !== undefined && savedValve.isConfigured !== undefined) ?
            savedValve.isConfigured : false);
        this.isConfigured.on('get', this.getIsConfigured.bind(this));
    }

    this.log("Valve listen to pin: " + this.pin);
};

Valve.prototype.changeActive = function () {
    if (this.active.value) {
        this.openValve();
        this.inUse.updateValue(1);
        this.startTimer(this.setDuration.value);
    } else {
        this.closeValve();
        this.inUse.updateValue(0);
        this.startTimer(0);
    }
};

Valve.prototype.changeIsConfigured = function () {
        this.isConfigured.updateValue(this.isConfigured.value);

    Persistence.saveValve(this);
};

Valve.prototype.changeSetDuration = function () {
    this.log("Set Duration to: " + this.setDuration.value + "seconds.");
    Persistence.saveValve(this);

    if (this.inUse.value) {
        this.startTimer(this.setDuration.value);
    }
};

Valve.prototype.getIsConfigured = function (callback) {
    this.log("get" + this.isConfigured.value);
    return callback(null, this.isConfigured.value);
};

Valve.prototype.getRemainingDuration = function (callback) {
    return callback(null, this.timerDate != null ?
        (this.setDuration.value - (((new Date()).getTime() - this.timerDate) / 1000)) : 0);
};

Valve.prototype.startTimer = function (remaining) {
    this.remainingDuration.updateValue(remaining);

    this.timerDate = (new Date()).getTime();
    clearTimeout(this.timer);

    this.log("Timer stops in " + remaining + "seconds.")
    this.timer = setTimeout(() => {
        this.timerDate = null;
        this.active.updateValue(0);
    }, remaining * 1000);
};

Valve.prototype.openValve = function () {
    this.log("opening...");
    //todo gpio open
    this.log("opened");
};

Valve.prototype.closeValve = function () {
    this.log("closing...");
    //todo gpio close
    this.log("closed");
};