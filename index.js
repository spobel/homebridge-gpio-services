module.exports = function (homebridge) {
    let Persistence = require("./persistence.js");

    let ContactSensor = require("./contactsensor.js");
    let ContactSensorIdentifier = "GPIO-ContactSensor-Service";
    homebridge.registerAccessory(
        "homebridge-gpio-services",
        ContactSensorIdentifier,
        ContactSensor(homebridge, Persistence, ContactSensorIdentifier),
        true);

    let PushButton = require("./pushbutton.js");
    let PushButtonIdentifier = "GPIO-PushButton-Service";
    homebridge.registerAccessory(
        "homebridge-gpio-services",
        PushButtonIdentifier,
        PushButton(homebridge, Persistence, PushButtonIdentifier),
        true);

    let Switch = require("./switch.js");
    let SwitchIdentifier = "GPIO-Switch-Service";
    homebridge.registerAccessory(
        "homebridge-gpio-services",
        SwitchIdentifier,
        Switch(homebridge, Persistence, SwitchIdentifier),
        true);

    let Valve = require("./valve.js");
    let ValveIdentifier = "GPIO-Valve-Service";
    homebridge.registerAccessory(
        "homebridge-gpio-services",
        ValveIdentifier,
        Valve(homebridge, Persistence, ValveIdentifier),
        true);
}