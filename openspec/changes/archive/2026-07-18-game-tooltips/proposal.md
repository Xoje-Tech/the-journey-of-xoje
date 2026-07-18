# Proposal: Game Tooltips

## Intent
Improve player UX by displaying helpful context for nearby collectible items (skill coins or NPCs) before collection, preventing blind acquisition and boosting historical storytelling.

## Scope

### In Scope
- Canvas proximity detection engine checking distance between player and uncollected items (range: 40px).
- `activeTooltipStore` Nanostores atom holding currently targeted item and its relative screen coordinates.
- HTML-based floating retro NES tooltip card overlay positioning itself dynamically above targeted items.
- Dynamic localized text fetching via data-attributes, supporting es/en.

### Out of Scope
- Render tooltips/dialog on canvas (hybrid approach avoids this).
- Interactive tooltip click triggers (purely informational; collection remains touch-based).

## Capabilities

### New Capabilities
- `game-tooltips`: Canvas-to-DOM coordinates translation, proximity scanning loop, floating retro-styled overlay.

### Modified Capabilities
- `videogame-ui-game`: Hook game loop to update proximity targets per frame and dispatch coords to store.

## Approach
The game loop running in `init.ts` scans distance between player and uncollected skills/NPCs. If distance < 40px, the engine calculates viewport-relative coordinates `(screenX, screenY) = (item.x, item.y - camera.y)` and updates `activeTooltipStore`. A custom `TooltipOverlay.astro` component subscribes to the store, dynamically positions itself absolutely on top of the viewport, and renders a localized retro NES card with double-border CSS styling.

## Affected Areas
- `src/modules/game/application/store.ts` — Add `activeTooltipStore`.
- `src/modules/game/infrastructure/init.ts` — Add proximity check loop & coordinates translation.
- `src/modules/game/interface/components/organisms/TooltipOverlay.astro` — Create the HTML NES tooltip.
- `src/pages/[locale]/index.astro` — Mount the new `TooltipOverlay` component.

## Risks
- Viewport bounds overflow (Low): Tooltip extends outside canvas. Mitigate by clamping overlay CSS offsets.
- Performance overhead (Low): High-frequency proximity calculation. Mitigate by running checks on a throttled loop or only checking nearby biomes.

## Rollback Plan
- Code rollback: `git revert` the merge commit and redeploy. Alternatively, disable via `TOOLTIPS_ENABLED=false` env.
- Schema/Data rollback: None. To prevent incidents, never run database reset or migration commands in production.
- Verification: Perform a smoke test ensuring approaching a coin renders the HTML overlay and moving away hides it.

## Dependencies
- None.

## Success Criteria
- [ ] Tooltip overlays render automatically when player is within 40px of any uncollected skill/NPC.
- [ ] Tooltip overlays disappear instantly when player moves beyond 40px or collects the item.
- [ ] Overlay uses HTML/CSS for retro NES double-border theme and fits screen/print contracts (not printed).
