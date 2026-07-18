// scripts/generate-start-bg.js
//
// LibreSprite headless batch script: paints a 1920x1080 pixel-art cinematic
// backdrop for the StartScreen of "The Journey of Xoje". Follows the
// libresprite-cli-management Asset-Creation Protocol:
//   - Opens a pre-built transparent PNG template (no app.NewFile, segfaults).
//   - Reuses the audited drawRect / drawBorder / applyOutline helpers.
//   - Saves the final sprite as PNG to src/assets/start-bg.png.
//
// Design canon (docs/DESIGN.md + Lisa: The Painful reference):
//   - Desaturated dark palette.
//   - 1px sticker outlines (applyOutline) on every discrete figure.
//   - No pure white anywhere; muted greys for clouds.
//
// Run with:
//   SDL_VIDEODRIVER=dummy SDL_AUDIODRIVER=dummy \
//   LD_LIBRARY_PATH=~/tools/squashfs-root/usr/lib \
//   ~/tools/squashfs-root/usr/bin/libresprite --batch \
//     --script scripts/generate-start-bg.js
//
// The TEMPLATE_PATH and OUTPUT_PATH env vars can override defaults.

(function main() {
    // -------- Configuration --------
    var W = 1920;
    var H = 1080;
    var TEMPLATE_PATH = "/tmp/blank1920x1080.png";
    var OUTPUT_PATH = "/home/hermes/projects/the-journey-of-xoje/src/assets/start-bg.png";

    // -------- Palette (matches docs/DESIGN.md + delegated brief) --------
    var C = {
        SKY_TOP:   hex("#27272a"), // cenit
        SKY_MID2:  hex("#3f3f46"),
        SKY_MID:   hex("#52525b"), // middle band (brightest sky)
        SKY_MID2B: hex("#3f3f46"),
        SKY_BOT:   hex("#27272a"), // horizon
        SUN:       hex("#a16207"),
        SUN_DARK:  hex("#713f12"),
        CLOUD_HI:  hex("#71717a"),
        CLOUD_LO:  hex("#52525b"),
        HORIZON:   hex("#09090b"), // outline / horizon line
        GROUND:    hex("#1c1c1f"),
        GROUND_D:  hex("#27272a"),
        OUTLINE:   hex("#09090b"),
        WOOD:      hex("#3f3f46"),
        WOOD_DARK: hex("#27272a"),
        WINDOW:    hex("#09090b"),
        RUIN:      hex("#52525b"),
        MOUNTAIN:  hex("#3f3f46"),
    };

    // -------- Pre-flight --------
    // Use Fs.readFile-like from LibreSprite? Not available. We just attempt open
    // and let LibreSprite error out cleanly if the template is missing.
    console.log("[start-bg] opening template: " + TEMPLATE_PATH);

    var doc = app.open(TEMPLATE_PATH);
    if (!doc) {
        throw new Error("[start-bg] ABORT: cannot open template " + TEMPLATE_PATH);
    }
    var sprite = doc.sprite;
    if (!sprite) {
        throw new Error("[start-bg] ABORT: opened file has no .sprite");
    }
    var layer = sprite.layer(0);
    var cel = layer.cel(0);
    var img = cel.image;
    if (img.width !== W || img.height !== H) {
        // Resize via sprite.resize
        sprite.resize(W, H);
        // After resize the cel/image is replaced; re-fetch.
        cel = layer.cel(0);
        img = cel.image;
    }

    console.log("[start-bg] canvas: " + img.width + "x" + img.height);

    // ============================================================
    // 1. SKY — 5 horizontal bands from y=0 to y=700
    //    y=0..140  SKY_TOP
    //    y=140..280 SKY_MID2
    //    y=280..420 SKY_MID
    //    y=420..560 SKY_MID2B
    //    y=560..700 SKY_BOT
    //    Dither checker 2x2 between adjacent band edges.
    //    Plus a sparse starfield in the upper half (1px dots, dim grey).
    // ============================================================
    var skyBands = [
        { from: 0,   to: 140, color: C.SKY_TOP },
        { from: 140, to: 280, color: C.SKY_MID2 },
        { from: 280, to: 420, color: C.SKY_MID },
        { from: 420, to: 560, color: C.SKY_MID2B },
        { from: 560, to: 700, color: C.SKY_BOT },
    ];
    for (var b = 0; b < skyBands.length; b++) {
        var band = skyBands[b];
        drawRect(img, 0, band.from, W - 1, band.to, band.color);
    }
    // Dither transitions: 4-px dither strip between bands
    var transitions = [140, 280, 420, 560];
    for (var t = 0; t < transitions.length; t++) {
        var yEdge = transitions[t];
        var above = skyBands[t].color;
        var below = skyBands[t + 1].color;
        // 2 rows of checker dither centered on the edge: yEdge-1 and yEdge
        for (var yy = yEdge - 1; yy <= yEdge; yy++) {
            for (var xx = 0; xx < W; xx++) {
                var useAbove = ((xx + yy) & 2) === 0;
                img.putPixel(xx, yy, useAbove ? above : below);
            }
        }
    }
    // Sparse starfield in upper sky bands (deterministic pseudo-random).
    var STAR = hex("#a1a1aa");
    for (var sy = 8; sy < 380; sy += 6) {
        for (var sx = 0; sx < W; sx += 8) {
            // Noise based on (sx, sy): sparse 1 in 24 cells.
            var hash = (sx * 73856093) ^ (sy * 19349663);
            if (((hash >>> 0) % 24) === 0) drawPoint(img, sx, sy, STAR);
        }
    }
    // Twinkling dither stripes near the horizon (subtle atmospheric haze).
    for (var hzy = 640; hzy < 700; hzy += 4) {
        for (var hzx = 0; hzx < W; hzx++) {
            var useAboveSky = ((hzx + hzy) & 4) === 0;
            if (useAboveSky) {
                img.putPixel(hzx, hzy, hex("#52525b"));
            }
        }
    }

    // ============================================================
    // 2. SUN — disk #a16207 at (1500, 180), radius 80,
    //    dither ring toward #713f12, then applyOutline.
    // ============================================================
    drawDisc(img, 1500, 180, 80, C.SUN);
    // Dither outer ring (radius 70..79) checker toward SUN_DARK
    drawDitheredRing(img, 1500, 180, 80, 6, C.SUN, C.SUN_DARK);
    applyOutline(img, 1500 - 82, 180 - 82, 1500 + 82, 180 + 82);

    // ============================================================
    // 3. CLOUDS — 7 dirty clouds using 4x4 px drawRect blocks.
    //    Positions chosen to sit in mid-sky, not overlapping sun.
    //    Colors: CLOUD_HI (#71717a) + CLOUD_LO (#52525b) for depth.
    // ============================================================
    var cloudSpots = [
        { x: 220,  y: 220, cols: 9, rows: 3 },
        { x: 600,  y: 160, cols: 7, rows: 2 },
        { x: 1100, y: 260, cols: 8, rows: 3 },
        { x: 1700, y: 420, cols: 6, rows: 2 },
        { x: 380,  y: 340, cols: 5, rows: 2 },
        { x: 800,  y: 320, cols: 6, rows: 2 },
        { x: 1320, y: 380, cols: 4, rows: 2 },
    ];
    for (var ci = 0; ci < cloudSpots.length; ci++) {
        var cs = cloudSpots[ci];
        var colorA = (ci & 1) ? C.CLOUD_LO : C.CLOUD_HI;
        var colorB = (ci & 1) ? C.CLOUD_HI : C.CLOUD_LO;
        drawCloud(img, cs.x, cs.y, cs.cols, cs.rows, colorA, colorB);
    }

    // ============================================================
    // 4. HORIZON LINE — full-width 1px black at y=700.
    // ============================================================
    drawHLine(img, 0, 700, W - 1, C.HORIZON);

    // ============================================================
    // 5. HORIZON SILHOUETTES — y in [680, 760]
    //    a) Twisted dead tree at x=200
    //    b) Broken ruin at x=600
    //    c) Leaning pole at x=1100
    //    d) Odd mountain at x=1450, 3 asymmetric peaks
    // ============================================================

    // (a) Dead tree — trunk 4x24 + 3 zig-zag branches
    drawTwistedTree(img, 200, 760);
    applyOutline(img, 192, 700, 220, 760);

    // (b) Broken rectangular ruin with empty black window
    drawRuin(img, 600, 760);
    applyOutline(img, 588, 706, 636, 760);

    // (c) Leaning pole, ~15deg tilt, 4x30
    drawLeaningPole(img, 1100, 760);
    applyOutline(img, 1093, 712, 1108, 760);

    // (d) Mountain silhouette, 3 asymmetric peaks
    drawMountain(img, 1450, 760);
    applyOutline(img, 1395, 700, 1525, 760);

    // ============================================================
    // 6. GROUND — y=760..1079 base #1c1c1f, dither stripes #27272a
    //    every 8 logical pixels, plus a foreground debris band (pebbles
    //    and sparse brighter pixels) so the PNG doesn't compress to
    //    nothing.
    // ============================================================
    drawRect(img, 0, 760, W - 1, H - 1, C.GROUND);
    // Full dither stripes: each 16-px band is checker-mixed GROUND / GROUND_D.
    // The phase of the checker alternates per band, so consecutive stripes
    // appear distinguishable to the eye but the row-by-row entropy stays.
    for (var gy = 760; gy < H; gy++) {
        var bandIdx = Math.floor((gy - 760) / 16);
        var inBand = (gy - 760) % 16;
        // Stripe geometry: 4 px solid GROUND_D, 4 px solid GROUND, repeat
        // (gives visible stripes plus high local entropy).
        var stripe = Math.floor(inBand / 2) % 4; // 0..3
        var c = (stripe === 0) ? C.GROUND_D : (stripe === 2 ? C.GROUND : (gy & 1 ? C.GROUND : C.GROUND_D));
        for (var gxx = 0; gxx < W; gxx++) {
            // Horizontal micro-jitter: every other column flips.
            if (((gxx + gy + bandIdx) & 3) === 0) c = (c === C.GROUND) ? C.GROUND_D : C.GROUND;
            img.putPixel(gxx, gy, c);
        }
    }
    // Pebbles & dirt detail: scattered 1px-2px lighter and darker points.
    var PEB_HI = hex("#3f3f46");
    var PEB_LO = hex("#09090b");
    for (var py = 770; py < H; py += 3) {
        for (var ppx = 0; ppx < W; ppx += 4) {
            var ph = (ppx * 2654435761) ^ (py * 40503);
            var mod = (ph >>> 0) % 24;
            if (mod === 0) drawPoint(img, ppx, py, PEB_HI);
            else if (mod === 1) drawPoint(img, ppx, py, PEB_LO);
            else if (mod === 2) drawPoint(img, ppx + 1, py, PEB_HI);
            else if (mod === 3) drawPoint(img, ppx + 2, py + 1, PEB_LO);
        }
    }
    // Foreground dark band along the very bottom (so the dither stripes end
    // visibly under the viewport at zoom).
    drawRect(img, 0, 1060, W - 1, H - 1, hex("#09090b"));

    // ============================================================
    // 7. VILLAGE/CAMP SILHOUETTES — y in [740, 760], height 12-20 px
    //    Stout slouched figures + shacks + dry grass tufts.
    // ============================================================
    drawSlouchedFigure(img, 300,  760, 16);
    drawSlouchedFigure(img, 850,  760, 18);
    drawSlouchedFigure(img, 1300, 760, 14);
    drawSlouchedFigure(img, 1700, 760, 17);

    drawShack(img, 480,  760, 22, 12);
    drawShack(img, 1020, 760, 18, 10);

    drawGrassTuft(img, 308,  760, 6);
    drawGrassTuft(img, 858,  760, 5);
    drawGrassTuft(img, 1308, 760, 6);
    drawGrassTuft(img, 1708, 760, 5);

    // Apply outline on the village strip as a whole (figures + shacks).
    applyOutline(img, 290, 740, 1720, 760);

    // ============================================================
    // 8. Save.
    // ============================================================
    sprite.saveAs(OUTPUT_PATH);
    console.log("[start-bg] saved: " + OUTPUT_PATH);
    doc.close();
    console.log("[start-bg] DONE");

    // ============================================================
    // ===== Helpers (audited from libresprite-cli-management) =====
    // ============================================================
    function hex(s) {
        // "#rrggbb" -> [r,g,b,255]
        var r = parseInt(s.substr(1, 2), 16);
        var g = parseInt(s.substr(3, 2), 16);
        var b = parseInt(s.substr(5, 2), 16);
        return app.pixelColor.rgba(r, g, b, 255);
    }

    function drawPoint(img, x, y, rgba) {
        img.putPixel(x, y, rgba);
    }

    function drawHLine(img, x1, y, x2, rgba) {
        if (x2 < x1) { var tmp = x1; x1 = x2; x2 = tmp; }
        for (var x = x1; x <= x2; x++) drawPoint(img, x, y, rgba);
    }

    function drawVLine(img, x, y1, y2, rgba) {
        if (y2 < y1) { var tmp = y1; y1 = y2; y2 = tmp; }
        for (var y = y1; y <= y2; y++) drawPoint(img, x, y, rgba);
    }

    function drawRect(img, x1, y1, x2, y2, rgba) {
        if (x2 < x1) { var tmp = x1; x1 = x2; x2 = tmp; }
        if (y2 < y1) { var tmp = y1; y1 = y2; y2 = tmp; }
        for (var y = y1; y <= y2; y++) {
            for (var x = x1; x <= x2; x++) drawPoint(img, x, y, rgba);
        }
    }

    function drawBorder(img, x1, y1, x2, y2, rgba) {
        drawHLine(img, x1, y1, x2, rgba);
        drawHLine(img, x1, y2, x2, rgba);
        drawVLine(img, x1, y1, y2, rgba);
        drawVLine(img, x2, y1, y2, rgba);
    }

    /**
     * Audited 1px sticker outline. Restricts the scan to the bounding box
     * [bx1,by1]-[bx2,by2] so the operation is O(box) not O(canvas).
     */
    function applyOutline(img, bx1, by1, bx2, by2) {
        var black = C.OUTLINE;
        if (bx1 < 0) bx1 = 0;
        if (by1 < 0) by1 = 0;
        if (bx2 >= img.width)  bx2 = img.width  - 1;
        if (by2 >= img.height) by2 = img.height - 1;

        var h = img.height;
        var w = img.width;
        var isOpaque = {};

        for (var y = by1; y <= by2; y++) {
            for (var x = bx1; x <= bx2; x++) {
                var colVal = img.getPixel(x, y);
                var alpha = app.pixelColor.rgbaA(colVal);
                if (alpha > 0) isOpaque[x + "," + y] = true;
            }
        }

        for (var y = by1; y <= by2; y++) {
            for (var x = bx1; x <= bx2; x++) {
                if (isOpaque[x + "," + y]) continue;
                var neighbor =
                    isOpaque[(x - 1) + "," + y] ||
                    isOpaque[(x + 1) + "," + y] ||
                    isOpaque[x + "," + (y - 1)] ||
                    isOpaque[x + "," + (y + 1)];
                if (neighbor) drawPoint(img, x, y, black);
            }
        }
    }

    /**
     * Filled disc using midpoint algorithm, color = rgba.
     */
    function drawDisc(img, cx, cy, r, rgba) {
        for (var y = cy - r; y <= cy + r; y++) {
            for (var x = cx - r; x <= cx + r; x++) {
                var dx = x - cx, dy = y - cy;
                if (dx * dx + dy * dy <= r * r) drawPoint(img, x, y, rgba);
            }
        }
    }

    /**
     * Dithered outer ring of a disc.
     *   rOuter = outer radius
     *   width  = thickness of the dither ring
     */
    function drawDitheredRing(img, cx, cy, rOuter, width, bright, dark) {
        for (var y = cy - rOuter; y <= cy + rOuter; y++) {
            for (var x = cx - rOuter; x <= cx + rOuter; x++) {
                var dx = x - cx, dy = y - cy;
                var d2 = dx * dx + dy * dy;
                var r = rOuter;
                if (d2 <= r * r && d2 > (r - width) * (r - width)) {
                    var useDark = ((x + y) & 1) === 0;
                    drawPoint(img, x, y, useDark ? dark : bright);
                }
            }
        }
    }

    /**
     * Dirty cloud: 4x4 px logical blocks. Draws an oblong blob with a
     * slightly irregular bottom and a darker underside band.
     *
     *   cols   = number of 4-px columns
     *   rows   = number of 4-px rows
     *   top    = hi color
     *   bottom = lo color
     */
    function drawCloud(img, cx, cy, cols, rows, top, bottom) {
        var STEP = 4;
        var w = cols * STEP;
        var h = rows * STEP;
        var x0 = cx - Math.floor(w / 2);
        var y0 = cy - Math.floor(h / 2);

        // Bounding rect of the cloud.
        for (var by = 0; by < h; by += STEP) {
            for (var bx = 0; bx < w; bx += STEP) {
                // Make the top irregular: skip a couple of edge blocks at the
                // top and bottom corners using a deterministic "jitter".
                var edgeSkip =
                    (by === 0 && (bx === 0 || bx === w - STEP)) ||
                    (by === h - STEP && bx === 0);
                if (edgeSkip) continue;

                var color = (by >= h - STEP) ? bottom : top;
                drawRect(img, x0 + bx, y0 + by, x0 + bx + STEP - 1, y0 + by + STEP - 1, color);
            }
        }
    }

    /**
     * Twisted dead tree at baseY.
     *   Trunk 4x24 px, leans right 3 px per 8 px of height.
     *   3 zig-zag branches: one mid-left, one mid-right, one short top.
     */
    function drawTwistedTree(img, baseX, baseY) {
        var trunkH = 24;
        var trunkW = 4;
        var lean = 3; // px lean per 8 px height
        for (var i = 0; i < trunkH; i++) {
            var step = Math.floor(i / 8);
            var dx = lean * step;
            drawRect(img, baseX - Math.floor(trunkW / 2) + dx, baseY - trunkH + i,
                     baseX - Math.floor(trunkW / 2) + dx + trunkW - 1,
                     baseY - trunkH + i, C.WOOD);
        }
        // Branch 1: mid-left zig (around y = baseY-18, going left)
        drawHLine(img, baseX - 8, baseY - 18, baseX - 2, C.WOOD);
        drawHLine(img, baseX - 10, baseY - 16, baseX - 3, C.WOOD);
        // Branch 2: mid-right zig (around y = baseY-12)
        drawHLine(img, baseX + 2, baseY - 12, baseX + 9, C.WOOD);
        drawHLine(img, baseX + 3, baseY - 10, baseX + 11, C.WOOD);
        // Branch 3: top stub (around y = baseY-22)
        drawHLine(img, baseX - 1, baseY - 22, baseX + 4, C.WOOD);
        drawHLine(img, baseX + 1, baseY - 23, baseX + 3, C.WOOD);
    }

    /**
     * Broken rectangular ruin: a hollow house with one wall collapsed.
     *   Body 40x48 px sitting on baseY, with a 6x8 black window.
     *   Roof slants down to the right, leaving the right side open.
     */
    function drawRuin(img, baseX, baseY) {
        var w = 48;
        var h = 48;
        var x0 = baseX - Math.floor(w / 2);
        var y0 = baseY - h;
        // Left wall (full)
        drawRect(img, x0, y0, x0 + 3, baseY - 1, C.RUIN);
        // Back wall (top + partial bottom)
        drawRect(img, x0, y0, x0 + w - 1, y0 + 3, C.RUIN);
        // Right wall — half height (broken)
        drawRect(img, x0 + w - 4, y0, x0 + w - 1, y0 + Math.floor(h / 2) - 1, C.RUIN);
        // Floor
        drawRect(img, x0, baseY - 4, x0 + w - 1, baseY - 1, C.WOOD_DARK);
        // Window (empty black) centered upper half
        var winX = x0 + Math.floor(w / 2) - 3;
        var winY = y0 + 12;
        drawRect(img, winX, winY, winX + 6, winY + 8, C.WINDOW);
        // A jagged broken corner top-right (suggesting rubble)
        drawRect(img, x0 + w - 12, y0 + 4, x0 + w - 5, y0 + 7, C.WOOD_DARK);
        drawRect(img, x0 + w - 8,  y0 + 8, x0 + w - 1, y0 + 11, C.WOOD_DARK);
    }

    /**
     * Leaning pole, ~15deg tilt: trunk 4x30, top shifted right by ~8 px.
     */
    function drawLeaningPole(img, baseX, baseY) {
        var trunkH = 30;
        var trunkW = 4;
        var lean = 8; // top offset
        for (var i = 0; i < trunkH; i++) {
            var dx = Math.floor((lean * i) / trunkH);
            drawRect(img, baseX + dx, baseY - trunkH + i,
                     baseX + dx + trunkW - 1, baseY - trunkH + i, C.WOOD);
        }
        // Crossbar
        var topY = baseY - trunkH;
        var topDx = lean;
        drawHLine(img, baseX + topDx - 5, topY + 4, baseX + topDx + 5, C.WOOD);
    }

    /**
     * Mountain silhouette with 3 asymmetric peaks.
     *   Peaks at baseX-30, baseX, baseX+40; heights 38, 56, 30.
     *   Outline applied by caller.
     */
    function drawMountain(img, baseX, baseY) {
        var peaks = [
            { dx: -30, h: 38 },
            { dx: 0,   h: 56 },
            { dx: 40,  h: 30 },
        ];
        for (var p = 0; p < peaks.length; p++) {
            var pk = peaks[p];
            var cx = baseX + pk.dx;
            var peakY = baseY - pk.h;
            // Draw a triangle.
            for (var y = peakY; y < baseY; y++) {
                var t = (y - peakY) / (baseY - peakY); // 0..1
                var halfW = Math.floor((baseY - y) * 0.6);
                drawHLine(img, cx - halfW, y, cx + halfW, C.MOUNTAIN);
            }
        }
        // Base band tying all peaks together (smoother horizon look).
        drawRect(img, baseX - 80, baseY - 4, baseX + 80, baseY - 1, C.MOUNTAIN);
    }

    /**
     * Stout slouched figure: a short silhouette 4-6 px wide, 12-20 px tall,
     * with a heavy shoulder hump (classic Lisa: The Painful posture).
     */
    function drawSlouchedFigure(img, baseX, baseY, height) {
        var w = 6;
        var x0 = baseX - Math.floor(w / 2);
        var y0 = baseY - height;
        // Head (2x2)
        drawRect(img, x0 + 1, y0, x0 + 3, y0 + 2, C.OUTLINE);
        // Shoulders / hump
        drawRect(img, x0 - 1, y0 + 3, x0 + w, y0 + 5, C.OUTLINE);
        // Body / torso
        drawRect(img, x0, y0 + 6, x0 + w - 1, y0 + height - 4, C.OUTLINE);
        // Legs (split base)
        drawRect(img, x0, y0 + height - 3, x0 + 2, y0 + height - 1, C.OUTLINE);
        drawRect(img, x0 + 4, y0 + height - 3, x0 + w - 1, y0 + height - 1, C.OUTLINE);
    }

    /**
     * Small shack: a tilted roof rectangle, 22x12 px default.
     */
    function drawShack(img, baseX, baseY, w, h) {
        var x0 = baseX - Math.floor(w / 2);
        var y0 = baseY - h;
        // Walls
        drawRect(img, x0, y0 + 4, x0 + w - 1, baseY - 1, C.OUTLINE);
        // Roof slants slightly to the right
        for (var i = 0; i < w; i++) {
            var yShift = Math.floor((i * 3) / w);
            drawRect(img, x0 + i, y0 - yShift, x0 + i, y0 + 3 - yShift, C.OUTLINE);
        }
        // Door (small black slit)
        drawRect(img, x0 + Math.floor(w / 2) - 1, baseY - 5, x0 + Math.floor(w / 2) + 1, baseY - 1, C.WINDOW);
    }

    /**
     * Dry grass tuft: 3 short vertical strokes next to a figure.
     */
    function drawGrassTuft(img, baseX, baseY, height) {
        var h = height || 5;
        for (var i = 0; i < 3; i++) {
            drawVLine(img, baseX + i - 1, baseY - h, baseY - 1, C.OUTLINE);
        }
    }
})();
