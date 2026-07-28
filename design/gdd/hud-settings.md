# GDD — HUD & Settings Panel System

> **Priority**: Presentation  
> **Tier**: MVP  
> **Source GDD**: None (Presentation)  
> **Target Branch**: develop  

---

## 1. Overview
The HUD and Settings Panel System manages the game's user interface, separating on-screen canvas-rendered debug telemetries from DOM-rendered interactive modals (Settings, Volume Sliders, and Gamepad status indicators). It coordinates skill counters, handles audio volume persistence, and provides gamepad modal navigation.

---

## 2. Player Fantasy
The player should have clear, non-intrusive feedback of their progress and diagnostic states. Collecting skills should feel like filling "bags" of professional competence, while accessing settings or adjusting volume should feel tactile, retro-styled, and highly responsive. The HUD's technical telemetry offers a "developer mode" aesthetic, celebrating the technical underneath of the portfolio.

---

## 3. Detailed Rules

### Canvas-Rendered Debug HUD
To keep the print contract stable and avoid DOM layering complexity, the HUD is rendered directly into the canvas using `ctx.fillText()`. It displays:
- **Line 1**: Project domain (`xoje.dev`).
- **Line 2**: Absolute player coordinates formatted with 1 decimal place.
- **Line 3**: Signed player velocities formatted with 2 decimal places (non-negative zero is normalized to `+0.00`).
- **Line 4**: Decoupled active input source and specific key/axis detail.
- **Line 5**: Rolled average FPS value.

### Settings Panel (DOM-Rendered)
- **Modal Toggle**: Accessing settings opens a native HTML `<dialog>` element styled as a pixelated Retro Modal. It is opened by clicking the on-screen settings icon or pressing the gamepad's `Start` button.
- **Volume Slider**: Controls the global audio volume. Values are reactive and bind directly to the Nanostores `volumeStore` (stored as an integer between `0` and `100`).
- **Gamepad Connection Monitor**: Polls `navigator.getGamepads()` at a low-frequency 2 Hz (`500 ms` interval) to toggle the connected status without competing with the 60fps physics loop.

### Skill Bags
- Collected technical, qualitative, and soft skills are sorted and displayed in three dedicated DOM-rendered HUD bags. The bags subscribe to `collectedSkillsStore` and display a transient toast animation whenever a new item in their category is collected.

---

## 4. Formulas

### Variables Dictionary

| Variable | Type | Default Value | Description |
|---|---|---|---|
| `px`, `py` | string | `0.0` | 1-decimal-place string representation of the player's position |
| `vx`, `vy` | string | `+0.00` | Signed, normalized 2-decimal-place velocity component |
| `avg_fps` | integer | `0` | 30-frame rolling average of frames per second |
| `volume` | integer | `70` | Global audio volume level on a 0-100 scale |

### Equation 1: Signed Velocity Formatting (formatSigned)
```text
if (v < 0) && (v > -0.005):
    formatted = "+0.00" (normalize negative zero)
else if (v >= 0):
    formatted = "+" + v.toFixed(2)
else:
    formatted = v.toFixed(2)
```

### Equation 2: Rolling Average FPS
```text
span_ms = timestamp[last] - timestamp[first]
avg_fps = round((1000 * (window_size - 1)) / span_ms)
```

---

## 5. Edge Cases

- **Negative Zero Telemetry Flicker**: Due to physics decay, friction calculations can yield negative velocities extremely close to zero (e.g., `-1e-17`), which normally render as `-0.00`. The HUD formatter normalizes these to `+0.00` to prevent visual flicker in the telemetry.
- **Print Mode Auto-Hide**: The DOM settings button, modal dialogs, and skill bags all carry the `.no-print` utility class. The print CSS contract hides these elements automatically (`display: none !important`) so that they never clutter paper prints.
- **Gamepad Modal Focus**: When the settings dialog is open, keyboard `Arrow` events and gamepad `D-pad` CustomEvents are redirected to modal navigation (selecting volume or close buttons), preventing character movement in the background.

---

## 6. Dependencies

- **Upstream Dependencies**:
  - `Physics & Collision`: Supplies the player coordinates and velocities.
  - `Movement & Input`: Supplies input details and polls the D-pad/Start buttons.
- **Downstream Dependencies**:
  - `Print Contract`: Relies on HUD components possessing the `.no-print` class.

---

## 7. Tuning Knobs

Governs HUD visuals and states.

| Parameter | Type | Default | Recommended Range | Description |
|---|---|---|---|---|
| `volume` | integer | `70` | `[0, 100]` | Global sound volume setting |
| `fpsWindow` | integer | `30` | `[10, 100]` | Number of frames for the rolling average FPS check |
| `pollInterval` | integer | `500` | `[100, 2000]` | Low-frequency polling speed (ms) for gamepad connectivity |

---

## 8. Acceptance Criteria

- [ ] **AC-1**: Canvas HUD draws pos, vel, input, and FPS in logical pixels.
- [ ] **AC-2**: Velocities near zero do not flicker with a negative prefix.
- [ ] **AC-3**: settings modal is fully responsive and navigates cleanly with gamepad D-pad.
- [ ] **AC-4**: volume level binds reactively to `volumeStore` on a 0-100 scale.
- [ ] **AC-5**: HUD, settings, and bags carry `.no-print` and are hidden on paper prints.
- [ ] **AC-6**: Debug HUD toggle key `D` toggles detailed telemetry lines on the canvas.
