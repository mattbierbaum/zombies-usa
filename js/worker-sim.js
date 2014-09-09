importScripts("binaryheap.js", "simulation.js");

var sim, board;
var running;
var mins = {"x": 0, "y": 0};
var maxs = {"x": 0, "y": 0};

function launch(alpha, mu, szr){
    running = true;
    mins = {"x": 0, "y": 0};
    maxs = {"x": 0, "y": 0};

    board = new InfiniteBoard(1);
    sim = new Simulation(board);
    sim.alpha = alpha;
    sim.mu = mu;

    if (szr == true){
        sim.static_types = [S2Z, Z2R];
        sim.motion_types = [S2Z, Z2R];
    } else {
        sim.static_types = [S2Z, I2R];
        sim.motion_types = [S2Z];
    }

    sim.addZombieSeed(0,0,S2Z);

    var sites = sim.dostep();
    var time = 0;
    while (sites && running){
        for (var c in sites){
            var site = sites[c];
            if (mins.x > site.x) mins.x = site.x;
            if (mins.y > site.y) mins.y = site.y;
            if (maxs.x < site.x) maxs.x = site.x;
            if (maxs.y < site.y) maxs.y = site.y;
        }

        self.postMessage({"cmd": "site", "d": sites});
        sites = sim.dostep();
    }
    report();
}

function report(){
    self.postMessage({"cmd": "report",
        "N": sim.R+sim.Z,
        "L": Math.max((maxs.x-mins.x), (maxs.y-mins.y))
    });
}

self.addEventListener('message', function(e) {
    if (e.data['cmd'] == 'run'){
        var alpha = e.data['alpha'];
        var mu = e.data['mu'];
        var szr = e.data['szr'];
        launch(alpha, mu, szr);
    }
    if (e.data['cmd'] == 'stop')
        running = false;
    if (e.data['cmd'] == 'report')
        report();

}, false);

