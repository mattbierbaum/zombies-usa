var canvas;
var ctx;
var W,H;
var map;
var mapcopy;
var overlay;
var mapHmax = 900;
var mapWmax = 1500;
var mapH = mapHmax;
var mapW = mapWmax;
var uielem = [];
var sim;

var offscreen;
var ctxoff;

function loadGrid(callback) {
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', '/dat/js-grid.json', true);
    xobj.onreadystatechange = function () {
        if (xobj.readyState == 4 && xobj.status == "200") {
            callback(JSON.parse(xobj.responseText));
        }
   };
   xobj.send(null);
}

window.onload = function () {
    canvas = document.getElementById('map');
    ctx = canvas.getContext('2d');
    ctx.mouse = { x: 0, y: 0, clicked: false, down: false };
    ctx.redraw = true;

    offscreen = document.getElementById('coff');
    offscreen.height = mapHmax; offscreen.width = mapWmax;
    ctxoff = offscreen.getContext('2d');

    canvas.addEventListener("mousemove", function(e) {
        ctx.mouse.x = e.offsetX;
        ctx.mouse.y = e.offsetY;
        ctx.mouse.clicked = (e.which == 1 && !ctx.mouse.down);
        ctx.mouse.down = (e.which == 1);
    });

    canvas.addEventListener("mousedown", function(e) {
        ctx.mouse.clicked = !ctx.mouse.down;
        ctx.mouse.down = true;
    });

    canvas.addEventListener("mouseup", function(e) {
        ctx.mouse.down = false;
        ctx.mouse.clicked = false;
    });

    window.onresize = function(event) {
        set_canvas_size();
    };
    set_canvas_size();

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
    map.src = '/dat/js-usa.png';

    loadGrid(function (dat) {
        var usboard = new USAMapBoard(dat);
        sim = new Simulation(usboard);
        //sim.addZombieSeed(1317-380, 587)
        //sim.addZombieSeed(1317-480, 588)
        sim.alpha = 1.2;
    });
}

function set_canvas_size(){
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width  = W;
    canvas.height = H;
    mapH = Math.floor(Math.min(H, mapHmax, 0.6*W));
    mapW = Math.floor(Math.min(W, mapWmax, mapH/0.6));
}

function draw() {
    if (ctx.redraw){
        if (sim){
            for (var t=0; t<1000; t++){
                site = sim.dostep();
                if (!site) continue;
                var i = site.x;
                var j = 900-site.y;
                var ind = 4*(i+j*map.width);
                overlay.data[ind+0] = Math.floor(mapcopy.data[ind]*(site.N-site.R)/site.N);
                overlay.data[ind+1] = 0;
                overlay.data[ind+2] = 0;
                overlay.data[ind+3] = Math.floor(255*site.Z/site.N*100);
            }
            if (ctx.mouse.down){
                var x = ctx.mouse.x;
                var y = ctx.mouse.y;
                x = Math.floor((x - (W-mapW)/2)*mapWmax/mapW);
                y = Math.floor(900 - (y - (H-mapH)/2)*mapHmax/mapH);
                if (x > 0 && x < mapWmax && y > 0 && y < mapHmax)
                    sim.addZombieSeed(x, y);
            }
        }

        clear();
        update_ui();

        draw_map();
        draw_ui();
    }
    requestAnimationFrame(draw, canvas);
}

function clear() {
    ctx.fillStyle = 'rgba(0,0,0,1)';
    ctx.clearRect(0, 0, W, H);
    ctx.fillRect(0, 0, W, H);
}


function update_ui(){
    _.each(uielem, function(obj) {
        obj.update(ctx);
    }, this);
}

function draw_ui(){
    _.each(uielem, function(obj) {
        obj.draw(ctx);
    }, this);
}

function draw_map() {
    ctxoff.putImageData(overlay, 0, 0);

    ctx.drawImage(map, 0, 0, mapWmax, mapHmax, (W-mapW)/2, (H-mapH)/2, mapW, mapH);
    ctx.drawImage(offscreen, 0, 0, mapWmax, mapHmax, (W-mapW)/2, (H-mapH)/2, mapW, mapH);
}

// Provides requestAnimationFrame in a cross browser way.
// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
function registerAnimationRequest() {
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

