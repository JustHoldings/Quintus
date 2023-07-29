// # Quintus platformer example
//
// [Run the example](../quintus/examples/platformer/index.html)
// WARNING: this game must be run from a non-file:// url
// as it loads a level json file.
//
// This is the example from the website homepage, it consists
// a simple, non-animated platformer with some enemies and a 
// target for the player.
window.addEventListener("load",function() {

// Set up an instance of the Quintus engine  and include
// the Sprites, Scenes, Input and 2D module. The 2D module
// includes the `TileLayer` class as well as the `2d` componet.
var Q = window.Q = Quintus({debug:false})
        .include("Sprites, Scenes, Input, 2D, Anim, Touch, UI, TMX")
        // Maximize this game to whatever the size of the browser is
        .setup({ maximize: true,scaleToFit: true,DebugDrawCallCount:true,UseMouse:true})
        // And turn on default input controls and touch input (for UI)
        .controls().touch()
let TestDebugText=new Q.UI.Text({ 
    label: "Test Beta Build\n V0.3.0",
    color: "black",
    align: 'center',
    x:344,
    y:288
})
// Overide Player Controls
Q.ControlOveride={left:"t"}
// Mouse event that has  the Browser and @Canvas position of the mmouse or where the users touching
/*
Q._each(["touchstart","mousemove","touchmove"],function(evt) {
  Q.wrapper.addEventListener(evt,(e)=>{
    var offset =$("canvas").offset();
    //console.log(offset)
    var stage = Q.stage(0), 
    touch = e.changedTouches ?e.changedTouches[0] : e,
    point =Q.CanvasToStage(touch.pageX,touch.pageY,stage);
    //console.log(`Browser position`+touch.pageX)
    console.log(point)
    if(!TestDebugText){
      TestDebugText.p.x=point.x-offset.left
      TestDebugText.p.y=point.y-offset.top
    }
  e.preventDefault();
  });
},this);
*/
setInterval(() => {
  if(Q.Active){
    console.log(Q("Player").first())
  }
  
}, 1000);
Q.load("white-flare.png")
Q.Events.on(`pointerdown`,function(){
  if(Q("Player").first()){

      Q("Player").first().fire()
    
      
    
    
  }
})
// ## Player Sprite
// The very basic player sprite, this is just a normal sprite
// using the player sprite sheet with default controls added to it.


Q.Sprite.extend("Player",{

  // the init constructor is called on creation
  init: function(p) {

    // You can call the parent's constructor with this._super(..)
    this._super(p, {
      sheet: "player",  // Setting a sprite sheet sets sprite width and height
      jumpSpeed: -400,
      speed: 300,
      pressedspace:false,
      starttimer:false,
      spawnparticle:false,
    });

    this.add('2d,platformerControls');
    //this.add('stepControls,2d');
    this.on("hit.sprite",function(collision) {

      if(collision.obj.isA("Tower")) {
        Q.stageScene("endGame",1, { label: "You Won!" }); 
        this.destroy();
      }
    });
  },
  step:function(dt){
    if(!this.p.pressedspace&&Q.inputs["q"]) {
        console.log(`User is pressing the space button`)
        this.p.pressedspace=true
    }
    if(Q.inputs["j"]){
      this.p.stepDistance=1
    }
    if(!Q.inputs["q"]){
      this.p.pressedspace=false
    }
    if(!this.p.starttimer&&Q.inputs["p"]){
      let TestTimer = new Q.Timer(
        "1 second",
        (progress)=>{
          console.log(`Current Progress is ${progress}`)
        },
        ()=>{
          console.log(`My timer Ended`)
        },
        ()=>{
          console.log(`My Timer Started`)
        }
        );
      this.p.starttimer=true
    }
    if(!Q.inputs["w"]){
      this.p.starttimer=false
    }
    if(!this.p.spawnparticle&&Q.inputs["r"]){
    }
    
  },
  fire:function(data){
    let Particle=new Q.Sprite({
      x:Q.Mousex,
      y: Q.Mousey,
      asset: 'white-flare.png', 
      angle: 0,
      type:Q.SPRITE_PARTICLE,
      scale:1,
      });
      Particle
      .animate({ x:this.p.x+Q.Util.random(10,900), y:this.p.y+Q.Util.random(10,900)}, 2, Q.Easing.inOutElastic, { delay: 1 })
      .chain({ x: Q("Player").first().p.x, y: Q("Player").first().p.y, scale: 0.1, opacity: 1 }, 1, Q.Easing.Quadratic.In )
      .chain({scale:2,opacity:2})
      .chain({opacity:0});
    Q.stage().insert(Particle);

  }
});


// ## Tower Sprite
// Sprites can be simple, the Tower sprite just sets a custom sprite sheet
Q.Sprite.extend("Tower", {
  init: function(p) {
    this._super(p, { sheet: 'tower' });
  }
});

// ## Enemy Sprite
// Create the Enemy class to add in some baddies
Q.Sprite.extend("Enemy",{
  init: function(p) {
    this._super(p, { sheet: 'enemy', vx: 100, visibleOnly: true });

    this.add('2d, aiBounce');

    this.on("bump.left,bump.right,bump.bottom",function(collision) {
      if(collision.obj.isA("Player")) { 
        Q.stageScene("endGame",1, { label: "You Died" }); 
        collision.obj.destroy();
      }
    });

    this.on("bump.top",function(collision) {
      if(collision.obj.isA("Player")) { 
        this.destroy();
        //collision.obj.p.vy = -300;
      }
    });
  }
});

// ## Level1 scene
// Create a new scene called level 1
Q.scene("level1",function(stage) {
  Q.stageTMX("level1.tmx",stage);
  stage.add("viewport").follow(Q("Player").first());

  stage.insert(TestDebugText);
  // A basic sprite shape a asset as the image
  var sprite1 = new Q.Sprite({ x: 300, y: 500, asset: 'white-flare.png', 
      angle: 0, collisionMask: 1, scale: 1});
  //stage.insert(sprite1);
});


Q.scene('endGame',function(stage) {
  var container = stage.insert(new Q.UI.Container({
    x: Q.width/2, y: Q.height/2, fill: "rgba(0,0,0,0.5)"
  }));

  var button = container.insert(new Q.UI.Button({ x: 0, y: 0, fill: "#CCCCCC",
                                                  label: "Play Again" }))         
  var label = container.insert(new Q.UI.Text({x:10, y: -10 - button.p.h, 
                                                   label: stage.options.label }));
  button.on("click",function() {
    clearInterval(Checker)
    Q.clearStages();
    Q.stageScene('level1');
  });
  let Checker=setInterval(() => {
    console.log(`End game scene interval triggered`)
    if(Q.inputs["esc"]){
      clearInterval(Checker)
      Q.clearStages();
      Q.stageScene('level1');

    }
  }, 100);

  container.fit(20);
});


// Load one or more TMX files
// and load all the assets referenced in them
Q.loadTMX("level1.tmx, sprites.json", function() {
  Q.compileSheets("sprites.png","sprites.json");
  Q.stageScene("level1");
});

// ## Possible Experimentations:
// 
// The are lots of things to try out here.
// 
// 1. Modify level.json to change the level around and add in some more enemies.
// 2. Add in a second level by creating a level2.json and a level2 scene that gets
//    loaded after level 1 is complete.
// 3. Add in a title screen
// 4. Add in a hud and points for jumping on enemies.
// 5. Add in a `Repeater` behind the TileLayer to create a paralax scrolling effect.

});
