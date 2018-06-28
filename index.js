module.exports = function (homebridge) {
    let Persistence = require("./persistence.js");

    let ContactSensor = require("./lib/accessories/contactsensor.js");
    homebridge.registerAccessory(
        "homebridge-gpio-services",
        "GPIO-ContactSensor-Service",
        ContactSensor(homebridge, "GPIO-ContactSensor-Service"),
        true);

    let Door = require("./lib/accessories/doorwindowcovering.js");
    let DoorIdentifier = "GPIO-Door-Service";
    homebridge.registerAccessory(
        "homebridge-gpio-services",
        DoorIdentifier,
        Door(homebridge, DoorIdentifier),
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
        Valve(homebridge, ValveIdentifier, Persistence),
        true);

    let Window = require("./lib/accessories/doorwindowcovering.js");
    let WindowIdentifier = "GPIO-Window-Service";
    homebridge.registerAccessory(
        "homebridge-gpio-services",
        WindowIdentifier,
        Window(homebridge, WindowIdentifier),
        true);

    let WindowCovering = require("./lib/accessories/doorwindowcovering.js");
    let WindowCoveringIdentifier = "GPIO-WindowCovering-Service";
    homebridge.registerAccessory(
        "homebridge-gpio-services",
        WindowCoveringIdentifier,
        WindowCovering(homebridge, WindowCoveringIdentifier),
        true);
};
