# Journey Progression Specification

## Purpose
Expose linear vertical gameplay with chronological career biomes, collectible skills, backpack HUD, and skill matrix.

## Requirements

### Requirement: Career Biomes and Spawning
The system SHALL divide a vertical map of size `[0, MAP_HEIGHT]` into 4 chronological biomes. It SHALL spawn 15 key skill collectibles within their respective biomes.

#### Scenario: Spawning layout
- GIVEN a new game session
- WHEN the map initializes
- THEN 15 skills SHALL be placed across 4 chronological biomes from top to bottom

### Requirement: Collision Collection
The system SHALL detect player overlap with collectibles. Upon collision, the skill MUST be collected, trigger an update event, and disappear from the canvas.

#### Scenario: Collect item
- GIVEN a player near an uncollected skill
- WHEN the player collides with the skill's radius
- THEN the skill is collected and removed from rendering

### Requirement: Backpack HUD Overlay
The system SHALL render a DOM-based overlay button `#backpack-hud` showing the last collected skill and total progress (e.g., "3/15"). It MUST have class `no-print`.

#### Scenario: HUD update
- GIVEN a player has collected 2 skills
- WHEN a 3rd skill is collected
- THEN `#backpack-hud` MUST display the skill's name and "3/15"

### Requirement: Skill-Matrix Modal
Clicking `#backpack-hud` SHALL toggle an accessible `<dialog id="skill-matrix-modal">` showing all skills by category with unlock status. It MUST have class `no-print`.

#### Scenario: Toggle modal
- GIVEN the modal is closed
- WHEN the user clicks the `#backpack-hud` button
- THEN the modal `<dialog>` SHALL open with accessible focus management

### Requirement: Journey End CTA
The system SHALL render a Call-To-Action (CTA) section at the bottom of the map near `MAP_HEIGHT`.

#### Scenario: Reaching CTA
- GIVEN the player scrolls to the bottom of the map
- WHEN the viewport shows coordinates near `MAP_HEIGHT`
- THEN the visual CTA section SHALL be rendered
