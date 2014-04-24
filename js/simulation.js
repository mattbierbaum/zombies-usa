var s2z = "Z";
var z2r = "R";

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
        return this.dat[y][x];
    },

    neigh: function (x,y) {
        sites = [];
        for (var i=Math.max(x-1, 0); i<=Math.min(x+1, this.xmax-1); i++)
            sites.push({'x': i, 'y': y});
        for (var j=Math.max(y-1, 0); j<=Math.min(y+1, this.ymax-1); j++)
            sites.push({'x': x, 'y': j});
        return sites;
    }
}

function tauGetter(bond){ return bond.tau; }
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

function hashpos(x,y){ return x+","+y; }
function hashsite(s){ return hashpos(s.x, s.y); }
function hashbond(b){ 
    var h0 = b.s0; var h1 = b.s1; 
    return b.type+"|"+((h0<h1)?(h0+":"+h1):(h1+":"+h0));
}

function Simulation(board){
    this.sites = {};
    this.bonds = {};
    this.heap = new BinaryHeap(tauGetter);
    this.board = board;
}

Simulation.prototype = {
    init: function (zombies) {
        var ln = zombies.length;
        for (var i=0; i<ln; i++){
            addZombieSeed(zombies[i]);            
        }
    },

    get_sitexy: function (x,y) {
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
        
    },

    addZombieSeed: function (zombie){
        var x = zombie.x;
        var y = zombie.y;
        var N = this.board.pop(x,y);
        if (N <= 0) return;

        s0 = this.get_sitexy(x,y);
        inc_z(s0);

        var neighs = this.board.neigh(x,y);
        var lneighs = neighs.length;

        for (var i=0; i<lneighs; i++){
            var temp = neighs[i];
            var st = this.get_sitexy(temp.x, temp.y);

            var bz = this.get_bond(s0, st, s2z);
            s0.bonds[bz.hash] = 1;
            st.bonds[bz.hash] = 1;
            this.update_bond(bz);

            var br = this.get_bond(s0, st, z2r);
            s0.bonds[br.hash] = 1;
            st.bonds[br.hash] = 1;
            this.update_bond(br);
        }
    }
}
