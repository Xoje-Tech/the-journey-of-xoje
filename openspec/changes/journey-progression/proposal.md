# Proposal: Journey Progression

## Intent
Enable an immersive, interactive experience of Xoje's CV by replacing border wrapping with a linear vertical scrolling map. Skills and events from the CV are represented as collectibles across 4 chronological career biomes, tracked by a screen-space HUD (backpack) and an interactive category-based skill modal.

## Scope

### In Scope
- **Vertical scrolling camera**: Camera tracks player Y in world coordinate space `[0, MAP_HEIGHT]`. Clamps player Y at boundaries.
- **Collectible skills**: Items representing skills from `skills.json` spawned in corresponding career biomes.
- **Backpack HUD**: Interactive DOM button displaying the last collected skill and progress counter (e.g., '3/15').
- **Accessible modal**: Interactive HTML `<dialog>` or overlay listing all skills by category with clear lock/unlock status indicators.
- **Journey end CTA**: A final visual Call-to-Action section at the bottom of the map.

### Out of Scope
- Game persistence across tabs or sessions (in-memory state is sufficient).
- Audio and sound effects.
- Non-linear map branching or gravity-based platformer physics.

## Capabilities

### New Capabilities
- `journey-progression`: Handles camera scrolling, career biome spawning, collision-based skill collection, screen-space HUD tracking, and the interactive skill-matrix modal.

### Modified Capabilities
- `videogame-ui-game`: Disable vertical wrapping in favor of vertical boundary clamping and viewport camera translations.

## Approach
1. **Camera translation**: Shift rendering context context by `-cameraY` to track player Y.
2. **Spawning & Collisions**: Spawn 15 key skills based on career dates in 4 biomes. Detect physical overlap in the physics tick.
3. **DOM Overlays**: Absolute-positioned, fully accessible HTML components for the bag HUD and modal, updated via simple events dispatched from the canvas loop.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/game/types.ts` | Modified | Add camera, item, and inventory types. |
| `src/game/init.ts` | Modified | Integrate scroll clamping, collision loops, and state dispatching. |
| `src/game/render.ts` | Modified | Support camera-translated drawing and spawn rendering. |
| `src/components/CvDocument.astro` | Modified | Insert HUD and modal DOM elements. |
| `src/styles/screen.css` | Modified | Style backpack HUD and responsive modal layouts. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Render lag from too many assets | Low | Frustum-culling renders only active viewport items. |
| HUD/modal bleeding into print | Low | Enforce strict `.no-print` hiding on all overlay divs. |

## Rollback Plan
Run `git checkout .` to restore the pre-change baseline. Since screen overlays are modular, disabling them instantly restores full canvas/print fidelity.

## Success Criteria
- [ ] Camera scrolls vertically to follow the player and clamps at world bounds.
- [ ] Items collide and collect automatically on contact, triggering a HUD counter update.
- [ ] Bag overlay click toggles a structured, responsive skill modal.
- [ ] Print preview (Ctrl+P) remains 100% pristine and free of game artifacts.
