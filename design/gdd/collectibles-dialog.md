# GDD — Collectibles & NPC Dialog System

> **Priority**: Feature  
> **Tier**: MVP  
> **Source GDD**: None (Feature)  
> **Target Branch**: develop  

---

## 1. Overview
The Collectibles and NPC Dialog System manages the player's core progression loop, regulating how they collect skill items scattered across the vertical map and interact with bilingual NPC (Non-Player Character) colleagues (including Héctor, Laura, Dani, Marcos, and historical figures like the Crupier and the Feriante with his medieval mojito stand). It handles collision checks, tooltip popups based on proximity, progressive text rendering (typewriter effect), and controller-to-DOM event handshakes.

---

## 2. Player Fantasy
The player should feel like an active professional, discovering and collecting skills as tangible achievements. Interacting with NPC colleagues should feel like a supportive team dialogue—revelatory, warm, and encouraging. The progressive typewriter rendering gives conversations a retro, classic RPG game feel, while the uninhibited gamepad/keyboard controls ensure conversations flow smoothly.

---

## 3. Detailed Rules

### Collectible Types
- **Normal Skill Collectibles**: Circular coins displaying category-specific colors and visual symbols (or generated shields) representing technical, qualitative, or soft skills.
- **NPC Collectibles**: Yellow coins displaying the NPC's initial (e.g., 'H' for Héctor). Colliding with them triggers a dialog rather than an instant collection.

### Interaction States & Handshake Loop
1. **Collision**: When the player overlaps with a collectible, the engine evaluates whether it has an `npcId`:
   - *No NPC*: The skill is instantly marked `collected: true` and dispatches a `'game-state-update'` CustomEvent to the DOM bags.
   - *NPC*: The engine pauses player physics (vx=0, vy=0) and triggers the dialog by writing to `activeDialogStore` with the appropriate locale dialogue.
2. **Dialogue Typewriter**: The DOM-mounted `DialogOverlay.astro` detects the store change, opens the overlay, and animates the dialogue text progressively.
3. **Advance (First Tap)**: Pressing `Space`, `gamepad-a`, or clicking the overlay box while the typewriter is running immediately stops the timer and reveals the complete dialogue text.
4. **Advance (Second Tap)**: Pressing `Space`, `gamepad-a`, or clicking while the typewriter is complete closes the dialog, sets `activeDialogStore: null`, and dispatches a `'dialog-dismissed'` event with the `skillId`.
5. **Collection**: The engine receives `'dialog-dismissed'`, marks the associated NPC collectible as `collected: true`, and fires `'game-state-update'` to trigger DOM skill-card unlocks.

### Proximity Tooltips
- If the player is within `40.0` px of any uncollected item (or NPC), a tooltip pops up displaying its name and type. The closest item's screen coordinates are mapped to `activeTooltipStore` so the DOM can draw the floating overlay.

---

## 4. Formulas

### Variables Dictionary

| Variable | Type | Default Value | Description |
|---|---|---|---|
| `p_x`, `p_y` | float | Dynamic | Absolute coordinates of the player center (px) |
| `item_x`, `item_y`| float | Configured | Absolute coordinates of the collectible center (px) |
| `p_size` | float | `14.0` | Player's bounding circle diameter (px) |
| `item_radius` | float | `12.0` | Collectible's bounding circle radius (px) |
| `char_speed` | integer | `30` | Progressive typewriter speed (milliseconds per character) |
| `proximity_dist` | float | `40.0` | Proximity range to trigger a floating tooltip popup |

### Equation 1: Circular Collision Check
```text
collision_active = sqrt((p_x - item_x)^2 + (p_y - item_y)^2) < (p_size / 2 + item_radius)
```

### Equation 2: Proximity Tooltip Check
```text
is_near = sqrt((p_x - item_x)^2 + (p_y - item_y)^2) < proximity_dist
```

### Equation 3: Typewriter Progression Length
```text
rendered_chars_count = elapsed_time / char_speed
```

---

## 5. Edge Cases

- **Immediate Dialog Skip**: Pressing `gamepad-b` while a dialogue is active immediately bypasses the progressive typewriter animation and dismisses the dialog in a single frame, unlocking the skill and releasing player focus.
- **Multiple Nearby Tooltips**: If the player is near more than one uncollected item, the proximity scanner calculates Euclidean distance for all candidates and activates the tooltip ONLY for the single closest item.
- **Race Condition (Dialogue Overlaps)**: If the player moves near another NPC while a dialogue is currently active, the new dialogue trigger is strictly blocked until `activeDialogStore` is reset to `null`.
- **E2E Automation Hook**: The `activeDialogStore` is exposed as `window.__heroDialogStore` in the browser context, enabling Playwright test scripts to directly drive and dismiss dialogue flows without needing physical keyboard pathwalks.

---

## 6. Dependencies

- **Upstream Dependencies**:
  - `Physics & Collision`: Supplies `checkCollision` and player position coords.
  - `Biome Engine`: Supplies the authoritative NPC configurations (`NPCS` array).
- **Downstream Dependencies**:
  - `HUD & Settings Panel`: Receives the `'game-state-update'` CustomEvent to increment bags and animate skill cards.

---

## 7. Tuning Knobs

Governs conversational and tooltip parameters.

| Parameter | Type | Default | Recommended Range | Description |
|---|---|---|---|---|
| `charSpeed` | integer | `30` | `[10, 100]` | Milliseconds between typewriter characters |
| `proximityRange` | number | `40` | `[20, 100]` | Proximity range in pixels to trigger tooltips |
| `npcCoinRadius` | number | `12` | `[8, 20]` | Bounding circle radius of NPCs and skills |

---

## 8. Acceptance Criteria

- [ ] **AC-1**: Colliding with a skill item instantly collects it and dispatches `'game-state-update'`.
- [ ] **AC-2**: Colliding with an NPC stops player movement and opens the bilingual dialogue overlay.
- [ ] **AC-3**: Conversation characters animate sequentially at a rate of 1 char per `30` ms.
- [ ] **AC-4**: Pressing Space or Gamepad A while typewriter is active instantly reveals full text.
- [ ] **AC-5**: Pressing Space or Gamepad A after typewriter is complete dismisses dialogue and collects the NPC coin.
- [ ] **AC-6**: Pressing Gamepad B at any point dismisses the active dialog immediately.
- [ ] **AC-7**: Tooltip appears when a player is within 40px of any uncollected item.
