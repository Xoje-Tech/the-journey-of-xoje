/**
 * src/game/physics.ts
 *
 * Pure physics primitives. No DOM, no canvas, no `requestAnimationFrame` —
 * every function takes its inputs as arguments and returns a fresh value.
 * This keeps the module trivially testable and reusable from any frame loop.
 *
 * - `wrapAround(p, w, h)` — when a player crosses a canvas boundary, the
 *   modular arithmetic `((x % w) + w) % w` puts them on the opposite edge
 *   at the mirrored coordinate. JS's `%` keeps the dividend's sign, so a
 *   naive `x % w` would yield negatives for leftward motion. The
 *   double-mod corrects that.
 * - `applyFriction(v, f)` — multiplies both velocity components by `f`,
 *   which is in [0, 1] for normal gameplay; 1.0 means no friction.
 */

import type { Player } from './types';

/**
 * Wrap a player's position around the canvas. Returns a NEW player object
 * (does not mutate the input — keeps callers free to keep references).
 */
export function wrapAround(p: Player, w: number, h: number): Player {
  return {
    ...p,
    x: ((p.x % w) + w) % w,
    y: ((p.y % h) + h) % h,
  };
}

/**
 * Multiply both velocity components by `f`. `f` in [0, 1] gives decay; `f=1`
 * is identity; `f > 1` would amplify and is undefined-behavior here.
 */
export function applyFriction(v: { vx: number; vy: number }, f: number): { vx: number; vy: number } {
  return { vx: v.vx * f, vy: v.vy * f };
}