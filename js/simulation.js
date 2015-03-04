(function(exports){
"use strict";

var isNode = typeof global !== "undefined" &&
        {}.toString.call(global) == '[object global]';

if (isNode)
    var localbinaryheap = require("./binaryheap.js");
else
    var localbinaryheap = binaryheap;

var S2E = "B";
var E2Z = "C";
var Z2R = "K";
var I2R = "R";
var MOV = "M";

function inc_z(s, sim) {
    s.Z = s.Z + 1;
    s.N = s.N + 1;
    sim.Z += 1;
    sim.N += 1;
}
function dec_z(s, sim) {
    s.Z = s.Z - 1;
    s.N = s.N - 1;
    sim.Z -= 1;
    sim.N -= 1;
}
function inc_e(s, sim) {
    s.E = s.E + 1;
    s.S = s.S - 1;
    sim.S -= 1;
    sim.E += 1;
}
function bite(s, sim){
    s.S = s.S - 1; s.E = s.E + 1;
    sim.S -= 1; sim.E += 1;
}
function convert(s, sim){
    s.E = s.E - 1; s.Z = s.Z + 1;
    sim.E -= 1; sim.Z += 1;
}
function kill(s, sim){
    s.Z = s.Z - 1; s.R = s.R + 1;
    sim.Z -= 1; sim.R += 1;
}
function move(s0, s1) {
    s0.Z = s0.Z - 1;
    s0.N = s0.N - 1;
    s1.Z = s1.Z + 1;
    s1.N = s1.N + 1;
}

function USAMapBoard(dat){
    this.dat = dat;
    this.ymax = dat.length;
    this.xmax = dat[0].length;
}

USAMapBoard.prototype = {
    pop: function (x,y) {
        return Math.floor(Math.pow(this.dat[y][x], 0.5) + 1*(this.dat[y][x] > 0));
    },

    neigh: function (x,y) {
        var sites = [];
        for (var i=Math.max(x-1, 0); i<=Math.min(x+1, this.xmax-1); i+=2)
            sites.push({'x': i, 'y': y});
        for (var j=Math.max(y-1, 0); j<=Math.min(y+1, this.ymax-1); j+=2)
            sites.push({'x': x, 'y': j});
        return sites;
    },

    get_total: function(){
        var tot = 0;
        for (var i=0; i<this.ymax; i++){
            for (var j=0; j<this.xmax; j++){
                tot += this.pop(j, i);
            }
        }
        return tot;
    }
}

Number.prototype.mod = function(n) {
      return ((this%n)+n)%n;
};

function UniformSquareBoard(L, n){
    this.n = n;
    this.ymax = L;
    this.xmax = L;
}

UniformSquareBoard.prototype = {
    pop: function (x,y) {
        return this.n;
    },
    neigh: function (x,y) {
        var sites = [];
        sites.push({'x': (x-1).mod(this.xmax), 'y': y});
        sites.push({'x': (x+1).mod(this.xmax), 'y': y});
        sites.push({'x': x, 'y': (y-1).mod(this.ymax)});
        sites.push({'x': x, 'y': (y+1).mod(this.ymax)});
        return sites;
    },
    get_total: function(){
        return this.xmax*this.ymax*this.n;
    }
}

function SquareBoard(dat){
    this.dat = dat;
    this.ymax = dat.length;
    this.xmax = dat[0].length;
}

SquareBoard.prototype = {
    pop: function (x,y) {
        return Math.floor(this.dat[y][x]);
    },
    neigh: function (x,y) {
        var sites = [];
        sites.push({'x': (x-1).mod(this.xmax), 'y': y});
        sites.push({'x': (x+1).mod(this.xmax), 'y': y});
        sites.push({'x': x, 'y': (y-1).mod(this.ymax)});
        sites.push({'x': x, 'y': (y+1).mod(this.ymax)});
        return sites;
    },
    get_total: function(){
        var tot = 0;
        for (var i=0; i<this.ymax; i++){
            for (var j=0; j<this.xmax; j++){
                tot += this.pop(j, i);
            }
        }
        return tot;
    }
}

function InfiniteBoard(n){
    this.n = n;
}

InfiniteBoard.prototype = {
    pop: function (x,y) {
        return this.n;
    },
    neigh: function (x,y) {
        var sites = [];
        sites.push({'x': x-1, 'y': y});
        sites.push({'x': x+1, 'y': y});
        sites.push({'x': x, 'y': y-1});
        sites.push({'x': x, 'y': y+1});
        return sites;
    },
    get_total: function(){
        return 0;
    }
}

function tauGetter(bond){ return bond.tau; }
function hashGetter(bond){ return bond.hash; }
function Bond(s0, s1, type, h){
    // these are locations as hashes
    this.s0 = s0.hash;
    this.s1 = s1.hash;
    this.type = type;
    this.tau = 0;
    this.hash = h;
}

function Site(x, y, N, h){
    this.x = x;
    this.y = y;

    this.N = N;
    this.S = N;
    this.E = 0;
    this.Z = 0;
    this.R = 0;

    // dictionary of hashes for easy membership tests
    this.bonds = {};
    this.hash = h;
}

function Simulation(board){
    this.alpha = 1;
    this.mu = 1;
    this.eta = 2;
    this.beta = 1;
    this.Nfact = 1;
    this.time = 0;
    this.sites = {};
    this.bonds = {};
    this.static_types = [S2E, E2Z, Z2R];
    this.motion_types = [S2E, Z2R];
    this.heap = new localbinaryheap.BinaryHeap(tauGetter, hashGetter);
    this.board = board;

    var tot = board.get_total();
    this.S = tot; this.N = tot;
    this.E = 0; this.Z = 0; this.R = 0;
    this.lh = '';
}

Simulation.prototype = {
    chs: function(x,y){
        this.lh = "s"+x+"_"+y;
    },
    chb: function(t,s0,s1){
        this.lh = "b"+t+"|"+s0.x+"_"+s0.y+":"+s1.x+"_"+s1.y;
    },

    // returns a site given x,y
    get_site: function (x,y) {
        this.chs(x,y);

        if (this.sites[this.lh])
            return this.sites[this.lh];

        var site = new Site(x, y, this.board.pop(x,y), this.lh);
        this.sites[site.hash] = site;
        return this.sites[site.hash];
    },

    // returns a bond in the priority queue, or makes one
    get_bond: function (s0, s1, type){
        this.chb(type, s0, s1);

        if (this.bonds[this.lh])
            return this.bonds[this.lh];

        var bond = new Bond(s0, s1, type, this.lh);
        this.bonds[bond.hash] = bond;
        return this.bonds[bond.hash];
    },

    update_bond: function (bond) {
        var weight = 0;
        if (bond.type == S2E){
            weight = this.sites[bond.s0].S * this.sites[bond.s1].Z;
            weight *= (bond.s0 == bond.s1) ? 1 : this.mu;
        }
        if (bond.type == E2Z){
            weight = this.eta * this.sites[bond.s0].E;
        }
        if (bond.type == Z2R){
            weight = this.alpha * this.sites[bond.s0].Z * this.sites[bond.s1].S;
            weight *= (bond.s0 == bond.s1) ? 1 : this.mu;
        }
        if (bond.type == I2R) weight = this.alpha * this.sites[bond.s0].Z;
        if (bond.type == MOV) weight = this.mu * this.sites[bond.s0].Z;
        var nextt = -Math.log(Math.random()) / weight + this.time;
        bond.tau = nextt;

        this.heap.remove(bond);

        if (weight > 0 && (bond.tau < 1/0) )
            this.heap.push(bond);
        else {
            var s0 = this.sites[bond.s0];
            var s1 = this.sites[bond.s1];
            delete s0.bonds[bond.hash];
            delete s1.bonds[bond.hash];
            delete this.bonds[bond.hash];
        }
    },

    push_bond: function (s0, s1, type){
        var b = this.get_bond(s0, s1, type);
        s0.bonds[b.hash] = 1;
        s1.bonds[b.hash] = 1;
        this.update_bond(b);
    },

    untouched: function(s){
      var neighs = this.board.neigh(s.x, s.y);
      var lneighs = neighs.length;

      for (var i=0; i<lneighs; i++){
          if (this.get_bond(s, neighs[i]))
            return false;
      }
      return true;
    },

    addZombieSeed: function (x, y, type){
        var s0 = this.get_site(x,y);
        if (s0.N <= 0 || s0.Z > 0) return 0;

        if (type == E2Z) convert(s0, this);
        if (type == MOV) inc_z(s0, this);

        var neighs = this.board.neigh(x,y);
        var lneighs = neighs.length;

        for (var i=0; i<lneighs; i++){
            var temp = neighs[i];
            var st = this.get_site(temp.x, temp.y);

            var ll = this.motion_types.length;
            for (var j=0; j<ll; j++) {
                var type = this.motion_types[j];
                this.push_bond(s0, st, type);
                this.push_bond(st, s0, type);
            }
        }

        var ll = this.static_types.length;
        for (var i=0; i<ll; i++) {
            var type = this.static_types[i];
            this.push_bond(s0, s0, type);
        }
        return 1
    },

    doBite: function (x, y, type){
        var s0 = this.get_site(x,y);
        if (s0.N <= 0 || s0.E > 0) return 0;

        if (type == S2E) inc_e(s0, this);
        this.push_bond(s0, s0, E2Z);
    },

    dostep: function() {
       // Get the next interaction
        var bond = this.heap.pop();
        if (!bond) return;

        // Update the time
        this.time = bond.tau;
        var site = this.sites[bond.s0];
        var site2 = this.sites[bond.s1];
        if (bond.type == S2E){
            if (site.E == 0)
                this.doBite(site.x, site.y, bond.type);
            else
                bite(site, this);
        }
        if (bond.type == E2Z){
            if (site.Z == 0)
                this.addZombieSeed(site.x, site.y, bond.type);
            else
                convert(site, this);
        }
        if (bond.type == Z2R)
            kill(site, this);
        if (bond.type == I2R)
            kill(site, this);
        if (bond.type == MOV){
            if (site2.Z == 0){
                dec_z(site, this);
                if (!this.addZombieSeed(site2.x, site2.y, bond.type))
                    inc_z(site, this);
            }
            else
                move(site, site2);
        }

        var bs = Object.keys(site.bonds);
        var bsl = bs.length;
        for (var i=0; i<bsl; i++)
            this.update_bond(this.bonds[bs[i]]);

        if (bond.type == MOV) {
            bs = Object.keys(site2.bonds);
            bsl = bs.length;
            for (var i=0; i<bsl; i++)
                this.update_bond(this.bonds[bs[i]]);
        }

        if (bond.type == MOV)
            return [site, site2];
        return [site];
    },
}

exports.S2E = S2E;
exports.E2Z = E2Z;
exports.Z2R = Z2R;
exports.I2R = I2R;
exports.MOV = MOV;
exports.USAMapBoard = USAMapBoard;
exports.InfiniteBoard = InfiniteBoard;
exports.SquareBoard = SquareBoard;
exports.UniformSquareBoard = UniformSquareBoard;
exports.Simulation = Simulation;

}(typeof exports === 'undefined' ? this.simulation = {} : exports));
