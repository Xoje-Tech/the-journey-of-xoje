## Exploration: Game Pause/Menu Button

### Current State

Currently, the game supports an initial "Start Screen" (`StartScreen.astro`) overlay. When the user clicks the "Start Game" button, `isStartedStore` (defined in `src/game/store.ts`) is set to `true`. This unfreezes the game engine loop in `src/game/init.ts` via its `start()` handle, and triggers a CSS slide-up transition on `StartScreen.astro` that culminates in setting `display: none` on the overlay.

However, there is currently no pause mechanism or Pause button during gameplay. Once `isStartedStore` is `true`, it remains `true` forever. If we pause the game (i.e. setting `isStartedStore` to `false`), the start screen has no logic to slide back down and show the menu, and the game engine loop has no subscription to freeze the update states (physics, inputs, trails) dynamically. Furthermore, there is no Pause button in the gameplay HUD.

### Affected Areas

- `src/game/store.ts` — already contains `isStartedStore`, which will serve as the core state driver for pausing (toggled between `true` and `false`).
- `src/game/init.ts` — needs to subscribe to `isStartedStore` to dynamically freeze and unfreeze updates (physics, input sampling, trail updates, animations) when paused, while continuing to render the background, biomes, collectibles, and trail on the canvas.
- `src/components/game/StartScreen.astro` — needs to support sliding back down (removing `.slide-up` and setting `display: flex`) when `isStartedStore` becomes `false` after active play. It should also dynamically change the "Start Game" button label to "Resume Game" / "Reanudar Juego" when the game has started once, adhering to the DevXoje Criteria by passing localized labels via HTML data attributes rather than hardcoding.
- `src/components/game/PauseButton.astro` — a new Astro component representing the retro-styled Pause button in the gameplay HUD (positioned top-right, left of the `BackpackButton`).
- `src/pages/[locale]/index.astro` — needs to mount the new `PauseButton.astro` component.
- `src/i18n/ui.es.json` & `src/i18n/ui.en.json` — needs new translation keys for `"pauseButton"` and `"resumeGame"`.
- `src/styles/print.css` — print-safety is achieved by adding the existing `.no-print` class to the new Pause button's container, ensuring it is hidden in print-preview PDFs.

### Approaches

1. **Reactive Store Integration (Recommended)** — Subscribe to `isStartedStore` inside `init.ts` to toggle an `isPlaying` state.
   - **Pros:**
     - Unified source of truth: `isStartedStore` manages the active state for the engine, start overlay, and Pause button.
     - Preserves existing test compatibility: `handle.start()` remains fully backward-compatible and simply sets `isStartedStore.set(true)`.
     - Zero extra dependencies or complex API surface.
     - Keeps the rendering active so the frozen game state is visible behind the paused overlay.
   - **Cons:**
     - Requires managing a subscription inside `init.ts` which must be unsubscribed in `stop()` to prevent memory leaks.
   - **Effort:** Low-Medium

2. **Parallel State Variable & Manual Handle Calls** — Add explicit `pause()` and `resume()` methods to the returned `GameHandle` and invoke them manually from a viewport event listener.
   - **Pros:**
     - Avoids importing `nanostores` directly inside `init.ts`.
   - **Cons:**
     - Introduces parallel state between the handle and `isStartedStore`.
     - Susceptible to state desynchronization if UI components and engine get out of sync.
     - Increases coupling between components and the global `window.gameHandle`.
   - **Effort:** Medium

### Recommendation

Approach 1 (Reactive Store Integration) is highly recommended. It enforces a single source of truth (`isStartedStore`) across the UI layer and game engine, minimizes event-listener spaghetti, keeps rendering alive while frozen, and fully maintains backward compatibility with the existing vitest suite.

### Risks

- **Transition/Layout Flickering:** When `StartScreen` slides back down, setting `display: flex` and removing `.slide-up` simultaneously in the same frame can bypass the CSS transition in some browsers. To prevent this, we must force a DOM reflow (e.g. reading `startScreen.offsetHeight`) right after restoring display and before removing the class.
- **Memory Leaks:** The `isStartedStore.subscribe` callback in `init.ts` must return its unsubscribe function, and it must be explicitly invoked inside the game handle's `stop()` method.
- **Animation/Blink Glitches:** To prevent the player's sprite sheets and blinking animations from continuing to animate or blink while frozen, we must pass `0` delta-time and disable blink-activation inside `updateAndDraw` during the pause state.

### Ready for Proposal

Yes — the codebase is extremely clean, 105/105 tests are passing, and typecheck is 100% green. The recommended approach is low-risk and perfectly aligned with the DevXoje Criteria, Astro 6 paradigms, and print contract standards. The next step is to create the Proposal phase (`sdd-propose`).
