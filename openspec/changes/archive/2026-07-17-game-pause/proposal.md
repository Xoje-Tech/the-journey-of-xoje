# Proposal: Game Pause / Menu Button

## Intent
Provide a clean gameplay pause mechanism that freezes game engine calculations (physics, input, animations) while keeping active rendering visible. It solves the lack of a pause mechanism during active gameplay, improving UX by allowing the user to pause/resume seamlessly.

## Scope

### In Scope
- Add `PauseButton.astro` to HUD (top-right, with `.no-print`).
- Subscribe to `isStartedStore` in `src/game/init.ts` to freeze/unfreeze state updates.
- Modify `StartScreen.astro` to slide down when `isStartedStore` is toggled to `false` after starting.
- Toggle dynamic button text (e.g. "Resume Game" / "Reanudar Juego") via central translations.
- Prevent CSS transition bypasses with forced DOM reflow (`offsetHeight`).
- Unsubscribe from `isStartedStore` inside `init.ts`'s `stop()` handle.

### Out of Scope
- Custom keyboard pause shortcuts.
- Persistent save-game states.

## Capabilities

### New Capabilities
- `game-pause`: Pause/resume game loop calculations while keeping rendering active.

### Modified Capabilities
- `start-screen`: Support sliding down on pause with localized "Resume Game" button copy and transition management.

## Approach
1. **Engine Pause**: Inside `src/game/init.ts`, subscribe to `isStartedStore`. When `false` (and already started), freeze game delta updates, trail computations, player movement, and blink states, keeping rendering active. Return unsubscribe on `stop()`.
2. **HUD Button**: Create a `.no-print` `PauseButton.astro` that sets `isStartedStore` to `false` on click. Mount in `src/pages/[locale]/index.astro`.
3. **Menu Re-entry**: Update `StartScreen.astro`. If `isStartedStore` becomes `false` after game start, set `display: flex`, force DOM reflow (`startScreen.offsetHeight`), and remove `.slide-up` so it slides back down. Use data attributes to dynamically switch text between "Start Game" and "Resume Game" safely.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/game/store.ts` | Modified | Core state driver for gameplay active status. |
| `src/game/init.ts` | Modified | Subscribe to `isStartedStore` to pause update loops. |
| `src/components/game/StartScreen.astro` | Modified | Handle sliding back down, force reflow, and update button label. |
| `src/components/game/PauseButton.astro` | New | HUD Pause button element. |
| `src/pages/[locale]/index.astro` | Modified | Mount the new Pause button. |
| `src/i18n/ui.es.json`, `src/i18n/ui.en.json` | Modified | Add `"pauseButton"`, `"resumeGame"` translations. |
| `src/styles/print.css` | Modified | Print safety for HUD container elements. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Transition flicker | Med | Force DOM reflow (`offsetHeight`) between updating display and removing class. |
| Memory leaks | Low | Store and call unsubscribe on engine `stop()`. |
| Sprite drift | Low | Enforce 0 delta-time and disable animation logic under pause. |

## Rollback Plan
Run:
```bash
git checkout master -- src/game/init.ts src/game/store.ts src/components/game/StartScreen.astro src/pages/\[locale\]/index.astro src/i18n/ui.*.json
rm src/components/game/PauseButton.astro
```

## Dependencies
- None.

## Success Criteria
- [ ] Pause button click freezes movement, inputs, and animations.
- [ ] Active canvas rendering continues behind the paused overlay.
- [ ] Start overlay slides back down with dynamic, localized "Resume" label.
- [ ] Zero visual flickering during transition.
- [ ] HUD Pause button is completely hidden in print-preview mode (`.no-print`).
- [ ] 100% tests pass and typecheck is clean.
