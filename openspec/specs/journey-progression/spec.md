# Journey Progression Specification

## Purpose

Expose linear vertical gameplay with chronological career biomes, collectible skills, separate HUD skill bags, and category-specific modals/inventories.

## Requirements

### Requirement: Career Biomes and Spawning

The system SHALL divide a vertical map of size `[0, MAP_HEIGHT]` into 4 chronological biomes. It SHALL spawn 19 key skill collectibles within their respective biomes (4 soft skills added: 1 per biome). Soft skills MUST render with a green palette on the canvas.

#### Scenario: Spawning layout

- GIVEN a new game session
- WHEN the map initializes
- THEN 19 skills SHALL be placed across 4 chronological biomes from top to bottom
- AND counts per biome MUST be: LCS Robotics: 4, Crmble: 5, Twinny: 5, RIDE ON: 5

#### Scenario: Soft skill rendering

- GIVEN a soft skill is rendered on canvas
- WHEN `drawCollectibles` executes
- THEN the soft skill item MUST render with a green coin fill and stroke

### Requirement: Collision Collection

The system SHALL detect player overlap with collectibles. Upon collision, the skill MUST be collected, trigger an update event, and disappear from the canvas.

#### Scenario: Collect item

- GIVEN a player near an uncollected skill
- WHEN the player collides with the skill's radius
- THEN the skill is collected and removed from rendering

### Requirement: Journey End CTA

The system SHALL render a Call-To-Action (CTA) section at the bottom of the map near `MAP_HEIGHT`.

#### Scenario: Reaching CTA

- GIVEN the player scrolls to the bottom of the map
- WHEN the viewport shows coordinates near `MAP_HEIGHT`
- THEN the visual CTA section SHALL be rendered

### Requirement: Separate HUD Bag Displays

The system SHALL display three separate HUD bags (`TechBag`, `QualBag`, `SoftBag`) that subscribe to `collectedSkillsStore`, filtering and showing category-specific counts (Tech, Qual, Soft) vs total skills in that category. Each bag button MUST have class `no-print`.

#### Scenario: Bag count update

- GIVEN a player has collected 2 technical skills and 0 soft skills
- WHEN a 3rd technical skill is collected
- THEN the `TechBag` counter MUST update to "3/9" while `SoftBag` remains "0/4"

#### Scenario: Dynamic toasts

- GIVEN a HUD bag is displayed
- WHEN a skill belonging to its category is collected
- THEN that bag MUST animate a transient toast showing `+ [Skill Name]!` for 2500ms

### Requirement: Grouped HUD Layout

The system SHALL group the Pause button and the three HUD bags horizontally inside a `.hud-top-right` flex container on the screen, and MUST hide them during print.

#### Scenario: Visual alignment

- GIVEN the player is in-game on screen
- WHEN the viewport width is above 480px
- THEN Pause, Tech, Qual, and Soft bags MUST align horizontally in a single row with `gap: 8px` on the top-right
- AND if width is under 480px, text labels MUST hide while retaining icons

### Requirement: Generic Modal Triggering

The `RetroModal` component MUST accept a `data-trigger-id` attribute and generically reset `aria-expanded` and focus to the triggering element upon close.

#### Scenario: Closing resets trigger

- GIVEN a modal was opened via a HUD bag button with `data-trigger-id`
- WHEN the modal is closed via its close button or backdrop click
- THEN the trigger button's `aria-expanded` MUST be set to "false" and focus returned to it

### Requirement: Update Tests

The test suite MUST verify 19 total skills and assert updated per-biome counts.

#### Scenario: Progression test suite

- GIVEN a developer runs the test suite
- WHEN `pnpm test` executes
- THEN the progression tests MUST assert exactly 19 skills distributed as 4, 5, 5, 5 across the biomes
- AND all chronological vertical order checks MUST pass

### Requirement: REQ-NPC-SPAWNING-RENDERING

The map generator SHALL spawn 4 distinct coworker NPCs as part of the map's collectibles, located in their respective chronological career biomes. Each NPC MUST render on the canvas as a yellow retro circle containing their initial and their name above.

| NPC Name | Associated Skill      | Biome        | Initial |
| -------- | --------------------- | ------------ | ------- |
| Héctor   | `kuka-robotics`       | LCS Robotics | H       |
| Laura    | `design-system`       | Crmble       | L       |
| Dani     | `peer-mentoring`      | Twinny       | D       |
| Marcos   | `continuous-learning` | RIDE ON      | M       |

#### Scenario: Spawning and rendering of NPCs

- GIVEN a new game session is initialized
- WHEN the engine draws collectibles on the canvas
- THEN 4 distinct NPCs MUST render as yellow retro circles with initials ('H', 'L', 'D', 'M')
- AND their names MUST be displayed above their positions in their respective career biomes

### Requirement: REQ-NPC-LOOP-PAUSING

Upon collision with an NPC, the system MUST freeze player physics, trail updates, input checks, and spritesheet animations. This freeze SHALL be enforced by passing a delta time of 0 (`dt = 0`) to all update loops and disabling spritesheet animation.

#### Scenario: Collision with NPC pauses game engine

- GIVEN a player is moving in the active game world
- WHEN the player collides with an NPC
- THEN the system MUST set `activeDialogStore` to the active NPC's data
- AND player physics, trails, input checking, and animations MUST freeze by passing `dt = 0` to all update functions

### Requirement: REQ-NPC-DIALOG-ACTIVATION-TYPEWRITER

When `activeDialogStore` is populated with an active NPC, the `<DialogOverlay />` component MUST mount and render. The overlay MUST display the NPC's name and a retro text box with localized dialogue. The text MUST animate progressively using a retro NES-style typewriter effect.

| NPC Name | Language | Dialogue Content                                                                    |
| -------- | -------- | ----------------------------------------------------------------------------------- |
| Héctor   | Es       | "¡Hola! Programamos robots KUKA en LCS. ¡Cuidado con el brazo articulado!"          |
| Héctor   | En       | "Hi! We program KUKA robots at LCS. Careful with the robotic arm!"                  |
| Laura    | Es       | "¡Hola! En Crmble nos encanta el diseño pixel-perfect y los sistemas consistentes." |
| Laura    | En       | "Hi! At Crmble we love pixel-perfect design and consistent systems."                |
| Dani     | Es       | "Buenas. Soy Dani de Twinny. Aquí el mentorizaje mutuo es clave."                   |
| Dani     | En       | "Hey. I am Dani from Twinny. Mutual mentoring is key here."                         |
| Marcos   | Es       | "¡Hola! Soy Marcos, CTO de RIDE ON. El aprendizaje continuo es clave."              |
| Marcos   | En       | "Hi! I am Marcos, CTO at RIDE ON. Continuous learning is key."                      |

#### Scenario: Displaying localized retro dialogue overlay

- GIVEN `activeDialogStore` has been populated with NPC data
- WHEN `<DialogOverlay />` is rendered on the screen
- THEN it MUST fetch the dialogue text corresponding to the active locale
- AND the text MUST display progressively using a typewriter animation

### Requirement: REQ-NPC-PROGRESSION-DISMISSAL

Pressing Space or clicking the `<DialogOverlay />` when the dialogue typewriter effect is complete MUST close the overlay, set `activeDialogStore` to `null`, dispatch a `'dialog-dismissed'` CustomEvent, and mark the associated skill as collected.

#### Scenario: Dismissing dialogue overlay collects associated skill

- GIVEN the dialogue overlay is open and dialogue rendering is complete
- WHEN the user presses Space or clicks the overlay
- THEN the overlay MUST close and `activeDialogStore` MUST be set to `null`
- AND the system MUST dispatch a `'dialog-dismissed'` CustomEvent
- AND the associated skill MUST be added to `collectedSkillsStore`
