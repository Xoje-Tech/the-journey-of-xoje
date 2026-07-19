/**
 * src/modules/game/infrastructure/biome-config.ts
 *
 * Authoritative authoring surface for the vertical career map. Single
 * source of truth for biomes, per-biome skills, per-biome decorations,
 * the external NPC table, and the derived `MAP_HEIGHT`. The engine
 * (`init.ts`, `render.ts`) reads only this module — no string literals,
 * no inline NPC metadata, no per-engine MAP_HEIGHT constant.
 *
 * Coordinate model:
 *   - `BiomeConfig.skills[].yOffset` is authored RELATIVE to the start
 *     of its owning biome (0 ≤ yOffset ≤ biome.height).
 *   - At spawn time `buildCollectibles` resolves each `yOffset` to an
 *     absolute world Y by accumulating the heights of all preceding
 *     biomes. Reordering a biome or changing its height therefore shifts
 *     only downstream biomes' world positions; authored `yOffset`
 *     values stay stable.
 *
 * NPC lookup:
 *   - `CollectibleItem.npcId: BiomeId` references a row in `NPCS` via
 *     `NPCS.find((n) => n.biomeId === collectible.npcId)`.
 *
 * MAP_HEIGHT:
 *   - Derived: `BIOMES.reduce((h, b) => h + b.height, 0)`. Never a
 *     numeric literal in engine code.
 */
import type {
  BiomeConfig,
  BiomeId,
  CollectibleItem,
  NPCConfig,
} from '@/modules/game/domain/types';

/* ------------------------------------------------------------------ */
/*  BIOMES — chronological, top-to-bottom                             */
/* ------------------------------------------------------------------ */

export const BIOMES: readonly BiomeConfig[] = [
  {
    id: 'lcs-robotics',
    label: 'LCS Robotics',
    height: 1000,
    skills: [
      {
        id: 'kuka-robotics',
        name: 'KUKA robotics tooling',
        category: 'technical',
        yOffset: 250,
        xRatio: 0.3,
      },
      {
        id: 'cultural-adaptability',
        name: 'Cultural adaptability',
        category: 'soft',
        yOffset: 350,
        xRatio: 0.4,
      },
      {
        id: 'international-ops',
        name: 'Operacion en entorno internacional',
        category: 'qualitative',
        yOffset: 500,
        xRatio: 0.7,
        npcId: 'lcs-robotics',
      },
      {
        id: 'typescript',
        name: 'TypeScript',
        category: 'technical',
        yOffset: 750,
        xRatio: 0.5,
      },
    ],
    decorations: [],
  },
  {
    id: 'crmble',
    label: 'Crmble',
    height: 1000,
    skills: [
      {
        id: 'sass',
        name: 'Sass',
        category: 'technical',
        yOffset: 200,
        xRatio: 0.25,
      },
      {
        id: 'bootstrap',
        name: 'Bootstrap',
        category: 'technical',
        yOffset: 400,
        xRatio: 0.75,
      },
      {
        id: 'collaborative-creativity',
        name: 'Collaborative creativity',
        category: 'soft',
        yOffset: 500,
        xRatio: 0.5,
      },
      {
        id: 'design-system',
        name: 'Design system',
        category: 'qualitative',
        yOffset: 600,
        xRatio: 0.4,
        npcId: 'crmble',
      },
      {
        id: 'pixel-perfect',
        name: 'Pixel-perfect implementation',
        category: 'qualitative',
        yOffset: 800,
        xRatio: 0.6,
      },
    ],
    decorations: [],
  },
  {
    id: 'twinny',
    label: 'Twinny',
    height: 1000,
    skills: [
      {
        id: 'angular',
        name: 'Angular',
        category: 'technical',
        yOffset: 200,
        xRatio: 0.3,
      },
      {
        id: 'jira',
        name: 'Jira',
        category: 'technical',
        yOffset: 400,
        xRatio: 0.7,
      },
      {
        id: 'peer-mentoring',
        name: 'Peer mentoring',
        category: 'soft',
        yOffset: 500,
        xRatio: 0.6,
        npcId: 'twinny',
      },
      {
        id: 'swagger',
        name: 'Swagger',
        category: 'technical',
        yOffset: 600,
        xRatio: 0.5,
      },
      {
        id: 'ddd',
        name: 'Domain-Driven Design (DDD)',
        category: 'qualitative',
        yOffset: 800,
        xRatio: 0.4,
      },
    ],
    decorations: [],
  },
  {
    id: 'ride-on',
    label: 'RIDE ON',
    height: 1000,
    skills: [
      {
        id: 'astro',
        name: 'Astro',
        category: 'technical',
        yOffset: 200,
        xRatio: 0.2,
      },
      {
        id: 'vue',
        name: 'Vue',
        category: 'technical',
        yOffset: 400,
        xRatio: 0.8,
      },
      {
        id: 'continuous-learning',
        name: 'Continuous learning',
        category: 'soft',
        yOffset: 500,
        xRatio: 0.45,
      },
      {
        id: 'nodejs',
        name: 'Node.js',
        category: 'technical',
        yOffset: 600,
        xRatio: 0.5,
      },
      {
        id: 'tdd',
        name: 'Test-Driven Development (TDD)',
        category: 'qualitative',
        yOffset: 800,
        xRatio: 0.6,
        npcId: 'ride-on',
      },
    ],
    decorations: [],
  },
] as const;

/* ------------------------------------------------------------------ */
/*  NPCS — external coworker table                                    */
/* ------------------------------------------------------------------ */

export const NPCS: readonly NPCConfig[] = [
  {
    biomeId: 'lcs-robotics',
    name: 'Héctor',
    initial: 'H',
    dialogue: {
      es: '¡Ey Xoje! Bienvenido a bordo. En este entorno internacional de automoción vas a tener que comunicarte con equipos de todo el mundo. ¡La adaptabilidad es clave!',
      en: 'Hey Xoje! Welcome aboard. In this international automotive environment, you will have to communicate with teams from all over the world. Adaptability is key!',
    },
  },
  {
    biomeId: 'crmble',
    name: 'Laura',
    initial: 'L',
    dialogue: {
      es: 'Hola Jose. Diseñé estos componentes píxel-perfect. Vamos a construir juntos un sistema de componentes sólido para que sirva como única fuente de verdad.',
      en: "Hi Jose. I designed these pixel-perfect components. Let's build a solid component system together to serve as our single source of truth.",
    },
  },
  {
    biomeId: 'twinny',
    name: 'Dani',
    initial: 'D',
    dialogue: {
      es: '¡Hola Xoje! Gracias por guiarme con Angular y explicarme los patrones de DDD. Tener un mentor en el equipo hace que aprender sea mucho más fácil.',
      en: 'Hi Xoje! Thanks for guiding me with Angular and explaining DDD patterns. Having a mentor in the team makes learning so much easier.',
    },
  },
  {
    biomeId: 'ride-on',
    name: 'Marcos',
    initial: 'M',
    dialogue: {
      es: 'Qué tal, Xoje. Aquí en RIDE ON la calidad es innegociable. No subas nada sin escribir primero sus tests unitarios. ¡TDD es el camino!',
      en: "Hey Xoje. Here at RIDE ON, quality is non-negotiable. Don't upload anything without writing its unit tests first. TDD is the way!",
    },
  },
] as const;

/* ------------------------------------------------------------------ */
/*  MAP_HEIGHT — derived, not literal                                 */
/* ------------------------------------------------------------------ */

export const MAP_HEIGHT: number = BIOMES.reduce(
  (h, b) => h + b.height,
  0,
);

/* ------------------------------------------------------------------ */
/*  buildCollectibles — spawn-time Y resolver                         */
/* ------------------------------------------------------------------ */

/**
 * Flatten `BIOMES[*].skills` into runtime `CollectibleItem[]`, resolving
 * each authored `yOffset` to an absolute world Y by accumulating the
 * heights of all preceding biomes. Validates two invariants:
 *
 *   - every skill's `yOffset` lies in `[0, owning biome height]`
 *   - every authored `npcId` matches an NPC's `biomeId` (orphan
 *     detection); conversely every NPC must be reachable via some
 *     collectible's `npcId`
 *
 * Returns items in chronological top-to-bottom order. X is initialised
 * to 0; `resize()` maps it to `cssW * xRatio` on first paint.
 */
export function buildCollectibles(
  biomes: readonly BiomeConfig[],
  npcs: readonly NPCConfig[],
): CollectibleItem[] {
  const items: CollectibleItem[] = [];
  let yCursor = 0;
  for (const biome of biomes) {
    for (const skill of biome.skills) {
      if (skill.yOffset < 0 || skill.yOffset > biome.height) {
        throw new Error(
          `[biome-engine] skill ${skill.id} yOffset=${skill.yOffset} outside biome ${biome.id} [0, ${biome.height}]`,
        );
      }
      items.push({
        id: skill.id,
        name: skill.name,
        category: skill.category,
        biome: biome.id,
        x: 0,
        y: yCursor + skill.yOffset,
        radius: 12,
        collected: false,
        npcId: skill.npcId,
      });
    }
    yCursor += biome.height;
  }

  // Orphan check (either direction): every authored npcId must point at
  // a known NPC, and every NPC must be reachable via some collectible.
  const reachableBiomeIds = new Set(items.map((i) => i.npcId).filter(Boolean) as BiomeId[]);
  for (const id of reachableBiomeIds) {
    if (!npcs.some((n) => n.biomeId === id)) {
      throw new Error(`[biome-engine] orphan npcId: ${id} has no NPCConfig`);
    }
  }
  for (const n of npcs) {
    if (!reachableBiomeIds.has(n.biomeId)) {
      throw new Error(`[biome-engine] orphan npcId: NPC ${n.name} (${n.biomeId}) is unreachable from any collectible`);
    }
  }

  return items;
}