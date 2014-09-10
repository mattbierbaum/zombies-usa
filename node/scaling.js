var fs = require('fs');

var alpha = 0.500;
var worker = new Array(4);
var graph;

var ymax = 0;
var nbins = 30;
var xmax = 1e5;
var range = {'x0': 1, 'x1': xmax, 'step': xmax/nbins};

var all = new Array();
var bins = new Array(nbins);
for (var i=0; i<nbins; i++) bins[i] = [range['x0']+(i+1)*range['step']/2, 0e-1];

function init_graph(){
    graph = new LineGraph("#graph", 800, 400, true);
    graph.add_line(bins, 'black', 'alpha');
    graph.xlim(bins[0][0], range['x1']);
}

function launch(i){
    worker[i] = new Worker("js/worker-sim.js?v=0");
    worker[i].postMessage({"cmd": "run", "alpha": alpha, "mu": 1, "szr": true});
    worker[i].onmessage = function warp(id){
        return function(e) {
            if (e.data['cmd'] == 'report'){
                var n = e.data['N'];
                var l = e.data['L'];
                var ind = Math.floor(n / range['step']);
                bins[ind][1] += 1;

                console.log(id+": "+l+", "+n);
                all.push([l,n]);            
                if (bins[ind][1] > ymax) ymax = bins[ind][1];

                graph.update();
                graph.ylim(1, 2*ymax);
                launch(id);
            }
        }
    }(i);
}

function save(){
    csv == "# N, count\n";
    for (var i=0; i<bins.length; i++){
        csv += bins[i][0]+", "+bins[i][1]+"\n";
    }
    var out = fs.createWriteStream(fileName, { encoding: "utf8" });
    out.write(csv);
    out.end();
}

init_graph();
launch(0);
launch(1);
