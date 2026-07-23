// scripts/generate-rideon-background.js
// Generates a 128×512 tileable biome background for RIDE ON.
//
// Style: cycling-tech dark palette inspired by the RIDE ON landing
// (near-black background with bright "Workshop+" yellow accents and
// mid-gray panel stripes). The dark base sits close to the rest of
// the game's chrome but the bright yellow splotches keep the biome
// visually distinct. Yellow orientation marker matches the NPC coin.
//
// Run: pnpm generate-rideon-background
// Output: src/assets/biomes/ride-on/ride-on-background.png (128x512 RGBA PNG)

try {
  console.log("==================================================");
  console.log("LibreSprite - Generating RIDE ON background tile");
  console.log("==================================================");

  var col = app.pixelColor;

  // Palette --------------------------------------------------------------
  // Near-black base, gray-800 shade, gray-700 highlight, yellow-400
  // splotches with yellow-300 bevel, gray-700 dotted grid.
  var BG_BASE    = [10,  10,  10,  255]; // #0a0a0a near-black
  var BG_SHADE   = [31,  41,  55,  255]; // #1f2937 gray-800
  var BG_HI      = [55,  65,  81,  255]; // #374151 gray-700
  var BG_RUST    = [250, 204, 21,  255]; // #facc15 yellow-400
  var BG_RUST_HI = [253, 224, 71,  255]; // #fde047 yellow-300 bevel
  var BG_YELLOW  = [250, 204, 21,  255]; // #facc15 (yellow itself, used as orientation + splotches)
  var BG_GRID    = [55,  65,  81,  255]; // #374151 gray-700 grid

  var W = 128;
  var H = 512;

  var doc = app.open("/home/hermes/projects/the-journey-of-xoje/scripts/blank-rideon-background.png");
  var sprite = doc.sprite;
  var img = sprite.layer(0).cel(0).image;

  function put(x, y, c) { img.putPixel(x, y, col.rgba(c[0], c[1], c[2], c[3])); }

  // 1. Base fill (near-black)
  for (var y = 0; y < H; y++) {
    for (var x = 0; x < W; x++) {
      put(x, y, BG_BASE);
    }
  }

  // 2. Horizontal bands (alternating highlight/shade)
  for (var y = 0; y < H; y++) {
    var band = (y >> 5) & 0x3;
    var c;
    if (band === 0) c = BG_HI;
    else if (band === 2) c = BG_SHADE;
    else c = BG_BASE;
    for (var x = 0; x < W; x++) {
      put(x, y, c);
    }
  }

  // 3. Faint dotted grid (every 16px)
  for (var y = 0; y < H; y += 16) {
    for (var x = 0; x < W; x += 16) {
      put(x, y, BG_GRID);
      put(x + 1, y, BG_GRID);
      put(x, y + 1, BG_GRID);
    }
  }

  // 4. Bright yellow splotches ("Workshop+" brand cue)
  var splotches = [
    { x: 18,  y: 24,  w: 8, h: 4 },
    { x: 60,  y: 88,  w: 6, h: 3 },
    { x: 96,  y: 152, w: 10, h: 5 },
    { x: 30,  y: 220, w: 7, h: 4 },
    { x: 72,  y: 296, w: 9, h: 4 },
    { x: 16,  y: 360, w: 6, h: 3 },
    { x: 100, y: 432, w: 8, h: 4 },
    { x: 50,  y: 488, w: 7, h: 3 },
  ];
  for (var i = 0; i < splotches.length; i++) {
    var s = splotches[i];
    for (var dy = 0; dy < s.h; dy++) {
      for (var dx = 0; dx < s.w; dx++) {
        put(s.x + dx, s.y + dy, dy === 0 ? BG_RUST_HI : BG_RUST);
      }
    }
  }

  // 5. Single yellow pixel per 256 rows (orientation marker)
  for (var y = 127; y < H; y += 256) {
    put(64, y, BG_YELLOW);
  }

  sprite.saveAs("/home/hermes/projects/the-journey-of-xoje/src/assets/biomes/ride-on/ride-on-background.png");
  doc.close();

  console.log("==================================================");
  console.log("[SUCCESS] RIDE ON background tile generated: 128x512 RGBA PNG");
  console.log("[OUTPUT]  src/assets/biomes/ride-on/ride-on-background.png");
  console.log("==================================================");
} catch (e) {
  console.log("Critical Error: " + e.toString());
}