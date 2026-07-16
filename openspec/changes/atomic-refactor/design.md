# Design: Atomic & DDD Component Refactoring

## Technical Approach
Refactor the monolithic `CvDocument.astro` into clean, printable structures and interactive retro game layers using Atomic Design and domain-driven divisions. Shared client-side state is synchronized reactively using `nanostores`.

## Architecture Decisions

### Decision: State Management Strategy
| Option | Tradeoff | Decision |
|---|---|---|
| Window Events / DOM Queries | High coupling, slow, difficult to test. | Reject |
| Nanostores Shared State | Extremely lightweight, reactive, decoupled, perfect for Astro. | **Adopt** |

### Decision: Component Breakdown
| Option | Tradeoff | Decision |
|---|---|---|
| Split into UI (Atoms) & Game (Organisms) | Promotes reusability, isolates styles, decouples printable layout. | **Adopt** |
| Extract Script Only | Retains monolithic HTML templates, lacks reusability. | Reject |

## Data Flow
The game loop (`init.ts`) fires standard DOM `game-state-update` events or directly updates `collectedSkillsStore` in `src/game/store.ts`. Subscribed components react immediately:
```
[Game Loop] ──(State Update/Store)──→ [Nanostores (store.ts)] ──→ [UI Components (Atoms/Organisms)]
```

## File Changes
| File | Action | Description |
|---|---|---|
| `package.json` | Modify | Add `nanostores` (^0.11.0) dependency. |
| `src/game/store.ts` | Create | Contains the reactive state stores. |
| `src/components/ui/RetroButton.astro` | Create | Blocky retro button atomic component. |
| `src/components/ui/GamepadStatus.astro` | Create | Reactive gamepad badge status indicator. |
| `src/components/ui/VolumeSlider.astro` | Create | Blocky range slider for SFX volume. |
| `src/components/ui/RetroModal.astro` | Create | Reusable dialog container with close handler. |
| `src/components/game/GameViewport.astro` | Create | Encapsulates `<canvas>` and game engine initialization. |
| `src/components/game/StartScreen.astro` | Create | Splash overlay subscribing to `isStartedStore`. |
| `src/components/game/SettingsPanel.astro` | Create | Modeless/modal panel for console adjustments. |
| `src/components/game/ControlsGuide.astro` | Create | SVG NES controller blueprint mapping overlay. |
| `src/components/game/BackpackButton.astro` | Create | Reactive floating HUD button for skill counts. |
| `src/components/game/BackpackInventory.astro` | Create | Skill matrix grid displaying unlocked achievements. |
| `src/components/cv/CvDocument.astro` | Create | Clean print-ready CV layout (replaces previous CvDocument). |
| `src/components/CvDocument.astro` | Delete | Monolithic layout completely cleaned and removed. |
| `src/layouts/CvLayout.astro` | Modify | Removes canvas and initialization, purely a layout wrapper. |

## Interfaces / Contracts
### Nanostores Interface (`src/game/store.ts`)
```ts
import { atom } from 'nanostores';
export const isStartedStore = atom<boolean>(false);
export const volumeStore = atom<number>(70);
export const gamepadConnectedStore = atom<boolean>(false);
export const collectedSkillsStore = atom<string[]>([]);
```

## Testing Strategy
| Layer | What to Test | Approach |
|---|---|---|
| Unit | Component isolation and state updates | Test individual stores and component markup with Vitest. |
| Integration | Canvas initialization and start screen dismissal | Verify canvas starts and splash overlay hides on isStartedStore transition. |
| E2E | End-to-end user gameplay flow | Headless browser execution checking print triggers and key binds. |

## Threat Matrix
`N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.`

## Migration / Rollout
No data migration required. Feature rollout is direct replacement in the Astro template structure.

## Open Questions
- [ ] Confirm if existing tests need structural adjustment for modal dialog layout changes.
