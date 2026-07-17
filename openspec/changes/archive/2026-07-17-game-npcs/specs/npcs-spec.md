# Delta Spec — game-npcs

**Change**: game-npcs  
**Project**: the-journey-of-xoje  
**Doctrine**: project-doctrine v1.3

This specification defines the additions and changes for the `game-npcs` feature, integrating 4 coworker NPCs (Héctor, Laura, Dani, Marcos) representing qualitative and technical skills with localized NES-style dialogue boxes and loop-pausing mechanics.

---

## 1. Capabilities

### `game-npcs` (New)

Allows gameplay updates to freeze to display localized coworker dialogues.

- The system MUST spawn 4 distinct NPCs as yellow retro circles with initials and names.
- Upon player collision with an NPC, the system MUST pause all physics, animations, trails, and inputs by setting delta time to 0.
- A `<DialogOverlay />` component MUST render the NPC's name and localized dialogue text using a progressive retro typewriter animation.
- Pressing Space or clicking the overlay MUST close the dialog, dispatch `'dialog-dismissed'`, and collect the associated skill.

---

## 2. Requirements

### ADDED Requirements

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

---

### Requirement: REQ-NPC-LOOP-PAUSING

Upon collision with an NPC, the system MUST freeze player physics, trail updates, input checks, and spritesheet animations. This freeze SHALL be enforced by passing a delta time of 0 (`dt = 0`) to all update loops and disabling spritesheet animation.

#### Scenario: Collision with NPC pauses game engine

- GIVEN a player is moving in the active game world
- WHEN the player collides with an NPC
- THEN the system MUST set `activeDialogStore` to the active NPC's data
- AND player physics, trails, input checking, and animations MUST freeze by passing `dt = 0` to all update functions

---

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

---

### Requirement: REQ-NPC-PROGRESSION-DISMISSAL

Pressing Space or clicking the `<DialogOverlay />` when the dialogue typewriter effect is complete MUST close the overlay, set `activeDialogStore` to `null`, dispatch a `'dialog-dismissed'` CustomEvent, and mark the associated skill as collected.

#### Scenario: Dismissing dialogue overlay collects associated skill

- GIVEN the dialogue overlay is open and dialogue rendering is complete
- WHEN the user presses Space or clicks the overlay
- THEN the overlay MUST close and `activeDialogStore` MUST be set to `null`
- AND the system MUST dispatch a `'dialog-dismissed'` CustomEvent
- AND the associated skill MUST be added to `collectedSkillsStore`
