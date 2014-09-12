var binaryheap = require("../js/binaryheap.js");
var simulation = require("../js/simulation.js");

var fs = require('fs');

var alpha = 0.441;
var L = 1024;
var N = 1024;
var worker = new Array();
var all = new Array();

var args = process.argv.slice(2);
if (args.length > 0)
    L = parseFloat(args[0]);
if (args.length > 1)
    N = parseInt(args[1]);

function launch(){
    var board = new simulation.UniformSquareBoard(L,1);
    var sim = new simulation.Simulation(board);
    var mins = {"x": 0, "y": 0};
    var maxs = {"x": 1, "y": 1};

    sim.alpha = alpha;
    sim.mu = 1;
    sim.static_type = [simulation.S2Z, simulation.Z2R];
    sim.motion_type = [simulation.S2Z, simulation.Z2R];
    sim.addZombieSeed(0, 0, simulation.S2Z);

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
        sites = sim.dostep();
    }
    var l = Math.max((maxs.x-mins.x), (maxs.y-mins.y));
    all.push([alpha, L, l, sim.Z, sim.R]);
}

function dowrite(){
    var filename = "/media/scratch/zombies/dat-alpha-scan-"+L+".json";
    fs.writeFileSync(filename, JSON.stringify(all));
}

for (var a=0.47; a>=0.42; a-=0.002){
    alpha = a;
    console.log("alpha = "+alpha);
    for (var i=0; i<N; i++){
        launch();
    
        if (i % 100 == 0) console.log("At "+i);
    }
    dowrite();
}

dowrite();
