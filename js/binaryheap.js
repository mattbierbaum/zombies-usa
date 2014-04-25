// from: http://eloquentjavascript.net/appendix2.html

function BinaryHeap(scoreFunction, locfunc){
    this.heap= [];
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
        if (!(this.score(element) < 1/0))
            return;
        this.heap.push(element);
        this.loc[this.locfunc(element)] = this.last();
        this.upHeap(this.last());
    },

    pop: function() {
        this.swap(0, this.last());
        var result = this.delete_end();

        this.downHeap(0);
        return result;
    },

    remove: function(node) {
        var hs = this.locfunc(node);
        if (!this.loc[hs])
            return;
        var ind = this.loc[hs];
        this.swap(ind, this.last());
        this.delete_end();
        this.upHeap(ind);
        this.downHeap(ind);
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
        while (true){
            if (n > 0){
                var up = (n-1)>>1;
                var score0 = this.score(this.heap[n]);
                var score1 = this.score(this.heap[up]);
                if (score0 < score1) {
                    this.swap(n, up);
                    n = up;
                } else break;
            } else break;
        }
    },

    downHeap: function(n) {
        var size = this.size();
        while(true) {
            var swp = null;
            var child1 = 2*n+1;
            var child2 = child1+1;
 
            var score0 = this.score(heap[n]);
            if (child1 < size){
                var score1 = this.score(heap[child1]);
                if (score1 < score0)
                    swp = child1;
            }

            if (child2 < size){
                var score2 = this.score(heap[child2]);
                if (score2 < (swp == null ? score0 : score1))
                    swp = child2;
            }

            if (swp == null) break;
            this.swap(n, swp);
       }
    },
};
