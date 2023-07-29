window.addEventListener('load',function(e) {
  var Q = window.Q = Quintus()
                     .include('Input,Sprites,Scenes,SVG,Physics')
                     .svgOnly()
                     .setup('quintus',{ maximize: true });

  Q.WorldPhysics={isGravity:true,gravityY:0,gravityX:0}
  Q.Sprite.extend('CannonBall',{
    init: function(props) {
      this._super({
        shape: 'circle',
        color: 'red',
        r: 32,
        restitution: 0.5,
        density: 4,
        x: props.dx * 50 + 10,
        y: props.dy * 50 + 210,
        seconds: 99,
        linearDamping:1,
        
        
      });
      this.add('physics');
      this.on('step',this,'countdown');
    },

    countdown: function(dt) {
      this.p.seconds -= dt;
      if(this.p.seconds < 0) {
        Q.stage(0).world.destroyBody(this.physics._body)
        this.destroy();
      } else if(this.p.seconds < 1) {
        this.set({ "fill-opacity": this.p.seconds });
      }
    }
  });

  Q.Sprite.extend('Cannon',{
    init: function(props) {
      this._super({
        shape:'polygon',
        color: 'black',
        points: [[ 0,0 ], [0,-5], [5,-10], [8, -11], [40, -11], 
                  [ 40, 11], [8, 11], [5, 10], [0, 5] ],
        x: 10,
        y: 210
      });
    },

    fire: function() {
      var dx = Math.cos(this.p.angle / 180 * Math.PI),
          dy = Math.sin(this.p.angle / 180 * Math.PI),
          ball = new Q.CannonBall({ dx: dx, dy: dy, angle: this.p.angle });
      Q.stage().insert(ball);
      ball.physics.velocity(3,3);
    }
  });

  var targetCount = 0;
  Q.Sprite.extend('Target',{
    init: function(props) {
      this._super( Q._extend(props,{
        shape: 'circle',
        color: 'pink',
        r: 8,
        mass:0
      }));
      targetCount++;
      this.add('physics');
      this.on('contact',this,'checkHit');
    },

    checkHit: function(sprite) {
      if(sprite instanceof Q.CannonBall) {
        targetCount--;
        Q.stage(0).world.destroyBody(sprite.physics._body)
        Q.stage(0).world.destroyBody(this.physics._body)
        this.destroy();
        if(targetCount == 0) { Q.stageScene('level'); }
      }
    }
  });




  Q.scene('level',new Q.Scene(function(stage) {
    targetCount = 0;
    stage.add("world");
    stage.insert(new Q.Sprite({ 
      x: 250, y: 250, w: 700, h: 50, type:"static"
    }))

  
    stage.insert(new Q.Sprite({ w: 10, h:50, x: 500, y: 130 }));
    stage.insert(new Q.Sprite({ w: 10, h:50, x: 550, y: 130 }));
    stage.insert(new Q.Sprite({ w: 70, h:10, x: 525, y: 110 }));

    stage.insert(new Q.Sprite({
      points: [[ 0,0 ], [ 50, -50 ],[150, -50],[200,0]],
      x: 200,
      y: 225,
      type:'dynamic',
      shape: 'polygon',
      mass:0
    }));

    stage.insert(new Q.Sprite({ w: 50, h:90, x: 300, y: 150 }));
    stage.insert(new Q.Sprite({ w: 50, h:90, x: 300, y: 150 }));
    stage.insert(new Q.Sprite({ w: 50, h:90, x: 300, y: 150 }));
    stage.insert(new Q.Sprite({ w: 25, h:25, x: 300, y: 115 }));

    stage.each(function() { this.add("physics"); });

    stage.insert(new Q.Target({ x: 525, y: 90 }));
    stage.insert(new Q.Target({ x: 300, y: 90 }));
    stage.insert(new Q.Sprite({ w: 30, h:30, x: 10, y: 210, 
                                color: 'blue' }));

    stage.cannon = stage.insert(new Q.Cannon());
    stage.viewport(600,400);
    stage.centerOn(300,100);
       
  }));
  	Q.stageScene("level");
  	var cannonMove=function(e) {
    var stage = Q.stage(0), 
        cannon = stage.cannon,
        touch = e.changedTouches ?  
                e.changedTouches[0] : e,
        point = stage.browserToWorld(touch.pageX,touch.pageY);
   
    	var angle = Math.atan2(point.y - cannon.p.y,
                           point.x - cannon.p.x);
	    cannon.p.angle = angle * 180 / Math.PI;
	    e.preventDefault();
  	};
    Q._each(["touchstart","mousemove","touchmove"],function(evt) {
        Q.wrapper.addEventListener(evt,cannonMove);
    },this);

	var canonFire=function(e) {
		Q.stage(0).cannon.fire();
   		e.preventDefault();
	}
	Q._each(["touchend","mouseup"],function(evt) {
		Q.wrapper.addEventListener(evt,canonFire);
	});

  
});

