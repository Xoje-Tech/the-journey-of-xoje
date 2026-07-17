# Delta for journey-progression

This specification defines the migration from a single monolithic backpack HUD/modal to three category-specific interactive bags (Technical, Qualitative, Soft), introducing 4 soft skills (increasing total count to 19), and adding generic modal triggering.

## ADDED Requirements

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

---

## MODIFIED Requirements

### Requirement: Career Biomes and Spawning

The system SHALL divide a vertical map of size `[0, MAP_HEIGHT]` into 4 chronological biomes. It SHALL spawn 19 key skill collectibles within their respective biomes (4 soft skills added: 1 per biome). Soft skills MUST render with a green palette on the canvas.
(Previously: 15 skill templates across 4 biomes with no soft skills category or green rendering)

#### Scenario: Spawning layout

- GIVEN a new game session
- WHEN the map initializes
- THEN 19 skills SHALL be placed across 4 chronological biomes from top to bottom
- AND counts per biome MUST be: LCS Robotics: 4, Crmble: 5, Twinny: 5, RIDE ON: 5

#### Scenario: Soft skill rendering

- GIVEN a soft skill is rendered on canvas
- WHEN `drawCollectibles` executes
- THEN the soft skill item MUST render with a green coin fill and stroke

### Requirement: Update Tests

The test suite MUST verify 19 total skills and assert updated per-biome counts.
(Previously: Tested exactly 15 skills and biome counts of 3, 4, 4, 4)

#### Scenario: Progression test suite

- GIVEN a developer runs the test suite
- WHEN `pnpm test` executes
- THEN the progression tests MUST assert exactly 19 skills distributed as 4, 5, 5, 5 across the biomes
- AND all chronological vertical order checks MUST pass

---

## REMOVED Requirements

### Requirement: Backpack HUD Overlay

(Reason: Replaced by separate Tech, Qual, and Soft HUD bags)
(Migration: Deprecate and remove `#backpack-hud` button and related styles/scripts)

### Requirement: Skill-Matrix Modal

(Reason: Replaced by three specialized category-specific modals/inventories)
(Migration: Deprecate and remove `#skill-matrix-modal` dialog)
