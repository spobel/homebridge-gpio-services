let Accessory, Service, Characteristic, UUIDGen;
let Persistence;

const rpio = require("rpio");
const fs = require('fs');

module.exports = function (homebridge, persistence) {
    Accessory = homebridge.platformAccessory;
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;

    Persistence = new persistence(homebridge.user.persistPath() + "/homebridge-gpio-valve-outlet_cache.json");

    return Valve;
};

function Valve(log, config) {
    this.log = log;
    this.config = config;
    this.version = require("./package.json").version;

    this.loadConfiguration();
    this.loadPersistence();
    rpio.open(this.pin, rpio.OUTPUT, rpio.LOW);
    this.initService();
}

Valve.prototype.getServices = function () {
    return [this.informationService, this.service];
};

Valve.prototype.loadConfiguration = function () {
    this.name = this.config.name;
    this.pin = this.config.pin;
    this.log("Pin: " + this.pin);
    this.valveType = this.config.valveType;


    this.configurationFlag = this.config.automationDatetime !== undefined;
    if (this.configurationFlag) {
        this.automationHours = this.config.automationDatetime.substr(0,2);
        this.automationMinutes = this.config.automationDatetime.substr(3,2);
    }
    this.automationDuration = this.config.automationDuration || 300;

    this.isConfigured = 0;

    this.manualDuration = this.config.manualDuration || 300;
};

Valve.prototype.loadPersistence = function () {
    let savedValve = Persistence.getValve(this);
    if (savedValve !== undefined) {
        if (savedValve.isConfigured !== undefined) {
            this.isConfigured = savedValve.isConfigured;
        }
        if (savedValve.manualDuration !== undefined) {
            this.manualDuration = savedValve.manualDuration;
        }
    }
};

Valve.prototype.savePersistence = function () {
    Persistence.saveValve(this);
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

    this.hap = {};
    this.hap.inUse = this.service.getCharacteristic(Characteristic.InUse);
    this.hap.inUse.updateValue(0);

    this.hap.active = this.service.getCharacteristic(Characteristic.Active);
    this.hap.active.on('change', this.changeActive.bind(this));

    this.hap.remainingDuration = this.service.addCharacteristic(Characteristic.RemainingDuration);
    this.hap.remainingDuration.on('get', this.getRemainingDuration.bind(this));

    this.hap.setDuration = this.service.addCharacteristic(Characteristic.SetDuration);
    this.hap.setDuration.updateValue(this.manualDuration);
    this.hap.setDuration.on('change', this.changeSetDuration.bind(this));

    // if (this.configurationFlag) {
    //     this.hap.isConfigured = this.service.addCharacteristic(Characteristic.IsConfigured);
    //     this.hap.isConfigured.updateValue(this.isConfigured);
    //     let status = (this.isConfigured)? "enabled" : "disabled";
    //     this.log("Automatic start at " + this.automationHours + ":" + this.automationMinutes + " is " + status + ".");
    //     this.automationStarter();
    // }

    this.log("Valve services initialized.");
};

Valve.prototype.changeActive = function () {
    if (this.hap.active.value) {
        this.openValve();
        this.hap.inUse.updateValue(1);
        this.startTimer(this.manualDuration, true);
    } else {
        this.closeValve();
        this.hap.inUse.updateValue(0);
        this.interruptTimer();
    }
};

Valve.prototype.changeIsConfigured = function () {
    this.isConfigured = this.hap.isConfigured.value;

    this.hap.isConfigured.updateValue(this.isConfigured);

    this.savePersistence();

    let status = (this.isConfigured)? "enabled" : "disabled";
    this.log("Automatic start at " + this.automationHours + ":" + this.automationMinutes + " is " + status + ".");
};

Valve.prototype.changeSetDuration = function () {
    this.manualDuration = this.hap.setDuration.value

    this.log("Set Duration to: " + this.manualDuration + "seconds.");

    this.savePersistence();

    if (this.hap.inUse.value) {
        this.log("Resetting Timer.")
        this.startTimer(this.manualDuration, true);
    }
};

Valve.prototype.getRemainingDuration = function (callback) {
    let currentDuration = (this.manualStart) ? this.manualDuration : this.automationDuration;
    return callback(null, this.timerDate != null ?
        (this.currentDuration - (((new Date()).getTime() - this.timerDate) / 1000)) : 0);
};

Valve.prototype.startTimer = function (remaining, manualStart) {
    this.manualStart = manualStart;
    this.hap.remainingDuration.updateValue(remaining);

    this.timerDate = (new Date()).getTime();
    clearTimeout(this.timer);

    this.log("Timer stops in " + remaining + "seconds.");
    this.timer = setTimeout(() => {
            this.timerDate = null;
            this.hap.active.updateValue(0);
        }, remaining * 1000);
};

Valve.prototype.interruptTimer = function () {
    this.log("Timer interrupted.");
    clearTimeout(this.timer);
}

// Valve.prototype.automationStarter = function () {
//     let timeBefore = (new Date()).getTime();
//     setInterval(() => {
//         let houreNow = (new Date()).getHours();
//         let minuteNow = (new Date()).getMinutes();
//
//         if (houreNow == this.automationHoure && minuteNow == this.automationMinute && this.isConfigured) {
//             this.hap.active.updateValue(1);
//         }
//     }, 10000);
// }

Valve.prototype.openValve = function () {
    this.log("opening...");
    rpio.write(this.pin, rpio.HIGH);
    this.log("opened");
};

Valve.prototype.closeValve = function () {
    this.log("closing...");
    rpio.write(this.pin, rpio.LOW);
    this.log("closed");
};