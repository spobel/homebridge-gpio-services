let Gpio = require("onoff").Gpio;

class GpioInput {
    constructor(log, cContactSensorState, pin, invertHighLow, onChange) {
        this.log = log;
        this.cContactSensorState = cContactSensorState;

        this.pin = pin;
        this.invertHighLow = invertHighLow;

        this.onChange = onChange;
        this.cContactSensorState.on('change', this.onChangeHandler.bind(this));

        this.initGpio();
    }

    onChangeHandler() {
        this.log("GPIO" + this.pin + " : " + (this.cContactSensorState.value ? "Contact is not detected." : "Contact is detected."));
        if (typeof this.onChange === 'function') {
            this.onChange();
        }
    }

    updateStatus(value) {
        let contactValue = (!this.invertHighLow)? 0 : 1;
        let noContactValue = (!this.invertHighLow)? 1 : 0;
        this.cContactSensorState.updateValue(value ? contactValue : noContactValue);
    }

    initGpio() {
        this.gpio = new Gpio(this.pin, 'in', 'both');
        this.gpio.watch((err, value) => {
            if (err) {
            } else {
                this.updateStatus(value);
            }
        });
        this.updateStatus(this.gpio.readSync());
    }
}

class GpioOutput {
    constructor(log, cOn, pin, invertHighLow, onChange) {
        this.log = log;
        this.cOn = cOn;

        this.pin = pin;
        this.invertHighLow = invertHighLow;

        this.onChange = onChange;
        this.cOn.updateValue(false);
        this.cOn.on('change', this.onChangeHandler.bind(this));

        this.initGpio();
    }

    onChangeHandler() {
        if (this.cOn.value) {
            this.log("GPIO" + this.pin + " switching on...");
            this.gpio.writeSync(((!this.invertHighLow) ? Gpio.HIGH : Gpio.LOW));
            this.log("GPIO" + this.pin + " switched on");
        } else {
            this.log("GPIO" + this.pin + " switching off...");
            this.gpio.writeSync(((!this.invertHighLow) ? Gpio.LOW : Gpio.HIGH));
            this.log("GPIO" + this.pin + " switched off");
        }
        if (typeof this.onChange === 'function') {
            this.onChange();
        }
    }

    initGpio() {
        this.gpio = new Gpio(this.pin, 'out');
        this.gpio.writeSync(((!this.invertHighLow)? Gpio.LOW : Gpio.HIGH));
    }
}

module.exports = {
    GpioOutput: GpioOutput,
    GpioInput: GpioInput
};
