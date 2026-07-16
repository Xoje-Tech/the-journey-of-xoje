## Exploration: Journey Progression

### Current State
The videogame UI currently consists of a single viewport canvas (`#game-canvas`) where the player character moves in 2D space. The movement features inertial glide and wraps around the canvas boundaries (horizontal and vertical). Telemetry HUD is drawn directly on the canvas as simple lines of text in the top-left corner. No virtual camera, world map, or collision elements are currently present.

### Affected Areas
- `src/game/types.ts` — Define types for camera, collectibles, biome, inventory, and progression state.
- `src/game/init.ts` — Update game loop, handle scrolling, clamp movement instead of wrapping vertically, manage inventory, and handle collisions.
- `src/game/physics.ts` — Replace vertical wrapping with vertical clamping and add circular collision checking.
- `src/game/render.ts` — Render collectibles (skills), biome boundaries, the bottom CTA, and draw with camera translation.
- `src/components/CvDocument.astro` — Add a DOM overlay containing the interactive HUD (backpack/bag button) and modal elements.
- `src/styles/screen.css` — Style the backpack button and skill modal, ensuring responsive layouts and grid alignments.

### Approaches

#### 1. Map & Camera Scrolling
- **Approach A: 2D Canvas Viewport Translation**
  - Translate the 2D canvas context dynamically based on a calculated `cameraY` that tracks the player's vertical position in world space `[0, MAP_HEIGHT]`.
  - *Pros*: Standard game-loop camera architecture. Keeps all map drawing coordinates consistent in world space. Minimal impact on physics.
  - *Cons*: Must split coordinate calculations between world-space rendering (map/player) and screen-space rendering (if any on-canvas UI).
  - *Effort*: Medium
- **Approach B: Page Scrolling Anchor**
  - Make the canvas very tall and scroll the container element or window.
  - *Pros*: Zero camera code in canvas.
  - *Cons*: High memory footprint. Interferes with standard window/mouse event dispatching and clashes with the static CV document layout.
  - *Effort*: High
- *Recommendation*: Approach A.

#### 2. HUD Bag & Modal Overlay
- **Approach A: Pure Canvas HUD & Modal**
  - Draw the bag and the interactive modal window (groups, grid of items, lock/unlock states) using Canvas 2D text, shapes, and custom hit boxes.
  - *Pros*: Self-contained in the canvas.
  - *Cons*: High visual layout complexity, poor responsiveness, zero accessibility/screen-reader capability, and complex hit-testing for modal scrolling.
  - *Effort*: High
- **Approach B: DOM-based HTML/CSS Overlay**
  - Position a responsive absolute layout on top of the canvas container. Use a native `<dialog>` or `div` overlay for the modal, updated via custom events or a shared state from the game engine.
  - *Pros*: Trivial styling using CSS Grid/Flexbox, naturally responsive, highly accessible, and easily hidden from print output using the existing `.no-print` styling.
  - *Cons*: Requires brief coupling between game state and DOM (simple event dispatching on item collection).
  - *Effort*: Low-Medium
- *Recommendation*: Approach B.

### Risks
- **Rendering Performance**: Drawing deep linear maps with many collision points might lag.
  - *Mitigation*: Limit the world map height (e.g., 3000-4000px) and only render items currently within the viewport frustum (frustum culling).
- **Print Layout Pollution**: UI overlays might bleed into printed output.
  - *Mitigation*: Use the `.no-print` utility class on all overlay containers to completely strip HUD and modal elements from printed media.

### Ready for Proposal
Yes. The requirements are clear, the architectural constraints are known, and a pure Canvas-scrolling + DOM-overlay hybrid provides the cleanest design.