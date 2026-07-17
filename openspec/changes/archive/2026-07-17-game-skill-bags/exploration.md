## Exploration: Game Skill Bags

### Current State

Currently, the videogame features a single "Backpack" button (`BackpackButton.astro`) in the top-right HUD and a single overlay modal (`BackpackInventory.astro`). This backpack aggregates both "technical" and "qualitative" skills that the player character collects along their vertical movement on the canvas. The total count is hardcoded to 15, and the category types are limited to `'technical' | 'qualitative'`. The UI text is hardcoded in English, and there is no representation of "soft skills".

### Affected Areas

- `src/game/types.ts` — Type definition for `CollectibleItem` needs to support `'soft'` under its `category` property (i.e. updating `'technical' | 'qualitative'` to `'technical' | 'qualitative' | 'soft'`).
- `src/game/init.ts` — The list of `SKILL_TEMPLATES` needs to be updated. We will add 4 new soft skills (one per biome/timeline segment) and update their categories to use `'soft'`.
- `src/game/render.ts` — The collectible coin drawing logic inside `drawCollectibles` needs to support drawing soft skill coins with a distinct visual signature (color and stroke) on the canvas.
- `src/components/game/BackpackButton.astro` — Will be deprecated/removed and replaced with three separate components.
- `src/components/game/BackpackInventory.astro` — Will be deprecated/removed.
- `src/components/game/TechBag.astro`, `src/components/game/QualBag.astro`, `src/components/game/SoftBag.astro` — New Astro components to represent the three separate bags and modals. Each will render its respective HUD button and modular retro dialog with appropriate category counts and toast notifications, subscribing to `collectedSkillsStore` dynamically.
- `src/components/ui/RetroModal.astro` — Needs to be made generic so that closing any modal correctly resets the `aria-expanded` state of its triggering button, instead of hardcoding a reference to the deprecated `backpack-hud` element.
- `src/pages/[locale]/index.astro` — Needs to mount the three separate bags (`TechBag.astro`, `QualBag.astro`, `SoftBag.astro`) in place of `BackpackButton` and `BackpackInventory`. The HUD buttons (including the `PauseButton`) should be wrapped in a layout container to display in a neat, responsive row.
- `src/i18n/ui.es.json` & `src/i18n/ui.en.json` — Need translation keys for the button labels and modal titles of all three bags to support full internationalization.
- `tests/game-journey-progression.test.ts` — Needs its assertions updated to expect 19 total skills instead of 15, and to account for the updated biome counts.

### Approaches

1. **Fully Split Components (TechBag, QualBag, SoftBag) with Grouped Flexbox HUD (Recommended)**
   - **Description**: Replace `BackpackButton.astro` and `BackpackInventory.astro` with three separate, self-contained Astro components (`TechBag.astro`, `QualBag.astro`, `SoftBag.astro`). Each component houses its own HTML button, toast notification element, and specific `<RetroModal>`. Inside `[locale]/index.astro`, wrap the `PauseButton` and the three separate bags inside a `.hud-top-right` flex container. This aligns all buttons in a neat, responsive horizontal row. Subscribing to `collectedSkillsStore` lets each bag only count and toast for its own category.
   - **Pros**:
     - Incredible modularity: each bag is fully encapsulated, containing its own styling, script logic, and modular sub-views.
     - Responsive and robust: Flexbox automatically resolves spacing and positioning, avoiding hardcoded pixel offsets.
     - Localized and generic: utilizes the central Astro i18n JSON files for labels, and makes `RetroModal` reusable.
   - **Cons**:
     - Requires minor refactoring of `RetroModal.astro` to decouple it from `backpack-hud` and support generic trigger resets via data attributes.
   - **Effort**: Medium

2. **Single Multi-Bag HUD Button with Category Tabs inside Backpack modal**
   - **Description**: Keep a single `BackpackButton` and `BackpackInventory` but refactor the modal to show a tabbed layout, dividing Technical, Qualitative, and Soft skills under different tab headers.
   - **Pros**:
     - Avoids adding two extra HUD buttons in the top-right screen space.
   - **Cons**:
     - Fails to meet the explicit user request of splitting into "three separate bags and modals" and placing "the three bag buttons in a neat row".
     - Adds stateful complexity for tab switching inside a single modal component.
   - **Effort**: Medium

### Recommendation

Approach 1 is highly recommended. It perfectly complies with the user's explicit structural and UI goals, adheres to Atomic Design principles, ensures robust styling and clean spacing via CSS Flexbox, and handles internationalization cleanly.

### Risks

- **Test Suite Breaking**: Adding 4 soft skills to `SKILL_TEMPLATES` raises the total collectible count to 19 and alters per-biome counts. `tests/game-journey-progression.test.ts` will fail until updated.
- **Visual Overlap / Screen Space**: Having 4 buttons (Pause + 3 bags) in the top-right could overlap with other elements on very narrow screens. Grouping them inside a responsive flex container with appropriate gap sizes (e.g. `8px` or `10px`) and logical viewport-size restrictions is crucial.
- **Print Leaks**: Each of the new buttons must carry the `.no-print` class to satisfy the print-safety contract.

### Ready for Proposal

Yes — the codebase state is pristine, and the exact files, changes, and test impacts have been fully mapped and verified.
