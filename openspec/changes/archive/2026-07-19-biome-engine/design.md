# Biome Engine — Technical Design

## Technical Approach

Replace three disjoint authoring surfaces (`init.ts` `BIOME_*` + `SKILL_TEMPLATES`, `render.ts` hardcoded `biomes`, magic `3900`) with a typed module `infrastructure/biome-config.ts` exporting `BIOMES` + `NPCS`. The engine resolves per-biome `yOffset` → absolute world Y at spawn, looks up NPCs by id, derives `MAP_HEIGHT = BIOMES.reduce((h,b)=>h+b.height,0)`, and loads decorations via a parallel `import.meta.glob`. Single PR; no feature flag.

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|---|---|---|---|
| Module placement | `infrastructure/biome-config.ts` | `domain/` | Authoring config, not domain rule; mirrors `init.ts` (engine) vs `types.ts` (shapes). |
| `BiomeId` typing | Closed literal union | Branded string | Greppable; `tsc` rejects drift; spec scenario requires literal-union test. |
| Coordinate resolution | Spawn-time (`CollectibleItem.y`) | Render-time accumulation | Physics (`clampPlayerY`, camera) consumes one absolute Y; `isWithinViewport` is flat. |
| NPC lookup | `NPCS.find(n => n.biomeId === item.npcId)` | `Map<BiomeId, NPCConfig>` | 4 entries; linear scan negligible; no mutable global. |
| Decoration loader | Second `import.meta.glob('@/assets/biomes/**/*.png', { eager: true })` in `GameViewport.astro` | Extend skill loader | Mirrors lines 14-19; skill/decoration concerns separate. |
| Test rewrite anchor | `BiomeId` literals | Display strings | Spec requires identifier-not-display; `tsc` catches typo'd refactor. |
| `lcs-building.png` source | Cherry-pick `feat/lcs-robotics-building` → `src/assets/biomes/lcs/lcs-building.png` | Regenerate | Deterministic LibreSprite artefact; provenance preserved. |

## Data Flow

```
BIOMES / NPCS  (biome-config.ts)
      │ import
      ▼
GameViewport.astro (skill glob lines 14-19 + new glob for biomes/**)
      │ skillSpritePaths + decorationSpritePaths via InitOptions
      ▼
init(canvas, opts)
   ├─ buildCollectibles(BIOMES, NPCS)        ◄ spawn-time Y resolver
   ├─ validate yOffset ∈ [0, b.height]
   ├─ validate every npcId referenced
   └─ re-export MAP_HEIGHT (derived)

RAF loop:
   drawBiomes(ctx, w, BIOMES, …, imgMap)       ◄ labels + decorations
   drawCollectibles(ctx, items, …, NPCS)        ◄ NPC yellow via NPCS.find
   drawBottomCTA(ctx, …, MAP_HEIGHT-100)         ◄ replaces magic 3900
```

## File Changes

- `domain/types.ts` — Add `BiomeId`, `SkillTemplate`, `BiomeConfig`, `Decoration`, `NPCConfig`. Drop `NPCMetadata` if unused (grep).
- `infrastructure/biome-config.ts` — **NEW**. Exports `BIOMES`, `NPCS`, `MAP_HEIGHT`.
- `infrastructure/init.ts` — Delete lines 74, 76-273, 357-367. Replace with `buildCollectibles(BIOMES, NPCS)`. Collision branch (762-769) uses `NPCS.find`.
- `infrastructure/render.ts` — Delete `biomes` array (153-158) + magic `3900` (271). `drawBiomes(ctx, w, BIOMES, …, imgMap)` walks config. CTA consumes `MAP_HEIGHT-100`.
- `GameViewport.astro` — Add `import.meta.glob('@/assets/biomes/**/*.png')` → `decorationSpritePaths`.
- `assets/biomes/lcs/lcs-building.png` — **NEW**, cherry-pick.
- `tests/game-journey-progression.test.ts` — Replace `SKILL_TEMPLATES` (lines 10, 14-27) with `BIOMES`-derived counts; assert on `BiomeId` literals.
- `tests/game-render.test.ts` — NPC fixture swaps `npc:` → `npcId: 'lcs-robotics'` + `NPCS.find(...)`; draw-call sequence preserved.

## Interfaces

```ts
export type BiomeId = 'lcs-robotics' | 'crmble' | 'twinny' | 'ride-on';

export interface SkillTemplate {
  id: string;
  name: string;
  category: 'technical' | 'qualitative' | 'soft';
  yOffset: number;     // 0 ≤ yOffset ≤ biome.height
  xRatio: number;      // 0..1 of CSS width
  npcId?: BiomeId;
}

export interface Decoration {
  sprite: string;      // 'biomes/lcs/lcs-building.png'
  yOffset: number;
  xRatio: number;
  scale?: number;
}

export interface BiomeConfig {
  id: BiomeId;
  label: string;
  height: number;
  background?: string;
  skills: SkillTemplate[];
  decorations: Decoration[];
}

export interface NPCConfig {
  biomeId: BiomeId;
  name: string;
  initial: string;
  dialogue: { es: string; en: string };
}

// Spawn-time resolver — single pass, yCursor accumulates biome heights.
export function buildCollectibles(
  biomes: readonly BiomeConfig[],
  npcs: readonly NPCConfig[],
): CollectibleItem[] {
  const items: CollectibleItem[] = [];
  let y = 0;
  for (const b of biomes) {
    for (const s of b.skills) {
      if (s.yOffset < 0 || s.yOffset > b.height) {
        throw new Error(`[biome-engine] skill ${s.id} yOffset=${s.yOffset} outside ${b.id}`);
      }
      items.push({
        id: s.id, name: s.name, category: s.category,
        biome: b.id, x: 0, y: y + s.yOffset,
        radius: 12, collected: false, npcId: s.npcId,
      });
    }
    y += b.height;
  }
  if (npcs.some(n => !items.some(i => i.npcId === n.biomeId))) {
    throw new Error('[biome-engine] orphan npcId');
  }
  return items;
}

export const MAP_HEIGHT = BIOMES.reduce((h, b) => h + b.height, 0);
```

## Testing Strategy

**Unit (`biome-config.test.ts`, NEW)**: `BIOMES.length === 4`; `flatMap(b => b.skills).length === 19` with per-biome `[4,5,5,5]`; `MAP_HEIGHT === 4000`; `NPCS.length === 4`; `buildCollectibles` rejects out-of-range `yOffset` and orphan `npcId`; `NPCS.find(n => n.biomeId === item.npcId)` resolves each. **Integration**: rewrite `game-journey-progression.test.ts` lines 14-27 to import from `biome-config`, assert on `BiomeId` literals, not `'LCS Robotics'` etc.; y-ordering anchors to authored source order. `game-render.test.ts` NPC fixture swaps `npc:` → `npcId: 'lcs-robotics'`; draw-call sequence preserved. **Visual**: confirm `lcs-building.png` renders at `yOffset: 100` in `lcs-robotics` via Playwright headless screenshot.

## Threat Matrix

N/A — no routing, shell, subprocess, VCS automation, or process-integration boundary. Pure typed-TS refactor + canvas draw helpers.

## Migration / Rollout

Single PR; no feature flag; no data migration; 19 skills + 4 NPCs move verbatim with `y` → `yOffset = y − yStart_biome`. Test rewrites are mechanical: `'LCS Robotics'` → `'lcs-robotics'`. Revert = `git revert`.

## Open Questions

None — the four pre-resolved decisions fully constrain scope; the spec delta (`4/5/5/5`, 19-skill, `npcId?: BiomeId`) is preserved verbatim. Operational flag for tasks: confirm cherry-pick SHA on `feat/lcs-robotics-building` before merge.
