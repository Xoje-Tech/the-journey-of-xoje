# Delta for videogame-ui-game

## MODIFIED Requirements

### Requirement: Movement with inertia and border wrap-around

The system SHALL apply velocity and friction to produce smooth sliding motion. When the player crosses horizontal boundaries (left or right), the player SHALL wrap around to the opposite edge using modular arithmetic. When the player reaches vertical world boundaries, the player's Y coordinate SHALL be clamped to `[0, MAP_HEIGHT]` and vertical velocity set to zero. The viewport camera Y position SHALL track the player's Y coordinate and clamp to `[0, MAP_HEIGHT - viewportHeight]`. Until the Start Screen is dismissed, the canvas loop SHALL render the grid, idle player animations, and blinking, but MUST ignore velocity inputs and camera scrolling.
(Previously: The system applies velocity and friction for movement, clamps at vertical boundaries, wraps at horizontal boundaries, and tracks the player, with no suspended game loop before start screen dismissal.)

#### Scenario: Acceleration from input
- GIVEN movement input is held and the game has started
- WHEN frames advance
- THEN velocity increases smoothly along the input axis

#### Scenario: Deceleration after release
- GIVEN inputs are released and the game has started
- WHEN frames advance
- THEN the player SHALL decelerate to zero velocity

#### Scenario: Wrap at right edge
- GIVEN player x exceeds canvas width and the game has started
- WHEN next frame is computed
- THEN the player reappears at the left edge

#### Scenario: Clamp at vertical boundaries
- GIVEN player Y approaches 0 or `MAP_HEIGHT` and the game has started
- WHEN next frame is computed
- THEN player Y SHALL be clamped and vertical velocity set to zero

#### Scenario: Viewport camera tracks player
- GIVEN the player moves vertically and the game has started
- WHEN player Y changes
- THEN viewport camera Y SHALL update to center the player

#### Scenario: Suspended loop renders but ignores inputs
- GIVEN the page has loaded and Start Screen is active
- WHEN frames advance
- THEN the canvas SHALL render grid, idle animations, and blinking
- AND player inputs and camera scrolling MUST be ignored

#### Scenario: Resume physics after dismissal
- GIVEN the Start Screen is active and gameplay suspended
- WHEN the Start Screen is dismissed
- THEN player inputs and camera scrolling SHALL resume normal operations
