# GDD — Physics & Collision Foundation System

> **Priority**: Foundation  
> **Tier**: MVP  
> **Source GDD**: `design/gdd/systems-index.md`  
> **Target Branch**: develop  

---

## 1. Overview
The Physics & Collision Foundation System establishes the mathematical bedrock of *The Journey of Xoje*. It governs the numerical integration of forces (velocity, inertia, friction), enforces spatial boundaries (vertical clamping and toroidal wrapping), and detects overlapping circular areas for collectibles and item interactions. This module is written as a suite of pure, side-effect-free mathematical primitives to ensure predictable performance and deterministic unit testability.

---

## 2. Design Pillars & Player Feel
- **Grounded Momentum ("Inertial Glide")**: traversals are not twitchy or instant. When the player releases inputs, the physical engine applies decay forces, letting Xoje glide smoothly to a stop. This gives the avatar physical weight, momentum, and pleasant tactile resistance.
- **Toroidal Continuity**: the horizontal space is endless. Crossing a boundary wraps the player instantly to the other side without jarring stops, reflecting a continuous, seamless world.
- **Strict Vertical Clamping**: the vertical axis represents a linear, progressive career trajectory. The top and bottom are physical boundaries that halt motion, preventing out-of-bounds escapes.
- **Tactile Proximity**: collecting skills or interacting with colleagues should feel immediate and rewarding. Circular collision detection ensures that overlapping spheres trigger interaction instantly and reliably, regardless of the angle of approach.

---

## 3. Detailed Rules

### 1. Motion Integration (Euler Step with Friction)
The movement loop runs at the browser's refresh rate (driven by `requestAnimationFrame`) and integrates forces on every tick:
- Each frame, a pure input sampler compiles the user's directional acceleration vector $\mathbf{a} = (a_x, a_y)$.
- The velocity vector $\mathbf{v} = (v_x, v_y)$ integrates this input, subject to a constant decay coefficient $\mu$ (friction):
  $$\mathbf{v}_t = (\mathbf{v}_{t-1} + \mathbf{a}) \cdot \mu$$
- To prevent infinite sub-pixel sliding ("infinite creep"), an epsilon threshold $\epsilon = 10^{-3}$ is enforced. If the absolute velocity drops below this epsilon, the component is snapped to absolute zero.

### 2. Vertical Clamping
The vertical axis is capped at $[0, \text{MAP\_HEIGHT}]$.
- If Xoje's integrated Y position falls outside this boundary, it is clamped immediately to the nearest limit ($0$ or $\text{MAP\_HEIGHT}$).
- Upon vertical collision, any residual vertical velocity $v_y$ is reset to $0$ to simulate an inelastic collision with a solid ceiling/floor.

### 3. Horizontal Wrapping (Toroidal Space)
The horizontal axis wraps using a double-modulo operation:
- When $x < 0$ or $x \ge \text{canvas.width}$, the coordinates wrap around.
- A standard modulo operation `%` in JavaScript preserves the dividend's sign, meaning native `-5 % 800` would return `-5` instead of `795`. Therefore, we use a double-modulo formula to ensure that leftward wrap is correct and continuous:
  $$x_{\text{wrapped}} = ((x \pmod W) + w) \pmod W$$
- Upon horizontal wrap-around, any active movement trail buffer is immediately cleared to prevent rendering long horizontal line artifacts.

### 4. Circular Collision Detection (Overlap)
Collision between Xoje and a collectible skill bubble or NPC uses a radial overlap model:
- The player is modeled as a circle centered at $(p_x, p_y)$ with diameter $D_{\text{player}}$ (radius $R_p = D_{\text{player}} / 2$).
- The item is modeled as a circle centered at $(i_x, i_y)$ with radius $R_{\text{item}}$.
- A collision occurs if the Euclidean distance $d$ between the centers is less than the sum of their radii:
  $$d = \sqrt{(p_x - i_x)^2 + (p_y - i_y)^2} < R_p + R_{\text{item}}$$

---

## 4. Mathematical Model & Formulas

### Variables Dictionary

| Variable | Type | Default Value | Description |
|---|---|---|---|
| `x`, `y` | float | Dynamic | Player's logical center coordinates on the Canvas |
| `vx`, `vy` | float | `0.0` | Player's current horizontal and vertical velocities |
| `friction` | float | `0.85` | Velocity decay coefficient per frame ($\mu \in [0, 1]$) |
| `playerSize`| float | `14` | Diameter of the player's collision circle ($D_{\text{player}}$) |
| `MAP_HEIGHT`| float | Dynamic (e.g. `2016`) | Total vertical height of the career trajectory map |
| `epsilon` | float | `0.001` (`1e-3`) | Threshold below which velocity snaps to zero |

### 1. Velocity & Position Integration
$$\mathbf{v}_{t} = (\mathbf{v}_{t-1} + \mathbf{a}) \cdot \mu$$
$$\text{If } |v_x| < \epsilon \implies v_x = 0$$
$$\text{If } |v_y| < \epsilon \implies v_y = 0$$
$$p_t = p_{t-1} + \mathbf{v}_t$$

### 2. Double-Modulo Wrapping
$$x_{\text{wrapped}} = ((x \pmod w) + w) \pmod w$$
Where $w$ is the logical canvas width (`dims.w`).

### 3. Vertical Clamp
$$y_{\text{clamped}} = \max(0, \min(y, H))$$
Where $H$ is `MAP_HEIGHT`. If $y_{\text{clamped}} \neq y$, then $v_y = 0$.

### 4. Euclidean Radial Collision
$$\text{Collision} \iff \sqrt{(p_x - i_x)^2 + (p_y - i_y)^2} < \frac{D_{\text{player}}}{2} + R_{\text{item}}$$

---

## 5. Verification & Tests Contract

The physical primitives are verified by **`tests/game-physics.test.ts`** and **`tests/game-input.test.ts`**. Every mathematical formula must remain under strict unit test coverage to prevent regression during refactors:

- **Friction steps**: tests must assert velocity decay and verify the epsilon snap-to-zero.
- **Toroidal wrap**: tests must assert leftward/rightward wrap-around and verify correct double-modulo behavior for negative numbers.
- **Vertical clamp**: tests must verify that walking off the top or bottom limits clamps coordinates to $[0, H]$ and resets vertical velocity to $0$.
- **Collision overlap**: tests must verify radial collision calculations at multiple overlapping or tangent coordinates.
