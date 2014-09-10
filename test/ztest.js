(function(exports){
"use strict";

var isNode = typeof global !== "undefined" && {}.toString.call(global) == '[object global]';
console.log("isnode: "+isNode);

if (isNode == true){
    console.log('hi');
    var thiszdep = require("./zdep.js");
} else {
    var thiszdep = zdep;
}

console.log(thiszdep.S);

}(typeof exports === 'undefined' ? this.ztest = {} : exports));
