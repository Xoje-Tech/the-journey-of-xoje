# Tasks: Game Pause

## Review Workload Forecast

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

| Field | Value |
|---|---|
| Estimated changed lines | 60-95 lines |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | pending |

## Phase 1: Setup & Localization

- [x] 1.1 Add `"pauseButton": "Pausa"`, `"resumeGame": "Reanudar Juego"` to `src/i18n/ui.es.json`.
- [x] 1.2 Add `"pauseButton": "Pause"`, `"resumeGame": "Resume Game"` to `src/i18n/ui.en.json`.

## Phase 2: Core Engine

- [x] 2.1 [RED] Write unit test in `tests/game-pause.test.ts` verifying that engine `stop()` unsubscribes from `isStartedStore`.
- [x] 2.2 [GREEN] In `src/game/init.ts`, subscribe to `isStartedStore`, store the unsubscribe handler, and call it in `stop()`.
- [x] 2.3 [RED] Write integration test in `tests/game-pause.test.ts` verifying that setting `isStartedStore` to `false` freezes position/velocity updates while rendering continues.
- [x] 2.4 [GREEN] In `src/game/init.ts`, when `isPlaying` is false, bypass velocity and position calculations, trails, and animations (passing `0` to `updateAndDraw`).

## Phase 3: HUD Pause Button

- [x] 3.1 [RED] Write test in `tests/game-pause.test.ts` verifying `PauseButton.astro` sets `isStartedStore` to `false` on click and hides during print.
- [x] 3.2 [GREEN] Create `src/components/game/PauseButton.astro` with `.no-print` and retro styling, triggering `isStartedStore.set(false)` on click.
- [x] 3.3 Mount `<PauseButton locale={locale} />` in `src/pages/[locale]/index.astro` inside the HUD layouts.

## Phase 4: StartScreen Overlay Transition

- [x] 4.1 [RED] Write test verifying `StartScreen.astro` slides back down when paused, setting display to flex and using `offsetHeight` reflow.
- [x] 4.2 [GREEN] Update `src/components/game/StartScreen.astro` to subscribe to `isStartedStore`, sliding down, setting flex, forcing `offsetHeight` reflow, and toggling label dynamically via data-attributes.

## Phase 5: Verification & Cleanup

- [x] 5.1 Run `pnpm test` and `pnpm typecheck` locally to confirm all tests pass.
- [x] 5.2 Validate pause visual transitions and label switching in local development browser under Spanish and English locales.
- [x] 5.3 Verify there are no visual glitches or CSS collisions using browser visual screenshots.
