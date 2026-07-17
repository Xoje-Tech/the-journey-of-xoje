/**
 * tests/game-physics.test.ts
 *
 * Pure-function tests for `src/game/physics.ts`:
 *   - `wrapAround(p, w, h)` must handle all four edges, exact-edge transitions
 *     (x === w must wrap to 0, not stay at w), and arbitrary negative inputs
 *     (e.g. player moving leftward through x=0).
 *   - `applyFriction(v, f)` must multiply both axes and never amplify.
 *
 * Triangulation: each behavior has at least two scenarios — one inside-the-canvas
 * (no wrap expected) and one across an edge (wrap expected). The wrap case
 * proves the math, the no-op case proves we didn't break ordinary movement.
 */
import { describe, it, expect } from 'vitest';
// Production code that DOES NOT EXIST YET — importing it on a fresh checkout
// would fail at module-resolution time, which is itself a valid RED signal.
// The test runner will report the missing module as the failure.
import { wrapAround, applyFriction, clampPlayerY, checkCollision } from '../src/modules/game/application/physics';
import type { Player, CollectibleItem } from '../src/modules/game/domain/types';

function makePlayer(x: number, y: number): Player {
  return { x, y, vx: 0, vy: 0, size: 10 };
}

describe('wrapAround — pure function', () => {
  it('returns the same player when strictly inside the canvas', () => {
    const p = makePlayer(50, 50);
    const out = wrapAround(p, 200, 100);
    expect(out.x).toBe(50);
    expect(out.y).toBe(50);
  });

  it('wraps from the right edge (x === w) back to 0 (not clamped)', () => {
    const p = makePlayer(200, 30);
    const out = wrapAround(p, 200, 100);
    expect(out.x).toBe(0);
    expect(out.y).toBe(30);
  });

  it('wraps from the bottom edge (y === h) back to 0 (not clamped)', () => {
    const p = makePlayer(40, 100);
    const out = wrapAround(p, 200, 100);
    expect(out.x).toBe(40);
    expect(out.y).toBe(0);
  });

  it('wraps positive overflow at the right edge (x > w)', () => {
    const p = makePlayer(225, 30); // 200 + 25
    const out = wrapAround(p, 200, 100);
    expect(out.x).toBe(25);
  });

  it('wraps positive overflow at the bottom edge (y > h)', () => {
    const p = makePlayer(40, 137); // 100 + 37
    const out = wrapAround(p, 200, 100);
    expect(out.y).toBe(37);
  });

  it('wraps negative overflow at the left edge (x < 0)', () => {
    const p = makePlayer(-15, 30); // moving leftward through the wall
    const out = wrapAround(p, 200, 100);
    // ((-15 % 200) + 200) % 200 = ((-15) + 200) % 200 = 185
    expect(out.x).toBe(185);
  });

  it('wraps negative overflow at the top edge (y < 0)', () => {
    const p = makePlayer(40, -8);
    const out = wrapAround(p, 200, 100);
    expect(out.y).toBe(92);
  });

  it('does not mutate the original player object', () => {
    const p = makePlayer(225, 30);
    const orig = { ...p };
    wrapAround(p, 200, 100);
    expect(p).toEqual(orig);
  });
});

describe('applyFriction — pure function', () => {
  // Floating-point multiplication is not exact (10 * 0.92 = 9.200000000000001).
  // Assert with `toBeCloseTo` to a small precision to avoid spurious failure.
  it('scales velocity by f when f is 0.92', () => {
    const out = applyFriction({ vx: 10, vy: -20 }, 0.92);
    expect(out.vx).toBeCloseTo(9.2, 10);
    expect(out.vy).toBeCloseTo(-18.4, 10);
  });

  it('returns zero velocity when f is 0', () => {
    expect(applyFriction({ vx: 5, vy: 5 }, 0)).toEqual({ vx: 0, vy: 0 });
  });

  it('returns the original velocity when f is 1 (no friction)', () => {
    expect(applyFriction({ vx: 7, vy: -3 }, 1)).toEqual({ vx: 7, vy: -3 });
  });

  it('never amplifies — magnitude is non-increasing for 0 <= f <= 1', () => {
    const v = { vx: 10, vy: 10 };
    const out = applyFriction(v, 0.92);
    const magIn = Math.hypot(v.vx, v.vy);
    const magOut = Math.hypot(out.vx, out.vy);
    expect(magOut).toBeLessThanOrEqual(magIn + 1e-9);
  });
});

describe('clampPlayerY — pure function', () => {
  it('keeps y unchanged if within bounds [0, max]', () => {
    expect(clampPlayerY(150, 4000)).toBe(150);
    expect(clampPlayerY(0, 4000)).toBe(0);
    expect(clampPlayerY(4000, 4000)).toBe(4000);
  });

  it('clamps y to 0 if it is negative', () => {
    expect(clampPlayerY(-10, 4000)).toBe(0);
    expect(clampPlayerY(-100, 1000)).toBe(0);
  });

  it('clamps y to max if it exceeds max', () => {
    expect(clampPlayerY(4050, 4000)).toBe(4000);
    expect(clampPlayerY(1200, 1000)).toBe(1000);
  });
});

describe('checkCollision — pure function', () => {
  const item: CollectibleItem = {
    id: 'typescript',
    name: 'TypeScript',
    category: 'technical',
    biome: 'LCS Robotics',
    x: 100,
    y: 100,
    radius: 15,
    collected: false,
  };

  it('returns true if player overlaps with item', () => {
    // Player size is 14, player half-size (radius equivalent for collision) is 7.
    // Item radius is 15. Collision limit is 7 + 15 = 22.
    // Distance here is 10.
    const p = { x: 100, y: 110, vx: 0, vy: 0, size: 14 };
    expect(checkCollision(p, item)).toBe(true);
  });

  it('returns false if player does not overlap with item', () => {
    // Distance here is 30, which is > 22.
    const p = { x: 100, y: 130, vx: 0, vy: 0, size: 14 };
    expect(checkCollision(p, item)).toBe(false);
  });

  it('returns true on exact edge overlap boundary', () => {
    // Distance here is 21.99, which is < 22.
    const p = { x: 100, y: 121.9, vx: 0, vy: 0, size: 14 };
    expect(checkCollision(p, item)).toBe(true);
  });
});
