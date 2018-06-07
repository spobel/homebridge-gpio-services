module.exports = function (homebridge) {
    let Valve = require("./valve.js");
    let Switch = require("./switch.js");
    let Persistence = require("./persistence.js");
    homebridge.registerAccessory(
        "homebridge-gpio-services",
        "GPIO-Valve-Service",
        Valve(homebridge, Persistence),
        true);
    homebridge.registerAccessory(
        "homebridge-gpio-services",
        "GPIO-Switch-Service",
        Switch(homebridge, Persistence),
        true);
}