var savexpm = require("../js/savexpm.js");
var binaryheap = require("../js/binaryheap.js");
var simulation = require("../js/simulation.js");

var fs = require('fs');
var filename = "cluster-pic.xpm";

var alpha = 0.441;
var goal = 1024;
var board, sim;

var args = process.argv.slice(2);
if (args.length > 0)
    goal = parseInt(args[0]);

function launch(){
    board = new simulation.InfiniteBoard(1);
    sim = new simulation.Simulation(board);
    var mins = {"x": 0, "y": 0};
    var maxs = {"x": 1, "y": 1};

    sim.alpha = alpha;
    sim.mu = 1;
    sim.static_type = [simulation.S2Z, simulation.Z2R];
    sim.motion_type = [simulation.S2Z, simulation.Z2R];
    sim.addZombieSeed(0, 0, simulation.S2Z);

    var l = 0;
    var t = 0;
    var sites = sim.dostep();
    while (sites){
        var sl = sites.length;
        for (var c=0; c<sl; c++){
            var site = sites[c];
            if (mins.x > site.x) mins.x = site.x;
            if (mins.y > site.y) mins.y = site.y;
            if (maxs.x < site.x) maxs.x = site.x;
            if (maxs.y < site.y) maxs.y = site.y;
        }
        l = Math.max((maxs.x-mins.x), (maxs.y-mins.y));

        if (t % 10000 == 0) console.log("time: "+t+" length: "+l);
        if (l >= goal) break;
        sites = sim.dostep();
        t += 1;
    }
    return l;
}

var size = launch();
while (size < goal) { console.log("last: "+ size); size = launch();}
fs.writeFileSync(filename, savexpm.xpm(sim.sites));
