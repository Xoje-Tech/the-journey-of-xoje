# Delta for videogame-ui-game

## ADDED Requirements

### Requirement: REQ-PAUSE-ENGINE
The engine MUST subscribe to `isStartedStore` and freeze all updates (movement, inputs, animations, trails) when it becomes `false` after a game has started, keeping canvas rendering active. On `stop()`, the unsubscribe handler MUST be executed.

#### Scenario: Pause freezes gameplay
- GIVEN gameplay is active and moving
- WHEN the user clicks the HUD Pause button
- THEN `isStartedStore` MUST set to `false`
- AND engine calculations MUST freeze while canvas rendering continues

#### Scenario: Engine stop unsubscribes
- GIVEN the engine is running with a subscription to `isStartedStore`
- WHEN engine `stop()` is called
- THEN the system MUST unsubscribe from the store

### Requirement: REQ-PAUSE-HUD
A top-right HUD `PauseButton.astro` MUST set `isStartedStore` to `false` on click and carry `.no-print` to hide during print-preview.

#### Scenario: Pause button HUD interaction
- GIVEN the game is active
- WHEN the HUD pause button is clicked
- THEN `isStartedStore` MUST be set to `false`

#### Scenario: Print preview safety for HUD
- GIVEN the pause button is mounted
- WHEN the document is printed
- THEN the pause button MUST be hidden via `.no-print`

## MODIFIED Requirements

### Requirement: Movement with inertia and border wrap-around

The system SHALL apply velocity and friction to produce smooth sliding motion. When the player crosses horizontal boundaries (left or right), the player SHALL wrap around to the opposite edge using modular arithmetic. When the player reaches vertical world boundaries, the player's Y coordinate SHALL be clamped to `[0, MAP_HEIGHT]` and vertical velocity set to zero. The viewport camera Y position SHALL track the player's Y coordinate and clamp to `[0, MAP_HEIGHT - viewportHeight]`.
(Previously: When the player crosses any canvas boundary, the player wraps around to the opposite edge using modular arithmetic with no clamping or vertical camera tracking.)

#### Scenario: Acceleration from input
- GIVEN a movement input is held
- WHEN frames advance
- THEN the player's velocity increases and position updates smoothly along the input axis

#### Scenario: Deceleration after release
- GIVEN all inputs are released
- WHEN frames advance
- THEN the player SHALL continue moving with friction-based deceleration until velocity reaches zero

#### Scenario: Wrap at right edge
- GIVEN the player's x exceeds the canvas width
- WHEN the next frame is computed
- THEN the player reappears at the opposite (left) edge at the mirrored y

#### Scenario: Clamp at vertical boundaries
- GIVEN the player's Y coordinate approaches 0 or `MAP_HEIGHT`
- WHEN the next frame is computed
- THEN the player's Y coordinate SHALL be clamped to the boundary and vertical velocity SHALL be set to zero

#### Scenario: Viewport camera tracks player
- GIVEN the player moves vertically
- WHEN the player's Y coordinate changes
- THEN the viewport camera Y coordinate SHALL update to center the player vertically in the viewport, clamped to `[0, MAP_HEIGHT - viewportHeight]`

### Requirement: REQ-SPLASH-START
Clicking "Start Game" MUST trigger a smooth slide-up animation to dismiss the overlay and SHALL resume normal gameplay physics/inputs. Furthermore, if `isStartedStore` becomes `false` after starting, the overlay MUST slide back down smoothly, setting display to flex and forcing reflow via `offsetHeight` before removing `.slide-up`. Button labels MUST switch dynamically via HTML data-attributes.
(Previously: Clicking "Start Game" triggers a smooth slide-up to dismiss the overlay and resume physics/inputs.)

#### Scenario: Dismiss Overlay and Resume Physics
- GIVEN the Start Screen is active and gameplay is suspended
- WHEN the user clicks 'Start Game'
- THEN the overlay MUST slide up smoothly
- AND physics and inputs SHALL resume

#### Scenario: Start Screen slides down on pause with reflow
- GIVEN the game has started and is active
- WHEN `isStartedStore` becomes `false`
- THEN the Start Screen overlay MUST display again as `flex`
- AND a DOM reflow via `offsetHeight` MUST be forced before removing `.slide-up`
- AND the overlay MUST slide down smoothly without visual flickering

#### Scenario: Dynamic button text localization via data-attributes
- GIVEN the Start Screen is active
- WHEN the game state toggles from unstarted to paused
- THEN the button label MUST dynamically switch from "Start Game" (or localized equivalent) to "Resume Game" (or localized equivalent)
- AND translation strings MUST be retrieved via HTML data-attributes to prevent raw client-side dictionary access issues
