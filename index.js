module.exports = function (homebridge) {
    let Persistence = require("./persistence.js");

    let PushButton = require("./pushbutton.js");
    homebridge.registerAccessory(
        "homebridge-gpio-services",
        "GPIO-PushButton-Service",
        PushButton(homebridge, Persistence),
        true);

    let Switch = require("./switch.js");
    homebridge.registerAccessory(
        "homebridge-gpio-services",
        "GPIO-Switch-Service",
        Switch(homebridge, Persistence),
        true);

    let Valve = require("./valve.js");
    homebridge.registerAccessory(
        "homebridge-gpio-services",
        "GPIO-Valve-Service",
        Valve(homebridge, Persistence),
        true);
}