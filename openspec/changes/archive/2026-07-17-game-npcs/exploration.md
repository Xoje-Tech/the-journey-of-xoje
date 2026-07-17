## Exploration: Unidirectional Dialog System and NPCs in "The Journey of Xoje"

### Current State
Currently, the core game engine initializes in `src/game/init.ts` and renders interactive elements (collectibles) as circular colored coins representing skills from Xoje's CV. There are 19 skill templates inside `SKILL_TEMPLATES` in `src/game/init.ts`. When the player's circular collision overlaps with a collectible coin, the coin is immediately collected. This triggers a CustomEvent `game-state-update` dispatched to the DOM which is intercepted by `GameViewport.astro` and bridged into the Nanostore `collectedSkillsStore` which updates the backpack HUD elements (`TechBag`, `QualBag`, `SoftBag`).
Calculations (physics, input state, motion trail, animations) run continuously in the game loop when `isStartedStore` is true.

### Affected Areas
- `src/game/types.ts` — Define `NPCMetadata` and `ActiveDialog` interfaces, and update `CollectibleItem` to include optional `npc` metadata. Add `locale` to `InitOptions` so the engine knows the current language.
- `src/game/store.ts` — Export `activeDialogStore` as a Nanostore of type `ActiveDialog | null` to track the state of active dialogs.
- `src/game/init.ts` — Add `npc` metadata to `SKILL_TEMPLATES` for Héctor, Laura, Dani, and Marcos. In the game loop, subscribe to `activeDialogStore` to pause physics, inputs, motion trail updates, and collision checks while a dialog is active. Pass `0` delta time and disable blink triggers to freeze spritesheet animation. Intercept collisions with NPCs to activate the dialog store instead of immediately collecting the skill. Listen to `'dialog-dismissed'` events to mark the associated skill as collected when the player closes the dialogue overlay.
- `src/game/render.ts` — Update `drawCollectibles` to check if `item.npc` is present. If so, render it as a yellow retro circle with black stroke, with initials (H, L, D, M) centered in dark text, and the character label (name) rendered above it.
- `src/components/game/DialogOverlay.astro` (NEW file) — Create a retro NES-style dialog textbox overlay component at the bottom of the screen. Display the NPC name and message when `activeDialogStore` is active. Support click and Space-key progression to set the store to null and dispatch `'dialog-dismissed'`.
- `src/pages/[locale]/index.astro` — Mount `<DialogOverlay locale={locale} />` next to `<GameViewport />`.
- `src/components/game/GameViewport.astro` — Pass `locale` from Astro frontmatter into `init(c, { ..., locale })` using `dataset` to enable localized dialogues in the engine.
- `src/i18n/ui.es.json` & `src/i18n/ui.en.json` — Add `"dialogContinue": "Espacio / Clic para continuar"` and `"dialogContinue": "Space / Click to continue"`.

### Approaches
1. **Approach A: Decoupled CustomEvent Progression (Recommended)**
   - The engine handles collisions and populates `activeDialogStore` (raising the dialogue overlay). It suspends loop calculations.
   - The UI overlay (`DialogOverlay.astro`) reads the active dialog, handles DOM events (Space key, click), and upon dismissal dispatches a `dialog-dismissed` CustomEvent with the `skillId`.
   - The engine catches `dialog-dismissed` and marks the item `collected`, which triggers standard progress & HUD updates.
   - **Pros:** Extremely clean architectural decoupling. The engine remains 100% testable in node headless test suites with zero DOM/UI dependency. It follows standard §11.8 perfectly.
   - **Cons:** Requires event orchestration via `window`.
   - **Effort:** Low.

2. **Approach B: Direct Nanostore Mutation from UI**
   - The engine collision directly unlocks the skill but we pause the player movement.
   - **Pros:** Simple.
   - **Cons:** Breaks unidirectional state flow, leads to double collision triggers if the player stays on the NPC, and requires complex state coordination to prevent visual glitches.
   - **Effort:** Medium.

### Recommendation
We strongly recommend **Approach A (Decoupled CustomEvent Progression)**. It adheres perfectly to the *Pure Engine to Reactive HUD Decoupling Pattern* (§11.8) of the project doctrine. It preserves clean testability of the headless engine (using fake window event triggers) and ensures that all physics, inputs, and animations freeze cleanly when active without corrupting the loop structure or leaking states.

### Risks
- **Test Suite Collisions**: Ensuring that standard integration tests in `tests/game-journey-progression.test.ts` don't break because of NPC metadata changes. We'll make sure `npc` metadata is entirely optional and backwards-compatible.
- **Double Space Key triggers**: When the player presses Space to start the game on the start screen, or to jump, we must prevent those presses from interfering with the dialog overlay, and vice-versa (e.g., using `e.preventDefault()` and checking `activeDialogStore` state).

### Ready for Proposal
Yes — The technical design is crystal clear and matches all criteria perfectly. We are ready to transition to the proposal phase.
