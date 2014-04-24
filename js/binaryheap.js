// from: http://eloquentjavascript.net/appendix2.html

function BinaryHeap(scoreFunction){
    this.content = [];
    this.locations = {};
    this.scoreFunction = scoreFunction;
}

BinaryHeap.prototype = {
    push: function(element) {
        this.content.push(element);
        this.bubbleUp(this.content.length - 1);
    },

    pop: function() {
        var result = this.content[0];
        var end = this.content.pop();
        if (this.content.length > 0) {
            this.content[0] = end;
            this.sinkDown(0);
        }
        return result;
    },

    remove: function(node) {
        var length = this.content.length;
        for (var i = 0; i < length; i++) {
            if (this.content[i] != node) continue;
            var end = this.content.pop();
            if (i == length - 1) break;
            this.content[i] = end;
            this.bubbleUp(i);
            this.sinkDown(i);
            break;
        }
    },

    size: function() {
        return this.content.length;
    },

    bubbleUp: function(n) {
        var element = this.content[n], score = this.scoreFunction(element);
        while (n > 0) {
            var parentN = Math.floor((n + 1) / 2) - 1,
            parent = this.content[parentN];
            if (score >= this.scoreFunction(parent))
                break;

            this.content[parentN] = element;
            this.content[n] = parent;
            n = parentN;
        }
    },

    sinkDown: function(n) {
        var length = this.content.length,
        element = this.content[n],
        elemScore = this.scoreFunction(element);

        while(true) {
            var child2N = (n + 1) * 2, child1N = child2N - 1;
            var swap = null;
            if (child1N < length) {
                var child1 = this.content[child1N],
                child1Score = this.scoreFunction(child1);
                if (child1Score < elemScore)
                    swap = child1N;
            }

            if (child2N < length) {
                var child2 = this.content[child2N],
                child2Score = this.scoreFunction(child2);
                if (child2Score < (swap == null ? elemScore : child1Score))
                    swap = child2N;
            }

            if (swap == null) break;

            this.content[n] = this.content[swap];
            this.content[swap] = element;
            n = swap;
        }
    }
};
