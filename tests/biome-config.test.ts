/**
 * tests/biome-config.test.ts
 *
 * Unit contract for the biome-engine authoring surface. Asserts the
 * invariants the spec and design.md establish:
 *
 *   - 4 biomes, each with a unique BiomeId
 *   - MAP_HEIGHT is derived (sum of biome heights), not a literal
 *   - 19 collectible skills distributed 4/5/5/5 across biomes
 *   - 4 NPCs, one per biome (Héctor, Laura, Dani, Marcos)
 *   - buildCollectibles rejects out-of-range yOffset and orphan npcId
 *   - NPCS.find resolves each collectible's npcId to its NPC
 *
 * Anchor assertions on BiomeId literals, not display strings.
 */
import { describe, it, expect } from 'vitest';
import {
  BIOMES,
  NPCS,
  MAP_HEIGHT,
  buildCollectibles,
} from '../src/modules/game/infrastructure/biome-config';
import type { BiomeConfig, BiomeId, NPCConfig } from '../src/modules/game/domain/types';

const BIOME_ORDER: readonly BiomeId[] = ['lcs-robotics', 'crmble', 'twinny', 'ride-on'];
const PER_BIOME_COUNTS = [4, 5, 5, 5] as const;

describe('BIOMES — authoring surface', () => {
  it('exports exactly 4 biomes on first ship', () => {
    expect(BIOMES).toHaveLength(4);
  });

  it('uses BiomeId literals in declared order: lcs-robotics, crmble, twinny, ride-on', () => {
    expect(BIOMES.map((b) => b.id)).toEqual([...BIOME_ORDER]);
  });

  it('attaches the LCS building decoration at yOffset 100', () => {
    expect(BIOMES.find((b) => b.id === 'lcs-robotics')?.decorations).toEqual([
      {
        sprite: 'biomes/lcs/lcs-building.png',
        yOffset: 100,
        xRatio: 0.5,
        scale: 1,
      },
    ]);
  });

  it('has unique BiomeId per biome', () => {
    const ids = new Set(BIOMES.map((b) => b.id));
    expect(ids.size).toBe(BIOMES.length);
  });
});

describe('MAP_HEIGHT — derived, not literal', () => {
  it('equals the sum of every biome height', () => {
    const expected = BIOMES.reduce((h, b) => h + b.height, 0);
    expect(MAP_HEIGHT).toBe(expected);
  });

  it('is 4000 on first ship (4 biomes × 1000 px each)', () => {
    expect(MAP_HEIGHT).toBe(4000);
  });
});

describe('skills — 4/5/5/5 distribution', () => {
  it('defines exactly 19 skills in total', () => {
    const total = BIOMES.flatMap((b) => b.skills).length;
    expect(total).toBe(19);
  });

  it('distributes skills 4/5/5/5 across the 4 biomes in declared order', () => {
    const counts = BIOMES.map((b) => b.skills.length);
    expect(counts).toEqual([...PER_BIOME_COUNTS]);
  });
});

describe('NPCS — external NPC table', () => {
  it('exports exactly 4 NPCs on first ship', () => {
    expect(NPCS).toHaveLength(4);
  });

  it('binds Héctor to lcs-robotics, Laura to crmble, Dani to twinny, Marcos to ride-on', () => {
    const byBiome = new Map(NPCS.map((n) => [n.biomeId, n]));
    expect(byBiome.get('lcs-robotics')?.name).toBe('Héctor');
    expect(byBiome.get('lcs-robotics')?.initial).toBe('H');
    expect(byBiome.get('crmble')?.name).toBe('Laura');
    expect(byBiome.get('crmble')?.initial).toBe('L');
    expect(byBiome.get('twinny')?.name).toBe('Dani');
    expect(byBiome.get('twinny')?.initial).toBe('D');
    expect(byBiome.get('ride-on')?.name).toBe('Marcos');
    expect(byBiome.get('ride-on')?.initial).toBe('M');
  });

  it('provides localized dialogue for every NPC', () => {
    for (const n of NPCS) {
      expect(n.dialogue.es.length).toBeGreaterThan(0);
      expect(n.dialogue.en.length).toBeGreaterThan(0);
    }
  });
});

describe('buildCollectibles — spawn-time Y resolver', () => {
  it('produces 19 collectibles in chronological vertical order', () => {
    const items = buildCollectibles(BIOMES, NPCS);
    expect(items).toHaveLength(19);
    for (let i = 0; i < items.length - 1; i++) {
      expect(items[i]!.y).toBeLessThanOrEqual(items[i + 1]!.y);
    }
  });

  it('resolves yOffset to absolute world Y at the start of each biome', () => {
    const items = buildCollectibles(BIOMES, NPCS);
    // First biome starts at y=0; kuka-robotics authored at yOffset=250.
    expect(items[0]!.id).toBe('kuka-robotics');
    expect(items[0]!.y).toBe(250);
  });

  it('preserves per-biome counts 4/5/5/5 and BiomeId assignments', () => {
    const items = buildCollectibles(BIOMES, NPCS);
    const perBiome: Record<BiomeId, number> = {
      'lcs-robotics': 0,
      crmble: 0,
      twinny: 0,
      'ride-on': 0,
    };
    for (const item of items) {
      perBiome[item.biome] = (perBiome[item.biome] ?? 0) + 1;
    }
    expect(perBiome['lcs-robotics']).toBe(4);
    expect(perBiome['crmble']).toBe(5);
    expect(perBiome['twinny']).toBe(5);
    expect(perBiome['ride-on']).toBe(5);
  });

  it('attaches npcId to collectibles that host an NPC', () => {
    const items = buildCollectibles(BIOMES, NPCS);
    const npcItems = items.filter((i) => i.npcId !== undefined);
    expect(npcItems).toHaveLength(4);
    expect(npcItems.map((i) => i.npcId).sort()).toEqual([...BIOME_ORDER].sort());
  });

  it('attaches x = 0 (dynamic X is mapped in resize())', () => {
    const items = buildCollectibles(BIOMES, NPCS);
    for (const item of items) {
      expect(item.x).toBe(0);
      expect(item.radius).toBe(12);
      expect(item.collected).toBe(false);
    }
  });

  it('rejects a skill whose yOffset is below 0', () => {
    const broken: BiomeConfig[] = [
      {
        id: 'lcs-robotics',
        label: 'Broken',
        height: 1000,
        skills: [
          { id: 'bad', name: 'Bad', category: 'technical' as const, yOffset: -1, xRatio: 0.5 },
        ],
        decorations: [],
      },
    ];
    expect(() => buildCollectibles(broken, [])).toThrow(/yOffset/);
  });

  it('rejects a skill whose yOffset exceeds the biome height', () => {
    const broken: BiomeConfig[] = [
      {
        id: 'lcs-robotics',
        label: 'Broken',
        height: 1000,
        skills: [
          { id: 'bad', name: 'Bad', category: 'technical' as const, yOffset: 1500, xRatio: 0.5 },
        ],
        decorations: [],
      },
    ];
    expect(() => buildCollectibles(broken, [])).toThrow(/yOffset/);
  });

  it('rejects an orphan npcId that no NPC owns', () => {
    const ghostNpcs: NPCConfig[] = [
      { biomeId: 'twinny', name: 'Ghost', initial: 'G', dialogue: { es: '', en: '' } },
    ];
    expect(() => buildCollectibles(BIOMES, ghostNpcs)).toThrow(/orphan/i);
  });
});

describe('NPC lookup — resolve npcId → NPCConfig', () => {
  it('NPCS.find returns the NPC whose biomeId matches the collectible npcId', () => {
    const items = buildCollectibles(BIOMES, NPCS);
    for (const item of items) {
      if (item.npcId === undefined) continue;
      const npc = NPCS.find((n) => n.biomeId === item.npcId);
      expect(npc).toBeDefined();
      expect(npc!.biomeId).toBe(item.npcId);
    }
  });
});