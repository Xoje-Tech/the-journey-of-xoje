# Start Screen Specification

## Purpose
Establishes a retro splash overlay before gameplay begins, allowing the user to start the game, download the CV, configure settings, and view visual control mappings without affecting the print layout.

## Requirements

| Requirement ID | Description |
|---|---|
| **REQ-SPLASH-TITLE** | The overlay MUST display the retro title "The Journey of Xoje" styled with a pixel-art aesthetic. |
| **REQ-SPLASH-START** | Clicking "Start Game" MUST trigger a smooth slide-up animation to dismiss the overlay and SHALL resume normal gameplay physics/inputs. |
| **REQ-SPLASH-PRINT** | All splash overlay elements, buttons, and panels MUST carry the `.no-print` CSS class to ensure they are completely hidden during document printing. |
| **REQ-SPLASH-CV** | Clicking "Download CV" MUST call the browser's native `window.print()` directly. |
| **REQ-SPLASH-SETTINGS** | The Settings Overlay MUST display real-time Gamepad connection/usability status and a volume control indicator. |
| **REQ-SPLASH-CONTROLS** | The Controls Guide button next to Settings MUST display a panel showing visual mappings for keyboard, mouse, and gamepad. |

## Scenarios

### Scenario: Retro Title Visuals
- GIVEN the Start Screen is loaded
- WHEN rendered
- THEN the retro title 'The Journey of Xoje' MUST show pixel-art styling

### Scenario: Dismiss Overlay and Resume Physics
- GIVEN the Start Screen is active and gameplay is suspended
- WHEN the user clicks 'Start Game'
- THEN the overlay MUST slide up smoothly
- AND physics and inputs SHALL resume

### Scenario: Download CV Action
- GIVEN the Start Screen is active
- WHEN the user clicks 'Download CV'
- THEN the system MUST call `window.print()` directly

### Scenario: Settings Panel Gamepad and Volume Status
- GIVEN the Settings panel is open
- WHEN a gamepad connects or disconnects
- THEN the panel MUST update real-time with connection status
- AND SHALL display a volume indicator

### Scenario: Controls Guide Visual Mappings
- GIVEN the Controls Guide panel is open
- WHEN rendered
- THEN it MUST show keyboard, mouse, and gamepad mappings

### Scenario: Print Safety Hides Splash Elements
- GIVEN any splash or overlay element
- WHEN the browser prints
- THEN those elements MUST be hidden via `.no-print`
