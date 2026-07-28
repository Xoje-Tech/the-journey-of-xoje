# GDD — Biome Engine & Map Scrolling System

> **Priority**: Core  
> **Tier**: MVP  
> **Source GDD**: None (Core)  
> **Target Branch**: develop  

---

## 1. Overview
The Biome Engine is the structural backbone of the career traversal, organizing the game map as a vertical, chronological progression of career "biomes" (LCS Robotics, Crmble, Twinny, and RIDE ON). It derives total map height dynamically, spawns skill collectibles and NPCs using biome-relative offsets, manages tileable backgrounds without vertical stitching seams, and implements vertical camera scrolling that centers on the player.

---

## 2. Player Fantasy
The player should feel like they are embarking on a vertical journey through time, climbing upwards (or diving downwards) through different eras of professional growth. Each biome possesses its own distinctive visual style, background illustration, and friendly NPC colleagues. The smooth vertical scrolling makes the transition between different career milestones feel fluid, continuous, and connected.

---

## 3. Detailed Rules

### Biome Specifications
The world map consists of 4 stacked career biomes, each exactly 1,000 px tall (total vertical height = 4,000 px).
- **LCS Robotics** (y-range: `[0, 1000]`): Core automotive engineering theme, featuring Héctor (NPC).
- **Crmble** (y-range: `[1000, 2000]`): Frontend UI component theme, featuring Laura (NPC).
- **Twinny** (y-range: `[2000, 3000]`): Fullstack Angular/DDD theme, featuring Dani (NPC).
- **RIDE ON** (y-range: `[3000, 4000]`): Quality, TDD, and Astro/Vue theme, featuring Marcos (NPC).

### Spawning and Coordinates
- **Relative Authoring**: All collectibles (skills and NPCs) and static decorations are authored with a relative `yOffset` in `[0, biome.height]`.
- **World Y Resolution**: At spawn time (`buildCollectibles`), the engine calculates the absolute world Y coordinate of each entity by accumulating the heights of all preceding biomes.

### Camera Tracking & Culling
- **Vertical Camera Centering**: The viewport's camera Y coordinate tracks the player's vertical position, centering the player vertically in the middle of the screen.
- **Frustum Culling**: To prevent rendering bottlenecks, only biomes, decorations, and collectibles that overlap with the current viewport `[camera.y, camera.y + viewportHeight]` are rendered. All others are culled.
- **Finished Line (Journey End CTA)**: A prominent finishing line and CTA message are rendered exactly 100 px above the bottom of the map (`MAP_HEIGHT - 100`) to celebrate the player reaching the end of the timeline.

---

## 4. Formulas

### Variables Dictionary

| Variable | Type | Default Value | Description |
|---|---|---|---|
| `biome_height` | float | `1000.0` | Vertical height of an individual biome (px) |
| `player_y` | float | `14.0` | Player's absolute world Y position (px) |
| `viewport_h` | float | Canvas logical height | Vertical dimension of the visible viewport (px) |
| `camera_y` | float | `0.0` | Viewport camera Y coordinate (px) |
| `map_height` | float | `4000.0` | Total map height derived from the sum of all biome heights |

### Equation 1: Map Height Derivation
```text
MAP_HEIGHT = sum(BIOMES[i].height)
```

### Equation 2: World Y Spawning (Absolute Conversion)
```text
world_y = sum(BIOMES[0...current_biome_index-1].height) + relative_yOffset
```

### Equation 3: Camera Tracking (Centered and Clamped)
```text
ideal_camera_y = player_y - (viewport_h / 2)
camera_y = max(0, min(ideal_camera_y, MAP_HEIGHT - viewport_h))
```

### Equation 4: Frustum Culling Condition (isWithinViewport)
```text
is_visible = (y + radius >= camera_y) && (y - radius <= camera_y + viewport_h)
```

---

## 5. Edge Cases

- **Dynamic Resize**: Upon window resize, the derived `MAP_HEIGHT` remains unchanged, but the vertical camera clamp ranges are re-evaluated using the new viewport height to prevent displaying areas beyond the top/bottom boundaries of the map.
- **Camera Offset Overshoot**: If the player is located near the very top of the map (`player_y < viewport_h / 2`), the camera Y clamps strictly to `0` and ceases scrolling. If they are near the bottom of the map, the camera clamps to `MAP_HEIGHT - viewport_h`.
- **Double Translate Prevention**: World-space draw helpers (`drawBiomes`, `drawCollectibles`, etc.) own their own coordinate translate operations (`ctx.save()`, `ctx.translate(0, -cameraY)`, `ctx.restore()`), preventing accidental multi-scrolling bugs.

---

## 6. Dependencies

- **Upstream Dependencies**:
  - `Physics & Collision`: Binds player Y coordinates to physics and bounds clamping.
- **Downstream Dependencies**:
  - `Collectibles & NPC Dialog`: Relies on biome boundary calculations to trigger dialogue and collections.
  - `HUD & Settings Panel`: Reads camera state to draw static screen-space HUD components.

---

## 7. Tuning Knobs

Governs map structure and bounds.

| Parameter | Type | Default | Recommended Range | Description |
|---|---|---|---|---|
| `biomeHeight` | number | `1000` | `[500, 2000]` | Logical height of each career biome |
| `ctaOffset` | number | `100` | `[50, 300]` | Distance from the bottom of the map for the CTA finishing line |

---

## 8. Acceptance Criteria

- [ ] **AC-1**: Viewport camera remains perfectly centered on the player Y unless clamped by map bounds.
- [ ] **AC-2**: Camera Y is strictly clamped to `[0, MAP_HEIGHT - viewport_h]` (no rendering of off-map void).
- [ ] **AC-3**: Collectible items spawn at the exact derived absolute world Y coordinate calculated from their relative biome `yOffset`.
- [ ] **AC-4**: Frustum culling successfully skips drawing of out-of-viewport collectibles and backgrounds.
- [ ] **AC-5**: Journey End CTA appears exactly 100 px above the bottom edge of the map.
