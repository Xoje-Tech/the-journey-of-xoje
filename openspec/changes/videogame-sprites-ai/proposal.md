# Proposal: videogame-sprites-ai

## Objective

Create a custom AI-driven sprite generation pipeline for the portfolio's top-down 2D game. Instead of relying on Hermes's native `image_generate` (which is hardcoupled to FAL and lacks credentials in this environment), we will build our own local sprite-generator script (`scripts/generate-sprites-ai.py`) that uses the user's active `GOOGLE_API_KEY` to call Google's Imagen 3 API, generate 9 consistent pixel-art frames, stitch them into a single 288×48 px spritesheet, and save it to `public/sprites/player.png`.

Additionally, we will refactor the game's rendering engine to support this animated spritesheet using a clean, decoupled structure under `src/game/player/` following clean architecture principles.

## Target / Scope

- **Repository**: `/home/hermes/projects/the-journey-of-xoje`
- **Output Asset**: `public/sprites/player.png` (288×48 px spritesheet, 9 frames of 32×48 px)
- **New Modules**:
  - `scripts/generate-sprites-ai.py` (generation script using Google Imagen 3 via HTTP/curl)
  - `src/game/player/sprite.ts` (spritesheet loading, mapping, and rendering primitives)
  - `src/game/player/animation.ts` (pure animation state picker: idle, walk-down/up/left/right, blink, dash)
  - `src/game/player/index.ts` (clean architecture composition root for the player entity)
- **Modified Modules**:
  - `src/game/render.ts` (delegate player drawing to the new player composition root)
  - `src/game/init.ts` (pass frame ticks, update animation state, handle asset loading callback)
  - `src/game/types.ts` (extend Player with animation state, frames, and asset state)
- **Tests**:
  - `tests/game-player-animation.test.ts` (unit tests for pure animation state picker `pickFrame` - 15+ cases)
  - `tests/game-build.test.ts` (integration verification: ensure `player.png` exists in built bundle)

## Technical Approach

### 1. Spritesheet Layout

The spritesheet will be a horizontal PNG of 9 frames, each 32×48 px. Total dimensions = 288×48 px.

```
┌──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┐
│ IDLE │WALK-D│WALK-D│WALK-U│WALK-U│WALK-L│WALK-L│WALK-R│WALK-R│
│  0   │  F1  │  F2  │  F1  │  F2  │  F1  │  F2  │  F1  │  F2  │
└──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┘
 Frame0  Frame1 Frame2 Frame3 Frame4 Frame5 Frame6 Frame7 Frame8
```

- **Frame 0**: Idle facing down
- **Frames 1-2**: Walk down (2 frames)
- **Frames 3-4**: Walk up (2 frames)
- **Frames 5-6**: Walk left (2 frames)
- **Frames 7-8**: Walk right (2 frames)

**Dynamic animation layers**:
- **Blink**: Since we are using a spritesheet, instead of needing separate blink frames, we will draw a small off-black rectangle overlay over the character's eye line programmatically when `blinkActive === true` inside `src/game/player/sprite.ts`. This saves asset size and preserves code-based control.
- **Dash Lean**: When `|vx| + |vy| > 4.0`, we will dynamically skew the canvas context by 8 degrees in the direction of velocity before drawing the frame (`ctx.transform(...)` or `ctx.rotate(...)`), creating a stylish leaning effect without extra sprite frames.

### 2. Spritesheet Generation Script (`scripts/generate-sprites-ai.py`)

A standalone Python script will:
1. Extract `GOOGLE_API_KEY` from the running shell environment.
2. Call Google's Imagen 3 generation endpoint (`imagen-3.0-generate-002`) using Python's `urllib` or `requests` to generate each of the required frames based on a highly-calibrated prompt designed for strict pixel-art consistency.
3. Use `Pillow` (`PIL`) to crop, normalize, and stitch the generated frames side-by-side into a single 288×48 px PNG.
4. Save the finalized asset to `public/sprites/player.png`.

We will provide a `pnpm generate-sprites` script in `package.json` to make this tool easily runnable.

### 3. Clean Architecture: `src/game/player/`

To enforce Clean Architecture and separation of concerns, the player rendering will be refactored into its own decoupled directory:

```
src/game/player/
├── types.ts        # Player-specific interfaces (AnimState, SpriteMap)
├── animation.ts    # Pure logic: pickFrame(vx, vy, dt, timeMs, currentAnimState) -> AnimState
├── sprite.ts       # Drawing primitives: drawFrame(ctx, image, frameIndex, x, y, options)
└── index.ts        # Composition root: PlayerEntity (orchestrates animation + sprite draw)
```

The main `src/game/render.ts` will simply import `PlayerEntity` and invoke its `draw` method.

## Threat Matrix & Constraints

- **No unauthorized secret mutation**: The generator script only reads `GOOGLE_API_KEY`; it does not write secrets or hardcode keys.
- **No new runtime dependencies**: No new package.json dependencies are allowed. The Python generator script will use standard libraries + `Pillow` (which is already present or easy to run in the global python environment, we will check).
- **Print contract preservation**: The spritesheet rendering must be screen-only. The `@media print` contract in `print.css` must remain 100% green and verified by `tests/print-contract.test.ts`.

## Migration & Verification

1. Run `pnpm generate-sprites` to produce the spritesheet under `public/sprites/player.png`.
2. Implement `src/game/player/` with strict unit tests in `tests/game-player-animation.test.ts`.
3. Verify that the build succeeds and the asset is packaged properly.
4. Verify that `pnpm test` (including the print-contract tests) passes with 100% success.
