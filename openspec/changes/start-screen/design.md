# Design: Start Screen

## Technical Approach

Introduce a screen-only splash overlay `#start-screen` inside `CvDocument.astro`. Upon loading, the game's physics, input polling, and camera tracking are frozen, while the background and the player's idling/blinking sprite continue rendering to make the page feel alive. Clicking **Start Game** triggers an hardware-accelerated CSS transition and signals the game engine via `start()`. Clicking **Download CV** runs `window.print()`. Interactive settings and controls guide modals are available. All overlays carry the `.no-print` utility class.

## Architecture Decisions

### Decision: Suspension of Game Loop State

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Full loop freeze (`cancelAnimationFrame`) | Canvas is totally static; player and background animations freeze, appearing dead. | Rejected |
| Conditional update in loop (Run loop, skip physics) | Standard rendering (grid, biomes, idle spritesheet) runs, but inputs/physics freeze. | **Selected** |

**Rationale**: We want the player character to blink and stand idle, and background elements to render, so the splash screen feels organically active before full controls are unlocked.

### Decision: Overlay Transition Mechanics

| Option | Tradeoff | Decision |
|--------|----------|----------|
| JS-driven position animation | CPU heavy, prone to stuttering, relies on JS frame timing. | Rejected |
| Hardware-accelerated CSS transition (`transform`) | Performs beautifully at 60fps; clean division of styles and behavior. | **Selected** |

**Rationale**: Transitioning `translateY(-100%)` with a `cubic-bezier(0.25, 1, 0.5, 1)` solid ease over 600ms is highly performant. A standard `transitionend` event listener sets `display: none` after completion.

## Data Flow

```
[Page Load] ──→ init() called with started=false
  │
  ├─► Game Loop Running: Renders static background + Idle/Blink Player
  │
  └─► [Start Screen Overlay Active]
        │
        ├──► User clicks "Settings" ─────────► [Settings Modal Opens] (polls gamepads)
        ├──► User clicks "Controls Guide" ───► [Controls Modal Opens]
        ├──► User clicks "Download CV" ──────► Executes window.print()
        │
        └──► User clicks "Start Game"
               │
               ├──► CSS transition (.slide-up) moves overlay up 100%
               ├──► Call handle.start() ──► started = true (unlocks input & physics)
               └──► "transitionend" fires ──► Overlay gets display: none
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/game/types.ts` | Modify | Update `GameHandle` interface to expose the `start()` function. |
| `src/game/init.ts` | Modify | Add `started: boolean = false` state and export `start()` inside `init()`. Skip input polling, physics updates, collisions, trail updates, and camera motion in `loop()` when `!started`. |
| `src/components/CvDocument.astro` | Modify | Add `#start-screen` overlay and sub-modals. Wire "Start Game", "Print", "Settings", and "Controls" click handlers. Monitor gamepad connection status dynamically. Controls guide displays an SVG silhouette of a retro NES controller with pointer lines mapping keyboard/mouse and gamepad inputs. |
| `src/styles/screen.css` | Modify | Style `#start-screen`, modals, sliders, retro-buttons (zero rounded corners, 2px border, block shadow), the `.slide-up` class, and the NES controller SVG silhouette background/indicators. |

## Interfaces / Contracts

```typescript
// src/game/types.ts
export interface GameHandle {
  stop(): void;
  getFps(): number;
  start(): void; // Unlocks active gameplay, input polling, and physics
}
```

```typescript
// src/game/init.ts return contract
return {
  stop() { ... },
  getFps,
  start() {
    started = true;
  }
};
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `init()` return shape | Assert returned handle matches updated `GameHandle` structure with `start` function. |
| Integration | Suspended physics | Assert loop does not change player positions or process inputs when `started === false`. |
| Integration | Activation trigger | Call `start()` and assert that player velocities, inputs, and coordinates begin updating. |

## Threat Matrix

`N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.`

## Migration / Rollout

No migration required.

## Open Questions

None.
