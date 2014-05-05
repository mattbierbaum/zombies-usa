// uiobjects borrowed from http://www.gamedevacademy.org/create-a-game-ui-with-the-html5-canvas/

var UIObject = {
    intersects: function(obj, mouse) {
        var t = 1;
        var xIntersect = (mouse.x + t) > obj.x && (mouse.x - t) < (obj.x + obj.width);
        var yIntersect = (mouse.y - t) > obj.y && (mouse.y + t) < (obj.y + obj.height);
        return  xIntersect && yIntersect;
    },
    updateStats: function(canvas){
        if (this.intersects(this, canvas.mouse)) {
            this.hovered = true;

            if (canvas.mouse.clicked) {
                this.clicked = true;
            }
        } else {
            this.hovered = false;
        }

        if (!canvas.mouse.down) {
            this.clicked = false;
        }
    },

    gray: 'rgba(125,125,125,0.7)',
    teal: 'rgba(45,140,125,0.9)',
    red: 'rgba(194,0,24,0.9)',
    white: 'rgba(255,255,255,0.8)',
    hidden: false,
};

var Button = function(text, x, y, width, height) {
    this.width = width;
    this.height = height;
    this.x = x;
    this.y = y - this.height/2;
    this.clicked = false;
    this.hovered = false;
    this.text = text;
}

Button.prototype = _.extend(Button.prototype, UIObject);

Button.prototype.update = function(canvas) {
    var wasNotClicked = !this.clicked;
    this.updateStats(canvas);

    if (this.clicked && wasNotClicked) {
        if (!_.isUndefined(this.handler)) {
            this.handler();
        }
    }
}

Button.prototype.draw = function(canvas) {
    if (this.hidden) return;

    if (this.hovered) {
        canvas.fillStyle = this.red;
    } else {
        canvas.fillStyle = this.gray;
    }

    //draw button
    canvas.fillRect(this.x, this.y, this.width, this.height);

    //text options
    var fontSize = 14;
    canvas.fillStyle = this.white;
    canvas.font = fontSize + "px sans-serif";

    //text position
    var textSize = canvas.measureText(this.text);
    var textX = this.x + (this.width/2) - (textSize.width / 2);
    var textY = this.y + (this.height/2) + (fontSize/(1.5*2));

    //draw the text
    canvas.fillText(this.text, textX, textY);
}

var Slider = function(label, x, y, width, min, max) {
    this.width = width;
    this.height = 20;
    this.x = x;
    this.y = y - this.height/2;
    this.value = min;
    this.min = min;
    this.max = max;
    this.clicked = false;
    this.hovered = false;
    this.shownumbers = true;
    this.label = label;
}


Slider.prototype = _.extend(Slider.prototype, UIObject);

Slider.prototype.update = function(canvas) {
    this.updateStats(canvas);

    if (this.clicked) {
        var pos = canvas.mouse.x;

        pos = Math.max(pos, this.x);
        pos = Math.min(pos, this.x + this.width);

        var range = this.max - this.min;
        var percent = (pos - this.x) / this.width;

        this.value = (this.min + (percent * range));

        if (!_.isUndefined(this.handler)) {
            this.handler(this.value);
        }
    }
}

Slider.prototype.draw = function(canvas) {
    if (this.hidden) return;

    //draw the bar
    canvas.fillStyle = this.gray;
    canvas.fillRect(this.x, this.y + (this.height/4), this.width, this.height/2);

    if (this.hovered) {
        canvas.fillStyle = this.red;
    } else {
        canvas.fillStyle = this.teal;
    }

    //draw the slider handle
    var range = this.max - this.min;
    var percent = (this.value - this.min) / range;
    var pos = this.x + (this.width*percent);
    canvas.fillRect(pos-5, this.y, 10, this.height);

    //text options
    var fontSize = 14;
    canvas.fillStyle = this.white;
    canvas.font = fontSize + "px sans-serif";

    //text position
    var txt = toFixed(this.value,2);
    var textSize = canvas.measureText(txt);
    var textX = this.x + (this.width) + (textSize.width / 2);
    var textY = this.y + (this.height/2) + (fontSize/(1.5*2));
    canvas.fillText(txt, textX, textY);

    //text position
    var textSize = canvas.measureText(this.label);
    var textX = this.x - (textSize.width) - 10;
    var textY = this.y + (this.height/2) + (fontSize/(1.5*2));
    canvas.fillText(this.label, textX, textY);
}

var CheckBox = function(label, x, y) {
    this.width = 16;
    this.height = 16;
    this.x = x;
    this.y = y - this.height/2;
    this.checked = false;
    this.clicked = false;
    this.hovered = false;
    this.label = label;
}

CheckBox.prototype = _.extend(CheckBox.prototype, UIObject);

CheckBox.prototype.update = function(canvas) {
    var wasNotClicked = !this.clicked;
    this.updateStats(canvas);

    if (this.clicked && wasNotClicked) {
        this.checked = !this.checked;

        if (!_.isUndefined(this.handler)) {
            this.handler(this.checked);
        }
    }
}

CheckBox.prototype.draw = function(canvas) {
    if (this.hidden) return;

    //draw outer box
    if (this.hovered)
        canvas.strokeStyle = this.white;
    else
        canvas.strokeStyle = this.gray;

    canvas.lineWidth = 2;
    canvas.strokeRect(this.x, this.y, this.width, this.height);

    //draw check or x
    canvas.font = "18px sans-serif";
    if (this.checked) {
        canvas.fillStyle = this.red;
        canvas.fillText("\u2715", this.x+1, this.y+this.height-1);
    }

    //text options
    var fontSize = 14;
    canvas.fillStyle = this.white;
    canvas.font = fontSize + "px sans-serif";
    //text position
    var textSize = canvas.measureText(this.label);
    var textX = this.x + (this.width) + 10;
    var textY = this.y + (this.height/2) + (fontSize/(1.5*2));
    canvas.fillText(this.label, textX, textY);
}

var Container = function(x, y, width, height){
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = 'rgba(125,125,125,0.2)';
    this.colorborder = 'rgba(225,225,225,0.4)';
    this.hidden = false;
}

Container.prototype = _.extend(Container.prototype, UIObject);
Container.prototype.update = function(canvas){}
Container.prototype.draw = function(canvas){
    if (this.hidden) return;
    canvas.fillStyle = this.color;
    canvas.fillRect(this.x, this.y, this.width, this.height);

    canvas.strokeStyle = this.colorborder;
    canvas.lineWidth = 2;
    canvas.strokeRect(this.x, this.y, this.width, this.height);
}

var TextBox = function(x, y, width, height, txt, ctx){
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = 'rgba(225,225,225,0.8)';
    this.hidden = false;
    this.fontsize = 13;

    this.setText(txt, ctx);
}

TextBox.prototype = _.extend(TextBox.prototype, UIObject);
TextBox.prototype.update = function(canvas){}

TextBox.prototype.setText = function(txt, ctx){
    ctx.font = this.fontsize + "px sans-serif";

    this.text = txt;
    var paragraphs = this.text.split('\n');
    this.pars = [];
    for (var i in paragraphs){
        var par = paragraphs[i];
        var group = [];
        var words = par.split(' ');
        while (words.length > 0){
            var temp = "";
            var i;
            for (i=0; i<words.length; i++){
                var test = temp + words[i] + " ";
                if (ctx.measureText(test).width > this.width){
                    i--; break;
                }
                temp = test;
            }
            group.push(temp);
            words.splice(0, i+1);
        }
        this.pars.push(group);
    }
}

TextBox.prototype.draw = function(canvas){
    if (this.hidden) return;

    canvas.fillStyle = this.white;
    canvas.font = this.fontsize + "px sans-serif";

    var h = this.fontsize/(1*2);
    var here = this.y + h;
    for (var i=0; i<this.pars.length; i++){
        var par = this.pars[i];
        for (var j=0; j<par.length; j++){
            canvas.fillText(par[j], this.x, here);
            here += 2*h;
        }
    }
}

