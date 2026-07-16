#!/usr/bin/env python3
import os
import sys
from PIL import Image, ImageDraw

# Absolute paths based on project root
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUTPUT_PATH = os.path.join(PROJECT_ROOT, "src", "assets", "player.png")

# Palette constants for a gritty, melancholic "LISA: The Painful" aesthetic
COLOR_TRANSPARENT = (0, 0, 0, 0)
COLOR_HAIR = (74, 58, 48, 255)         # Apagado/Dirty Brown #4a3a30
COLOR_HAIR_SHADOW = (51, 40, 33, 255)
COLOR_SKIN = (219, 195, 178, 255)      # Pale, ash-toned skin (demacrado/ tired)
COLOR_SKIN_SHADOW = (184, 158, 154, 255)
COLOR_JACKET = (45, 68, 107, 255)      # Dirty Navy Blue #2d446b (desaturado)
COLOR_JACKET_SHADOW = (28, 44, 71, 255)
COLOR_PANTS = (48, 48, 56, 255)        # Ash Charcoal #303038
COLOR_SHOES = (210, 210, 215, 255)     # Dirty off-white
COLOR_EYES = (10, 10, 15, 255)         # Hollow pitch black eyes
COLOR_BROW = (150, 130, 125, 255)       # Heavy shadow brow line
COLOR_OUTLINE = (0, 0, 0, 255)         # Heavy, solid black outline #000000

def draw_chibi_frame(pose_id):
    """
    Draw a single 32x48 pixel-art character frame in "LISA: The Painful" style.
    Features: slouched posture, brawny blocky shoulders, stumpy thick limbs,
    and a tired, hollow facial expression.
    """
    img = Image.new("RGBA", (32, 48), COLOR_TRANSPARENT)
    draw = ImageDraw.Draw(img)
    
    # Grid offset center: X=16 is midpoint
    cx = 16
    
    # LISA Proportions (Stout & Chunky):
    #   Y: 7 to 20 -> Head & heavy hair
    #   Y: 20 to 35 -> Blocky, wide torso
    #   Y: 35 to 45 -> Stumpy, thick legs

    if pose_id == "idle_down":
        # --- LEGS (Thick 3px stumps, standing close) ---
        draw.rectangle([cx-5, 35, cx-2, 43], fill=COLOR_PANTS)
        draw.rectangle([cx+1, 35, cx+4, 43], fill=COLOR_PANTS)
        # Shoes (heavy, flat)
        draw.rectangle([cx-6, 43, cx-2, 45], fill=COLOR_SHOES)
        draw.rectangle([cx+1, 43, cx+5, 45], fill=COLOR_SHOES)
        
        # --- TORSO (Chunky boxy body, Y: 20 to 35) ---
        # Jacket (Wide: 16px span, hombros caídos/slouched)
        draw.rectangle([cx-8, 20, cx+7, 35], fill=COLOR_JACKET)
        draw.rectangle([cx-1, 20, cx, 24], fill=COLOR_SKIN) # neck/collar area
        # Left Arm (thick stumpy arm at side)
        draw.rectangle([cx-11, 21, cx-9, 31], fill=COLOR_JACKET)
        draw.rectangle([cx-11, 31, cx-9, 32], fill=COLOR_SKIN)
        # Right Arm
        draw.rectangle([cx+8, 21, cx+10, 31], fill=COLOR_JACKET)
        draw.rectangle([cx+8, 31, cx+10, 32], fill=COLOR_SKIN)

        # --- HEAD & FACE (Sunken head, tired look) ---
        # Face box
        draw.rectangle([cx-6, 10, cx+5, 19], fill=COLOR_SKIN)
        # Hollow eyes (flat pixels)
        draw.rectangle([cx-3, 14, cx-2, 15], fill=COLOR_EYES)
        draw.rectangle([cx+2, 14, cx+3, 15], fill=COLOR_EYES)
        # Heavy shadow brow lines above eyes (tired look)
        draw.rectangle([cx-4, 13, cx-1, 13], fill=COLOR_BROW)
        draw.rectangle([cx+1, 13, cx+4, 13], fill=COLOR_BROW)
        # Messy hair (flat and blocky, covering shoulders)
        draw.rectangle([cx-7, 7, cx+6, 10], fill=COLOR_HAIR)
        draw.rectangle([cx-7, 10, cx-6, 17], fill=COLOR_HAIR) # messy strands left
        draw.rectangle([cx+6, 10, cx+7, 17], fill=COLOR_HAIR) # messy strands right
        draw.rectangle([cx-4, 10, cx+3, 11], fill=COLOR_HAIR) # unkempt bangs

    elif pose_id == "walk_down_1":
        # --- LEGS (Walk Down 1: Left stump down-extended, right up) ---
        draw.rectangle([cx-5, 35, cx-2, 44], fill=COLOR_PANTS)
        draw.rectangle([cx-6, 44, cx-1, 46], fill=COLOR_SHOES) # left shoe forward
        draw.rectangle([cx+1, 35, cx+4, 40], fill=COLOR_PANTS)
        draw.rectangle([cx+1, 40, cx+5, 42], fill=COLOR_SHOES)
        
        # --- TORSO & ARMS ---
        draw.rectangle([cx-8, 20, cx+7, 35], fill=COLOR_JACKET)
        draw.rectangle([cx-1, 20, cx, 24], fill=COLOR_SKIN)
        # Left Arm (moving slightly back)
        draw.rectangle([cx-11, 20, cx-9, 28], fill=COLOR_JACKET)
        draw.rectangle([cx-11, 28, cx-9, 29], fill=COLOR_SKIN)
        # Right Arm (swinging forward, heavy)
        draw.rectangle([cx+8, 22, cx+10, 32], fill=COLOR_JACKET)
        draw.rectangle([cx+8, 32, cx+10, 33], fill=COLOR_SKIN)

        # --- HEAD & FACE ---
        draw.rectangle([cx-6, 10, cx+5, 19], fill=COLOR_SKIN)
        draw.rectangle([cx-3, 14, cx-2, 15], fill=COLOR_EYES)
        draw.rectangle([cx+2, 14, cx+3, 15], fill=COLOR_EYES)
        draw.rectangle([cx-4, 13, cx-1, 13], fill=COLOR_BROW)
        draw.rectangle([cx+1, 13, cx+4, 13], fill=COLOR_BROW)
        draw.rectangle([cx-7, 7, cx+6, 10], fill=COLOR_HAIR)
        draw.rectangle([cx-7, 10, cx-6, 17], fill=COLOR_HAIR)
        draw.rectangle([cx+6, 10, cx+7, 17], fill=COLOR_HAIR)
        draw.rectangle([cx-4, 10, cx+3, 11], fill=COLOR_HAIR)

    elif pose_id == "walk_down_2":
        # --- LEGS (Walk Down 2: Right stump down-extended, left up) ---
        draw.rectangle([cx-5, 35, cx-2, 40], fill=COLOR_PANTS)
        draw.rectangle([cx-6, 40, cx-2, 42], fill=COLOR_SHOES)
        draw.rectangle([cx+1, 35, cx+4, 44], fill=COLOR_PANTS)
        draw.rectangle([cx, 44, cx+5, 46], fill=COLOR_SHOES) # right shoe forward
        
        # --- TORSO & ARMS ---
        draw.rectangle([cx-8, 20, cx+7, 35], fill=COLOR_JACKET)
        draw.rectangle([cx-1, 20, cx, 24], fill=COLOR_SKIN)
        # Left Arm (swinging forward)
        draw.rectangle([cx-11, 22, cx-9, 32], fill=COLOR_JACKET)
        draw.rectangle([cx-11, 32, cx-9, 33], fill=COLOR_SKIN)
        # Right Arm (swinging back)
        draw.rectangle([cx+8, 20, cx+10, 28], fill=COLOR_JACKET)
        draw.rectangle([cx+8, 28, cx+10, 29], fill=COLOR_SKIN)

        # --- HEAD & FACE ---
        draw.rectangle([cx-6, 10, cx+5, 19], fill=COLOR_SKIN)
        draw.rectangle([cx-3, 14, cx-2, 15], fill=COLOR_EYES)
        draw.rectangle([cx+2, 14, cx+3, 15], fill=COLOR_EYES)
        draw.rectangle([cx-4, 13, cx-1, 13], fill=COLOR_BROW)
        draw.rectangle([cx+1, 13, cx+4, 13], fill=COLOR_BROW)
        draw.rectangle([cx-7, 7, cx+6, 10], fill=COLOR_HAIR)
        draw.rectangle([cx-7, 10, cx-6, 17], fill=COLOR_HAIR)
        draw.rectangle([cx+6, 10, cx+7, 17], fill=COLOR_HAIR)
        draw.rectangle([cx-4, 10, cx+3, 11], fill=COLOR_HAIR)

    elif pose_id == "walk_up_1":
        # --- BACK VIEW (Walk Up 1: Left leg forward) ---
        draw.rectangle([cx-5, 35, cx-2, 44], fill=COLOR_PANTS)
        draw.rectangle([cx+1, 35, cx+4, 40], fill=COLOR_PANTS)
        
        # Torso (No neck/skin showing, pure jacket back)
        draw.rectangle([cx-8, 20, cx+7, 35], fill=COLOR_JACKET)
        draw.rectangle([cx-11, 20, cx-9, 29], fill=COLOR_JACKET)
        draw.rectangle([cx+8, 22, cx+10, 31], fill=COLOR_JACKET)

        # Head back (Fully covered in dirty messy hair, zero face/skin/collar)
        draw.rectangle([cx-7, 7, cx+6, 19], fill=COLOR_HAIR)
        draw.rectangle([cx-7, 17, cx+6, 19], fill=COLOR_HAIR_SHADOW) # shadow base

    elif pose_id == "walk_up_2":
        # --- BACK VIEW (Walk Up 2: Right leg forward) ---
        draw.rectangle([cx-5, 35, cx-2, 40], fill=COLOR_PANTS)
        draw.rectangle([cx+1, 35, cx+4, 44], fill=COLOR_PANTS)
        
        # Torso
        draw.rectangle([cx-8, 20, cx+7, 35], fill=COLOR_JACKET)
        draw.rectangle([cx-11, 22, cx-9, 31], fill=COLOR_JACKET)
        draw.rectangle([cx+8, 20, cx+10, 29], fill=COLOR_JACKET)

        # Head back
        draw.rectangle([cx-7, 7, cx+6, 19], fill=COLOR_HAIR)
        draw.rectangle([cx-7, 17, cx+6, 19], fill=COLOR_HAIR_SHADOW)

    elif pose_id == "walk_left_1":
        # --- SIDE PROFILE LEFT (Slouched / Encorvado: shift Head/Arms X - 2px) ---
        # Slouched center shift (X offsets are shifted left)
        scx = cx - 2
        
        # Legs (Thick side profile walk 1)
        draw.rectangle([scx-3, 35, scx+2, 43], fill=COLOR_PANTS)
        draw.rectangle([scx-5, 43, scx+1, 45], fill=COLOR_SHOES) # front shoe
        draw.rectangle([scx+2, 35, scx+6, 40], fill=COLOR_PANTS)
        draw.rectangle([scx+2, 40, scx+6, 42], fill=COLOR_SHOES)
        
        # Torso side profile (Encorvado/Hunchback: wider back on the right, Y: 20 to 35)
        draw.rectangle([scx-4, 20, scx+6, 35], fill=COLOR_JACKET)
        draw.rectangle([scx+4, 20, scx+7, 26], fill=COLOR_JACKET_SHADOW) # humpback curve
        # Side Arm swinging (Y: 20 to 32)
        draw.rectangle([scx-1, 21, scx+3, 31], fill=COLOR_JACKET)
        draw.rectangle([scx-1, 31, scx+3, 32], fill=COLOR_SKIN)

        # Head side profile (Sunken, shifted left looking left)
        draw.rectangle([scx-4, 10, scx+5, 19], fill=COLOR_SKIN)
        # Single hollow tired eye looking left
        draw.rectangle([scx-3, 14, scx-2, 15], fill=COLOR_EYES)
        draw.rectangle([scx-4, 13, scx-1, 13], fill=COLOR_BROW) # shadow
        # Hair left profile (rugged/unkempt)
        draw.rectangle([scx-5, 7, scx+6, 11], fill=COLOR_HAIR)
        draw.rectangle([scx-5, 11, scx-3, 19], fill=COLOR_HAIR) # sideburn
        draw.rectangle([scx+1, 11, scx+6, 18], fill=COLOR_HAIR) # back cover

    elif pose_id == "walk_left_2":
        # --- SIDE PROFILE LEFT (Slouched walk 2) ---
        scx = cx - 2
        # Legs
        draw.rectangle([scx-3, 35, scx+2, 40], fill=COLOR_PANTS)
        draw.rectangle([scx-4, 40, scx+1, 42], fill=COLOR_SHOES)
        draw.rectangle([scx+2, 35, scx+6, 43], fill=COLOR_PANTS)
        draw.rectangle([scx+1, 43, scx+7, 45], fill=COLOR_SHOES) # front shoe
        
        # Torso side
        draw.rectangle([scx-4, 20, scx+6, 35], fill=COLOR_JACKET)
        draw.rectangle([scx+4, 20, scx+7, 26], fill=COLOR_JACKET_SHADOW)
        # Arm swinging forward
        draw.rectangle([scx-2, 23, scx+2, 32], fill=COLOR_JACKET)
        draw.rectangle([scx-2, 32, scx+2, 33], fill=COLOR_SKIN)

        # Head left
        draw.rectangle([scx-4, 10, scx+5, 19], fill=COLOR_SKIN)
        draw.rectangle([scx-3, 14, scx-2, 15], fill=COLOR_EYES)
        draw.rectangle([scx-4, 13, scx-1, 13], fill=COLOR_BROW)
        draw.rectangle([scx-5, 7, scx+6, 11], fill=COLOR_HAIR)
        draw.rectangle([scx-5, 11, scx-3, 19], fill=COLOR_HAIR)
        draw.rectangle([scx+1, 11, scx+6, 18], fill=COLOR_HAIR)

    elif pose_id == "walk_right_1":
        # --- SIDE PROFILE RIGHT (Slouched / Encorvado: shift Head/Arms X + 2px) ---
        # Slouched center shift (X offsets are shifted right)
        scx = cx + 2
        
        # Legs
        draw.rectangle([scx-6, 35, scx-2, 40], fill=COLOR_PANTS)
        draw.rectangle([scx-6, 40, scx-2, 42], fill=COLOR_SHOES)
        draw.rectangle([scx-2, 35, scx+3, 43], fill=COLOR_PANTS)
        draw.rectangle([scx-1, 43, scx+5, 45], fill=COLOR_SHOES) # front shoe
        
        # Torso side profile (Encorvado/Hunchback: wider back on the left, Y: 20 to 35)
        draw.rectangle([scx-6, 20, scx+4, 35], fill=COLOR_JACKET)
        draw.rectangle([scx-7, 20, scx-4, 26], fill=COLOR_JACKET_SHADOW) # humpback curve
        # Side Arm
        draw.rectangle([scx-3, 21, scx+1, 31], fill=COLOR_JACKET)
        draw.rectangle([scx-3, 31, scx+1, 32], fill=COLOR_SKIN)

        # Head side profile (Sunken, shifted right looking right)
        draw.rectangle([scx-5, 10, scx+4, 19], fill=COLOR_SKIN)
        # Single eye
        draw.rectangle([scx+2, 14, scx+3, 15], fill=COLOR_EYES)
        draw.rectangle([scx, 13, scx+3, 13], fill=COLOR_BROW)
        # Hair right profile
        draw.rectangle([scx-6, 7, scx+5, 11], fill=COLOR_HAIR)
        draw.rectangle([scx+3, 11, scx+5, 19], fill=COLOR_HAIR) # sideburn
        draw.rectangle([scx-6, 11, scx-1, 18], fill=COLOR_HAIR) # back cover

    elif pose_id == "walk_right_2":
        # --- SIDE PROFILE RIGHT (Slouched walk 2) ---
        scx = cx + 2
        # Legs
        draw.rectangle([scx-6, 35, scx-2, 43], fill=COLOR_PANTS)
        draw.rectangle([scx-7, 43, scx-1, 45], fill=COLOR_SHOES) # front shoe
        draw.rectangle([scx-2, 35, scx+3, 40], fill=COLOR_PANTS)
        draw.rectangle([scx-2, 40, scx+3, 42], fill=COLOR_SHOES)
        
        # Torso side right
        draw.rectangle([scx-6, 20, scx+4, 35], fill=COLOR_JACKET)
        draw.rectangle([scx-7, 20, scx-4, 26], fill=COLOR_JACKET_SHADOW)
        # Side Arm swinging forward
        draw.rectangle([scx-2, 23, scx+2, 32], fill=COLOR_JACKET)
        draw.rectangle([scx-2, 32, scx+2, 33], fill=COLOR_SKIN)

        # Head side right
        draw.rectangle([scx-5, 10, scx+4, 19], fill=COLOR_SKIN)
        draw.rectangle([scx+2, 14, scx+3, 15], fill=COLOR_EYES)
        draw.rectangle([scx, 13, scx+3, 13], fill=COLOR_BROW)
        draw.rectangle([scx-6, 7, scx+5, 11], fill=COLOR_HAIR)
        draw.rectangle([scx+3, 11, scx+5, 19], fill=COLOR_HAIR)
        draw.rectangle([scx-6, 11, scx-1, 18], fill=COLOR_HAIR)

    # --- HEAVY SOLID OUTLINE COHERENCE ---
    bordered = apply_pixel_outline(img)
    return bordered

def apply_pixel_outline(img):
    """
    Scans the image and adds a heavy 1-pixel solid black outline
    around all non-transparent pixel boundaries, matching the LISA: The Painful aesthetic.
    """
    outline_img = img.copy()
    draw = ImageDraw.Draw(outline_img)
    w, h = img.size
    pix = img.load()
    
    # Iterate over pixels
    for y in range(1, h-1):
        for x in range(1, w-1):
            curr_alpha = pix[x, y][3]
            if curr_alpha > 0:
                continue # inside character
            
            # Check 4-way neighbors
            has_opaque_neighbor = (
                pix[x, y-1][3] > 0 or
                pix[x, y+1][3] > 0 or
                pix[x-1, y][3] > 0 or
                pix[x+1, y][3] > 0
            )
            
            if has_opaque_neighbor:
                draw.point((x, y), fill=COLOR_OUTLINE)
                
    return outline_img

def main():
    print("[INFO] Starting PRODUC PROCEDURAL LISA-STYLE pixel-art spritesheet generation...", file=sys.stderr)
    
    POSES = [
        "idle_down",
        "walk_down_1", "walk_down_2",
        "walk_up_1", "walk_up_2",
        "walk_left_1", "walk_left_2",
        "walk_right_1", "walk_right_2"
    ]
    
    generated_frames = []
    
    for i, pose_id in enumerate(POSES):
        print(f"[PROGRESS] Drawing frame {i+1}/9 ({pose_id})...", file=sys.stderr)
        frame = draw_chibi_frame(pose_id)
        generated_frames.append(frame)
        
    print("[INFO] Stitching 9 processed frames into spritesheet (288x48 px)...", file=sys.stderr)
    spritesheet = Image.new("RGBA", (288, 48), COLOR_TRANSPARENT)
    
    for i, frame in enumerate(generated_frames):
        x_offset = i * 32
        spritesheet.paste(frame, (x_offset, 0))
        
    spritesheet.save(OUTPUT_PATH, "PNG")
    print(f"[SUCCESS] LISA-Style Spritesheet generated and saved to: {OUTPUT_PATH}", file=sys.stderr)

if __name__ == "__main__":
    main()
