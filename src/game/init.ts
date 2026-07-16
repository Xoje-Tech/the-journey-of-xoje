/**
 * src/game/init.ts
 *
 * Public entry point for the videogame-ui slice. `init(canvas, opts)`
 * starts a `requestAnimationFrame` loop that:
 *   1. Polls input (keyboard on window, mouse on canvas, gamepad via
 *      `navigator.getGamepads()`).
 *   2. Integrates velocity with friction (physics.ts) and wraps the player
 *      around the canvas edges.
 *   3. Renders a grid background, the motion trail (P3), the player
 *      capsule (P1), and a telemetry HUD (P2).
 *
 * Phase-2 polish (added in this slice):
 *   - Capsule sprite (drawPlayerCapsule, P1): vertical pill, white fill,
 *     subtle dark stroke. Idle facing defaults to "down".
 *   - Motion trail (drawTrail, P3): a ring buffer of the last 14 player
 *     positions, fading to zero over 280 ms. Cleared on canvas wrap.
 *   - HUD (P2): "xoje.dev" + pos / vel / fps, drawn into the canvas via
 *     ctx.fillText so no DOM element is created (and the slice-1 print
 *     contract stays intact). FPS computed from a 30-frame rolling window.
 *   - Blink animation (P1): the capsule "blinks" for 120 ms every 3–5 s,
 *     timestamped from a single closure-scoped deadline.
 *
 * Design decisions encoded as constants (Phase 0):
 *   - friction = 0.92 (OQ1: user-confirmed smooth glide)
 *   - mouse click = one-shot target cleared on arrival (OQ2)
 *   - DPR-scaled backing store (OQ3): canvas.width/height in DEVICE pixels,
 *     CSS width/height in LOGICAL pixels, ctx.scale(dpr, dpr) before draw.
 *   - Vitest 1.6.1 stays; no new deps (OQ4, matches design doctrine).
 *   - page-break-inside: avoid still applies to the CV section (OQ5) — this
 *     module does not touch print.css.
 *
 * Tab-hidden safe: `document.visibilitychange` pauses the loop (no RAF
 * scheduling while hidden) and resumes when the tab is visible again.
 * Player state is preserved across pause/resume.
 *
 * Return value: `{ stop() }` cancels the RAF loop and detaches listeners.
 */
import { applyFriction, wrapAround } from './physics';
import { sampleInputs } from './input';
import {
  drawGrid,
  drawTrail,
  updateTrail,
  TRAIL_MAX_AGE_MS,
  TRAIL_MAX_LEN,
} from './render';
import { formatHud } from './hud';
import { PlayerEntity } from './player';
import type { CanvasDims, InitOptions, InputState, Player, TrailPoint } from './types';

// Phase 0 decisions, encoded as named constants so the values are greppable
// and tests can reference them.
export const DEFAULT_FRICTION = 0.92; // OQ1: smooth glide
export const DEFAULT_GRID_SIZE = 40;
export const DEFAULT_PLAYER_SIZE = 14;
export const DEFAULT_ACCEL = 0.6;

// Phase-2 polish constants. Keep them next to the slice so anyone reading
// init.ts sees the magic numbers in context.
const FPS_WINDOW = 30; // rolling window for the FPS counter
const HUD_PAD_X = 16; // logical px from the left edge
const HUD_PAD_Y = 16; // logical px from the top edge
const HUD_FONT = '14px ui-monospace, "JetBrains Mono", Menlo, Consolas, monospace';
const HUD_COLOR = '#cfcfd0';
const HUD_LINE_HEIGHT = 18; // logical px per line at 14px font + line-height ~1.3

// Blink duration matching the visual specs (120ms parpadeo)
const BLINK_DURATION_MS = 120;
const BLINK_MIN_INTERVAL_MS = 3000;
const BLINK_MAX_INTERVAL_MS = 5000;

export interface GameHandle {
  /** Cancel the RAF loop and detach all listeners. */
  stop(): void;
  /**
   * Current frames-per-second reading from the rolling 30-frame window.
   * Updated once per RAF tick; returns 0 until the second frame lands.
   */
  getFps(): number;
}

export function init(canvas: HTMLCanvasElement, opts: InitOptions = {}): GameHandle {
  const ctxOrNull = canvas.getContext('2d');
  if (!ctxOrNull) {
    throw new Error('[videogame-ui] could not acquire 2D context');
  }
  // Capture as a non-null const so closures see the narrowed type under
  // `noUncheckedIndexedAccess` + `strict`. TS doesn't preserve the `!ctx`
  // narrowing into the closures we define below.
  const ctx: CanvasRenderingContext2D = ctxOrNull;

  const friction = opts.friction ?? DEFAULT_FRICTION;
  const gridSize = opts.gridSize ?? DEFAULT_GRID_SIZE;
  const accel = opts.acceleration ?? DEFAULT_ACCEL;
  const playerSize = DEFAULT_PLAYER_SIZE;

  const dims: CanvasDims = { w: 0, h: 0, dpr: 1 };

  const player: Player = {
    x: 0, // overwritten by initial-size handler so it lands top-center
    y: 0,
    vx: 0,
    vy: 0,
    size: playerSize,
  };

  /** Instantiate the clean architecture PlayerEntity and load spritesheet */
  const playerEntity = new PlayerEntity('/sprites/player.png');
  playerEntity.load().catch((err) => {
    console.error("Failed to load player spritesheet asynchronously:", err);
  });

  /** Ring buffer of trail points. Mutated by `updateTrail` per frame. */
  let trail: TrailPoint[] = [];

  const state: InputState = {
    keys: {},
    mouseTarget: null,
    gamepadConnected: false,
    clearMouseTarget() {
      state.mouseTarget = null;
    },
  };

  // FPS rolling-window state. We store timestamps (ms since the page
  // navigation start, via `performance.now()`) for the last `FPS_WINDOW`
  // frames, then compute `1000 / average_dt_ms`. We expose `getFps` from
  // the closure for any future caller (e.g. a dev-mode overlay), but no
  // test or production path reads it today.
  const frameTimes: number[] = [];
  let fpsValue = 0;
  function getFps(): number {
    return fpsValue;
  }

  // Blink animation state. `blinkStart` is the timestamp at which the
  // current blink began (or -Infinity if no blink is active). `nextBlinkAt`
  // is the timestamp at which the next blink should start. Both are
  // initialised so the first blink fires after `BLINK_MIN_INTERVAL_MS`.
  let blinkStart = -Infinity;
  let nextBlinkAt = performance.now() + randInRange(BLINK_MIN_INTERVAL_MS, BLINK_MAX_INTERVAL_MS);

  /**
   * Apply the current canvas size to the backing store and the CSS box.
   * Per OQ3, CSS keeps logical px (matches clientWidth/Height) and the
   * backing store is scaled by dpr for crisp drawing on retina displays.
   */
  function resize(): void {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const cssW = canvas.clientWidth || window.innerWidth;
    const cssH = canvas.clientHeight || window.innerHeight;
    dims.w = cssW;
    dims.h = cssH;
    dims.dpr = dpr;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    ctx.setTransform(1, 0, 0, 1, 0, 0); // reset prior scale
    ctx.scale(dpr, dpr);

    // On first resize, place the player horizontally centered at the top.
    if (player.x === 0 && player.y === 0) {
      player.x = cssW / 2;
      player.y = playerSize;
    }
  }

  function onKeyDown(e: KeyboardEvent): void {
    state.keys[e.key] = true;
  }
  function onKeyUp(e: KeyboardEvent): void {
    state.keys[e.key] = false;
  }
  function onMouseDown(e: MouseEvent): void {
    const rect = canvas.getBoundingClientRect();
    state.mouseTarget = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }
  function onGamepadConnected(): void {
    state.gamepadConnected = true;
  }
  function onGamepadDisconnected(): void {
    state.gamepadConnected = false;
  }
  function onVisibility(): void {
    if (document.hidden) {
      pause();
    } else {
      resume();
    }
  }

  // Initial sizing + listener wiring (before first frame).
  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousedown', onMouseDown);
  window.addEventListener('gamepadconnected', onGamepadConnected);
  window.addEventListener('gamepaddisconnected', onGamepadDisconnected);
  document.addEventListener('visibilitychange', onVisibility);

  let rafId = 0;
  let paused = false;
  let lastFrameMs = performance.now();

  function loop(): void {
    const now = performance.now();
    const dtMs = now - lastFrameMs;
    lastFrameMs = now;

    // FPS rolling-window update. `frameTimes` is monotonic-increasing
    // timestamps; the average dt over the window is the inverse fps.
    frameTimes.push(now);
    if (frameTimes.length > FPS_WINDOW) frameTimes.shift();
    if (frameTimes.length >= 2) {
      const first = frameTimes[0]!;
      const last = frameTimes[frameTimes.length - 1]!;
      const span = last - first;
      fpsValue = span > 0 ? Math.round((1000 * (frameTimes.length - 1)) / span) : 0;
    }

    // Blink scheduling. `now >= nextBlinkAt` starts a new blink and rolls
    // the next deadline; otherwise we keep the current blink alive while
    // `now - blinkStart < BLINK_DURATION_MS`.
    if (now >= nextBlinkAt) {
      blinkStart = now;
      nextBlinkAt = now + randInRange(BLINK_MIN_INTERVAL_MS, BLINK_MAX_INTERVAL_MS);
    }
    const blinkActive = now - blinkStart < BLINK_DURATION_MS;

    // Pull the latest gamepad reading (axes 0/1 + dpad buttons). Polled
    // here rather than from events so the value is exactly the stick's
    // current state for this frame.
    let stick: { x: number; y: number } | undefined;
    let dpad: { up: boolean; down: boolean; left: boolean; right: boolean } | undefined;
    if (state.gamepadConnected && typeof navigator.getGamepads === 'function') {
      const pads = navigator.getGamepads();
      const pad = pads && pads[0];
      if (pad) {
        stick = { x: pad.axes[0] ?? 0, y: pad.axes[1] ?? 0 };
        // Standard mapping: buttons 12/13/14/15 are the dpad on most pads.
        dpad = {
          up: !!pad.buttons[12]?.pressed,
          down: !!pad.buttons[13]?.pressed,
          left: !!pad.buttons[14]?.pressed,
          right: !!pad.buttons[15]?.pressed,
        };
      }
    }

    const v = sampleInputs(state, canvas, dims.w, dims.h, stick, dpad, player);

    // Integrate: v = (v + input) * friction, then add to position.
    player.vx = (player.vx + v.vx) * friction;
    player.vy = (player.vy + v.vy) * friction;
    // Snap-to-zero when velocity is below an epsilon to stop endless creep.
    if (Math.abs(player.vx) < 1e-3) player.vx = 0;
    if (Math.abs(player.vy) < 1e-3) player.vy = 0;
    const prevX = player.x;
    const prevY = player.y;
    player.x += player.vx;
    player.y += player.vy;
    const wrapped = wrapAround(player, dims.w, dims.h);
    const didWrap = wrapped.x !== prevX + player.vx || wrapped.y !== prevY + player.vy;
    player.x = wrapped.x;
    player.y = wrapped.y;

    // Trail update: append the current position, age the buffer, drop
    // old entries. Reset the trail when the player wraps around — a
    // teleport from one edge to another would otherwise leave a streak
    // across the canvas.
    trail = updateTrail(
      trail,
      dtMs,
      TRAIL_MAX_AGE_MS,
      TRAIL_MAX_LEN,
      didWrap ? null : { x: player.x, y: player.y },
    );
    if (didWrap) {
      // After a wrap, drop the old buffer entirely so the next frame's
      // trail starts fresh on the new edge.
      trail = [];
    }

    // Render. Logical-pixel coordinates because we already scaled the ctx.
    ctx.clearRect(0, 0, dims.w, dims.h);
    drawGrid(ctx, dims.w, dims.h, gridSize);
    drawTrail(ctx, trail, TRAIL_MAX_AGE_MS);
    
    // Draw and progress player spritesheet animation
    playerEntity.updateAndDraw(ctx, player.x, player.y, player.vx, player.vy, dtMs, blinkActive);
    
    drawHud(ctx, player, dims.w, dims.h, fpsValue);

    if (!paused) rafId = requestAnimationFrame(loop);
  }

  function pause(): void {
    if (paused) return;
    paused = true;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
  }
  function resume(): void {
    if (!paused) return;
    paused = false;
    rafId = requestAnimationFrame(loop);
  }

  rafId = requestAnimationFrame(loop);

  return {
    stop(): void {
      pause();
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('gamepadconnected', onGamepadConnected);
      window.removeEventListener('gamepaddisconnected', onGamepadDisconnected);
      document.removeEventListener('visibilitychange', onVisibility);
    },
    getFps,
  };
}

/**
 * Render the HUD (brand + pos + vel + fps) into the top-left corner of
 * the canvas. `formatHud` returns the raw string; we draw it line-by-line.
 */
function drawHud(
  ctx: CanvasRenderingContext2D,
  player: Player,
  canvasW: number,
  canvasH: number,
  fps: number,
): void {
  ctx.save();
  ctx.font = HUD_FONT;
  ctx.fillStyle = HUD_COLOR;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  const text = formatHud(player, canvasW, canvasH, fps);
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i] ?? '', HUD_PAD_X, HUD_PAD_Y + i * HUD_LINE_HEIGHT);
  }
  ctx.restore();
}

/**
 * Random integer in the inclusive range `[min, max]`. Used for blink
 * scheduling — each blink interval is independently randomized so the
 * animation feels organic rather than metronomic.
 */
function randInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

// accel is referenced via sampleInputs internally; export so a future test
// (or a tuning panel) can verify the same constant the loop uses.
void DEFAULT_ACCEL;
void applyFriction; // re-export kept for future slice work; suppress unused-arg lint.
