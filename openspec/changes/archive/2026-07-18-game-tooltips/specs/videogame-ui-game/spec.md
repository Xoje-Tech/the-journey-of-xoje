# Delta Spec — videogame-ui-game

**Change**: game-tooltips
**Project**: the-journey-of-xoje
**Capability**: videogame-ui-game

This delta specification updates the `videogame-ui-game` capability to integrate the proximity detection scanning and store updates into the active game loop update frame.

---

## ADDED Requirements

### Requirement: REQ-ENGINE-LOOP-PROXIMITY-HOOK

The game engine's animation update loop (`loop()`) MUST scan the distance between the player and all uncollected collectibles (both skills and NPCs) on every frame when gameplay is active. If any uncollected item is within 40 logical pixels of the player, the system MUST calculate its viewport-relative coordinates (`screenX = item.x`, `screenY = item.y - camera.y`) and update `activeTooltipStore` with the target item's details. If no items are within 40px, the system MUST set `activeTooltipStore` to `null`.

#### Scenario: Active game loop scans proximity and updates store

- GIVEN the gameplay is active and the player is near an uncollected skill coin "TypeScript" (distance < 40px)
- WHEN the game loop executes the frame update
- THEN the engine MUST calculate the viewport-relative coordinates `(screenX, screenY)` of the skill coin
- AND it MUST update `activeTooltipStore` with the skill coin's id, type, name, and translated screen coordinates

#### Scenario: Active game loop clears store when out of range

- GIVEN `activeTooltipStore` is populated with a targeted NPC
- WHEN the player moves further than 40 logical pixels away from that NPC
- THEN the game loop MUST clear `activeTooltipStore` (setting it to `null`)
