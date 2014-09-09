function LineGraph(elem, width, height, dolog){
    this.width = width;
    this.height = height;
    this.elem = elem;

    this.svg = d3.select(elem)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate("+60+","+0+")");

    if (dolog){
        this.xs = d3.scale.log()
            .domain([0.01, 1])
            .range([0, width-60]);
        this.ys = d3.scale.log()
            .domain([0.01, 1])
            .range([height-20, 0]);
    } else {
        this.xs = d3.scale.linear()
            .domain([0, 1])
            .range([0, width-60]);
        this.ys = d3.scale.linear()
            .domain([0, 1])
            .range([height-20, 0]);
    }

    this.lines = [];
    this.paths = [];

    this.svg.append("defs").append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", this.width)
        .attr("height", this.height);

    this.xaxis = d3.svg.axis().scale(this.xs).orient('bottom');
    this.yaxis = d3.svg.axis().scale(this.ys).orient('left');

    this.svg.append("g")
        .attr('id', 'xAxis')
        //.attr('font-family', 'Sans')
        .attr('fill', 'none')
        .attr('stroke', 'black')
        .attr('shape-rendering', 'crispEdges')
        .attr("transform", "translate(0,"+this.ys(0)+")")
        .call(this.xaxis);

    this.svg.append("g")
        .attr('id', 'yAxis')
        .attr('fill', 'none')
        .attr('stroke', 'black')
        .attr('shape-rendering', 'crispEdges')
        .call(this.yaxis);

    this.line = d3.svg.line()
        .x(function (g) {
            return function(d) {return g.xs(d[0]); }
          }(this))
        .y(function (g) {
            return function(d) {return g.ys(d[1]); } 
          }(this))
        .interpolate('step-after');
}

LineGraph.prototype = {
    add_line: function(data, color, id){
        var tpath = this.svg.append("g")
            .attr("clip-path", "url(#clip)")
            .append("path")
            .datum(data)
            .attr("id", id)
            .attr("fill", "none")
            .attr("stroke", color)
            .attr("stroke-width", '1.2px')
            .attr("d", this.line);

        this.paths.push(id);
    },

    xlim: function(x0, x1){
        function wrap(g){
            return function makeXAxis(s) {
                s.call(d3.svg.axis()
                    .scale(g.xs)
                    .orient("bottom"));
            }
        }

        this.xs.domain([x0, x1]);
        d3.select('#xAxis')
            .call(wrap(this));
    },

    ylim: function(y0, y1){
        function wrap(g){
            return function makeYAxis(s) {
                s.call(d3.svg.axis()
                    .scale(g.ys)
                    .orient("left"));
            }
        }

        this.ys.domain([y0, y1]);
        d3.select('#yAxis')
            .call(wrap(this));
    },

    update: function(){
        for (var i=0; i<this.paths.length; i++){
            d3.select("#"+this.paths[i])
                .attr("transform", null)
                .transition()
                .duration(10)
                .ease('linear')
                .attr('d', this.line);
        }
    }
}
