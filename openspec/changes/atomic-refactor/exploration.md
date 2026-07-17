## Exploration: Atomic Refactoring of CvDocument

### Current State

Currently, `src/components/CvDocument.astro` is a large, monolithic component (384 lines) that houses both static printable document structures and interactive pixel-art game layers. It mixes:

1. Printable CV header layout (title, tagline, print button, and language selector).
2. Backpack HUD overlay button.
3. Accessible Skill-Matrix modal dialog (generating locked/unlocked cards for each skill).
4. Start Screen splash overlay with game controls menu.
5. Console Settings modal dialog (volume range slider and gamepad connection status).
6. Controls Guide modal dialog (carrying a massive inline SVG retro NES gamepad with pointer lines).
7. Game canvas element.
8. Large client-side `<script>` managing DOM event listeners, modal triggers, gamepad polling, and state-update listeners.

This coupling violates the Single Responsibility Principle, cluttering the CV layout with complex game UI.

### Affected Areas

- `src/components/CvDocument.astro` — Will be stripped down to focus exclusively on rendering the CV header and the semantic `<article>` container slot.
- `src/layouts/CvLayout.astro` — Currently handles the canvas DOM element check and runs the game `init.ts` script. This responsibility can be moved into a specialized `GameViewport.astro` component, making `CvLayout` purely a document frame.
- `src/pages/[locale]/index.astro` — Unmodified consumption interface, but will render the cleaner version of `CvDocument`.
- `src/styles/screen.css` — Contains styles for overlays, buttons, modals, and sliders. Since styles are global, we will continue to leverage `screen.css` for visual consistency during this structural refactor, ensuring zero style regressions.

### Approaches

1. **Atomic & Domain-Driven Design (DDD) Split (Recommended)**
   - **Description**: Divide the monolith into stateless UI atoms/molecules and domain-specific organisms. Under `src/components/ui/`, extract `RetroButton.astro`, `GamepadStatus.astro`, `VolumeSlider.astro`, and `RetroModal.astro`. Under `src/components/game/`, extract `BackpackButton.astro`, `BackpackInventory.astro`, `StartScreen.astro`, `SettingsPanel.astro`, `ControlsGuide.astro`, and `GameViewport.astro`. The original `CvDocument` is kept strictly for CV content layout.
   - **Pros**:
     - Clear separation of concerns (static CV layout vs. game components).
     - Highly modular, testable, and reusable components.
     - Keeps individual files clean, readable, and highly maintainable.
   - **Cons**:
     - Increases file count (10 new components).
     - Requires careful alignment of scripts and DOM query selectors.
   - **Effort**: Medium

2. **Script-Only Extraction**
   - **Description**: Keep the entire HTML markup in `CvDocument.astro` unchanged, but extract the `<script>` contents into external TypeScript utility modules (e.g., `src/game/hud-listeners.ts`).
   - **Pros**:
     - Fewer files created.
     - Lower risk of HTML layout breakages.
   - **Cons**:
     - Failed separation of concerns; the HTML remains a monolithic pile of templates.
     - Misses the opportunity to build reusable, clean UI design tokens/atoms.
   - **Effort**: Low

### Recommendation

We recommend **Approach 1 (Atomic & DDD Component Split)**. It represents a proper modern architecture refactor, creating clear structural boundaries between game mechanics and document presentation.

### Risks

- **DOM Selector & Script Synchronization**: Splitting components could break client-side scripts if elements are queried before they are present or if IDs/classes change. We must maintain exact matches and load scripts with Astro's standard client-side behavior.
- **TypeScript Loose Typing on Global Objects**: `window.gameHandle` must be safely declared or type-cast to avoid compilation failures.
- **Vitest Environment Compatibility**: Existing tests (such as `tests/start-screen.test.ts`) might stub or expect certain structures. The refactor must keep the overall DOM query structure identical to avoid breaking test stubs.

### Ready for Proposal

Yes. The refactor path is well-defined, safe, and will result in zero behavior change.
