function InfiniGraph(elem){
    this.width = document.getElementById(elem).offsetWidth;
    this.height = document.getElementById(elem).offsetHeight;

    this.svg = d3.select("#"+elem)
        .append("svg")
        .attr("width", this.width)
        .attr("height", this.height);

    this.create_scale();
}

InfiniGraph.prototype = {
    create_scale: function(){
        this.bx = 16;
        this.by = this.bx;
        this.xscale = d3.scale.linear().domain([-this.bx/2, this.bx/2]).range([0, this.width]);
        this.yscale = d3.scale.linear().domain([-this.by/2, this.by/2]).range([this.height, 0]);
    },

    update_sites: function(sites){
        var sl = sites.length;
        for (var c=0; c<sl; c++){
            var site = sites[c];
            if (site.x < this.mins.x) this.mins.x = site.x;
            if (site.y < this.mins.y) this.mins.y = site.y;
            if (site.x > this.maxs.x) this.maxs.x = site.x;
            if (site.y > this.maxs.y) this.maxs.y = site.y;

            if (!this.svg.select(site.hash).empty()){
                this.svg.select("#"+site.hash).datum(site)
                    .attr("fill", fillfunc)
                    .attr("id", function(d) {return d.hash})
                    .attr("x", function wrap(g){
                        return function(d) {return g.xscale(d.x)};
                    }(this))
                    .attr("y", function wrap(g){
                        return function(d) {return g.yscale(d.y)};
                    }(this))
                    .attr("width", this.xscale(1)-this.xscale(0))
                    .attr("height", this.yscale(0)-this.yscale(1));
            } else {
                this.svg.append('rect').datum(site)
                    .attr("fill", this.fillfunc)
                    //.attr("stroke","black")
                    //.attr("stroke-width", xscale(0.01)-xscale(0))
                    .attr("id", function(d) {return d.hash})
                    .attr("x", function wrap(g){
                        return function(d) {return g.xscale(d.x)};
                    }(this))
                    .attr("y", function wrap(g){
                        return function(d) {return g.yscale(d.y)};
                    }(this))
                    .attr("width", this.xscale(1)-this.xscale(0))
                    .attr("height", this.yscale(0)-this.yscale(1))
            }
        }

        var zoom = false;
        if (this.mins.x <= -this.bx/2) { this.bx = 3*Math.abs(this.mins.x); this.by = this.bx; zoom = true;}
        if (this.mins.y <= -this.by/2) { this.by = 3*Math.abs(this.mins.y); this.bx = this.by; zoom = true;}
        if (this.maxs.x >=  this.bx/2) { this.bx = 3*Math.abs(this.maxs.x); this.by = this.bx; zoom = true;}
        if (this.maxs.y >=  this.by/2) { this.by = 3*Math.abs(this.maxs.y); this.bx = this.by; zoom = true;}

        if (zoom == true){
            this.xscale = d3.scale.linear().domain([-this.bx/2, this.bx/2]).range([0, this.width]);
            this.yscale = d3.scale.linear().domain([-this.by/2, this.by/2]).range([this.height, 0]);

            this.svg.selectAll('rect')
                //.transition()
                //.attr("stroke-width", xscale(0.01)-xscale(0))
                .attr("x", function wrap(g){
                    return function(d) {return g.xscale(d.x)};
                }(this))
                .attr("y", function wrap(g){
                    return function(d) {return g.yscale(d.y)};
                }(this))
                .attr("width", this.xscale(1)-this.xscale(0))
                .attr("height", this.yscale(0)-this.yscale(1))
        }
    },

    reset_display: function(){
        this.mins = {x: 0, y: 0};
        this.maxs = {x: 0, y: 0};

        this.svg.selectAll('rect').remove();
        this.create_scale();
    },

    fillfunc: function(d) {
        if (d.S > 0) return d3.rgb( 255, 255, 255);
        if (d.Z > 0) return d3.rgb( 255, 0, 0);
        if (d.R > 0) return d3.rgb( 0, 0, 0);
    },
};
