(function(exports){
"use strict";

/* a sample xmp file version 3 (i think) */
/*
    \* XPM *\
    static char *purple_xpm[] = {
        \* width height ncolors chars_per_pixel *\
        "1 1 1 1",
        \* colors *\
        "a c purple",
        \* pixels *\
        "a"
    };
*/

function xpm(sites){
    var mins = {'x': 1e10, 'y': 1e10};
    var maxs = {'x': -1e10, 'y': -1e10};

    var keys = Object.keys(sites);
    var sl = keys.length;
    for (var c=0; c<sl; c++){
        var site = sites[keys[c]];
        if (mins.x > site.x) { mins.x = site.x; }
        if (mins.y > site.y) { mins.y = site.y; }
        if (maxs.x < site.x) { maxs.x = site.x; }
        if (maxs.y < site.y) { maxs.y = site.y; }
    }

    var height = maxs.y - mins.y + 1;
    var width = maxs.x - mins.x + 1;

    var out = "/* XPM */\n"
            + "static char *mypic[] = {"
            + '"'+width+" "+height+' 3 1"\n'
            + '". c black"\n'
            + '"X c red"\n'
            + '"  c None"\n';

    var arr = new Array(width*height);
    for (var i=0; i<width*height; i++)
        arr[i] = ' ';

    for (var i=0; i<sl; i++){
        var site = sites[keys[i]];
        var x = site.x - mins.x;
        var y = site.y - mins.y;
        var ind = x + y*width;

        if (site.Z > 0) arr[ind] = 'X';
        if (site.R > 0) arr[ind] = '.';
    }

    for (var i=0; i<height; i++){
        out += '"';
        for (var j=0; j<width; j++){
            out += arr[j+i*width];
        }
        out += '"\n';
    }

    return out;
}

exports.xpm = xpm;
}(typeof exports === 'undefined' ? this.savexpm = {} : exports));
