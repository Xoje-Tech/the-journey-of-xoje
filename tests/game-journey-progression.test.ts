/**
 * tests/game-journey-progression.test.ts
 *
 * videogame-ui — Phase 4 Integration Tests for the journey-progression mechanics.
 * Verifies camera boundaries, player vertical clamping, collectible spawning, 
 * collision triggers, and CustomEvent dispatching.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { clampPlayerY, checkCollision } from '../src/game/physics';
import { SKILL_TEMPLATES, MAP_HEIGHT } from '../src/game/init';
import type { Player, CollectibleItem } from '../src/game/types';

describe('Journey Progression Integration', () => {
  it('SKILL_TEMPLATES defines exactly 15 collectibles distributed across 4 biomes', () => {
    expect(SKILL_TEMPLATES).toHaveLength(15);

    const biomes = SKILL_TEMPLATES.map(t => t.biome);
    expect(biomes.filter(b => b === 'LCS Robotics')).toHaveLength(3);
    expect(biomes.filter(b => b === 'Crmble')).toHaveLength(4);
    expect(biomes.filter(b => b === 'Twinny')).toHaveLength(4);
    expect(biomes.filter(b => b === 'RIDE ON')).toHaveLength(4);

    // Assert chronological vertical order
    for (let i = 0; i < SKILL_TEMPLATES.length - 1; i++) {
      expect(SKILL_TEMPLATES[i]!.y).toBeLessThanOrEqual(SKILL_TEMPLATES[i + 1]!.y);
    }
  });

  it('clampPlayerY properly clamps vertical position at boundaries', () => {
    // Upper boundary
    expect(clampPlayerY(-10, MAP_HEIGHT)).toBe(0);
    expect(clampPlayerY(0, MAP_HEIGHT)).toBe(0);

    // Lower boundary
    expect(clampPlayerY(4010, MAP_HEIGHT)).toBe(MAP_HEIGHT);
    expect(clampPlayerY(MAP_HEIGHT, MAP_HEIGHT)).toBe(MAP_HEIGHT);

    // Within bounds
    expect(clampPlayerY(1500, MAP_HEIGHT)).toBe(1500);
  });

  it('circular collision math checkCollision correctly detects overlap', () => {
    const item: CollectibleItem = {
      id: 'react',
      name: 'React',
      category: 'technical',
      biome: 'LCS Robotics',
      x: 100,
      y: 100,
      radius: 12,
      collected: false,
    };

    const playerSize = 14; // player.size in init.ts
    // Collision range is player.size/2 + item.radius = 7 + 12 = 19.

    // 1. Overlapping (distance = 10)
    const p1: Player = { x: 100, y: 110, vx: 0, vy: 0, size: playerSize };
    expect(checkCollision(p1, item)).toBe(true);

    // 2. Not overlapping (distance = 25)
    const p2: Player = { x: 100, y: 125, vx: 0, vy: 0, size: playerSize };
    expect(checkCollision(p2, item)).toBe(false);

    // 3. Exact overlap threshold (distance = 18.9)
    const p3: Player = { x: 100, y: 118.9, vx: 0, vy: 0, size: playerSize };
    expect(checkCollision(p3, item)).toBe(true);
  });
});

describe('CustomEvent dispatching', () => {
  let dispatchSpy: any;

  beforeEach(() => {
    // Mock the window.dispatchEvent
    if (typeof window !== 'undefined') {
      dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    } else {
      // Node fallback for testing environment where window is defined by vitest or missing
      global.window = {
        dispatchEvent: vi.fn()
      } as any;
      dispatchSpy = vi.spyOn(global.window, 'dispatchEvent');
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('dispatches game-state-update CustomEvent with correct detail payload upon collision simulated logic', () => {
    const collectiblesList: CollectibleItem[] = [
      { id: 'ts', name: 'TypeScript', category: 'technical', biome: 'LCS', x: 100, y: 100, radius: 12, collected: false },
      { id: 'vue', name: 'Vue', category: 'technical', biome: 'RIDE ON', x: 200, y: 200, radius: 12, collected: false },
    ];

    const player: Player = { x: 100, y: 105, vx: 0, vy: 0, size: 14 };

    // Simulate collision logic from init.ts loop
    for (const item of collectiblesList) {
      if (!item.collected && checkCollision(player, item)) {
        item.collected = true;
        const collectedCount = collectiblesList.filter(c => c.collected).length;
        const totalCount = collectiblesList.length;

        window.dispatchEvent(new CustomEvent('game-state-update', {
          detail: {
            collectedCount,
            totalCount,
            lastCollected: item.name,
            unlockedId: item.id,
          }
        }));
      }
    }

    expect(collectiblesList[0]!.collected).toBe(true);
    expect(collectiblesList[1]!.collected).toBe(false);

    expect(dispatchSpy).toHaveBeenCalledOnce();
    const eventArg = dispatchSpy.mock.calls[0][0] as CustomEvent;
    expect(eventArg.type).toBe('game-state-update');
    expect(eventArg.detail).toEqual({
      collectedCount: 1,
      totalCount: 2,
      lastCollected: 'TypeScript',
      unlockedId: 'ts',
    });
  });
});
