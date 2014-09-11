var savexpm = require("../js/savexpm.js");
var binaryheap = require("../js/binaryheap.js");
var simulation = require("../js/simulation.js");

var fs = require('fs');

var args = process.argv.slice(2);
if (args.length > 0)
    goal = parseInt(args[0]);

var alpha = 0.441;
var filename = "cluster-pic.xpm";

var board = new simulation.InfiniteBoard(1);
var sim = new simulation.Simulation(board);

sim.alpha = alpha;
sim.mu = 1;
sim.static_type = [simulation.S2Z, simulation.Z2R];
sim.motion_type = [simulation.S2Z, simulation.Z2R];
sim.addZombieSeed(0, 0, simulation.S2Z);

while (sim.dostep()) {}

fs.writeFileSync(filename, savexpm.xpm(sim.sites));
