/* External loading Library*/
/*global module:false */


/**
Quintus HTML5 Game Engine

The code in `quintus.js` defines the base `Quintus()` method
which create an instance of the engine. The basic engine doesn't
do a whole lot - it provides an architecture for extension, a
game loop, and a method for creating or binding to an exsiting
canvas context. The engine has dependencies on Underscore.js and jQuery,
although the jQuery dependency will be removed in the future.

Most of the game-specific functionality is in the
various other modules:

* `quintus_input.js` - `Input` module, which allows for user input via keyboard and touchscreen
* `quintus_sprites.js` - `Sprites` module, which defines a basic `Q.Sprite` class along with spritesheet support in `Q.SpriteSheet`.
* `quintus_scenes.js` - `Scenes` module. It defines the `Q.Scene` class, which allows creation of reusable scenes, and the `Q.Stage` class, which handles managing a number of sprites at once.
* `quintus_anim.js` - `Anim` module, which adds in support for animations on sprites along with a `viewport` component to follow the player around and a `Q.Repeater` class that can create a repeating, scrolling background.

@module Quintus
*/

var quintusCore = function(exportTarget,key) { 
  "use strict";

/**
 Top-level Quintus engine factory wrapper,
 creates new instances of the engine by calling:

      var Q = Quintus({  ...  });

 Any initial setup methods also all return the `Q` object, allowing any initial
 setup calls to be chained together.

      var Q = Quintus()
              .include("Input, Sprites, Scenes")
              .setup('quintus', { maximize: true })
              .controls();

 `Q` is used internally as the object name, and is used in most of the examples,
 but multiple instances of the engine on the same page can have different names.

     var Game1 = Quintus(), Game2 = Quintus();

@class Quintus
**/
var Quintus = exportTarget[key] = function(opts) {

  /**
   A la jQuery - the returned `Q` object is actually
   a method that calls `Q.select`. `Q.select` doesn't do anything
   initially, but can be overridden by a module to allow
   selection of game objects. The `Scenes` module adds in
   the select method which selects from the default stage.

       var Q = Quintus().include("Sprites, Scenes");
       ... Game Code ...
       // Set the angry property on all Enemy1 class objects to true
       Q("Enemy1").p({ angry: true });

    @method Q
    @for Quintus
  */
  var Q = function(selector,scope,options) {
    return Q.select(selector,scope,options);
  };
  /**
   Global Event Emitter
   @method Q.Events
   @for Quintus
  */
  Q.EventClass=function(){}
  EventLite.mixin(Q.EventClass.prototype);  // import event methods
  Q.Events= new Q.EventClass();
  document.addEventListener('pointerup',function(e){
    Q.Events.emit(`pointerup`,e)
  });
  document.addEventListener('pointerdown',function(e){
    Q.Events.emit(`pointerdown`,e)
  });
  document.addEventListener('pointerdown',function(e){
    Q.Events.emit(`pointerdown`,e)
  });
  /**
   Default no-op select method. Replaced with the Quintus.Scene class

   @method Q.select
   @for Quintus
  */
  Q.select = function() { /* No-op */ };

  /**
   Default no-op select method. Replaced with the Quintus.Scene class


   Syntax for including other modules into quintus, can accept a comma-separated
   list of strings, an array of strings, or an array of actual objects. Example:

       Q.include("Input, Sprites, Scenes")

   @method Q.include
   @param {String} mod - A comma separated list of module names
   @return {Quintus} returns Quintus instance for chaining.
   @for Quintus
  */
  Q.include = function(mod) {
    Q._each(Q._normalizeArg(mod),function(name) {
      var m = Quintus[name] || name;
      if(!Q._isFunction(m)) { throw "Invalid Module:" + name; }
      m(Q);
    });
    return Q;
  };

  /**
   An internal utility method (utility methods are prefixed with underscores)
   It's used to take a string of comma separated names and turn it into an `Array`
   of names. If an array of names is passed in, it's left as is. Example usage:

       Q._normalizeArg("Sprites, Scenes, Physics   ");
       // returns [ "Sprites", "Scenes", "Physics" ]

   Used by `Q.include` and `Q.Sprite.add` to add modules and components, respectively.

   Most of these utility methods are a subset of Underscore.js,
   Most are pulled directly from underscore and some are
   occasionally optimized for speed and memory usage in lieu of flexibility.

   Underscore.js is (c) 2009-2012 Jeremy Ashkenas, DocumentCloud Inc.

   Underscore is freely distributable under the MIT license.

   http://underscorejs.org

   @method Q._normalizeArg
   @param {String or Array} arg - Either a comma separated string or an array
   @return {Array} array of normalized names
   @for Quintus
  */
  Q._normalizeArg = function(arg) {
    if(Q._isString(arg)) {
      arg = arg.replace(/\s+/g,'').split(",");
    }
    if(!Q._isArray(arg)) {
      arg = [ arg ];
    }
    return arg;
  };

  Q.Version="0.3.0"
  Q.Title="Quintus"
  
/**
 * returns a function that, when invoked will only be triggered at most
 * once during a given window of time
 * @public
 * @memberof utils.function
 * @name throttle
 * @param {Function} fn the function to be throttled.
 * @param {number} delay The delay in ms
 * @param {no_trailing} no_trailing disable the execution on the trailing edge
 * @returns {Function} the function that will be throttled
 */
  Q.throttle=function(fn, delay, no_trailing) {
    var last = globalThis.performance.now(), deferTimer;
    // `no_trailing` defaults to false.
    if (typeof no_trailing !== "boolean") {
        no_trailing = false;
    }
    return function () {
        var now = globalThis.performance.now();
        var elasped = now - last;
        var args = arguments;
        if (elasped < delay) {
            if (no_trailing === false) {
                // hold on to it
                clearTimeout(deferTimer);
                deferTimer = setTimeout(function () {
                    last = now;
                    return fn.apply(null, args);
                }, elasped);
            }
        }
        else {
            last = now;
            return fn.apply(null, args);
        }
    };
}

Q.onresize=function () {
  var factor = 1;
  console.log(`${Q.Title} ${Q.Version} Resized Window`)
  Q.clear()
  var winW = window.innerWidth*factor;
  var winH = window.innerHeight*factor;
  var winRatio = winW/winH;
  var gameRatio = Q.el.width/Q.el.height;
  var scaleRatio = gameRatio < winRatio ? winH/Q.el.height : winW/Q.el.width;
  var scaledW = Q.el.width * scaleRatio;
  var scaledH = Q.el.height * scaleRatio;

  Q.el.style.width = scaledW + "px";
  Q.el.style.height = scaledH + "px";

  if(Q.el.parentNode) {
    Q.el.parentNode.style.width = scaledW + "px";
    Q.el.parentNode.style.height = scaledH + "px";
  }

  Q.cssWidth = parseInt(scaledW,10);
  Q.cssHeight = parseInt(scaledH,10);

  //center vertically when adjusting to width
  if(gameRatio > winRatio) {
    var topPos = (winH - scaledH)/2;
    Q.el.style.top = topPos+'px';
  }
}
  /**
   Extends a destination object with a source object (modifies destination object)

   @method Q._extend
   @param {Object} dest - destination object
   @param {Object} source - source object
   @return {Object} returns the dest object
   @for Quintus
  */
  Q._extend = function(dest,source) {
    if(!source) { return dest; }
    for (var prop in source) {
      dest[prop] = source[prop];
    }
    return dest;
  };

  /**
   Return a shallow copy of an object. Sub-objects (and sub-arrays) are not cloned. (uses extend internally)

   @method Q._clone
   @param {Object} obj - object to clone
   @return {Object} cloned object
   @for Quintus
  */
  Q._clone = function(obj) {
    return Q._extend({},obj);
  };

   /**
    Method that adds default properties onto an object only if the key on dest is undefined

   @method Q._defaults
   @param {Object} dest - destination object
   @param {Object} source - source object
   @return {Object} returns the dest object
   @for Quintus
  */
  Q._defaults = function(dest,source) {
    if(!source) { return dest; }
    for (var prop in source) {
      if(dest[prop] === void 0) {
        dest[prop] = source[prop];
      }
    }
    return dest;
  };

  /**
   Shortcut for hasOwnProperty

   @method Q._defaults
   @param {Object} object - destination object
   @param {String} key - key to check for
   @return {Boolean}
   @for Quintus
  */
  Q._has = function(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
  };

   /**
   Check if something is a string

   NOTE: this fails for non-primitives

   @method Q._isString
   @param {Var} obj - object to check
   @return {Boolean}
   @for Quintus
  */
  Q._isString = function(obj) {
    return typeof obj === "string";
  };

  /**
   Check if something is a number

   @method Q._isNumber
   @param {Var} obj - object to check
   @return {Boolean}
   @for Quintus
  */
  Q._isNumber = function(obj) {
    return Object.prototype.toString.call(obj) === '[object Number]';
  };

  /**
   Check if something is a function

   @method Q._isFunction
   @param {Var} obj - object to check
   @return {Boolean}
   @for Quintus
  */
  Q._isFunction = function(obj) {
    return Object.prototype.toString.call(obj) === '[object Function]';
  };

   /**
   Check if something is an Object

   @method Q._isObject
   @param {Var} obj - object to check
   @return {Boolean}
   @for Quintus
  */
  Q._isObject = function(obj) {
    return Object.prototype.toString.call(obj) === '[object Object]';
  };

  /**
   Check if something is an Array

   @method Q._isArray
   @param {Var} obj - object to check
   @return {Boolean}
   @for Quintus
  */
  Q._isArray = function(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
  };

  /**
   Check if something is undefined

   @method Q._isUndefined
   @param {Var} obj - object to check
   @return {Boolean}
   @for Quintus
  */
  Q._isUndefined = function(obj) {
    return obj === void 0;
  };

  /**
   Removes a property from an object and returns it if it exists

   @method Q._popProperty
   @param {Object} obj
   @param {String} property - property to pop off the object
   @return {Var} popped property
   @for Quintus
  */
  Q._popProperty = function(obj,property) {
    var val = obj[property];
    delete obj[property];
    return val;
  };

  /**
   Basic iteration method. This can often be a performance
   handicap when the callback iterator is created inline,
   as this leads to lots of functions that need to be GC'd.
   Better is to define the iterator as a private method so.
   Uses the built in `forEach` method

   @method Q._each
   @param {Array or Object} obj
   @param {Function iterator function, `this` is used for each object
   @for Quintus
  */
  Q._each = function(obj,iterator,context) {
    if (obj == null) { return; }
    if (obj.forEach) {
      obj.forEach(iterator,context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, l = obj.length; i < l; i++) {
        iterator.call(context, obj[i], i, obj);
      }
    } else {
      for (var key in obj) {
        iterator.call(context, obj[key], key, obj);
      }
    }
  };

  /**
   Invoke the named property on each element of the array

   @method Q._invoke
   @param {Array} arr
   @param {String} property - property to invoke
   @param {Var} [arg1]
   @param {Var} [arg2]
   @for Quintus
  */
  Q._invoke = function(arr,property,arg1,arg2) {
    if (arr === null) { return; }
    for (var i = 0, l = arr.length; i < l; i++) {
      arr[i][property](arg1,arg2);
    }
  };



  /**
   Basic detection method, returns the first instance where the
   iterator returns truthy.

   @method Q._detect
   @param {Array or Object} obj
   @param {Function} iterator
   @param {Object} context
   @param {Var} [arg1]
   @param {Var} [arg2]
   @returns {Var} first truthy value
   @for Quintus
  */
  Q._detect = function(obj,iterator,context,arg1,arg2) {
    var result;
    if (obj === null) { return; }
    if (obj.length === +obj.length) {
      for (var i = 0, l = obj.length; i < l; i++) {
        result = iterator.call(context, obj[i], i, arg1,arg2);
        if(result) { return result; }
      }
      return false;
    } else {
      for (var key in obj) {
        result = iterator.call(context, obj[key], key, arg1,arg2);
        if(result) { return result; }
      }
      return false;
    }
  };

  /**
   Returns a new Array with entries set to the return value of the iterator.

   @method Q._detect
   @param {Array or Object} obj
   @param {Function} iterator
   @param {Object} context
   @returns {Array}
   @for Quintus
  */
  Q._map = function(obj, iterator, context) {
    var results = [];
    if (obj === null) { return results; }
    if (obj.map) { return obj.map(iterator, context); }
    Q._each(obj, function(value, index, list) {
      results[results.length] = iterator.call(context, value, index, list);
    });
    if (obj.length === +obj.length) { results.length = obj.length; }
    return results;
  };

  /**
   Returns a sorted copy of unique array elements with null removed

   @method Q._uniq
   @param {Array} arr
   @returns {Array} uniq'd sorted copy of array
   @for Quintus
  */
  Q._uniq = function(arr) {
    arr = arr.slice().sort();

    var output = [];

    var last = null;
    for(var i=0;i<arr.length;i++) {
      if(arr[i] !== void 0 && last !== arr[i]) {
        output.push(arr[i]);
      }
      last = arr[i];
    }
    return output;
  };

  /**
   Returns a new array with the same entries as the source but in a random order.

   @method Q._shuffle
   @param {Array} arr
   @returns {Array} copy or arr in shuffled order
   @for Quintus
  */
  Q._shuffle = function(obj) {
    var shuffled = [], rand;
    Q._each(obj, function(value, index, list) {
      rand = Math.floor(Math.random() * (index + 1));
      shuffled[index] = shuffled[rand];
      shuffled[rand] = value;
    });
    return shuffled;
  };


  /**
   Return an object's keys as a new Array

   @method Q._keys
   @param {Object} obj
   @returns {Array}
   @for Quintus
  */
  Q._keys = Object.keys || function(obj) {
    if(Q._isObject(obj)) { throw new TypeError('Invalid object'); }
    var keys = [];
    for (var key in obj) { if (Q._has(obj, key)) { keys[keys.length] = key; } }
    return keys;
  };


  /**
   Return an array in the range from start to stop

   @method Q._range
   @param {Integer} start
   @param {Integer} stop
   @param {Integer} [step]
   @returns {Array}
   @for Quintus
  */
  Q._range = function(start,stop,step) {
    step = step || 1;

    var len = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(len);

    while(idx < len) {
      range[idx++] = start;
      start += step;
    }

    return range;

  };

  var idIndex = 0;
  /**
   Return a new unique identifier

   @method Q._uniqueId
   @returns {Integer}
   @for Quintus
  */
  Q._uniqueId = function() {
    return idIndex++;
  };

  /**
   Return the same object and exclude all keys that arent positive or above the number 0
   @method Q._filterObjectKeys
   @returns {Object}
   @for Quintus
  */
  Q._filterObjectKeys=function(obj) {
    const filteredObj = {};

    Object.keys(obj).forEach(key => {
      const value = obj[key];
      if (value === true || (typeof value === 'number' && value > 0)) {
        filteredObj[key] = value;
      }
    });

    return filteredObj;
  }
/**
 * Determines the operating system of the device
 * These values are read-only and populated during the boot sequence of the game.
 * They are then referenced by internal game systems and are available for you to access
 * via `Q.GetOs()` from within any Scene.
 *
 * @typedef {object} Q.os
 * @since 3.0.0
 *
 * @property {boolean} android - Is running on android?
 * @property {boolean} chromeOS - Is running on chromeOS?
 * @property {boolean} cordova - Is the game running under Apache Cordova?
 * @property {boolean} crosswalk - Is the game running under the Intel Crosswalk XDK?
 * @property {boolean} desktop - Is running on a desktop?
 * @property {boolean} ejecta - Is the game running under Ejecta?
 * @property {boolean} electron - Is the game running under GitHub Electron?
 * @property {boolean} iOS - Is running on iOS?
 * @property {boolean} iPad - Is running on iPad?
 * @property {boolean} iPhone - Is running on iPhone?
 * @property {boolean} kindle - Is running on an Amazon Kindle?
 * @property {boolean} linux - Is running on linux?
 * @property {boolean} macOS - Is running on macOS?
 * @property {boolean} node - Is the game running under Node.js?
 * @property {boolean} nodeWebkit - Is the game running under Node-Webkit?
 * @property {boolean} webApp - Set to true if running as a WebApp, i.e. within a WebView
 * @property {boolean} windows - Is running on windows?
 * @property {boolean} windowsPhone - Is running on a Windows Phone?
 * @property {number} iOSVersion - If running in iOS this will contain the major version number.
 * @property {number} pixelRatio - PixelRatio of the host device?
 */
Q.OS = {

  android: false,
  chromeOS: false,
  cordova: false,
  crosswalk: false,
  desktop: false,
  ejecta: false,
  electron: false,
  iOS: false,
  iOSVersion: 0,
  iPad: false,
  iPhone: false,
  kindle: false,
  linux: false,
  macOS: false,
  node: false,
  nodeWebkit: false,
  pixelRatio: 1,
  webApp: false,
  windows: false,
  windowsPhone: false

};
Q.GetOS=function(){
  var ua = navigator.userAgent;

  if ((/Windows/).test(ua))
  {
    Q.OS.windows = true;
  }
  else if ((/Mac OS/).test(ua) && !((/like Mac OS/).test(ua)))
  {
      //  Because iOS 13 identifies as Mac OS:
      if (navigator.maxTouchPoints && navigator.maxTouchPoints > 2)
      {
        Q.OS.iOS = true;
        Q.OS.iPad = true;

          (navigator.appVersion).match(/Version\/(\d+)/);

          Q.OS.iOSVersion = parseInt(RegExp.$1, 10);
      }
      else
      {
        Q.OS.macOS = true;
      }
  }
  else if ((/Android/).test(ua))
  {
    Q.OS.android = true;
  }
  else if ((/Linux/).test(ua))
  {
    Q.OS.linux = true;
  }
  else if ((/iP[ao]d|iPhone/i).test(ua))
  {
    Q.OS.iOS = true;

      (navigator.appVersion).match(/OS (\d+)/);

      Q.OS.iOSVersion = parseInt(RegExp.$1, 10);

      Q.OS.iPhone = ua.toLowerCase().indexOf('iphone') !== -1;
      Q.OS.iPad = ua.toLowerCase().indexOf('ipad') !== -1;
  }
  else if ((/Kindle/).test(ua) || (/\bKF[A-Z][A-Z]+/).test(ua) || (/Silk.*Mobile Safari/).test(ua))
  {
    Q.OS.kindle = true;

      // This will NOT detect early generations of Kindle Fire, I think there is no reliable way...
      // E.g. "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_3; en-us; Silk/1.1.0-80) AppleWebKit/533.16 (KHTML, like Gecko) Version/5.0 Safari/533.16 Silk-Accelerated=true"
  }
  else if ((/CrOS/).test(ua))
  {
    Q.OS.chromeOS = true;
  }

  if ((/Windows Phone/i).test(ua) || (/IEMobile/i).test(ua))
  {
    Q.OS.android = false;
    Q.OS.iOS = false;
    Q.OS.macOS = false;
    Q.OS.windows = true;
    Q.OS.windowsPhone = true;
  }

  var silk = (/Silk/).test(ua);

  if (Q.OS.windows || Q.OS.macOS || (Q.OS.linux && !silk) || Q.OS.chromeOS)
  {
    Q.OS.desktop = true;
  }

  //  Windows Phone / Table reset
  if (Q.OS.windowsPhone || (((/Windows NT/i).test(ua)) && ((/Touch/i).test(ua))))
  {
    Q.OS.desktop = false;
  }

  //  WebApp mode in iOS
  if (navigator.standalone)
  {
    Q.OS.webApp = true;
  }

  if (window.cordova !== undefined)
  {
    Q.OS.cordova = true;
  }

  if (typeof process !== 'undefined' && process.versions && process.versions.node)
  {
    Q.OS.node = true;
  }

  if (Q.OS.node && typeof process.versions === 'object')
  {
    Q.OS.nodeWebkit = !!process.versions['node-webkit'];

    Q.OS.electron = !!process.versions.electron;
  }

  if (window.ejecta !== undefined)
  {
    Q.OS.ejecta = true;
  }

  if ((/Crosswalk/).test(ua))
  {
    Q.OS.crosswalk = true;
  }

  Q.OS.pixelRatio = window['devicePixelRatio'] || 1;

  return Q._filterObjectKeys(Q.OS);
}
Q.stime=function(timeString) {
  // Define conversion factors for each time unit to milliseconds
  const timeUnits = {
    msecond: 1,
    second: 1000,
    minute: 60 * 1000,
    hour: 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000, // Approximation, not precise
    year: 365 * 24 * 60 * 60 * 1000 // Approximation, not precise
  };

  // Extract the numeric value and the unit from the input string
  const [value, unit] = timeString.split(' ');

  // Convert the value to a number and check if it's a valid number
  const numericValue = parseFloat(value);
  if (isNaN(numericValue)) {
    throw new Error('Invalid input. Please provide a valid time string, e.g., "1 day", "1 second", etc.');
  }

  // Get the conversion factor for the specified unit (if it exists)
  const conversionFactor = timeUnits[unit.toLowerCase()];
  if (!conversionFactor) {
    throw new Error(`Invalid time unit "${unit}". Please use one of the following units: ${Object.keys(timeUnits).join(', ')}.`);
  }

  // Calculate the time in milliseconds
  const timeInMilliseconds = numericValue * conversionFactor;

  return timeInMilliseconds;
}
  /**
         Q.Timer

        Super Flexibile game timer with call back functions to do things when the timer starts
        While the timer is running and When the timer finishes running.

        let TestTimer = new Q.Timer(10, //* How many times to count for the timer
        Q.stime("1 second"), //* Interval between counts
        (progress)=>{
          console.log(`Current Progress is ${progress}`)
        }, //* Run this everytime the Timer ticks
        ()=>{
          console.log(`My timer Ended`)
        },//* Run this when the timer ends
        ()=>{
          console.log(`My Timer Started`)
        }//* Run this everytime the Timer starts
        );
*/
Q.Timer=function(duration,onstep, onend,onstart) {
  this.duration =Q.stime(duration)// Duration of the timer in seconds
  this.interval=Q.stime(`1 second`)
  this.onstep=onstep
  this.onend=onend
  this.onstart=onstart
  this.ID=null
  this.progress=null
  this.start()
  console.log(arguments[0])
}

Q.Timer.prototype.start = function() {
  this.startime=Date.now()
  if (typeof this.onstep === 'function') {
    this.onstart();
  }
  this.ID=setInterval(() => {
    const elapsedTime = Date.now() - this.startime;
    this.progress = Math.min((elapsedTime / (this.duration)) * 100, 100);
    if (typeof this.onstep === 'function') {
      this.onstep(this.progress);
    }
    if(this.progress>=100){
      if (typeof this.onend === 'function') {
        this.onend();
      }
      clearInterval(this.ID);
    }
  },this.interval);

};

Q.Timer.prototype.end=function() {
  if (this.ID) {
    clearInterval(this.ID);
    this.ID = null;
  }
}
Math.TAU = Math.PI * 2;
Math.HPI = Math.PI / 2;
Math.QPI = Math.PI / 4;

Q.Util= {

    SYMBOL_LISTENERS: Symbol(),
    isStringArray(str){
      try {
        const parsedArray = JSON.parse(str);
        return Array.isArray(parsedArray);
      } catch (error) {
        return false;
      }
    },
/**
 * 40-90% faster than built-in Array.forEach function.
 *
 * basic benchmark: https://jsbench.me/urle772xdn
 */
 forEach(array, callback){
  for (let i = 0, l = array.length; i < l; i++) {
      callback(array[i], i);
  }
},
/**
* 20-90% faster than built-in Array.some function.
*
* basic benchmark: https://jsbench.me/l0le7bnnsq
*/
some(array, callback){
  for (let i = 0, l = array.length; i < l; i++) {
      if (callback(array[i], i)) {
          return true;
      }
  }
  return false;
},
/**
* 20-40% faster than built-in Array.every function.
*
* basic benchmark: https://jsbench.me/unle7da29v
*/
 every(array, callback){
  for (let i = 0, l = array.length; i < l; i++) {
      if (!callback(array[i], i)) {
          return false;
      }
  }
  return true;
},
/**
* 20-60% faster than built-in Array.filter function.
*
* basic benchmark: https://jsbench.me/o1le77ev4l
*/
filter(array, callback){
  const output = [];
  for (let i = 0, l = array.length; i < l; i++) {
      const item = array[i];
      if (callback(item, i)) {
          output.push(item);
      }
  }
  return output;
},
/**
* 20-70% faster than built-in Array.map
*
* basic benchmark: https://jsbench.me/oyle77vbpc
*/
map (array, callback) {
  const output = new Array(array.length);
  for (let i = 0, l = array.length; i < l; i++) {
      output[i] = callback(array[i], i);
  }
  return output;
},
    parseSpreadString(spreadString) {
      try {
        // Split the spread string at the '..' delimiter
        const [start, end] = spreadString.split('..').map(Number);
        
        // Create an array of numbers from start to end (inclusive)
        const result = Array.from({ length: end - start + 1 }, (_, index) => start + index);
        return result;
      } catch (error) {
        console.error("Error: Invalid spread string format.");
        return [];
      }
    },
    profanityFilter(str) {
    
        if(window.Widget) {

            let filter = window.Widget && window.Widget.filter;

            if(!filter) return str;

            return filter(str);

        } else return str;

    },

    copyToClipboard(input) {

        input.select();
        
        document.execCommand("copy");

    },

    modulo: function(value, max) {

        return value - max * Math.floor(value / max);

    },
    
    promise() {

        let resolve, reject;

        let promise = new Promise(function(_resolve, _reject) {

            resolve = _resolve;
            reject = _reject;

        });

        promise.resolve = resolve;
        promise.reject = reject;

        promise.cancelled = false;

        promise.cancel = () => {
            
            promise.cancelled = true;
            promise.resolve(null);

        };

        return promise;

    },


    trigger(object, name) {

        let allListeners = object[this.SYMBOL_LISTENERS];

        if (!allListeners) return;

        let listeners = allListeners[name];

        if (!listeners) return;

    },

    on(object, name) {




    },

    track(object, key, value) {

        let current = object[key];

        if (current === value) return false;

        object[key] = value;

        return true;

    },

    changes(next, prev) {

        let result = {};

        for (var key in next) {

            // if (prev[key] !== next[key]) {
            if (!this.isEqual(prev[key], next[key])) {

                result[key] = next[key];

            }

        }

        return result;

    },
    hhmmss(time) {

        let hours = time / 3600 | 0;
        let minutes = time / 60 | 0;
        let seconds = time % 60;

        return (hours ? String(hours).padStart(2, "0") + ":" : "") + String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");

    },

    mmss(time) {

        let minutes = time / 60 | 0;
        let seconds = time % 60;

        return String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");

    },

    hexToString(hex) {

        return "#" + hex.toString(16);

    },

    intToHexColor(hex) {

        let a = this.intToRGBA(hex);

        return "#" +
            (a[0] * 255).toString(16).padStart(2, "0") +
            (a[1] * 255).toString(16).padStart(2, "0") +
            (a[2] * 255).toString(16).padStart(2, "0");

    },

    /* https://stackoverflow.com/questions/12043187/how-to-check-if-hex-color-is-too-black */
    
    hexToLuma(hex) {
        var c = hex.substring(1); // strip #
        var rgb = parseInt(c, 16); // convert rrggbb to decimal
        var r = (rgb >> 16) & 0xff; // extract red
        var g = (rgb >> 8) & 0xff; // extract green
        var b = (rgb >> 0) & 0xff; // extract blue

        var luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; // per ITU-R BT.709

        return luma / 255;
    },

    intToRGBA(color) {

        let temp = [];

        temp[0] = (color / 65536 % 256 | 0) / 255.0;
        temp[1] = (color / 256 % 256 | 0) / 255.0;
        temp[2] = (color % 256) / 255.0;
        temp[3] = 1.0;

        return temp;

    },

    RGBToInt(rgb) {

        return rgb[2] * 255 | (rgb[1] * 255 << 8) | (rgb[0] * 255 << 16);

    },

    arrayCall(array, methodName, a = 0, b = 0, c = 0) {

        for (let i = 0; i < array.length; i++) array[i][methodName](a, b, c);

    },

    arraySet(array, propertyName, value) {

        for (let i = 0; i < array.length; i++) array[i][propertyName] = value;

    },

    pullOne(array, element) {

        let index = array.indexOf(element);

        if (index < 0) return;

        array.splice(index, 1);

    },

    hash: function(string) {

        var hash = 0,
            i, chr;

        if (string.length === 0) return hash;

        for (i = 0; i < string.length; i++) {
            chr = string.charCodeAt(i);
            hash = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
        }

        return hash;

    },

    dcopy: function(o) {

        return JSON.parse(JSON.stringify(o));

    },

    escapeHTML: function(s) {
        return s.replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    },

    unescapeHTML: function(s) {
        return s.replace('&amp;', '&')
            .replace('&quot;', '"')
            .replace('&lt;', "<")
            .replace('&gt;', ">");
    },

    captureTrace: function() {

        try {

            throw new Error();

        } catch (e) {

            return JSON.stringify(e.stack, null, 2);

        }

    },

    ucfirst: function(str) {

        return str[0].toUpperCase() + str.slice(1);

    },

    dirrow: function(direction, angles) {

        angles = angles || 8;

        var fo = -0.5 * Math.TAU / angles;

        return (Utils.circWrap(direction - fo) / Math.TAU) * angles | 0;

    },

    dirrowp: function(direction, angles) {

        direction = Utils.atan2(Math.sin(direction) * 1.456, Math.cos(direction));

        angles = angles || 8;

        var fo = -0.5 * Math.TAU / angles;

        return (Utils.circWrap(direction - fo) / Math.TAU) * angles | 0;

    },

    tryParseJSON: function(json) {

        try {

            return JSON.parse(json);

        } catch (e) {

            return null;

        }

    },

    repeatInterval: function(callback, times, interval) {
        var counter = 1;

        if (counter >= times) return;

        var timer = setInterval(function() {

            callback(counter++);

            if (counter >= times) {

                clearInterval(timer);

            };

        }, interval * 1000);

    },

    create: function(prototype, args) {

        var object = Object.create(prototype);

        return this.extend(object, args);

    },

    strTemplate: function(str, obj) {

        return str.replace(/{(\w+)}/g, function(_, k) {
            return obj[k];
        });

    },

    urlTemplate: function(template, data) {

        for (var key in data) {

            var value = encodeURIComponent(data[key]);

            template = template.replace("{" + key + "}", value);

        }

        return template;

    },

    /* extend existing properties */

    existend: function() {

        var result = Utils.extend({}, arguments[0]);

        for (var key in result) {

            for (var i = 1; i < arguments.length; i++) {

                if (!arguments[i]) continue;

                var value = arguments[i][key];

                if (value !== undefined) result[key] = value;

            }

        }

        return result;

    },

    cycle: function(current, pool) {

        if (!(pool instanceof Array)) pool = Object.keys(pool);

        let index = pool.indexOf(current);

        index = this.wrap(index + 1, 0, pool.length);

        return pool[index];
    },

    distance: function(x1, y1, x2, y2) {

        if (arguments.length > 2) {

            var dx = x1 - x2;
            var dy = y1 - y2;

            return Math.sqrt(dx * dx + dy * dy);

        } else {

            var dx = x1.x - y1.x;
            var dy = x1.y - y1.y;

            return Math.sqrt(dx * dx + dy * dy);

        }

    },

    distance2: function(x1, y1, x2, y2) {

        if (arguments.length > 2) {

            var dx = x1 - x2;
            var dy = y1 - y2;

            return dx * dx + dy * dy;

        } else {

            var dx = x1.x - y1.x;
            var dy = x1.y - y1.y;

            return dx * dx + dy * dy;

        }

    },

    limit: function(value, min, max) {

        return value < min ? min : value > max ? max : value;

    },

    nearest: function(from, entities) {

        var min = -1;
        var result = null;

        for (var i = 0; i < entities.length; i++) {

            var to = entities[i];

            if (from === to) continue;

            var distance = this.distance2(from, to);

            if (distance < min || min < 0) {
                min = distance;
                result = to;
            }

        }

        return result;
    },

    nearestxy: function(x, y, entities) {

        var min = -1;
        var result = null;

        for (var i = 0; i < entities.length; i++) {

            var to = entities[i];

            var distance = this.distance2(x, y, to.x, to.y);

            if (distance < min || min < 0) {
                min = distance;
                result = to;
            }

        }

        return result;
    },

    sign: function(value) {

        return value == 0 ? 0 : value / Math.abs(value);

    },

    sincos: function(angle, radius) {

        if (arguments.length === 1) {
            var a = Math.random() * 6.28;

            return {
                x: Math.cos(a) * angle,
                y: Math.sin(a) * angle
            };

        } else {

            return {
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius
            };

        }

    },

    ground: function(num, threshold) {

        return (num / threshold | 0) * threshold;

    },

    thresholdFloor: function(num, threshold) {

        return (num / threshold | 0) * threshold;

    },

    thresholdCeil: function(num, threshold) {

        return Math.ceil(num / threshold) * threshold;

    },

    groundAngle: function(direction, angles) {

        angles = angles || 8;

        var fo = -0.5 * Math.TAU / angles;

        return Utils.ground(direction - fo, Math.TAU / angles);

    },

    rotate: function(pointX, pointY, originX, originY, angle) {

        return [
            originX + (pointX - originX) * Math.cos(angle) - (pointY - originY) * Math.sin(angle),
            originY + (pointX - originX) * Math.sin(angle) + (pointY - originY) * Math.cos(angle)
        ];

    },

    pointInRect: function(x, y, rx, ry, rw, rh) {

        return !(x < rx || y < ry || x >= rx + rw || y >= ry + rh);

    },

    pointInEllipse: function(px, py, ex, ey, ew, eh) {

        let dx = px - ex;
        let dy = py - ey;

        return (dx * dx) / (ew * ew) + (dy * dy) / (eh * eh) <= 1;

    },

    rectInRect: function(r1x, r1y, r1w, r1h, r2x, r2y, r2w, r2h) {

        return !(r2x > r1x + r1w ||
            r2x + r2w < r1x ||
            r2y > r1y + r1h ||
            r2y + r2h < r1y);

    },

    pointInRotatedRect: function(pointX, pointY, rectX, rectY, rectWidth, rectHeight, rotation) {

        var x = rectX + (pointX - rectX) * Math.cos(-rotation) - (pointY - rectY) * Math.sin(-rotation);
        var y = rectY + (pointX - rectX) * Math.sin(-rotation) + (pointY - rectY) * Math.cos(-rotation);

        return this.pointInRect(x, y, rectX - rectWidth / 2, rectY - rectHeight / 2, rectWidth, rectHeight);

    },

    quickPointInRange: function(ax, ay, bx, by, range) {

        if (Math.abs(ax - bx) > range) return false;
        if (Math.abs(ay - by) > range) return false;

        return true;

    },



    /* https://github.com/substack/point-in-polygon */

    pointInPolygon: function(x, y, vertices) {

        var inside = false;

        for (var i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
            var xi = vertices[i][0],
                yi = vertices[i][1];
            var xj = vertices[j][0],
                yj = vertices[j][1];

            var intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }

        return inside;

    },

    atan2: function(y, x) {

        if (y === 0 && x === 0) return 0;

        var r;

        var ax = Math.abs(x);
        var ay = Math.abs(y);

        var a = Math.min(ax, ay) / Math.max(ax, ay);
        var s = a * a;

        r = ((-0.0464964749 * s + 0.15931422) * s - 0.327622764) * s * a + a

        if (ay > ax) r = 1.57079637 - r;
        if (x < 0) r = 3.14159274 - r;
        if (y < 0) r = -r;

        return r;

    },

    lookAt: function(a, b, c, d) {

        if (arguments.length > 2) {

            var angle = this.atan2(d - b, c - a);
            if (angle < 0) angle = Math.PI * 2 + angle;

        } else {

            var angle = this.atan2(b.y - a.y, b.x - a.x);
            if (angle < 0) angle = Math.PI * 2 + angle;

        }

        return angle;

    },

    atanxy: function(x, y) {

        var angle = Math.atan2(y, x);
        if (angle < 0) angle = Math.PI * 2 + angle;

        return angle;

    },

    moveTo: function(value, target, step) {

        if (value < target) {
            value += step;
            if (value > target) value = target;
        }

        if (value > target) {
            value -= step;
            if (value < target) value = target;
        }

        return value;

    },

    circWrap: function(val) {

        while (val >= Math.PI * 2) val -= Math.PI * 2;
        while (val < 0) val += Math.PI * 2;

        return val;

    },

    wrap: function(value, min, max) {

        if (value < min) {

            return max + (value - min);

        }

        if (value >= max) {

            return min + (value - max);

        }

        return value;

    },

    wrapTo: function(value, target, max, step) {

        if (value === target) return target;

        var result = value;

        var d = this.wrappedDistance(value, target, max);

        if (Math.abs(d) < step) return target;

        result += (d < 0 ? -1 : 1) * step;

        if (result > max) {

            result = result - max;

        } else if (result < 0) {

            result = max + result;

        }

        return result;

    },

    circWrapTo: function(value, target, step) {

        return this.wrapTo(value, target, Math.PI * 2, step);

    },

    circDistance: function(a, b) {

        return this.wrappedDistance(a, b, Math.PI * 2);

    },

    circDistanceAbs: function(a, b) {

        return Math.abs(this.wrappedDistance(a, b, Math.PI * 2));

    },

    circDistanceFactor: function(a, b) {

        return Math.abs(this.wrappedDistance(a, b, Math.PI * 2)) / Math.PI;

    },

    wrappedDistance: function(a, b, max) {

        if (a === b) return 0;
        else if (a < b) {
            var l = -a - max + b;
            var r = b - a;
        } else {
            var l = b - a;
            var r = max - a + b;
        }

        if (Math.abs(l) > Math.abs(r)) return r;
        else return l;

    },

    randomPolygon: function(vertices, scale) {

        var angleStep = Math.PI * 2 / vertices;

        var polygon = [];

        var angleOffset = Math.PI * 2 * Math.random();

        for (var i = 0; i < vertices; i++) {

            var angle = angleOffset + i * angleStep - Math.random() * angleStep * 0.5;
            var r = 0.5 + Math.random() * 0.5;
            var x = Math.cos(angle) * r;
            var y = Math.sin(angle) * r;

            polygon.push([x * scale, y * scale]);

        }

        return polygon;

    },

    seed: function(value) {

        var seed = value;

        for (var i = 0; i < (value % 1000); i++) seed = (seed * 9301 + 49297) % 233280;

        return seed / 233280;

    },

    randomf: function(a, b) {

        return a + (b - a) * Math.random();

    },

    random: function(a, b) {

        if (a === undefined) {
            return Math.random();
        } else if (b !== undefined) {
            return Math.floor(a + Math.random() * Math.abs(b - a + 1));
        } else {
            if (a instanceof Array) return a[(a.length + 1) * Math.random() - 1 | 0];
            else {
                return a[this.random(Object.keys(a))];
            }
        }

    },

    randomSign: function() {

        return Math.random() > 0.5 ? -1 : 1;

    },

    signedRandom: function(max) {

        return Math.random() * max * (Math.random() > 0.5 ? -1 : 1);

    },

    lerp(a, b, factor = 0.5) {

        if (typeof a === "number") {

            return a + (b - a) * factor;

        } else if (a instanceof Array) {

            let result = [];

            for (let i = 0; i < a.length; i++) {

                result[i] = this.lerp(a[i], b[i], factor);

            }

            return result;

        } else {

            return {
                x: this.lerp(a.x, b.x, factor),
                y: this.lerp(a.y, b.y, factor)
            };

        }

    },

    lineLineIntersection(x1, y1, x2, y2, x3, y3, x4, y4) {

        var ua, ub, denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);

        if (denom == 0) {

            return null;

        }

        ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
        ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

        if ((ua >= 0 && ua <= 1) && (ub >= 0 && ub <= 1)) {

            return {
                x: x1 + ua * (x2 - x1),
                y: y1 + ua * (y2 - y1),
            };

        } else return null;

    },

    /*

    http://stackoverflow.com/a/24392281    
    - Dan Fox

    Be carefull: if the determinant is zero, it means that the two lines are parallel. 
    Either they are equal (and all points are "intersection points") or "strictly" parallel (and no intersection)
    – oliverpool

    */

    lineLineCollision: function(a, b, c, d, p, q, r, s) {

        var det, gamma, lambda;

        det = (c - a) * (s - q) - (r - p) * (d - b);

        if (det === 0) {

            return false;

        } else {

            lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;

            gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;

            return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);

        }

    },

    interpolatePoints: function(ax, ay, bx, by, f) {

        return [f * ax + (1 - f) * bx, f * ay + (1 - f) * by];
    },

    /* http://keith-hair.net/blog/2008/08/05/line-to-circle-intersection-data/ */

    lineCircleIntersection: function(ax, ay, bx, by, cx, cy, r) {

        var result = {
            inside: false,
            tangent: false,
            intersects: false,
            enter: null,
            exit: null
        };

        var a = (bx - ax) * (bx - ax) + (by - ay) * (by - ay);
        var b = 2 * ((bx - ax) * (ax - cx) + (by - ay) * (ay - cy));
        var cc = cx * cx + cy * cy + ax * ax + ay * ay - 2 * (cx * ax + cy * ay) - r * r;
        var deter = b * b - 4 * a * cc;

        result.distance = Math.sqrt(a);

        if (deter <= 0) {
            result.inside = false;
        } else {
            var e = Math.sqrt(deter);
            var u1 = (-b + e) / (2 * a);
            var u2 = (-b - e) / (2 * a);
            if ((u1 < 0 || u1 > 1) && (u2 < 0 || u2 > 1)) {
                if ((u1 < 0 && u2 < 0) || (u1 > 1 && u2 > 1)) {
                    result.inside = false;
                } else {
                    result.inside = true;
                }
            } else {

                if (0 <= u2 && u2 <= 1) {
                    result.enter = this.interpolatePoints(ax, ay, bx, by, 1 - u2);
                }
                if (0 <= u1 && u1 <= 1) {
                    result.exit = this.interpolatePoints(ax, ay, bx, by, 1 - u1);
                }
                result.intersects = true;
                if (result.exit != null && result.enter != null && result.exit[0] == result.enter[0] && result.exit[1] == result.enter[1]) {
                    result.tangent = true;
                }
            }
        }

        return result.intersects ? result : false;

    },

    lineCircleCollision: function(ax, ay, bx, by, cx, cy, r) {

        var result = false;

        var a = (bx - ax) * (bx - ax) + (by - ay) * (by - ay);
        var b = 2 * ((bx - ax) * (ax - cx) + (by - ay) * (ay - cy));
        var cc = cx * cx + cy * cy + ax * ax + ay * ay - 2 * (cx * ax + cy * ay) - r * r;
        var deter = b * b - 4 * a * cc;

        if (deter <= 0) {

        } else {
            var e = Math.sqrt(deter);
            var u1 = (-b + e) / (2 * a);
            var u2 = (-b - e) / (2 * a);

            if ((u1 < 0 || u1 > 1) && (u2 < 0 || u2 > 1)) {

            } else {
                result = true;
            }
        }

        return result;

    },

    repulse: function(a, b, radius) {

        var angle = this.lookAt(b, a);

        a.x = b.x + Math.cos(angle) * radius;
        a.y = b.y + Math.sin(angle) * radius;

    },

    interval: function(object, key, interval) {

        if (!object.throttles) object.throttles = {};
        if (!object.throttles[key]) object.throttles[key] = -interval;

        if (object.lifetime - object.throttles[key] >= interval) {

            object.throttles[key] = object.lifetime;

            return true;

        } else return false;

    },

    intervalRange: function(object, key, min, max) {

        if (!object.throttles) object.throttles = {};
        if (!object.throttles[key]) object.throttles[key] = object.lifetime - max;

        if (object.throttles[key] - object.lifetime <= 0) {

            object.throttles[key] = object.lifetime + Utils.randomf(min, max);

            return true;

        } else return false;

    },

    onceAfter: function(key, wait, object) {

        if (!object.onceAfters) object.onceAfters = {};
        if (!object.onceAfters[key]) object.onceAfters[key] = object.lifetime - wait;

        if (object.lifetime - object.onceAfters[key] >= wait) {
            object.onceAfters[key] = object.lifetime;
            return true;
        } else {
            object.onceAfters[key] = object.lifetime;
            return false;
        }

    },

    /* game specific */

    updateBox: function(e, radius) {

        if (!e.box) e.box = [];

        e.box[0] = e.x - radius;
        e.box[1] = e.y - radius;
        e.box[2] = radius * 2;
        e.box[3] = radius * 2;
    },

    saw: function(t) {

        if (t < 0.5) {
            return t / 0.5;
        } else {
            return 1 - (t - 0.5) / 0.5;
        }

    },

    vecNormalize: function(v) {

        var d = Math.sqrt(v[0] * v[0] + v[1] * v[1]);

        return [v[0] / d, v[1] / d];

    },

    vecDot: function(a, b) {

        return a[0] * b[0] + a[1] * b[1];

    },

    vecSub: function(a, b) {

        return [a[0] - b[0], a[1] - b[1]];

    },

    getDirectionKey: function(direction) {

        if (direction === 0) return "right";
        else if (direction === Math.PI * 0.5) return "down";
        else if (direction === Math.PI * 1.0) return "left";
        else if (direction === Math.PI * 1.5) return "up";

    },

    offsetToDirectionKey: function(ox, oy) {

        if (ox < 0) return "left";
        if (ox > 0) return "right";
        if (oy < 0) return "up";
        if (oy > 0) return "down";

    },

    minValue: function(collection, test) {

        var min = false;

        if (collection instanceof Array) {

            for (var i = 0; i < collection.length; i++) {

                var value = test(collection[i]);

                if (min === false || value < min) min = value;

            }

        } else {

            for (var key in collection) {

                var value = test(collection[key]);

                if (min === false || value < min) min = value;

            }

        }

        return min;

    },

    maxValue: function(collection, test) {

        var max = false;

        if (collection instanceof Array) {

            for (var i = 0; i < collection.length; i++) {

                var value = test(collection[i]);

                if (max === false || value > max) max = value;

            }

        } else {

            for (var key in collection) {

                var value = test(collection[key]);

                if (max === false || value > max) max = value;

            }

        }

        return max;

    },

    smhd: function(s = 0, m = 0, h = 0, d = 0) {

        return s * 1000 + m * 60 * 1000 + h * 60 * 60 * 1000 + d * 24 * 60 * 60 * 1000;

    },

    xget: function(url, object, callback) {

        callback = callback || function() {};

        return new Promise(function(resolve, reject) {

            var request = new XMLHttpRequest();

            request.open("GET", url, true);

            request.onreadystatechange = function() {

                if (request.readyState != 4 || request.status != 200) return;

                callback(false, request.responseText);

                resolve(request.responseText);

            };

            request.onerror = function() {
                callback(true);
                reject();
            };

            request.timeout = 5000;

            request.ontimeout = function() {

                callback(true);
                reject();

            }

            request.send();

        });

    },

    xpost: function(url, object, callback) {

        callback = callback || function() {};

        return new Promise(function(resolve, reject) {

            var request = new XMLHttpRequest();

            request.open("POST", url, true);

            request.onreadystatechange = function() {

                if (request.readyState != 4 || request.status != 200) return;

                if (callback) callback(false, request.responseText);

                resolve(request.responseText);

            };

            request.onerror = function() {

                if (callback) callback(true);

                reject();

            };

            request.timeout = 2000;

            request.ontimeout = function() {

                if (callback) callback(true);

                reject();

            }

            /*      

                var form_data = new FormData();

                for (var key in object) {

                    form_data.append(key, object[key]);

                }

            */

            request.send(JSON.stringify(object));

        });

    },

    nearestPOT(value, pow) {

        pow = pow || 1;

        while (pow < value) {

            pow *= 2;

        }

        return pow;

    },
    lzwEncode: function(s) {
        var dict = {};
        var data = (s + "").split("");
        var out = [];
        var currChar;
        var phrase = data[0];
        var code = 256;
        for (var i = 1; i < data.length; i++) {
            currChar = data[i];
            if (dict[phrase + currChar] != null) {
                phrase += currChar;
            } else {
                out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
                dict[phrase + currChar] = code;
                code++;
                phrase = currChar;
            }
        }
        out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
        for (var i = 0; i < out.length; i++) {
            out[i] = String.fromCharCode(out[i]);
        }
        return out.join("");
    },

    // Decompress an LZW-encoded string
    lzwDecode: function(s) {
        var dict = {};
        var data = (s + "").split("");
        var currChar = data[0];
        var oldPhrase = currChar;
        var out = [currChar];
        var code = 256;
        var phrase;
        for (var i = 1; i < data.length; i++) {
            var currCode = data[i].charCodeAt(0);
            if (currCode < 256) {
                phrase = data[i];
            } else {
                phrase = dict[currCode] ? dict[currCode] : (oldPhrase + currChar);
            }
            out.push(phrase);
            currChar = phrase.charAt(0);
            dict[code] = oldPhrase + currChar;
            code++;
            oldPhrase = phrase;
        }
        return out.join("");

    }

}
  /**
   Options

   Default engine options defining the paths
   where images, audio and other data files should be found
   relative to the base HTML file. As well as a couple of other
   options.

   These can be overriden by passing in options to the `Quintus()`
   factory method, for example:

       // Override the imagePath to default to /assets/images/
       var Q = Quintus({ imagePath: "/assets/images/" });

   If you follow the default convention from the examples, however,
   you should be able to call `Quintus()` without any options.

   Default Options

       {
        imagePath: "images/",
        audioPath: "audio/",
        dataPath:  "data/",
        audioSupported: [ 'mp3','ogg' ],
        sound: true,
        frameTimeLimit: 100
       }

   @property Q.options
   @type Object
   @for Quintus
  */
  Q.options = {
    imagePath: "images/",
    audioPath: "audio/",
    dataPath:  "data/",
    datafolder:"data",
    imagefolder:"images",
    audiofolder:"audio",
    dataorigin:"",
    audioSupported: [ 'mp3','ogg' ],
    sound: true,
    frameTimeLimit: 100,
    autoFocus: true,
    purgeCache:false,
    Render:"", //HD or Pixel
    DebugDrawCallCount:false,
  };
  if(opts) { Q._extend(Q.options,opts); }

  Q.scheduleFrame = function(callback) {
    return window.requestAnimationFrame(callback);
  };

  Q.cancelFrame = function(loop) {
    window.cancelAnimationFrame(loop);
  };

  /**
   Game Loop support

   By default the engine doesn't start a game loop until you actually tell it to.
   Usually the loop is started the first time you call `Q.stageScene`, but if you
   aren't using the `Scenes` module you can explicitly start the game loop yourself
   and control **exactly** what the engine does each cycle. For example:

       var Q = Quintus().setup();

       var ball = new Q.Sprite({ .. });

       Q.gameLoop(function(dt) {
         Q.clear();
         ball.step(dt);
         ball.draw(Q.ctx);
       });

   The callback will be called with fraction of a second that has elapsed since
   the last call to the loop method.

   @method Q.gameLoop
   @param {Function} callback
   @for Quintus
  */
  Q.gameLoop = function(callback) {
    Q.lastGameLoopFrame = new Date().getTime();

    // Short circuit the loop check in case multiple scenes
    // are staged immediately
    Q.loop = true;

    // Keep track of the frame we are on (so that animations can be synced
    // to the next frame)
    Q._loopFrame = 0;

    // Wrap the callback to save it and standardize the passed
    // in time.
    Q.gameLoopCallbackWrapper = function() {
      var now = new Date().getTime();
      Q._loopFrame++;
      Q.loop = Q.scheduleFrame(Q.gameLoopCallbackWrapper);
      var dt = now - Q.lastGameLoopFrame;
      /* Prevent fast-forwarding by limiting the length of a single frame. */
      if(dt > Q.options.frameTimeLimit) { dt = Q.options.frameTimeLimit; }
      callback.apply(Q,[dt / 1000]);
      Q.lastGameLoopFrame = now;
    };

    Q.scheduleFrame(Q.gameLoopCallbackWrapper);
    return Q;
  };




  /**
   Pause the entire game by canceling the requestAnimationFrame call. If you use setTimeout or
   setInterval in your game, those will, of course, keep on rolling...

    @method Q.pauseGame
    @for Quintus
  */
  Q.pauseGame = function() {
    if(Q.loop) {
      Q.cancelFrame(Q.loop);
    }
    Q.loop = null;
  };

  /**
   Unpause the game by restarting the requestAnimationFrame-based loop.
   Pause the entire game by canceling the requestAnimationFrame call. If you use setTimeout or
   setInterval in your game, those will, of course, keep on rolling...

    @method Q.pauseGame
    @for Quintus
  */
  Q.unpauseGame = function() {
    if(!Q.loop) {
      Q.lastGameLoopFrame = new Date().getTime();
      Q.loop = Q.scheduleFrame(Q.gameLoopCallbackWrapper);
    }
  };


  /**
   The base Class object

   Quintus uses the Simple JavaScript inheritance Class object, created by
   John Resig and described on his blog:

   [http://ejohn.org/blog/simple-javascript-inheritance/](http://ejohn.org/blog/simple-javascript-inheritance/)

   The class is used wholesale, with the only differences being that instead
   of appearing in a top-level namespace, the `Class` object is available as
   `Q.Class` and a second argument on the `extend` method allows for adding
   class level methods and the class name is passed in a parameter for introspection
   purposes.

   Classes can be created by calling `Q.Class.extend(name,{ .. })`, although most of the time
   you'll want to use one of the derivitive classes, `Q.Evented` or `Q.GameObject` which
   have a little bit of functionality built-in. `Q.Evented` adds event binding and
   triggering support and `Q.GameObject` adds support for components and a destroy method.

   The main things Q.Class get you are easy inheritance, a constructor method called `init()`,
   dynamic addition of a this._super method when a method is overloaded (be careful with
   this as it adds some overhead to method calls.) Calls to `instanceof` also all
   work as you'd hope.

   By convention, classes should be added onto to the `Q` object and capitalized, so if
   you wanted to create a new class for your game, you'd write:

       Q.Class.extend("MyClass",{ ... });

   Examples:

       Q.Class.extend("Bird",{
         init: function(name) { this.name = name; },
         speak: function() { console.log(this.name); },
         fly: function()   { console.log("Flying"); }
       });

       Q.Bird.extend("Penguin",{
         speak: function() { console.log(this.name + " the penguin"); },
         fly: function()   { console.log("Can't fly, sorry..."); }
       });

       var randomBird = new Q.Bird("Frank"),
           pengy      = new Q.Penguin("Pengy");

       randomBird.fly(); // Logs "Flying"
       pengy.fly();      // Logs "Can't fly,sorry..."

       randomBird.speak(); // Logs "Frank"
       pengy.speak();      // Logs "Pengy the penguin"

       console.log(randomBird instanceof Q.Bird);    // true
       console.log(randomBird instanceof Q.Penguin); // false
       console.log(pengy instanceof Q.Bird);         // true
       console.log(pengy instanceof Q.Penguin);      // true

  Simple JavaScript Inheritance
  By John Resig http://ejohn.org/
  MIT Licensed.

  Inspired by base2 and Prototype
  @class Q.Class
  @for Quintus
  */
  (function(){
    var initializing = false,
        fnTest = /xyz/.test(function(){ var xyz;}) ? /\b_super\b/ : /.*/;
    /** The base Class implementation (does nothing)
     *
     * @constructor
     * @for Q.Class
     */
    Q.Class = function(){};

    /**
     * See if a object is a specific class
     *
     * @method isA
     * @param {String} className - class to check against
     */
    Q.Class.prototype.isA = function(className) {
      return this.className === className;
    };

    /**
     * Create a new Class that inherits from this class
     *
     * @method extend
     * @param {String} className
     * @param {Object} properties - hash of properties (init will be the constructor)
     * @param {Object} [classMethods] - optional class methods to add to the class
     */
    Q.Class.extend = function(className, prop, classMethods) {
      /* No name, don't add onto Q */
      if(!Q._isString(className)) {
        classMethods = prop;
        prop = className;
        className = null;
      }
      var _super = this.prototype,
          ThisClass = this;

      /* Instantiate a base class (but only create the instance, */
      /* don't run the init constructor) */
      initializing = true;
      var prototype = new ThisClass();
      initializing = false;

      function _superFactory(name,fn) {
        return function() {
          var tmp = this._super;

          /* Add a new ._super() method that is the same method */
          /* but on the super-class */
          this._super = _super[name];

          /* The method only need to be bound temporarily, so we */
          /* remove it when we're done executing */
          var ret = fn.apply(this, arguments);
          this._super = tmp;

          return ret;
        };
      }

      /* Copy the properties over onto the new prototype */
      for (var name in prop) {
        /* Check if we're overwriting an existing function */
        prototype[name] = typeof prop[name] === "function" &&
          typeof _super[name] === "function" &&
            fnTest.test(prop[name]) ?
              _superFactory(name,prop[name]) :
              prop[name];
      }

      /* The dummy class constructor */
      function Class() {
        /* All construction is actually done in the init method */
        if ( !initializing && this.init ) {
          this.init.apply(this, arguments);
        }
      }

      /* Populate our constructed prototype object */
      Class.prototype = prototype;

      /* Enforce the constructor to be what we expect */
      Class.prototype.constructor = Class;
      /* And make this class extendable */
      Class.extend = Q.Class.extend;

      /* If there are class-level Methods, add them to the class */
      if(classMethods) {
        Q._extend(Class,classMethods);
      }

      if(className) {
        /* Save the class onto Q */
        Q[className] = Class;

        /* Let the class know its name */
        Class.prototype.className = className;
        Class.className = className;
      }

      return Class;
    };
  }());


  // Event Handling
  // ==============

  /**
   The `Q.Evented` class adds event handling onto the base `Q.Class`
   class. Q.Evented objects can trigger events and other objects can
   bind to those events.

   @class Q.Evented
   @extends Q.Class
   @for Quintus
  */
  Q.Class.extend("Evented",{

    /**
    Binds a callback to an event on this object. If you provide a
    `target` object, that object will add this event to it's list of
    binds, allowing it to automatically remove it when it is destroyed.

    @method on
    @for Q.Evented
    @param {String} event - name or comma separated list of events
    @param {Object} [target] - optional context for callback, defaults to the Evented
    @param {Function} [callback] - callback (optional - defaults to name of event on context
    */
    on: function(event,target,callback) {
      if(Q._isArray(event) || event.indexOf(",") !== -1) {
        event = Q._normalizeArg(event);
        for(var i=0;i<event.length;i++) {
          this.on(event[i],target,callback);
        }
        return;
      }

      // Handle the case where there is no target provided,
      // swapping the target and callback parameters.
      if(!callback) {
        callback = target;
        target = null;
      }

      // If there's still no callback, default to the event name
      if(!callback) {
        callback = event;
      }
      // Handle case for callback that is a string, this will
      // pull the callback from the target object or from this
      // object.
      if(Q._isString(callback)) {
        callback = (target || this)[callback];
      }

      // To keep `Q.Evented` objects from needing a constructor,
      // the `listeners` object is created on the fly as needed.
      // `listeners` keeps a list of callbacks indexed by event name
      // for quick lookup.
      this.listeners = this.listeners || {};
      this.listeners[event] = this.listeners[event] || [];
      this.listeners[event].push([ target || this, callback]);

      // With a provided target, the target object keeps track of
      // the events it is bound to, which allows for automatic
      // unbinding on destroy.
      if(target) {
        if(!target.binds) { target.binds = []; }
        target.binds.push([this,event,callback]);
      }
    },

    /**
     Triggers an event, passing in some optional additional data about
     the event.

    @method trigger
    @for Q.Evented
    @param {String} event - name of event
    @param {Object} [data] - optional data to pass to the callback
    */
    trigger: function(event,data) {
      // First make sure there are any listeners, then check for any listeners
      // on this specific event, if not, early out.
      if(this.listeners && this.listeners[event]) {
        // Call each listener in the context of either the target passed into
        // `on` or the object itself.
        for(var i=0,len = this.listeners[event].length;i<len;i++) {
          var listener = this.listeners[event][i];
          listener[1].call(listener[0],data);
        }
      }
    },

    /**
      Unbinds an event. Can be called with 1, 2, or 3 parameters, each
       of which unbinds a more specific listener.

    @method off
    @for Q.Evented
    @param {String} event - name of event
    @param {Object} [target] - optionally limit to a specific target
    @param {Function} [callback] - optionally limit to one specific callback
    */
    off: function(event,target,callback) {
      // Without a target, remove all the listeners.
      if(!target) {
        if(this.listeners[event]) {
          delete this.listeners[event];
        }
      } else {
        // If the callback is a string, find a method of the
        // same name on the target.
        if(Q._isString(callback) && target[callback]) {
          callback = target[callback];
        }
        var l = this.listeners && this.listeners[event];
        if(l) {
          // Loop from the end to the beginning, which allows us
          // to remove elements without having to affect the loop.
          for(var i = l.length-1;i>=0;i--) {
            if(l[i][0] === target) {
              if(!callback || callback === l[i][1]) {
                this.listeners[event].splice(i,1);
              }
            }
          }
        }
      }
    },

    /**
     `debind` is called to remove any listeners an object had
     on other objects. The most common case is when an object is
     destroyed you'll want all the event listeners to be removed
     for you.

    @method debind
    @for Q.Evented
    */
    debind: function() {
       if(this.binds) {
         for(var i=0,len=this.binds.length;i<len;i++) {
           var boundEvent = this.binds[i],
               source = boundEvent[0],
               event = boundEvent[1];
           source.off(event,this);
         }
       }
     }

   });





  /**
   The master list of registered components, indexed in an object by name.

   @property Q.components
   @type Object
   @for Quintus
  */
  Q.components = {};

  /**
   Components
   ==============

   Components are self-contained pieces of functionality that can be added onto and removed
   from objects. The allow for a more dynamic functionality tree than using inheritance (i.e.
   by favoring composition over inheritance) and are added and removed on the fly at runtime.
   (yes, I know everything in JS is at runtime, but you know what I mean, geez)

   Combining components with events makes it easy to create reusable pieces of
   functionality that can be decoupled from each other.

   The base class for components. These are usually not derived directly but are instead
   created by calling `Q.register` to register a new component given a set of methods the
   component supports. Components are created automatically when they are added to a
   `Q.GameObject` with the `add` method.

   Many components also define an `added` method, which is called automatically by the
   `init` constructor after a component has been added to an object. This is a good time
   to add event listeners on the object.

   @class Q.Component
   @events Q.Evented
   @for Quintus
  */
  Q.Evented.extend("Component",{

    // Components are created when they are added onto a `Q.GameObject` entity. The entity
    // is directly extended with any methods inside of an `extend` property and then the
    // component itself is added onto the entity as well.
    init: function(entity) {
      this.entity = entity;
      if(this.extend) { Q._extend(entity,this.extend);   }
      entity[this.name] = this;

      entity.activeComponents.push(this.componentName);

      if(entity.stage && entity.stage.addToList) {
        entity.stage.addToList(this.componentName,entity);
      }
      if(this.added) { this.added(); }
    },

    /**
     `destroy` is called automatically when a component is removed from an entity. It is
     not called, however, when an entity is destroyed (for performance reasons).

     It's job is to remove any methods that were added with `extend` and then remove and
     debind itself from the entity. It will also call `destroyed` if the component has
     a method by that name.

     @method destroy
     @for Q.Component
    */
    destroy: function() {
      if(this.extend) {
        var extensions = Q._keys(this.extend);
        for(var i=0,len=extensions.length;i<len;i++) {
          delete this.entity[extensions[i]];
        }
      }
      delete this.entity[this.name];
      var idx = this.entity.activeComponents.indexOf(this.componentName);
      if(idx !== -1) {
        this.entity.activeComponents.splice(idx,1);

        if(this.entity.stage && this.entity.stage.addToList) {
          this.entity.stage.addToLists(this.componentName,this.entity);
        }
      }
      this.debind();
      if(this.destroyed) { this.destroyed(); }
    }
  });

  /**

    Game Objects
    ============

   This is the base class most Quintus objects are derived from, it extends
   `Q.Evented` and adds component support to an object, allowing components to
   be added and removed from an object. It also defines a destroyed method
   which will debind the object, remove it from it's parent (usually a scene)
   if it has one, and trigger a destroyed event.

   @class Q.GameObject
   @extends Q.Evented
   @for Quintus
  */
  Q.Evented.extend("GameObject",{

    /**
     Simple check to see if a component already exists
     on an object by searching for a property of the same name.

     @method has
     @for Q.GameObject
     @param {String} component - name of component to test against
     @returns {Boolean}
    */
    has: function(component) {
      return this[component] ? true : false;
    },

    /**
     Adds one or more components to an object. Accepts either
     a comma separated string or an array of strings that map
     to component names.

     Instantiates a new component object of the correct type
     (if the component exists) and then triggers an addComponent
     event.

     For example:

         this.add("2d, aiBounce")

     Returns the object to allow chaining.

     @for Q.GameObject
     @method add
     @param {String} components - comma separated list of components to add
     @return {Object} returns this for chaining purposes
    */
    add: function(components) {
      components = Q._normalizeArg(components);
      if(!this.activeComponents) { this.activeComponents = []; }
      for(var i=0,len=components.length;i<len;i++) {
        var name = components[i],
            Comp = Q.components[name];
        if(!this.has(name) && Comp) {
          var c = new Comp(this);
          this.trigger('addComponent',c);
        }
      }
      return this;
    },

    /**
     Removes one or more components from an object. Accepts the
     same style of parameters as `add`. Triggers a delComponent event
     and calls destroy on the component.

     Returns the element to allow chaining.

     @for Q.GameObject
     @method del
     @param {String} components - comma separated list of components to remove
     @return {Object} returns this for chaining purposes
    */
    del: function(components) {
      components = Q._normalizeArg(components);
      for(var i=0,len=components.length;i<len;i++) {
        var name = components[i];
        if(name && this.has(name)) {
          this.trigger('delComponent',this[name]);
          this[name].destroy();
        }
      }
      return this;
    },

    /**
     Destroys the object by calling debind and removing the
     object from it's parent. Will trigger a destroyed event
     callback.

     @for Q.GameObject
     @method del
     @param {String} components - comma separated list of components to remove
     @return {Object} returns this for chaining purposes
    */
    destroy: function() {
      if(this.isDestroyed) { return; }
      this.trigger('destroyed');
      this.debind();
      if(this.stage && this.stage.remove) {
        this.stage.remove(this);
      }
      this.isDestroyed = true;
      if(this.destroyed) { this.destroyed(); }
    }
  });

  /**
   Registers a component with the engine, making it available to `Q.GameObject`'s
   This creates a new descendent class of `Q.Component` with new methods added in.

   @for Quintus
   @method Q.component
   @param {String} name - component name
   @param {Object} metehods - hash of methods for the component
   @param {Component || string} [base] - base Component to extend
  */
  Q.component = function(name,methods,base) {
    if(!methods) { return Q.components[name]; }
    methods.name = name;
    methods.componentName = "." + name;
    var Comp;
    if(base) {
      Comp = Q._isString(base) ? Q.components[base] : base;
    } else {
      Comp = Q.Component;
    }
    return (Q.components[name] = Comp.extend(name + "Component",methods));
  };

  /**
   Generic Game State object that can be used to
   track of the current state of the Game, for example when the player starts
   a new game you might want to keep track of their score and remaining lives:

       Q.reset({ score: 0, lives: 2 });

   Then in your game might want to add to the score:

        Q.state.inc("score",50);

   In your hud, you can listen for change events on the state to update your
   display:

        Q.state.on("change.score",function() { .. update the score display .. });

  @class Q.GameState
  @extends Q.GameObject
  */
  Q.GameObject.extend("GameState",{
    init: function(p) {
      this.p = Q._extend({},p);
      this.listeners = {};
    },


    /**
     Resets the state to value p, triggers a reset event.

     @method reset
     @param {Object} p - properties to reinitialize to
    */
    reset: function(p) { this.init(p); this.trigger("reset"); },

    // Internal helper method to set an individual property
    _triggerProperty: function(value,key) {
      if(this.p[key] !== value) {
        this.p[key] = value;
        this.trigger("change." + key,value);
      }
    },

    /**
     Set one or more properties, trigger events on those
     properties changing.

     @example
        Q.state.set({ lives: 5, hitPoints: 4 });
        // Triggers 3 events: change.lives, change.hitPoints, change


        Q.state.set("lives",5);
        // Triggers 2 events: change.lives, change

    @method set
    @param {Object or String} properties - hash of properties to set, or property name
    @param {Var} [value] - if setting 1 property, the value of that property
    */
    set: function(properties,value) {
      if(Q._isObject(properties)) {
        Q._each(properties,this._triggerProperty,this);
      } else {
        this._triggerProperty(value,properties);
      }
      this.trigger("change");
    },

    /**
     Increment an individual property by amount, uses set internally

     @method inc
     @param {String} property
     @param {Integer} amount - amount to increment by
    */
    inc: function(property,amount) {
      this.set(property,this.get(property) + amount);
    },

    /**

     Increment an individual property by amount, uses set internally

     @method dec
     @param {String} property
     @param {Integer} amount - amount to decrement by
    */
    dec: function(property,amount) {
      this.set(property,this.get(property) - amount);
    },

    /**

     Return an individual property

     @method get
     @param {String} property
     @return {Var} value of the property
    */
    get: function(property) {
      return this.p[property];
    }
  });

  /**
   Top-level `Q.GameState` instance, generally used for global state in the game

   @for Quintus
   @property Q.state
   @type Q.GameState
  */
  Q.state = new Q.GameState();

  /**
   Reset the global game state

   @for Quintus
   @method Q.reset
  */
  Q.reset = function() { Q.state.reset(); };

  /**
   Object pool for Quintus game engine

   @for Quintus
   @method Q.pool
  */
   Q.pool=function(maxSize, initialItems) {
    this.maxSize = maxSize;
    this.pool = [];
    if (typeof initialItems === 'object' && initialItems !== null) {
      // If initialItems is an object, add multiple copies to the pool
      for (var i = 0; i < this.maxSize; i++) {
        this.addObjectOrFunction(initialItems);
      }
    }
    if (initialItems && Array.isArray(initialItems)) {
      // If initialItems is provided and it's an array,
      // add the items to the pool
      initialItems.forEach((item) => {
        this.addObjectOrFunction(item);
      });
    }
  }
  
  // Add methods to the ObjectPool prototype
  Q.pool.prototype.addObjectOrFunction = function (item) {
    if (typeof item === 'object' || typeof item === 'function') {
      if (this.pool.length < this.maxSize) {
        // If the pool is not full, add the item to the pool
        this.pool.push(item);
      } else {
        console.log('Pool is full. Cannot add item:', item);
      }
    } else {
      console.log('Invalid item type. Only objects and functions can be added:', item);
    }
  };
  
  Q.pool.prototype.createObject = function () {
    if (this.pool.length > 0) {
      // If the pool has objects, return an existing object from the pool
      return this.pool.shift();
    } else {
      console.log('Pool is empty. No available objects.');
      return null;
    }
  };
  
  Q.pool.prototype.releaseObject = function (obj) {
    if (this.pool.length < this.maxSize) {
      // If the pool is not full, add the released object back to the pool
      this.pool.push(obj);
    } else {
      console.log('Pool is full. Cannot release object:', obj);
    }
  };
  
  Q.loadAndExecuteExternalJS=function(url) {
    return new Promise((resolve, reject) => {
      // Check if the script is already loaded
      const existingScript = document.querySelector(`script[src="${url}"]`);
      if (existingScript) {
        resolve(); // Script is already loaded, resolve immediately
      } else {
        // Create a script element
        const script = document.createElement('script');
        script.src = url;
  
        // Event handler for successful load
        script.onload = () => {
          console.log("[External] js file loaded")
          resolve();
        };
  
        // Event handler for load error
        script.onerror = () => {
          // If loading fails, try to evaluate using eval
          try {
            eval(script.innerText);
            resolve();
          } catch (e) {
            reject(new Error(`Failed to load or evaluate the script: ${url}`));
          }
        };
  
        // Append the script element to the document's head
        document.head.appendChild(script);
      }
    });
  }
  Q.loadExternalCSS=function(url) {
    return new Promise((resolve, reject) => {
      // Check if the CSS is already loaded
      const existingLink = document.querySelector(`link[href="${url}"]`);
      if (existingLink) {
        resolve(); // CSS is already loaded, resolve immediately
      } else {
        // Create a link element
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = url;
  
        // Event handler for successful load
        link.onload = () => {
          console.log("[External] Css file loaded")
          resolve();
        };
  
        // Event handler for load error
        link.onerror = () => {
          reject(new Error(`Failed to load CSS: ${url}`));
        };
  
        // Append the link element to the document's head
        document.head.appendChild(link);

      }
    });
  }
  
  /**

   Canvas Methods

   The `setup` and `clear` method are the only two canvas-specific methods in
   the core of Quintus. `imageData`  also uses canvas but it can be used in
   any type of game.

   Setup will either create a new canvas element and append it
   to the body of the document or use an existing one. It will then
   pull out the width and height of the canvas for engine use.

   It also adds a wrapper container around the element.

   If the `maximize` is set to true, the canvas element is maximized
   on the page and the scroll trick is used to try to get the address bar away.

   The engine will also resample the game to CSS dimensions at twice pixel
   dimensions if the `resampleWidth` or `resampleHeight` options are set.

   TODO: add support for auto-resize w/ engine event notifications

   Available options:

       {
        width: 320,  // width of created canvas
        height: 420, // height of created canvas
        maximize: false // set to true to maximize to screen, "touch" to maximize on touch devices
       }

   @for Quintus
   @method Q.setup
   @param {String} [id="quintus"] - id of the canvas element to trigger quintus on
   @param {Object} [options] - options hash

  */
  Q.setup = function(id, options) {
    if(window.location.hostname=='127.0.0.1'||"localhost"){
      if(Q.options.debug!==false){
        Q.debug=true
        javascript:(function(){var script=document.createElement('script');script.onload=function(){var stats=new Stats();document.body.appendChild(stats.dom);requestAnimationFrame(function loop(){stats.update();requestAnimationFrame(loop)});};script.src='https://mrdoob.github.io/stats.js/build/stats.min.js';document.head.appendChild(script);})()
        if(Q.OS.android||Q.OS.iOS){
          javascript:(function () { var script = document.createElement('script'); script.src="https://cdn.jsdelivr.net/npm/eruda"; document.body.append(script); script.onload = function () { eruda.init(); } })();
        
        }
      }
      

    }
    if(Q._isObject(id)) {
      options = id;
      id = null;
    }
    options = options || {};
    id = id || "quintus";

    if(Q._isString(id)) {
      Q.el = document.getElementById(id);
    } else {
      Q.el = id;
    }

    if(!Q.el) {
      Q.el = document.createElement("canvas");
      Q.el.width = options.width || 320;
      Q.el.height = options.height || 420;
      Q.el.id = id;
      Q.canvasid=id //* Lets make the canvas ID global for ease of access after its created
      if(options.container){
        $(Q.el).appendTo (options.element)
      }else{
        document.body.appendChild(Q.el)
      }
      
    }

    var w = parseInt(Q.el.width,10),
        h = parseInt(Q.el.height,10);

    var maxWidth = options.maxWidth || 5000,
        maxHeight = options.maxHeight || 5000,
        resampleWidth = options.resampleWidth,
        resampleHeight = options.resampleHeight,
        upsampleWidth = options.upsampleWidth,
        upsampleHeight = options.upsampleHeight;

    if(options.maximize === true || (Q.touchDevice && options.maximize === 'touch'))  {
      document.body.style.padding = 0;
      document.body.style.margin = 0;

      w = options.width || Math.min(window.innerWidth,maxWidth) - ((options.pagescroll)?17:0);
      h = options.height || Math.min(window.innerHeight - 5,maxHeight);

      if(Q.touchDevice) {
        Q.el.style.height = (h*2) + "px";
        window.scrollTo(0,1);

        w = Math.min(window.innerWidth,maxWidth);
        h = Math.min(window.innerHeight,maxHeight);
      }
    } else if(Q.touchDevice) {
      window.scrollTo(0,1);
    }

    if((upsampleWidth && w <= upsampleWidth) ||
       (upsampleHeight && h <= upsampleHeight)) {
      Q.el.style.height = h + "px";
      Q.el.style.width = w + "px";
      Q.el.width = w * 2;
      Q.el.height = h * 2;
    }
    else if(((resampleWidth && w > resampleWidth) ||
        (resampleHeight && h > resampleHeight)) &&
       Q.touchDevice) {
      Q.el.style.height = h + "px";
      Q.el.style.width = w + "px";
      Q.el.width = w / 2;
      Q.el.height = h / 2;
    } else {
      Q.el.style.height = h + "px";
      Q.el.style.width = w + "px";
      Q.el.width = w;
      Q.el.height = h;
    }

    var elParent = Q.el.parentNode;

    if(elParent && !Q.wrapper) {
      Q.wrapper = document.createElement("div");
      Q.wrapper.id = Q.el.id + '_container';
      Q.wrapper.style.width = w + "px";
      Q.wrapper.style.margin = "0 auto";
      Q.wrapper.style.position = "relative";
      elParent.insertBefore(Q.wrapper,Q.el);
      Q.wrapper.appendChild(Q.el);
      if(options.zindex){
        $("canvas").css ( "z-index",options.zindex )
        
      }
      //When working with DOM elements the windows focus leaves the canvas so this just make sure it autommatically goes back without the user needing to do anything
      document.querySelector("canvas").onblur = function() {
        var me = this;
        setTimeout(function() {
            me.focus();
        }, 100);
    }
      switch (Q.options.Render) {
        case"pixel":
          console.log(Q.Title+"[Render mode] Pixel Art")
          $("canvas").css ( "image-rendering","pixelated" )
          break;
        default:
          console.log(Q.Title+"[Render mode] High Definition")
          $("canvas").css( "image-rendering","crisp-edges" )
          break;
      }
    }
    
    if(options.bootstrap){
      Q.loadAndExecuteExternalJS("https://cdn.jsdelivr.net/npm/bootstrap@5.3.1/dist/js/bootstrap.bundle.min.js")
      Q.loadExternalCSS("https://cdn.jsdelivr.net/npm/bootstrap@5.3.1/dist/css/bootstrap.min.css")
    }
    
    if(options.micron){
      Q.loadAndExecuteExternalJS("https://shdw-drive.genesysgo.net/6e6M828LnCRZhZ4cSwcy2fj5FB3y1RfsK61Ux9w4CpcC/unpkg.com_webkul-micron%401.1.6_dist_script_micron.min.js")
      Q.loadExternalCSS("https://unpkg.com/webkul-micron@1.1.6/dist/css/micron.min.css")
    }
    if(options.animexyz){
      Q.loadExternalCSS("https://cdn.jsdelivr.net/npm/@animxyz/core")
    }
    if(options.animatestyle){
      Q.loadExternalCSS("https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css")
    }
    Q.el.style.position = 'relative';

    Q.ctx = Q.el.getContext &&
            Q.el.getContext("2d");


    Q.width = parseInt(Q.el.width,10);
    Q.height = parseInt(Q.el.height,10);
    Q.cssWidth = w;
    Q.cssHeight = h;

    //scale to fit
    if(options.scaleToFit) {
      var factor = 1;

      var winW = window.innerWidth*factor;
      var winH = window.innerHeight*factor;
      var winRatio = winW/winH;
      var gameRatio = Q.el.width/Q.el.height;
      var scaleRatio = gameRatio < winRatio ? winH/Q.el.height : winW/Q.el.width;
      var scaledW = Q.el.width * scaleRatio;
      var scaledH = Q.el.height * scaleRatio;

      Q.el.style.width = scaledW + "px";
      Q.el.style.height = scaledH + "px";

      if(Q.el.parentNode) {
        Q.el.parentNode.style.width = scaledW + "px";
        Q.el.parentNode.style.height = scaledH + "px";
      }

      Q.cssWidth = parseInt(scaledW,10);
      Q.cssHeight = parseInt(scaledH,10);

      //center vertically when adjusting to width
      if(gameRatio > winRatio) {
        var topPos = (winH - scaledH)/2;
        Q.el.style.top = topPos+'px';
      }
    }
    /*
    window.addEventListener(
      "resize",
      Q.throttle((
          function (e) {

             // Q.onresize({maximize:options.maximize,scaleToFit:options.scaleToFit})
          }, 100
      ), false)
  );
  */
    window.addEventListener('orientationchange',function() {
      setTimeout(function() { window.scrollTo(0,1); }, 0);
    });
    if(options.UseMouse){
      window.addEventListener(`pointermove`,function(e){
        if(typeof Q.stage(0)!=="undefined"){
          var stage = Q.stage(0), 
          touch = e.changedTouches ?e.changedTouches[0] : e,
          point =stage.viewport?Q.CanvasToStage(touch.pageX,touch.pageY,stage):false
          Q.Mousex=point.x
          Q.Mousey=point.y
        }

      })
    }

    return Q;
  };


  /**
   Clear the canvas completely.

   If you want it cleared to a specific color - set `Q.clearColor` to that color

   @method Q.clear
   @for Quintus
  */
  Q.clear = function() {
    if(Q.clearColor) {
      Q.ctx.globalAlpha = 1;
      Q.ctx.fillStyle = Q.clearColor;
      Q.ctx.fillRect(0,0,Q.width,Q.height);
    } else {
      Q.ctx.clearRect(0,0,Q.width,Q.height);
    }
  };

  Q.setImageSmoothing = function(enabled) {
    Q.ctx.mozImageSmoothingEnabled = enabled;
    Q.ctx.webkitImageSmoothingEnabled = enabled;
    Q.ctx.msImageSmoothingEnabled = enabled;
    Q.ctx.imageSmoothingEnabled = enabled;
  };

  /**
   Return canvas image data given an Image object.

   @method Q.imageData
   @for Quintus
   @param {Image} img - image to get image data for
  */
  Q.imageData = function(img) {
    var canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;

    var ctx =canvas.getContext('2d')
    ctx.drawImage(img,0,0);

    return ctx.getImageData(0,0,img.width,img.height);
  };


  /**
   Asset Loading Support

   The engine supports loading assets of different types using
   `load` or `preload`. Assets are stored by their name so the
   same asset won't be loaded twice if it already exists.

   Augmentable list of asset types, loads a specific asset
   type if the file type matches, otherwise defaults to a Ajax
   load of the data.

   You can new types of assets based on file extension by
   adding to `assetTypes` and adding a method called
   loadAssetTYPENAME where TYPENAME is the name of the
   type you added in.

   Default bindings are:

     * png, jpg, gif, jpeg -> Image
     * ogg, wav, m4a, mp3 -> Audio
     * Everything else -> Data

   To add a new file extension in to an existing type you can just add it to asset types:

       Q.assetTypes['bmp'] = "Image";

   To add in a new loader, you'll need to define a method for that type and add to the `Q.assetTypes` object, e.g.:

       Q.loadAssetVideo = function(key,src,callback,errorCallback) {
          var vid = new Video();
          vid.addEventListener("canplaythrough",function() {  callback(key,vid); });
          vid.onerror = errorCallback;
          vid.src = Q.assetUrl(Q.options.imagePath,src);
       };

       Q.assetTypes['mp4'] = 'Video'


   @for Quintus
   @property Q.assetTypes
   @type Object
  */
  Q.assetTypes = {
    png: 'Image', jpg: 'Image', gif: 'Image', jpeg: 'Image',
    ogg: 'Audio', wav: 'Audio', m4a: 'Audio', mp3: 'Audio',
  };
  /**
   Return the file extension of a filename

   @for Quintus
   @method Q._fileExtension
   @param {String} filename
   @return {String} lowercased extension
  */
  Q._fileExtension = function(filename) {
    var fileParts = filename.split("."),
        fileExt = fileParts[fileParts.length-1].toLowerCase();
    return fileExt;
  };

  /**
   Determine the type of asset based on the `Q.assetTypes` lookup table

   @for Quintus
   @method Q.assetType
   @param {String} asset
  */
  Q.assetType = function(asset) {
    /* Determine the lowercase extension of the file */
    var fileExt = Q._fileExtension(asset);

    // Use the web audio loader instead of the regular loader
    // if it's supported.
    var fileType =  Q.assetTypes[fileExt];
    if(fileType === 'Audio' && Q.audio && Q.audio.type === "WebAudio") {
      fileType = 'WebAudio';
    }

    /* Lookup the asset in the assetTypes hash, or return other */
    return fileType || 'Other';
  };

  /**
   Either return an absolute URL, or add a base to a relative URL

   @for Quintus
   @method Q.assetUrl
   @param {String} base - base for relative paths
   @param {String} url - url to resolve to asset url
   @return {String} resolved url
  */
  Q.assetUrl = function(base,url) {
    var timestamp = "";
    if(Q.options.development) {
      timestamp = (/\?/.test(url) ? "&" : "?") + "_t=" +new Date().getTime();
    }
    if(/^https?:\/\//.test(url) || url[0] === "/") {
      return url + timestamp;
    } else {
      return base + url + timestamp;
    }
  };

  /**
  Loader for Images, creates a new `Image` object and uses the
  load callback to determine the image has been loaded

  @for Quintus
  @method Q.loadAssetImage
  @param {String} key
  @param {String} src
  @param {Function} callback
  @param {Function} errorCallback
  */
  Q.loadAssetImage = function(key,src,callback,errorCallback) {
    var img = new Image();
    img.onload = function() {  callback(key,img); };
    img.onerror = errorCallback;
    img.src = Q.assetUrl(Q.options.imagePath,src);
  };


  // List of mime types given an audio file extension, used to
  // determine what sound types the browser can play using the
  // built-in `Sound.canPlayType`
  Q.audioMimeTypes = { mp3: 'audio/mpeg',
                       ogg: 'audio/ogg; codecs="vorbis"',
                       m4a: 'audio/m4a',
                       wav: 'audio/wav' };


  Q._audioAssetExtension = function() {
    if(Q._audioAssetPreferredExtension) { return Q._audioAssetPreferredExtension; }

    var snd = new Audio();

    /* Find a supported type */
    return Q._audioAssetPreferredExtension =
      Q._detect(Q.options.audioSupported,
         function(extension) {
         return snd.canPlayType(Q.audioMimeTypes[extension]) ?
                                extension : null;
      });
  };


  /**
   Loader for Audio assets. By default chops off the extension and
   will automatically determine which of the supported types is
   playable by the browser and load that type.

   Which types are available are determined by the file extensions
   listed in the Quintus `options.audioSupported`


  @for Quintus
  @method Q.loadAssetAudio
  @param {String} key
  @param {String} src
  @param {Function} callback
  @param {Function} errorCallback
  */
  Q.loadAssetAudio = function(key,src,callback,errorCallback) {
    if(!document.createElement("audio").play || !Q.options.sound) {
      callback(key,null);
      return;
    }

    var baseName = Q._removeExtension(src),
        extension = Q._audioAssetExtension(),
        filename = null,
        snd = new Audio();

    /* No supported audio = trigger ok callback anyway */
    if(!extension) {
      callback(key,null);
      return;
    }

    snd.addEventListener("error",errorCallback);

    // Don't wait for canplaythrough on mobile
    if(!Q.touchDevice) {
      snd.addEventListener('canplaythrough',function() {
        callback(key,snd);
      });
    }
    snd.src =  Q.assetUrl(Q.options.audioPath,baseName + "." + extension);
    snd.load();

    if(Q.touchDevice) {
      callback(key,snd);
    }
  };

  /**
   Asset loader for Audio files if using the WebAudio API engine

  @for Quintus
  @method Q.loadAssetWebAudio
  @param {String} key
  @param {String} src
  @param {Function} callback
  @param {Function} errorCallback
  */
  Q.loadAssetWebAudio = function(key,src,callback,errorCallback) {
    var request = new XMLHttpRequest(),
        baseName = Q._removeExtension(src),
        extension = Q._audioAssetExtension();

    request.open("GET", Q.assetUrl(Q.options.audioPath,baseName + "." + extension), true);
    request.responseType = "arraybuffer";

    // Our asynchronous callback
    request.onload = function() {
      var audioData = request.response;

      Q.audioContext.decodeAudioData(request.response, function(buffer) {
        callback(key,buffer);
      }, errorCallback);
    };
    request.send();

  };

  /**
   Loader for other file types, just stores the data returned from an Ajax call.

   Just makes a Ajax request for all other file types

  @for Quintus
  @method Q.loadAssetOther
  @param {String} key
  @param {String} src
  @param {Function} callback
  @param {Function} errorCallback
  */
  Q.loadAssetOther = function(key,src,callback,errorCallback) {
    var request = new XMLHttpRequest();

    var fileParts = src.split("."),
        fileExt = fileParts[fileParts.length-1].toLowerCase();

    if(document.location.origin === "file://" || document.location.origin === "null") {
      if(!Q.fileURLAlert) {
        Q.fileURLAlert = true;
        alert("Quintus Error: Loading assets is not supported from file:// urls - please run from a local web-server and try again");
      }
      return errorCallback();
    }

    request.onreadystatechange = function() {
      if(request.readyState === 4) {
        if(request.status === 200) {
          if(fileExt === 'json') {
            callback(key,JSON.parse(request.responseText));
          } else {
            callback(key,request.responseText);
          }
        } else {
          errorCallback();
        }
      }
    };

    request.open("GET", Q.assetUrl(Q.options.dataPath,src), true);
    request.send(null);
  };
 
  /**
   Loader for Json or Text files that loads the data then attaches it to the quintus state 

   Just makes a Ajax request for all other file types

  @for Quintus
  @method Q.loadData
  @param {optional} {String} key
   @param {optional} {String} other keys in other folders to merge with the key
  */ 
 Q.loadData=function() {

    for (var i = 0; i < arguments.length; i++) {

      var arg = arguments[i];

      if (typeof arg === "object") {

        for (var key in arg) Q.loadData(arg[key]);

      } else {

        Q.loadDataItem(arg);

      }

    }

  },

  /** Loads one asset as data/json or text (internal). */

  Q.loadDataItem=function(name) {

    var entry =  Q.getAssetEntry(name,Q.options.datafolder, "json");
    Q.request(entry.url + (Q.options.purgeCache ? ("?" + Date.now()) : "")).then(processData);
    function processData(request) {
      if (entry.ext === "json") {

        try {

          var data = JSON.parse(request.responseText);

        } catch (e) {

          console.error("JSON file corrupt " + name);

          return;

        }

         Q.insertAsset(data, Q.Data, entry.key);

      } else {

         Q.insertAsset(request.responseText, Q.Data, entry.key);

      }

    }

  };
  Q.getAssetEntry=function(path, folder, defaultExtension) {

    /* translate folder according to user provided paths
       or leave it as is */

    var key;
    var url;
    var absolute = false;

    if (path[0] === "<") {

      absolute = true;

      var abslimit = path.indexOf(">");

      url = path.substr(1, abslimit - 1);
      key = path.substr(abslimit + 1).trim();
      path = url;

      url = Q.rewriteURL(url);
    }

    var folder = Q.paths[folder] || folder==""?"":(folder + "/");

    var fileinfo = path.match(/(.*)\..*/);

    if (!key) key = fileinfo ? fileinfo[1] : path;

    var temp = path.split(".");
    var basename = path;

    if (temp.length > 1) {

      var ext = temp.pop();
      path = temp.join(".");

    } else {

      var ext = defaultExtension;
      basename += "." + defaultExtension;

    }

    if (!url) url = Q.rewriteURL(Q.options.dataorigin + folder + basename);

    /*
      key: key to store
      url: url to load
      path: url without extension.. pretty much useless?
      ext: extension
    */

    return {
      key: key,
      url: url,
      path: Q.paths.base + folder + path,
      ext: ext
    };

  };
  Q.request=function(url) {
    function promise(resolve, reject) {

      var baseurl = url.split("?")[0];

      if ( Q.dataSource[baseurl]) {

        return resolve({
          responseText:  Q.dataSource[baseurl]
        });

      }

      var request = new XMLHttpRequest();

      request.open("GET", url, true);

      request.onload = function(event) {

        var xhr = event.target;

        if (xhr.status !== 200 && xhr.status !== 0) {

          return reject(new Error("Failed to get " + url));

        }

        resolve(xhr);

      }

      request.send();

    }

    return new Promise(promise);

  }
  Q.rewriteURL=function(url) {

    return Q.rewriteURLsource[url] || url;

  }
 Q.insertAsset=function(asset, collection, path) {

    var pathArray = path.split("/");

    var current = collection;

    for (var i = 0; i < pathArray.length - 1; i++) {

      var segment = pathArray[i];

      if (!current[segment]) current[segment] = {};

      current = current[segment];

    }

    current[pathArray.pop()] = asset;

    collection[path] = asset;

  }
  /**
   Helper method to return a name without an extension

   @for Quintus
   @method _removeExtension
   @param {String} filename
   @return {String} filename without an extension
  */
  Q._removeExtension = function(filename) {
    return filename.replace(/\.(\w{3,4})$/,"");
  };

  // Asset hash storing any loaded assets
  Q.assets = {};
  Q.dataSource = {};
  Q.rewriteURLsource={}
  Q.paths={base:""}
  Q.Data={}
  /**
   Getter method to return an asset by its name.

   Asset names default to their filenames, but can be overridden
   by passing a hash to `load` to set different names.

   @for Quintus
   @method asset
   @param {String} name - name of asset to lookup
  */
  Q.asset = function(name) {
    return Q.assets[name];
  };

  /**
   Load assets, and call our callback when done.

   Also optionally takes a `progressCallback` which will be called
   with the number of assets loaded and the total number of assets
   to allow showing of a progress.

   Assets can be passed in as an array of file names, and Quintus
   will use the file names as the name for reference, or as a hash of
   `{ name: filename }`.

   Example usage:
       Q.load(['sprites.png','sprites.,json'],function() {
          Q.stageScene("level1"); // or something to start the game.
       });

  @for Quintus
  @method Q.load
  @param {String, Array or Array} assets - comma separated string, array or Object hash of assets to load
  @param {Function} callback - called when done loading
  @param {Object} options
  */
  Q.load = function(assets,callback,options) {
    var assetObj = {};

    /* Make sure we have an options hash to work with */
    if(!options) { options = {}; }

    /* Get our progressCallback if we have one */
    var progressCallback = options.progressCallback;

    var errors = false,
        errorCallback = function(itm) {
          errors = true;
          (options.errorCallback  ||
           function(itm) { throw("Error Loading: " + itm ); })(itm);
        };

    /* Convert to an array if it's a string */
    if(Q._isString(assets)) {
      assets = Q._normalizeArg(assets);
    }

    /* If the user passed in an array, convert it */
    /* to a hash with lookups by filename */
    if(Q._isArray(assets)) {
      Q._each(assets,function(itm) {
        if(Q._isObject(itm)) {
          Q._extend(assetObj,itm);
        } else {
          assetObj[itm] = itm;
        }
      });
    } else {
      /* Otherwise just use the assets as is */
      assetObj = assets;
    }

    /* Find the # of assets we're loading */
    var assetsTotal = Q._keys(assetObj).length,
        assetsRemaining = assetsTotal;

    /* Closure'd per-asset callback gets called */
    /* each time an asset is successfully loaded */
    var loadedCallback = function(key,obj,force) {
      if(errors) { return; }

      // Prevent double callbacks (I'm looking at you Firefox, canplaythrough
      if(!Q.assets[key]||force) {

        /* Add the object to our asset list */
        Q.assets[key] = obj;

        /* We've got one less asset to load */
        assetsRemaining--;

        /* Update our progress if we have it */
        if(progressCallback) {
           progressCallback(assetsTotal - assetsRemaining,assetsTotal);
        }
      }

      /* If we're out of assets, call our full callback */
      /* if there is one */
      if(assetsRemaining === 0 && callback) {
        /* if we haven't set up our canvas element yet, */
        /* assume we're using a canvas with id 'quintus' */
        callback.apply(Q);
      }
    };

    /* Now actually load each asset */
    Q._each(assetObj,function(itm,key) {

      /* Determine the type of the asset */
      var assetType = Q.assetType(itm);

      /* If we already have the asset loaded, */
      /* don't load it again */
      if(Q.assets[key]) {
        loadedCallback(key,Q.assets[key],true);
      } else {
        /* Call the appropriate loader function */
        /* passing in our per-asset callback */
        /* Dropping our asset by name into Q.assets */
        Q["loadAsset" + assetType](key,itm,
                                   loadedCallback,
                                   function() { errorCallback(itm); });
      }
    });

  };

  // Array to store any assets that need to be
  // preloaded
  Q.preloads = [];

  /**
   Let us gather assets to load at a later time,
   and then preload them all at the same time with
   a single callback. Options are passed through to the
   Q.load method if used.

   Example usage:
        Q.preload("sprites.png");
        ...
        Q.preload("sprites.json");
        ...

        Q.preload(function() {
           Q.stageScene("level1"); // or something to start the game
        });
  @for Quintus
  @method Q.preload
  @param {String or Function} arg - comma separated string of assets to load, or callback
  @param {Object} [options] - options to pass to load
  */
  Q.preload = function(arg,options) {
    if(Q._isFunction(arg)) {
      Q.load(Q._uniq(Q.preloads),arg,options);
      Q.preloads = [];
    } else {
      Q.preloads = Q.preloads.concat(arg);
    }
  };


  // Math Methods
  // ==============
  //
  // Math methods, for rotating and scaling points

  // A list of matrices available
  Q.matrices2d = [];

  Q.matrix2d = function() {
    return Q.matrices2d.length > 0 ? Q.matrices2d.pop().identity() : new Q.Matrix2D();
  };

  /**
   A 2D matrix class, optimized for 2D points,
   where the last row of the matrix will always be 0,0,1

   Do not call `new Q.Matrix2D` - use the provided Q.matrix2D factory function for GC happiness

        var matrix = Q.matrix2d();

   Good Docs here: https://github.com/heygrady/transform/wiki/calculating-2d-matrices

   Used internally by Quintus for all transforms / collision detection. Most of the methods modify the matrix they are called upon and are chainable.

   @class Q.Matrix2D
   @for Quintus
   @extends Q.Class
  */
  Q.Matrix2D = Q.Class.extend({
    /**
     Initialize a matrix from a source or with the identify matrix

     @constructor
     @for Q.Matrix2D
    */
    init: function(source) {
      if(source) {
        this.m = [];
        this.clone(source);
      } else {
        this.m = [1,0,0,0,1,0];
      }
    },

    /**
     Turn this matrix into the identity

     @for Q.Matrix2D
     @method identity
     @chainable
    */
    identity: function() {
      var m = this.m;
      m[0] = 1; m[1] = 0; m[2] = 0;
      m[3] = 0; m[4] = 1; m[5] = 0;
      return this;
    },

    /**

     Clone another matrix into this one

     @for Q.Matrix2D
     @method clone
     @param {Q.Matrix2D} matrix - matrix to clone
     @chainable
    */
    clone: function(matrix) {
      var d = this.m, s = matrix.m;
      d[0]=s[0]; d[1]=s[1]; d[2] = s[2];
      d[3]=s[3]; d[4]=s[4]; d[5] = s[5];
      return this;
    },

    /**
     multiply two matrices (leaving the result in this)

        a * b =
           [ [ a11*b11 + a12*b21 ], [ a11*b12 + a12*b22 ], [ a11*b31 + a12*b32 + a13 ] ,
           [ a21*b11 + a22*b21 ], [ a21*b12 + a22*b22 ], [ a21*b31 + a22*b32 + a23 ] ]

     @for Q.Matrix2D
     @method clone
     @param {Q.Matrix2D} matrix - matrix to multiply by
     @chainable
   */
    multiply: function(matrix) {
      var a = this.m, b = matrix.m;

      var m11 = a[0]*b[0] + a[1]*b[3];
      var m12 = a[0]*b[1] + a[1]*b[4];
      var m13 = a[0]*b[2] + a[1]*b[5] + a[2];

      var m21 = a[3]*b[0] + a[4]*b[3];
      var m22 = a[3]*b[1] + a[4]*b[4];
      var m23 = a[3]*b[2] + a[4]*b[5] + a[5];

      a[0]=m11; a[1]=m12; a[2] = m13;
      a[3]=m21; a[4]=m22; a[5] = m23;
      return this;
    },

    /**

     Multiply this matrix by a rotation matrix rotated radians radians

    @for Q.Matrix2D
    @method rotate
    @param {Float} radians - angle to rotate by
    @chainable
    */
    rotate: function(radians) {
      if(radians === 0) { return this; }
      var cos = Math.cos(radians),
          sin = Math.sin(radians),
          m = this.m;

      var m11 = m[0]*cos  + m[1]*sin;
      var m12 = m[0]*-sin + m[1]*cos;

      var m21 = m[3]*cos  + m[4]*sin;
      var m22 = m[3]*-sin + m[4]*cos;

      m[0] = m11; m[1] = m12; // m[2] == m[2]
      m[3] = m21; m[4] = m22; // m[5] == m[5]
      return this;
    },

    /**

     Helper method to rotate by a set number of degrees (calls rotate internally)

     @for Q.Matrix2D
     @method rotateDeg
     @param {Float} degrees
     @chainable
    */
    rotateDeg: function(degrees) {
      if(degrees === 0) { return this; }
      return this.rotate(Math.PI * degrees / 180);
    },

    /**

     Multiply this matrix by a scaling matrix scaling sx and sy
     @for Q.Matrix2D
     @method scale
     @param {Float} sx - scale in x dimension (scaling is uniform unless `sy` is provided)
     @param {Float} [sy] - scale in the y dimension
     @chainable
    */
    scale: function(sx,sy) {
      var m = this.m;
      if(sy === void 0) { sy = sx; }

      m[0] *= sx;
      m[1] *= sy;
      m[3] *= sx;
      m[4] *= sy;
      return this;
    },


    /**
     Multiply this matrix by a translation matrix translate by tx and ty

     @for Q.Matrix2D
     @method translate
     @param {Float} tx
     @param {Float} ty
     @chainable
    */
    translate: function(tx,ty) {
      var m = this.m;

      m[2] += m[0]*tx + m[1]*ty;
      m[5] += m[3]*tx + m[4]*ty;
      return this;
    },


    /**
     Transform x and y coordinates by this matrix
     Memory Hoggy version, returns a new Array

     @for Q.Matrix2D
     @method transform
     @param {Float} x
     @param {Float} y

     */
    transform: function(x,y) {
      return [ x * this.m[0] + y * this.m[1] + this.m[2],
               x * this.m[3] + y * this.m[4] + this.m[5] ];
    },

    /**
     Transform an object with an x and y property by this Matrix
     @for Q.Matrix2D
     @method transformPt
     @param {Object} obj
     @return {Object} obj
    */
    transformPt: function(obj) {
      var x = obj.x, y = obj.y;

      obj.x = x * this.m[0] + y * this.m[1] + this.m[2];
      obj.y = x * this.m[3] + y * this.m[4] + this.m[5];

      return obj;
    },

    /**
     Transform an array with an x and y elements by this Matrix and put the result in
     the outArr

     @for Q.Matrix2D
     @method transformArr
     @param {Array} inArr - input array
     @param {Array} outArr - output array
     @return {Object} obj
    */
    transformArr: function(inArr,outArr) {
      var x = inArr[0], y = inArr[1];

      outArr[0] = x * this.m[0] + y * this.m[1] + this.m[2];
      outArr[1] = x * this.m[3] + y * this.m[4] + this.m[5];

      return outArr;
    },


    /**
     Return just the x coordinate transformed by this Matrix

     @for Q.Matrix2D
     @method transformX
     @param {Float} x
     @param {Float} y
     @return {Float} x transformed
    */
    transformX: function(x,y) {
      return x * this.m[0] + y * this.m[1] + this.m[2];
    },

    /**
     Return just the y coordinate transformed by this Matrix

     @for Q.Matrix2D
     @method transformY
     @param {Float} x
     @param {Float} y
     @return {Float} y transformed
    */
    transformY: function(x,y) {
      return x * this.m[3] + y * this.m[4] + this.m[5];
    },

    /**
     Release this Matrix to be reused

     @for Q.Matrix2D
     @method release
    */
    release: function() {
      Q.matrices2d.push(this);
      return null;
    },

    /**
     Set the complete transform on a Canvas 2D context

     @for Q.Matrix2D
     @method setContextTransform
     @param {Context2D} ctx - 2D canvs context
     */
     setContextTransform: function(ctx) {
      var m = this.m;
      // source:
      //  m[0] m[1] m[2]
      //  m[3] m[4] m[5]
      //  0     0   1
      //
      // destination:
      //  m11  m21  dx
      //  m12  m22  dy
      //  0    0    1
      //  setTransform(m11, m12, m21, m22, dx, dy)
      ctx.transform(m[0],m[3],m[1],m[4],m[2],m[5]);
    }

  });

  // And that's it..
  // ===============
  //
  // Return the `Q` object from the `Quintus()` factory method. Create awesome games. Repeat.
  return Q;
};

// Lastly, add in the `requestAnimationFrame` shim, if necessary. Does nothing
// if `requestAnimationFrame` is already on the `window` object.
(function() {
    if (typeof window === 'undefined') {
        return;
    }

    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame =
          window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = setTimeout(function() { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    }

    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
    }
}());


return Quintus;
};

if(typeof exports === 'undefined') {
  quintusCore(this,"Quintus");
} else {
  var Quintus = quintusCore(module,"exports");
}
//ppo.js
!function(e,o){"function"==typeof define&&define.amd?define([],o):"undefined"!=typeof module&&module.exports?module.exports=o():e.ppo=o()}(this,function(){function ppo(){}ppo.isIOS=ppo.isIos=function(){return/iPad|iPhone|iPod/.test(ppo.ua())},ppo.isIPad=function(){return/iPad/.test(ppo.ua())},ppo.isAndroid=function(){return-1<ppo.ua("l").indexOf("android")},ppo.isMobile=function(){return/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ppo.ua("l"))},ppo.isPC=function(){return!this.isMobile()},ppo.isWeixin=function(){return/MicroMessenger/i.test(ppo.ua("l"))},ppo.isIE=function(){return 0<ppo.ieVer()},ppo.ieVersion=ppo.ieVer=function(){var e=ppo.ua(),o=e.indexOf("MSIE ");if(0<o)return parseInt(e.substring(o+5,e.indexOf(".",o)),10);if(0<e.indexOf("Trident/")){var t=e.indexOf("rv:");return parseInt(e.substring(t+3,e.indexOf(".",t)),10)}var n=e.indexOf("Edge/");return 0<n?parseInt(e.substring(n+5,e.indexOf(".",n)),10):-1},ppo.ua=function(e){return e?window.navigator.userAgent.toLowerCase():window.navigator.userAgent},ppo.log=function(e,o){var t=document.getElementById("_ppo_log");if(null===t&&((t=document.createElement("div")).setAttribute("id","_ppo_log"),t.setAttribute("style","position:fixed;left:0;top:0;z-index:9999;padding:4px;"),document.body.appendChild(t)),o)for(var n in o)t.style[n]=o[n];t.innerHTML=e},ppo.logs=function(){if(window.console&&window.console.log){var e=arguments[0]+"",o=parseInt(e.split("&")[1])||10,t=ppo._cache.logs;t[e]||(t[e]={}),t[e].once||(t[e].once=1),t[e].once<=o&&(console.log.apply(console,ppo.args(arguments,1)),t[e].once++)}},ppo.removeConsole=function(e){try{window.console||(window.console={}),window.console.log=window.console.info=window.console.dir=window.console.warn=window.console.trace=ppo.noop,"clear"===e&&window.console.clear&&window.console.clear()}catch(e){}},ppo.open=function(e){var o="_ppo_open_proxy",t=document.getElementById(o)||document.createElement("a");t.setAttribute("id",o),t.setAttribute("href",e),t.setAttribute("target","_blank"),t.style.display="none",t.parentNode||document.body.appendChild(t),this.trigger(t,"click","MouseEvents")},ppo.trigger=function(e,o,t){if(document.createEventObject){var n=document.createEventObject();return e.fireEvent("on"+o,n)}(n=document.createEvent(t||"HTMLEvents")).initEvent(o,!0,!0),e.dispatchEvent(n)},ppo.setTimesout=function(){var e=arguments[0],o=void 0===arguments[1]?0:parseFloat(arguments[1]),t=void 0===arguments[2]?1:parseInt(arguments[2]),n=3<arguments.length?ppo.args(arguments,3):null,r={index:0,times:t,over:!1},i=setInterval(function(){r.index++,r.index>t?clearInterval(i):(r.index==t&&(r.over=!0),e.apply(r,n))},o);return i},ppo.clearTimesout=function(e){clearInterval(e)},ppo.construct=function(){var e=arguments[0];return new(Function.prototype.bind.apply(e,arguments))},ppo.paramsName=function(e){return/\(\s*([\s\S]*?)\s*\)/.exec(e.toString())[1].split(/\s*,\s*/)},ppo.getDate=function(e,o){var t=new Date,n=t.getDate(),r=t.getMonth()+1,i=t.getFullYear(),p=t.getHours(),a=t.getMinutes(),s=t.getSeconds();return n=ppo.fill0(n),i+(e=e||"/")+(r=ppo.fill0(r))+e+n+" "+(p=ppo.fill0(p))+(o=o||":")+(a=ppo.fill0(a))+o+(s=ppo.fill0(s))},ppo.getUrlParam=function(e,o){o=o||window.location.href,e=e.replace(/[\[\]]/g,"\\$&");var t=new RegExp("[?&]"+e+"(=([^&#]*)|&|#|$)").exec(o);return t?t[2]?decodeURIComponent(t[2].replace(/\+/g," ")):"":null},ppo.setUrlParam=function(e,o,t){t=t||window.location.href;var n=new RegExp("([?|&])"+e+"=.*?(&|#|$)","i");if(t.match(n))return t.replace(n,"$1"+e+"="+encodeURIComponent(o)+"$2");var r="";-1!==t.indexOf("#")&&(r=t.replace(/.*#/,"#"),t=t.replace(/#.*/,""));var i=-1!==t.indexOf("?")?"&":"?";return t+i+e+"="+encodeURIComponent(o)+r},ppo.deleteUrlParam=ppo.delUrlParam=function(e,o){var t=(o=o||window.location.href).split("?");if(2<=t.length){for(var n=encodeURIComponent(e)+"=",r=t[1].split(/[&;]/g),i=r.length;0<i--;)-1!==r[i].lastIndexOf(n,0)&&r.splice(i,1);return o=t[0]+(0<r.length?"?"+r.join("&"):"")}return o},ppo.setCookie=function(e,o,t){var n=t&&t.raw?o:encodeURIComponent(o),r=encodeURIComponent(e)+"="+n;if(t){if(t.days){var i=new Date,p=24*t.days*3600*1e3;i.setTime(i.getTime()+p),r+="; expires="+i.toGMTString()}else if(t.hour){i=new Date,p=3600*t.hour*1e3;i.setTime(i.getTime()+p),r+="; expires="+i.toGMTString()}else{p=31536e7;(i=new Date).setTime(i.getTime()+p),r+="; expires="+i.toGMTString()}t.path&&(r+="; path="+t.path),t.domain&&(r+="; domain="+t.domain),t.secure&&(r+="; true")}document.cookie=r},ppo.getCookie=function(e){for(var o=encodeURIComponent(e)+"=",t=document.cookie.split(";"),n=0;n<t.length;n++){for(var r=t[n];" "===r.charAt(0);)r=r.substring(1,r.length);if(0===r.indexOf(o))return decodeURIComponent(r.substring(o.length,r.length))}return null},ppo.deleteCookie=ppo.delCookie=function(e){this.setCookie(e,"",{hour:-1})},ppo.randomColor=function(){return"#"+("00000"+(16777216*Math.random()<<0).toString(16)).slice(-6)},ppo.randomFromArray=ppo.randomfArr=function(e){return e[Math.floor(Math.random()*e.length)]},ppo.randomFromA2B=ppo.randomA2B=function(e,o,t){var n=Math.random()*(o-e)+e;return t?Math.floor(n):n},ppo.randomKey=function(e){var o="",t="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";e=e||6;for(var n=0;n<e;n++)o+=t.charAt(Math.floor(Math.random()*t.length));return o},ppo.floor=function(e,o){return o=o||0,Math.floor(e*Math.pow(10,o))/Math.pow(10,o)},ppo.fill0=function(e){return(e=parseFloat(e))<10?"0"+e:e},ppo.currency=function(e){return m=m||0,Math.floor(n*Math.pow(10,m))/Math.pow(10,m)},ppo.lockTouch=function(){function o(e,o){return e.target.tagName!=o.toUpperCase()&&e.target.tagName!=o.toLowerCase()}function e(e){o(e,"input")&&o(e,"textarea")&&o(e,"select")&&o(e,"menus")&&e.preventDefault()}document.addEventListener("touchmove",function(e){e.preventDefault()},!1),document.addEventListener("touchstart",e,!1),document.addEventListener("touchend",e,!1)},ppo.loadjs=function(e,o,t){var n,r;(r="function"==typeof o?(n=this.hash(e+"")+"",o):void 0===o?(n=this.hash(e+"")+"",null):(n=o+"",t),ppo._cache.urls[n])?r&&r():("string"==typeof e?_insertScript:_insertScripts).call(this,e,function(){ppo._cache.urls[n]=!0,r&&r()})},ppo.uuid=function(){return"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,function(e){var o=16*Math.random()|0;return("x"==e?o:3&o|8).toString(16)})},ppo.hash=function(e){var o,t=0;if(0===(e+="").length)return t;for(o=0;o<e.length;o++)t=(t<<5)-t+e.charCodeAt(o),t|=0;return t},ppo.judge=ppo.judgment=function(e,o,t){if(!this.isTypeof(o,"array"))return!1;for(var n in o)if(t){if(e===o[n])return!0}else if(e==o[n])return!0;return!1},ppo.isTypeof=function(e,o){return Object.prototype.toString.call(e).slice(8,-1).toLowerCase()===o},ppo.toJSON=ppo.tojson=ppo.toJson=function(res){if(!res)return null;if("string"!=typeof res)return this.isTypeof(res.json,"function")?res.json():res;try{return JSON.parse(res)}catch(e){return eval("("+res+")")}},ppo.toArray=function(e,o){return e?ppo.isTypeof(e,"array")?e:ppo.isTypeof(e,"string")&&0<e.indexOf(",")?e.split(","):o&&ppo.isTypeof(e,"string")?e.split(o):[e]:null},ppo.args=function(e,o){return Array.prototype.slice.call(e,o||0)},ppo.delLastComma=ppo.deleteLastComma=function(e){return e=","===(e+="").slice(e.length-1)?e.slice(0,-1):e},ppo.trash={clear:function(){for(var e in ppo.trash)"log"!==e&&"clear"!==e&&delete ppo.trash[e]},log:function(){for(var e in ppo.trash)"log"!==e&&"clear"!==e&&console.log("ppo.trash:: ",e,ppo.trash[e])}},ppo.noop=function(){},ppo._cache={urls:{},logs:{}};var _insertScripts=function(e,o){for(var t=0;t<e.length;t++)_insertScript(e[t],r);var n=0;function r(){++n>=e.length&&o&&o()}},_insertScript=function(e,o){var t=document.createElement("script");t.setAttribute("type","text/javascript"),t.setAttribute("src",e),document.getElementsByTagName("head")[0].appendChild(t),/msie/.test(ppo.ua("l"))?t.onreadystatechange=function(){"loaded"!=this.readyState&&"complete"!=this.readyState||o()}:/gecko/.test(ppo.ua("l"))?t.onload=function(){o()}:setTimeout(function(){o()},50)};return ppo});
//countup.js file
!function(t,i){"object"==typeof exports&&"undefined"!=typeof module?i(exports):"function"==typeof define&&define.amd?define(["exports"],i):i((t="undefined"!=typeof globalThis?globalThis:t||self).countUp={})}(this,(function(t){"use strict";var i=function(){return i=Object.assign||function(t){for(var i,n=1,s=arguments.length;n<s;n++)for(var e in i=arguments[n])Object.prototype.hasOwnProperty.call(i,e)&&(t[e]=i[e]);return t},i.apply(this,arguments)},n=function(){function t(t,n,s){var e=this;this.endVal=n,this.options=s,this.version="2.6.2",this.defaults={startVal:0,decimalPlaces:0,duration:2,useEasing:!0,useGrouping:!0,useIndianSeparators:!1,smartEasingThreshold:999,smartEasingAmount:333,separator:",",decimal:".",prefix:"",suffix:"",enableScrollSpy:!1,scrollSpyDelay:200,scrollSpyOnce:!1},this.finalEndVal=null,this.useEasing=!0,this.countDown=!1,this.error="",this.startVal=0,this.paused=!0,this.once=!1,this.count=function(t){e.startTime||(e.startTime=t);var i=t-e.startTime;e.remaining=e.duration-i,e.useEasing?e.countDown?e.frameVal=e.startVal-e.easingFn(i,0,e.startVal-e.endVal,e.duration):e.frameVal=e.easingFn(i,e.startVal,e.endVal-e.startVal,e.duration):e.frameVal=e.startVal+(e.endVal-e.startVal)*(i/e.duration);var n=e.countDown?e.frameVal<e.endVal:e.frameVal>e.endVal;e.frameVal=n?e.endVal:e.frameVal,e.frameVal=Number(e.frameVal.toFixed(e.options.decimalPlaces)),e.printValue(e.frameVal),i<e.duration?e.rAF=requestAnimationFrame(e.count):null!==e.finalEndVal?e.update(e.finalEndVal):e.options.onCompleteCallback&&e.options.onCompleteCallback()},this.formatNumber=function(t){var i,n,s,a,o=t<0?"-":"";i=Math.abs(t).toFixed(e.options.decimalPlaces);var r=(i+="").split(".");if(n=r[0],s=r.length>1?e.options.decimal+r[1]:"",e.options.useGrouping){a="";for(var l=3,u=0,h=0,p=n.length;h<p;++h)e.options.useIndianSeparators&&4===h&&(l=2,u=1),0!==h&&u%l==0&&(a=e.options.separator+a),u++,a=n[p-h-1]+a;n=a}return e.options.numerals&&e.options.numerals.length&&(n=n.replace(/[0-9]/g,(function(t){return e.options.numerals[+t]})),s=s.replace(/[0-9]/g,(function(t){return e.options.numerals[+t]}))),o+e.options.prefix+n+s+e.options.suffix},this.easeOutExpo=function(t,i,n,s){return n*(1-Math.pow(2,-10*t/s))*1024/1023+i},this.options=i(i({},this.defaults),s),this.formattingFn=this.options.formattingFn?this.options.formattingFn:this.formatNumber,this.easingFn=this.options.easingFn?this.options.easingFn:this.easeOutExpo,this.startVal=this.validateValue(this.options.startVal),this.frameVal=this.startVal,this.endVal=this.validateValue(n),this.options.decimalPlaces=Math.max(this.options.decimalPlaces),this.resetDuration(),this.options.separator=String(this.options.separator),this.useEasing=this.options.useEasing,""===this.options.separator&&(this.options.useGrouping=!1),this.el="string"==typeof t?document.getElementById(t):t,this.el?this.printValue(this.startVal):this.error="[CountUp] target is null or undefined","undefined"!=typeof window&&this.options.enableScrollSpy&&(this.error?console.error(this.error,t):(window.onScrollFns=window.onScrollFns||[],window.onScrollFns.push((function(){return e.handleScroll(e)})),window.onscroll=function(){window.onScrollFns.forEach((function(t){return t()}))},this.handleScroll(this)))}return t.prototype.handleScroll=function(t){if(t&&window&&!t.once){var i=window.innerHeight+window.scrollY,n=t.el.getBoundingClientRect(),s=n.top+window.pageYOffset,e=n.top+n.height+window.pageYOffset;e<i&&e>window.scrollY&&t.paused?(t.paused=!1,setTimeout((function(){return t.start()}),t.options.scrollSpyDelay),t.options.scrollSpyOnce&&(t.once=!0)):(window.scrollY>e||s>i)&&!t.paused&&t.reset()}},t.prototype.determineDirectionAndSmartEasing=function(){var t=this.finalEndVal?this.finalEndVal:this.endVal;this.countDown=this.startVal>t;var i=t-this.startVal;if(Math.abs(i)>this.options.smartEasingThreshold&&this.options.useEasing){this.finalEndVal=t;var n=this.countDown?1:-1;this.endVal=t+n*this.options.smartEasingAmount,this.duration=this.duration/2}else this.endVal=t,this.finalEndVal=null;null!==this.finalEndVal?this.useEasing=!1:this.useEasing=this.options.useEasing},t.prototype.start=function(t){this.error||(t&&(this.options.onCompleteCallback=t),this.duration>0?(this.determineDirectionAndSmartEasing(),this.paused=!1,this.rAF=requestAnimationFrame(this.count)):this.printValue(this.endVal))},t.prototype.pauseResume=function(){this.paused?(this.startTime=null,this.duration=this.remaining,this.startVal=this.frameVal,this.determineDirectionAndSmartEasing(),this.rAF=requestAnimationFrame(this.count)):cancelAnimationFrame(this.rAF),this.paused=!this.paused},t.prototype.reset=function(){cancelAnimationFrame(this.rAF),this.paused=!0,this.resetDuration(),this.startVal=this.validateValue(this.options.startVal),this.frameVal=this.startVal,this.printValue(this.startVal)},t.prototype.update=function(t){cancelAnimationFrame(this.rAF),this.startTime=null,this.endVal=this.validateValue(t),this.endVal!==this.frameVal&&(this.startVal=this.frameVal,null==this.finalEndVal&&this.resetDuration(),this.finalEndVal=null,this.determineDirectionAndSmartEasing(),this.rAF=requestAnimationFrame(this.count))},t.prototype.printValue=function(t){var i;if(this.el){var n=this.formattingFn(t);if(null===(i=this.options.plugin)||void 0===i?void 0:i.render)this.options.plugin.render(this.el,n);else if("INPUT"===this.el.tagName)this.el.value=n;else"text"===this.el.tagName||"tspan"===this.el.tagName?this.el.textContent=n:this.el.innerHTML=n}},t.prototype.ensureNumber=function(t){return"number"==typeof t&&!isNaN(t)},t.prototype.validateValue=function(t){var i=Number(t);return this.ensureNumber(i)?i:(this.error="[CountUp] invalid start or end value: ".concat(t),null)},t.prototype.resetDuration=function(){this.startTime=null,this.duration=1e3*Number(this.options.duration),this.remaining=this.duration},t}();t.CountUp=n,Object.defineProperty(t,"__esModule",{value:!0})}));//quadtree.js file
/* https://github.com/timohausmann/quadtree-js.git v1.2.5 */
!function(){function o(t,e,s,i){this.max_objects=e||10,this.max_levels=s||4,this.level=i||0,this.bounds=t,this.objects=[],this.nodes=[]}o.prototype.split=function(){var t=this.level+1,e=this.bounds.width/2,s=this.bounds.height/2,i=this.bounds.x,h=this.bounds.y;this.nodes[0]=new o({x:i+e,y:h,width:e,height:s},this.max_objects,this.max_levels,t),this.nodes[1]=new o({x:i,y:h,width:e,height:s},this.max_objects,this.max_levels,t),this.nodes[2]=new o({x:i,y:h+s,width:e,height:s},this.max_objects,this.max_levels,t),this.nodes[3]=new o({x:i+e,y:h+s,width:e,height:s},this.max_objects,this.max_levels,t)},o.prototype.getIndex=function(t){var e=[],s=this.bounds.x+this.bounds.width/2,i=this.bounds.y+this.bounds.height/2,h=t.y<i,o=t.x<s,n=t.x+t.width>s,d=t.y+t.height>i;return h&&n&&e.push(0),o&&h&&e.push(1),o&&d&&e.push(2),n&&d&&e.push(3),e},o.prototype.insert=function(t){var e,s=0;if(this.nodes.length)for(e=this.getIndex(t),s=0;s<e.length;s++)this.nodes[e[s]].insert(t);else if(this.objects.push(t),this.objects.length>this.max_objects&&this.level<this.max_levels){for(this.nodes.length||this.split(),s=0;s<this.objects.length;s++){e=this.getIndex(this.objects[s]);for(var i=0;i<e.length;i++)this.nodes[e[i]].insert(this.objects[s])}this.objects=[]}},o.prototype.retrieve=function(t){var e=this.getIndex(t),s=this.objects;if(this.nodes.length)for(var i=0;i<e.length;i++)s=s.concat(this.nodes[e[i]].retrieve(t));return s=s.filter(function(t,e){return s.indexOf(t)>=e})},o.prototype.clear=function(){this.objects=[];for(var t=0;t<this.nodes.length;t++)this.nodes.length&&this.nodes[t].clear();this.nodes=[]},"undefined"!=typeof module&&void 0!==module.exports?module.exports=o:window.Quadtree=o}();
//event-lite.js file
function EventLite(){if(!(this instanceof EventLite))return new EventLite}!function(e){"undefined"!=typeof module&&(module.exports=e);var n="listeners",t={on:function(e,n){return f(this,e).push(n),this},once:function(e,n){var t=this;return i.originalListener=n,f(t,e).push(i),t;function i(){r.call(t,e,i),n.apply(this,arguments)}},off:r,emit:function(e,n){var t=this,i=f(t,e,!0);if(!i)return!1;var r=arguments.length;if(1===r)i.forEach((function(e){e.call(t)}));else if(2===r)i.forEach((function(e){e.call(t,n)}));else{var l=Array.prototype.slice.call(arguments,1);i.forEach((function(e){e.apply(t,l)}))}return!!i.length}};function i(e){for(var n in t)e[n]=t[n];return e}function r(e,t){var i,l=this;if(arguments.length){if(t){if(i=f(l,e,!0)){if(!(i=i.filter((function(e){return e!==t&&e.originalListener!==t}))).length)return r.call(l,e);l[n][e]=i}}else if((i=l[n])&&(delete i[e],!Object.keys(i).length))return r.call(l)}else delete l[n];return l}function f(e,t,i){if(!i||e[n]){var r=e[n]||(e[n]={});return r[t]||(r[t]=[])}}i(e.prototype),e.mixin=i}(EventLite);
//cash.js file
(function(){"use strict";var C=document,D=window,st=C.documentElement,L=C.createElement.bind(C),ft=L("div"),q=L("table"),Mt=L("tbody"),ot=L("tr"),H=Array.isArray,S=Array.prototype,Dt=S.concat,U=S.filter,at=S.indexOf,ct=S.map,Bt=S.push,ht=S.slice,z=S.some,_t=S.splice,Pt=/^#(?:[\w-]|\\.|[^\x00-\xa0])*$/,Ht=/^\.(?:[\w-]|\\.|[^\x00-\xa0])*$/,$t=/<.+>/,jt=/^\w+$/;function J(t,n){var r=It(n);return!t||!r&&!A(n)&&!c(n)?[]:!r&&Ht.test(t)?n.getElementsByClassName(t.slice(1).replace(/\\/g,"")):!r&&jt.test(t)?n.getElementsByTagName(t):n.querySelectorAll(t)}var dt=function(){function t(n,r){if(n){if(Y(n))return n;var i=n;if(g(n)){var e=r||C;if(i=Pt.test(n)&&A(e)?e.getElementById(n.slice(1).replace(/\\/g,"")):$t.test(n)?yt(n):Y(e)?e.find(n):g(e)?o(e).find(n):J(n,e),!i)return}else if(O(n))return this.ready(n);(i.nodeType||i===D)&&(i=[i]),this.length=i.length;for(var s=0,f=this.length;s<f;s++)this[s]=i[s]}}return t.prototype.init=function(n,r){return new t(n,r)},t}(),u=dt.prototype,o=u.init;o.fn=o.prototype=u,u.length=0,u.splice=_t,typeof Symbol=="function"&&(u[Symbol.iterator]=S[Symbol.iterator]);function Y(t){return t instanceof dt}function B(t){return!!t&&t===t.window}function A(t){return!!t&&t.nodeType===9}function It(t){return!!t&&t.nodeType===11}function c(t){return!!t&&t.nodeType===1}function Ft(t){return!!t&&t.nodeType===3}function Wt(t){return typeof t=="boolean"}function O(t){return typeof t=="function"}function g(t){return typeof t=="string"}function v(t){return t===void 0}function P(t){return t===null}function lt(t){return!isNaN(parseFloat(t))&&isFinite(t)}function G(t){if(typeof t!="object"||t===null)return!1;var n=Object.getPrototypeOf(t);return n===null||n===Object.prototype}o.isWindow=B,o.isFunction=O,o.isArray=H,o.isNumeric=lt,o.isPlainObject=G;function d(t,n,r){if(r){for(var i=t.length;i--;)if(n.call(t[i],i,t[i])===!1)return t}else if(G(t))for(var e=Object.keys(t),i=0,s=e.length;i<s;i++){var f=e[i];if(n.call(t[f],f,t[f])===!1)return t}else for(var i=0,s=t.length;i<s;i++)if(n.call(t[i],i,t[i])===!1)return t;return t}o.each=d,u.each=function(t){return d(this,t)},u.empty=function(){return this.each(function(t,n){for(;n.firstChild;)n.removeChild(n.firstChild)})};function $(){for(var t=[],n=0;n<arguments.length;n++)t[n]=arguments[n];var r=Wt(t[0])?t.shift():!1,i=t.shift(),e=t.length;if(!i)return{};if(!e)return $(r,o,i);for(var s=0;s<e;s++){var f=t[s];for(var a in f)r&&(H(f[a])||G(f[a]))?((!i[a]||i[a].constructor!==f[a].constructor)&&(i[a]=new f[a].constructor),$(r,i[a],f[a])):i[a]=f[a]}return i}o.extend=$,u.extend=function(t){return $(u,t)};var qt=/\S+/g;function j(t){return g(t)?t.match(qt)||[]:[]}u.toggleClass=function(t,n){var r=j(t),i=!v(n);return this.each(function(e,s){c(s)&&d(r,function(f,a){i?n?s.classList.add(a):s.classList.remove(a):s.classList.toggle(a)})})},u.addClass=function(t){return this.toggleClass(t,!0)},u.removeAttr=function(t){var n=j(t);return this.each(function(r,i){c(i)&&d(n,function(e,s){i.removeAttribute(s)})})};function Ut(t,n){if(t){if(g(t)){if(arguments.length<2){if(!this[0]||!c(this[0]))return;var r=this[0].getAttribute(t);return P(r)?void 0:r}return v(n)?this:P(n)?this.removeAttr(t):this.each(function(e,s){c(s)&&s.setAttribute(t,n)})}for(var i in t)this.attr(i,t[i]);return this}}u.attr=Ut,u.removeClass=function(t){return arguments.length?this.toggleClass(t,!1):this.attr("class","")},u.hasClass=function(t){return!!t&&z.call(this,function(n){return c(n)&&n.classList.contains(t)})},u.get=function(t){return v(t)?ht.call(this):(t=Number(t),this[t<0?t+this.length:t])},u.eq=function(t){return o(this.get(t))},u.first=function(){return this.eq(0)},u.last=function(){return this.eq(-1)};function zt(t){return v(t)?this.get().map(function(n){return c(n)||Ft(n)?n.textContent:""}).join(""):this.each(function(n,r){c(r)&&(r.textContent=t)})}u.text=zt;function T(t,n,r){if(c(t)){var i=D.getComputedStyle(t,null);return r?i.getPropertyValue(n)||void 0:i[n]||t.style[n]}}function E(t,n){return parseInt(T(t,n),10)||0}function gt(t,n){return E(t,"border".concat(n?"Left":"Top","Width"))+E(t,"padding".concat(n?"Left":"Top"))+E(t,"padding".concat(n?"Right":"Bottom"))+E(t,"border".concat(n?"Right":"Bottom","Width"))}var X={};function Jt(t){if(X[t])return X[t];var n=L(t);C.body.insertBefore(n,null);var r=T(n,"display");return C.body.removeChild(n),X[t]=r!=="none"?r:"block"}function vt(t){return T(t,"display")==="none"}function pt(t,n){var r=t&&(t.matches||t.webkitMatchesSelector||t.msMatchesSelector);return!!r&&!!n&&r.call(t,n)}function I(t){return g(t)?function(n,r){return pt(r,t)}:O(t)?t:Y(t)?function(n,r){return t.is(r)}:t?function(n,r){return r===t}:function(){return!1}}u.filter=function(t){var n=I(t);return o(U.call(this,function(r,i){return n.call(r,i,r)}))};function x(t,n){return n?t.filter(n):t}u.detach=function(t){return x(this,t).each(function(n,r){r.parentNode&&r.parentNode.removeChild(r)}),this};var Yt=/^\s*<(\w+)[^>]*>/,Gt=/^<(\w+)\s*\/?>(?:<\/\1>)?$/,mt={"*":ft,tr:Mt,td:ot,th:ot,thead:q,tbody:q,tfoot:q};function yt(t){if(!g(t))return[];if(Gt.test(t))return[L(RegExp.$1)];var n=Yt.test(t)&&RegExp.$1,r=mt[n]||mt["*"];return r.innerHTML=t,o(r.childNodes).detach().get()}o.parseHTML=yt,u.has=function(t){var n=g(t)?function(r,i){return J(t,i).length}:function(r,i){return i.contains(t)};return this.filter(n)},u.not=function(t){var n=I(t);return this.filter(function(r,i){return(!g(t)||c(i))&&!n.call(i,r,i)})};function R(t,n,r,i){for(var e=[],s=O(n),f=i&&I(i),a=0,y=t.length;a<y;a++)if(s){var h=n(t[a]);h.length&&Bt.apply(e,h)}else for(var p=t[a][n];p!=null&&!(i&&f(-1,p));)e.push(p),p=r?p[n]:null;return e}function bt(t){return t.multiple&&t.options?R(U.call(t.options,function(n){return n.selected&&!n.disabled&&!n.parentNode.disabled}),"value"):t.value||""}function Xt(t){return arguments.length?this.each(function(n,r){var i=r.multiple&&r.options;if(i||Ot.test(r.type)){var e=H(t)?ct.call(t,String):P(t)?[]:[String(t)];i?d(r.options,function(s,f){f.selected=e.indexOf(f.value)>=0},!0):r.checked=e.indexOf(r.value)>=0}else r.value=v(t)||P(t)?"":t}):this[0]&&bt(this[0])}u.val=Xt,u.is=function(t){var n=I(t);return z.call(this,function(r,i){return n.call(r,i,r)})},o.guid=1;function w(t){return t.length>1?U.call(t,function(n,r,i){return at.call(i,n)===r}):t}o.unique=w,u.add=function(t,n){return o(w(this.get().concat(o(t,n).get())))},u.children=function(t){return x(o(w(R(this,function(n){return n.children}))),t)},u.parent=function(t){return x(o(w(R(this,"parentNode"))),t)},u.index=function(t){var n=t?o(t)[0]:this[0],r=t?this:o(n).parent().children();return at.call(r,n)},u.closest=function(t){var n=this.filter(t);if(n.length)return n;var r=this.parent();return r.length?r.closest(t):n},u.siblings=function(t){return x(o(w(R(this,function(n){return o(n).parent().children().not(n)}))),t)},u.find=function(t){return o(w(R(this,function(n){return J(t,n)})))};var Kt=/^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g,Qt=/^$|^module$|\/(java|ecma)script/i,Vt=["type","src","nonce","noModule"];function Zt(t,n){var r=o(t);r.filter("script").add(r.find("script")).each(function(i,e){if(Qt.test(e.type)&&st.contains(e)){var s=L("script");s.text=e.textContent.replace(Kt,""),d(Vt,function(f,a){e[a]&&(s[a]=e[a])}),n.head.insertBefore(s,null),n.head.removeChild(s)}})}function kt(t,n,r,i,e){i?t.insertBefore(n,r?t.firstChild:null):t.nodeName==="HTML"?t.parentNode.replaceChild(n,t):t.parentNode.insertBefore(n,r?t:t.nextSibling),e&&Zt(n,t.ownerDocument)}function N(t,n,r,i,e,s,f,a){return d(t,function(y,h){d(o(h),function(p,M){d(o(n),function(b,W){var rt=r?M:W,it=r?W:M,m=r?p:b;kt(rt,m?it.cloneNode(!0):it,i,e,!m)},a)},f)},s),n}u.after=function(){return N(arguments,this,!1,!1,!1,!0,!0)},u.append=function(){return N(arguments,this,!1,!1,!0)};function tn(t){if(!arguments.length)return this[0]&&this[0].innerHTML;if(v(t))return this;var n=/<script[\s>]/.test(t);return this.each(function(r,i){c(i)&&(n?o(i).empty().append(t):i.innerHTML=t)})}u.html=tn,u.appendTo=function(t){return N(arguments,this,!0,!1,!0)},u.wrapInner=function(t){return this.each(function(n,r){var i=o(r),e=i.contents();e.length?e.wrapAll(t):i.append(t)})},u.before=function(){return N(arguments,this,!1,!0)},u.wrapAll=function(t){for(var n=o(t),r=n[0];r.children.length;)r=r.firstElementChild;return this.first().before(n),this.appendTo(r)},u.wrap=function(t){return this.each(function(n,r){var i=o(t)[0];o(r).wrapAll(n?i.cloneNode(!0):i)})},u.insertAfter=function(t){return N(arguments,this,!0,!1,!1,!1,!1,!0)},u.insertBefore=function(t){return N(arguments,this,!0,!0)},u.prepend=function(){return N(arguments,this,!1,!0,!0,!0,!0)},u.prependTo=function(t){return N(arguments,this,!0,!0,!0,!1,!1,!0)},u.contents=function(){return o(w(R(this,function(t){return t.tagName==="IFRAME"?[t.contentDocument]:t.tagName==="TEMPLATE"?t.content.childNodes:t.childNodes})))},u.next=function(t,n,r){return x(o(w(R(this,"nextElementSibling",n,r))),t)},u.nextAll=function(t){return this.next(t,!0)},u.nextUntil=function(t,n){return this.next(n,!0,t)},u.parents=function(t,n){return x(o(w(R(this,"parentElement",!0,n))),t)},u.parentsUntil=function(t,n){return this.parents(n,t)},u.prev=function(t,n,r){return x(o(w(R(this,"previousElementSibling",n,r))),t)},u.prevAll=function(t){return this.prev(t,!0)},u.prevUntil=function(t,n){return this.prev(n,!0,t)},u.map=function(t){return o(Dt.apply([],ct.call(this,function(n,r){return t.call(n,r,n)})))},u.clone=function(){return this.map(function(t,n){return n.cloneNode(!0)})},u.offsetParent=function(){return this.map(function(t,n){for(var r=n.offsetParent;r&&T(r,"position")==="static";)r=r.offsetParent;return r||st})},u.slice=function(t,n){return o(ht.call(this,t,n))};var nn=/-([a-z])/g;function K(t){return t.replace(nn,function(n,r){return r.toUpperCase()})}u.ready=function(t){var n=function(){return setTimeout(t,0,o)};return C.readyState!=="loading"?n():C.addEventListener("DOMContentLoaded",n),this},u.unwrap=function(){return this.parent().each(function(t,n){if(n.tagName!=="BODY"){var r=o(n);r.replaceWith(r.children())}}),this},u.offset=function(){var t=this[0];if(t){var n=t.getBoundingClientRect();return{top:n.top+D.pageYOffset,left:n.left+D.pageXOffset}}},u.position=function(){var t=this[0];if(t){var n=T(t,"position")==="fixed",r=n?t.getBoundingClientRect():this.offset();if(!n){for(var i=t.ownerDocument,e=t.offsetParent||i.documentElement;(e===i.body||e===i.documentElement)&&T(e,"position")==="static";)e=e.parentNode;if(e!==t&&c(e)){var s=o(e).offset();r.top-=s.top+E(e,"borderTopWidth"),r.left-=s.left+E(e,"borderLeftWidth")}}return{top:r.top-E(t,"marginTop"),left:r.left-E(t,"marginLeft")}}};var Et={class:"className",contenteditable:"contentEditable",for:"htmlFor",readonly:"readOnly",maxlength:"maxLength",tabindex:"tabIndex",colspan:"colSpan",rowspan:"rowSpan",usemap:"useMap"};u.prop=function(t,n){if(t){if(g(t))return t=Et[t]||t,arguments.length<2?this[0]&&this[0][t]:this.each(function(i,e){e[t]=n});for(var r in t)this.prop(r,t[r]);return this}},u.removeProp=function(t){return this.each(function(n,r){delete r[Et[t]||t]})};var rn=/^--/;function Q(t){return rn.test(t)}var V={},en=ft.style,un=["webkit","moz","ms"];function sn(t,n){if(n===void 0&&(n=Q(t)),n)return t;if(!V[t]){var r=K(t),i="".concat(r[0].toUpperCase()).concat(r.slice(1)),e="".concat(r," ").concat(un.join("".concat(i," "))).concat(i).split(" ");d(e,function(s,f){if(f in en)return V[t]=f,!1})}return V[t]}var fn={animationIterationCount:!0,columnCount:!0,flexGrow:!0,flexShrink:!0,fontWeight:!0,gridArea:!0,gridColumn:!0,gridColumnEnd:!0,gridColumnStart:!0,gridRow:!0,gridRowEnd:!0,gridRowStart:!0,lineHeight:!0,opacity:!0,order:!0,orphans:!0,widows:!0,zIndex:!0};function wt(t,n,r){return r===void 0&&(r=Q(t)),!r&&!fn[t]&&lt(n)?"".concat(n,"px"):n}function on(t,n){if(g(t)){var r=Q(t);return t=sn(t,r),arguments.length<2?this[0]&&T(this[0],t,r):t?(n=wt(t,n,r),this.each(function(e,s){c(s)&&(r?s.style.setProperty(t,n):s.style[t]=n)})):this}for(var i in t)this.css(i,t[i]);return this}u.css=on;function Ct(t,n){try{return t(n)}catch{return n}}var an=/^\s+|\s+$/;function St(t,n){var r=t.dataset[n]||t.dataset[K(n)];return an.test(r)?r:Ct(JSON.parse,r)}function cn(t,n,r){r=Ct(JSON.stringify,r),t.dataset[K(n)]=r}function hn(t,n){if(!t){if(!this[0])return;var r={};for(var i in this[0].dataset)r[i]=St(this[0],i);return r}if(g(t))return arguments.length<2?this[0]&&St(this[0],t):v(n)?this:this.each(function(e,s){cn(s,t,n)});for(var i in t)this.data(i,t[i]);return this}u.data=hn;function Tt(t,n){var r=t.documentElement;return Math.max(t.body["scroll".concat(n)],r["scroll".concat(n)],t.body["offset".concat(n)],r["offset".concat(n)],r["client".concat(n)])}d([!0,!1],function(t,n){d(["Width","Height"],function(r,i){var e="".concat(n?"outer":"inner").concat(i);u[e]=function(s){if(this[0])return B(this[0])?n?this[0]["inner".concat(i)]:this[0].document.documentElement["client".concat(i)]:A(this[0])?Tt(this[0],i):this[0]["".concat(n?"offset":"client").concat(i)]+(s&&n?E(this[0],"margin".concat(r?"Top":"Left"))+E(this[0],"margin".concat(r?"Bottom":"Right")):0)}})}),d(["Width","Height"],function(t,n){var r=n.toLowerCase();u[r]=function(i){if(!this[0])return v(i)?void 0:this;if(!arguments.length)return B(this[0])?this[0].document.documentElement["client".concat(n)]:A(this[0])?Tt(this[0],n):this[0].getBoundingClientRect()[r]-gt(this[0],!t);var e=parseInt(i,10);return this.each(function(s,f){if(c(f)){var a=T(f,"boxSizing");f.style[r]=wt(r,e+(a==="border-box"?gt(f,!t):0))}})}});var Rt="___cd";u.toggle=function(t){return this.each(function(n,r){if(c(r)){var i=vt(r),e=v(t)?i:t;e?(r.style.display=r[Rt]||"",vt(r)&&(r.style.display=Jt(r.tagName))):i||(r[Rt]=T(r,"display"),r.style.display="none")}})},u.hide=function(){return this.toggle(!1)},u.show=function(){return this.toggle(!0)};var xt="___ce",Z=".",k={focus:"focusin",blur:"focusout"},Nt={mouseenter:"mouseover",mouseleave:"mouseout"},dn=/^(mouse|pointer|contextmenu|drag|drop|click|dblclick)/i;function tt(t){return Nt[t]||k[t]||t}function nt(t){var n=t.split(Z);return[n[0],n.slice(1).sort()]}u.trigger=function(t,n){if(g(t)){var r=nt(t),i=r[0],e=r[1],s=tt(i);if(!s)return this;var f=dn.test(s)?"MouseEvents":"HTMLEvents";t=C.createEvent(f),t.initEvent(s,!0,!0),t.namespace=e.join(Z),t.___ot=i}t.___td=n;var a=t.___ot in k;return this.each(function(y,h){a&&O(h[t.___ot])&&(h["___i".concat(t.type)]=!0,h[t.___ot](),h["___i".concat(t.type)]=!1),h.dispatchEvent(t)})};function Lt(t){return t[xt]=t[xt]||{}}function ln(t,n,r,i,e){var s=Lt(t);s[n]=s[n]||[],s[n].push([r,i,e]),t.addEventListener(n,e)}function At(t,n){return!n||!z.call(n,function(r){return t.indexOf(r)<0})}function F(t,n,r,i,e){var s=Lt(t);if(n)s[n]&&(s[n]=s[n].filter(function(f){var a=f[0],y=f[1],h=f[2];if(e&&h.guid!==e.guid||!At(a,r)||i&&i!==y)return!0;t.removeEventListener(n,h)}));else for(n in s)F(t,n,r,i,e)}u.off=function(t,n,r){var i=this;if(v(t))this.each(function(s,f){!c(f)&&!A(f)&&!B(f)||F(f)});else if(g(t))O(n)&&(r=n,n=""),d(j(t),function(s,f){var a=nt(f),y=a[0],h=a[1],p=tt(y);i.each(function(M,b){!c(b)&&!A(b)&&!B(b)||F(b,p,h,n,r)})});else for(var e in t)this.off(e,t[e]);return this},u.remove=function(t){return x(this,t).detach().off(),this},u.replaceWith=function(t){return this.before(t).remove()},u.replaceAll=function(t){return o(t).replaceWith(this),this};function gn(t,n,r,i,e){var s=this;if(!g(t)){for(var f in t)this.on(f,n,r,t[f],e);return this}return g(n)||(v(n)||P(n)?n="":v(r)?(r=n,n=""):(i=r,r=n,n="")),O(i)||(i=r,r=void 0),i?(d(j(t),function(a,y){var h=nt(y),p=h[0],M=h[1],b=tt(p),W=p in Nt,rt=p in k;b&&s.each(function(it,m){if(!(!c(m)&&!A(m)&&!B(m))){var et=function(l){if(l.target["___i".concat(l.type)])return l.stopImmediatePropagation();if(!(l.namespace&&!At(M,l.namespace.split(Z)))&&!(!n&&(rt&&(l.target!==m||l.___ot===b)||W&&l.relatedTarget&&m.contains(l.relatedTarget)))){var ut=m;if(n){for(var _=l.target;!pt(_,n);)if(_===m||(_=_.parentNode,!_))return;ut=_}Object.defineProperty(l,"currentTarget",{configurable:!0,get:function(){return ut}}),Object.defineProperty(l,"delegateTarget",{configurable:!0,get:function(){return m}}),Object.defineProperty(l,"data",{configurable:!0,get:function(){return r}});var bn=i.call(ut,l,l.___td);e&&F(m,b,M,n,et),bn===!1&&(l.preventDefault(),l.stopPropagation())}};et.guid=i.guid=i.guid||o.guid++,ln(m,b,M,n,et)}})}),this):this}u.on=gn;function vn(t,n,r,i){return this.on(t,n,r,i,!0)}u.one=vn;var pn=/\r?\n/g;function mn(t,n){return"&".concat(encodeURIComponent(t),"=").concat(encodeURIComponent(n.replace(pn,`\r
`)))}var yn=/file|reset|submit|button|image/i,Ot=/radio|checkbox/i;u.serialize=function(){var t="";return this.each(function(n,r){d(r.elements||[r],function(i,e){if(!(e.disabled||!e.name||e.tagName==="FIELDSET"||yn.test(e.type)||Ot.test(e.type)&&!e.checked)){var s=bt(e);if(!v(s)){var f=H(s)?s:[s];d(f,function(a,y){t+=mn(e.name,y)})}}})}),t.slice(1)},typeof exports<"u"?module.exports=o:D.cash=D.$=o})();