## Exploration: Biome Engine (declarative, config-driven)

### Current State

Biome metadata is hardcoded in three separate files with no shared definition:

1. **`src/modules/game/infrastructure/init.ts`** (lines 74-273): owns `MAP_HEIGHT = 4000`, four `BIOME_*` string constants, and the 19-entry `SKILL_TEMPLATES` array. NPCs are inlined as an optional `npc?` field (Héctor, Laura, Dani, Marcos) carrying only `{name, initial, dialogue.{es,en}}`. The `collectibles` array is built from `SKILL_TEMPLATES.map(...)` at line 357.

2. **`src/modules/game/infrastructure/render.ts`** (lines 147-185): owns a parallel hardcoded `biomes` array inside `drawBiomes` (`LCS 0-1000`, `Crmble 1000-2000`, `Twinny 2000-3000`, `RIDE ON 3000-4000`); magic `4000` reappears at line 169. `drawBottomCTA` (line 271) hardcodes `ctaY = 3900`.

3. The biome strings are the only join key between `init.ts` and `render.ts` — two independent lists that must stay in sync manually. NPC yellow-circle rendering is inside `drawCollectibles` (lines 209-230), tightly coupled to the `npc?` branch.

**Decorative sprite asset already exists**: `src/assets/lcs-building.png` (444 B, LibreSprite procedural output from `scripts/generate-lcs-building.js` on `feat/lcs-robotics-building`, **not yet merged into `develop`**). Current `init.ts`/`render.ts` does not load or render it. Skill-sprite loading pattern at `GameViewport.astro` lines 14-19 uses `import.meta.glob('@/assets/skills/*.png', { eager: true })` to map filenames → `value.default.src`.

**Coordinates**: skills store absolute world `y` values (250, 1200, 3500...). Each biome occupies a fixed 1000-px slab. **No prior `BiomeConfig` interface exists** — grep returned zero hits.

**Tests** (`tests/game-journey-progression.test.ts` lines 14-27) hardcode **19** plus per-biome counts **4/5/5/5** and `y`-ascending order, reading `SKILL_TEMPLATES` directly.

### Affected Areas

- `src/modules/game/domain/types.ts` — Add `BiomeId`, `BiomeConfig`, `Decoration`, `NPCConfig`. `MAP_HEIGHT` likely moves here as a derived constant.
- `src/modules/game/infrastructure/init.ts` — Delete lines 76-273 + the `MAP_HEIGHT = 4000` literal at line 74. Replace collectibles construction (lines 357-367) with `BIOMES.flatMap((b) => b.skills)`. Update `resize()` (lines 454-459) to read `xRatio` from the new structure.
- `src/modules/game/infrastructure/render.ts` — Delete hardcoded `biomes` array (lines 153-158); accept `biomes: BiomeConfig[]` + `decorations: Decoration[]` + a decoration-sprite map. `drawBottomCTA` uses last biome's `yEnd` instead of literal `3900`.
- `src/modules/game/interface/components/organisms/GameViewport.astro` — Add second `import.meta.glob('@/assets/biomes/**/*.png', { eager: true })`; pass decoration sprites into `init()`.
- **NEW** `src/modules/game/infrastructure/biome-config.ts` — Authoritative `BIOMES: readonly BiomeConfig[]`.
- `openspec/specs/journey-progression/spec.md` — **MODIFIED** (biome identifiers switch from string-literal to typed `BiomeId`; 4-5-5-5 contract preserved verbatim).

### Approaches

#### 1. Authoring format

| Option | Pros | Cons | Effort |
|---|---|---|---|
| **A. Typed TS module** | Compile-time safety; refactors flow through `BiomeId`; no parser. | Requires TS to edit a biome. | **Low** |
| B. JSON via dynamic import | Runtime flexibility; non-TS authors. | Loses type safety; needs Zod/JSON-Schema; extra validation step. | Med |
| C. Astro 6 content collections | First-class TS schema. | Adds Astro coupling for non-content config. | High |

#### 2. NPC coupling

| Option | Pros | Cons | Effort |
|---|---|---|---|
| **A. Separate `NPCConfig`, addressed by id** | Cleaner metadata (sprite, portrait); NPCs can exist without skills; first-class authoring. | Small refactor `npc? → npcId?` + lookup table. | **Low-Med** |
| B. Keep inline `npc?` on skill | Zero refactor. | Couples NPC availability to skill collection; harder to extend. | Low |

#### 3. Coordinate model

| Option | Pros | Cons | Effort |
|---|---|---|---|
| **A. Per-biome `yOffset ∈ [0, biome.height]`, absolute world Y derived at spawn** | Reordering/inserting a biome only shifts subsequent offsets. | Requires one-line conversion at spawn. | **Low** |
| B. Keep absolute `y`, derive biome y-slabs from `sum(prev heights)` | Smaller diff to current `SKILL_TEMPLATES`. | Every `y` invalidated by reorder; defeats authoring benefit. | Low |
| C. Per-biome authoring + derived absolute runtime value | Best of both. | Minor loader complexity. | Low |

#### 4. Decoration loading

Mirror `GameViewport.astro` lines 14-19: `import.meta.glob('@/assets/biomes/**/*.png', { eager: true })`. Pass through `InitOptions.decorationSpritePaths`. `init()` pre-loads into `decorationImages`. `drawBiomes` walks each biome's `decorations` and `ctx.drawImage` when in viewport. **Effort: Low**, falls inside the existing pattern.

### Recommendation

Adopt **Option 1-A (typed TS module) + Option 2-A (separate `NPCConfig`) + Option 3-C (`yOffset` per biome with derived absolute world Y at spawn)** plus the **mirrored decoration loader** (Option 4).

The single new file `src/modules/game/infrastructure/biome-config.ts` becomes the authoritative authoring surface. The four existing biomes migrate 1:1, preserving y-ascending order. `MAP_HEIGHT` becomes a derived `const MAP_HEIGHT = BIOMES.reduce((h, b) => h + b.height, 0)`. `drawBiomes`/`drawBottomCTA` consume the config. NPCs get richer `NPCConfig` (Héctor/Laura/Dani/Marcos dialogue preserved) decoupled from skill collection; transitional slice keeps `npcId?: string` on `CollectibleItem` so the rest of the engine doesn't need to change immediately.

For LCS Robotics as the PoC target: add a `decorations: [{ sprite: 'lcs/lcs-building.png', y: 100, xRatio: 0.5, … }]` entry, port the existing `src/assets/lcs-building.png` to `src/assets/biomes/lcs/`, keep Héctor as the NPC-linked skill (`international-ops`).

### Open Questions for Orchestrator (decision needed before sdd-propose)

- **`npcId` rename vs keep `npc?`**: rename to a typed NPC identifier in this slice (cleaner, larger diff) or carry an `NPCConfig[]` lookup table while leaving `CollectibleItem.npc?: NPCMetadata` untouched (smaller diff, but the spec change becomes cosmetic only)?
- **Decoration coordinates**: world Y vs per-biome `yOffset`? Brief is silent.

### Risks

- **Test rewrite**: `game-journey-progression.test.ts` lines 14-27 hardcode `19`, `4/5/5/5`, and biome display-name strings. Assertions must be re-expressed in terms of the typed identifier; a typo'd refactor (`'lcs-robotics'` vs `'lcs robotics'`) would fail `tsc` without breaking runtime.
- **`MAP_HEIGHT` consumers**: `clampPlayerY` and `camera.y` (lines 729, 740) use it. If `MAP_HEIGHT` becomes config-derived, vitest's static import still works as a `const`.
- **Spec drift**: `openspec/specs/journey-progression/spec.md` lines 18-21 hardcode the display name `"LCS Robotics"`. The display label is now config-driven; the identifier is `lcs-robotics`. The 4-5-5-5 contract stays — but the wording needs an explicit `MODIFIED Requirements` block (not ADDED).
- **NPC decoupling regression**: dialog-overlay activation is keyed off `item.npc` in `init.ts:762`. Moving to `npcId` adds a lookup step; the dialog-store payload must use the NPC name. `dialog-dismissed → collected` (line 309) is keyed by `skillId` already and stays intact.
- **Asset path migration**: moving `src/assets/lcs-building.png` (flat, on `feat/lcs-robotics-building`) to `src/assets/biomes/lcs/lcs-building.png` requires a path decision; document it in tasks to avoid a merge-conflict surprise.
- **Rendering order**: decoration `y` needs a layer relationship to `drawCollectibles`. The proposal should confirm decorations are drawn under collectibles but above the grid.

### Ready for Proposal

Yes — provided the orchestrator resolves the two **Open Questions** above (NPC rename scope + decoration coordinate model). The investigation confirms no prior `BiomeConfig` exists; the migration is a clean refactor of `init.ts` lines 76-273 + `render.ts` lines 153-185 into a typed `biome-config.ts` module, plus a one-time spec delta to switch identifier type from string-literal to `BiomeId`. Test rewrites are mechanical. The LCS Robotics PoC (sprite + Héctor) is self-contained inside the new authoring surface and can be the first biome authored under it.
