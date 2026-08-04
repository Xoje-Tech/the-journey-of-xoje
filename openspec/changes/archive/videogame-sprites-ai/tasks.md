# Tasks: videogame-sprites-ai

## Phase 0: Baseline & Infrastructure Setup

- [ ] **Task 0.1**: Create a virtual environment under `scripts/.venv` to keep dependencies isolated and compliant with PEP 668.
  - Command: `python3 -m venv /home/hermes/projects/the-journey-of-xoje/scripts/.venv`
- [ ] **Task 0.2**: Install required generation dependencies in `.venv` (Pillow).
  - Command: `scripts/.venv/bin/pip install Pillow requests`
- [ ] **Task 0.3**: Add a task shortcut in `package.json` to trigger the AI spritesheet generation cleanly.
  - Shortcut: `"generate-sprites": "scripts/.venv/bin/python scripts/generate-sprites-ai.py"`

## Phase 1: AI Spritesheet Generator Script

- [ ] **Task 1.1**: Implement `scripts/generate-sprites-ai.py`.
  - Must read `GOOGLE_API_KEY` (or fallback to `GEMINI_API_KEY`) from environment.
  - Must implement sequential calls to Google Imagen 3 (`imagen-3.0-generate-002`) for the 9 poses with high prompt-consistency anchors.
  - Must use `Pillow` to crop, resize, and horizontal-stitch the frames side-by-side (288×48 px total, 9 frames of 32×48 px each).
  - Must save the output directly to `public/sprites/player.png`.
  - Must log progress per frame (0/9, 1/9...) to stderr so the user/agent can monitor execution.

## Phase 2: Animation State & Types (Strict TDD)

- [ ] **Task 2.1**: Define the player-module types inside `src/game/player/types.ts`.
  - Define `PoseType`, `AnimState` (with `pose`, `frameIndex`, `timeSinceLastFrame`, `dashLeanActive`), and `PlayerSpriteConfig`.
- [ ] **Task 2.1a (RED)**: Write unit tests in `tests/game-player-animation.test.ts`.
  - Write test cases for Scenario 1 (at rest -> idle, col 0).
  - Write test cases for Scenario 2 (walk-down looping through cols 1 & 2).
  - Write test cases for Scenario 3 (walk-left looping through cols 5 & 6).
  - Write test cases for Scenario 4 (frame swap duration scaling with velocity magnitude).
  - Write test cases for Scenario 5 (dash lean active exactly when `|vx| + |vy| > 4.0`).
- [ ] **Task 2.2 (GREEN)**: Implement pure animation selection in `src/game/player/animation.ts` until all 15+ test cases pass.
  - Implement `pickFrame(vx, vy, dtMs, current)` conforming to the specifications.

## Phase 3: Spritesheet Drawing & Player Entity

- [ ] **Task 3.1**: Implement `src/game/player/sprite.ts` for actual canvas drawing.
  - Implement `drawPlayerFrame(ctx, img, state, x, y, blinkActive)`.
  - Apply canvas transformation `ctx.transform(...)` or `ctx.rotate(...)` to skew the character if `state.dashLeanActive` is true.
  - Draw the sprite frame at the coordinates.
  - Layer a programmatic blink line over the character's eye position if `blinkActive` is true.
- [ ] **Task 3.2**: Implement `src/game/player/index.ts` (Composition Root).
  - Implement `PlayerEntity` class managing image load, animation state progression, and drawing orchestration.

## Phase 4: Game Loop & Wiring

- [ ] **Task 4.1**: Modify `src/game/render.ts`.
  - Remove/archive `drawPlayerCapsule` and `computeFacing` (logic is now encapsulated under the player module).
- [ ] **Task 4.2**: Modify `src/game/init.ts`.
  - Instantiate `PlayerEntity` inside `init(...)`.
  - Add image loading wait inside `init` or handle asynchronous image onload safely inside the RAF loop.
  - Progress animation states using the elapsed frame duration (`dtMs`) and call `playerEntity.updateAndDraw(...)`.
- [ ] **Task 4.3**: Update `tests/game-build.test.ts` to assert that the `player.png` spritesheet exists in the emitted bundle and typechecks cleanly.

## Phase 5: Verification & Delivery

- [ ] **Task 5.1**: Run `pnpm typecheck` to verify no TypeScript compilation errors.
- [ ] **Task 5.2**: Run `pnpm test` and verify that the full test suite (76+ tests) passes in green.
- [ ] **Task 5.3**: Run `pnpm build` to verify production bundling is perfect.
