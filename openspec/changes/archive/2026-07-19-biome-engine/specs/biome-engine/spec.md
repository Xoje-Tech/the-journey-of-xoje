# Biome Engine Specification

## Purpose

Provide a single, typed authoring surface for the vertical career map: biome
definitions, per-biome skill collectibles, per-biome decorations, an external
NPC table, and a sprite loader. The engine MUST derive `MAP_HEIGHT` from the
configuration so adding, removing, or reordering biomes does not require
editing engine code or test fixtures.

## Requirements

### Requirement: Biome Authoring Surface

The system SHALL export a single `BIOMES: readonly BiomeConfig[]` constant from
`src/modules/game/infrastructure/biome-config.ts`. The array MUST contain
exactly 4 biomes on first ship. The system SHALL additionally export a derived
`MAP_HEIGHT` constant whose value is `BIOMES.reduce((h, b) => h + b.height, 0)`.
No literal numeric value of `MAP_HEIGHT` SHALL exist in engine source files.

#### Scenario: First-ship biome count

- GIVEN the project is at first ship
- WHEN a developer imports `BIOMES`
- THEN `BIOMES.length` MUST equal `4`
- AND each entry MUST have a unique `BiomeId`

#### Scenario: MAP_HEIGHT is derived, not literal

- GIVEN `biome-config.ts` exports `BIOMES`
- WHEN a developer imports `MAP_HEIGHT` from the same module
- THEN `MAP_HEIGHT` MUST equal the sum of every biome's `height`
- AND `grep -rn "MAP_HEIGHT = " src/modules/game/infrastructure/` SHALL NOT
  return any numeric literal equal to the derived value

### Requirement: Biome Identifier Type

The system SHALL define a `BiomeId` type as a closed union of the four biome
identifiers (`lcs-robotics`, `crmble`, `twinny`, `ride-on`). `BiomeId` MUST be
the only valid type for `BiomeConfig.id`, `NPCConfig.biomeId`,
`CollectibleItem.biome`, and `CollectibleItem.npcId`. The system MUST NOT
accept free-form strings or display names in any of those positions.

(Previously: biomes were referenced by free-form strings such as `'LCS
Robotics'` and joined across `init.ts` and `render.ts` by display-name match.)

#### Scenario: TypeScript rejects an unknown biome identifier

- GIVEN a developer authors a `BiomeConfig`
- WHEN the `id` field is set to a string that is not one of the four `BiomeId`
  union members
- THEN `pnpm typecheck` MUST fail with a type error pointing at the bad `id`

#### Scenario: NPC biome linkage is type-safe

- GIVEN an `NPCConfig` is authored
- WHEN its `biomeId` is set to a string that is not one of the four `BiomeId`
  union members
- THEN `pnpm typecheck` MUST fail

### Requirement: Coordinate Resolution

`BiomeConfig.skills[].yOffset` and `BiomeConfig.decorations[].yOffset` SHALL be
authored relative to the start of their owning biome, with values in the
closed interval `[0, biome.height]`. At spawn time the engine MUST convert
every authored `yOffset` to an absolute world Y by adding the cumulative height
of all preceding biomes. Reordering a biome or changing its `height` MUST NOT
invalidate any authored `yOffset`; only downstream biomes' world positions
shift.

(Previously: skills and decorations stored absolute world Y values directly in
`SKILL_TEMPLATES`; reordering biomes required rewriting every entry.)

#### Scenario: Authored yOffset survives biome reorder

- GIVEN a skill authored at `yOffset = 250` inside `lcs-robotics` (height 1000)
- WHEN the biome order in `BIOMES` is reversed
- THEN the same skill's authored `yOffset` MUST remain `250`
- AND the runtime absolute world Y MUST be recomputed as
  `sum(heights of biomes after it) + 250`

#### Scenario: Out-of-range yOffset is rejected at runtime

- GIVEN a developer authors a skill with `yOffset = 1500` inside a biome whose
  `height = 1000`
- WHEN the engine validates biome configuration during initialization
- THEN initialization MUST fail with a clear error naming the offending biome

### Requirement: Decoration Sprite Loader

The system SHALL expose a sprite loader that mirrors the existing skill-sprite
pattern (`import.meta.glob('@/assets/biomes/**/*.png', { eager: true })`) and
mounts at `/src/assets/biomes/{biomeId}/...`. When a `BiomeConfig.decorations`
entry references a sprite that is not present in the loader map, the engine
MUST render a deterministic placeholder in place of the missing sprite and
MUST NOT crash, log a missing-asset warning, or remove the decoration from the
rendering pass.

#### Scenario: All decoration sprites present

- GIVEN `GameViewport.astro` has loaded the decoration sprite map
- WHEN the engine walks `BIOMES[*].decorations`
- THEN every decoration whose sprite path resolves in the map MUST be drawn
  using the loaded image

#### Scenario: Missing decoration sprite falls back gracefully

- GIVEN a `Decoration` references `biomes/lcs/missing.png`
- AND that file is not present in the loaded sprite map
- WHEN the engine renders that biome's decorations
- THEN a placeholder image MUST be drawn at the decoration's coordinates
- AND no exception or missing-asset warning SHALL be surfaced to the console

### Requirement: NPC Config Table

The system SHALL export a separate `NPCS: readonly NPCConfig[]` constant from
the same authoring module. The array MUST contain exactly 4 NPCs on first
ship (Héctor, Laura, Dani, Marcos), each linked to one biome via
`NPCConfig.biomeId`. The engine MUST resolve an NPC from a collectible by
`NPCS.find((n) => n.biomeId === collectible.npcId)`. NPCs MUST NOT be inlined
on `CollectibleItem`; the collectible SHALL carry `npcId?: BiomeId` only.

(Previously: NPCs were inlined on `CollectibleItem` as `npc?: NPCMetadata`
carrying only `{name, initial, dialogue.{es,en}}`; richer NPC metadata (sprite,
portrait) was impossible without a breaking change.)

#### Scenario: First-ship NPC count

- GIVEN the project is at first ship
- WHEN a developer imports `NPCS`
- THEN `NPCS.length` MUST equal `4`
- AND entries MUST be Héctor (`lcs-robotics`), Laura (`crmble`),
  Dani (`twinny`), Marcos (`ride-on`)

#### Scenario: Collectible resolves its NPC via lookup

- GIVEN a `CollectibleItem` with `npcId = 'ride-on'`
- WHEN the dialog overlay needs the NPC's data
- THEN the engine MUST look up `NPCS.find((n) => n.biomeId === 'ride-on')`
- AND the returned NPC's localized dialogue MUST populate the overlay

#### Scenario: Orphan npcId fails fast

- GIVEN a `CollectibleItem.npcId` whose value does not match any
  `NPCConfig.biomeId`
- WHEN the engine validates collectibles at initialization
- THEN initialization MUST fail with a clear error naming the orphan `npcId`

### Requirement: Backwards Compatibility Guard

The system SHALL preserve the contract that the journey-progression tests
assert: exactly 19 collectible skills distributed 4 / 5 / 5 / 5 across the
four biomes in top-to-bottom order. These numbers MUST be derivable from
`BIOMES.flatMap((b) => b.skills).length` and the per-biome skill counts; they
MUST NOT be re-asserted against display-name strings or hardcoded numeric
literals in the engine.

#### Scenario: Engine produces 19 / 4-5-5-5

- GIVEN the authoritative `BIOMES` table is imported at initialization
- WHEN the engine constructs the collectibles array via
  `BIOMES.flatMap((b) => b.skills)`
- THEN the resulting array length MUST be `19`
- AND the per-biome counts in biome order MUST be `4`, `5`, `5`, `5`

#### Scenario: Test fixtures anchor to identifiers, not display strings

- GIVEN `tests/game-journey-progression.test.ts` is executed
- WHEN it asserts biome counts
- THEN the assertions MUST reference the `BiomeId` union members, not display
  names such as `"LCS Robotics"`
- AND a renamed display label MUST NOT break the test suite