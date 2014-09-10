(function(exports){
"use strict";

function score_int(a) { return a; }
function score_loc(a) { return a; }

function BinaryHeap(scoreFunction, locfunc){
    this.heap = [];
    this.loc = {};
    this.score = scoreFunction;
    this.locfunc = locfunc;
}

BinaryHeap.prototype = {
    swap: function(i, j) {
        var elmi = this.heap[i];
        var elmj = this.heap[j];

        this.loc[this.locfunc(elmi)] = j;
        this.loc[this.locfunc(elmj)] = i;

        this.heap[i] = elmj;
        this.heap[j] = elmi;
    },

    push: function(element) {
        this.heap.push(element);
        this.loc[this.locfunc(element)] = this.last();
        this.upHeap(this.last());
    },

    pop: function() {
        if (this.size() == 0) return;

        if (this.size() == 1)
            return this.delete_end();

        this.swap(0, this.last());
        var result = this.delete_end();

        this.downHeap(0);
        return result;
    },

    remove: function(node) {
        var hs = this.locfunc(node);
        if (this.loc[hs] == undefined) return;
        var ind = this.loc[hs];

        if (ind != this.last()){
            this.swap(ind, this.last());
            this.delete_end();
            if (!this.upHeap(ind))
                this.downHeap(ind);
        } else {
            this.delete_end();
        }
    },

    delete_end: function(){
        var result = this.heap.pop();
        delete this.loc[this.locfunc(result)];
        return result;
    },

    size: function() {
        return this.heap.length;
    },

    last: function() {
        return this.size() - 1;
    },

    upHeap: function(n) {
        var did = false;
        while (true){
            var score = this.score(this.heap[n]);
            if (n > 0){
                var up = Math.floor((n + 1) / 2) - 1;
                var score1 = this.score(this.heap[up]);
                if (score > score1)
                    break;
                this.swap(n, up);
                n = up;
                did = true;
            } else break;
        }
        return did;
    },

    downHeap: function(n) {
        var size = this.size();
        while(true) {
            var swp = null;
            var child1 = 2*n+1;
            var child2 = child1+1;
 
            var score0 = this.score(this.heap[n]);
            if (child1 < size){
                var score1 = this.score(this.heap[child1]);
                if (score1 < score0) swp = child1;
            }

            if (child2 < size){
                var score2 = this.score(this.heap[child2]);
                var cmp = (swp == null) ? score0 : score1;
                if (score2 < cmp) swp = child2;
            }

            if (swp == null) break;
            this.swap(n, swp);
            n = swp;
       }
    },
};

exports.BinaryHeap = BinaryHeap;
}(typeof exports === 'undefined' ? this.binaryheap = {} : exports));
