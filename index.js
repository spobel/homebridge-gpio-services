module.exports = function (homebridge) {
    let Valve = require("./valve.js");
    let PersistenceValve = require("./persistence.js");
    homebridge.registerAccessory(
        "homebridge-gpio-services",
        "GPIO-Valve-Service",
        Valve(homebridge, PersistenceValve),
        true);
}