#!/usr/bin/env python3
import os
import sys
from PIL import Image, ImageDraw

# Absolute paths based on project root
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUTPUT_PATH = os.path.join(PROJECT_ROOT, "public", "sprites", "player.png")

# Palette constants for a beautiful cohesive pixel-art aesthetic
COLOR_TRANSPARENT = (0, 0, 0, 0)
COLOR_HAIR = (92, 64, 51, 255)         # Dark Brown #5c4033
COLOR_HAIR_SHADOW = (64, 45, 36, 255)  # Shadow Brown
COLOR_SKIN = (255, 209, 179, 255)      # Soft Peach skin tone
COLOR_SKIN_SHADOW = (230, 175, 148, 255)
COLOR_JACKET = (30, 58, 95, 255)       # Navy Blue #1e3a5f
COLOR_JACKET_SHADOW = (18, 38, 64, 255)
COLOR_PANTS = (42, 42, 53, 255)        # Dark Charcoal #2a2a35
COLOR_SHOES = (240, 240, 245, 255)     # Off-white zapatillas
COLOR_EYES = (17, 17, 24, 255)         # Dark Navy eyes
COLOR_OUTLINE = (14, 14, 18, 255)      # Fine dark outline

def draw_chibi_frame(pose_id):
    """
    Draw a single 32x48 pixel-art chibi character frame.
    Generates pixel-perfect geometry with fine outlines.
    """
    # Create empty transparent canvas
    img = Image.new("RGBA", (32, 48), COLOR_TRANSPARENT)
    draw = ImageDraw.Draw(img)
    
    # Grid offset centers: X=16, Y=24 is the midpoint
    cx = 16
    
    # Vertical coordinates for Chibi proportions:
    #   Y: 6 to 22 -> Head & Hair (16px)
    #   Y: 22 to 36 -> Torso / Jacket (14px)
    #   Y: 36 to 46 -> Legs & Shoes (10px)

    if pose_id == "idle_down":
        # --- LEGS & FEET (Resting) ---
        # Pants (Y: 36 to 43)
        draw.rectangle([cx-6, 36, cx-2, 43], fill=COLOR_PANTS)
        draw.rectangle([cx+1, 36, cx+5, 43], fill=COLOR_PANTS)
        # Shoes
        draw.rectangle([cx-7, 43, cx-2, 45], fill=COLOR_SHOES)
        draw.rectangle([cx+1, 43, cx+6, 45], fill=COLOR_SHOES)
        
        # --- TORSO & ARMS (Idle Down) ---
        # Jacket Body
        draw.rectangle([cx-7, 22, cx+6, 36], fill=COLOR_JACKET)
        # Jacket Collar/Detail
        draw.rectangle([cx-1, 22, cx, 27], fill=COLOR_SKIN)
        # Left Arm (hanging at side)
        draw.rectangle([cx-9, 23, cx-7, 33], fill=COLOR_JACKET)
        draw.rectangle([cx-9, 33, cx-7, 34], fill=COLOR_SKIN) # hand
        # Right Arm (hanging at side)
        draw.rectangle([cx+6, 23, cx+8, 33], fill=COLOR_JACKET)
        draw.rectangle([cx+6, 33, cx+8, 34], fill=COLOR_SKIN) # hand

        # --- HEAD & FACE (Facing Down) ---
        # Face base (Y: 10 to 22)
        draw.rectangle([cx-7, 10, cx+6, 21], fill=COLOR_SKIN)
        # Eyes
        draw.rectangle([cx-4, 15, cx-3, 17], fill=COLOR_EYES)
        draw.rectangle([cx+2, 15, cx+3, 17], fill=COLOR_EYES)
        # Hair (facing forward)
        draw.rectangle([cx-8, 6, cx+7, 11], fill=COLOR_HAIR) # hair top
        draw.rectangle([cx-8, 11, cx-7, 18], fill=COLOR_HAIR) # left side hair strand
        draw.rectangle([cx+7, 11, cx+8, 18], fill=COLOR_HAIR) # right side hair strand
        draw.rectangle([cx-4, 11, cx+3, 12], fill=COLOR_HAIR) # bangs front

    elif pose_id == "walk_down_1":
        # --- LEGS & FEET (Walk Down frame 1: Left leg forward, right leg back) ---
        # Left Leg forward (extends slightly lower, Y: 36 to 45)
        draw.rectangle([cx-6, 36, cx-2, 44], fill=COLOR_PANTS)
        draw.rectangle([cx-7, 44, cx-1, 46], fill=COLOR_SHOES)
        # Right Leg back (slightly higher, Y: 36 to 42)
        draw.rectangle([cx+1, 36, cx+5, 41], fill=COLOR_PANTS)
        draw.rectangle([cx+1, 41, cx+6, 43], fill=COLOR_SHOES)
        
        # --- TORSO & ARMS ---
        draw.rectangle([cx-7, 22, cx+6, 36], fill=COLOR_JACKET)
        draw.rectangle([cx-1, 22, cx, 27], fill=COLOR_SKIN)
        # Left Arm (swinging back slightly)
        draw.rectangle([cx-9, 22, cx-7, 30], fill=COLOR_JACKET)
        draw.rectangle([cx-9, 30, cx-7, 31], fill=COLOR_SKIN)
        # Right Arm (swinging forward slightly)
        draw.rectangle([cx+6, 24, cx+8, 34], fill=COLOR_JACKET)
        draw.rectangle([cx+6, 34, cx+8, 35], fill=COLOR_SKIN)

        # --- HEAD & FACE ---
        draw.rectangle([cx-7, 10, cx+6, 21], fill=COLOR_SKIN)
        draw.rectangle([cx-4, 15, cx-3, 17], fill=COLOR_EYES)
        draw.rectangle([cx+2, 15, cx+3, 17], fill=COLOR_EYES)
        draw.rectangle([cx-8, 6, cx+7, 11], fill=COLOR_HAIR)
        draw.rectangle([cx-8, 11, cx-7, 18], fill=COLOR_HAIR)
        draw.rectangle([cx+7, 11, cx+8, 18], fill=COLOR_HAIR)
        draw.rectangle([cx-4, 11, cx+3, 12], fill=COLOR_HAIR)

    elif pose_id == "walk_down_2":
        # --- LEGS & FEET (Walk Down frame 2: Right leg forward, left leg back) ---
        # Left Leg back (Y: 36 to 42)
        draw.rectangle([cx-6, 36, cx-2, 41], fill=COLOR_PANTS)
        draw.rectangle([cx-7, 41, cx-2, 43], fill=COLOR_SHOES)
        # Right Leg forward (Y: 36 to 45)
        draw.rectangle([cx+1, 36, cx+5, 44], fill=COLOR_PANTS)
        draw.rectangle([cx+0, 44, cx+6, 46], fill=COLOR_SHOES)
        
        # --- TORSO & ARMS ---
        draw.rectangle([cx-7, 22, cx+6, 36], fill=COLOR_JACKET)
        draw.rectangle([cx-1, 22, cx, 27], fill=COLOR_SKIN)
        # Left Arm (swinging forward)
        draw.rectangle([cx-9, 24, cx-7, 34], fill=COLOR_JACKET)
        draw.rectangle([cx-9, 34, cx-7, 35], fill=COLOR_SKIN)
        # Right Arm (swinging back)
        draw.rectangle([cx+6, 22, cx+8, 30], fill=COLOR_JACKET)
        draw.rectangle([cx+6, 30, cx+8, 31], fill=COLOR_SKIN)

        # --- HEAD & FACE ---
        draw.rectangle([cx-7, 10, cx+6, 21], fill=COLOR_SKIN)
        draw.rectangle([cx-4, 15, cx-3, 17], fill=COLOR_EYES)
        draw.rectangle([cx+2, 15, cx+3, 17], fill=COLOR_EYES)
        draw.rectangle([cx-8, 6, cx+7, 11], fill=COLOR_HAIR)
        draw.rectangle([cx-8, 11, cx-7, 18], fill=COLOR_HAIR)
        draw.rectangle([cx+7, 11, cx+8, 18], fill=COLOR_HAIR)
        draw.rectangle([cx-4, 11, cx+3, 12], fill=COLOR_HAIR)

    elif pose_id == "walk_up_1":
        # --- BACK VIEW (Walk Up frame 1: Left leg forward) ---
        # Left leg (longer)
        draw.rectangle([cx-6, 36, cx-2, 44], fill=COLOR_PANTS)
        draw.rectangle([cx-6, 44, cx-2, 46], fill=COLOR_PANTS) # pant back, no shoe visible
        # Right leg (shorter)
        draw.rectangle([cx+1, 36, cx+5, 41], fill=COLOR_PANTS)
        draw.rectangle([cx+1, 41, cx+5, 43], fill=COLOR_PANTS)
        
        # Torso (No collar skin showing)
        draw.rectangle([cx-7, 22, cx+6, 36], fill=COLOR_JACKET)
        # Arms (Dark navy back view)
        draw.rectangle([cx-9, 22, cx-7, 32], fill=COLOR_JACKET)
        draw.rectangle([cx+6, 24, cx+8, 34], fill=COLOR_JACKET)

        # Head back (100% hair covers the face, no skin, no eyes!)
        draw.rectangle([cx-8, 6, cx+7, 21], fill=COLOR_HAIR)
        # Hair shadow/detail at the base
        draw.rectangle([cx-8, 19, cx+7, 21], fill=COLOR_HAIR_SHADOW)

    elif pose_id == "walk_up_2":
        # --- BACK VIEW (Walk Up frame 2: Right leg forward) ---
        # Left leg (shorter)
        draw.rectangle([cx-6, 36, cx-2, 41], fill=COLOR_PANTS)
        draw.rectangle([cx-6, 41, cx-2, 43], fill=COLOR_PANTS)
        # Right leg (longer)
        draw.rectangle([cx+1, 36, cx+5, 44], fill=COLOR_PANTS)
        draw.rectangle([cx+1, 44, cx+5, 46], fill=COLOR_PANTS)
        
        # Torso
        draw.rectangle([cx-7, 22, cx+6, 36], fill=COLOR_JACKET)
        # Arms
        draw.rectangle([cx-9, 24, cx-7, 34], fill=COLOR_JACKET)
        draw.rectangle([cx+6, 22, cx+8, 32], fill=COLOR_JACKET)

        # Head back
        draw.rectangle([cx-8, 6, cx+7, 21], fill=COLOR_HAIR)
        draw.rectangle([cx-8, 19, cx+7, 21], fill=COLOR_HAIR_SHADOW)

    elif pose_id == "walk_left_1":
        # --- SIDE PROFILE VIEW (Facing Left walk frame 1: Left leg forward) ---
        # Legs
        draw.rectangle([cx-4, 36, cx, 44], fill=COLOR_PANTS)      # Front leg
        draw.rectangle([cx-6, 44, cx, 46], fill=COLOR_SHOES)      # Shoe front left
        draw.rectangle([cx, 36, cx+4, 42], fill=COLOR_PANTS)      # Back leg
        draw.rectangle([cx, 42, cx+4, 44], fill=COLOR_SHOES)
        
        # Torso side profile
        draw.rectangle([cx-5, 22, cx+5, 36], fill=COLOR_JACKET)
        # Arm swinging back/forward
        draw.rectangle([cx-2, 23, cx+2, 33], fill=COLOR_JACKET)
        draw.rectangle([cx-2, 33, cx+2, 34], fill=COLOR_SKIN)     # hand

        # Head side profile (mirando a la izquierda)
        draw.rectangle([cx-5, 10, cx+5, 21], fill=COLOR_SKIN)
        # Single eye on left edge
        draw.rectangle([cx-4, 15, cx-3, 17], fill=COLOR_EYES)
        # Hair left profile
        draw.rectangle([cx-6, 6, cx+6, 11], fill=COLOR_HAIR)
        draw.rectangle([cx-6, 11, cx-4, 19], fill=COLOR_HAIR)     # long left strand/sideburn
        draw.rectangle([cx+1, 11, cx+6, 18], fill=COLOR_HAIR)     # back hair cover

    elif pose_id == "walk_left_2":
        # --- SIDE PROFILE VIEW (Facing Left walk frame 2: Right leg forward) ---
        # Legs
        draw.rectangle([cx-4, 36, cx, 42], fill=COLOR_PANTS)
        draw.rectangle([cx-5, 42, cx, 44], fill=COLOR_SHOES)
        draw.rectangle([cx, 36, cx+4, 44], fill=COLOR_PANTS)
        draw.rectangle([cx-1, 44, cx+5, 46], fill=COLOR_SHOES)
        
        # Torso side
        draw.rectangle([cx-5, 22, cx+5, 36], fill=COLOR_JACKET)
        # Arm
        draw.rectangle([cx-3, 25, cx+1, 34], fill=COLOR_JACKET)
        draw.rectangle([cx-3, 34, cx+1, 35], fill=COLOR_SKIN)

        # Head left
        draw.rectangle([cx-5, 10, cx+5, 21], fill=COLOR_SKIN)
        draw.rectangle([cx-4, 15, cx-3, 17], fill=COLOR_EYES)
        draw.rectangle([cx-6, 6, cx+6, 11], fill=COLOR_HAIR)
        draw.rectangle([cx-6, 11, cx-4, 19], fill=COLOR_HAIR)
        draw.rectangle([cx+1, 11, cx+6, 18], fill=COLOR_HAIR)

    elif pose_id == "walk_right_1":
        # --- SIDE PROFILE VIEW (Facing Right walk frame 1: Left leg forward) ---
        # Legs
        draw.rectangle([cx, 36, cx+4, 44], fill=COLOR_PANTS)      # Front leg right
        draw.rectangle([cx, 44, cx+6, 46], fill=COLOR_SHOES)
        draw.rectangle([cx-4, 36, cx, 42], fill=COLOR_PANTS)      # Back leg right
        draw.rectangle([cx-4, 42, cx, 44], fill=COLOR_SHOES)
        
        # Torso side right
        draw.rectangle([cx-5, 22, cx+5, 36], fill=COLOR_JACKET)
        # Arm right
        draw.rectangle([cx-2, 23, cx+2, 33], fill=COLOR_JACKET)
        draw.rectangle([cx-2, 33, cx+2, 34], fill=COLOR_SKIN)

        # Head side profile (mirando a la derecha)
        draw.rectangle([cx-5, 10, cx+5, 21], fill=COLOR_SKIN)
        # Single eye on right edge
        draw.rectangle([cx+2, 15, cx+3, 17], fill=COLOR_EYES)
        # Hair right profile
        draw.rectangle([cx-6, 6, cx+6, 11], fill=COLOR_HAIR)
        draw.rectangle([cx+4, 11, cx+6, 19], fill=COLOR_HAIR)     # right sideburn strand
        draw.rectangle([cx-6, 11, cx-1, 18], fill=COLOR_HAIR)     # back hair cover

    elif pose_id == "walk_right_2":
        # --- SIDE PROFILE VIEW (Facing Right walk frame 2: Right leg forward) ---
        # Legs
        draw.rectangle([cx, 36, cx+4, 42], fill=COLOR_PANTS)
        draw.rectangle([cx, 42, cx+5, 44], fill=COLOR_SHOES)
        draw.rectangle([cx-4, 36, cx, 44], fill=COLOR_PANTS)
        draw.rectangle([cx-5, 44, cx+1, 46], fill=COLOR_SHOES)
        
        # Torso side right
        draw.rectangle([cx-5, 22, cx+5, 36], fill=COLOR_JACKET)
        # Arm
        draw.rectangle([cx-1, 25, cx+3, 34], fill=COLOR_JACKET)
        draw.rectangle([cx-1, 34, cx+3, 35], fill=COLOR_SKIN)

        # Head side right
        draw.rectangle([cx-5, 10, cx+5, 21], fill=COLOR_SKIN)
        draw.rectangle([cx+2, 15, cx+3, 17], fill=COLOR_EYES)
        draw.rectangle([cx-6, 6, cx+6, 11], fill=COLOR_HAIR)
        draw.rectangle([cx+4, 11, cx+6, 19], fill=COLOR_HAIR)
        draw.rectangle([cx-6, 11, cx-1, 18], fill=COLOR_HAIR)

    # --- FINE ART OUTLINE COHERENCE ---
    # Apply a soft dark border overlay around the opaque parts of the frame
    # to give a crisp 'indie-game/sticker' finish that pops out against the dark canvas grid.
    bordered = apply_pixel_outline(img)
    return bordered

def apply_pixel_outline(img):
    """
    Scans the image and adds a fine 1-pixel dark outline around
    all non-transparent pixel boundaries.
    """
    outline_img = img.copy()
    draw = ImageDraw.Draw(outline_img)
    w, h = img.size
    pix = img.load()
    
    # Iterate over pixels (excluding 1px border edges to prevent overflow)
    for y in range(1, h-1):
        for x in range(1, w-1):
            curr_alpha = pix[x, y][3]
            if curr_alpha > 0:
                continue # inside character
            
            # Check 4-way neighbors (up, down, left, right)
            # If any neighbor is opaque, this transparent pixel becomes outline
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
    print("[INFO] Starting PRODUC PROCEDURAL pixel-art spritesheet generation...", file=sys.stderr)
    
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
    print(f"[SUCCESS] Spritesheet generated programmatically and saved to: {OUTPUT_PATH}", file=sys.stderr)

if __name__ == "__main__":
    main()
