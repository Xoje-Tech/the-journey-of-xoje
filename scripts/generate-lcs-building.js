try {
    console.log("==================================================");
    console.log("LibreSprite - Generating LCS Robotics Building Sprite");
    console.log("==================================================");
    
    // 1. Open our blank 64x64 template
    var doc = app.open("/home/hermes/projects/the-journey-of-xoje/scripts/blank64.png");
    var sprite = doc.sprite;
    var img = sprite.layer(0).cel(0).image;
    
    var col = app.pixelColor;
    
    // Helper to draw a single pixel
    function drawPoint(img, x, y, rgba) {
        img.putPixel(x, y, col.rgba(rgba[0], rgba[1], rgba[2], rgba[3]));
    }
    
    // Helper to draw a solid rectangle
    function drawRect(img, x1, y1, x2, y2, rgba) {
        for (var y = y1; y <= y2; y++) {
            for (var x = x1; x <= x2; x++) {
                drawPoint(img, x, y, rgba);
            }
        }
    }
    
    // Colors
    var cWall = [64, 64, 74, 255];       // Dark steel-grey brick
    var cWallHi = [94, 94, 110, 255];     // Highlight grey
    var cWallLo = [40, 40, 48, 255];      // Shadow grey
    var cRoof = [32, 32, 36, 255];        // Deep charcoal roof
    var cWindowGlass = [100, 200, 255, 255]; // Glowing cian
    var cWindowFrame = [20, 28, 38, 255];   // Dark window frames
    var cText = [240, 240, 245, 255];     // Off-white silver
    
    console.log("Drawing factory main body and chimney...");
    // Main factory structure
    drawRect(img, 8, 22, 55, 58, cWall);
    
    // Chimney
    drawRect(img, 12, 10, 17, 21, cWall);
    drawRect(img, 11, 8, 18, 9, cRoof); // chimney cap
    
    // Roof cap (overhanging top edge)
    drawRect(img, 6, 20, 57, 21, cRoof);
    
    console.log("Adding architectural bevels and depth shadows...");
    // Left edge highlights
    for (var y = 22; y <= 58; y++) {
        drawPoint(img, 8, y, cWallHi);
    }
    for (var y = 10; y <= 19; y++) {
        drawPoint(img, 12, y, cWallHi);
    }
    
    // Right edge shadows
    for (var y = 22; y <= 58; y++) {
        drawPoint(img, 55, y, cWallLo);
    }
    for (var y = 10; y <= 19; y++) {
        drawPoint(img, 17, y, cWallLo);
    }
    
    console.log("Drawing 3 glowing robotics windows...");
    function drawWindow(startX, startY) {
        // Window Frame (10x12 px)
        drawRect(img, startX, startY, startX + 9, startY + 11, cWindowFrame);
        // Window Glass (8x10 px)
        drawRect(img, startX + 1, startY + 1, startX + 8, startY + 10, cWindowGlass);
        // Window divider lines (panes)
        for (var y = startY + 1; y <= startY + 10; y++) {
            drawPoint(img, startX + 4, y, cWindowFrame);
        }
        for (var x = startX + 1; x <= startX + 8; x++) {
            drawPoint(img, x, startY + 5, cWindowFrame);
        }
    }
    drawWindow(13, 38);
    drawWindow(27, 38);
    drawWindow(41, 38);
    
    console.log("Drawing LCS Sign text using 3x5 font...");
    var fontL = [
        "1..",
        "1..",
        "1..",
        "1..",
        "111"
    ];
    var fontC = [
        "111",
        "1..",
        "1..",
        "1..",
        "111"
    ];
    var fontS = [
        "111",
        "1..",
        "111",
        "..1",
        "111"
    ];
    
    function drawLetter(img, font, startX, startY, rgba) {
        for (var r = 0; r < 5; r++) {
            var row = font[r];
            for (var c = 0; c < 3; c++) {
                if (row.charAt(c) === "1") {
                    drawPoint(img, startX + c, startY + r, rgba);
                }
            }
        }
    }
    
    // Centered sign background
    drawRect(img, 24, 25, 39, 31, cWindowFrame);
    
    // Draw letters
    drawLetter(img, fontL, 26, 26, cText);
    drawLetter(img, fontC, 31, 26, cText);
    drawLetter(img, fontS, 36, 26, cText);
    
    console.log("Applying heavy retro pixel outline...");
    function applyOutline(img) {
        var black = [0, 0, 0, 255];
        var h = img.height;
        var w = img.width;
        var isOpaque = {};
        
        for (var y = 0; y < h; y++) {
            for (var x = 0; x < w; x++) {
                var colVal = img.getPixel(x, y);
                var alpha = col.rgbaA(colVal);
                if (alpha > 0) {
                    isOpaque[x + "," + y] = true;
                }
            }
        }
        
        for (var y = 1; y < h - 1; y++) {
            for (var x = 1; x < w - 1; x++) {
                if (isOpaque[x + "," + y]) continue;
                
                var hasOpaqueNeighbor = (
                    isOpaque[x + "," + (y - 1)] ||
                    isOpaque[x + "," + (y + 1)] ||
                    isOpaque[(x - 1) + "," + y] ||
                    isOpaque[(x + 1) + "," + y]
                );
                
                if (hasOpaqueNeighbor) {
                    drawPoint(img, x, y, black);
                }
            }
        }
    }
    applyOutline(img);
    
    console.log("Saving generated building sprite to assets...");
    sprite.saveAs("/home/hermes/projects/the-journey-of-xoje/src/assets/lcs-building.png");
    console.log("Closing active document...");
    doc.close();
    
    console.log("==================================================");
    console.log("[SUCCESS] LCS Robotics Building Sprite generated successfully!");
    console.log("==================================================");
} catch(e) {
    console.log("Critical Error: " + e.toString());
}
