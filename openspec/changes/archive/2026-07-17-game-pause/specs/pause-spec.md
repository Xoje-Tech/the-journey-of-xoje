# Delta Spec — game-pause

**Change**: game-pause  
**Project**: the-journey-of-xoje  
**Doctrine**: project-doctrine v1.3 §11, §14  

---

## 1. Capabilities

### `game-pause` (New)
Provides a clean gameplay pause mechanism that freezes gameplay updates while keeping canvas rendering active.
- The engine MUST subscribe to `isStartedStore`. When `false` (and already started), freeze movement, inputs, trails, and animations.
- On engine `stop()`, the unsubscribe handle MUST be invoked.
- The HUD `PauseButton.astro` MUST carry `.no-print` and set `isStartedStore` to `false` on click.

### `start-screen` (Modified)
Enables the start splash screen to slide back down on pause.
- When `isStartedStore` is `false` after starting, `StartScreen.astro` MUST slide back down smoothly.
- The system MUST force DOM reflow using `offsetHeight` after setting display to flex and before removing `.slide-up` to avoid visual flickers.
- Button text MUST toggle dynamically and safely between "Start Game" and "Resume Game" via HTML data-attributes.

---

## 2. Requirements

### ADDED Requirements

#### Requirement: REQ-PAUSE-ENGINE
The engine MUST subscribe to `isStartedStore` and freeze all updates (movement, inputs, animations, trails) when it becomes `false` after a game has started, keeping canvas rendering active. On `stop()`, the unsubscribe handler MUST be executed.

##### Scenario: Pause freezes gameplay
- GIVEN gameplay is active and moving
- WHEN the user clicks the HUD Pause button
- THEN `isStartedStore` MUST set to `false`
- AND engine calculations MUST freeze while canvas rendering continues

##### Scenario: Engine stop unsubscribes
- GIVEN the engine is running with a subscription to `isStartedStore`
- WHEN engine `stop()` is called
- THEN the system MUST unsubscribe from the store

#### Requirement: REQ-PAUSE-HUD
A top-right HUD `PauseButton.astro` MUST set `isStartedStore` to `false` on click and carry `.no-print` to hide during print-preview.

##### Scenario: Pause button HUD interaction
- GIVEN the game is active
- WHEN the HUD pause button is clicked
- THEN `isStartedStore` MUST be set to `false`

##### Scenario: Print preview safety for HUD
- GIVEN the pause button is mounted
- WHEN the document is printed
- THEN the pause button MUST be hidden via `.no-print`

### MODIFIED Requirements

#### Requirement: REQ-SPLASH-START
Clicking "Start Game" MUST trigger a smooth slide-up animation to dismiss the overlay and SHALL resume normal gameplay physics/inputs. Furthermore, if `isStartedStore` becomes `false` after starting, the overlay MUST slide back down smoothly, setting display to flex and forcing reflow via `offsetHeight` before removing `.slide-up`. Button labels MUST switch dynamically via HTML data-attributes.
(Previously: Clicking "Start Game" triggers a smooth slide-up to dismiss the overlay and resume physics/inputs.)

##### Scenario: Dismiss Overlay and Resume Physics
- GIVEN the Start Screen is active and gameplay is suspended
- WHEN the user clicks 'Start Game'
- THEN the overlay MUST slide up smoothly
- AND physics and inputs SHALL resume

##### Scenario: Start Screen slides down on pause with reflow
- GIVEN the game has started and is active
- WHEN `isStartedStore` becomes `false`
- THEN the Start Screen overlay MUST display again as `flex`
- AND a DOM reflow via `offsetHeight` MUST be forced before removing `.slide-up`
- AND the overlay MUST slide down smoothly without visual flickering

##### Scenario: Dynamic button text localization via data-attributes
- GIVEN the Start Screen is active
- WHEN the game state toggles from unstarted to paused
- THEN the button label MUST dynamically switch from "Start Game" (or localized equivalent) to "Resume Game" (or localized equivalent)
- AND translation strings MUST be retrieved via HTML data-attributes to prevent raw client-side dictionary access issues
