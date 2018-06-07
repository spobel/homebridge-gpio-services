const fs = require('fs');

function Persistence(file) {
    this.persistenceFile = file;
    try {
        this.savedValves = require(this.persistenceFile).valves;
    } catch (e) {
        this.savedValves = [];
    }
}

Persistence.prototype.getValve = function (that) {
    return this.savedValves.filter(item => (item.name === that.name));
};

Persistence.prototype.saveValve = function (that) {
    let currentValve = {
        name: that.name,
        manualDuration: that.manualDuration,
        isConfigured: that.isConfigured
    };

    let tmp = this.savedValves.filter(item => (item.name === that.name));
    let index = this.savedValves.indexOf(tmp[0]);
    if (index !== -1) {
        this.savedValves[index] = currentValve;
    } else {
        this.savedValves.push(currentValve);
    }
    this.save();
};

Persistence.prototype.save = function () {
    let toSave = {valves: this.savedValves};
    fs.writeFile(this.persistenceFile, JSON.stringify(toSave), 'utf8', function (err) {
        if (err) {
            return console.log(err);
        }
    });
};

module.exports = Persistence;