// LibreSprite batch script for the four 24x24 start-screen icons.
// Run with the fixed headless invocation in package.json.

var col = app.pixelColor;
var TEMPLATE_PATH = "/home/hermes/projects/the-journey-of-xoje/scripts/blank24.png";
var OUTPUT_DIR = "/home/hermes/projects/the-journey-of-xoje/src/assets/icons/";

function hex(value, alpha) {
    if (alpha === undefined) alpha = 255;
    var red = parseInt(value.substr(1, 2), 16);
    var green = parseInt(value.substr(3, 2), 16);
    var blue = parseInt(value.substr(5, 2), 16);
    return col.rgba(red, green, blue, alpha);
}

function drawPoint(image, x, y, rgba) {
    image.putPixel(x, y, rgba);
}

function drawHLine(image, x1, y, x2, rgba) {
    if (x2 < x1) {
        var swapX = x1;
        x1 = x2;
        x2 = swapX;
    }
    for (var x = x1; x <= x2; x++) drawPoint(image, x, y, rgba);
}

function drawVLine(image, x, y1, y2, rgba) {
    if (y2 < y1) {
        var swapY = y1;
        y1 = y2;
        y2 = swapY;
    }
    for (var y = y1; y <= y2; y++) drawPoint(image, x, y, rgba);
}

function drawRect(image, x1, y1, x2, y2, rgba) {
    if (x2 < x1) {
        var swapX = x1;
        x1 = x2;
        x2 = swapX;
    }
    if (y2 < y1) {
        var swapY = y1;
        y1 = y2;
        y2 = swapY;
    }
    for (var y = y1; y <= y2; y++) {
        for (var x = x1; x <= x2; x++) drawPoint(image, x, y, rgba);
    }
}

function drawBorder(image, x1, y1, x2, y2, rgba) {
    drawHLine(image, x1, y1, x2, rgba);
    drawHLine(image, x1, y2, x2, rgba);
    drawVLine(image, x1, y1, y2, rgba);
    drawVLine(image, x2, y1, y2, rgba);
}

function clearPoint(image, x, y) {
    drawPoint(image, x, y, hex("#000000", 0));
}

function applyOutline(image, bx1, by1, bx2, by2) {
    var outline = hex("#09090b");
    if (bx1 < 0) bx1 = 0;
    if (by1 < 0) by1 = 0;
    if (bx2 >= image.width) bx2 = image.width - 1;
    if (by2 >= image.height) by2 = image.height - 1;

    var opaque = {};
    for (var y = by1; y <= by2; y++) {
        for (var x = bx1; x <= bx2; x++) {
            if (col.rgbaA(image.getPixel(x, y)) > 0) opaque[x + "," + y] = true;
        }
    }

    for (var y = by1; y <= by2; y++) {
        for (var x = bx1; x <= bx2; x++) {
            if (opaque[x + "," + y]) continue;
            if (
                opaque[(x - 1) + "," + y] ||
                opaque[(x + 1) + "," + y] ||
                opaque[x + "," + (y - 1)] ||
                opaque[x + "," + (y + 1)]
            ) {
                drawPoint(image, x, y, outline);
            }
        }
    }
}

function openTemplate() {
    var document = app.open(TEMPLATE_PATH);
    if (!document) throw new Error("Unable to open " + TEMPLATE_PATH);
    return document;
}

function saveIcon(document, filename) {
    document.sprite.saveAs(OUTPUT_DIR + filename);
    document.close();
}

function drawPlay(image, fill) {
    drawPoint(image, 7, 5, fill);
    drawHLine(image, 7, 6, 9, fill);
    drawHLine(image, 7, 7, 11, fill);
    drawHLine(image, 7, 8, 12, fill);
    drawHLine(image, 7, 9, 13, fill);
    drawHLine(image, 7, 10, 14, fill);
    drawHLine(image, 7, 11, 15, fill);
    drawHLine(image, 7, 12, 15, fill);
    drawHLine(image, 7, 13, 14, fill);
    drawHLine(image, 7, 14, 13, fill);
    drawHLine(image, 7, 15, 12, fill);
    drawHLine(image, 7, 16, 11, fill);
    drawHLine(image, 7, 17, 9, fill);
    drawPoint(image, 7, 18, fill);
    applyOutline(image, 5, 3, 17, 20);
}

function drawDownload(image, fill, dark) {
    // Document body and folded upper-right corner.
    drawRect(image, 6, 3, 17, 11, fill);
    drawRect(image, 14, 3, 17, 6, dark);
    drawHLine(image, 14, 3, 16, fill);
    drawVLine(image, 14, 3, 5, fill);

    // Down arrow extends below the document.
    drawRect(image, 11, 9, 12, 17, fill);
    drawHLine(image, 8, 15, 10, fill);
    drawHLine(image, 13, 15, 15, fill);
    drawHLine(image, 9, 16, 14, fill);
    drawHLine(image, 10, 17, 13, fill);
    drawPoint(image, 11, 18, fill);
    drawPoint(image, 12, 18, fill);
    applyOutline(image, 4, 2, 19, 20);
}

function drawGear(image, fill, accent) {
    // Eight blocky teeth.
    drawRect(image, 10, 2, 14, 5, fill);
    drawRect(image, 10, 18, 14, 21, fill);
    drawRect(image, 2, 10, 5, 14, fill);
    drawRect(image, 18, 10, 21, 14, fill);
    drawRect(image, 5, 5, 8, 8, fill);
    drawRect(image, 16, 5, 19, 8, fill);
    drawRect(image, 5, 16, 8, 19, fill);
    drawRect(image, 16, 16, 19, 19, fill);

    // Ring body, then remove a transparent central hole.
    drawHLine(image, 8, 6, 16, fill);
    drawHLine(image, 6, 7, 18, fill);
    drawHLine(image, 5, 8, 19, fill);
    drawHLine(image, 4, 9, 20, fill);
    drawHLine(image, 4, 10, 20, fill);
    drawHLine(image, 4, 11, 20, fill);
    drawHLine(image, 4, 12, 20, fill);
    drawHLine(image, 4, 13, 20, fill);
    drawHLine(image, 4, 14, 20, fill);
    drawHLine(image, 5, 15, 19, fill);
    drawHLine(image, 5, 16, 19, fill);
    drawHLine(image, 6, 17, 18, fill);
    drawHLine(image, 8, 18, 16, fill);
    for (var y = 11; y <= 13; y++) {
        for (var x = 11; x <= 13; x++) clearPoint(image, x, y);
    }

    // One golden highlight pixel, as specified.
    drawPoint(image, 12, 2, accent);
    applyOutline(image, 1, 1, 22, 22);
}

function drawGamepad(image, fill, dark, accent) {
    // Stepped rows give the controller body rounded pixel-art shoulders.
    drawHLine(image, 7, 6, 16, fill);
    drawHLine(image, 5, 7, 18, fill);
    drawHLine(image, 4, 8, 19, fill);
    drawHLine(image, 4, 9, 19, fill);
    drawHLine(image, 4, 10, 19, fill);
    drawHLine(image, 4, 11, 19, fill);
    drawHLine(image, 4, 12, 19, fill);
    drawHLine(image, 4, 13, 19, fill);
    drawHLine(image, 5, 14, 18, fill);
    drawHLine(image, 6, 15, 17, fill);
    drawHLine(image, 7, 16, 16, fill);

    // D-pad cross.
    drawRect(image, 8, 8, 10, 13, dark);
    drawRect(image, 7, 9, 11, 11, dark);

    // Two round buttons; one center is the single accent pixel.
    drawPoint(image, 15, 9, dark);
    drawHLine(image, 14, 10, 16, dark);
    drawPoint(image, 15, 11, dark);
    drawPoint(image, 18, 11, dark);
    drawHLine(image, 17, 12, 19, dark);
    drawPoint(image, 18, 13, dark);
    drawPoint(image, 15, 10, accent);
    applyOutline(image, 2, 4, 21, 18);
}

var fill = hex("#f4f4f5");
var dark = hex("#09090b");
var accent = hex("#eab308");

var document = openTemplate();
drawPlay(document.sprite.layer(0).cel(0).image, fill);
saveIcon(document, "icon-play.png");

document = openTemplate();
drawDownload(document.sprite.layer(0).cel(0).image, fill, dark);
saveIcon(document, "icon-download.png");

document = openTemplate();
drawGear(document.sprite.layer(0).cel(0).image, fill, accent);
saveIcon(document, "icon-settings.png");

document = openTemplate();
drawGamepad(document.sprite.layer(0).cel(0).image, fill, dark, accent);
saveIcon(document, "icon-gamepad.png");
