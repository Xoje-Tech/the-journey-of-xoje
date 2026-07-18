try {
    console.log("==================================================");
    console.log("LibreSprite - Generating 19 Skill Shield Sprites...");
    console.log("==================================================");
    
    var col = app.pixelColor;
    
    // 3x5 Bitmap Font definition (3px wide, 5px high)
    var FONT_3x5 = {
        "A": ["###","#.#","###","#.#","#.#"],
        "B": ["##.","#.#","##.","#.#","##."],
        "C": ["###","#..","#..","#..","###"],
        "D": ["##.","#.#","#.#","#.#","##."],
        "E": ["###","#..","###","#..","###"],
        "F": ["###","#..","###","#..","#.."],
        "G": ["###","#..","#.#","#.#","###"],
        "H": ["#.#","#.#","###","#.#","#.#"],
        "I": ["###",".#.","..#",".#.","###"], // adjusted for I
        "J": ["..#","..#","..#","#.#",".#."],
        "K": ["#.#","#.#","##.","#.#","#.#"],
        "L": ["#..","#..","#..","#..","###"],
        "M": ["#.#","###","###","#.#","#.#"],
        "N": ["#.#","###","###","#.#","#.#"],
        "O": ["###","#.#","#.#","#.#","###"],
        "P": ["###","#.#","###","#..","#.."],
        "Q": ["###","#.#","#.#","###","..#"],
        "R": ["##.","#.#","##.","#.#","#.#"],
        "S": ["###","#..","###","..#","###"],
        "T": ["###",".#.","..#",".#.",".#."],
        "U": ["#.#","#.#","#.#","#.#","###"],
        "V": ["#.#","#.#","#.#","#.#",".#."],
        "W": ["#.#","#.#","#.#","###","#.#"],
        "X": ["#.#","#.#",".#.","#.#","#.#"],
        "Y": ["#.#","#.#",".#.","..1","..1"], // adjusted for Y
        "Z": ["###","..#",".#.","#..","###"],
        "0": ["###","#.#","#.#","#.#","###"],
        "1": [".#.","##.",".#.","..#","###"],
        "2": ["###","..#","###","#..","###"],
        "3": ["###","..#","###","..#","###"],
        "4": ["#.#","#.#","###","..#","..#"],
        "5": ["###","#..","###","..#","###"],
        "6": ["###","#..","###","#.#","###"],
        "7": ["###","..#",".#.",".#.",".#."],
        "8": ["###","#.#","###","#.#","###"],
        "9": ["###","#.#","###","..#","###"]
    };
    
    var PALETTES = {
        "technical": {
            "highlight": [100, 150, 210, 255],
            "fill": [58, 95, 133, 255],
            "shadow": [35, 58, 85, 255]
        },
        "qualitative": {
            "highlight": [224, 153, 99, 255],
            "fill": [181, 106, 54, 255],
            "shadow": [110, 55, 20, 255]
        },
        "soft": {
            "highlight": [109, 181, 142, 255],
            "fill": [74, 130, 99, 255],
            "shadow": [40, 75, 55, 255]
        }
    };
    
    var SKILL_INITIALS = {
        "kuka-robotics": "KR",
        "cultural-adaptability": "CA",
        "international-ops": "IO",
        "typescript": "TS",
        "sass": "SA",
        "bootstrap": "BS",
        "collaborative-creativity": "CC",
        "design-system": "DS",
        "pixel-perfect": "PP",
        "angular": "NG",
        "jira": "JR",
        "peer-mentoring": "PM",
        "swagger": "SW",
        "ddd": "DDD",
        "astro": "AS",
        "vue": "VU",
        "continuous-learning": "CL",
        "nodejs": "ND",
        "tdd": "TDD"
    };
    
    var SKILLS_METADATA = [
        {"id": "kuka-robotics", "category": "technical"},
        {"id": "cultural-adaptability", "category": "soft"},
        {"id": "international-ops", "category": "qualitative"},
        {"id": "typescript", "category": "technical"},
        {"id": "sass", "category": "technical"},
        {"id": "bootstrap", "category": "technical"},
        {"id": "collaborative-creativity", "category": "soft"},
        {"id": "design-system", "category": "qualitative"},
        {"id": "pixel-perfect", "category": "qualitative"},
        {"id": "angular", "category": "technical"},
        {"id": "jira", "category": "technical"},
        {"id": "peer-mentoring", "category": "soft"},
        {"id": "swagger", "category": "technical"},
        {"id": "ddd", "category": "technical"},
        {"id": "astro", "category": "technical"},
        {"id": "vue", "category": "technical"},
        {"id": "continuous-learning", "category": "soft"},
        {"id": "nodejs", "category": "technical"},
        {"id": "tdd", "category": "technical"}
    ];
    
    var shieldRows = {
        3:  [5, 18],
        4:  [4, 19],
        5:  [4, 19],
        6:  [4, 19],
        7:  [4, 19],
        8:  [4, 19],
        9:  [4, 19],
        10: [4, 19],
        11: [4, 19],
        12: [4, 19],
        13: [4, 19],
        14: [5, 18],
        15: [6, 17],
        16: [7, 16],
        17: [8, 15],
        18: [9, 14],
        19: [10, 13],
        20: [11, 12]
    };
    
    function drawPoint(img, x, y, rgba) {
        img.putPixel(x, y, col.rgba(rgba[0], rgba[1], rgba[2], rgba[3]));
    }
    
    function drawLine(img, x1, y, x2, rgba) {
        for (var x = x1; x <= x2; x++) {
            drawPoint(img, x, y, rgba);
        }
    }
    
    function drawLetter(img, letter, startX, startY, rgba) {
        var font = FONT_3x5[letter];
        if (!font) font = FONT_3x5["0"];
        for (var r = 0; r < 5; r++) {
            var row = font[r];
            for (var c = 0; c < 3; c++) {
                if (row.charAt(c) === "#") {
                    drawPoint(img, startX + c, startY + r, rgba);
                }
            }
        }
    }
    
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
    
    // Generate each skill sprite
    for (var idx = 0; idx < SKILLS_METADATA.length; idx++) {
        var skill = SKILLS_METADATA[idx];
        var skillId = skill.id;
        var category = skill.category;
        var initials = SKILL_INITIALS[skillId];
        if (!initials) initials = skillId.substring(0, 2).toUpperCase();
        
        console.log("[PROGRESS] Generating skill sprite: " + skillId + " (" + initials + ")...");
        
        // Open a new blank doc for this skill
        var doc = app.open("/home/hermes/projects/the-journey-of-xoje/scripts/blank24.png");
        var sprite = doc.sprite;
        var img = sprite.layer(0).cel(0).image;
        
        var palette = PALETTES[category];
        var color_hi = palette.highlight;
        var color_fill = palette.fill;
        var color_shadow = palette.shadow;
        
        // 1. Fill shield body
        for (var yStr in shieldRows) {
            var y = parseInt(yStr);
            var limits = shieldRows[yStr];
            drawLine(img, limits[0], y, limits[1], color_fill);
        }
        
        // 2. Bevel highlights (top & left)
        drawLine(img, 5, 3, 18, color_hi);
        for (var y = 4; y < 14; y++) {
            drawPoint(img, 4, y, color_hi);
        }
        drawPoint(img, 5, 14, color_hi);
        drawPoint(img, 6, 15, color_hi);
        drawPoint(img, 7, 16, color_hi);
        drawPoint(img, 8, 17, color_hi);
        drawPoint(img, 9, 18, color_hi);
        drawPoint(img, 10, 19, color_hi);
        drawPoint(img, 11, 20, color_hi);
        
        // 3. Bevel shadows (right & bottom)
        for (var y = 4; y < 14; y++) {
            drawPoint(img, 19, y, color_shadow);
        }
        drawPoint(img, 18, 14, color_shadow);
        drawPoint(img, 17, 15, color_shadow);
        drawPoint(img, 16, 16, color_shadow);
        drawPoint(img, 15, 17, color_shadow);
        drawPoint(img, 14, 18, color_shadow);
        drawPoint(img, 13, 19, color_shadow);
        drawPoint(img, 12, 20, color_shadow);
        
        // 4. Draw Initials
        var text_y = 8;
        var num_chars = initials.length;
        var textColor = [240, 240, 245, 255];
        
        if (num_chars === 1) {
            drawLetter(img, initials.charAt(0), 10, text_y, textColor);
        } else if (num_chars === 2) {
            drawLetter(img, initials.charAt(0), 8, text_y, textColor);
            drawLetter(img, initials.charAt(1), 12, text_y, textColor);
        } else if (num_chars === 3) {
            drawLetter(img, initials.charAt(0), 6, text_y, textColor);
            drawLetter(img, initials.charAt(1), 10, text_y, textColor);
            drawLetter(img, initials.charAt(2), 14, text_y, textColor);
        }
        
        // 5. Apply outline
        applyOutline(img);
        
        // 6. Save
        sprite.saveAs("/home/hermes/projects/the-journey-of-xoje/src/assets/skills/" + skillId + ".png");
        doc.close();
    }
    
    console.log("==================================================");
    console.log("[SUCCESS] All 19 Skill Shield Sprites generated successfully in JS!");
    console.log("==================================================");
} catch(e) {
    console.log("Critical Error: " + e.toString());
}
