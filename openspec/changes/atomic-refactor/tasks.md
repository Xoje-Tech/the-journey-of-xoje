# Tasks: Atomic & DDD Component Refactoring

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium

## Phase 1: Foundation & Dependencies

- [x] 1.1 Install `nanostores` dependency under `dependencies` in `package.json`.
- [x] 1.2 Create `src/game/store.ts` to implement `isStartedStore`, `volumeStore`, `gamepadConnectedStore`, and `collectedSkillsStore`.
- [x] 1.3 Test: Verify that all exported stores exist, can be updated, and emit events upon mutation.

## Phase 2: Stateless UI Atoms & Molecules

- [x] 2.1 Implement `src/components/ui/RetroButton.astro` with blocky retro styling extracted from global `screen.css`.
- [x] 2.2 Implement `src/components/ui/GamepadStatus.astro` showing dynamic active/inactive gamepad indicator state.
- [x] 2.3 Implement `src/components/ui/VolumeSlider.astro` with blocky progress bars and range inputs.
- [x] 2.4 Implement `src/components/ui/RetroModal.astro` with native overlay style, close event hooks, and desaturated backdrops.
- [x] 2.5 Test: Verify components render isolated HTML templates and encapsulate Astro scoped `<style>` tags correctly.

## Phase 3: Domain Game Organisms

- [x] 3.1 Implement `src/components/game/BackpackButton.astro` with HUD style subscribing to skill stores.
- [x] 3.2 Implement `src/components/game/BackpackInventory.astro` rendering unlocked skills with desaturated pixel matrix styles.
- [x] 3.3 Implement `src/components/game/StartScreen.astro` handling play initiation subscribing to `isStartedStore`.
- [x] 3.4 Implement `src/components/game/SettingsPanel.astro` modal/modeless drawer managing audio levels.
- [x] 3.5 Implement `src/components/game/ControlsGuide.astro` encapsulating NES controller blueprint diagram.
- [x] 3.6 Implement `src/components/game/GameViewport.astro` capturing the `<canvas>` and managing core engine lifecycle.
- [x] 3.7 Test: Verify game organisms subscribe dynamically to Nanostore states and trigger correct visual updates on store mutation.

## Phase 4: CV Document & Integration

- [x] 4.1 Implement printable header and content article slot wrapper in `src/components/cv/CvDocument.astro`.
- [x] 4.2 Update `src/pages/[locale]/index.astro` to render the modular `CvDocument.astro` and game HUD structures.
- [x] 4.3 Remove monolithic `src/components/CvDocument.astro` and delegate canvas setup to `GameViewport.astro` in `CvLayout.astro`.
- [x] 4.4 Test: Verify clean, print-ready CV PDF layouts without game elements via print preview.

## Phase 5: Verification & Tests

- [x] 5.1 Update `tests/start-screen.test.ts` to support game viewport mount lifecycle and engine initialization.
- [x] 5.2 Execute `pnpm test` to verify that 100% of integration and unit tests are passing successfully.
- [x] 5.3 Execute `pnpm typecheck` and `pnpm build` to guarantee compilation and formatting consistency.
