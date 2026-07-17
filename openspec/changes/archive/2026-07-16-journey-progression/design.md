# Design: Journey Progression

## Technical Approach

We will replace player vertical coordinate wrapping with vertical clamping to establish a linear absolute map of height 4000px (`MAP_HEIGHT`). The canvas will implement a camera translation of `-cameraY` to follow the player, while horizontal coordinate wrapping is maintained.

The vertical timeline maps 4 chronological career biomes corresponding to the player's roles:

1. **LCS Robotics** (Y: `[0, 1000]`)
2. **Crmble** (Y: `[1000, 2000]`)
3. **Twinny** (Y: `[2000, 3000]`)
4. **RIDE ON** (Y: `[3000, 4000]`) with a **Journey End CTA** at `y` near `MAP_HEIGHT`.

Exactly 15 key skills from `skills.json` are spawned statically as collectible circles. Collision is checked using 2D circle-overlap physics. When collided, the skill is set to `collected = true` and a `game-state-update` `CustomEvent` is dispatched.

An absolutely positioned HTML/CSS overlay inside `CvDocument.astro` listens to this event. It reactively updates the Backpack HUD (displaying last collected skill and a "X/15" counter) and the Accessible Modal (unveiling the skill cards and removing their locked status styling).

---

## Architecture Decisions

| Option             | Tradeoff                                                                                                                         | Decision                                                                                                                                           |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Camera Scroll**  | (a) Translate canvas 2D context via `ctx.translate(0, -cameraY)` vs (b) Page scrolling anchor (tall canvas inside scrolling div) | **(a)** Standard viewport translation. Keeps drawing coordinates consistent in world space without bloating memory or interfering with DOM events. |
| **HUD / Modal UI** | (a) Render everything in canvas vs (b) DOM-based absolute HTML overlays updated via `CustomEvent`                                | **(b)** DOM-based HTML overlays. Trivial styling, fully responsive, naturally accessible, and clean print-safety using `.no-print`.                |

---

## Data Flow

```
[Player Physics Tick]
         │ (Physics checks circular collision)
         ▼
[Item Collision Detected]
         │ (Sets item.collected = true)
         ▼
[Dispatch CustomEvent ("game-state-update")]
         │ (Pushes state payload to window)
         ▼
[DOM Event Listener (CvDocument.astro)]
         ├───→ Updates Backpack HUD Counter (e.g., "3/15")
         └───→ Updates Modal (Removes `.skill-locked` class for the skill ID)
```

---

## File Changes

| File                              | Action | Description                                                                                                    |
| --------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------- |
| `src/game/types.ts`               | Modify | Add `Camera`, `CollectibleItem`, `PlayerState`, and `GameStateUpdateEvent` interfaces.                         |
| `src/game/physics.ts`             | Modify | Add vertical coordinate clamping helper and circular collision logic.                                          |
| `src/game/render.ts`              | Modify | Render collectibles, biome borders, viewport-based frustum culling, and bottom CTA.                            |
| `src/game/init.ts`                | Modify | Implement clamp checks, item spawn setup, collection loops, and CustomEvent dispatch.                          |
| `src/components/CvDocument.astro` | Modify | Add backpack button, structured category-based skill modal (dialog/overlays), and CustomEvent listener script. |
| `src/styles/screen.css`           | Modify | Add HUD overlay layout, backpack button states, and modal CSS grid layout (with locked/unlocked styles).       |

---

## Interfaces / Contracts

```typescript
export interface Camera {
  y: number; // Viewport top coordinate in world-space [0, MAP_HEIGHT - viewportHeight]
}

export interface CollectibleItem {
  id: string; // Slugified name of the skill
  name: string;
  category: 'technical' | 'qualitative';
  biome: string;
  x: number;
  y: number;
  radius: number;
  collected: boolean;
}

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  collectedSkills: Set<string>;
}

export interface GameStateUpdateEventPayload {
  collectedCount: number;
  totalCount: number;
  lastCollected: string | null;
  unlockedId: string; // The ID of the item just collected to unlock in DOM
}
```

---

## Testing Strategy

| Layer           | What to Test             | Approach                                                                                       |
| --------------- | ------------------------ | ---------------------------------------------------------------------------------------------- |
| **Unit**        | Collision detection math | Assert `checkCollision` returns true/false for overlapping circles.                            |
| **Unit**        | Viewport frustum culling | Assert `isWithinViewport` correctly identifies items inside/outside camera bounds.             |
| **Unit**        | Boundary clamping        | Assert `clampPlayerY` prevents player coordinates from going beyond map vertical bounds.       |
| **Integration** | Event dispatching        | Verify `init` loop fires the `CustomEvent` with correct payload on collision.                  |
| **E2E**         | DOM reactivity & Print   | Verify overlay is completely hidden in Print Preview (`.no-print` verification in CSS bundle). |

---

## Threat Matrix

`N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.`

---

## Migration / Rollout

No migration required.

---

## Open Questions

- [ ] Should we display the biome boundaries visually on-screen as a subtle colored gradient or simple text labels?
