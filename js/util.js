function toFixed(value, precision, negspace) {
    negspace = typeof negspace !== 'undefined' ? negspace : '';
    var precision = precision || 0;
    var sneg = (value < 0) ? "-" : negspace;
    var neg = value < 0;
    var power = Math.pow(10, precision);
    var value = Math.round(value * power);
    var integral = String(Math.abs((neg ? Math.ceil : Math.floor)(value/power)));
    var fraction = String((neg ? -value : value) % power);
    var padding = new Array(Math.max(precision - fraction.length, 0) + 1).join('0');
    return sneg + (precision ? integral + '.' +  padding + fraction : integral);
}

function loadGrid(url, callback) {
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', url, true);
    xobj.onreadystatechange = function () {
        if (xobj.readyState == 4 && xobj.status == "200") {
            callback(JSON.parse(xobj.responseText));
        }
   };
   xobj.send(null);
}

function hidden_link_download(uri, filename){
    var link = document.createElement('a');
    link.href = uri;
    link.style.display = 'none';
    link.download = filename
    link.id = 'templink';
    document.body.appendChild(link);
    document.getElementById('templink').click();
    document.body.removeChild(document.getElementById('templink'));
}

function download(obj, filename){
    var csv = "data:application/json;charset=utf-8,"+JSON.stringify(obj);
    hidden_link_download(encodeURI(csv), filename);
}

function savexmp(sites){
    var mins = {'x': 1e10, 'y': 1e10};
    var maxs = {'x': -1e10, 'y': -1e10};

    for (var c in sites){
        var site = sites[c];
        if (mins.x > site.x) { mins.x = site.x; }
        if (mins.y > site.y) { mins.y = site.y; }
        if (maxs.x < site.x) { maxs.x = site.x; }
        if (maxs.y < site.y) { maxs.y = site.y; }
    }

    var height = maxs.y - mins.y + 1;
    var width = maxs.x - maxs.x + 1;

    var out = "! XPM2\n";
    out += ""+width+" "+height+" 3 1 \n";
    out += ". c black\n";
    out += "X c red\n";
    out += "  c None\n";

    var arr = new Array(width*height);
    for (var i=0; i<width*height; i++)
        arr[i] = ' ';

    for (var i in sites){
        var site = sites[i];
        var x = site.x - mins.x;
        var y = site.y - mins.y;
        var ind = x + y*width;

        if (site.Z > 0) arr[ind] = 'X';
        if (site.R > 0) arr[ind] = '.';
    }

    for (var i=0; i<width; i++){
        for (var j=0; j<height; j++){
            out += arr[i+j*width];
        }
        out += "\n";
    }

    return out;
}
