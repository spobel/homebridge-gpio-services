let Accessory, Service, Characteristic, UUIDGen;
let Persistence;

const Gpio = require("onoff").Gpio;

module.exports = function (homebridge, persistence) {
    Accessory = homebridge.platformAccessory;
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;

    Persistence = new persistence(homebridge.user.persistPath() + "/homebridge-gpio-services_cache.json");

    return Valve;
};

function Valve(log, config) {
    this.log = log;
    this.config = config;
    this.version = require("./package.json").version;

    this.loadConfiguration();
    this.loadPersistence();

    this.currentDuration = this.manualDuration;

    this.initGPIO();
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
    this.manualStart = true;

    this.configurationFlag = this.config.automationDatetime !== undefined;
    if (this.configurationFlag) {
        this.automationHours = this.config.automationDatetime.substr(0,2);
        this.automationMinutes = this.config.automationDatetime.substr(3,2);
    }

    this.automationDuration = this.config.automationDuration || 300;
    this.isAutomationActive = this.config.isAutomationActive || false;
    this.manualDuration = this.config.manualDuration || 300;
};

Valve.prototype.loadPersistence = function () {
    let savedValve = Persistence.getValve(this)[0];
    if (savedValve !== undefined) {
        // if (savedValve.isAutomationActive !== undefined) {
        //     this.isAutomationActive = savedValve.isAutomationActive;
        // }
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
        .setCharacteristic(Characteristic.Model, "GPIO-Valve-Service")
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
    this.hap.active.on('change', this.changeActive.bind(this));
    this.hap.active.on('set', this.setActive.bind(this));

    this.hap.remainingDuration = this.service.addCharacteristic(Characteristic.RemainingDuration);
    this.hap.remainingDuration.on('get', this.getRemainingDuration.bind(this));

    this.hap.setDuration = this.service.addCharacteristic(Characteristic.SetDuration);
    this.hap.setDuration.updateValue(this.manualDuration);
    this.hap.setDuration.on('change', this.changeSetDuration.bind(this));

    if (this.configurationFlag) {
        //this.hap.isConfigured = this.service.addCharacteristic(Characteristic.IsConfigured);
        //this.hap.isConfigured.updateValue(this.isAutomationActive);
        this.log("autostart at " + this.automationHours + ":" + this.automationMinutes
            + " for " + this.automationDuration + " seconds is "
            + (this.isAutomationActive ? "enabled" : "disabled") + ".");
        this.automationStarter();
    }

    this.log("Valve service initialized!");
};

Valve.prototype.setActive = function (on, next) {
    if (on) {
        this.currentDuration = this.manualDuration;
    }
    return next();
};

Valve.prototype.changeActive = function () {
    if (this.hap.active.value) {
        this.openValve();
        this.hap.inUse.updateValue(1);
        this.startTimer(this.currentDuration);
    } else {
        this.closeValve();
        this.hap.inUse.updateValue(0);
        this.interruptTimer();
    }
};

// Valve.prototype.changeIsConfigured = function () {
//     this.isAutomationActive = this.hap.isConfigured.value;
//
//     this.hap.isConfigured.updateValue(this.isAutomationActive);
//
//     this.savePersistence();
//
//     this.log("Automatic start at " + this.automationHours + ":" + this.automationMinutes + " is " + (this.isAutomationActive? "enabled" : "disabled") + ".");
// };

Valve.prototype.changeSetDuration = function () {
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

Valve.prototype.getRemainingDuration = function (callback) {
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
}

Valve.prototype.automationStarter = function () {
    setInterval(() => {
        let houreNow = (new Date()).getHours();
        let minuteNow = (new Date()).getMinutes();

        if (houreNow == this.automationHours && minuteNow == this.automationMinutes && this.isAutomationActive) {
            this.log("invoked by automation");
            this.currentDuration = this.automationDuration;
            this.hap.active.updateValue(1);
        }
    }, 60000);
}

Valve.prototype.openValve = function () {
    this.gpioValve.writeSync(((!this.invertHighLow)? Gpio.HIGH : Gpio.LOW));
    this.log("opened");
};

Valve.prototype.closeValve = function () {
    this.gpioValve.writeSync(((!this.invertHighLow)? Gpio.LOW : Gpio.HIGH));
    this.log("closed");
};

Valve.prototype.initGPIO = function () {
    this.gpioValve = new Gpio(this.pin, 'out');
    this.gpioValve.writeSync(((!this.invertHighLow)? Gpio.LOW : Gpio.HIGH));
};