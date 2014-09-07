var S2Z = "B";
var Z2R = "K";
var I2R = "R";
var MOV = "M";

function inc_z(s) {
    s.Z = s.Z + 1;
    s.N = s.N + 1;
}
function dec_z(s) {
    s.Z = s.Z - 1;
    s.N = s.N - 1;
}
function bite(s){
    s.S = s.S - 1; s.Z = s.Z + 1;
}
function kill(s){
    s.Z = s.Z - 1; s.R = s.R + 1;
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
        sites = [];
        for (var i=Math.max(x-1, 0); i<=Math.min(x+1, this.xmax-1); i+=2)
            sites.push({'x': i, 'y': y});
        for (var j=Math.max(y-1, 0); j<=Math.min(y+1, this.ymax-1); j+=2)
            sites.push({'x': x, 'y': j});
        return sites;
    }
}

function SquareBoard(dat){
    this.dat = dat;
    this.ymax = dat.length;
    this.xmax = dat[0].length;
}

Number.prototype.mod = function(n) {
      return ((this%n)+n)%n;
};

SquareBoard.prototype = {
    pop: function (x,y) {
        return Math.floor(this.dat[y][x]);
    },
    neigh: function (x,y) {
        sites = [];
        sites.push({'x': (x-1).mod(this.xmax), 'y': y});
        sites.push({'x': (x+1).mod(this.xmax), 'y': y});
        sites.push({'x': x, 'y': (y-1).mod(this.ymax)});
        sites.push({'x': x, 'y': (y+1).mod(this.ymax)});
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
    this.alpha = 1;
    this.mu = 1;
    this.time = 0;
    this.sites = {};
    this.bonds = {};
    this.static_types = [S2Z, Z2R];
    this.motion_types = [S2Z, Z2R];
    this.heap = new BinaryHeap(tauGetter, hashGetter);
    this.board = board;
}

Simulation.prototype = {
    // returns a site given x,y
    get_site: function (x,y) {
        var site = new Site(x, y, this.board.pop(x,y));
        if (this.sites[site.hash])
            return this.sites[site.hash];
        this.sites[site.hash] = site;
        return this.sites[site.hash];
    },

    // returns a bond in the priority queue, or makes one
    get_bond: function (s0, s1, type){
        var bond = new Bond(s0, s1, type);
        if (this.bonds[bond.hash])
            return this.bonds[bond.hash];
        this.bonds[bond.hash] = bond;
        return this.bonds[bond.hash];
    },

    update_bond: function (bond) {
        var weight = 0;
        if (bond.type == S2Z){
            weight = this.sites[bond.s0].S * this.sites[bond.s1].Z;
            weight *= (bond.s0 == bond.s1) ? 1 : this.mu;
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
        s0 = this.get_site(x,y);
        if (s0.N <= 0 || s0.Z > 0) return 0;

        if (type == S2Z) bite(s0);
        if (type == MOV) inc_z(s0);

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

    dostep: function() {
       // Get the next interaction
        var bond = this.heap.pop();
        if (!bond) return;

        // Update the time
        this.time = bond.tau;
        var site = this.sites[bond.s0];
        var site2 = this.sites[bond.s1];
        if (bond.type == S2Z){
            if (site.Z == 0)
                this.addZombieSeed(site.x, site.y, bond.type);
            else
                bite(site);
        }
        if (bond.type == Z2R)
            kill(site);
        if (bond.type == I2R)
            kill(site);
        if (bond.type == MOV){
            if (site2.Z == 0){
                dec_z(site);
                if (!this.addZombieSeed(site2.x, site2.y, bond.type))
                    inc_z(site);
            }
            else
                move(site, site2);
        }

        for (b in site.bonds)
            this.update_bond(this.bonds[b]);

        if (bond.type == MOV) {
          for (b in site2.bonds)
              this.update_bond(this.bonds[b]);
        }

        if (bond.type == MOV)
            return [site, site2];
        return [site];
    },
}
