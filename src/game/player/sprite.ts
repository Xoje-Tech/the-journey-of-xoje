/**
 * src/game/player/sprite.ts
 *
 * Clean Architecture — Canvas 2D drawing primitives for the player spritesheet.
 * Handles crop mapping, custom eye-line programmatic blinking, and dash leaning.
 */
import type { AnimState } from './types';

/** Sizing parameters matching the generated spritesheet. */
export const SPRITE_W = 32;
export const SPRITE_H = 48;

/**
 * Draw a single frame from the spritesheet, centered on `x`/`y`.
 *
 * Special visual enhancements:
 *   1. **Dash Lean**: If the player is moving fast (`state.dashLeanActive === true`),
 *      the canvas context is skewed horizontally by ~8 degrees in the direction of velocity.
 *   2. **Programmatic Blink**: If `blinkActive` is true, an off-black line is drawn over
 *      the character's eye position (pixels y=16 to y=18 on the 32x48 sprite grid).
 *
 * @param ctx          Canvas 2D context.
 * @param img          Loaded spritesheet HTMLImageElement.
 * @param state        Current AnimState (with frameIndex and dashLeanActive).
 * @param x            Logical player center X in CSS pixels.
 * @param y            Logical player center Y in CSS pixels.
 * @param blinkActive  True if a parpadeo is currently active.
 * @param vx           Current horizontal velocity (used to determine lean direction).
 */
export function drawPlayerFrame(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  state: AnimState,
  x: number,
  y: number,
  blinkActive: boolean,
  vx: number,
): void {
  const col = state.frameIndex;
  const sX = col * SPRITE_W;
  const sY = 0; // 9x1 horizontal strip

  const w = SPRITE_W;
  const h = SPRITE_H;
  const left = x - w / 2;
  const top = y - h / 2;

  ctx.save();

  // 1. Apply Dash Lean Transformation (horizontal skew)
  // We skew the context horizontally based on velocity sign to simulate running momentum.
  if (state.dashLeanActive && vx !== 0) {
    const skewFactor = vx > 0 ? 0.14 : -0.14; // ~8 degrees in radians
    ctx.translate(x, y); // translate origin to character center
    ctx.transform(1, 0, skewFactor, 1, 0, 0); // apply horizontal shear matrix
    ctx.translate(-x, -y); // translate back
  }

  // 2. Draw the mapped spritesheet column
  // drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)
  ctx.drawImage(img, sX, sY, w, h, left, top, w, h);

  // 3. Programmatic Blink Overlay (draw dark horizontal lines over the eye line)
  // Eye line on a 32x48 chibi frame typically sits around y=16 (logical offset from top).
  // Draws two small closed-eye dashes over the face column.
  if (blinkActive) {
    ctx.strokeStyle = '#111115';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    
    // Left eye dash
    ctx.moveTo(left + 11, top + 17);
    ctx.lineTo(left + 14, top + 17);
    
    // Right eye dash
    ctx.moveTo(left + 18, top + 17);
    ctx.lineTo(left + 21, top + 17);
    
    ctx.stroke();
  }

  ctx.restore();
}
