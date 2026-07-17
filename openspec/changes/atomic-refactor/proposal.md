# Proposal: Atomic & DDD Component Refactoring

## Intent

Refactor the monolithic `CvDocument.astro` component to separate static print-ready CV layout code from interactive arcade game components. This structural reorganization improves code maintainability, isolation, and testability by utilizing Atomic Design principles and Nanostores for reactive state management.

## Scope

### In Scope

- Add `nanostores` dependency to manage lightweight reactive game UI state.
- Extract atomic UI elements to `src/components/ui/`: `RetroButton.astro`, `GamepadStatus.astro`, `VolumeSlider.astro`, `RetroModal.astro` with scoped component styles.
- Extract game organisms to `src/components/game/`: `BackpackButton.astro`, `BackpackInventory.astro`, `StartScreen.astro`, `SettingsPanel.astro`, `ControlsGuide.astro`, `GameViewport.astro`.
- Refactor `src/components/cv/CvDocument.astro` to render only the clean print-ready header and the markdown `<article>` slot container, completely free of game UI or loop scripts.
- Shift canvas initialization from `CvLayout.astro` to `GameViewport.astro`.
- Clean compilation and passing of all existing tests (`pnpm test`).

### Out of Scope

- Modifying the underlying core physics calculations, rendering offsets, or spritesheet animation algorithms.
- Modifying the markdown content compilation or data flow.

## Capabilities

### New Capabilities

- `atomic-ui-architecture`: A modular, decoupled component architecture.

### Modified Capabilities

- None (functional behaviors remain completely identical).

## Approach

Deconstruct `CvDocument.astro` using Atomic Design. Reusable stateless UI primitives are placed in `src/components/ui/`. Domain-specific overlays and game managers are placed in `src/components/game/`. Component styling is moved into scoped `<style>` tags within each component. To handle state-sharing (volume, gamepad, game-start status, skills counter) cleanly and with zero-overhead, we introduce a Nanostore (`src/game/store.ts`). All canvas engine initialization lifecycle is fully encapsulated inside `GameViewport.astro`.

## Affected Areas

| Area                              | Impact   | Description                                                                        |
| --------------------------------- | -------- | ---------------------------------------------------------------------------------- |
| `src/components/CvDocument.astro` | Modified | Cleaned up to act as a wrapper or thin entry point.                                |
| `src/components/ui/`              | New      | Creates reusable Atoms & Molecules with scoped CSS.                                |
| `src/components/game/`            | New      | Creates domain-specific Organisms with isolated states.                            |
| `src/layouts/CvLayout.astro`      | Modified | Shuts down native layout init; delegates canvas lifecycle to `GameViewport.astro`. |
| `src/game/store.ts`               | New      | Defines reactive Nanostores for game UI states.                                    |
| `package.json`                    | Modified | Adds `nanostores` dependency.                                                      |

## Risks

| Risk                  | Likelihood | Mitigation                                             |
| --------------------- | ---------- | ------------------------------------------------------ |
| Scope bleed in CSS    | Low        | Scope component CSS inside Astro's native style tags.  |
| Dependency Resolution | Low        | Add lightweight, zero-dependency `nanostores` package. |

## Rollback Plan

Discard all local modifications and untracked files by running `git checkout develop && git clean -fd`.

## Dependencies

- `nanostores` (^0.11.0 or similar compatible version).

## Success Criteria

- [ ] All 10 test files and 102 tests in `pnpm test` pass.
- [ ] `pnpm typecheck` runs successfully.
- [ ] `pnpm build` compiles without errors.
