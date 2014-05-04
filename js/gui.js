function GUI(elem) {
    this.mapHmax = 900;
    this.mapWmax = 1500;
    this.mapH = this.mapHmax;
    this.mapW = this.mapWmax;
    this.elem = elem;

    this.W;
    this.H;
    this.map;
    this.mapcopy;
    this.overlay;
    this.uielem = [];
    this.fps = 0;
}

GUI.prototype = {
    bind: function(fnMethod){
        var obj = this;
             
        return (function(){
            return (fnMethod.apply(obj, arguments));
        });
    },

    init: function(){
        this.canvas = document.getElementById(this.elem);
        this.ctx = this.canvas.getContext('2d');
        this.ctx.mouse = { x: 0, y: 0, clicked: false, down: false };
        this.redraw = true;

        this.offscreen = document.createElement('canvas');
        this.offscreen.id = "offscreen_canvas";
        this.offscreen.width = this.mapWmax;
        this.offscreen.height = this.mapHmax;
        this.offscreen.style.zIndex = 8;
        this.offscreen.style.display = 'none';
        document.body.appendChild(this.offscreen);

        this.ctxoff = this.offscreen.getContext('2d');

        // add even listeners for the mouse
        this.canvas.addEventListener("mousemove", this.bind(
            function(e) {
                this.ctx.mouse.x = e.offsetX;
                this.ctx.mouse.y = e.offsetY;
                this.ctx.mouse.clicked = (e.which == 1 && !this.ctx.mouse.down);
                this.ctx.mouse.down = (e.which == 1);
            }
        ));

        this.canvas.addEventListener("mousedown", this.bind(
            function(e) {
                this.ctx.mouse.clicked = !this.ctx.mouse.down;
                this.ctx.mouse.down = true;
            }
        ));

        this.canvas.addEventListener("mouseup", this.bind(
            function(e) {
                this.ctx.mouse.down = false;
                this.ctx.mouse.clicked = false;
            }
        ));

        window.onresize = this.bind(
            function(event) {this.set_canvas_size(); }
        );

        this.set_canvas_size();

        //var alertButton = new Button("Alert", 150, 50, 100, 30);
        //var slider = new Slider("A quantity", 150, 80, 100, 0, 30);
        //var check2 = new CheckBox("Show graph", 20, 40);
        var check1 = new CheckBox("Show controls", 20, 20);
        this.uielem.push(check1);

        this.map = new Image();
        this.map.onload = (this.bind(
            function() {
                this.ctxoff.drawImage(this.map, 0, 0 );
                this.mapcopy = this.ctxoff.getImageData(0, 0, this.map.width, this.map.height);
                this.overlay = this.ctxoff.getImageData(0, 0, this.map.width, this.map.height);
                this.draw_map();
                this.draw();
            }));
        this.map.src = 'dat/js-usa.png';
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

    draw_overlay: function(){
        this.ctxoff.putImageData(this.overlay, 0, 0);
        this.ctx.drawImage(this.offscreen, 0, 0, this.mapWmax, this.mapHmax,
                (this.W-this.mapW)/2, (this.H-this.mapH)/2, this.mapW, this.mapH);
    },

    draw_map: function() {
        this.ctx.drawImage(this.map, 0, 0, this.mapWmax, this.mapHmax,
                (this.W-this.mapW)/2, (this.H-this.mapH)/2, this.mapW, this.mapH);
    },

    draw_timing: function(sim){
        if (sim){
            this.ctx.font = '24px sans-serif';
            this.ctx.fillStyle='rgba(255,255,255,0.8)';
            this.ctx.fillText(toFixed(sim.time*2,4) + " hours", 20, 50);
            this.ctx.fillText(toFixed(fps,4), 20, 80);
        }
    },

    draw: function() {
        if (this.redraw){
            if (this.ctx.mouse.down){
                var x = this.ctx.mouse.x;
                var y = this.ctx.mouse.y;
                x = Math.floor((x - (this.W-this.mapW)/2)*this.mapWmax/this.mapW);
                y = Math.floor(900 - (y - (this.H-this.mapH)/2)*this.mapHmax/this.mapH);
                if (x > 0 && x < this.mapWmax && y > 0 && y < this.mapHmax)
                    this.clicked = {'x':x, 'y':y};
            }
            else
                this.clicked = null;

            this.clear();
            this.update_ui();

            this.draw_map();
            this.draw_overlay();
            this.draw_ui();

            registerAnimationRequest(this.bind(function(){this.draw()}));
        }
    },
    
    update_ui: function(){
        for (var i=0; i<this.uielem.length; i++)
            this.uielem[i].update(this.ctx);
    },
    
    draw_ui: function(){
        for (var i=0; i<this.uielem.length; i++)
            this.uielem[i].draw(this.ctx);
    },

    modify_site: function(site){
        var i = site.x;
        var j = this.mapHmax-site.y;
        var ind = 4*(i+j*this.map.width);
        //console.log(this.mapcopy.data[ind]);
        //console.log(Math.floor(this.mapcopy.data[ind]*(site.N-site.R)/site.N));
        this.overlay.data[ind+0] = Math.floor(this.mapcopy.data[ind]*(site.N-site.R)/site.N);
        this.overlay.data[ind+1] = 0;
        this.overlay.data[ind+2] = 0;
        this.overlay.data[ind+3] = Math.floor(255*site.Z/site.N*100);
    },
}

// Provides requestAnimationFrame in a cross browser way.
// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
window.registerAnimationRequest = window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||  window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame || function(callback) { window.setTimeout( callback, 16 ); };

