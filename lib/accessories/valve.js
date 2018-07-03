let Homebridge, Characteristic, Service;
let Persistence, Identifier;

module.exports = function (homebridge, identifier, persistence) {
    Homebridge = homebridge;
    Characteristic = homebridge.hap.Characteristic;
    Service = homebridge.hap.Service;
    Identifier = identifier;
    Persistence = new persistence(homebridge.user.persistPath() + "/homebridge-gpio-services_cache.json");
    return Valve;
};

class Valve extends require('../abstract_accessory.js').AbstractAccessory {
    constructor(log, config) {
        super(log, config, Homebridge, Identifier);
    }

    loadConfiguration() {
        this.valveType = this.config.valveType;

        this.configurationFlag = this.config.automationDatetime !== undefined;
        if (this.configurationFlag) {
            this.automationHours = this.config.automationDatetime.substr(0, 2);
            this.automationMinutes = this.config.automationDatetime.substr(3, 2);
        }

        this.automationDuration = this.config.automationDuration || 300;
        this.isAutomationActive = this.config.isAutomationActive || false;
        this.manualDuration = this.config.manualDuration || 300;

        this.loadPersistence();

        this.currentDuration = this.manualDuration;
    }

    loadPersistence() {
        let savedValve = Persistence.getValve(this)[0];
        if (savedValve !== undefined) {
            if (savedValve.manualDuration !== undefined) {
                this.manualDuration = savedValve.manualDuration;
            }
        }
    }

    savePersistence() {
        Persistence.saveValve(this);
    }

    initService() {
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
        this.hap.inUse.on('change', this.onChangeInUse.bind(this));
        this.hap.inUse.updateValue(0);

        this.hap.active = this.service.getCharacteristic(Characteristic.Active);
        new (require("../gpio_actuators.js")).GpioOutput(this.log, this.hap.active, this.pin, this.invertHighLow, this.onChangeActive.bind(this));
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
            this.automationTask();
        }
    }

    onSetActive(on, next) {
        //if user starts Valve manual, duration has to be set to manual.
        if (on) {
            this.currentDuration = this.manualDuration;
        }
        return next();
    }

    onChangeActive() {
        if (this.hap.active.value) {
            this.hap.inUse.updateValue(1);
        } else {
            this.hap.inUse.updateValue(0);
        }
    }

    onChangeInUse() {
        if (this.hap.inUse.value) {
            this.startTimer();
        } else {
            this.interruptTimer();
        }
    }

    onChangeSetDuration() {
        this.manualDuration = this.hap.setDuration.value;
        this.savePersistence();

        if (this.hap.inUse.value) {
            this.log("resetting timer to " + this.manualDuration + " seconds");
            this.currentDuration = this.manualDuration;
            this.startTimer();
        } else {
            this.log("change manual duration to " + this.manualDuration + " seconds");
        }
    }

    onGetRemainingDuration(callback) {
        //evaluate remaining duration, because ios is not saving rmaining duration
        return callback(null, this.timerDate != null ?
            (this.currentDuration - (((new Date()).getTime() - this.timerDate) / 1000)) : 0);
    }

    startTimer() {
        this.hap.remainingDuration.updateValue(this.currentDuration);

        this.timerDate = (new Date()).getTime();
        clearTimeout(this.timer);

        this.timer = setTimeout(() => {
            this.log("stopped by timer");
            this.timerDate = null;
            this.hap.active.updateValue(0);
        }, this.currentDuration * 1000);
        this.log("stops in " + this.currentDuration + " seconds");
    }

    interruptTimer() {
        this.log("timer interrupted");
        clearTimeout(this.timer);
    }

    automationTask() {
        setInterval(() => {
            let houreNow = (new Date()).getHours();
            let minuteNow = (new Date()).getMinutes();

            if (houreNow === this.automationHours && minuteNow === this.automationMinutes && this.isAutomationActive) {
                this.log("invoked by automation");
                this.currentDuration = this.automationDuration;
                this.hap.active.updateValue(1);
            }
        }, 60000);
    }
}
