#!/usr/bin/env python3
import os
import sys
from PIL import Image, ImageDraw

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUTPUT_DIR = os.path.join(PROJECT_ROOT, "src", "assets", "skills")

# Gritty, desaturated LISA-style palette
COLOR_TRANSPARENT = (0, 0, 0, 0)
COLOR_OUTLINE = (0, 0, 0, 255)
COLOR_TEXT = (240, 240, 245, 255) # Off-white / Silver

# Category specific colors: Bevel Highlights, Main Fills, and Bevel Shadows
PALETTES = {
    "technical": {
        "highlight": (100, 150, 210, 255), # Light Steel Blue
        "fill": (58, 95, 133, 255),       # Steel Blue (similar to jacket)
        "shadow": (35, 58, 85, 255)       # Navy Shadow
    },
    "qualitative": {
        "highlight": (224, 153, 99, 255), # Soft Orange / Copper
        "fill": (181, 106, 54, 255),      # Gritty Ochre
        "shadow": (110, 55, 20, 255)      # Dark Burnt Umber
    },
    "soft": {
        "highlight": (109, 181, 142, 255), # Sage Green
        "fill": (74, 130, 99, 255),       # Desaturated Forest
        "shadow": (40, 75, 55, 255)       # Deep Olive Shadow
    }
}

# 3x5 Bitmap Font definition (3px wide, 5px high)
FONT_3x5 = {
    "A": [
        "###",
        "#.#",
        "###",
        "#.#",
        "#.#"
    ],
    "B": [
        "##.",
        "#.#",
        "##.",
        "#.#",
        "##."
    ],
    "C": [
        "###",
        "#..",
        "#..",
        "#..",
        "###"
    ],
    "D": [
        "##.",
        "#.#",
        "#.#",
        "#.#",
        "##."
    ],
    "E": [
        "###",
        "#..",
        "###",
        "#..",
        "###"
    ],
    "F": [
        "###",
        "#..",
        "###",
        "#..",
        "#.."
    ],
    "G": [
        "###",
        "#..",
        "#.#",
        "#.#",
        "###"
    ],
    "H": [
        "#.#",
        "#.#",
        "###",
        "#.#",
        "#.#"
    ],
    "I": [
        "###",
        ".#.",
        ".#.",
        ".#.",
        "###"
    ],
    "J": [
        "..#",
        "..#",
        "..#",
        "#.#",
        ".#."
    ],
    "K": [
        "#.#",
        "#.#",
        "##.",
        "#.#",
        "#.#"
    ],
    "L": [
        "#..",
        "#..",
        "#..",
        "#..",
        "###"
    ],
    "M": [
        "#.#",
        "###",
        "###",
        "#.#",
        "#.#"
    ],
    "N": [
        "#.#",
        "###",
        "###",
        "#.#",
        "#.#"
    ],
    "O": [
        "###",
        "#.#",
        "#.#",
        "#.#",
        "###"
    ],
    "P": [
        "###",
        "#.#",
        "###",
        "#..",
        "#.."
    ],
    "Q": [
        "###",
        "#.#",
        "#.#",
        "###",
        "..#"
    ],
    "R": [
        "##.",
        "#.#",
        "##.",
        "#.#",
        "#.#"
    ],
    "S": [
        "###",
        "#..",
        "###",
        "..#",
        "###"
    ],
    "T": [
        "###",
        ".#.",
        ".#.",
        ".#.",
        ".#."
    ],
    "U": [
        "#.#",
        "#.#",
        "#.#",
        "#.#",
        "###"
    ],
    "V": [
        "#.#",
        "#.#",
        "#.#",
        "#.#",
        ".#."
    ],
    "W": [
        "#.#",
        "#.#",
        "#.#",
        "###",
        "#.#"
    ],
    "X": [
        "#.#",
        "#.#",
        ".#.",
        "#.#",
        "#.#"
    ],
    "Y": [
        "#.#",
        "#.#",
        ".#.",
        ".#.",
        ".#."
    ],
    "Z": [
        "###",
        "..#",
        ".#.",
        "#..",
        "###"
    ],
    "0": [
        "###",
        "#.#",
        "#.#",
        "#.#",
        "###"
    ],
    "1": [
        ".#.",
        "##.",
        ".#.",
        ".#.",
        "###"
    ],
    "2": [
        "###",
        "..#",
        "###",
        "#..",
        "###"
    ],
    "3": [
        "###",
        "..#",
        "###",
        "..#",
        "###"
    ],
    "4": [
        "#.#",
        "#.#",
        "###",
        "..#",
        "..#"
    ],
    "5": [
        "###",
        "#..",
        "###",
        "..#",
        "###"
    ],
    "6": [
        "###",
        "#..",
        "###",
        "#.#",
        "###"
    ],
    "7": [
        "###",
        "..#",
        ".#.",
        ".#.",
        ".#."
    ],
    "8": [
        "###",
        "#.#",
        "###",
        "#.#",
        "###"
    ],
    "9": [
        "###",
        "#.#",
        "###",
        "..#",
        "###"
    ]
}

# Skill ID to custom initials overrides
SKILL_INITIALS = {
    "kuka-robotics": "KR",
    "cultural-adaptability": "CA",
    "international-ops": "IO",
    "typescript": "TS",
    "sass": "SA",
    "bootstrap": "BS",
    "collaborative-creativity": "CC",
    "design-system": "DS",
    "pixel-perfect": "PP",
    "angular": "NG", # Traditional angular abbreviation
    "jira": "JR",
    "peer-mentoring": "PM",
    "swagger": "SW",
    "ddd": "DDD",
    "astro": "AS",
    "vue": "VU",
    "continuous-learning": "CL",
    "nodejs": "ND",
    "tdd": "TDD"
}

SKILLS_METADATA = [
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
]

def apply_pixel_outline(img):
    """
    Adds a heavy 1-pixel solid black outline around opaque pixel boundaries.
    """
    outline_img = img.copy()
    draw = ImageDraw.Draw(outline_img)
    w, h = img.size
    pix = img.load()
    
    for y in range(1, h-1):
        for x in range(1, w-1):
            if pix[x, y][3] > 0:
                continue # Inside shield
            
            # 4-way check
            if (pix[x, y-1][3] > 0 or
                pix[x, y+1][3] > 0 or
                pix[x-1, y][3] > 0 or
                pix[x+1, y][3] > 0):
                draw.point((x, y), fill=COLOR_OUTLINE)
                
    return outline_img

def draw_letter(draw, letter, start_x, start_y, color):
    """
    Draws a single letter using the 3x5 bitmap font.
    """
    if letter not in FONT_3x5:
        letter = "?"
        
    bitmap = FONT_3x5.get(letter, FONT_3x5["0"])
    for row_idx, row in enumerate(bitmap):
        for col_idx, char in enumerate(row):
            if char == "#":
                draw.point((start_x + col_idx, start_y + row_idx), fill=color)

def generate_shield_sprite(skill_id, category, initials):
    """
    Draws a 24x24 pixel-art shield for the given skill.
    """
    img = Image.new("RGBA", (24, 24), COLOR_TRANSPARENT)
    draw = ImageDraw.Draw(img)
    
    palette = PALETTES.get(category, PALETTES["technical"])
    color_hi = palette["highlight"]
    color_fill = palette["fill"]
    color_shadow = palette["shadow"]
    
    # 1. Fill the main shield shape
    # We define the inner coordinates of the shield (x limits for each y)
    shield_rows = {
        3:  (5, 18),
        4:  (4, 19),
        5:  (4, 19),
        6:  (4, 19),
        7:  (4, 19),
        8:  (4, 19),
        9:  (4, 19),
        10: (4, 19),
        11: (4, 19),
        12: (4, 19),
        13: (4, 19),
        14: (5, 18),
        15: (6, 17),
        16: (7, 16),
        17: (8, 15),
        18: (9, 14),
        19: (10, 13),
        20: (11, 12)
    }
    
    # Draw the main body of the shield
    for y, (x_start, x_end) in shield_rows.items():
        draw.line([(x_start, y), (x_end, y)], fill=color_fill)
        
    # 2. Draw bevel/lighting edges for retro 3D depth
    # Highlight on top and left edge
    draw.line([(5, 3), (18, 3)], fill=color_hi) # top line
    for y in range(4, 14):
        draw.point((4, y), fill=color_hi) # left vertical
    # Curving highlights on bottom left
    draw.point((5, 14), fill=color_hi)
    draw.point((6, 15), fill=color_hi)
    draw.point((7, 16), fill=color_hi)
    draw.point((8, 17), fill=color_hi)
    draw.point((9, 18), fill=color_hi)
    draw.point((10, 19), fill=color_hi)
    draw.point((11, 20), fill=color_hi)
    
    # Shadows on right edge and bottom right
    for y in range(4, 14):
        draw.point((19, y), fill=color_shadow) # right vertical
    # Curving shadows on bottom right
    draw.point((18, 14), fill=color_shadow)
    draw.point((17, 15), fill=color_shadow)
    draw.point((16, 16), fill=color_shadow)
    draw.point((15, 17), fill=color_shadow)
    draw.point((14, 18), fill=color_shadow)
    draw.point((13, 19), fill=color_shadow)
    draw.point((12, 20), fill=color_shadow)

    # 3. Draw Initials (centered horizontally and vertically)
    # Target height is y=8 to y=12 (5px)
    text_y = 8
    
    num_chars = len(initials)
    if num_chars == 1:
        # Centered at x=10, 11, 12
        draw_letter(draw, initials[0], 10, text_y, COLOR_TEXT)
    elif num_chars == 2:
        # Left letter at x=8,9,10. Right at x=13,14,15. Gap at x=11,12.
        # Spans 8 pixels: x=8 to x=15. Center is x=11.5.
        draw_letter(draw, initials[0], 8, text_y, COLOR_TEXT)
        draw_letter(draw, initials[1], 12, text_y, COLOR_TEXT)
    elif num_chars == 3:
        # Spans 11 pixels: x=6 to x=16. Center at x=11.
        draw_letter(draw, initials[0], 6, text_y, COLOR_TEXT)
        draw_letter(draw, initials[1], 10, text_y, COLOR_TEXT)
        draw_letter(draw, initials[2], 14, text_y, COLOR_TEXT)
    else:
        # Fallback to first 3 chars
        initials = initials[:3]
        draw_letter(draw, initials[0], 6, text_y, COLOR_TEXT)
        draw_letter(draw, initials[1], 10, text_y, COLOR_TEXT)
        draw_letter(draw, initials[2], 14, text_y, COLOR_TEXT)
        
    # 4. Apply heavy 1px solid black outline
    bordered = apply_pixel_outline(img)
    return bordered

def main():
    print(f"[INFO] Initializing skill sprite generator in: {OUTPUT_DIR}", file=sys.stderr)
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    for skill in SKILLS_METADATA:
        skill_id = skill["id"]
        category = skill["category"]
        initials = SKILL_INITIALS.get(skill_id, skill_id[:2].upper())
        
        print(f"[PROGRESS] Generating sprite for: {skill_id} ({initials}) [{category}]...", file=sys.stderr)
        img = generate_shield_sprite(skill_id, category, initials)
        
        output_path = os.path.join(OUTPUT_DIR, f"{skill_id}.png")
        img.save(output_path, "PNG")
        
    print("[SUCCESS] All skill sprites generated successfully!", file=sys.stderr)

if __name__ == "__main__":
    main()
