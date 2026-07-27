# Delta Spec — videogame-sprites-ai

**Change**: videogame-sprites-ai  
**Project**: the-journey-of-xoje  
**Doctrine**: project-doctrine v1.2 §12 (Clean Architecture, Separation of Concerns)

---

## 1. Capabilities

### `player-animation-states`

The player's visual state is determined by its velocity (`vx`, `vy`) and current facing direction.

- **Idle**: Triggered when the player is at rest (`vx === 0` and `vy === 0`). The sprite stays on Frame 0 (idle facing down) or the last walked direction's first frame.
- **Walk Down**: Triggered when `vy > 0` and vertical motion dominates. Loops through Frames 1 and 2.
- **Walk Up**: Triggered when `vy < 0` and vertical motion dominates. Loops through Frames 3 and 4.
- **Walk Left**: Triggered when `vx < 0` and horizontal motion dominates. Loops through Frames 5 and 6.
- **Walk Right**: Triggered when `vx > 0` and horizontal motion dominates. Loops through Frames 7 and 8.

### `player-frame-tick`

The active frame within an animation loops based on the accumulated elapsed time (`timeMs`).

- The animation speed should scale with the player's current speed (magnitude of velocity). At higher velocities, frames swap faster.
- Each walk animation consists of 2 alternating frames. The loop interval (duration of each frame) is dynamically calculated: `frameDuration = max(80, 240 - speed * 30)` in milliseconds.

### `player-animation-blink`

- Every 3 to 5 seconds, a blink overlay is rendered.
- The blink does not consume a spritesheet frame. It is rendered programmatically as an off-black horizontal line over the character's eye position for exactly 120 ms, layered on top of the active animation frame.

### `player-animation-dash`

- When the absolute speed (`|vx| + |vy|`) exceeds `4.0` logical px/frame, the character enters a "Dash Lean" state.
- Inside `drawFrame`, the canvas context is skewed/rotated slightly (by 8 degrees or ~0.14 radians) in the direction of velocity to give an organic sense of speed and momentum.

---

## 2. Scenarios

### Scenario 1: At rest triggers idle frame

- **Given** a player with `vx = 0` and `vy = 0`
- **When** `pickFrame` is called
- **Then** the returned state should specify the `idle` pose and use `frame = 0`

### Scenario 2: Walk Down dominates vertical movement

- **Given** a player with `vx = 0.5` and `vy = 2.0` (vertical dominates)
- **When** `pickFrame` is called
- **Then** the returned state should specify `walk-down` pose, looping between `frame = 1` and `frame = 2`

### Scenario 3: Walk Left dominates horizontal movement

- **Given** a player with `vx = -3.0` and `vy = 0.5` (horizontal dominates)
- **When** `pickFrame` is called
- **Then** the returned state should specify `walk-left` pose, looping between `frame = 5` and `frame = 6`

### Scenario 4: Frame duration scales with velocity magnitude

- **Given** a player walking slowly (`speed = 1.0`, frame duration ~210ms)
- **And** a player walking quickly (`speed = 4.0`, frame duration ~120ms)
- **When** time progresses by 150ms
- **Then** the slow player should remain on its first walk frame
- **And** the fast player should have advanced to its second walk frame

### Scenario 5: Dash Lean active under high velocity

- **Given** a player with `|vx| + |vy| = 5.2` (exceeds threshold of 4.0)
- **When** `pickFrame` or `drawPlayer` is evaluated
- **Then** the `dashLeanActive` flag should be true

### Scenario 6: Blink overlay is scheduled on top of active frame

- **Given** any active frame (e.g. `walk-right`, frame 8)
- **And** the current time is within the active blink window (`now - blinkStart < 120ms`)
- **When** rendering occurs
- **Then** the blink overlay is drawn on top of the active spritesheet frame, without altering the underlying frame index
