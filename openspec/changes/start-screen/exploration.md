## Exploration: Start Screen

### Current State

Currently, the website initializes the HTML5 canvas game automatically upon page load inside `src/layouts/CvLayout.astro` calling `init()`. The game starts immediately with active gameplay, spawning the player character at the top-center of the canvas. The user is immediately thrown into movement, and the camera follows the player down the map as they move. There is no splash or start screen.

### Affected Areas

- `src/layouts/CvLayout.astro` — Initializes the game canvas. Needs to coordinate showing/hiding the start screen UI or passing configuration parameters to `init()` to delay active gameplay.
- `src/components/CvDocument.astro` — Holds the screen HTML overlays (like the backpack overlay and skill modal). Needs to house the Start Screen HTML structure and button elements.
- `src/styles/screen.css` — Holds CSS layouts for screen-based elements. Needs styling for the Start Screen splash overlay, responsive button layouts, hover effects, and fade-out transition animations.
- `src/game/init.ts` — The game loop initializer. Needs to support starting the game in a suspended "attract" state (grid background renders and the player character runs idle animations/blinks, but physics updates, player inputs, and camera scrolling are disabled) until explicitly started.
- `src/game/types.ts` — Game config/state types. Needs options to pass a starting state or a start trigger to the game handle.

### Approaches

1. **HTML DOM-Based Start Screen Overlay (Recommended)**
   - **Description**: Build the Start Screen as an HTML overlay overlaying the canvas (`<div id="start-screen" class="no-print">`) in `CvDocument.astro`. The game loop is initialized immediately in a suspended state. Clicking "Start Game" initiates a fade-out animation on the overlay, sets its display to `none`, and calls a `.start()` function on the game handle to activate input and physics.
   - **Pros**:
     - Outstanding accessibility: interactive elements use semantic HTML buttons and are fully discoverable by screen readers.
     - Extremely clean styling, responsiveness, hover animations, and localized copy via Astro's i18n framework.
     - Clear architectural separation: once gameplay starts, the overlay is hidden/removed, leaving 100% of render resources to the canvas.
   - **Cons**:
     - Requires simple event/closure coordination between the DOM and the Canvas game handle.
   - **Effort**: Low-Medium

2. **Canvas-Rendered Start Screen**
   - **Description**: Render the entire Start Screen (text, background effects, and interactive buttons) directly on the Canvas 2D context in `src/game/init.ts`. This requires detecting click positions inside the game loop to trigger state changes.
   - **Pros**:
     - Completely self-contained within the canvas rendering pipeline.
   - **Cons**:
     - Poor accessibility: screen readers cannot detect canvas-drawn elements unless duplicate fallback DOM nodes are maintained.
     - Highly tedious layout, responsive scaling, hover state detection, and button styling implemented manually in Canvas 2D code.
     - Harder to localize via standard i18n JSON files.
   - **Effort**: High

### Recommendation

Approach 1 (HTML DOM-Based Start Screen Overlay) is strongly recommended. It aligns with the existing architecture (the backpack HUD and skill matrix modal are already styled DOM overlays), ensures native accessibility, supports effortless Astro localization, and allows rapid, robust styling using standard CSS.

### Risks

- **Print Leakage**: The Start Screen HTML structure must have the `.no-print` class applied and be thoroughly hidden during media-print render, preventing visual bleed into the Harvard-style CV printout.
- **Input Bleed**: Key presses or mouse clicks meant for the Start Screen must not propagate and move the player character in the background before the game starts.
- **Initialization Race**: The game loop must start in a locked, non-moving state so that resizing or focus events before clicking "Start Game" do not cause player drift or camera offset shifts.

### Ready for Proposal

Yes — The proposed architecture is clear, standard, and maintains all baseline constraints.
