const Gpio = require("onoff").Gpio;

class GpioCharacteristicActive {
    constructor(log, cActive, pin, invertHighLow, onChange) {
        this.log = log;
        this.cActive = cActive;

        this.pin = pin;
        this.invertHighLow = invertHighLow;

        this.onChange = onChange;
        this.cActive.on('change', this.onChangeHandler);

        this.initGpio();
    }

    onChangeHandler() {
        if (this.cActive.value) {
            this.log("opening...");
            this.gpio.writeSync(((!this.invertHighLow)? Gpio.HIGH : Gpio.LOW));
            this.log("opened");
        } else {
            this.log("closing...");
            this.gpioValve.writeSync(((!this.invertHighLow)? Gpio.LOW : Gpio.HIGH));
            this.log("closed");
        }
        if (this.onChange) {
            this.onChange();
        }
    }

    initGpio() {
        this.gpio = new Gpio(this.pin, 'out');
        this.gpio.writeSync(((!this.invertHighLow) ? Gpio.LOW : Gpio.HIGH));
    }
}

class GpioCharacteristicContactSensorState {
    constructor(log, cContactSensorState, pin, invertHighLow, onChange) {
        this.log = log;
        this.cContactSensorState = cContactSensorState;

        this.pin = pin;
        this.invertHighLow = invertHighLow;

        this.onChange = onChange;
        this.cContactSensorState.on('change', this.onChangeHandler);
        this.initGpio();
    }

    onChangeHandler() {
        this.log("GPIO" + this.pin + " " + (this.cContactSensorState.value ? "Contact is not detected." : "Contact is detected."));
        if (this.onChange) {
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

class GpioCharacteristicOn {
    constructor(log, cOn, pin, invertHighLow, onChange) {
        this.log = log;
        this.cOn = cOn;

        this.pin = pin;
        this.invertHighLow = invertHighLow;

        this.onChange = onChange;
        this.cOn.updateValue(false);
        this.cOn.on('change', this.onChangeHandler);

        this.initGpio();
    }

    onChangeHandler() {
        if (this.cOn.value) {
            this.log("switching on...");
            this.gpio.writeSync(((!this.invertHighLow) ? Gpio.HIGH : Gpio.LOW));
            this.log("switched on");
        } else {
            this.log("switching off...");
            this.gpio.writeSync(((!this.invertHighLow) ? Gpio.LOW : Gpio.HIGH));
            this.log("switched off");
        }
        if (this.onChange) {
            this.onChange();
        }
    }

    initGpio() {
        this.gpio = new Gpio(this.pin, 'out');
        this.gpio.writeSync(((!this.invertHighLow)? Gpio.LOW : Gpio.HIGH));
    }
}

module.exports = {
    GpioCharacteristicActive: GpioCharacteristicActive,
    GpioCharacteristicContactSensorState: GpioCharacteristicContactSensorState,
    GpioCharacteristicOn: GpioCharacteristicOn
};