// scripts/generate-crmble-background.js
// Generates a 128×512 tileable biome background for Crmble.
//
// Style: warm coral / peach palette inspired by the Crmble landing
// (coral primary CTA, cream background, blush accents). Painted as
// horizontal "warm stripes" with a faint dotted grid and a few orange
// splotches for visual rhythm. The shared yellow orientation pixel
// (rgba(241, 196, 15)) keeps the NPC coin colour consistent across
// biomes — same approach as LCS Robotics.
//
// Run: pnpm generate-crmble-background
// Output: src/assets/biomes/crmble/crmble-background.png (128x512 RGBA PNG)

try {
  console.log("==================================================");
  console.log("LibreSprite - Generating Crmble background tile");
  console.log("==================================================");

  var col = app.pixelColor;

  // Palette --------------------------------------------------------------
  // Warm peach base + darker coral shade + cream highlight + bright
  // orange splotches + shared yellow orientation marker.
  var BG_BASE    = [254, 215, 170, 255]; // #fed7aa peach 200
  var BG_SHADE   = [253, 186, 116, 255]; // #fdba74 peach 300
  var BG_HI      = [254, 243, 199, 255]; // #fef3c7 amber 100 (cream highlight)
  var BG_RUST    = [251, 146, 60,  255]; // #fb923c orange 400
  var BG_RUST_HI = [254, 215, 170, 255]; // same as BG_BASE, peach soft edge
  var BG_YELLOW  = [241, 196, 15,  255]; // #f1c40f shared with NPC coin
  var BG_GRID    = [253, 186, 116, 255]; // #fdba74 dotted grid

  var W = 128;
  var H = 512;

  // Open the blank 128x512 RGBA template (transparent pixels).
  var doc = app.open("/home/hermes/projects/the-journey-of-xoje/scripts/blank-crmble-background.png");
  var sprite = doc.sprite;
  var img = sprite.layer(0).cel(0).image;

  function put(x, y, c) { img.putPixel(x, y, col.rgba(c[0], c[1], c[2], c[3])); }

  // 1. Base fill (warm peach) --------------------------------------------
  for (var y = 0; y < H; y++) {
    for (var x = 0; x < W; x++) {
      put(x, y, BG_BASE);
    }
  }

  // 2. Horizontal "warm" bands (alternating highlight/shade) -----------
  //    4 bands of 32px each give a subtle coral stripe rhythm.
  for (var y = 0; y < H; y++) {
    var band = (y >> 5) & 0x3; // 0..3 every 32px
    var c;
    if (band === 0) c = BG_HI;
    else if (band === 2) c = BG_SHADE;
    else c = BG_BASE;
    for (var x = 0; x < W; x++) {
      put(x, y, c);
    }
  }

  // 3. Faint dotted grid (every 16px) ------------------------------------
  for (var y = 0; y < H; y += 16) {
    for (var x = 0; x < W; x += 16) {
      put(x, y, BG_GRID);
      put(x + 1, y, BG_GRID);
      put(x, y + 1, BG_GRID);
    }
  }

  // 4. A few bright orange splotches (design-system "card" hints) -------
  //    Deterministic positions so the tile is identical every run and
  //    tiles seamlessly at the seams.
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
        // Edge highlight: top row uses the highlight variant, the
        // rest uses the base orange colour. Gives a 1px bevel without
        // drawing a real outline.
        put(s.x + dx, s.y + dy, dy === 0 ? BG_RUST_HI : BG_RUST);
      }
    }
  }

  // 5. Single yellow pixel per 256 rows (orientation marker, very rare)
  for (var y = 127; y < H; y += 256) {
    put(64, y, BG_YELLOW);
  }

  sprite.saveAs("/home/hermes/projects/the-journey-of-xoje/src/assets/biomes/crmble/crmble-background.png");
  doc.close();

  console.log("==================================================");
  console.log("[SUCCESS] Crmble background tile generated: 128x512 RGBA PNG");
  console.log("[OUTPUT]  src/assets/biomes/crmble/crmble-background.png");
  console.log("==================================================");
} catch (e) {
  console.log("Critical Error: " + e.toString());
}