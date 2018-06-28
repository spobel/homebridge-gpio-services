class GpioDebug {
    constructor(pin, type, type2) {
        if (type === 'out') {

        } else if (type === 'in') {

        }
        this.pin = pin;
        this.status = 0;
    }

    readSync() {
        return this.status;
    }

    watch(func) {
        setInterval(() => {
            this.status = this.status === 0 ? 1 : 0;
            func(null, this.status)
        }, 10000);
    }
    writeSync(status) {
        this.status = status;
        this.log();
    }

    log() {
        console.log("GPIO" + this.pin + " is set to " + this.status);
    }
}

module.exports = {GpioDebug : GpioDebug};
