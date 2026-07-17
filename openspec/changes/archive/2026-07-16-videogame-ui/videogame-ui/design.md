# Design: videogame-ui

## Technical Approach

Approach 1 (Pure CSS Media-Query Hide/Show) per exploration. The game and the printable CV live in the same HTML page; CSS media queries swap them. The game engine is a small browser-native TypeScript module tree under `src/game/`. No new deps: `<canvas>`, `requestAnimationFrame`, and `navigator.getGamepads()` are native. The proposal's `videogame-ui-game` + `videogame-ui-print` capabilities are mirrored exactly. The slice-1 print contract is preserved by adding only a `#game-canvas { display: none !important; }` guard inside `@media print`.

## Architecture Decisions

| Decision          | Options                                                                        | Tradeoff                                                                      | **Decision**                                                                                                                                                                                                                     |
| ----------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **DOM placement** | (a) inside `CvDocument`, (b) inside `CvLayout`, (c) new `<GameCanvas>`         | (a) colocates with `data-locale`; (b) breaks slot story; (c) over-abstraction | **(a) — `<canvas id="game-canvas">` as sibling of `<article>` in `CvDocument.astro`, before it**                                                                                                                                 |
| **Engine shape**  | (a) one file, (b) `types`/`input`/`physics`/`render`/`init` module tree        | (a) likely > 200 lines, hard to test                                          | **(b)** — five small files, all pure except `init.ts`                                                                                                                                                                            |
| **Input routing** | (a) `window` listeners for keys+gamepad, `canvas` for mouse; (b) all on canvas | (a) WASD-on regardless of focus                                               | **(a)** — matches exploration                                                                                                                                                                                                    |
| **Locale impact** | (a) one game shared across `/es/` + `/en/`, (b) duplicate per locale           | locale content is identical on screen                                         | **(a) one canvas, locale-agnostic**                                                                                                                                                                                              |
| **CSS layering**  | (a) `@media screen` block in `screen.css`, (b) separate `game.css`             | (b) splits related rules                                                      | **(a) — `screen.css` gains `@media screen { article[data-locale]{display:none!important} #game-canvas{position:fixed;inset:0;width:100vw;height:100vh;z-index:10} }`; `print.css` gains `#game-canvas{display:none!important}`** |
| **Tick model**    | (a) RAF only, (b) RAF + `setTimeout` fallback                                  | (b) unnecessary                                                               | **(a)**                                                                                                                                                                                                                          |
| **DOM test env**  | (a) add `happy-dom`/`jsdom` devDep, (b) test pure funcs + mock canvas          | "no new deps w/o asking"                                                      | **(b) — physics/input are pure; init/render validated by chromium PDF diff**                                                                                                                                                     |

## Data Flow — One Frame

```
   window (WASD/Arrow/D-pad)   canvas (mousedown)
              │                       │
              └───────────┬───────────┘
                          ▼
              sampleInputs() → {vx, vy}
                          ▼
            player.update(vx, vy)        // vx+=vx*accel; vx*=friction
                          ▼
        wrapAround(player, w, h)         // x = ((x % w) + w) % w
                          ▼
          drawGrid(ctx, w, h, grid)
              drawPlayer(ctx, player)
                          ▼
            requestAnimationFrame(loop)
                          │
                          │ Ctrl+P fires @media print
                          ▼
       #game-canvas { display: none !important }
       article[data-locale] visible → Harvard sheet
```

The non-obvious bit — **wrap-around**: `x = ((x % w) + w) % w`. JavaScript's `%` keeps the dividend's sign, so plain `x % w` yields negatives under leftward motion. The double-mod corrects that.

## File Changes

| File                              | Action | Purpose                                                                                                                                                                                                                                                |
| --------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/game/types.ts`               | Create | `Player`, `InputState`, `CanvasDims`, `InitOptions` interfaces                                                                                                                                                                                         |
| `src/game/input.ts`               | Create | `sampleInputs(state, _canvas, w, h, stick?, dpad?, playerPos?)` — keyboard + mouse + gamepad poll, deadzone 0.15; the `_canvas` and trailing optional params are test seams for DOM-free vitest 1.6.1 (design deviation, see verify-report warning #1) |
| `src/game/physics.ts`             | Create | `wrapAround`, `applyFriction` — pure functions                                                                                                                                                                                                         |
| `src/game/render.ts`              | Create | `drawGrid`, `drawPlayer` — 2D context draws                                                                                                                                                                                                            |
| `src/game/init.ts`                | Create | `init(canvas, opts)` — public entry; RAF loop; resize w/ DPR; returns `{ stop() }`                                                                                                                                                                     |
| `src/components/CvDocument.astro` | Modify | Insert `<canvas id="game-canvas" aria-hidden="true" role="img">` before `<article>`                                                                                                                                                                    |
| `src/layouts/CvLayout.astro`      | Modify | Add `<script>` calling `init(canvas)` from `src/game/init.ts`                                                                                                                                                                                          |
| `src/styles/screen.css`           | Modify | `@media screen { article[data-locale]{display:none!important} #game-canvas{position:fixed;inset:0;width:100vw;height:100vh;background:#0e0e10;z-index:10} }`                                                                                           |
| `src/styles/print.css`            | Modify | Inside `@media print`: prepend `#game-canvas,.game-hud{display:none!important}`                                                                                                                                                                        |
| `tests/game-physics.test.ts`      | Create | Unit: `wrapAround` for ±x, ±y, exact edges                                                                                                                                                                                                             |
| `tests/game-input.test.ts`        | Create | Unit: deadzone 0.15, keyboard clears mouseTarget, d-pad overrides analog                                                                                                                                                                               |
| `tests/game-build.test.ts`        | Create | Integration: `astro build` emits dist HTML containing `<canvas id="game-canvas">` AND keeps slice-1 print contract substrings                                                                                                                          |
| (deleted)                         | —      | none                                                                                                                                                                                                                                                   |

## Interfaces / Contracts

```ts
// src/game/types.ts
export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
}
export interface InputState {
  keys: Record<string, boolean>;
  mouseTarget: { x: number; y: number } | null;
  gamepadConnected: boolean;
  clearMouseTarget(): void;
}
export interface CanvasDims {
  w: number;
  h: number;
  dpr: number;
}
export interface InitOptions {
  gridSize?: number;
  friction?: number;
  acceleration?: number;
  deadzone?: number;
}
```

```ts
// src/game/input.ts (test-extended signature — see deviation note below)
// Design called for (state, canvas, w, h). The shipped implementation is
// (state, _canvas, w, h, stick?, dpad?, playerPos?) — the extra params are
// optional seams so vitest 1.6.1 can drive sampleInputs() without a DOM
// environment (no jsdom/happy-dom per the no-new-deps rule). The return
// type ({vx, vy}) and the precedence semantics (keyboard > mouse > gamepad)
// are unchanged from this contract.
export function sampleInputs(
  state: InputState,
  _canvas: HTMLCanvasElement | null,
  w: number,
  h: number,
  stick?: { x: number; y: number },
  dpad?: { up: boolean; down: boolean; left: boolean; right: boolean },
  playerPos?: { x: number; y: number },
): { vx: number; vy: number };
```

```ts
// src/game/init.ts (public API)
export function init(canvas: HTMLCanvasElement, opts?: InitOptions): { stop(): void };
```

Vanilla TS (no class), matching the project's existing content-script style.

### Design deviation: `sampleInputs` extended signature

The original design called for a 4-arg `sampleInputs(state, canvas, w, h)`. The shipped implementation accepts three additional optional parameters (`stick`, `dpad`, `playerPos`) so the function can be unit-tested under vitest 1.6.1 without a DOM environment (the project policy is "no jsdom/happy-dom without explicit user OK"). The loop in `init.ts` polls `navigator.getGamepads()` itself and passes the readings down — the same data the production code would have read directly. Tests use these optional seams to inject synthetic gamepad readings; production code still calls `sampleInputs(state, canvas, dims.w, dims.h, stick, dpad, player)`. Return type `{vx, vy}` and precedence (keyboard > mouse > gamepad) are unchanged.

## Testing Strategy

| Layer           | What                                                                                                                              | How                                                                                                                                               |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Unit**        | `wrapAround`, `applyFriction`, `sampleInputs` (deadzone + override)                                                               | `tests/game-physics.test.ts`, `tests/game-input.test.ts` — pure-function vitest, no DOM                                                           |
| **Integration** | emitted `dist/{es,en}/index.html` contains `<canvas id="game-canvas">` AND slice-1 print contract substrings still in emitted CSS | `tests/game-build.test.ts` runs `astro build`, regex-walks `dist/`                                                                                |
| **E2E**         | print PDF `/es/` and `/en/` matches pre-change baseline (zero canvas pixels, Harvard intact)                                      | reuse `scripts/print-preview-headless.mjs` with `--emulate-media=print`; diff vs `tmp/print-preview-{es,en}-baseline.pdf` captured BEFORE changes |

`tests/print-contract.test.ts` MUST keep passing — `print.css` gains, doesn't lose, contract substrings.

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary. The change is client-side canvas + CSS in a fully static Astro page.

## Migration / Rollout

No data migration. **Pre-change baseline (must be captured before sdd-apply):** run `scripts/print-preview-headless.mjs` to produce `tmp/print-preview-es-baseline.pdf` and `tmp/print-preview-en-baseline.pdf`. These are the regression baseline for `tests/game-build.test.ts`.

## Open Questions (propagate to `sdd-tasks`)

- [ ] **Friction constant:** exploration proposes `0.92`. sdd-apply must sweep {0.88, 0.92, 0.96} against user feel.
- [ ] **Mouse-click semantics:** spec leaves room — (a) one-shot target cleared on arrival vs (b) continuous steering vector. Decide in sdd-apply.
- [ ] **`devicePixelRatio` on resize:** confirm backing-store-by-DPR strategy up front in sdd-apply task description (CSS stays at logical px).
- [ ] **Vitest version:** package.json declares `^1.0.0`; installed = `1.6.1`. Task brief mentions "Vitest 4" — cannot upgrade without user OK per doctrine. Proceed with 1.6.1.
- [ ] **`page-break-inside: avoid`** still applies only to `article[data-locale] h1/h2/h3` and `section[data-cv-section]` — print contract unchanged.
