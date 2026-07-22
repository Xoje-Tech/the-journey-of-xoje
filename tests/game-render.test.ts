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
import { describe, it, expect, vi } from 'vitest';
import { updateTrail, isWithinViewport, drawCollectibles } from "../src/modules/game/infrastructure/render";
import type { CollectibleItem } from "../src/modules/game/domain/types";
import { NPCS } from "../src/modules/game/infrastructure/biome-config";

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

describe('isWithinViewport — frustum culling helper', () => {
  it('returns true if the item is entirely inside the viewport', () => {
    // Viewport is [1000, 1800]
    // Item is at y = 1400 with radius = 15. Overlaps [1385, 1415].
    expect(isWithinViewport(1400, 15, 1000, 800)).toBe(true);
  });

  it('returns true if the item overlaps with the top boundary', () => {
    // Viewport is [1000, 1800]
    // Item is at y = 990 with radius = 15. Overlaps [975, 1005], which intersects viewport at [1000, 1005].
    expect(isWithinViewport(990, 15, 1000, 800)).toBe(true);
  });

  it('returns true if the item overlaps with the bottom boundary', () => {
    // Viewport is [1000, 1800]
    // Item is at y = 1810 with radius = 15. Overlaps [1795, 1825], which intersects viewport at [1795, 1800].
    expect(isWithinViewport(1810, 15, 1000, 800)).toBe(true);
  });

  it('returns false if the item is completely above the viewport', () => {
    // Viewport is [1000, 1800]
    // Item is at y = 950 with radius = 15. Overlaps [935, 965], completely above 1000.
    expect(isWithinViewport(950, 15, 1000, 800)).toBe(false);
  });

  it('returns false if the item is completely below the viewport', () => {
    // Viewport is [1000, 1800]
    // Item is at y = 1850 with radius = 15. Overlaps [1835, 1865], completely below 1800.
    expect(isWithinViewport(1850, 15, 1000, 800)).toBe(false);
  });
});

describe('drawCollectibles — NPC rendering checks', () => {
  it('should render NPCs with yellow circles, their capital initials, and name tags', () => {
    const ctx = {
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      fillText: vi.fn(),
      font: '',
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
      textAlign: '',
      textBaseline: '',
    } as any;

    const items: CollectibleItem[] = [
      {
        id: 'international-ops',
        name: 'Operacion en entorno internacional',
        category: 'qualitative',
        biome: 'lcs-robotics',
        x: 100,
        y: 500,
        radius: 12,
        collected: false,
        npcId: 'lcs-robotics',
      },
    ];

    drawCollectibles(ctx, items, 0, 800, {}, NPCS);

    // Verify NPC custom drawing calls
    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.arc).toHaveBeenCalledWith(100, 500, 12, 0, Math.PI * 2);
    expect(ctx.fillStyle).toBe('#ffffff'); // name label or initial fill color
    expect(ctx.fillText).toHaveBeenCalledWith('H', 100, 500); // Initial
    expect(ctx.fillText).toHaveBeenCalledWith('Héctor (NPC)', 100, 480); // Name label (y - radius - 8)
  });
});
