# Tasks: Journey Progression

## Review Workload Forecast

| Field                   | Value                              |
| ----------------------- | ---------------------------------- |
| Estimated changed lines | 400-500 lines                      |
| 400-line budget risk    | High                               |
| Chained PRs recommended | Yes                                |
| Suggested split         | PR 1 (Core) → PR 2 (DOM HUD/Modal) |
| Chain strategy          | stacked-to-main                    |
| Delivery strategy       | ask-on-risk                        |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal                                                                              | Likely PR | Focused test command             | Runtime harness                  | Rollback boundary                                    |
| ---- | --------------------------------------------------------------------------------- | --------- | -------------------------------- | -------------------------------- | ---------------------------------------------------- |
| 1    | Core physics, types, camera clamping, culling & spawning                          | PR 1      | `pnpm test tests/game-physics`   | N/A: pure physics/engine testing | Revert engine files (init.ts, physics.ts, render.ts) |
| 2    | HUD overlay, accessible modal in Astro/DOM, CustomEvent dispatching, CTA & styles | PR 2      | `pnpm test tests/print-contract` | `pnpm dev` & visual check        | Revert CV component and screen.css                   |

## Phase 1: Foundation

- [x] 1.1 In `src/game/types.ts`, add `Camera`, `CollectibleItem`, `PlayerState`, and `GameStateUpdateEventPayload` interfaces. (RED/GREEN/REFACTOR)
- [x] 1.2 In `src/game/physics.ts`, implement `clampPlayerY(y, max)` and `checkCollision(p, item)`. Test in `tests/game-physics.test.ts` (RED/GREEN/REFACTOR)

## Phase 2: Game World & Camera

- [x] 2.1 Update `src/game/init.ts` to initialize camera, map height (4000), and 15 collectible skills distributed across the 4 chronological career biomes. (RED/GREEN/REFACTOR)
- [x] 2.2 Update movement integration in `src/game/init.ts` to clamp player position to `[0, MAP_HEIGHT]` and set velocity to 0 on hitting bounds. (RED/GREEN/REFACTOR)
- [x] 2.3 Update viewport camera Y in `src/game/init.ts` to center on the player and clamp within `[0, MAP_HEIGHT - viewportHeight]`. (RED/GREEN/REFACTOR)
- [x] 2.4 In `src/game/render.ts`, update context translations by `-cameraY` and draw biome borders, collectible circles, and bottom CTA. (RED/GREEN/REFACTOR)
- [x] 2.5 In `src/game/render.ts`, implement viewport culling logic (`isWithinViewport`) to only draw visible items on canvas. (RED/GREEN/REFACTOR)

## Phase 3: DOM HUD & Modal Overlay

- [x] 3.1 In `src/components/CvDocument.astro`, add `#backpack-hud` button and `<dialog id="skill-matrix-modal">` structure, both with `.no-print` classes. (RED/GREEN/REFACTOR)
- [x] 3.2 In `src/styles/screen.css`, add styles for `#backpack-hud` overlay, button active states, and modal CSS grid layout. (RED/GREEN/REFACTOR)
- [x] 3.3 In `src/game/init.ts`, dispatch a `'game-state-update'` `CustomEvent` payload on item collection containing progress counter. (RED/GREEN/REFACTOR)
- [x] 3.4 In `src/components/CvDocument.astro`, add an event listener script to handle `'game-state-update'`, update HUD, and toggle lock/unlock style classes. (RED/GREEN/REFACTOR)

## Phase 4: Integration & Verification

- [x] 4.1 Write integration tests verifying camera tracking, coordinate clamping, and culling in game-render and physics tests. (RED/GREEN/REFACTOR)
- [x] 4.2 Write integration tests for `'game-state-update'` dispatching behavior under simulated item collisions. (RED/GREEN/REFACTOR)
- [x] 4.3 Run `pnpm test` and verify that all 8 test files (including new unit/integration specs) pass completely. (RED/GREEN/REFACTOR)
- [x] 4.4 Build production assets and verify that print layouts remain 100% pristine with zero leaked elements via headless print preview. (RED/GREEN/REFACTOR)
