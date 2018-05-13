var Accessory, Service, Characteristic, Persistence, UUIDGen;

//const rpio = require("rpio");
const fs = require('fs');

module.exports = function(homebridge) {
    Accessory = homebridge.platformAccessory;
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    Persistence = homebridge.user.persistPath();
    UUIDGen = homebridge.hap.uuid;
    return GPIOValve;
};

function persistence_exist(file) {
    try {
        return require(file).setDuration;
    } catch (e) {
        return false
    }
}

function persistence_create(file, newSetDuration) {
    const content = JSON.stringify({setDuration: newSetDuration});
    fs.writeFile(file, content, 'utf8', function (err) {
        if (err) {
            return console.log(err);
        }
    });
}

function GPIOValve(log, config) {
        this.log = log;
        this.config = config;
        this.version = require("./package.json").version;

        this.name = config.name;
        this.pin = config.pin;
        this.valveType = config.valveType;

        this.persistenceFile = Persistence + "/" + this.name + "_cache.json";

        this.timerDate;
        this.timer;

        this.initService();
}

GPIOValve.prototype.getServices = function () {
    return [this.informationService, this.service];
}

GPIOValve.prototype.initService = function () {
    this.informationService = new Service.AccessoryInformation();
    this.informationService
        .setCharacteristic(Characteristic.Manufacturer, "Sebastian Pobel")
        .setCharacteristic(Characteristic.Model, "GPIO " + this.valveType)
        .setCharacteristic(Characteristic.SerialNumber, "GPIO Pin: " + this.pin)
        .setCharacteristic(Characteristic.FirmwareRevision, this.version);

    this.service = new Service.Valve(this.name);
    this.service.isPrimaryService = true;

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
    this.setDuration.on('change', this.changeSetDuration.bind(this));
    this.setDuration.updateValue(persistence_exist(this.persistenceFile) ?
        require(this.persistenceFile).setDuration : 300);

    this.isConfigured = this.service.addCharacteristic(Characteristic.IsConfigured);
    this.isConfigured.on('change', (function () {
        this.log("isConf:" + this.isConfigured.value)
    }).bind(this));

    this.log("GPIOValve listen to pin: " + this.pin);
}

GPIOValve.prototype.changeActive = function () {
    if (this.active.value) {
        this.openValve();
        this.startTimer(this.setDuration.value);
        this.inUse.updateValue(1);
    } else {
        this.closeValve();
        this.startTimer(0);
        this.inUse.updateValue(0);
    }
}

GPIOValve.prototype.getRemainingDuration = function (callback) {
    var remaining = this.timerDate != null ? (this.setDuration.value - (((new Date()).getTime() - this.timerDate) / 1000)) : 0;
    return callback(null, remaining);
}

GPIOValve.prototype.changeSetDuration = function () {
    this.log("Set Duration to: " + this.setDuration.value + "seconds.");
    persistence_create(this.persistenceFile, this.setDuration.value);

    if (this.inUse.value) {
        this.startTimer(this.setDuration.value);
    }
}

GPIOValve.prototype.startTimer = function (remaining) {
    this.remainingDuration.updateValue(remaining);

    this.timerDate = (new Date()).getTime();
    clearTimeout(this.timer);

    this.timer = setTimeout(() => {
        this.timerDate = null;
        this.active.updateValue(0);
    }, remaining * 1000);

    this.log("Timer stops in " + remaining + "seconds.")
}

GPIOValve.prototype.openValve = function () {
    this.log("opening...");
    //todo gpio open
    this.log("opened");
}

GPIOValve.prototype.closeValve = function () {
    this.log("closing...");
    //todo gpio close
    this.log("closed");
}