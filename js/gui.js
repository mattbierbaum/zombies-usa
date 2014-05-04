function GUI(elem) {
    this.mapHmax = 900;
    this.mapWmax = 1500;
    this.mapH = mapHmax;
    this.mapW = mapWmax;

    this.W,H;
    this.map;
    this.mapcopy;
    this.overlay;
    this.uielem = [];
    this.fps = 0;
}

GUI.prototype = {
    init: function(){
        this.canvas = document.getElementById(elem);
        this.ctx = this.canvas.getContext('2d');
        this.ctx.mouse = { x: 0, y: 0, clicked: false, down: false };
        this.ctx.redraw = true;

        this.canvas2 = document.createElement('canvas');
        this.canvas2.id = "offscreen_canvas";
        this.canvas2.width = this.mapHmax;
        this.canvas2.height = this.mapWmax;
        this.canvas2.style.zIndex = 8;
        this.canvas2.style.display = 'none';
        document.body.appendChild(this.canvas2);

        this.ctxoff = this.canvas2.getContext('2d');

        // add even listeners for the mouse
        this.canvas.addEventListener("mousemove", function(e) {
            this.ctx.mouse.x = e.offsetX;
            this.ctx.mouse.y = e.offsetY;
            this.ctx.mouse.clicked = (e.which == 1 && !this.ctx.mouse.down);
            this.ctx.mouse.down = (e.which == 1);
        });

        this.canvas.addEventListener("mousedown", function(e) {
            this.ctx.mouse.clicked = !this.ctx.mouse.down;
            this.ctx.mouse.down = true;
        });

        this.canvas.addEventListener("mouseup", function(e) {
            this.ctx.mouse.down = false;
            this.ctx.mouse.clicked = false;
        });

        window.onresize = function(event) {
            this.set_canvas_size();
        };

        this.set_canvas_size();
    },

    set_canvas_size: function(){
        this.W = window.innerWidth;
        this.H = window.innerHeight;
        this.canvas.width  = this.W;
        this.canvas.height = this.H;
        this.mapH = Math.floor(Math.min(this.H, this.mapHmax, 0.6*this.W));
        this.mapW = Math.floor(Math.min(this.W, this.mapWmax, this.mapH/0.6));
    },

    clear: function() {
        this.ctx.fillStyle = 'rgba(0,0,0,1)';
        this.ctx.clearRect(0, 0, this.W, this.H);
        this.ctx.fillRect(0, 0, this.W, this.H);
    },

    draw_maps: function() {
        this.ctxoff.putImageData(this.overlay, 0, 0);

        this.ctx.drawImage(this.map, 0, 0, this.mapWmax, this.mapHmax,
                (this.W-this.mapW)/2, (this.H-this.mapH)/2, this.mapW, this.mapH);
        this.ctx.drawImage(this.offscreen, 0, 0, this.mapWmax, this.mapHmax,
                (this.W-this.mapW)/2, (this.H-this.mapH)/2, this.mapW, this.mapH);
    },

    draw_timing: function(sim){
        if (sim){
            this.ctx.font = '24px sans-serif';
            this.ctx.fillStyle='rgba(255,255,255,0.8)';
            this.ctx.fillText(toFixed(sim.time*2,4) + " hours", 20, 50);
            this.ctx.fillText(toFixed(fps,4), 20, 80);
        }
    }

    draw: function() {
        if (this.ctx.redraw){
            if (sim){
                if (ctx.mouse.down){
                    var x = ctx.mouse.x;
                    var y = ctx.mouse.y;
                    x = Math.floor((x - (W-mapW)/2)*mapWmax/mapW);
                    y = Math.floor(900 - (y - (H-mapH)/2)*mapHmax/mapH);
                    if (x > 0 && x < mapWmax && y > 0 && y < mapHmax)
                        sim.addZombieSeed(x, y);
                }
            }
    
            this.clear();
            this.update_ui();
    
            this.draw_map();
            this.draw_ui();
    
        }
        requestAnimationFrame(draw, canvas);
    },
    
    update_ui: function(){
        _.each(this.uielem, function(obj) {
            obj.update(ctx);
        }, this);
    },
    
    draw_ui: function(){
        _.each(this.uielem, function(obj) {
            obj.draw(ctx);
        }, this);
    },

    modify_site: function(site){
        var i = site.x;
        var j = this.mapH-site.y;
        var ind = 4*(i+j*this.map.width);
        this.overlay.data[ind+0] = Math.floor(this.mapcopy.data[ind]*(site.N-site.R)/site.N);
        this.overlay.data[ind+1] = 0;
        this.overlay.data[ind+2] = 0;
        this.overlay.data[ind+3] = Math.floor(255*site.Z/site.N*100);
    },

    // Provides requestAnimationFrame in a cross browser way.
    // http://paulirish.com/2011/requestanimationframe-for-smart-animating/
    registerAnimationRequest: function() {
        if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = ( function() {
                return window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame || // comment out if FF4 is slow (it caps framerate at ~30fps)
                window.oRequestAnimationFrame ||
                window.msRequestAnimationFrame ||
                function( callback,  element ) {
                    window.setTimeout( callback, 32 );
                };
            } )();
        }
    }

}

window.onload = function () {

    //var alertButton = new Button("Alert", 150, 50, 100, 30);
    //var slider = new Slider("A quantity", 150, 80, 100, 0, 30);
    //var check2 = new CheckBox("Show graph", 20, 40);
    var check1 = new CheckBox("Show controls", 20, 20);
    uielem.push(check1);

    map = new Image();
    map.onload = function() {
        ctx.drawImage(map, 0, 0 );
        mapcopy = ctx.getImageData(0, 0, map.width, map.height);
        overlay = ctx.getImageData(0, 0, map.width, map.height);
        draw_map();
        registerAnimationRequest();
        requestAnimationFrame(draw, canvas);
    }
    map.src = 'dat/js-usa.png';

    loadGrid(function (dat) {
        var usboard = new USAMapBoard(dat);
        sim = new Simulation(usboard);
        sim.alpha = 1.4;
        sim.mu = 1./(75*sim.alpha);
    });
}







