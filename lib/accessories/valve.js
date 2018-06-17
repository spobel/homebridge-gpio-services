let Accessory, Service, Characteristic, UUIDGen;
let Persistence, Identifier;

module.exports = function (homebridge, identifier, persistence) {
    Accessory = homebridge.platformAccessory;
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;

    Identifier = identifier;

    Persistence = new persistence(homebridge.user.persistPath() + "/homebridge-gpio-services_cache.json");

    return Valve;
};

function Valve(log, config) {
    this.log = log;
    this.config = config;
    this.version = require("../../package.json").version;

    this.loadConfiguration();

    this.initService();
}

Valve.prototype.getServices = function () {
    return [this.informationService, this.service];
};

Valve.prototype.loadConfiguration = function () {
    this.name = this.config.name;
    this.pin = this.config.pin;
    this.log("GPIO" + this.pin);
    this.invertHighLow = this.config.invertHighLow || false;

    this.valveType = this.config.valveType;

    this.configurationFlag = this.config.automationDatetime !== undefined;
    if (this.configurationFlag) {
        this.automationHours = this.config.automationDatetime.substr(0,2);
        this.automationMinutes = this.config.automationDatetime.substr(3,2);
    }

    this.automationDuration = this.config.automationDuration || 300;
    this.isAutomationActive = this.config.isAutomationActive || false;
    this.manualDuration = this.config.manualDuration || 300;

    this.loadPersistence();

    this.currentDuration = this.manualDuration;
};

Valve.prototype.loadPersistence = function () {
    let savedValve = Persistence.getValve(this)[0];
    if (savedValve !== undefined) {
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
        .setCharacteristic(Characteristic.Model, Identifier)
        .setCharacteristic(Characteristic.SerialNumber, "GPIO" + this.pin)
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
    new (require("../gpioCharacteristics.js")).GpioCharacteristicActive(this.log, this.hap.active, this.pin, this.invertHighLow, this.onChangeActive.bind(this));
    this.hap.active.on('set', this.onSetActive.bind(this));

    this.hap.remainingDuration = this.service.addCharacteristic(Characteristic.RemainingDuration);
    this.hap.remainingDuration.on('get', this.onGetRemainingDuration.bind(this));

    this.hap.setDuration = this.service.addCharacteristic(Characteristic.SetDuration);
    this.hap.setDuration.updateValue(this.manualDuration);
    this.hap.setDuration.on('change', this.onChangeSetDuration.bind(this));

    if (this.configurationFlag) {
        this.log("autostart at " + this.automationHours + ":" + this.automationMinutes
            + " for " + this.automationDuration + " seconds is "
            + (this.isAutomationActive ? "enabled" : "disabled") + ".");
        this.automationStarter();
    }

    this.log(Identifier + " service initialized!");
};

Valve.prototype.onSetActive = function (on, next) {
    if (on) {
        this.currentDuration = this.manualDuration;
    }
    return next();
};

Valve.prototype.onChangeActive = function () {
    if (this.hap.active.value) {
        this.hap.inUse.updateValue(1);
        this.startTimer(this.currentDuration);
    } else {
        this.hap.inUse.updateValue(0);
        this.interruptTimer();
    }
};

Valve.prototype.onChangeSetDuration = function () {
    this.manualDuration = this.hap.setDuration.value;
    this.savePersistence();

    if (this.hap.inUse.value) {
        this.log("resetting timer to " + this.manualDuration + " seconds");
        this.currentDuration = this.manualDuration;
        this.startTimer();
    } else {
        this.log("change manual duration to " + this.manualDuration + " seconds");
    }
};

Valve.prototype.onGetRemainingDuration = function (callback) {
    return callback(null, this.timerDate != null ?
        (this.currentDuration - (((new Date()).getTime() - this.timerDate) / 1000)) : 0);
};

Valve.prototype.startTimer = function (remaining) {
    this.hap.remainingDuration.updateValue(remaining);

    this.timerDate = (new Date()).getTime();
    clearTimeout(this.timer);

    this.log("stops in " + remaining + " seconds");
    this.timer = setTimeout(() => {
        this.log("stopped by timer");
        this.timerDate = null;
        this.hap.active.updateValue(0);
    }, remaining * 1000);
};

Valve.prototype.interruptTimer = function () {
    this.log("timer interrupted");
    clearTimeout(this.timer);
};

Valve.prototype.automationStarter = function () {
    setInterval(() => {
        let houreNow = (new Date()).getHours();
        let minuteNow = (new Date()).getMinutes();

        if (houreNow === this.automationHours && minuteNow === this.automationMinutes && this.isAutomationActive) {
            this.log("invoked by automation");
            this.currentDuration = this.automationDuration;
            this.hap.active.updateValue(1);
        }
    }, 60000);
};