Quintus Engine
==============

Quintus is an easy-to-learn, fun-to-use HTML5 game engine for mobile, desktop and beyond!

The Quintus engine is an HTML5 game engine designed to be modular and lightweight, with a concise JavaScript-friendly syntax. In lieu of trying to shoehorn a standard OOP-game engine structure into an HTML5 JavaScript engine, Quintus takes some cues from jQuery and provides plugins, events and a selector syntax. Instead of a deep single-inheritance-only model, Quintus provides a flexible component model in addition to traditional inheritance to make it easier to reuse functionality and share it across games and objects.

**Warning: Quintus is at a very early stage of development, use at your own risk.***


[![Quintus Platformer Example](https://raw.github.com/cykod/Quintus/master/examples/platformer.png)](http://html5quintus.com/quintus/examples/platformer/)

[Example Annotated Source](http://html5quintus.com/quintus/docs/platformer.html)

More details and documentation at [HTML5Quintus.com](http://html5quintus.com/)

Read the [Quintus Guide](http://html5quintus.com/guide/intro.md) to get started on the Engine.

Using Quintus
=============

The easiest way to use Quintus is simply to use the CDN hosted version at:

    <!-- Production minified ~20k gzipped -->
    <script src='http://cdn.html5quintus.com/v0.2.0/quintus-all.min.js'></script>

    <!-- Full Source ~40k gzipped -->
    <script src='http://cdn.html5quintus.com/v0.2.0/quintus-all.js'></script>

Quintus has no dependencies.

    
Check the `build/` directory for single file builds. 

ToDo
====
* Update the Q.Scenes method to only render sprites that are visible in the grid. (so draw doesn't get called with thousands of sprites)
* Fix the collision methods to calculate a collision magnitude based on dot product of sprite velocities
* Added in A* Path finding
* Add in Babylon.js as a Optional Render mode(2D will not be removed)
* Add in Babylon UI as a optional UI alternative
* Add in common Ai algorithims(Feeling enemys,Agro enemys etc)
* Finish implementing basic LDK

Changelog
=========
### 0.3.0 Q3 Updates
  - Added Global Json State loading
  - Added Global Object pool
  - Added Updates from last public forks of Quintus
  - Added in cash.js,it's a JQUERY alternative that's 75% smaller than jquery but gets the job done
  - Removed grunt build
  - Added new simple build that works across the various ES versions of code
  - Added in eruda adds a virtual debug window that can be viewed on mobile too
  - Added in a Render mode that can be set to "pixel" or "hd" this optimizes the canvas using css for pixel games or None pixel art games
  - Changed input so it can also trigger events based on arbitrary keys without needing a key schema
  - Added a Optional debug stat that tells you how many of the game objects in the world are actually activley rendered/ticked
  - Added a Generic and flexible timer
  - Added Q.stime it's a simple utility function that just returns Human readable times into their milisecond,second,hourly etc time
  - Added in alot more easining functions their were only 2 built in linear and Quadratic
  - Added in  variables MouseX and MouseY to make working with mouse positions less verbose
  - Added in Q.Active this is another helper function that returns the current amount of objects that are deemed active
  - Added, Particle Sprite types now automatically get tween component added to them on creation and automatically removed from the scene once no longer in use
  -  Added a Global Event emitter
  -  Added Q.Util this adds some common utility functions to speed up game development
  -  Added, platformer_tmx example,This example will continute to get updates as more features get added to quintus
  - Added, Quintus.tmx object parser to detect and  converting object array string properties to arrays(TMX does not support arrays)
  - Added a BOX2D object type to the base sprite type,This automatically handles properly removing a newly inintialized physics object when it gets destroyed
  - Added Default Key config overide Global Variable for desktop controls in the input module
  - Added in spread syntax support for describing animation frames ie `walk:"0..5"` is the same as `walk:[0,1,2,3,4,5]`
  - Added ,Animation frames now automatically assume atleast a `1/rate` so you can just set the rate to `15` to say run this animation at 15 frames
  - Added,2d module gravity can be overrided(By default its set to 1)
  - Added,Box2D physics world settings can be overriden by utilizing `Q.WorldPhysics`
  - Added,Q.Util now has a faster forEach,some,every,filter,map array functions(Benchmarks are linked in the quintus.js file/Q.Util section)
  - Added `setup.zindex`it's 0 by defaut,you can lower it with this incase your games working with DOM elmements as the main UI
  - Added a automatic refocus,When interacting with dom elements the users focus would get shifted
  - Added `setup[bootstrap,micron,animexyz,animatestyle]` these libraries can be enabled by setting the library names to true,this does a remote file pull so that the core does not get overly bloated
  - Added,Enabled Sorting by default for stages and sprite to sort by their z positions by defalt
  - Fixed,The `UI.HTMLElement` it now correctly updates its position
  - Added,Began partially parsing LDTK basic format export
  
  
### 0.2.0 Initial API Docs + Better Tiled Integration + Sloped Tiles
* `quintus_tmx.js` TMX file extraction 
* Multi-layer TMX Support + Sloped Tiles by [lendrick](https://github.com/lendrick)
* TMX Object layer support
* TMX Repeater support
* TMX Sensor tile support
* SVG and Physics refactoring by [drFabio](https://github.com/drFabio)
* Generate collision points performance optimization
* Disasteroids Example
* Initial Platformer Full Example
* Initial API Documentation
* Conditional Render and step support
* Tower Man Example

### 0.1.6 Assorted Fixes - 9/6/13
* Fix by [A11oW](https://github.com/A11oW) to Quintus input
* #41 - repeated rounding issues
* Change SpriteSheet to use tileW, tileH instead of tilew, tileh
* Add flipping to AIBounce componet by [fariazz](https://github.com/fariazz)
* Add optional bounding box to viewport by [fariazz](https://github.com/fariazz)
* Initial experiment with YuiDoc

### 0.1.5 Assorted Fixes - 8/4/13
* Assorted gruntfile stuff
* Add hide, show, stop and start to stages
* Per-sprite gravity override
* Multi-layer support for TMX files by [fariazz](https://github.com/fariazz)
* Fix to scene locate method #46 by [noahcampbell](https://github.com/noahcampbell)
* Add support for sensors
* Add support for loading scenes from a JSON file
* auto-focus when keyboard controls are active
* Add development mode: `Quintus({ development: true })` to make changing assets easier
* Allow for easier opacity tweening
* Simple TMX/XML parsing from [kvroman](https://github.com/kvroman)
* Touch example fix from [scottheckel](http://github.com/scottheckel)

### 0.1.4 Updated Node + Grunt - 4/13/13
* Updated Gruntfile.js and dependencies to latest versions


### 0.1.3 Sprite Platforms and Assorted Fixes - 4/7/13
* Added collision loop for Sprites and added platforms example
* Added Repeater to platformer and fixed default type
* Fix to Joypad
* Fix to sprite gridding
* Child sort and flip support
* Tile check fix from [izidormatusov](http://github.com/izidormatusov)
* Initial API Docs

### 0.1.1 UI and Web Audio fixes - 2/17/13
* Fixed UI touch location on iOS when canvas is smaller than full screen
* Fixed asset loading in Web Audio

### 0.1.0 Web Audio and better Tweens - 2/16/13 
* **Note: this release was replaced with 0.1.1, which added no new features but fixed a couple bugs**
* Added support for Web Audio output (iOS6 supported, Yay!)
* Added audio example in `examples/audio`
* Removed sound sprite support
* Added support for Audio looping (via `Q.audio.play("name", { loop: true })`)
* Added sound stopping support (`Q.audio.stop()` to stop all, `Q.audio.stop("name") to stop 1)
* Moved non-working SVG, DOM and Physics modules to `extra/`
* Added support for functions as direction options to follow (suggested by [@gvhuyssteen](https://github.com/gvhuyssteen) )

  For Example:
      
        stage.follow(player, {
           // Always follow x
           x: true, 

           // Only follow y if the player has landed
           y: function(sprite) { return sprite.p.landed > 0 } 
        });

* Improved tween animations, by [@fqborges](https://github.com/fqborges) fixes tween chaining and adds in an example in `examples/tween/`


Changes to your code:

* You must call `Q.audio.play` instead of `Q.play` to play sound
* If you were using sound sprites, they have been removed.

### 0.0.5 UI Example + Bug Fixes - 2/2/13
* Fix to Q.UI.Button with an Asset
* Fix to MouseControls on Android
* Added UI example

### 0.0.4 GameState and MouseControls - 1/27/13
* Added Q.GameState for storing global game state ..
* .. listening for events on changes to global game state
* Added Q.input.mouseControls() for tracking mouse/touch locations
* Couple fixes to Q.UI.Text 
* Fix to Touch module on iOS

### 0.0.3 Move to update from step - 1/19/13

* Transitions scene from `step` to use `update`
* Simplified Sprite stepping with update (no _super necessary any longer)
* Added Scene locate method
* Add touch example with drag and locate details
* Added `drawableTile` and `collidableTile` to `Q.TileLayer`

Changes to your code:

* Your sprite's `step` method should no longer call `this._super(dt)` (in fact, sprites don't define a default super method anymore, so it'll cause a bug)- events are now handled by the `Sprite.update(dt)` method

### 0.0.2 Reworked Sprites and Scenes - 1/1/13

* Full SAT collision (rotation / scaling)
* Container / Children support
* Removed jQuery Dependency
* Reworked collisions (need optimizations)
* Add Quintus.UI module for containers, buttons and labels.
* Added animate and tween support


### 0.0.1 Unrelease 

* Initial Release
* Basic Sprite and Scene Support
* Limited Audio
* jQuery Dependency
* Keyframe animation support
* 2D Platformer controls and animation
* Limited SAT Collision (no rotation / scale)






