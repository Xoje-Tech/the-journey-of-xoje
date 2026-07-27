# Tasks: videogame-ui

## Review Workload Forecast

| Field                   | Value                                                  |
| ----------------------- | ------------------------------------------------------ |
| Estimated changed lines | ~280–380 (modules ~150, tests ~120, CSS/component ~50) |
| 400-line budget risk    | Low (approaching but under 400)                        |
| Chained PRs recommended | No                                                     |
| Suggested split         | single PR                                              |
| Delivery strategy       | ask-on-risk                                            |
| Chain strategy          | pending                                                |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

## Phase 0: Pre-change Baseline

- [x] 0.1 Run `pnpm dev` + `node scripts/print-preview-headless.mjs` to capture `tmp/print-preview-{es,en}-baseline.pdf` BEFORE any change.
- [x] 0.2 Confirm `pnpm test` green (`print-contract` + `build-cv`); record baseline state.
- [x] 0.3 OQ1: ask user friction feel — sweep `{0.88, 0.92, 0.96}`; default 0.92 per design. **Resolved: 0.92.**
- [x] 0.4 OQ2: ask user mouse-click semantics — (a) one-shot target vs (b) continuous steering; default (a). **Resolved: one-shot.**
- [x] 0.5 OQ3: confirm DPR-scaled backing store, logical-px CSS; encode in task 1.7.
- [x] 0.6 OQ4: Vitest stays 1.6.1 — do NOT bump to v4 (no new deps doctrine).
- [x] 0.7 OQ5: `page-break-inside: avoid` stays on `article[data-locale] h1/h2/h3` + `section[data-cv-section]`; print contract unchanged.

## Phase 1: Game Engine Modules

- [x] 1.1 Create `src/game/types.ts` — `Player`, `InputState`, `CanvasDims`, `InitOptions`.
- [x] 1.2 RED: `tests/game-physics.test.ts` covers `wrap-around` scenarios (right/bottom edge, ±x/±y, exact-edge). Run → RED.
- [x] 1.3 GREEN: `src/game/physics.ts` with `wrapAround(p,w,h)` (`((x%w)+w)%w`) + `applyFriction(v,f)`. Re-run → GREEN.
- [x] 1.4 RED: `tests/game-input.test.ts` — deadzone 0.15, keyboard clears mouseTarget, d-pad overrides analog. Run → RED.
- [x] 1.5 GREEN: `src/game/input.ts` with `sampleInputs(state,canvas,w,h)` (keyboard+gamepad window, mouse canvas). Re-run → GREEN.
- [x] 1.6 Create `src/game/render.ts` — `drawGrid(ctx,w,h,gridSize)`, `drawPlayer(ctx,p)`; visual check in Phase 4.
- [x] 1.7 Create `src/game/init.ts` — `init(canvas,opts): { stop() }`; RAF loop, DPR-aware resize (OQ3), tab-hidden safe; vanilla TS.

## Phase 2: DOM/CSS Wiring

- [x] 2.1 `src/components/CvDocument.astro`: insert `<canvas id="game-canvas" aria-hidden="true" role="img">` before `<article data-locale={locale}>`.
- [x] 2.2 `src/layouts/CvLayout.astro`: add `<script>import {init} from '../game/init.ts'; const c=document.getElementById('game-canvas'); if(c instanceof HTMLCanvasElement) init(c);</script>` before `</body>`.
- [x] 2.3 `src/styles/screen.css`: add `@media screen { article[data-locale]{display:none!important} #game-canvas{position:fixed;inset:0;width:100vw;height:100vh;background:#0e0e10;z-index:10} }`.
- [x] 2.4 `src/styles/print.css`: inside `@media print` prepend `#game-canvas,.game-hud{display:none!important}`.

## Phase 3: Tests

- [x] 3.1 RED: `tests/game-build.test.ts` asserts emitted `dist/{es,en}/index.html` has `<canvas id="game-canvas">` AND 7 `print-contract` substrings still present. Run → RED.
- [x] 3.2 GREEN: `pnpm build`; re-run `pnpm test`; all regex assertions pass.
- [x] 3.3 `tests/print-contract.test.ts` still passes — `print.css` GAINS, doesn't lose any rules.
- [x] 3.4 E2E print diff: `node scripts/print-preview-headless.mjs` → `tmp/print-preview-{es,en}-after.pdf`; diff vs Phase-0 baselines.

## Phase 4: Verification

- [x] 4.1 Browser `/es/`: canvas covers viewport, player top-center, grid renders, WASD/arrows glide + wrap.
- [x] 4.2 Gamepad: left stick + D-pad drive player with 0.15 deadzone, no drift at rest.
- [x] 4.3 Click a canvas point: player steers there; keyboard resumes (per OQ2).
- [x] 4.4 Ctrl+P: Harvard CV renders, zero canvas pixels, zero HUD; cancel → game resumes, no state loss.
- [x] 4.5 Keep baseline PDFs for regression; no auto-commit (doctrine).
