# Tasks: game-npcs Integration

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 200 - 250 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single cohesive PR |
| Delivery strategy | auto-chain |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

## Phase 1: Setup/i18n & Types
- [x] 1.1 Add `"dialogContinue"` to `src/i18n/ui.es.json` (`"Siguiente"`) and `src/i18n/ui.en.json` (`"Continue"`).
- [x] 1.2 Define `NPCMetadata` and `ActiveDialog` in `src/game/types.ts`.
- [x] 1.3 Update `CollectibleItem` and `InitOptions` in `src/game/types.ts` to include optional `npc` and `locale`.

## Phase 2: Store & Metadata
- [x] 2.1 [RED] Write failing test for `activeDialogStore` default and updates in `tests/store.test.ts`.
- [x] 2.2 [GREEN] Create and export `activeDialogStore` atom in `src/game/store.ts` to pass the test.
- [x] 2.3 Add `npc` metadata to Héctor, Laura, Dani, and Marcos in `SKILL_TEMPLATES` in `src/game/init.ts`.

## Phase 3: Engine Loop Pausing
- [x] 3.1 [RED] Write failing integration test in `tests/game-pause.test.ts` asserting NPC collision triggers loop pause (`dt = 0`).
- [x] 3.2 [GREEN] Update `src/game/init.ts` to subscribe to `activeDialogStore` and freeze the loop, physics, input, and player animation.

## Phase 4: Drawing NPCs on Canvas
- [x] 4.1 [RED] Write failing test in `tests/game-render.test.ts` asserting NPC rendering produces distinct canvas shapes.
- [x] 4.2 [GREEN] Update `drawCollectibles` in `src/game/render.ts` using constants `NPC_FILL` and `NPC_STROKE` to render NPC circles with initials.

## Phase 5: DialogOverlay component
- [x] 5.1 Create `<DialogOverlay />` at `src/components/game/DialogOverlay.astro` using `CHAR_SPEED_MS = 30` and data attribute translations.
- [x] 5.2 Implement progressive typewriter animation with Space/click handlers dispatching `'dialog-dismissed'`.

## Phase 6: Mount & Integration
- [x] 6.1 Update `src/components/game/GameViewport.astro` to pass the `locale` prop to the game `init()`.
- [x] 6.2 Mount `<DialogOverlay locale={locale} />` in `src/pages/[locale]/index.astro` and wire the `'dialog-dismissed'` event listener in `src/game/init.ts`.

## Phase 7: Tests & Verification
- [x] 7.1 [REFACTOR] Verify typescript check (`pnpm typecheck`) and formatting (`pnpm format`).
- [x] 7.2 Run all tests with `pnpm test` and verify that both existing and new tests pass cleanly.
- [x] 7.3 Manually verify NPC dialogue overlay rendering and typewriter effect in-browser via `pnpm dev`.
