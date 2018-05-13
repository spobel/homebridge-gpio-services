const GPIOValve = require("./gpiovalve.js");

module.exports = function (homebridge) {
    homebridge.registerAccessory("homebridge-gpio-valve", "GPIOValve", GPIOValve(homebridge), true);
}