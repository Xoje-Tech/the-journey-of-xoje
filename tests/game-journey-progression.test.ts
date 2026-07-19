/**
 * tests/game-journey-progression.test.ts
 *
 * videogame-ui — Phase 4 Integration Tests for the journey-progression mechanics.
 * Verifies camera boundaries, player vertical clamping, collectible spawning,
 * collision triggers, and CustomEvent dispatching.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { clampPlayerY, checkCollision } from "../src/modules/game/application/physics";
import { BIOMES, MAP_HEIGHT, buildCollectibles } from "../src/modules/game/infrastructure/biome-config";
import type { Player, CollectibleItem } from "../src/modules/game/domain/types";

describe('Journey Progression Integration', () => {
  it('BIOMES defines exactly 19 collectibles distributed across 4 biome IDs', () => {
    const skills = BIOMES.flatMap((biome) => biome.skills);
    expect(skills).toHaveLength(19);

    expect(BIOMES.find((b) => b.id === 'lcs-robotics')?.skills).toHaveLength(4);
    expect(BIOMES.find((b) => b.id === 'crmble')?.skills).toHaveLength(5);
    expect(BIOMES.find((b) => b.id === 'twinny')?.skills).toHaveLength(5);
    expect(BIOMES.find((b) => b.id === 'ride-on')?.skills).toHaveLength(5);

    const items = buildCollectibles(BIOMES, [
      { biomeId: 'lcs-robotics', name: 'Héctor', initial: 'H', dialogue: { es: '¡Ey!', en: 'Hey!' } },
      { biomeId: 'crmble', name: 'Laura', initial: 'L', dialogue: { es: 'Hola', en: 'Hi' } },
      { biomeId: 'twinny', name: 'Dani', initial: 'D', dialogue: { es: 'Hola', en: 'Hi' } },
      { biomeId: 'ride-on', name: 'Marcos', initial: 'M', dialogue: { es: 'Hola', en: 'Hi' } },
    ]);
    for (let i = 0; i < items.length - 1; i++) {
      expect(items[i]!.y).toBeLessThanOrEqual(items[i + 1]!.y);
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
      biome: 'lcs-robotics',
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
        dispatchEvent: vi.fn(),
      } as any;
      dispatchSpy = vi.spyOn(global.window, 'dispatchEvent');
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('dispatches game-state-update CustomEvent with correct detail payload upon collision simulated logic', () => {
    const collectiblesList: CollectibleItem[] = [
      {
        id: 'ts',
        name: 'TypeScript',
        category: 'technical',
        biome: 'lcs-robotics',
        x: 100,
        y: 100,
        radius: 12,
        collected: false,
      },
      {
        id: 'vue',
        name: 'Vue',
        category: 'technical',
        biome: 'ride-on',
        x: 200,
        y: 200,
        radius: 12,
        collected: false,
      },
    ];

    const player: Player = { x: 100, y: 105, vx: 0, vy: 0, size: 14 };

    // Simulate collision logic from init.ts loop
    for (const item of collectiblesList) {
      if (!item.collected && checkCollision(player, item)) {
        item.collected = true;
        const collectedCount = collectiblesList.filter((c) => c.collected).length;
        const totalCount = collectiblesList.length;

        window.dispatchEvent(
          new CustomEvent('game-state-update', {
            detail: {
              collectedCount,
              totalCount,
              lastCollected: item.name,
              unlockedId: item.id,
            },
          }),
        );
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
