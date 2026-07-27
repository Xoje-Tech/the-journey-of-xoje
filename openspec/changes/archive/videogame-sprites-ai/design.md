# Design: videogame-sprites-ai

## Technical Approach

We will build a custom AI-driven spritesheet generator script (`scripts/generate-sprites-ai.py`) that leverages the user's `GOOGLE_API_KEY` (already configured in their Bitwarden Secrets Manager vault) to generate 9 high-quality pixel-art humanoid frames using Google's **Imagen 3** API (`imagen-3.0-generate-002`).

The generated frames will be stitched horizontally into a single 288×48 px spritesheet and saved to `public/sprites/player.png`.

The frontend runtime will be refactored to decouple all player rendering and animation selection into a clean, testable sub-directory `src/game/player/` following clean architecture principles.

```
                  src/game/init.ts (Game Loop / RAF)
                           │
                           │ ticks & updates
                           ▼
               src/game/player/index.ts (Composition Root)
                (PlayerEntity orchestrates state & draw)
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
src/game/player/animation.ts    src/game/player/sprite.ts
   (Pure: pickFrame state)    (Impure: Canvas drawFrame,
                               blink lines, dash-skew)
```

---

## Architecture Decisions

| Decision               | Options                                                      | Tradeoff                                                                 | **Decision**                                               |
| ---------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------ | ---------------------------------------------------------- |
| **Asset format**       | (a) Vector SVG, (b) Programmatic shapes, (c) Spritesheet PNG | (a) hard to animate, (b) tedious math, (c) asset size & loading overhead | **(c) Spritesheet PNG** — classic, high fidelity, standard |
| **Image Generator**    | (a) Native FAL, (b) Local Python Gemini Imagen 3             | (a) FAL_KEY is missing, (b) GOOGLE_API_KEY is available in BWS           | **(b) Custom Python Script using Gemini Imagen 3 API**     |
| **Spritesheet Layout** | (a) 4x4 matrix, (b) 9x1 horizontal strip                     | (b) trivial frame indexing `col * frameW` without row modulo math        | **(b) 9x1 strip (288×48 px)**                              |
| **Structure**          | (a) Flat files, (b) Isolated `src/game/player/` module       | (b) Separation of Concerns, Clean Architecture                           | **(b) isolated module with types/animation/sprite/index**  |
| **Blink layer**        | (a) separate frames, (b) code-drawn overlay                  | (a) inflates spritesheet size, (b) lightweight and highly flexible       | **(b) Code-drawn line overlay** over the eyes              |
| **Dash feedback**      | (a) run-fast sprites, (b) code-skewed context                | (a) more assets, (b) dynamic momentum feel with 0 asset cost             | **(b) Context skew/rotate (8 degrees)**                    |

---

## Interfaces / Contracts

```ts
// src/game/player/types.ts

export type PoseType = 'idle' | 'walk-down' | 'walk-up' | 'walk-left' | 'walk-right';

export interface AnimState {
  pose: PoseType;
  frameIndex: number; // 0 to 8 mapping to the spritesheet column
  timeSinceLastFrame: number; // ms accumulated
  dashLeanActive: boolean; // true if |vx|+|vy| > 4.0
}

export interface PlayerSpriteConfig {
  frameW: number; // 32
  frameH: number; // 48
  spritesheetPath: string; // '/sprites/player.png'
}
```

```ts
// src/game/player/animation.ts
// PURE — no canvas, no DOM, fully unit-testable under vitest 1.6.1

export function pickFrame(vx: number, vy: number, dtMs: number, current: AnimState): AnimState;
```

```ts
// src/game/player/sprite.ts
// IMPURE — canvas drawing primitives for spritesheet columns + blink + lean

export function drawPlayerFrame(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  state: AnimState,
  x: number, // Player logical center X
  y: number, // Player logical center Y
  blinkActive: boolean,
): void;
```

```ts
// src/game/player/index.ts
// Composition Root - encapsulates player rendering & animation state progression

export class PlayerEntity {
  private img: HTMLImageElement | null = null;
  private animState: AnimState;

  constructor(spritesheetPath: string);

  // Load spritesheet image in browser environment safely
  load(): Promise<void>;

  // Progresses animation and renders the frame
  updateAndDraw(
    ctx: CanvasRenderingContext2D,
    playerX: number,
    playerY: number,
    vx: number,
    vy: number,
    dtMs: number,
    blinkActive: boolean,
  ): void;
}
```

---

## Spritesheet Generator Blueprint (`scripts/generate-sprites-ai.py`)

The script will be a robust, self-contained Python program:

1. It creates `.venv` inside `scripts/` if missing.
2. It installs `Pillow` and `requests` (using pip from the `.venv`).
3. It iterates over the 9 frames (Idle, Walk-Down × 2, Walk-Up × 2, Walk-Left × 2, Walk-Right × 2).
4. For each frame, it makes an authenticated POST request to:
   `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict`
   passing the `GOOGLE_API_KEY` as a query param.
5. It handles rate-limits and errors cleanly (backoff-retry).
6. It uses `PIL.Image` to:
   - Crop and center each generated character to exactly `32×48 px`.
   - Stitch all 9 frames side-by-side into a single `288×48 px` image.
   - Save the result to `public/sprites/player.png`.

To run it, we inject the keys from BWS:

```bash
BWS_ACCESS_TOKEN="..." hermes exec -- pnpm generate-sprites
```

Or simply let the user run it from their terminal where their BWS/credentials are already mapped.

---

## Testing Strategy

- **Unit (`tests/game-player-animation.test.ts`)**:
  - Assert that at rest, `pickFrame` returns `pose = 'idle'` and `frameIndex = 0`.
  - Assert that under down-velocity, `pickFrame` loops through `frameIndex = 1` and `frameIndex = 2`.
  - Assert that under left-velocity, it loops through `frameIndex = 5` and `frameIndex = 6`.
  - Assert that `dashLeanActive` triggers exactly when `|vx| + |vy| > 4.0`.
  - Check speed-scaling of frame durations (fast vs. slow walk loops).
- **Source Inspection (`tests/game-player-build.test.ts`)**:
  - Assert that `src/game/player/index.ts` exports `PlayerEntity`.
  - Assert that `src/game/player/animation.ts` exports `pickFrame`.
  - Assert that `pnpm build` bundles correctly with no TypeScript errors.
