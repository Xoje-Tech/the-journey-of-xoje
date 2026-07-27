# Proposal: Start Screen

## Intent

Provide an engaging retro Start Screen before active gameplay begins, offering users buttons to start the game, download the CV, configure settings (including gamepad check), and view a controls guide, without breaking the print contract.

## Scope

### In Scope

- Start Screen overlay (`#start-screen`) styled in `screen.css` with a retro title: "The Journey of Xoje".
- Smooth slide-up transition animation when dismissing the overlay.
- Suspended game state in `init.ts` on page load (renders grid, idle animations, and blinking, but freezes input and scroll physics).
- Four buttons:
  - **Start Game**: Triggers the slide-up transition and unlocks gameplay.
  - **Download CV**: Invokes `window.print()` directly.
  - **Settings (Ajustes)**: Opens an overlay to adjust volume (placeholder/state) and check gamepad connectivity/usability status.
  - **Controls Guide (Guía de Controles)**: Shows a visual overlays guide for keyboard, mouse, and gamepad.

### Out of Scope

- Real audio playback implementation (volume controls only modify state).
- Gamepad-specific overlay menu keyboard navigation.

## Capabilities

### New Capabilities

- `start-screen`: Introducing a splash overlay with Start, CV download, Settings, and Controls.

### Modified Capabilities

- `videogame-ui-game`: Prevent inputs and camera physics from updating until the Start Screen is dismissed.

## Approach

Implement an HTML DOM overlay (`#start-screen`) layered above `#game-canvas` using CSS `z-index`. Clicking "Start Game" adds a `.slide-up` CSS class to the overlay and calls `.start()` on the game handle. "Download CV" calls `window.print()`. "Settings" and "Controls" open modal/dialog panels. Game loop stays suspended (skipping velocity integrations) until started.

## Affected Areas

| Area                              | Impact   | Description                                                            |
| --------------------------------- | -------- | ---------------------------------------------------------------------- |
| `src/components/CvDocument.astro` | Modified | Add Start Screen markup, buttons, and event listeners.                 |
| `src/styles/screen.css`           | Modified | Style Start Screen overlay, buttons, slide-up keyframes, and settings. |
| `src/game/init.ts`                | Modified | Support suspended state; export `.start()` to resume input/physics.    |
| `src/game/types.ts`               | Modified | Update game handle and input state interfaces.                         |

## Risks

| Risk        | Likelihood | Mitigation                                                    |
| ----------- | ---------- | ------------------------------------------------------------- |
| Print Bleed | Low        | Apply `.no-print` to all start screen and overlay elements.   |
| Input Leak  | Low        | Block keyboard/mouse polling in loop until `started` is true. |

## Rollback Plan

Revert changes via: `git checkout HEAD -- src/components/CvDocument.astro src/styles/screen.css src/game/init.ts src/game/types.ts`.

## Dependencies

None.

## Success Criteria

- [ ] Overlay displays "The Journey of Xoje" on page load; physics is frozen.
- [ ] "Start Game" slides the screen up smoothly, enabling player movement.
- [ ] "Download CV" opens browser's print interface.
- [ ] Settings panel displays active Gamepad connectivity status.
- [ ] Controls Guide panel visually displays keyboard/gamepad mappings.
