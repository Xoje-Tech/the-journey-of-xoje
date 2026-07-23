// scripts/generate-twinny-background.js
// Generates a 128×512 tileable biome background for Twinny.
//
// Style: violet / indigo AI-SaaS palette inspired by the Twinny
// landing. Dark base so the biome stays consistent with the rest of
// the game's dark chrome; brighter violet bands and splotches provide
// the visual rhythm. Shared yellow orientation marker keeps the NPC
// coin colour consistent across biomes.
//
// Run: pnpm generate-twinny-background
// Output: src/assets/biomes/twinny/twinny-background.png (128x512 RGBA PNG)

try {
  console.log("==================================================");
  console.log("LibreSprite - Generating Twinny background tile");
  console.log("==================================================");

  var col = app.pixelColor;

  // Palette --------------------------------------------------------------
  // Indigo-900 base, violet-900 shade, violet-400 highlight, violet-600
  // splotches with violet-400 bevel, violet-900 dotted grid.
  var BG_BASE    = [49,  46, 129, 255]; // #312e81 indigo-900
  var BG_SHADE   = [76,  29, 149, 255]; // #4c1d95 violet-900
  var BG_HI      = [167, 139, 250, 255]; // #a78bfa violet-400
  var BG_RUST    = [139, 92,  246, 255]; // #8b5cf6 violet-500
  var BG_RUST_HI = [167, 139, 250, 255]; // #a78bfa violet-400 bevel
  var BG_YELLOW  = [241, 196, 15,  255]; // #f1c40f shared with NPC coin
  var BG_GRID    = [76,  29, 149, 255]; // #4c1d95 violet-900 grid

  var W = 128;
  var H = 512;

  var doc = app.open("/home/hermes/projects/the-journey-of-xoje/scripts/blank-twinny-background.png");
  var sprite = doc.sprite;
  var img = sprite.layer(0).cel(0).image;

  function put(x, y, c) { img.putPixel(x, y, col.rgba(c[0], c[1], c[2], c[3])); }

  // 1. Base fill (deep indigo)
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

  // 4. Violet splotches (deterministic positions for seam alignment)
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

  // 5. Single yellow pixel per 256 rows
  for (var y = 127; y < H; y += 256) {
    put(64, y, BG_YELLOW);
  }

  sprite.saveAs("/home/hermes/projects/the-journey-of-xoje/src/assets/biomes/twinny/twinny-background.png");
  doc.close();

  console.log("==================================================");
  console.log("[SUCCESS] Twinny background tile generated: 128x512 RGBA PNG");
  console.log("[OUTPUT]  src/assets/biomes/twinny/twinny-background.png");
  console.log("==================================================");
} catch (e) {
  console.log("Critical Error: " + e.toString());
}