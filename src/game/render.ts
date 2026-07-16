/**
 * src/game/render.ts
 *
 * Canvas 2D drawing primitives for the videogame-ui slice.
 *
 * - `drawGrid(ctx, w, h, gridSize)` — light grid lines so the player can
 *   perceive displacement against a stationary background.
 * - `drawPlayer(ctx, p)` — a solid square at the player's current position.
 *
 * No unit tests: rendering is visual and is verified in Phase 4 by opening
 * `dist/{es,en}/index.html` in a browser (and the headless print script in
 * Phase 3 confirms the print path doesn't accidentally include canvas
 * pixels).
 */
import type { Player } from './types';

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  gridSize: number,
): void {
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= w; x += gridSize) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
  }
  for (let y = 0; y <= h; y += gridSize) {
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
  }
  ctx.stroke();
  ctx.restore();
}

export function drawPlayer(ctx: CanvasRenderingContext2D, p: Player): void {
  ctx.save();
  ctx.fillStyle = '#e7e7e7';
  ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  ctx.restore();
}