module.exports = function (homebridge) {
    let ValvePersistence = require("./persistence.js");

    let ContactSensor = require("./lib/accessories/contactsensor.js");
    let ContactSensorIdentifier = "GPIO-ContactSensor-Service";
    homebridge.registerAccessory(
        "homebridge-gpio-services",
        ContactSensorIdentifier,
        ContactSensor(homebridge, ContactSensorIdentifier),
        true);

    let PushButton = require("./lib/accessories/pushbutton.js");
    let PushButtonIdentifier = "GPIO-PushButton-Service";
    homebridge.registerAccessory(
        "homebridge-gpio-services",
        PushButtonIdentifier,
        PushButton(homebridge, PushButtonIdentifier),
        true);

    let Switch = require("./lib/accessories/switch.js");
    let SwitchIdentifier = "GPIO-Switch-Service";
    homebridge.registerAccessory(
        "homebridge-gpio-services",
        SwitchIdentifier,
        Switch(homebridge, SwitchIdentifier),
        true);

    let Valve = require("./lib/accessories/valve.js");
    let ValveIdentifier = "GPIO-Valve-Service";
    homebridge.registerAccessory(
        "homebridge-gpio-services",
        ValveIdentifier,
        Valve(homebridge, ValveIdentifier, ValvePersistence),
        true);
}