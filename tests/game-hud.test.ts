/**
 * tests/game-hud.test.ts
 *
 * Pure-function tests for `src/game/hud.ts`:
 *   - `formatHud(player, canvasW, canvasH, fps)` returns a multiline telemetry
 *     string used by init.ts to draw on the canvas via ctx.fillText.
 *
 * Format contract (matches the slice brief):
 *
 *     xoje.dev
 *     pos  (x, y)
 *     vel  (vx, vy)
 *     fps
 *
 *   - Position uses 1 decimal place (e.g. "412.5, 187.0").
 *   - Velocity uses 2 decimal places WITH sign, including a "+" for non-negatives
 *     and "-" for negatives (e.g. "+2.45, -0.13"). Zero must render as "+0.00"
 *     (explicit sign makes the column visually stable as numbers oscillate).
 *   - fps is rendered as an integer (rounded to the nearest whole number).
 *   - canvasW/canvasH are LOGICAL pixels — the function does NOT read backing-store
 *     width/height; if a caller passes device px, the position-vs-canvas ratio
 *     will simply look wrong, but that is the caller's responsibility, not this
 *     formatter's.
 *
 * Why a pure function: the HUD string is the deterministic part. Drawing it on
 * the canvas is a 2-line loop in init.ts; the formatting math (signs, decimals,
 * negative-zero handling) is what is worth regression-testing.
 */
import { describe, it, expect } from 'vitest';
import { formatHud } from '../src/game/hud';
import type { Player } from '../src/game/types';

function makePlayer(x: number, y: number, vx: number, vy: number): Player {
  return { x, y, vx, vy, size: 10 };
}

describe('formatHud — multiline shape', () => {
  it('renders exactly 4 lines in the documented order', () => {
    const out = formatHud(makePlayer(100, 200, 0, 0), 800, 600, 60);
    const lines = out.split('\n');
    expect(lines).toHaveLength(4);
    expect(lines[0]).toBe('xoje.dev');
    expect(lines[1]).toMatch(/^pos\s+\(/);
    expect(lines[2]).toMatch(/^vel\s+\(/);
    expect(lines[3]).toMatch(/^fps\s+\d+$/);
  });

  it('starts with the brand line "xoje.dev"', () => {
    const out = formatHud(makePlayer(0, 0, 0, 0), 800, 600, 60);
    expect(out.startsWith('xoje.dev\n')).toBe(true);
  });

  it('places the fps line LAST so callers can split-on-newline safely', () => {
    const out = formatHud(makePlayer(1, 2, 3, 4), 100, 100, 60);
    expect(out.endsWith('fps 60')).toBe(true);
  });
});

describe('formatHud — position formatting (1 decimal place)', () => {
  it('renders an integer-valued position as ".0"', () => {
    const out = formatHud(makePlayer(412, 187, 0, 0), 800, 600, 60);
    expect(out).toContain('pos  (412.0, 187.0)');
  });

  it('renders a fractional position with one decimal', () => {
    const out = formatHud(makePlayer(412.5, 187.04, 0, 0), 800, 600, 60);
    expect(out).toContain('pos  (412.5, 187.0)');
  });

  it('rounds the second decimal of position (0.05 → 0.1 with toFixed semantics)', () => {
    // toFixed(1) of 187.04 = "187.0"; of 187.05 = "187.1" (banker's rounding in V8
    // is actually "187.1" for 187.05 — depends on the float representation).
    // Either way the format MUST be one decimal place.
    const out = formatHud(makePlayer(0, 187.05, 0, 0), 800, 600, 60);
    expect(out).toMatch(/pos\s+\(0\.0, 187\.[01]\)/);
  });
});

describe('formatHud — velocity formatting (signed, 2 decimals)', () => {
  it('renders positive velocity with explicit "+" sign', () => {
    const out = formatHud(makePlayer(0, 0, 2.45, 0.13), 800, 600, 60);
    expect(out).toContain('vel  (+2.45, +0.13)');
  });

  it('renders negative velocity with "-" sign', () => {
    const out = formatHud(makePlayer(0, 0, -2.45, -0.13), 800, 600, 60);
    expect(out).toContain('vel  (-2.45, -0.13)');
  });

  it('renders mixed-sign velocity correctly', () => {
    const out = formatHud(makePlayer(0, 0, 2.45, -0.13), 800, 600, 60);
    expect(out).toContain('vel  (+2.45, -0.13)');
  });

  it('renders EXACT zero as "+0.00" (no negative zero, no bare "0")', () => {
    const out = formatHud(makePlayer(0, 0, 0, 0), 800, 600, 60);
    expect(out).toContain('vel  (+0.00, +0.00)');
  });

  it('coerces negative-zero velocity to "+0.00" so the column does not flicker', () => {
    // -1e-17 is the canonical negative-zero after friction snaps to 1e-3.
    // Without an explicit guard, "-0.00" would print and look broken.
    const out = formatHud(makePlayer(0, 0, -1e-17, 0), 800, 600, 60);
    expect(out).toContain('vel  (+0.00, +0.00)');
    expect(out).not.toContain('-0.00');
  });
});

describe('formatHud — fps formatting', () => {
  it('renders an integer fps verbatim', () => {
    const out = formatHud(makePlayer(0, 0, 0, 0), 800, 600, 60);
    expect(out).toContain('fps 60');
  });

  it('rounds fractional fps to the nearest whole number', () => {
    const out = formatHud(makePlayer(0, 0, 0, 0), 800, 600, 59.7);
    expect(out).toContain('fps 60');
  });

  it('rounds 59.4 down to 59', () => {
    const out = formatHud(makePlayer(0, 0, 0, 0), 800, 600, 59.4);
    expect(out).toContain('fps 59');
  });
});
