# Proposal: Biome Engine

## Intent

Biome metadata is duplicated across `init.ts` (4 string constants + 19-entry `SKILL_TEMPLATES`) and `render.ts` (parallel `biomes` array + magic `3900` CTA). Join key is fragile string matching; `MAP_HEIGHT = 4000` is re-declared twice. New biomes or decorations require editing both files. Consolidates authoring into a typed module.

## Scope

### In Scope
- New `infrastructure/biome-config.ts` with `BIOMES: readonly BiomeConfig[]` (4 biomes).
- Types `BiomeId`, `BiomeConfig`, `Decoration`, `NPCConfig` in `domain/types.ts`.
- Migrate 19 skills + 4 NPCs; 4/5/5/5 preserved.
- Decorations per biome, `yOffset ∈ [0, biome.height]`; engine resolves absolute Y at spawn.
- `npc?: NPCMetadata` → `npcId?: BiomeId`; separate `NPCConfig[]` table.
- `MAP_HEIGHT` derived: `BIOMES.reduce((h, b) => h + b.height, 0)`. Delete `init.ts:74`/`render.ts:169` literals.
- `GameViewport.astro` adds `import.meta.glob('@/assets/biomes/**/*.png', { eager: true })`.
- Port `lcs-building.png` → `biomes/lcs/lcs-building.png`; attach as `decorations[0]` on `lcs-robotics`.
- `videogame-ui-game` capability unchanged.

### Out of Scope
Skill sprite migration. New biomes beyond the 4. Dialog rewrites.

## Capabilities

### New Capabilities
- `biome-engine`: typed config module, derived `MAP_HEIGHT`, per-biome decorations, NPC table, sprite loader.

### Modified Capabilities
- `journey-progression`: biome identifiers → typed `BiomeId`; NPC metadata moves to `NPCConfig[]` table. 4/5/5/5 + 19-skill contract preserved.

## Approach

Single PR. Author `biome-config.ts` first. `SKILL_TEMPLATES` → `BIOMES.flatMap(b => b.skills)`; pre-spawn resolves `yOffset` → absolute Y. `drawBiomes` consumes config. NPC: `item.npc` → `NPCS.find(n => n.biomeId === item.npcId)`. `MAP_HEIGHT` re-exported as derived const. Tests re-assert over `BIOMES`; `tsc` catches typos. Decision (orchestrator-resolved): NPC rename, `yOffset` decorations, typed-TS, derived `MAP_HEIGHT`.

## Affected Areas

- `domain/types.ts` — add `BiomeId`/`BiomeConfig`/`Decoration`/`NPCConfig`; re-export derived `MAP_HEIGHT`.
- `infrastructure/biome-config.ts` — **NEW**, authoritative surface.
- `init.ts` — delete `SKILL_TEMPLATES` (76-273) + `MAP_HEIGHT` (74); rebuild from `BIOMES`.
- `render.ts` — delete hardcoded `biomes` (153-158) + magic `3900` (271).
- `GameViewport.astro` — second `import.meta.glob` for `biomes/**/*.png`.
- `assets/biomes/lcs/lcs-building.png` — **NEW**, ported from `src/assets/lcs-building.png`.

## Risks

- Test rewrite drift (Med): anchor assertions to identifier.
- NPC decoupling (Med): unit-test the lookup.
- `MAP_HEIGHT` consumers (Low): const re-export.
- Asset migration (Low): `biomes/lcs/`; document in tasks.
- Render ordering (Low): codified in `drawBiomes`.

## Rollback Plan

Revert the PR. `init.ts`/`render.ts` restore `SKILL_TEMPLATES` + hardcoded `biomes`. `biome-config.ts` and `biomes/lcs/` are additive deletes. Spec delta unpromoted by `sdd-archive`; engine keeps the pre-change string-literal path.

## Dependencies

- Cherry-pick or regenerate `lcs-building.png` under `biomes/lcs/` before merge.
- `tsc` must pass; typed `BiomeId` is the structural enforcement layer.

## Success Criteria

- [ ] `pnpm typecheck` + `pnpm test` green; 19 skills, 4/5/5/5.
- [ ] `grep SKILL_TEMPLATES\|BIOME_LCS_ROBOTICS init.ts` returns zero.
- [ ] `MAP_HEIGHT = 4000` removed from `init.ts:74`/`render.ts:169`.
- [ ] LCS building renders in `lcs-robotics` at `yOffset = 100`.
- [ ] NPC dialogue opens via `npcId` lookup, identical text.
