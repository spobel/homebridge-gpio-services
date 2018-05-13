module.exports = function (homebridge) {
    var GPIOValve = require("./gpiovalve.js");
    var IrrigationSystem = require("./irrigationsystem.js");

    homebridge.registerAccessory("homebridge-gpio-valve", "GPIO-Valve-Accessory", GPIOValve(homebridge), true);
    homebridge.registerAccessory("homebridge-gpio-valve", "GPIO-Valve-Irrigation-System", IrrigationSystem(homebridge), true);
}