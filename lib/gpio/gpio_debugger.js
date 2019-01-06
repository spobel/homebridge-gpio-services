class GpioDebugger {
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
        let i = 4;
        let interval = setInterval(() => {
            this.status = this.status === 0 ? 1 : 0;
            func(null, this.status);
            i--;
            if (i<=0) clearInterval(interval);
        }, 5000);
    }
    writeSync(status) {
        this.status = status;
        this.log();
    }

    log() {
        console.log("GPIO" + this.pin + " is set to " + this.status);
    }

    static get LOW() {
        return 0;
    }

    static get HIGH() {
        return 1;
    }
}

module.exports = {Gpio : GpioDebugger};
