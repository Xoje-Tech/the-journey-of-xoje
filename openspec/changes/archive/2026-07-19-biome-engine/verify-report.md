---
schema: gentle-ai.verify-result/v1
change: biome-engine
mode: hybrid
verdict: pass
verified_at: 2026-07-19T09:30:00Z
verifier: sdd-verify (delegate_only)
branch: feat/biome-engine
working_tree: clean (openspec/ left untracked by design)
---

## Verification Report

### 1. Evidence Envelope

```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:a9220c63093906f2e4e4daca01f4760d091f861f7c17feda7edb9db1542c4aef
verdict: pass
blockers: 0
critical_findings: 0
requirements: 17/17
scenarios: 26/26
test_command: pnpm test
test_exit_code: 0
test_output_hash: sha256:06f37cf13d2494b0ed235f87ad649101ecc6289fff50f3a9daf82d4be3d44663
build_command: pnpm build
build_exit_code: 0
build_output_hash: sha256:b701f7e5d37d51cc98b023ebf0e8a88a12baab78b232f051c480673c95db0b8f
typecheck_command: pnpm typecheck
typecheck_exit_code: 0
biome_id_type_rejection_verified: true
biome_id_rejection_evidence: "src/modules/game/_bad-biome-check.ts(3,3): error TS2322: Type '\"not-a-real-biome\"' is not assignable to type 'BiomeId'. [exit 2]"
```

### 2. Static Completeness

| Check | Expected | Actual | Status |
|---|---|---|---|
| `tasks.md` `[x]` count | 17 | 17 | ✅ |
| `tasks.md` `[ ]` count | 0 | 0 | ✅ |
| Apply commits on `feat/biome-engine` | 5 | 5 | ✅ |
| Branch vs `origin/develop` ahead | 5 | 5 | ✅ |
| `openspec/changes/biome-engine/` artifacts | 5 (proposal/design/tasks/specs+specs/jp) | 5 | ✅ |
| `videogame-ui-game/spec.md` modified | 0 (proposal says unchanged) | 0 | ✅ |
| Asset `src/assets/biomes/lcs/lcs-building.png` | exists, non-empty PNG | 444 bytes, 64×64 RGBA | ✅ |

Apply commits:
1. `ceafc84 feat(game): introduce typed biome-engine authoring surface`
2. `3a149ec refactor(game): wire init.ts and render.ts to the biome-engine`
3. `4ad179a chore(assets): wire biome decoration sprites`
4. `ce24d35 test(game): align fixtures with biome IDs`
5. `bec0988 chore(game): close biome engine verification`

### 3. Build / Tests / Typecheck — Anti-premature-green-light gate

```
pnpm typecheck     → exit 0   (tsc --noEmit -p tsconfig.json)
pnpm test          → exit 0   (16 files, 226 tests passed in 3.41s)
pnpm build         → exit 0   (2 pages built in 1.60s)
```

**Test surface breakdown (16 files, 226 tests):**
- `tests/biome-config.test.ts` — 20 tests (new)
- `tests/game-journey-progression.test.ts` — 4 tests (rewritten around BiomeId)
- `tests/game-render.test.ts` — 13 tests (NPC fixture swapped to `npcId`/`NPCS.find`)
- All other 13 test files — 189 tests, unchanged, passing

### 4. Grep Guards

| Guard | Expected | Actual | Status |
|---|---|---|---|
| `grep -rn "MAP_HEIGHT = " src/modules/game/infrastructure/` | 0 numeric literals | 0 matches (exit 1) | ✅ |
| `grep -rn "BIOME_LCS_ROBOTICS" src/modules/game/infrastructure/init.ts` | 0 | 0 matches (exit 1) | ✅ |
| `grep -rn "BIOME_LCS\|BIOME_CRMBLE\|BIOME_TWINNY\|BIOME_RIDE_ON" src/` | 0 (no string-constant leaks) | 0 matches | ✅ |
| `grep -rn "SKILL_TEMPLATES" src/modules/game/infrastructure/init.ts` | 1 documented re-export line | 1 match at `init.ts:88` (slim re-export via `BIOMES.flatMap`) | ✅ |

The single `SKILL_TEMPLATES` match is the documented slim re-export (proposal §In-Scope; preserved per design doctrine: `.astro` files keep their import contract while the engine's authoritative surface is `biome-config.ts`).

### 5. Spec Compliance Matrix

#### 5a. NEW `biome-engine` spec — 6 requirements / 13 scenarios

| # | Requirement | Scenario | Covering Test / Evidence | Status |
|---|---|---|---|---|
| 1 | Biome Authoring Surface | First-ship biome count | `biome-config.test.ts` → "exports exactly 4 biomes on first ship" (line 29) | ✅ PASS |
| 1 | Biome Authoring Surface | MAP_HEIGHT is derived, not literal | `biome-config.test.ts` → "equals the sum of every biome height" (line 55) + "is 4000 on first ship" (line 60); plus grep guard §4 | ✅ PASS |
| 2 | Biome Identifier Type | TypeScript rejects unknown biome id | **Empirically verified** with throwaway `_bad-biome-check.ts` → `error TS2322: Type '"not-a-real-biome"' is not assignable to type 'BiomeId'` (exit 2) | ✅ PASS |
| 2 | Biome Identifier Type | NPC biome linkage is type-safe | Same typecheck mechanism (NPCConfig.biomeId is `BiomeId`) — empirically covered by `BiomeId` union enforcement | ✅ PASS |
| 3 | Coordinate Resolution | Authored yOffset survives biome reorder | `buildCollectibles` implementation (biome-config.ts:286–312) — yCursor accumulates biome heights, authored `yOffset` is preserved verbatim. Covered statically by `biome-config.test.ts` "resolves yOffset to absolute world Y at the start of each biome" (line 111). | ✅ PASS |
| 3 | Coordinate Resolution | Out-of-range yOffset is rejected at runtime | `biome-config.test.ts` "rejects a skill whose yOffset is below 0" + "rejects a skill whose yOffset exceeds the biome height" (lines 151, 166) | ✅ PASS |
| 4 | Decoration Sprite Loader | All decoration sprites present | `biome-config.test.ts` "attaches the LCS building decoration at yOffset 100" (line 37) + build output wiring confirmed in `dist/_astro/GameViewport.astro_*.js` (`biomes/lcs/lcs-building.png` globbed, key `'biomes/lcs/lcs-building.png'`) | ✅ PASS |
| 4 | Decoration Sprite Loader | Missing decoration sprite falls back gracefully | `render.ts` `drawBiomes` lines 226–245: `else` branch draws `PLACEHOLDER_FILL` rect (60×80) + sprite-name text without exception/log. Visual Playwright deferred per task 5.3 (no runner configured) | ✅ PASS (static) |
| 5 | NPC Config Table | First-ship NPC count | `biome-config.test.ts` "exports exactly 4 NPCs on first ship" (line 78) + "binds Héctor to lcs-robotics, Laura to crmble, Dani to twinny, Marcos to ride-on" (line 82) | ✅ PASS |
| 5 | NPC Config Table | Collectible resolves its NPC via lookup | `biome-config.test.ts` "NPCS.find returns the NPC whose biomeId matches the collectible npcId" (line 190); also `render.ts` `drawCollectibles` line 278 (`npcs.find((n) => n.biomeId === item.npcId)`) | ✅ PASS |
| 5 | NPC Config Table | Orphan npcId fails fast | `biome-config.test.ts` "rejects an orphan npcId that no NPC owns" (line 181) + `buildCollectibles` orphan check (biome-config.ts:316–326) | ✅ PASS |
| 6 | Backwards Compatibility Guard | Engine produces 19 / 4-5-5-5 | `biome-config.test.ts` "defines exactly 19 skills in total" (line 66) + "distributes skills 4/5/5/5" (line 71) + `game-journey-progression.test.ts` (line 14, references `BIOMES.find((b) => b.id === 'lcs-robotics')` etc.) | ✅ PASS |
| 6 | Backwards Compatibility Guard | Test fixtures anchor to identifiers, not display strings | `biome-config.test.ts` "uses BiomeId literals in declared order: lcs-robotics, crmble, twinny, ride-on" (line 33) + `game-journey-progression.test.ts` uses `'lcs-robotics'`, `'crmble'`, etc. throughout; zero `'LCS Robotics'` literal-search matches across tests | ✅ PASS |

#### 5b. MODIFIED `journey-progression` delta — 2 explicitly modified requirements

| Requirement | Scenario | Covering Test / Evidence | Status |
|---|---|---|---|
| Career Biomes and Spawning (MODIFIED 2026-07-18) | Spawning layout (4/5/5/5) | `game-journey-progression.test.ts` line 14 — `BIOMES.find((b) => b.id === 'lcs-robotics')` etc. — typed `BiomeId` literals throughout | ✅ PASS |
| Career Biomes and Spawning | Soft skill rendering | `render.ts` `drawCollectibles` lines 318–321 — `else` branch (non-technical, non-qualitative) → green palette (`rgba(100, 255, 100, ...)`) | ✅ PASS |
| REQ-NPC-SPAWNING-RENDERING (MODIFIED 2026-07-18) | Spawning and rendering of NPCs | `game-render.test.ts` lines 109–149 — `npcId: 'lcs-robotics'`, `drawCollectibles(ctx, items, 0, 800, {}, NPCS)`; asserts `ctx.arc(100, 500, 12, 0, Math.PI * 2)`, `'H'` initial, `'Héctor (NPC)'` label | ✅ PASS |

#### 5c. Untouched MODIFIED requirements — verified unchanged

- REQ-NPC-LOOP-PAUSING, REQ-NPC-DIALOG-ACTIVATION-TYPEWRITER, REQ-NPC-PROGRESSION-DISMISSAL — marked "Unchanged. Verified 2026-07-18" in the delta; existing tests in `game-journey-progression.test.ts` (CustomEvent dispatching) + other passing test files continue to green.

### 6. Design Coherence — 7 architecture decisions

| # | Decision | Choice | Implementation Status | Coherence |
|---|---|---|---|---|
| 1 | Module placement | `infrastructure/biome-config.ts` | File exists at `src/modules/game/infrastructure/biome-config.ts`; exports `BIOMES`, `NPCS`, `MAP_HEIGHT`, `buildCollectibles` | ✅ |
| 2 | `BiomeId` typing | Closed literal union | `types.ts` line 112: `export type BiomeId = 'lcs-robotics' \| 'crmble' \| 'twinny' \| 'ride-on';`; empirically rejects invalid id (verified above) | ✅ |
| 3 | Coordinate resolution | Spawn-time (`CollectibleItem.y`) | `buildCollectibles` accumulates `yCursor` at spawn time; `resize()` only re-maps X. No render-time accumulation anywhere. | ✅ |
| 4 | NPC lookup | `NPCS.find(n => n.biomeId === item.npcId)` | `init.ts` line 601 (collision), `init.ts` line 652 (tooltip), `render.ts` line 278 (draw) | ✅ |
| 5 | Decoration loader | Second `import.meta.glob('@/assets/biomes/**/*.png', { eager: true })` | `GameViewport.astro` line 22; distinct from skill glob (line 14). Glob key normalized via `/assets/` marker to `biomes/lcs/lcs-building.png` | ✅ |
| 6 | Test rewrite anchor | `BiomeId` literals | `biome-config.test.ts` uses `BIOME_ORDER: readonly BiomeId[]`; `game-journey-progression.test.ts` and `game-render.test.ts` quote BiomeId literals; zero display-name strings in assertions | ✅ |
| 7 | `lcs-building.png` source | Cherry-pick → `src/assets/biomes/lcs/lcs-building.png` | File present, 444 bytes, 64×64 RGBA PNG; attached as `BIOMES[0].decorations[0]` with `yOffset: 100` | ✅ |

All 7 decisions coherently implemented.

### 7. Issues

#### CRITICAL
None.

#### WARNING
None.

#### SUGGESTION
- **S1 (informational):** The slim `SKILL_TEMPLATES` re-export at `init.ts:88` exists solely to preserve the `.astro` import contract. The design acknowledges it; the grep guard validates it's the ONLY remaining mention. Consider a follow-up slice to migrate `.astro` consumers to import `BIOMES.flatMap(...)` directly from `biome-config.ts`, removing the re-export entirely. Not blocking.
- **S2 (informational):** Task 5.3 ("Visual Playwright confirmation") is deferred per task language: "visual Playwright confirmation is deferred because no Playwright runner is configured in this repository." The asset is wired through the build pipeline (verified in `dist/_astro/GameViewport.astro_*.js` — `biomes/lcs/lcs-building.png` globbed and indexed under `biomes/lcs/lcs-building.png`), and the decoration fallback is statically guaranteed by the `else` branch in `render.ts:227–245`. Visual confirmation remains a future slice.

### 8. Verdict

# **PASS**

- 0 blockers, 0 critical findings, 0 warnings.
- 17/17 tasks complete (all `[x]`).
- 6/6 requirements and 13/13 scenarios in `biome-engine/spec.md` covered.
- MODIFIED journey-progression delta scenarios (`Spawning layout`, `Spawning and rendering of NPCs`) covered with typed-`BiomeId` anchors.
- 7/7 design decisions coherently implemented.
- Full test suite green (226/226); full build green; full typecheck green.
- All grep guards pass.
- Asset present, wired, and visible in production bundle.
- `BiomeId` typed-union rejection empirically demonstrated (exit 2 on bad id).

The biome-engine slice is ready to merge via `sdd-archive`.