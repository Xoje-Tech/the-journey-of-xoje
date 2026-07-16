# Tasks: Start Screen

## Review Workload Forecast

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

## Phase 1: Types and Engine Core

- [x] 1.1 Update `src/game/types.ts` to export `start()` method on `GameHandle` interface.
- [x] 1.2 In `src/game/init.ts`, introduce `started = false` state variable in the main game scope.
- [x] 1.3 Update `GameHandle` returned by `init` to expose `start()` which sets `started = true`.
- [x] 1.4 Modify `loop()` in `src/game/init.ts` to skip input polling, physics updates, collisions, trail updates, and camera motion when `started === false`.
- [x] 1.5 Ensure `loop()` continues to schedule blinks and execute background grid, biome, idle/blinking player entity, and HUD renders when `started === false`.

## Phase 2: Start Screen & Overlay UI

- [x] 2.1 In `src/components/CvDocument.astro`, append full-screen `#start-screen` splash overlay with title, tagline, and four retro buttons: "Start Game", "Download CV" (calling `window.print()`), "Settings", and "Controls Guide".
- [x] 2.2 Inside `CvDocument.astro`, add `#settings-modal` dialog carrying state sliders/placeholders for volume and a dynamic gamepad connection status label.
- [x] 2.3 Inside `CvDocument.astro`, add `#controls-modal` dialog carrying keyboard/mouse mapping and an inline SVG retro NES gamepad outline mapped with pointer/control indicator lines.
- [x] 2.4 Add script logic in `CvDocument.astro` to wire buttons to open/close modals, poll `navigator.getGamepads()` to update connectivity, and handle the Start button.
- [x] 2.5 Wire the "Start Game" button click to add `.slide-up` to `#start-screen`, call `handle.start()` to resume the engine, and hide the overlay on `transitionend`.

## Phase 3: Styling & Transitions

- [x] 3.1 Style `#start-screen` in `src/styles/screen.css` as a full-screen high z-index flex overlay with primary dark charcoal color `#1c1c1f` and off-white text `#f4f4f5`.
- [x] 3.2 Add styles in `src/styles/screen.css` for blocky retro-buttons (zero border-radius, 2px dark border, solid block shadow offset) and their hover/active states.
- [x] 3.3 Style `#settings-modal` and `#controls-modal` dialog elements in `src/styles/screen.css` to match the desaturated retro console theme.
- [x] 3.4 Style the inline NES controller SVG silhouette styling, mapping active/inactive highlights (`#eab308` and `#09090b`) to gamepad buttons.
- [x] 3.5 Implement the hardware-accelerated `.slide-up` transition styling using `transform: translateY(-100%)` with a `cubic-bezier(0.25, 1, 0.5, 1)` ease over 600ms.
- [x] 3.6 Apply `.no-print` styling to all start screen, modals, buttons, and transition overlays to guarantee zero print bleed.

## Phase 4: Verification & Integration

- [x] 4.1 Create `tests/start-screen.test.ts` to verify the new `GameHandle` returned by `init()` contains a callable `start()` function.
- [x] 4.2 Add unit test in `tests/start-screen.test.ts` to mock input events and assert player position is frozen while `started === false`.
- [x] 4.3 Add unit test in `tests/start-screen.test.ts` to assert that calling `start()` successfully resumes input polling, player velocity changes, and position updates.
- [x] 4.4 Run `pnpm test` to verify all new and existing tests pass.
- [x] 4.5 Run `pnpm build` to verify no TypeScript or Astro compilation errors are introduced.
