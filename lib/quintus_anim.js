/*global Quintus:false, module:false */

var quintusAnim = function(Quintus) {
"use strict";

Quintus.Anim = function(Q) {

  Q._animations = {};
  Q.animations = function(sprite,animations) {
    if(!Q._animations[sprite]) { Q._animations[sprite] = {}; }
    Q._extend(Q._animations[sprite],animations);
  };

  Q.animation = function(sprite,name) {
    return Q._animations[sprite] && Q._animations[sprite][name];
  };

  Q.component('animation',{
    added: function() {
      var p = this.entity.p;
      p.animation = null;
      p.animationPriority = -1;
      p.animationFrame = 0;
      p.animationTime = 0;
      this.entity.on("step",this,"step");
    },
    extend: {
      play: function(name,priority,resetFrame) {
        this.animation.play(name,priority,resetFrame);
      }
    },
    step: function(dt) {
      var entity = this.entity,
          p = entity.p;
      if(p.animation) {
        var anim = Q.animation(p.sprite,p.animation),
            rate = anim.rate || p.rate,
            stepped = 0;
        p.animationTime += dt;
        if(p.animationChanged) {
          p.animationChanged = false;
        } else {
          if(p.animationTime > rate) {
            stepped = Math.floor(p.animationTime / rate);
            p.animationTime -= stepped * rate;
            p.animationFrame += stepped;
          }
        }
        if(stepped > 0) {
          if(p.animationFrame >= anim.frames.length) {
            if(anim.loop === false || anim.next) {
              p.animationFrame = anim.frames.length - 1;
              entity.trigger('animEnd');
              entity.trigger('animEnd.' + p.animation);
              p.animation = null;
              p.animationPriority = -1;
              if(anim.trigger) {
                entity.trigger(anim.trigger,anim.triggerData);
              }
              if(anim.next) { this.play(anim.next,anim.nextPriority); }
              return;
            } else {
              entity.trigger('animLoop');
              entity.trigger('animLoop.' + p.animation);
              p.animationFrame = p.animationFrame % anim.frames.length;
            }
          }
          entity.trigger("animFrame");
        }
        p.sheet = anim.sheet || p.sheet;
        p.frame = anim.frames[p.animationFrame];
        if(anim.hasOwnProperty("flip")) { p.flip  = anim.flip; }
      }
    },

    play: function(name,priority,resetFrame) {
      var entity = this.entity,
          p = entity.p;
      priority = priority || 0;
      if(name !== p.animation && priority >= p.animationPriority) {
        if(resetFrame === undefined) {
          resetFrame = true;
        }
        p.animation = name;
        if(resetFrame) {
          p.animationChanged = true;
          p.animationTime = 0;
          p.animationFrame = 0;
        }
        p.animationPriority = priority;
        entity.trigger('anim');
        entity.trigger('anim.' + p.animation);
      }
    }

  });


  Q.Sprite.extend("Repeater",{
    init: function(props) {
      this._super(Q._defaults(props,{
        speedX: 1,
        speedY: 1,
        repeatY: true,
        repeatX: true,
        renderAlways: true,
        type: 0
      }));
      this.p.repeatW = this.p.repeatW || this.p.w;
      this.p.repeatH = this.p.repeatH || this.p.h;
    },

    draw: function(ctx) {
      var p = this.p,
          asset = this.asset(),
          sheet = this.sheet(),
          scale = this.stage.viewport ? this.stage.viewport.scale : 1,
          viewX = Math.floor(this.stage.viewport ? this.stage.viewport.x : 0),
          viewY = Math.floor(this.stage.viewport ? this.stage.viewport.y : 0),
          offsetX = Math.floor(p.x + viewX * this.p.speedX),
          offsetY = Math.floor(p.y + viewY * this.p.speedY),
          curX, curY, startX, endX, endY;
      if(p.repeatX) {
        curX = -offsetX % p.repeatW;
        if(curX > 0) { curX -= p.repeatW; }
      } else {
        curX = p.x - viewX;
      }
      if(p.repeatY) {
        curY = -offsetY % p.repeatH;
        if(curY > 0) { curY -= p.repeatH; }
      } else {
        curY = p.y - viewY;
      }

      startX = curX;
      endX = Q.width / Math.abs(scale) / Math.abs(p.scale || 1) + p.repeatW;
      endY = Q.height / Math.abs(scale) / Math.abs(p.scale || 1) + p.repeatH;

      while(curY < endY) {
        curX = startX;
        while(curX < endX) {
          if(sheet) {
            sheet.draw(ctx,curX + viewX,curY + viewY,p.frame);
          } else {
            ctx.drawImage(asset,curX + viewX,curY + viewY);
          }
          curX += p.repeatW;
          if(!p.repeatX) { break; }
        }
        curY += p.repeatH;
        if(!p.repeatY) { break; }
      }
    }
  });

  Q.Tween = Q.Class.extend({
    init: function(entity,properties,duration,easing,options) {
      if(Q._isObject(easing)) { options = easing; easing = Q.Easing.Linear; }
      if(Q._isObject(duration)) { options = duration; duration = 1; }

      this.entity = entity;
      //this.p = (entity instanceof Q.Stage) ? entity.viewport : entity.p;
      this.duration = duration || 1;
      this.time = 0;
      this.options = options || {};
      this.delay = this.options.delay || 0;
      this.easing = easing || this.options.easing || Q.Easing.Linear;

      this.startFrame = Q._loopFrame + 1;
      this.properties = properties;
      this.start = {};
      this.diff = {};
    },

    step: function(dt) {
      var property;

      if(this.startFrame > Q._loopFrame) { return true; }
      if(this.delay >= dt) {
        this.delay -= dt;
        return true;
      }

      if(this.delay > 0) {
        dt -= this.delay;
        this.delay = 0;
      }

      if(this.time === 0) {
        // first time running? Initialize the properties to chaining correctly.
        var entity = this.entity, properties = this.properties;
        this.p = (entity instanceof Q.Stage) ? entity.viewport : entity.p;
        for(property in properties) {
          this.start[property] = this.p[property];
          if(!Q._isUndefined(this.start[property])) {
            this.diff[property] = properties[property] - this.start[property];
          }
        }
      }
      this.time += dt;

      var progress = Math.min(1,this.time / this.duration),
          location = this.easing(progress);

      for(property in this.start) {
        if(!Q._isUndefined(this.p[property])) {
          this.p[property] = this.start[property] + this.diff[property] * location;
        }
      }

      if(progress >= 1) {
        if(this.options.callback) {
          this.options.callback.apply(this.entity);
        }
      }
      return progress < 1;
    }
  });

  // Code ripped directly from Tween.js
  // https://github.com/sole/tween.js/blob/master/src/Tween.js
  Q.Easing = {
    Linear: function (k) { return k; },
    inQuad: function(t) {
      return t * t
    },
    outQuad: function(t) {
      return t * (2 - t)
    },
    inOutQuad: function(t) {
      return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t
    },
    inCubic: function(t) {
      return t * t * t
    },
    outCubic: function(t) {
      return (--t) * t * t + 1
    },
    inOutCubic: function(t) {
      return t < .5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
    },
    inQuart: function(t) {
      return t * t * t * t
    },
    outQuart: function(t) {
      return 1 - (--t) * t * t * t
    },
    inOutQuart: function(t) {
      return t < .5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t
    },
    inQuint: function(t) {
      return t * t * t * t * t
    },
    outQuint: function(t) {
      return 1 + (--t) * t * t * t * t
    },
    inOutQuint: function(t) {
      return t < .5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t
    },
    inSine: function(t) {
      return -1 * Math.cos(t / 1 * (Math.PI * 0.5)) + 1;
    },
    outSine: function(t) {
      return Math.sin(t / 1 * (Math.PI * 0.5));
    },
    inOutSine: function(t) {
      return -1 / 2 * (Math.cos(Math.PI * t) - 1);
    },
    inExpo: function(t) {
      return (t == 0) ? 0 : Math.pow(2, 10 * (t - 1));
    },
    outExpo: function(t) {
      return (t == 1) ? 1 : (-Math.pow(2, -10 * t) + 1);
    },
    inOutExpo: function(t) {
      if (t == 0) return 0;
      if (t == 1) return 1;
      if ((t /= 1 / 2) < 1) return 1 / 2 * Math.pow(2, 10 * (t - 1));
      return 1 / 2 * (-Math.pow(2, -10 * --t) + 2);
    },
    inCirc: function(t) {
      return -1 * (Math.sqrt(1 - t * t) - 1);
    },
    outCirc: function(t) {
      return Math.sqrt(1 - (t = t - 1) * t);
    },
    inOutCirc: function(t) {
      if ((t /= 1 / 2) < 1) return -1 / 2 * (Math.sqrt(1 - t * t) - 1);
      return 1 / 2 * (Math.sqrt(1 - (t -= 2) * t) + 1);
    },
    inElastic: function(t) {
      var s = 1.70158;
      var p = 0;
      var a = 1;
      if (t == 0) return 0;
      if (t == 1) return 1;
      if (!p) p = 0.3;
      if (a < 1) {
        a = 1;
        var s = p / 4;
      } else var s = p / (2 * Math.PI) * Math.asin(1 / a);
      return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t - s) * (2 * Math.PI) / p));
    },
    outElastic: function(t) {
      var s = 1.70158;
      var p = 0;
      var a = 1;
      if (t == 0) return 0;
      if (t == 1) return 1;
      if (!p) p = 0.3;
      if (a < 1) {
        a = 1;
        var s = p / 4;
      } else var s = p / (2 * Math.PI) * Math.asin(1 / a);
      return a * Math.pow(2, -10 * t) * Math.sin((t - s) * (2 * Math.PI) / p) + 1;
    },
    inOutElastic: function(t) {
      var s = 1.70158;
      var p = 0;
      var a = 1;
      if (t == 0) return 0;
      if ((t /= 1 / 2) == 2) return 1;
      if (!p) p = (0.3 * 1.5);
      if (a < 1) {
        a = 1;
        var s = p / 4;
      } else var s = p / (2 * Math.PI) * Math.asin(1 / a);
      if (t < 1) return -.5 * (a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t - s) * (2 * Math.PI) / p));
      return a * Math.pow(2, -10 * (t -= 1)) * Math.sin((t - s) * (2 * Math.PI) / p) * 0.5 + 1;
    },
    inBack: function(t, s) {
      if (s == undefined) s = 1.70158;
      return 1 * t * t * ((s + 1) * t - s);
    },
    outBack: function(t, s) {
      if (s == undefined) s = 1.70158;
      return 1 * ((t = t / 1 - 1) * t * ((s + 1) * t + s) + 1);
    },
    inOutBack: function(t, s) {
      if (s == undefined) s = 1.70158;
      if ((t /= 1 / 2) < 1) return 1 / 2 * (t * t * (((s *= (1.525)) + 1) * t - s));
      return 1 / 2 * ((t -= 2) * t * (((s *= (1.525)) + 1) * t + s) + 2);
    },
    inBounce: function(t) {
      return 1 - Q.Easing .outBounce(1 - t);
    },
    outBounce: function(t) {
      if ((t /= 1) < (1 / 2.75)) {
        return (7.5625 * t * t);
      } else if (t < (2 / 2.75)) {
        return (7.5625 * (t -= (1.5 / 2.75)) * t + .75);
      } else if (t < (2.5 / 2.75)) {
        return (7.5625 * (t -= (2.25 / 2.75)) * t + .9375);
      } else {
        return (7.5625 * (t -= (2.625 / 2.75)) * t + .984375);
      }
    },
    inOutBounce: function(t) {
      if (t < 1 / 2) return Q.Easing .inBounce(t * 2) * 0.5;
      return Q.Easing .outBounce(t * 2 - 1) * 0.5 + 0.5;
    },
  translateEasing: function(key) {

    if (!this.cache[key]) {
      var array = key.split('');

      var sign = 1;
      var signed = false;
      var trimming = false;

      for (var i = 0; i < array.length; i++) {

        var char = array[i];

        if (char === "-") {
          sign = -1;
          signed = true;
          array.splice(i--, 1);
        } else if (char === "+") {
          sign = 1;
          array.splice(i--, 1);
        } else if (char === "t") {
          trimming = !trimming;
          array.splice(i--, 1);
        } else array[i] = parseInt(array[i], 16) * sign;

      }

      var min = Math.min.apply(null, array);
      var max = Math.max.apply(null, array);
      var diff = max - min;
      var cache = [];
      var normalized = [];

      for (var i = 0; i < array.length; i++) {

        if (signed) {

          var diff = Math.max(Math.abs(min), Math.abs(max))
          var value = array[i] / diff;

        } else {

          var diff = max - min;
          var value = (array[i] - min) / diff;

        }

        if (trimming) {

          if (value < 0) value = 0;
          if (value > 1.0) value = 1.0;

        }

        normalized.push(value);

      }

      this.cache[key] = normalized;

    }

    return this.cache[key]

  },

  splineK: {},
  splineX: {},
  splineY: {},

  insertIntermediateValues: function(a) {
    var result = [];
    for (var i = 0; i < a.length; i++) {
      result.push(a[i]);

      if (i < a.length - 1) result.push(a[i + 1] + (a[i] - a[i + 1]) * 0.6);
    }

    return result;
  },

  spline: function(x, key) {

    if (!this.splineK[key]) {

      var xs = [];
      var ys = this.translateEasing(key);
      if (!ys.length) return 0;

      for (var i = 0; i < ys.length; i++) xs.push(i * (1 / (ys.length - 1)));

      var ks = xs.map(function() {
        return 0
      });

      ks = this.getNaturalKs(xs, ys, ks);

      this.splineX[key] = xs;
      this.splineY[key] = ys;
      this.splineK[key] = ks;

    }

    if (x > 1) return this.splineY[key][this.splineY[key].length - 1];

    var ks = this.splineK[key];
    var xs = this.splineX[key];
    var ys = this.splineY[key];

    var i = 1;

    while (xs[i] < x) i++;

    var t = (x - xs[i - 1]) / (xs[i] - xs[i - 1]);
    var a = ks[i - 1] * (xs[i] - xs[i - 1]) - (ys[i] - ys[i - 1]);
    var b = -ks[i] * (xs[i] - xs[i - 1]) + (ys[i] - ys[i - 1]);
    var q = (1 - t) * ys[i - 1] + t * ys[i] + t * (1 - t) * (a * (1 - t) + b * t);
    return q;
  },

  getNaturalKs: function(xs, ys, ks) {
    var n = xs.length - 1;
    var A = Q.Easing .zerosMat(n + 1, n + 2);

    for (var i = 1; i < n; i++) // rows
    {
      A[i][i - 1] = 1 / (xs[i] - xs[i - 1]);
      A[i][i] = 2 * (1 / (xs[i] - xs[i - 1]) + 1 / (xs[i + 1] - xs[i]));
      A[i][i + 1] = 1 / (xs[i + 1] - xs[i]);
      A[i][n + 1] = 3 * ((ys[i] - ys[i - 1]) / ((xs[i] - xs[i - 1]) * (xs[i] - xs[i - 1])) + (ys[i + 1] - ys[i]) / ((xs[i + 1] - xs[i]) * (xs[i + 1] - xs[i])));
    }

    A[0][0] = 2 / (xs[1] - xs[0]);
    A[0][1] = 1 / (xs[1] - xs[0]);
    A[0][n + 1] = 3 * (ys[1] - ys[0]) / ((xs[1] - xs[0]) * (xs[1] - xs[0]));

    A[n][n - 1] = 1 / (xs[n] - xs[n - 1]);
    A[n][n] = 2 / (xs[n] - xs[n - 1]);
    A[n][n + 1] = 3 * (ys[n] - ys[n - 1]) / ((xs[n] - xs[n - 1]) * (xs[n] - xs[n - 1]));

    return Q.Easing.solve(A, ks);
  },

  solve: function(A, ks) {
    var m = A.length;
    for (var k = 0; k < m; k++)
    {
      var i_max = 0;
      var vali = Number.NEGATIVE_INFINITY;
      for (var i = k; i < m; i++)
        if (A[i][k] > vali) {
          i_max = i;
          vali = A[i][k];
        }
        Q.Easing.splineSwapRows(A, k, i_max);

      // for all rows below pivot
      for (var i = k + 1; i < m; i++) {
        for (var j = k + 1; j < m + 1; j++)
          A[i][j] = A[i][j] - A[k][j] * (A[i][k] / A[k][k]);
        A[i][k] = 0;
      }
    }
    for (var i = m - 1; i >= 0; i--) // rows = columns
    {
      var v = A[i][m] / A[i][i];
      ks[i] = v;
      for (var j = i - 1; j >= 0; j--) // rows
      {
        A[j][m] -= A[j][i] * v;
        A[j][i] = 0;
      }
    }
    return ks;
  },

  zerosMat: function(r, c) {
    var A = [];
    for (var i = 0; i < r; i++) {
      A.push([]);
      for (var j = 0; j < c; j++) A[i].push(0);
    }
    return A;
  },
    splineSwapRows: function(m, k, l) {
      var p = m[k];
      m[k] = m[l];
      m[l] = p;
    },
    Quadratic: {
      In: function ( k )  { return k * k; },
      Out: function ( k ) {return k * ( 2 - k ); },
      InOut: function ( k ) {
        if ((k *= 2 ) < 1) { return 0.5 * k * k; }
        return -0.5 * (--k * (k - 2) - 1);
      }
    }
  };

  Q.component('tween',{
    added: function() {
      this._tweens = [];
      this.entity.on("step",this,"step");
    },
    extend: {
      animate: function(properties,duration,easing,options) {
        this.tween._tweens.push(new Q.Tween(this,properties,duration,easing,options));
        return this;
      },

      chain: function(properties,duration,easing,options) {
        if(Q._isObject(easing)) { options = easing; easing = Q.Easing.Linear; }
        // Chain an animation to the end
        var tweenCnt = this.tween._tweens.length;
        if(tweenCnt > 0) {
          var lastTween = this.tween._tweens[tweenCnt - 1];
          options = options || {};
          options['delay'] = lastTween.duration - lastTween.time + lastTween.delay;
        }

        this.animate(properties,duration,easing,options);
        return this;
      },

      stop: function() {
        this.tween._tweens.length = 0;
        return this;
      }
    },

    step: function(dt) {
      for(var i=0; i < this._tweens.length; i++) {
        if(!this._tweens[i].step(dt)) {
          this._tweens.splice(i,1);
          i--;
        }
      }
    }
  });


};


};

if(typeof Quintus === 'undefined') {
  module.exports = quintusAnim;
} else {
  quintusAnim(Quintus);
}
