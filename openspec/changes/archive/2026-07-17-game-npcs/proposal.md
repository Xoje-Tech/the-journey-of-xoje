# Proposal: game-npcs

## Intent

Transform 4 CV skills into interactive coworker NPCs (Héctor, Laura, Dani, Marcos) with localized dialogues, retro NES-style dialog boxes, and loop-pausing mechanics.

## Scope

### In Scope

- Define `NPCMetadata` and `ActiveDialog` in `types.ts`.
- Export `activeDialogStore` in `store.ts`.
- Add `npc` to `SKILL_TEMPLATES` in `init.ts`:
  - `kuka-robotics` (Héctor):
    - Es: "¡Hola! Programamos robots KUKA en LCS. ¡Cuidado con el brazo articulado!"
    - En: "Hi! We program KUKA robots at LCS. Careful with the robotic arm!"
  - `design-system` (Laura):
    - Es: "¡Hola! En Crmble nos encanta el diseño pixel-perfect y los sistemas consistentes."
    - En: "Hi! At Crmble we love pixel-perfect design and consistent systems."
  - `peer-mentoring` (Dani):
    - Es: "Buenas. Soy Dani de Twinny. Aquí el mentorizaje mutuo es clave."
    - En: "Hey. I am Dani from Twinny. Mutual mentoring is key here."
  - `continuous-learning` (Marcos):
    - Es: "¡Hola! Soy Marcos, CTO de RIDE ON. El aprendizaje continuo es clave."
    - En: "Hi! I am Marcos, CTO at RIDE ON. Continuous learning is key."
- Update `drawCollectibles` to render NPCs as yellow circles with initials and name tag.
- Pause physics, inputs, and spritesheet animation (`dt=0`, disable blink) when active.
- Create `<DialogOverlay />` supporting Space/click progression.
- Mark skill collected upon `'dialog-dismissed'`.
- Pass locale from Astro to engine.

### Out of Scope

- Branching dialogues.
- NPC movement (stationary).
- Custom NPC spritesheets.

## Capabilities

### New Capabilities

- `game-npcs`: Halt gameplay physics/animations to display localized coworker dialogues.

### Modified Capabilities

None

## Approach

Implement Approach A (Decoupled CustomEvent Progression) per §11.8:

1. **State**: Nanostore `activeDialogStore: ActiveDialog | null`.
2. **Freeze**: Loop checks store; freezes physics and animation if active.
3. **Trigger**: Collision sets store.
4. **Overlay**: Dialog box handles dismissal, nullifies store, dispatches event.
5. **Collection**: Engine catches event, marks item collected.

## Affected Areas

| Area                                      | Impact   | Description                                           |
| ----------------------------------------- | -------- | ----------------------------------------------------- |
| `src/game/types.ts`                       | Modified | Add `NPCMetadata`, `ActiveDialog`.                    |
| `src/game/store.ts`                       | Modified | Add `activeDialogStore`.                              |
| `src/game/init.ts`                        | Modified | Update `SKILL_TEMPLATES`, pause loop, handle dismiss. |
| `src/game/render.ts`                      | Modified | Draw yellow circle with initials + label.             |
| `src/components/game/DialogOverlay.astro` | New      | Retro NES dialog overlay.                             |
| `src/pages/[locale]/index.astro`          | Modified | Mount overlay.                                        |
| `src/components/game/GameViewport.astro`  | Modified | Pass locale to engine.                                |
| `src/i18n/ui.es.json` / `ui.en.json`      | Modified | Add `dialogContinue` keys.                            |

## Risks & Mitigation

- **Space-key conflict** (Low): Stop propagation in overlay keydown.
- **Test suite breakages** (Low): Keep metadata optional on items.

## Rollback Plan

Run `git checkout develop && git branch -D feat/game-npcs`.

## Success Criteria

- [ ] NPCs Héctor, Laura, Dani, Marcos render with initials.
- [ ] Collision pauses player and loop animation.
- [ ] Displays localized dialogues.
- [ ] Space/click dismisses and collects skill.
- [ ] Automated Vitest suite passes.
