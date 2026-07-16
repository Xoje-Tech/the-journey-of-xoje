# Delta for videogame-ui-game

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
