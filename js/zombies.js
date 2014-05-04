var sim;
var UI;

function toFixed(value, precision, negspace) {
    negspace = typeof negspace !== 'undefined' ? negspace : '';
    var precision = precision || 0;
    var sneg = (value < 0) ? "-" : negspace;
    var neg = value < 0;
    var power = Math.pow(10, precision);
    var value = Math.round(value * power);
    var integral = String(Math.abs((neg ? Math.ceil : Math.floor)(value/power)));
    var fraction = String((neg ? -value : value) % power);
    var padding = new Array(Math.max(precision - fraction.length, 0) + 1).join('0');
    return sneg + (precision ? integral + '.' +  padding + fraction : integral);
}

function loadGrid(callback) {
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', 'dat/js-grid.json', true);
    xobj.onreadystatechange = function () {
        if (xobj.readyState == 4 && xobj.status == "200") {
            callback(JSON.parse(xobj.responseText));
        }
   };
   xobj.send(null);
}

window.onload = function () {
    loadGrid(function (dat) {
        var usboard = new USAMapBoard(dat);
        sim = new Simulation(usboard);
        sim.alpha = 1.4;
        sim.mu = 1./(75*sim.alpha);
        UI = new GUI('map');
        UI.init();

        loop();
    });
}

function loop() {
    if (sim){
        if (UI.clicked)
            sim.addZombieSeed(UI.clicked.x, UI.clicked.y);

        var steps = 1000;
        var tstart = window.performance.now();

        for (var t=0; t<steps; t++){
            site = sim.dostep();
            if (!site) break;
            UI.modify_site(site);
        }

        var tend = window.performance.now();
        fps = steps/(tend-tstart);
    }

    setTimeout(loop, 1);
}

