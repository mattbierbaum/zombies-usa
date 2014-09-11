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

