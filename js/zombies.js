var helptext = "\
Welcome to Zombietown USA, a disease dynamics simulation of zombism across the USA. \
We use Gillespie dynamics on block-level census data from 2010 using 308 \
million people interacting across the continental US.\n\n\
Parameters:\n\n\
\u03B1 - kill to bite ratio\n\
\u03BC - time for zombie to walk 1 mile\n\n\
Controls:\n\n\
Click on the map to place a new zombie, and use the controls on the left to \
change parameters of the simulation. ";

var KEY_P = 80;
var KEY_Q = 81;
var z;

window.onload = function () {
    z= new ZombiesUI();
    z.init();
}

function ZombiesUI() {
    this.mapHmax = 900;
    this.mapWmax = 1500;
    this.mapH = this.mapHmax;
    this.mapW = this.mapWmax;
    this.elem = 'map';

    this.W;
    this.H;
    this.map;
    this.mapcopy;
    this.overlay;
    this.uielem = [];
    this.showcontrols = true;
    this.play = true;
    this.stepsper = 500;
    this.keys = {};
}

ZombiesUI.prototype = {
    bind: function(fnMethod){
        var obj = this;
        return (function(){return (fnMethod.apply(obj, arguments));});
    },

    init: function(){
        loadGrid('dat/js-grid.json', this.bind(function (dat) {
            this.usboard = new simulation.USAMapBoard(dat);
            this.sim = new simulation.Simulation(this.usboard);
            this.sim.alpha = 0.8;

            this.escapetime = 11; //hours to escape a cell
            this.sim.beta = 3.6e-3/2;
            this.sim.Nfact = 500;
            this.sim.mu = 1.0/(this.escapetime*this.sim.beta*this.sim.Nfact);

            this.init_gui();
        }));
    },

    init_gui: function(){
        this.canvas = document.getElementById(this.elem);
        this.ctx = this.canvas.getContext('2d');
        this.ctx.mouse = { x: 0, y: 0, clicked: false, down: false };

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
                var xpos = e.offsetX;
                var ypos = e.offsetY;
                if (xpos == undefined) {
                    xpos = e.pageX;
                    ypos = e.pageY;
                }
                this.ctx.mouse.x = xpos;
                this.ctx.mouse.y = ypos;
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

        document.body.addEventListener('keydown', this.bind(function(ev) {
            if (ev.keyCode == KEY_P) {
                ev.preventDefault();
                this.playpause();
            }
            if (ev.keyCode == KEY_Q) {
                ev.preventDefault();
                this.reset();
            }
        }), false);


        this.set_canvas_size();

        this.check_control = new CheckBox("Show controls", 15, 20);
        this.check_control.checked = this.showcontrols;
        this.check_control.handler = this.bind(function() {
            this.showcontrols = !this.showcontrols;

            for (var i=0; i<this.uielem.length; i++)
                this.uielem[i].hidden = !this.showcontrols;
        });

        var left = 2;
        var sleft = left+40;
        var width = 260;
        var height = 460;
        var button_width = 100;
        var button_height = 30;
        var topp = 70;
        var container = new Container(left, topp-30, width, height);
        this.pauseButton = new Button("Pause (P)", left+width/2 - button_width/2,
                topp+95, button_width, button_height);
        this.resetButton = new Button("Reset (Q)", left+width/2 - button_width/2,
                topp+135, button_width, button_height);

        this.slider_alpha = new Slider("\u03B1", sleft+50, topp, 90, 0, 3);
        this.slider_mu    = new Slider("\u03BC", sleft+50, topp+25, 90, 1, 100);
        this.slider_steps = new Slider("step/draw", sleft+50, topp+50, 90, 0, 2000);

        this.pauseButton.handler = this.bind(function (){ this.playpause(); });
        this.resetButton.handler = this.bind(function (){ this.reset(); });
        this.slider_alpha.handler = this.bind(function (val){ this.sim.alpha = val; });
        this.slider_steps.handler = this.bind(function (val){ this.stepsper = val; });
        this.slider_mu.handler = this.bind(function (val){
            this.escapetime = val;
            this.sim.mu = 1.0/(this.escapetime*this.sim.beta*this.sim.Nfact);
        });
        var textbox = new TextBox(left+10, topp+180, width-10, height-topp-160, helptext, this.ctx);

        this.slider_alpha.value = this.sim.alpha;
        this.slider_mu.value = 11;
        this.slider_steps.value = this.stepsper;

        this.uielem = []
        this.uielem.push(container);
        this.uielem.push(textbox);
        this.uielem.push(this.pauseButton);
        this.uielem.push(this.resetButton);
        this.uielem.push(this.slider_alpha);
        this.uielem.push(this.slider_steps);
        this.uielem.push(this.slider_mu);

        for (var i=0; i<this.uielem.length; i++)
            this.uielem[i].hidden = !this.showcontrols;

        this.map = new Image();
        this.map.onload = (this.bind(
            function() {
                this.ctxoff.drawImage(this.map, 0, 0 );
                this.mapcopy = this.ctxoff.getImageData(0, 0,
                    this.map.width, this.map.height);
                this.overlay = this.ctxoff.getImageData(0, 0,
                    this.map.width, this.map.height);
                this.draw();
            }));
        this.map.src = 'dat/js-usa.png';
    },

    playpause: function(){
        this.play = !this.play;
        if (this.play)
            this.pauseButton.text = "Pause (P)";
        else
            this.pauseButton.text = "Play (P)";
    },

    reset: function(){
        this.sim = new simulation.Simulation(this.usboard);
        this.sim.alpha = this.slider_alpha.value;

        this.escapetime = this.slider_mu.value;
        this.sim.mu = 1.0/(this.escapetime*this.sim.beta*this.sim.Nfact);

        this.ctxoff.drawImage(this.map, 0, 0 );
        this.mapcopy = this.ctxoff.getImageData(0, 0,
                    this.map.width, this.map.height);
        this.overlay = this.ctxoff.getImageData(0, 0,
                    this.map.width, this.map.height);

        if (!this.play) this.playpause();
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
            var txt = "Time since infection: "+toFixed(this.sim.time*1.0/(this.sim.beta*this.sim.Nfact), 4)+" hours";
            var size = this.ctx.measureText(txt).width;
            this.ctx.fillText(txt, this.canvas.width/2 - size/2, 40);

            //txt = "FPS: "+toFixed(this.sim.fps, 1);
            //this.ctx.fillText(txt, this.canvas.width/2 - size/2, 80);
        }
    },

    draw: function() {
        this.update_ui();
        if (this.play){
            var tstart = window.performance.now();

            for (var t=0; t<this.stepsper; t++){
                var sites = this.sim.dostep();

                if (!sites) break;

                ll = sites.length;
                for (var i=0; i<ll; i++)
                    this.modify_site(sites[i]);
            }

            var tend = window.performance.now();
            this.sim.fps = this.stepsper/(tend-tstart);

            if (this.ctx.mouse.down){
                var x = this.ctx.mouse.x;
                var y = this.ctx.mouse.y;
                x = Math.floor((x - (this.W-this.mapW)/2)*this.mapWmax/this.mapW);
                y = Math.floor(this.mapHmax - (y - (this.H-this.mapH)/2)*this.mapHmax/this.mapH);

                var hover = false;
                for (var i=0; i<this.uielem.length; i++) if (this.uielem[i].hovered == true) hover = true;
                if (x > 0 && x < this.mapWmax && y > 0 && y < this.mapHmax && !hover)
                    this.sim.doBite(x, y, simulation.S2E);
            }

        }
        this.clear();
        this.draw_map();
        this.draw_overlay();
        this.draw_ui();
        this.draw_timing(this.sim);
        registerAnimationRequest(this.bind(function(){this.draw()}));
    },

    update_ui: function(){
        this.check_control.update(this.ctx);
        for (var i=0; i<this.uielem.length; i++)
            this.uielem[i].update(this.ctx);
    },

    draw_ui: function(){
        this.check_control.draw(this.ctx);
        for (var i=0; i<this.uielem.length; i++)
            this.uielem[i].draw(this.ctx);
    },

    modify_site: function(site){
        var i = site.x;
        var j = this.mapHmax-site.y;
        var ind = 4*(i+j*this.map.width);
        this.overlay.data[ind+0] = Math.floor(this.mapcopy.data[ind]*(site.N-site.R)/site.N);
        this.overlay.data[ind+1] = 0;
        this.overlay.data[ind+2] = 0;
        this.overlay.data[ind+3] = Math.floor(255*site.Z/site.N*100);
    },
}

// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
window.registerAnimationRequest = window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||  window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function(callback) { window.setTimeout( callback, 32); };

