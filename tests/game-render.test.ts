/**
 * tests/game-render.test.ts
 *
 * Pure-function tests for `src/game/render.ts`:
 *   - `updateTrail(positions, now, maxAgeMs, maxLen)` is the pure helper
 *     that init.ts calls once per frame to age + drop trail points.
 *   - `computeFacing(vx, vy, current)` picks the dominant axis to display.
 *
 * Why a pure helper instead of mutating an in-init.ts array: the slicing
 * rules (drop > 280 ms, keep at most 14 entries, append current) are the
 * deterministic part. Drawing the trail is a `ctx.arc` loop that is not
 * worth a DOM-free fake-canvas exercise.
 */
import { describe, it, expect } from 'vitest';
import { updateTrail } from '../src/game/render';

describe('updateTrail — append + age + drop', () => {
  it('appends the current position as a fresh point (age = 0)', () => {
    const out = updateTrail([], 1000, 280, 14, { x: 50, y: 60 });
    expect(out).toHaveLength(1);
    expect(out[0]).toEqual({ x: 50, y: 60, age: 0 });
  });

  it('increments the age of every existing point by the frame delta', () => {
    const initial = [
      { x: 10, y: 20, age: 50 },
      { x: 30, y: 40, age: 100 },
    ];
    // 16ms-per-frame at 60fps; one frame elapsed.
    const out = updateTrail(initial, 16, 280, 14, { x: 50, y: 60 });
    expect(out.map((p) => p.age)).toEqual([66, 116, 0]);
  });

  it('drops points whose age exceeds maxAgeMs', () => {
    const initial = [
      { x: 10, y: 20, age: 200 },
      { x: 30, y: 40, age: 290 }, // too old
    ];
    const out = updateTrail(initial, 16, 280, 14, { x: 50, y: 60 });
    expect(out).toHaveLength(2); // 200→216 stays, 290→306 dropped, new point added
    expect(out.map((p) => p.age)).toEqual([216, 0]);
  });

  it('caps the buffer length at maxLen (drops the OLDEST points first)', () => {
    const initial = [
      { x: 1, y: 1, age: 0 },
      { x: 2, y: 2, age: 0 },
      { x: 3, y: 3, age: 0 },
    ];
    const out = updateTrail(initial, 16, 280, 3, { x: 4, y: 4 });
    expect(out).toHaveLength(3);
    expect(out.map((p) => p.x)).toEqual([2, 3, 4]);
  });

  it('does not mutate the input array (caller keeps its reference)', () => {
    const initial = [{ x: 1, y: 1, age: 0 }];
    const snapshot = JSON.stringify(initial);
    updateTrail(initial, 16, 280, 14, { x: 2, y: 2 });
    expect(JSON.stringify(initial)).toBe(snapshot);
  });

  it('returns an empty array when input is empty and current is null', () => {
    const out = updateTrail([], 16, 280, 14, null);
    expect(out).toEqual([]);
  });

  it('skips appending when current is null but still ages existing points', () => {
    const initial = [{ x: 1, y: 1, age: 100 }];
    const out = updateTrail(initial, 16, 280, 14, null);
    expect(out).toHaveLength(1);
    expect(out[0]?.age).toBe(116);
  });
});
