# videogame-ui-game Specification

## Domain: videogame-ui-game

On screen, the system SHALL hide the printable CV content and expose an interactive HTML5 Canvas 2D game with a player, grid background, and inertia-based movement.

### Requirement: Canvas surface and game loop

The system SHALL expose a Canvas element running a `requestAnimationFrame` loop that updates physics and re-renders at the display refresh rate.

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Initial mount | A user loads the page on screen, | the client-side script initializes, | the canvas covers the full viewport and the game loop has started. |
| Window resize | The game loop is running and the viewport dimensions change, | a resize event fires, | the canvas SHALL be re-initialized at the new dimensions without losing the player state. |
| Tab hidden | The browser tab becomes hidden, | the loop yields frames, | no errors occur and the loop resumes when the tab is visible again. |

### Requirement: Player character and grid background

The system SHALL render a visible player character and a regular grid background. The player SHALL start horizontally centered at the top of the canvas.

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Initial spawn | A fresh canvas, | the loop ticks once, | the player is drawn at top-center with a grid visible across the canvas. |
| Displacement feedback | The player has moved during play, | the next frame renders, | the grid SHALL remain visible and aligned to the canvas, communicating displacement. |

### Requirement: Movement with inertia and border wrap-around

The system SHALL apply velocity and friction to produce smooth sliding motion. When the player crosses any canvas boundary, the player SHALL wrap around to the opposite edge using modular arithmetic — no clamp.

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Acceleration from input | A movement input is held, | frames advance, | the player's velocity increases and the position updates smoothly along the input axis. |
| Deceleration after release | All inputs are released, | frames advance, | the player SHALL continue moving with friction-based deceleration until velocity reaches zero. |
| Wrap at right edge | The player's x exceeds the canvas width, | the next frame is computed, | the player reappears at the opposite (left) edge at the mirrored y, not clamped. |
| Wrap at bottom edge | The player's y exceeds the canvas height, | the next frame is computed, | the player reappears at the opposite (top) edge. |

### Requirement: Multi-input routing

The system SHALL accept Keyboard (WASD and Arrow keys), Gamepad (left stick axis + D-pad), and Mouse-click destination inputs. The Keyboard and Gamepad axes MAY be combined additively. A mouse click SHALL override a current keyboard/gamepad target.

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Keyboard movement | The user holds the right arrow key, | the loop polls input, | the player accelerates rightward. |
| Gamepad stick movement | A connected gamepad's left stick is tilted past the deadzone, | the loop polls input, | the player accelerates along the stick vector. |
| Gamepad stick at rest | The stick reports a value within the deadzone (0.15), | the loop polls input, | the input SHALL be treated as zero to prevent drift. |
| Mouse-click destination | The user clicks a point on the canvas, | the click is captured, | the player accelerates toward the click target and any prior keyboard/gamepad direction MAY be cleared. |
| D-pad input | A D-pad button is pressed, | the loop polls input, | the player accelerates along the corresponding axis. |

### Requirement: Pointer-event isolation between game and hidden CV

Pointer events on the canvas SHALL NOT bubble to or activate any hidden printable CV element.

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Click on game | The game canvas is visible and the printable CV is hidden, | the user clicks the canvas, | only game handlers fire; no hidden CV element is selected or focused. |