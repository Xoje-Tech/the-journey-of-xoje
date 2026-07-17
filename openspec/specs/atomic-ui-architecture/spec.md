# Atomic UI Architecture Specification

## Purpose

Establishes formal architectural rules for decoupling the static printable CV elements from the interactive gameplay interface through Atomic Design component separation, CSS isolation, and reactive Nanostores state management.

## Requirements

| Requirement ID          | Description                                                                                                                                                                                                                                                                        |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **REQ-ATOM-COMPONENTS** | Primitive components (such as buttons, indicators, and modal backdrops) MUST be located in `src/components/ui/` and remain purely stateless.                                                                                                                                       |
| **REQ-ATOM-ORGANISMS**  | Domain-specific high-level components (such as start screen, settings modal, controls guide, and canvas viewport) MUST live in `src/components/game/` and manage their own modular client-side interactions.                                                                       |
| **REQ-ATOM-CSS**        | Component-specific style declarations MUST be isolated inside scoped `<style>` tags inside their respective `.astro` files. Global styles in `src/styles/screen.css` MUST be restricted to typography, base layouts, and standard responsive grids to prevent style pollution.     |
| **REQ-ATOM-STORES**     | Shared client-side reactive state MUST be managed using Nanostores under `src/game/store.ts`. The store MUST expose: `isStartedStore` (boolean), `volumeStore` (number 0-100), `gamepadConnectedStore` (boolean), and `collectedSkillsStore` (array of strings or object).         |
| **REQ-ATOM-VIEWPORT**   | The canvas viewport component (`GameViewport.astro`) MUST fully encapsulate canvas engine initialization and subscribe to `isStartedStore` to trigger `gameHandle.start()` when its value becomes `true`.                                                                          |
| **REQ-ATOM-SPLASH**     | The start screen overlay component (`StartScreen.astro`) MUST subscribe to `isStartedStore`, applying a `.slide-up` transition when `true` and hiding its DOM elements entirely on `transitionend`.                                                                                |
| **REQ-ATOM-GAMEPAD**    | The settings modal component (`SettingsPanel.astro`) MUST poll the browser gamepad API and update `gamepadConnectedStore`, while the status display (`GamepadStatus.astro`) MUST subscribe to `gamepadConnectedStore` to dynamically toggle its active/inactive color-coded badge. |
| **REQ-ATOM-PRINT**      | All interactive overlays, panels, and modals MUST be decorated with the `.no-print` utility class to ensure they are omitted from the printed document.                                                                                                                            |

## Scenarios

### Scenario: Stateless Component Isolation

- GIVEN a primitive component under `src/components/ui/`
- WHEN rendered in any context
- THEN it MUST not import or manage internal mutable state
- AND its styling MUST be declared only within its scoped `<style>` block

### Scenario: Modular Organism Interaction

- GIVEN a complex organism under `src/components/game/`
- WHEN user interaction occurs
- THEN it MUST manage its interactions locally or mutate shared Nanostores
- AND it MUST NOT depend on external global scripts for its behavior

### Scenario: Scoped Component CSS

- GIVEN any UI or game Astro component
- WHEN compiled by Astro
- THEN its CSS rules MUST be scoped to that component only
- AND MUST NOT leak declarations to the global document namespace

### Scenario: Nanostores State Synchronization

- GIVEN a reactive Nanostore instance defined in `src/game/store.ts`
- WHEN any component mutates a store value
- THEN all subscribed components MUST receive and reflect the updated value immediately without page reloads

### Scenario: Canvas Initialization and Playback Start

- GIVEN the `GameViewport.astro` component is mounted
- WHEN `isStartedStore` transitions from `false` to `true`
- THEN the component MUST invoke the game engine start routine (`gameHandle.start()`)
- AND normal gameplay loop processing MUST commence

### Scenario: Start Screen Dismissal

- GIVEN `StartScreen.astro` is mounted and visible
- WHEN `isStartedStore` becomes `true`
- THEN the component MUST apply the `.slide-up` CSS class
- AND MUST set its element display to none upon receiving the `transitionend` event

### Scenario: Gamepad Connection and Badge Reactivity

- GIVEN `SettingsPanel.astro` is active
- WHEN a gamepad connection state changes
- THEN `SettingsPanel` MUST poll the Gamepad API and update `gamepadConnectedStore`
- AND `GamepadStatus.astro` MUST immediately toggle its indicator badge class based on the new store value

### Scenario: Print Layout Exclusion

- GIVEN any interactive overlay, modal, or button
- WHEN a print event is initiated (`window.print()`)
- THEN all elements decorated with `.no-print` MUST be fully hidden from the final document layout
