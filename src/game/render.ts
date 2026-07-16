/**
 * src/game/render.ts
 *
 * Canvas 2D drawing primitives for the videogame-ui slice, plus a pure
 * helper (`updateTrail`) so the deterministic parts of
 * the trail animation can be unit-tested without a DOM.
 *
 * Exports:
 *   - `drawGrid(ctx, w, h, gridSize)` — light grid lines so the player can
 *      perceive displacement against a stationary background.
 *   - `drawTrail(ctx, trail, maxAgeMs)` — small fading dots behind the
 *      player (P3, see design).
 *   - `updateTrail(...)` — pure: age + drop + append for the trail buffer.
 *   - Constants: `TRAIL_MAX_AGE_MS`, `TRAIL_MAX_LEN`.
 *
 * Visual language is deliberately minimal: the player is the only moving
 * thing on screen, so all the polish lives here.
 */
import type { TrailPoint } from './types';

/* ------------------------------------------------------------------ */
/*  Constants — exported so init.ts and tests share the same numbers. */
/* ------------------------------------------------------------------ */

/** Maximum age (ms) a trail point survives before being dropped. */
export const TRAIL_MAX_AGE_MS = 280;

/** Maximum number of trail points retained in the buffer (ring-style). */
export const TRAIL_MAX_LEN = 14;

/* ------------------------------------------------------------------ */
/*  Pure helpers                                                      */
/* ------------------------------------------------------------------ */

/**
 * Advance the trail buffer by one frame: age every existing point by
 * `dtMs`, drop points whose age exceeds `maxAgeMs`, optionally append
 * the current player position, and cap the buffer at `maxLen`.
 *
 * Pure: returns a fresh array, never mutates the input. Caller owns the
 * state and replaces its reference each frame.
 *
 * @param trail    Current trail buffer.
 * @param dtMs     Frame delta in milliseconds (typically ~16 at 60fps).
 * @param maxAgeMs Age cutoff in ms.
 * @param maxLen   Hard cap on buffer length.
 * @param current  Player position to append, or null to skip (used for
 *                 pause / wrap-reset frames where we don't want a fresh
 *                 trail point).
 */
export function updateTrail(
  trail: TrailPoint[],
  dtMs: number,
  maxAgeMs: number,
  maxLen: number,
  current: { x: number; y: number } | null,
): TrailPoint[] {
  // 1. Age + drop in a single pass.
  const aged: TrailPoint[] = [];
  for (const p of trail) {
    const next = p.age + dtMs;
    if (next <= maxAgeMs) aged.push({ x: p.x, y: p.y, age: next });
  }
  // 2. Optionally append the current point.
  if (current) {
    aged.push({ x: current.x, y: current.y, age: 0 });
  }
  // 3. Cap to maxLen, dropping the OLDEST (front of the array).
  if (aged.length > maxLen) {
    return aged.slice(aged.length - maxLen);
  }
  return aged;
}

/* ------------------------------------------------------------------ */
/*  Drawing primitives                                                */
/* ------------------------------------------------------------------ */

/**
 * Draw the grid background. Subtle white lines at 6% alpha so the player
 * can perceive displacement against a stationary reference.
 */
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

/**
 * Draw the player's motion trail as small fading dots. Each point's
 * alpha decays linearly from `0.5` at age 0 to `0` at age `maxAgeMs`.
 *
 * Color matches the capsule (off-white) but is darkened via the alpha
 * channel — no separate color constant is needed.
 */
export function drawTrail(
  ctx: CanvasRenderingContext2D,
  trail: TrailPoint[],
  maxAgeMs: number,
): void {
  if (trail.length === 0) return;
  ctx.save();
  ctx.fillStyle = '#7a7a7e';
  for (const p of trail) {
    const alpha = (1 - p.age / maxAgeMs) * 0.5;
    if (alpha <= 0) continue;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}


