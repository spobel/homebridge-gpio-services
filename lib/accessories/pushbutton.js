let Homebridge, Characteristic, Service;
let Identifier;

module.exports = function (homebridge, identifier) {
    Homebridge = homebridge;
    Characteristic = homebridge.hap.Characteristic;
    Service = homebridge.hap.Service;
    Identifier = identifier;
    return PushButton;
};

class PushButton extends require('./abstract_accessory.js').AbstractAccessory {
    constructor(log, config) {
        super(log, config, Homebridge, Identifier);
    }

    loadConfiguration() {
        this.invokeTimeout = this.config.invokeTimeout || 500;
    }

    initService() {
        this.service = new Service.Switch(this.name);
        this.service.isPrimaryService = true;

        this.hap = {};

        this.hap.characteristicOn = this.service.getCharacteristic(Characteristic.On);
        new (require("../gpio/gpio_actuators.js")).GpioOutput(this.log, this.hap.characteristicOn, this.pin, this.invertHighLow, this.onChangeCharacteristicOn.bind(this));
    }

    onChangeCharacteristicOn() {
        if (this.hap.characteristicOn.value) {
            this.log("trigger off in " + this.invokeTimeout + "ms.");
            setTimeout(() => {
                this.hap.characteristicOn.updateValue(0);
            }, this.invokeTimeout);
        }
    }
}
