var canvas;
var ctx;
var W,H;
var map;
var mapHmax = 900;
var mapWmax = 1500;
var mapH = mapHmax;
var mapW = mapWmax;
var uielem = [];
var sim;

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

    var alertButton = new Button("Alert", 150, 50, 100, 30);
    var slider = new Slider("A quantity", 150, 80, 100, 0, 30);
    var check = new CheckBox("Label", 150, 110);
    uielem.push(alertButton);
    uielem.push(slider);
    uielem.push(check);

    map = new Image();
    map.onload = draw_map;
    map.src = '/dat/js-usa.png';

    loadGrid(function (dat) {
        var usboard = new USAMapBoard(dat);
        sim = new Simulation(usboard);
        sim.addZombieSeed({'x': 1317, 'y': 587})
    });

    registerAnimationRequest();
    requestAnimationFrame(draw, canvas);
}

function set_canvas_size(){
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width  = W;
    canvas.height = H;
    mapH = Math.min(H, mapHmax, 0.6*W);
    mapW = Math.min(W, mapWmax, mapH/0.6);
}

function draw() {
    if (ctx.redraw){
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
    ctx.drawImage(map, 0, 0, mapWmax, mapHmax, (W-mapW)/2, (H-mapH)/2, mapW, mapH);
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

