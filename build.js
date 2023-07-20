var cat = require('shelljs').cat;
const fs = require('fs');
var files = [

  "license.txt",
  "lib/quintus.js",
  "lib/quintus_2d.js",
  "lib/quintus_anim.js",
  "lib/quintus_audio.js",
  "lib/quintus_input.js",
  "lib/quintus_scenes.js",
  "lib/quintus_sprites.js",
  "lib/quintus_tmx.js",
  "lib/quintus_touch.js",
  "lib/quintus_ui.js",
  "extra/quintus_svg.js",
  "extra/quintus_dom.js",
  "extra/quintus_physics.js"

];

var builds = {

  "quintus.js": [
  ],

};

for (var key in builds) {

  var extra = builds[key];

  var all = files.concat(extra)
  var output = "";

  for (var i = 0; i < all.length; i++) {
    output += "\n\n/* file: " + all[i] + " */\n\n";
    output += cat(all[i]);
  }
  fs.writeFileSync("build/" + key,output, {
    encoding: "utf8"
  });
  console.log(`${key} Build Finished`)
}