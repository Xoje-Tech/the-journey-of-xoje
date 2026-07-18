# game-tooltips Specification

## Purpose

The game-tooltips capability displays floating informational overlays above nearby uncollected items (skills or NPCs) on the game viewport, helping players identify collectibles before acquiring them.

## Requirements

### Requirement: REQ-TOOLTIP-PROXIMITY-SCAN

The system MUST continuously calculate the Euclidean distance between the player's coordinate `(player.x, player.y)` and the logical coordinate `(item.x, item.y)` of all uncollected collectibles (skills and NPCs) during active gameplay. An item SHALL be considered eligible for a tooltip if and only if the distance is strictly less than 40 logical pixels. If multiple items are within range, the closest item MUST be targeted.

#### Scenario: Player approaches uncollected skill coin

- GIVEN a player is in the active game world with an uncollected "Astro" skill coin at `(100, 3200)`
- WHEN the player moves to `(100, 3180)` (distance 20px, which is < 40px)
- THEN the proximity detection engine MUST target the "Astro" skill coin

#### Scenario: Closest item targeted when multiple are in range

- GIVEN uncollected skill coins "Vue" and "Astro" are both within 40px of the player
- AND the player is closer to "Vue" than to "Astro"
- WHEN the proximity loop executes
- THEN the engine MUST target "Vue" as the active tooltip target

---

### Requirement: REQ-TOOLTIP-COORDINATES-TRANSLATION

The system MUST translate the target item's logical coordinate `(item.x, item.y)` to viewport-relative screen coordinates `(screenX, screenY)` by adjusting for the camera's current Y offset:
`screenX = item.x`
`screenY = item.y - camera.y`
The system MUST dispatch these screen coordinates along with the target's metadata to `activeTooltipStore`.

#### Scenario: Viewport scroll shifts tooltip coordinates

- GIVEN a targeted collectible item at logical coordinates `(200, 1500)`
- AND the viewport camera Y coordinate is `1200`
- WHEN the system translates coordinates for the active tooltip
- THEN `screenX` MUST be set to `200`
- AND `screenY` MUST be set to `300` (1500 - 1200)

---

### Requirement: REQ-TOOLTIP-STORE

The `activeTooltipStore` Nanostores atom MUST maintain the state of the currently targeted tooltip. The store SHALL hold either `null` (no target) or an object containing the target's unique ID, item type ('skill' or 'npc'), translated `screenX` and `screenY` coordinates, and localized label/dialogue key. When the targeted item is collected, the store MUST immediately update to `null`.

#### Scenario: Tooltip store cleared upon item collection

- GIVEN `activeTooltipStore` is populated with a targeted "TypeScript" skill coin
- WHEN the player collides with the skill coin and triggers its collection
- THEN the system MUST immediately update `activeTooltipStore` to `null`

---

### Requirement: REQ-TOOLTIP-OVERLAY-UI

The HTML-based `TooltipOverlay.astro` component MUST subscribe to `activeTooltipStore` and render a floating card above the targeted item. The floating card MUST be absolutely positioned dynamically using the `screenX` and `screenY` values from the store, centered horizontally and offset vertically above the target. The card MUST feature a retro NES double-border CSS visual design, and MUST include the `.no-print` CSS class to hide during print preview.

#### Scenario: Tooltip card absolute positioning

- GIVEN `activeTooltipStore` is updated with `screenX = 250` and `screenY = 400`
- WHEN the `TooltipOverlay` component renders
- THEN the floating card overlay MUST be absolutely positioned at the calculated screen coordinates
- AND its center MUST align horizontally with `screenX`

#### Scenario: Print preview safety for tooltip

- GIVEN the `TooltipOverlay` component is rendered on screen
- WHEN the print preview or document print is triggered
- THEN the tooltip card MUST be hidden via `.no-print` class rules

---

### Requirement: REQ-TOOLTIP-LOCALIZATION

The floating card tooltip MUST display localized labels based on the active language locale (`es` or `en`). The localization strings MUST be fetched using HTML data-attributes to prevent raw client-side dictionary access issues and remain consistent with the site's overall translation approach.

#### Scenario: Tooltip displays localized Spanish label

- GIVEN the current language locale is Spanish (`es`)
- AND a skill coin with Spanish name translation "TypeScript" is targeted
- WHEN the tooltip card is rendered
- THEN the card text MUST show "TypeScript" (or localized Spanish equivalent) fetched from the translation attributes

#### Scenario: Tooltip displays localized English label

- GIVEN the current language locale is English (`en`)
- AND a skill coin with English name translation "TypeScript" is targeted
- WHEN the tooltip card is rendered
- THEN the card text MUST show "TypeScript" (or localized English equivalent) fetched from the translation attributes
