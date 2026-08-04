// scripts/generate-lcs-background.js
// Generates a 128×512 tileable biome background for LCS Robotics.
//
// Style: subtle industrial concrete + a few oxide (rust) splotches and
// a single yellow orientation pixel. Color palette mirrors the
// yellow NPC coin (rgba(241, 196, 15, 0.25)) and the dialog
// background (#1c1c1f) so the background feels native to the rest of
// the chrome. `ctx.createPattern(..., 'repeat')` does the tiling in
// drawBiomes; this script only authors ONE 128x512 tile.
//
// Run: pnpm generate-lcs-background
// Output: src/assets/biomes/lcs/lcs-background.png (128x512 RGBA PNG)

try {
  console.log("==================================================");
  console.log("LibreSprite - Generating LCS Robotics background tile");
  console.log("==================================================");

  var col = app.pixelColor;

  // Palette --------------------------------------------------------------
  // Concrete base (cool dark grey), warm oxide accents, and a single
  // yellow pixel for orientation (1 per 256 rows = subtle, not a stripe).
  var BG_BASE    = [42,  46,  52,  255];
  var BG_SHADE   = [34,  37,  42,  255];
  var BG_HI      = [56,  60,  68,  255];
  var BG_RUST    = [124, 80,  56,  255];
  var BG_RUST_HI = [168, 110, 76,  255];
  var BG_YELLOW  = [241, 196, 15,  255];
  var BG_GRID    = [70,  74,  82,  255];

  var W = 128;
  var H = 512;

  // Open the blank 128x512 RGBA template (transparent pixels). We
  // paint the same pattern onto the only layer, then saveAs.
  var doc = app.open("/home/hermes/projects/the-journey-of-xoje/scripts/blank-lcs-background.png");
  var sprite = doc.sprite;
  var img = sprite.layer(0).cel(0).image;

  function put(x, y, c) { img.putPixel(x, y, col.rgba(c[0], c[1], c[2], c[3])); }

  // 1. Base fill (cool dark grey) -----------------------------------------
  for (var y = 0; y < H; y++) {
    for (var x = 0; x < W; x++) {
      put(x, y, BG_BASE);
    }
  }

  // 2. Horizontal "concrete" bands (alternating highlight/shade) ----------
  //    4 bands of 32px each give a subtle industrial floor stripe.
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

  // 4. A few warm-oxide splotches (industrial rust) ---------------------
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
        // rest uses the base oxide colour. Gives a 1px bevel without
        // drawing a real outline.
        put(s.x + dx, s.y + dy, dy === 0 ? BG_RUST_HI : BG_RUST);
      }
    }
  }

  // 5. Single yellow pixel per 256 rows (orientation marker, very rare)
  for (var y = 127; y < H; y += 256) {
    put(64, y, BG_YELLOW);
  }

  sprite.saveAs("/home/hermes/projects/the-journey-of-xoje/src/assets/biomes/lcs/lcs-background.png");
  doc.close();

  console.log("==================================================");
  console.log("[SUCCESS] LCS Robotics background tile generated: 128x512 RGBA PNG");
  console.log("[OUTPUT]  src/assets/biomes/lcs/lcs-background.png");
  console.log("==================================================");
} catch (e) {
  console.log("Critical Error: " + e.toString());
}
