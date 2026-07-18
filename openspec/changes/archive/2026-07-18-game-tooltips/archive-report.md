# Archive Report: game-tooltips

- **Change**: `game-tooltips`
- **Date**: 2026-07-18
- **Status**: Completed & Verified
- **Archive Path**: `openspec/changes/archive/2026-07-18-game-tooltips/`

## SDD Cycle Traceability

Below is the list of Engram observations recording the design, planning, specification, and implementation progress of this change:

| Artifact       | Observation ID | Title                                                          | Sync ID                |
| -------------- | -------------- | -------------------------------------------------------------- | ---------------------- |
| Proposal       | #523           | sdd/game-tooltips/proposal                                     | `obs-ebeba14b805ee129` |
| Specification  | #524           | sdd/game-tooltips/spec                                         | `obs-756e249202233422` |
| Loop Placement | #525           | game-tooltips proximity loop placement                         | `obs-c74049bdd89ad4a0` |
| Design         | #526           | sdd/game-tooltips/design                                       | `obs-7a38493823321d64` |
| Tasks          | #527           | Tasks: Game Tooltips                                           | `obs-ed1e9cbd58b025d9` |
| Verification   | #528           | Game Tooltips Verification Report                              | `obs-7790c940b9500abc` |

## Specs Synced

The following specifications were synced to the main specs of the repository:

1. **Videogame UI Game Delta**:
   - Source: `openspec/changes/archive/2026-07-18-game-tooltips/specs/videogame-ui-game/spec.md`
   - Destination: `openspec/specs/videogame-ui-game/spec.md`
   - Details: Synced the `REQ-ENGINE-LOOP-PROXIMITY-HOOK` addition to ensure active scanning of nearby collectibles on every active loop frame update.

## Task Verification & Build Summary

- **Total Tasks Completed**: 14/14 tasks marked complete `[x]` in `tasks.md`.
- **Test Results**: All 130 tests green, fully verified.
- **Compilation**: Clean typescript/typecheck run.
- **Production Build**: Verified.
- **Visual & Print Layouts**: Completely print-safe tooltip overlay components, layout matches visual aesthetic guidelines.

## Archive Contents Checklist

The archived folder `openspec/changes/archive/2026-07-18-game-tooltips/` contains:

- `proposal.md` ✅
- `design.md` ✅
- `tasks.md` ✅ (all checked)
- `specs/videogame-ui-game/spec.md` ✅
- `verify-report.md` ✅
- `archive-report.md` ✅

## Summary of Completed Work

### Core Engine & Proximity Detection

- Integrated proximity check loop (Euclidean distance < 40px) inside `init.ts` animation update loop to scan for uncollected collectibles (skills and NPCs).
- Translated logical coordinates `(item.x, item.y)` to viewport `(item.x, item.y - camera.y)` dynamically.
- Managed proximity-based closest-target selection and coordinate tracking using `activeTooltipStore` Nanostores atom.

### Double-Border Retro Tooltip UI

- Implemented absolutely-positioned, horizontally-centered floating overlay `TooltipOverlay.astro` featuring NES double-border retro design.
- Enforced print-safety on the tooltip elements by styling them to hide using `.no-print` classes and verifying via E2E/contract unit tests.
- Configured dynamic button and message localization using safe, clean HTML data-attributes.
