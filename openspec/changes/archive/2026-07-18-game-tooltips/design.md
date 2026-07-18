# Design: Game Tooltips

## Technical Approach
This design implements a hybrid canvas-DOM approach to display informational tooltips for nearby uncollected items (skills or NPCs). The game engine loop inside `init.ts` scans the Euclidean distance between the player and all uncollected collectibles at 60fps. If any item is within 40px, the closest item's logical position `(item.x, item.y)` is translated to viewport-relative screen coordinates `(screenX = item.x, screenY = item.y - camera.y)` and dispatched to the new `activeTooltipStore` Nanostores atom. A responsive, absolutely positioned HTML `TooltipOverlay.astro` component subscribes to this store, rendering a retro-styled NES card horizontally centered over the targeted item. When collected, or when the player moves out of range, the store resets to `null`, hiding the overlay.

## Architecture Decisions

| Option | Tradeoff | Decision |
|--------|----------|----------|
| **Tooltip UI Layer** | Canvas rendering: complex styling, lacks responsiveness; DOM overlays: easy styling, responsive, clean. | **DOM Overlay**: Create `TooltipOverlay.astro` rendering on top of the canvas, decoupled from the Core canvas rendering. |
| **Coordinate Updates** | Polling: laggy, unaligned; Hooked in Core loop: frame-by-frame synchronization. | **Core Loop Integration**: Update `activeTooltipStore` on every frame inside the `loop()` function in `init.ts`. |

## Data Flow
```
Player & Collectibles ──→ Proximity Check (init.ts) ──→ activeTooltipStore (store.ts)
                                                            │
                                                            ▼
                                                   TooltipOverlay.astro
```

## File Changes
* `src/modules/game/application/store.ts` (Modify): Export `activeTooltipStore` Nanostores atom and define `TooltipState`.
* `src/modules/game/infrastructure/init.ts` (Modify): Inside the RAF `loop()` function, scan uncollected items within 40px, translate camera coordinates, and set/clear `activeTooltipStore` accordingly. Clear the store immediately on collection.
* `src/modules/game/interface/components/organisms/TooltipOverlay.astro` (Create): Subscribes to `activeTooltipStore`, absolutely positions itself with `.no-print` and retro double-border styling, using localized data-attributes.
* `src/pages/index.astro` & `src/pages/[locale]/index.astro` (Modify): Render `<TooltipOverlay locale={locale} />` inside the layout next to other game HUD elements.

## Interfaces / Contracts
```typescript
// src/modules/game/application/store.ts
export interface TooltipState {
  id: string;
  type: 'skill' | 'npc';
  name: string;
  screenX: number;
  screenY: number;
}
export const activeTooltipStore = atom<TooltipState | null>(null);
```

## Testing Strategy
* **Unit Test**: In `store.test.ts`, assert `activeTooltipStore` initializes to `null`, updates correctly, and resets to `null`.
* **Integration Test**: In `init.test.ts`, mock player/collectibles positions, run the update loop, assert store updates correctly (closest first if multiple within range), and clears on collection or out-of-range.
* **E2E / Visual Test**: Run local dev, use Browser-MCP to navigate, approach a skill coin, verify horizontally centered floating tooltip renders, disappears on collision, and is hidden in print-preview via `.no-print`.

## Threat Matrix
N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout
No migration required. The feature is activated statically.

## Open Questions
None.
