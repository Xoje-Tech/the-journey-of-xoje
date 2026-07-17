/**
 * src/game/hud.ts
 *
 * Pure formatter for the on-screen HUD telemetry string drawn by init.ts
 * via `ctx.fillText`. Kept as a pure function (no DOM, no canvas) so it
 * can be unit-tested under vitest 1.6.1 without a DOM environment
 * (matches the project's "no jsdom/happy-dom without user OK" doctrine).
 *
 * Output shape (4 lines, `\n`-joined):
 *
 *     xoje.dev
 *     pos  (x, y)
 *     vel  (vx, vy)
 *     fps
 *
 * Format rules:
 *   - Position uses 1 decimal place (e.g. "412.5, 187.0") — `toFixed(1)`.
 *   - Velocity uses 2 decimal places WITH an explicit sign (`+` for
 *     non-negative, `-` for negative). Zero renders as "+0.00" so the
 *     column does not visually flicker when the value oscillates around 0.
 *     Negative zero (e.g. `-1e-17` produced by friction's snap-to-zero
 *     path) is normalized to "+0.00".
 *   - fps is rendered as an integer (rounded to nearest; `Math.round`).
 *
 * Why the HUD is canvas-rendered (NOT a DOM element):
 *   - Slice 1 established that the entire game is canvas. Adding a `<div>`
 *     for the HUD would force a parallel DOM/CSS lifecycle (z-index
 *     stacking vs. the canvas, @media screen visibility, font loading).
 *   - `src/styles/print.css` contains a `display:none!important` rule
 *     pre-planned for the hypothetical DOM HUD (slice 1). Since we
 *     render via `ctx.fillText` and never create a DOM node, that rule
 *     is dead CSS — it matches nothing. We keep it so the print contract
 *     surface is stable if someone later swaps to a DOM HUD; the cost of
 *     a dead selector is zero.
 *
 * `canvasW` and `canvasH` are accepted as arguments purely for future
 * extensions (e.g. "you are at x%, y%" indicators). The current formatter
 * does NOT use them — keeping the signature explicit makes the intent
 * (LOGICAL pixels from the caller, not backing-store px) obvious.
 */
import type { Player } from "@/modules/game/domain/types";

/**
 * Render the HUD text shown in the top-left of the canvas.
 *
 * @param player   Current player state (position + velocity).
 * @param canvasW  Logical canvas width in CSS pixels (NOT backing-store px).
 * @param canvasH  Logical canvas height in CSS pixels.
 * @param fps      Current frames-per-second; rounded to the nearest whole.
 */
export function formatHud(player: Player, canvasW: number, canvasH: number, fps: number): string {
  // Position: 1 decimal place. `toFixed(1)` is locale-independent (always
  // a `.`), which matters because ctx.fillText uses the runtime's locale
  // for `toString()` and we don't want a Spanish printout to suddenly
  // render "412,5".
  const px = player.x.toFixed(1);
  const py = player.y.toFixed(1);

  // Velocity: 2 decimals with explicit sign. `formatSigned` collapses
  // negative-zero to "+0.00" so a value like -1e-17 doesn't print "-0.00".
  const vx = formatSigned(player.vx);
  const vy = formatSigned(player.vy);

  // fps: integer. Round rather than floor — 59.7 should read 60, not 59.
  const fpsRounded = Math.round(fps);

  // canvasW/canvasH are part of the signature for forward-compat
  // (e.g. a future "x%, y%" indicator); suppress unused-arg lint cleanly.
  void canvasW;
  void canvasH;

  return ['xoje.dev', `pos  (${px}, ${py})`, `vel  (${vx}, ${vy})`, `fps ${fpsRounded}`].join('\n');
}

/**
 * Format a numeric velocity component as a signed, 2-decimal-place string.
 *
 *   2.45   -> "+2.45"
 *  -0.13   -> "-0.13"
 *   0      -> "+0.00"
 *  -1e-17  -> "+0.00"   (negative-zero collapse)
 */
function formatSigned(n: number): string {
  const fixed = n.toFixed(2);
  // Collapse negative-zero. Tiny residuals like `-1e-17` (produced by the
  // friction snap-to-zero path in init.ts) round to "-0.00" via toFixed,
  // which then flickers the column. Detect the rounded output rather than
  // the input value because `n === 0` is false for `-1e-17` even though
  // toFixed renders it as zero.
  if (fixed === '0.00' || fixed === '-0.00') return '+0.00';
  return n >= 0 ? `+${fixed}` : fixed;
}
