var Accessory, Service, Characteristic, Persistence, UUIDGen;

//const rpio = require("rpio");
const fs = require('fs');

module.exports = function(homebridge) {
    Accessory = homebridge.platformAccessory;
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    Persistence = homebridge.user.persistPath();
    UUIDGen = homebridge.hap.uuid;

    return IrrigationSystem;
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

function IrrigationSystem(log, config) {
        this.log = log;
        this.config = config;
        this.version = require("./package.json").version;

        this.name = config.name;

        this.persistenceFile = Persistence + "/" + this.name + "_cache.json";

        this.timerDate;
        this.timer;

        this.initService();
}

IrrigationSystem.prototype.getServices = function () {
    return [this.informationService, this.service];
}

IrrigationSystem.prototype.initService = function () {
    this.informationService = new Service.AccessoryInformation();
    this.informationService
        .setCharacteristic(Characteristic.Manufacturer, "Sebastian Pobel")
        .setCharacteristic(Characteristic.Model, "Irrigation System")
        .setCharacteristic(Characteristic.FirmwareRevision, this.version);

    this.service = new Service.Valve(this.name);
    this.service.isPrimaryService = true;

    this.active = this.service.getCharacteristic(Characteristic.Active);
    this.active.on('change', this.changeActive.bind(this));

    this.programMode = this.service.addCharacteristic(Characteristic.ProgramMode);
    this.programMode.on('change', this.changeProgramMode.bind(this));

    this.inUse = this.service.getCharacteristic(Characteristic.InUse);
    this.inUse.updateValue(0);

    this.remainingDuration = this.service.addCharacteristic(Characteristic.RemainingDuration);
    this.remainingDuration.on('get', this.getRemainingDuration.bind(this));
}

IrrigationSystem.prototype.changeActive = function () {
    if (this.active.value) {
        this.inUse.updateValue(1);
    } else {
        this.inUse.updateValue(0);
    }
}

IrrigationSystem.prototype.changeProgramMode = function () {
    this.log(this.programMode.value);
}

IrrigationSystem.prototype.getRemainingDuration = function (callback) {
    var remaining = this.timerDate != null ? (this.setDuration.value - (((new Date()).getTime() - this.timerDate) / 1000)) : 0;
    return callback(null, remaining);
}

IrrigationSystem.prototype.startTimer = function (remaining) {
    this.remainingDuration.updateValue(remaining);

    this.timerDate = (new Date()).getTime();
    clearTimeout(this.timer);

    this.timer = setTimeout(() => {
        this.timerDate = null;
        this.active.updateValue(0);
    }, remaining * 1000);

    this.log("Timer stops in " + remaining + "seconds.")
}

IrrigationSystem.prototype.openValve = function () {
    this.log("opening...");
    //todo gpio open
    this.log("opened");
}

IrrigationSystem.prototype.closeValve = function () {
    this.log("closing...");
    //todo gpio close
    this.log("closed");
}