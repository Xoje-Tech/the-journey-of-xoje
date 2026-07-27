# Tasks: Biome Engine

Single PR; tightly coupled config, engine, asset, and test changes cannot land safely as independent slices. Apply TDD per cluster: RED, GREEN, REFACTOR.

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium
Estimated changed lines: ~400–500
Delivery strategy: ask-on-risk; ask before accepting `size:exception`.

## Phase 1: Foundation — Types + Config Module

- [x] 1.1 RED: Create `tests/biome-config.test.ts` contract cases for counts, derived height, offset bounds, orphan `npcId`, and NPC lookup.
- [x] 1.2 GREEN: In `src/modules/game/domain/types.ts`, add closed `BiomeId`, `SkillTemplate`, `BiomeConfig`, `Decoration`, and `NPCConfig`; change collectible `biome`/`npcId` to `BiomeId` and remove obsolete inline NPC metadata if unused.
- [x] 1.3 GREEN: Create `src/modules/game/infrastructure/biome-config.ts` exporting typed `BIOMES`, `NPCS`, `MAP_HEIGHT`, and `buildCollectibles(BIOMES, NPCS)`; migrate 4/5/5/5 skills and four NPCs.
- [x] 1.4 REFACTOR: Resolve skill/decor `yOffset` to absolute Y, reject values outside `[0, biome.height]`, reject every referenced orphan `npcId`, and keep authoring arrays readonly.

## Phase 2: Engine Wiring — `init.ts` + `render.ts`

- [x] 2.1 RED: Add/update engine expectations for config-driven spawning, typed NPC lookup, decoration fallback, and CTA placement.
- [x] 2.2 GREEN: In `init.ts`, delete `SKILL_TEMPLATES` (76–273), `BIOME_*`, and numeric `MAP_HEIGHT`; replace collectibles construction with `buildCollectibles(BIOMES, NPCS)`, update `resize()` to read config `xRatio`, accept `InitOptions.decorationSpritePaths`, and resolve dialog NPCs via `NPCS.find`.
- [x] 2.3 GREEN: In `render.ts`, delete the hardcoded biome array and `ctaY = 3900`; make `drawBiomes` consume config plus sprite map, draw deterministic placeholders for missing sprites, resolve NPCs with `NPCS.find`, and place CTA at `MAP_HEIGHT - 100`.
- [x] 2.4 REFACTOR: Preserve draw ordering (grid, decorations, collectibles) and remove all display-string joins.

## Phase 3: Asset Wiring — Cherry-pick + `GameViewport`

- [x] 3.1 RED: Add the integration/visual expectation that the LCS decoration appears at `yOffset: 100` in `lcs-robotics`.
- [x] 3.2 GREEN: Cherry-pick `src/assets/lcs-building.png` from `origin/feat/lcs-robotics-building` into `src/assets/biomes/lcs/lcs-building.png`; add the eager `@/assets/biomes/**/*.png` glob in `GameViewport.astro`, pass `decorationSpritePaths` to `init()`, and attach the decoration in `BIOMES`.
- [x] 3.3 REFACTOR: Normalize sprite keys/paths to the glob contract without changing skill asset loading.

## Phase 4: Tests

- [x] 4.1 RED/GREEN: Complete `tests/biome-config.test.ts`: assert 4 biomes, 4 NPCs, 19 skills, `[4,5,5,5]`, `MAP_HEIGHT === 4000`, bounds/orphan rejection, and `NPCS.find` resolution for every NPC.
- [x] 4.2 GREEN: Rewrite `tests/game-journey-progression.test.ts` lines 14–27 around `BiomeId` literals, preserving chronological order and counts; update `tests/game-render.test.ts` fixture to `npcId: 'lcs-robotics'` plus `NPCS.find`.
- [x] 4.3 REFACTOR: Remove stale `SKILL_TEMPLATES`, display-name, and inline-NPC test references; keep fixtures config-derived.

## Phase 5: Cleanup + Verify

- [x] 5.1 VERIFY: Run `pnpm typecheck`, `pnpm test`, and `pnpm build`; all must pass.
- [x] 5.2 VERIFY: Confirm `grep -rn "MAP_HEIGHT = " src/modules/game/infrastructure/` has zero numeric literals and `grep -rn "SKILL_TEMPLATES\|BIOME_LCS_ROBOTICS" src/modules/game/infrastructure/init.ts` has zero matches.
- [x] 5.3 VERIFY: Verify the built GameViewport bundle includes the LCS decoration wiring; visual Playwright confirmation is deferred because no Playwright runner is configured in this repository.
