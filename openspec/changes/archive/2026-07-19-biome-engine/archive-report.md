# Archive Report — biome-engine

**Change**: biome-engine
**Archived**: 2026-07-19
**Mode**: hybrid (filesystem + Engram)
**Branch at archive**: `feat/biome-engine` (clean working tree; openspec/ left untracked by design)
**Verdict at archive**: PASS (0 blockers, 0 critical findings, 0 warnings)
**Verifier**: sdd-verify (delegate_only)

## Specs Synced

| Domain              | Action   | Details                                                                                    |
| ------------------- | -------- | ------------------------------------------------------------------------------------------ |
| biome-engine        | Created  | 6 requirements (all ADDED) — Biome Authoring Surface, Biome Identifier Type, Coordinate Resolution, Decoration Sprite Loader, NPC Config Table, Backwards Compatibility Guard |
| journey-progression | Modified | 2 requirements replaced, 2 verified unchanged                                               |

### journey-progression merge detail

**MODIFIED (replaced)**:
- `### Requirement: Career Biomes and Spawning` — joined by typed `BiomeId` union (`lcs-robotics | crmble | twinny | ride-on`); per-biome counts now anchor to identifiers, not display strings.
- `### Requirement: REQ-NPC-SPAWNING-RENDERING` — NPC resolution moved to external `NPCConfig[]` table via `npcId?: BiomeId` lookup; biome column rewritten as typed `BiomeId` literals; new scenario asserts lookup path.

**Unchanged (verified, kept as-is in main spec)**:
- `### Requirement: REQ-NPC-DIALOG-ACTIVATION-TYPEWRITER` — overlay + typewriter + localized dialogue table preserved verbatim.
- `### Requirement: REQ-NPC-PROGRESSION-DISMISSAL` — Space/click dismissal, `activeDialogStore = null`, `'dialog-dismissed'` CustomEvent, and skill-collection membership preserved verbatim.

All 11 requirements in `openspec/specs/journey-progression/spec.md` were preserved (no removals, no renames, no scenario drops outside the two MODIFIED blocks).

## Archive Contents

- `proposal.md` ✅
- `exploration.md` ✅
- `specs/biome-engine/spec.md` ✅ (NEW — copied verbatim to `openspec/specs/biome-engine/spec.md`)
- `specs/journey-progression/spec.md` ✅ (delta — merged into `openspec/specs/journey-progression/spec.md`)
- `design.md` ✅
- `tasks.md` ✅ — **17/17 tasks complete** (all `[x]`); 0 unchecked
- `verify-report.md` ✅ — `verdict: pass`, 0 blockers, 0 critical findings, 26/26 scenarios, 226/226 tests green, typecheck + build clean
- `archive-report.md` ✅ (this file)

## Source of Truth Updated

The following main specifications are now officially part of the repository:

- `openspec/specs/biome-engine/spec.md` — **NEW** (6 ADDED requirements: authoring surface, typed identifier, coordinate resolution, sprite loader, NPC table, backwards-compat guard).
- `openspec/specs/journey-progression/spec.md` — **MODIFIED** (typed `BiomeId` join key; external NPC lookup table; `npcId?: BiomeId` resolution path).

## Truth Reconciliation vs Brief

Orchestrator brief claims verified against the filesystem:

| Brief claim                                                       | Filesystem evidence                                                                                          | Status   |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | -------- |
| `openspec/changes/biome-engine/` artifacts exist                  | 7 files: proposal/design/exploration/tasks/verify-report + 2 spec deltas                                    | ✅ Match |
| All 17 tasks `[x]`                                                 | `grep -cE '^- \[x\]'` = 17; `grep -cE '^- \[ \]'` = 0                                                       | ✅ Match |
| `openspec/specs/biome-engine/` does not exist (NEW domain)        | `ls: cannot access 'openspec/specs/biome-engine/'`                                                            | ✅ Match |
| `openspec/specs/journey-progression/spec.md` exists (MODIFIED)     | File present (155 lines pre-merge, now 184 lines)                                                            | ✅ Match |
| `openspec/changes/archive/` exists                                | Directory present with prior archives: 2026-07-16-journey-progression, 2026-07-16-videogame-ui, 2026-07-17-game-npcs, 2026-07-17-game-pause, 2026-07-17-game-skill-bags, 2026-07-18-game-tooltips | ✅ Match |
| Working tree clean except untracked openspec/                    | `git status --short` shows only: `deleted: openspec/changes/biome-engine/tasks.md`, `modified: openspec/specs/journey-progression/spec.md`, `?? openspec/changes/archive/2026-07-19-biome-engine/`, `?? openspec/specs/biome-engine/` | ✅ Match (left untracked by design, NOT committed) |
| Verify-report verdict PASS, 0 blockers, 0 critical               | Frontmatter: `verdict: pass`, `blockers: 0`, `critical_findings: 0`                                            | ✅ Match |

No discrepancies. No corrections required.

## SDD Cycle Complete

The `biome-engine` change has been fully:

- **Planned** — proposal, design, exploration, tasks, and delta specs authored.
- **Implemented** — 5 apply commits on `feat/biome-engine` (typed biome-engine surface; engine wiring; LCS building decoration cherry-pick; test completion; verification).
- **Verified** — `sdd-verify` returned PASS; full `pnpm test` (226/226 green), `pnpm typecheck`, `pnpm build` all passing; grep guards clean.
- **Archived** — delta specs synced to source-of-truth main specs; change folder moved to `openspec/changes/archive/2026-07-19-biome-engine/`; this archive-report persisted to filesystem AND Engram (topic_key `sdd/biome-engine/archive-report`, type `architecture`).

Branch ahead of `origin/develop` by 5 commits. No commits made during archive (per orchestrator instruction).

Ready for the next change.