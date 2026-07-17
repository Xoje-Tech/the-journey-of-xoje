# Tasks: Game Skill Bags

## Review Workload Forecast

| Field                   | Value                       |
| ----------------------- | --------------------------- |
| Estimated changed lines | 200-250 lines               |
| 400-line budget risk    | Low                         |
| Chained PRs recommended | No                          |
| Suggested split         | Single PR (highly cohesive) |
| Delivery strategy       | auto-chain                  |
| Chain strategy          | size-exception              |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

## Phase 1: Setup/i18n & Types

- [x] 1.1 Add `'soft'` category to `CollectibleItem` interface in `src/game/types.ts`. [RED/GREEN/REFACTOR]
- [x] 1.2 Add English keys for bags under `game` in `src/i18n/ui.en.json`: `techBagLabel`, `techBagTitle`, `qualBagLabel`, `qualBagTitle`, `softBagLabel`, `softBagTitle`.
- [x] 1.3 Add Spanish keys for bags under `game` in `src/i18n/ui.es.json` with matching translations.

## Phase 2: Engine & Spawning Changes

- [x] 2.1 Insert 4 soft skills into `SKILL_TEMPLATES` in `src/game/init.ts` (1 per biome, y-ascending sorted, total 19). [RED/GREEN/REFACTOR]
- [x] 2.2 Update `drawCollectibles` in `src/game/render.ts` to draw soft skills with green coins (`rgba(100,255,100,0.2)` fill, `rgba(100,255,100,0.8)` stroke).

## Phase 3: Generic RetroModal Refactor

- [x] 3.1 Modify `src/components/ui/RetroModal.astro` to accept and set a `data-trigger-id` attribute on the dialog element.
- [x] 3.2 Update close/backdrop-click logic in `RetroModal.astro` to retrieve `data-trigger-id`, set its `aria-expanded` to "false", and return focus. [RED/GREEN/REFACTOR]

## Phase 4: Create separate Skill Bags

- [x] 4.1 Delete legacy monolithic `src/components/game/BackpackButton.astro` and `src/components/game/BackpackInventory.astro`.
- [x] 4.2 Create `src/components/game/TechBag.astro` subscribing to `collectedSkillsStore` for `'technical'` skills, displaying counts, toast, and custom modal.
- [x] 4.3 Create `src/components/game/QualBag.astro` subscribing to `collectedSkillsStore` for `'qualitative'` skills, displaying counts, toast, and custom modal.
- [x] 4.4 Create `src/components/game/SoftBag.astro` subscribing to `collectedSkillsStore` for `'soft'` skills, displaying counts, toast, and custom modal.

## Phase 5: Layout & Styling changes

- [x] 5.1 Remove `position: fixed` styling from `src/components/game/PauseButton.astro`'s container.
- [x] 5.2 Mount `PauseButton`, `TechBag`, `QualBag`, and `SoftBag` inside a `.hud-top-right` flex container in `src/pages/[locale]/index.astro`.
- [x] 5.3 Implement responsive CSS for `.hud-top-right`: horizontal row with `gap: 8px` on top-right; hide text labels under 480px via `@media (max-width: 480px)`.

## Phase 6: Tests & Verification

- [x] 6.1 Update `tests/game-journey-progression.test.ts` to assert exactly 19 skills distributed as 4, 5, 5, 5 per biome, and verify y-ascending order. [RED/GREEN]
- [x] 6.2 Run `pnpm test` and verify that all 19 skill progression checks pass successfully.
- [x] 6.3 Execute `pnpm build` to compile the app and confirm zero TypeScript or Astro compilation issues.
- [x] 6.4 Start dev server, navigate using browser tools, and run a visual IA audit to verify top-right layout, 480px text hiding, and focus reset cycles.
