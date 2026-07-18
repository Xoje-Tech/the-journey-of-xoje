# Tasks: Game Tooltips

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~120 lines total |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | auto-chain |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

### Suggested Work Units

- PR 1: Core Engine & State. Test: `pnpm test tests/store.test.ts`. Rollback: revert `store.ts` and `init.ts`.
- PR 2: UI Overlay & Pages. Test: `pnpm build && pnpm test`. Rollback: delete `TooltipOverlay.astro` and un-mount.

## Phase 1: State Foundation
- [x] 1.1 Add `TooltipState` interface and `activeTooltipStore` Nanostores atom to `store.ts`.
- [x] 1.2 Write RED unit tests in `store.test.ts` for initialization and active state mutation.
- [x] 1.3 Make tests GREEN by defining state shape and default values.

## Phase 2: Proximity Logic & Integration
- [x] 2.1 Add proximity check loop (Euclidean distance < 40px) inside `init.ts`'s `loop()`.
- [x] 2.2 Translate logical coordinates `(item.x, item.y)` to viewport `(item.x, item.y - camera.y)` for the closest targeted item.
- [x] 2.3 Update `activeTooltipStore` with closest target metadata, or clear to `null` if none/collected.
- [x] 2.4 Write RED integration tests for closest targeting, translation, and collection clear.
- [x] 2.5 Ensure all proximity and collection tests pass (GREEN).

## Phase 3: Tooltip Overlay UI
- [x] 3.1 Create `TooltipOverlay.astro` with double-border retro NES styling and `.no-print` class.
- [x] 3.2 Subscribe to `activeTooltipStore` and absolutely position card offset above `(screenX, screenY)`.
- [x] 3.3 Implement localized translations fetched via HTML data-attributes.
- [x] 3.4 Mount `<TooltipOverlay locale={locale} />` in `index.astro` and `[locale]/index.astro`.

## Phase 4: Verification & Print Safety
- [x] 4.1 Write test in `print-contract.test.ts` to assert that tooltip overlay is hidden in print mode.
- [x] 4.2 Verify tooltip overlay horizontal centering and rendering during active play.
