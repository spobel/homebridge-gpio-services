module.exports = function (homebridge) {
    let Valve = require("./valve.js");
    let PersistenceValve = require("./persistence.js");
    homebridge.registerAccessory(
        "homebridge-gpio-valve",
        "GPIO-Valve-Service",
        Valve(homebridge, PersistenceValve),
        true);

    //let IrrigationSystem = require("./irrigationsystem.js");
    //let PersistenceIrrigationSystem = require("./persistence.js");
    //homebridge.registerAccessory("homebridge-gpio-valve", "GPIO-IrrigationSystem-Service", IrrigationSystem(homebridge, PersistenceIrrigationSystem), true);
}