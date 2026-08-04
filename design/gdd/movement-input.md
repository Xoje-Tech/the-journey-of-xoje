# GDD — Physics, Movement & Input Traversal System

> **Priority**: Foundation | Core  
> **Tier**: MVP  
> **Source GDD**: None (Foundation)  
> **Target Branch**: develop  

---

## 1. Overview
The Physics, Movement and Input Traversal System is the core interface of the game, governing how the player navigates the vertical career map. It processes inputs from four modalities (keyboard, gamepad, mouse click, and touch tap), integrates physical forces (acceleration, inertia, friction), keeps the player within world boundaries, and updates trail and camera tracking.

---

## 2. Player Fantasy
The player should feel like a capable but physically grounded professional traveler. Movement is deliberate, possessing a pleasant inertia ("inertial glide") that makes traversal feel smooth and physically responsive. It is not twitchy or instant; it has weight and momentum. Navigating the world and collecting skills feels satisfying because of the player trail's fluid feedback.

---

## 3. Detailed Rules

### Movement States
- **Walk (Default)**: Pressing WASD, arrow keys, analog stick, or D-pad applies constant acceleration per frame.
- **Inertial Glide (Rest)**: When inputs are released, velocity decays over time due to friction until the player comes to a stop.
- **Click-to-Move**: Mouse clicks or touch taps on the canvas set a one-shot `mouseTarget`. The player accelerates towards this target until they enter the `ARRIVAL_RADIUS`.
- **Idle**: No inputs are detected and velocity is zero.

### Input Precedence (Highest to Lowest)
1. **Keyboard**: Keys like WASD and Arrows instantly clear any active `mouseTarget` (Keyboard overrides mouse).
2. **Gamepad D-Pad**: Discrete gamepad buttons override analog stick input and clear the active `mouseTarget`.
3. **Gamepad Analog Stick**: Left stick input above the deadzone clears the active `mouseTarget`. Values below the deadzone are ignored.
4. **Mouse / Touch (Pointer Events)**: Logical click/touch positions set a one-shot target. Mouse/touch input is ignored if any keyboard or gamepad button is pressed.

### World Boundaries and Wrapping
- **Horizontal Wrapping**: When the player crosses the left or right edges of the canvas, they instantly wrap to the opposite edge (modulo wrapping).
- **Vertical Clamping**: The player's vertical position is strictly clamped to `[0, MAP_HEIGHT]`. They cannot walk above the top of the map or below the bottom.

### Visual Polish
- **Motion Trail**: A ring buffer stores the last 14 player positions. Points fade linearly to zero opacity over 280 ms. The trail is immediately cleared if the player wraps horizontally.
- **Blink Animation**: The player's capsule blinks for 120 ms at a random interval between 3,000 and 5,000 ms.

---

## 4. Formulas

### Variables Dictionary

| Variable | Type | Default Value | Description |
|---|---|---|---|
| `x` | float | Center of viewport | Player's logical X coordinate on the canvas |
| `y` | float | `14.0` (player size) | Player's logical Y coordinate on the canvas |
| `vx` | float | `0.0` | Player's horizontal velocity in logical px/frame |
| `vy` | float | `0.0` | Player's vertical velocity in logical px/frame |
| `size` | float | `14.0` | Diameter of the player's circular collision boundary |
| `accel` | float | `0.6` | Acceleration applied while keys/joysticks are active (px/frame²) |
| `friction` | float | `0.92` | Inertial decay factor applied per frame (dimensionless coefficient) |
| `deadzone` | float | `0.15` | Minimum analog stick magnitude to register input |
| `arrival_radius` | float | `1.5` | Distance threshold (px) to consider a click target reached |
| `map_height` | float | `4000.0` | Total vertical map height (px) derived from biomes sum |
| `w` | float | Canvas client width | Logical width of the game viewport |
| `h` | float | Canvas client height | Logical height of the game viewport |

### Equation 1: Modulo Wrapping (Horizontal and Vertical fallbacks)
```text
next_x = ((x % w) + w) % w
next_y = ((y % h) + h) % h
```

### Equation 2: Friction Decay
```text
vx_next = vx * friction
vy_next = vy * friction
```

### Equation 3: Target Steering Vector (Mouse / Touch)
```text
dx = target_x - player_x
dy = target_y - player_y
dist = sqrt(dx^2 + dy^2)

if dist <= arrival_radius:
    clear_target()
    vx_input = 0
    vy_next = 0
else:
    vx_input = (dx / dist) * accel
    vy_input = (dy / dist) * accel
```

### Equation 4: Circular Collision Detection
```text
collision = sqrt((p.x - item.x)^2 + (p.y - item.y)^2) < (p.size / 2 + item.radius)
```

---

## 5. Edge Cases

- **Viewport Resizing**: When the window is resized, the canvas is scaled by `window.devicePixelRatio` for retina displays. The player's logical coordinates are preserved, and item/collectible positions are updated to align with the new widths while preserving their ratios (`xRatio`).
- **Tab Hidden (Visibility Change)**: If the document is hidden (`document.visibilitychange`), the game loop immediately pauses (unsubscribing from RAF) and preserves the player's full physics state. Loop resumes on focus.
- **Input Race Conditions**: If a keyboard key is pressed while the player is moving towards a mouse target, the keyboard input overrides the target and the target is permanently cleared.
- **Extreme Velocity**: Sub-agent TDD checks verify that extremely high velocities do not escape canvas boundaries or skip collectible collisions by wrapping.

---

## 6. Dependencies

- **Upstream Dependencies**:
  - `Astro 6 Engine Entry`: Binds canvas context and handles resize events.
- **Downstream Dependencies**:
  - `Biome Engine`: Reads player position to scroll camera viewport vertically.
  - `Collectible & NPC System`: Reads player position to trigger item collections and NPC dialog.

---

## 7. Tuning Knobs

These configurable variables govern the game feel and are registered in `entities.yaml`.

| Parameter | Type | Default | Recommended Range | Description |
|---|---|---|---|---|
| `gridSize` | number | `40` | `[20, 80]` | Logical size of grid background cell |
| `friction` | float | `0.92` | `[0.85, 0.99]` | How fast the player glides to a stop |
| `acceleration` | float | `0.6` | `[0.2, 1.5]` | Snappiness of keyboard and gamepad traversal |
| `deadzone` | float | `0.15` | `[0.05, 0.4]` | Deadzone for analog joysticks |

---

## 8. Acceptance Criteria

- [ ] **AC-1**: Player glides smoothly with a friction factor of `0.92`.
- [ ] **AC-2**: Releasing keys doesn't stop player instantly; they decelerate.
- [ ] **AC-3**: Keyboard inputs override click-to-move targets.
- [ ] **AC-4**: Crossing horizontal bounds wraps the player to the other side; trail is cleared.
- [ ] **AC-5**: Player's vertical position can never exceed `[0, MAP_HEIGHT]`.
