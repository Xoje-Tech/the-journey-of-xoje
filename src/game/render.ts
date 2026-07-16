/**
 * src/game/render.ts
 *
 * Canvas 2D drawing primitives for the videogame-ui slice, plus two pure
 * helpers (`updateTrail`, `computeFacing`) so the determinstic parts of
 * the capsule + trail animation can be unit-tested without a DOM.
 *
 * Exports:
 *   - `drawGrid(ctx, w, h, gridSize)` — light grid lines so the player can
 *      perceive displacement against a stationary background.
 *   - `drawTrail(ctx, trail, maxAgeMs)` — small fading dots behind the
 *      player (P3, see design).
 *   - `drawPlayerCapsule(ctx, player, blinkActive)` — vertical pill
 *      sprite, 10x16 logical px (P1, see design). Optional "blink" line
 *      on the top arc.
 *   - `updateTrail(...)` — pure: age + drop + append for the trail buffer.
 *   - `computeFacing(vx, vy)` — pure: dominant-axis facing vector.
 *   - Constants: `TRAIL_MAX_AGE_MS`, `TRAIL_MAX_LEN`, `CAPSULE_W`, `CAPSULE_H`,
 *     `BLINK_DURATION_MS`, `BLINK_MIN_INTERVAL_MS`, `BLINK_MAX_INTERVAL_MS`.
 *
 * Visual language is deliberately minimal: the player is the only moving
 * thing on screen, so all the polish lives here.
 */
import type { Player, TrailPoint } from './types';

/* ------------------------------------------------------------------ */
/*  Constants — exported so init.ts and tests share the same numbers. */
/* ------------------------------------------------------------------ */

/** Maximum age (ms) a trail point survives before being dropped. */
export const TRAIL_MAX_AGE_MS = 280;

/** Maximum number of trail points retained in the buffer (ring-style). */
export const TRAIL_MAX_LEN = 14;

/** Capsule sprite width in logical px. */
export const CAPSULE_W = 10;
/** Capsule sprite height in logical px. */
export const CAPSULE_H = 16;

/** How long a blink is visible (ms). */
export const BLINK_DURATION_MS = 120;
/** Lower bound for the random interval between blinks (ms). */
export const BLINK_MIN_INTERVAL_MS = 3000;
/** Upper bound for the random interval between blinks (ms). */
export const BLINK_MAX_INTERVAL_MS = 5000;

/* ------------------------------------------------------------------ */
/*  Pure helpers                                                      */
/* ------------------------------------------------------------------ */

/**
 * Compute the dominant-axis facing vector for the capsule sprite.
 *
 * Tie-breaker: equal magnitudes favor horizontal. At rest (both zero)
 * the result is `{x: 0, y: 1}` ("down") — matches the slice-1 visual.
 */
export function computeFacing(
  vx: number,
  vy: number,
): { x: -1 | 0 | 1; y: -1 | 0 | 1 } {
  const ax = Math.abs(vx);
  const ay = Math.abs(vy);
  if (ax === 0 && ay === 0) return { x: 0, y: 1 };
  if (ax >= ay) {
    return { x: vx > 0 ? 1 : vx < 0 ? -1 : 0, y: 0 };
  }
  return { x: 0, y: vy > 0 ? 1 : vy < 0 ? -1 : 0 };
}

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

/**
 * Draw the player as a vertical pill capsule, centered on `player.x/y`.
 *
 * Visual: white fill, subtle dark stroke. When `blinkActive` is true, a
 * thin dark horizontal line is drawn across the top arc — the "blink"
 * animation.
 */
export function drawPlayerCapsule(
  ctx: CanvasRenderingContext2D,
  player: Player,
  blinkActive: boolean,
): void {
  // Fallback to "down" facing when the optional `facing` field is absent
  // (older callers / test fixtures that build minimal Player objects).
  const facing = player.facing ?? { x: 0, y: 1 };
  void facing; // currently the capsule is symmetric; reserved for future pose work.

  const w = CAPSULE_W;
  const h = CAPSULE_H;
  const left = player.x - w / 2;
  const top = player.y - h / 2;
  const radius = w / 2; // semicircle ends → true pill shape

  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#1a1a1f';
  ctx.lineWidth = 1.5;

  // Pill = rectangle with semicircular caps on top/bottom.
  ctx.beginPath();
  ctx.moveTo(left + radius, top);
  ctx.lineTo(left + w - radius, top);
  ctx.arc(left + w - radius, top + radius, radius, -Math.PI / 2, Math.PI / 2, false);
  ctx.lineTo(left + radius, top + h - radius);
  ctx.arc(left + radius, top + h - radius, radius, Math.PI / 2, -Math.PI / 2, false);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Blink overlay: thin horizontal line across the top arc.
  if (blinkActive) {
    ctx.beginPath();
    ctx.strokeStyle = '#1a1a1f';
    ctx.lineWidth = 1.5;
    ctx.moveTo(left + 2, top + radius);
    ctx.lineTo(left + w - 2, top + radius);
    ctx.stroke();
  }
  ctx.restore();
}
