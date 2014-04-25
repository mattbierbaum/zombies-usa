var s2z = "B";
var z2r = "K";

function inc_z(s){
    var diff = (s.S == 0 || s.Z == s.N)?0:1;
    s.S = s.S - diff; s.Z = s.Z + diff;
}
function inc_r(s){
    var diff = (s.Z == 0 || s.R == s.N)?0:1;
    s.Z = s.Z - diff; s.R = s.R + diff;
}

function USAMapBoard(dat){
    this.dat = dat;
    this.ymax = dat.length;
    this.xmax = dat[0].length;
}

USAMapBoard.prototype = {
    pop: function (x,y) {
        return Math.floor(Math.pow(this.dat[y][x], 0.25) + 1*(this.dat[y][x] > 0));
    },

    neigh: function (x,y) {
        sites = [];
        for (var i=Math.max(x-1, 0); i<=Math.min(x+1, this.xmax-1); i+=2)
            sites.push({'x': i, 'y': y});
        for (var j=Math.max(y-1, 0); j<=Math.min(y+1, this.ymax-1); j+=2)
            sites.push({'x': x, 'y': j});
        return sites;
    }
}

function tauGetter(bond){ return bond.tau; }
function hashGetter(bond){ return bond.hash; }
function Bond(s0, s1, type){
    // these are locations as hashes
    this.s0 = s0.hash;
    this.s1 = s1.hash;
    this.type = type;

    //calculate this here
    this.tau = 0;
    this.hash = hashbond(this);
}

function Site(x, y, N){
    this.x = x;
    this.y = y;

    this.N = N;
    this.S = N;
    this.Z = 0;
    this.R = 0;

    // dictionary of hashes for easy membership tests
    this.bonds = {};
    this.hash = hashsite(this);
}

function hashsite(s){ return s.x+","+s.y; }
function hashbond(b){ return b.type+"|"+(b.s0+":"+b.s1); }

function Simulation(board){
    this.alpha = 1.2;
    this.time = 0;
    this.sites = {};
    this.bonds = {};
    this.heap = new BinaryHeap(tauGetter, hashGetter);
    this.board = board;
}

Simulation.prototype = {
    get_site: function (x,y) {
        var site = new Site(x, y, this.board.pop(x,y));
        if (this.sites[site.hash])
            return this.sites[site.hash];
        this.sites[site.hash] = site;
        return site;
    },

    get_bond: function (s0, s1, type){
        var bond = new Bond(s0, s1, type);
        if (this.bonds[bond.hash])
            return this.bonds[bond.hash];
        this.bonds[bond.hash] = bond;
        return bond;
    },

    update_bond: function (bond) {
        var weight = (bond.type == s2z) ? this.alpha : 1;
        weight *= this.sites[bond.s0].S * this.sites[bond.s1].Z;
        var nextt = -Math.log(Math.random()) / weight;
        bond.tau = nextt;

        this.heap.remove(bond);
        this.heap.push(bond);
    },

    push_bond: function (s0, s1, type){
        var b = this.get_bond(s0, s1, type);
        s0.bonds[b.hash] = 1;
        s1.bonds[b.hash] = 1;
        this.update_bond(b);
    },

    addZombieSeed: function (x, y){
        s0 = this.get_site(x,y);
        if (s0.N <= 0) return;
        inc_z(s0);

        var neighs = this.board.neigh(x,y);
        var lneighs = neighs.length;

        for (var i=0; i<lneighs; i++){
            var temp = neighs[i];
            var st = this.get_site(temp.x, temp.y);

            this.push_bond(s0, st, s2z);
            this.push_bond(s0, st, z2r);
            this.push_bond(st, s0, s2z);
            this.push_bond(st, s0, z2r);
        }
        this.push_bond(s0, s0, s2z);
        this.push_bond(s0, s0, z2r);
    },

    dostep: function() {
        var bond = this.heap.pop();
        if (!bond) return;

        this.time += bond.tau;
        var site = this.sites[bond.s0];
        if (bond.type == s2z){
            if (site.Z == 0)
                this.addZombieSeed(site.x, site.y);
            else
                inc_z(site);
        }
        if (bond.type == z2r) inc_r(site);

        for (b in site.bonds)
            this.update_bond(this.bonds[b]);

        return site;
    },
}
