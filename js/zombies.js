var sim;
var UI;

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
        UI.init(sim);

        loop();
    });
}

function loop() {
    if (sim){
        if (UI.clicked)
            sim.addZombieSeed(UI.clicked.x, UI.clicked.y);

        var steps = 2000;
        var tstart = window.performance.now();

        for (var t=0; t<steps; t++){
            site = sim.dostep();
            if (!site) break;
            UI.modify_site(site);
        }

        var tend = window.performance.now();
        sim.fps = steps/(tend-tstart);
    }

    setTimeout(loop, 1);
}

