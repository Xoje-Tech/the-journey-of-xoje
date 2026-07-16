/**
 * src/game/init.ts
 *
 * Public entry point for the videogame-ui slice. `init(canvas, opts)`
 * starts a `requestAnimationFrame` loop that:
 *   1. Polls input (keyboard on window, mouse on canvas, gamepad via
 *      `navigator.getGamepads()`).
 *   2. Integrates velocity with friction (physics.ts) and wraps the player
 *      around the canvas edges.
 *   3. Renders a grid background + the player square (render.ts).
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
import { drawGrid, drawPlayer } from './render';
import type { CanvasDims, InitOptions, InputState, Player } from './types';

// Phase 0 decisions, encoded as named constants so the values are greppable
// and tests can reference them.
export const DEFAULT_FRICTION = 0.92; // OQ1: smooth glide
export const DEFAULT_GRID_SIZE = 40;
export const DEFAULT_PLAYER_SIZE = 14;
export const DEFAULT_ACCEL = 0.6;

export interface GameHandle {
  /** Cancel the RAF loop and detach all listeners. */
  stop(): void;
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

  const state: InputState = {
    keys: {},
    mouseTarget: null,
    gamepadConnected: false,
    clearMouseTarget() {
      state.mouseTarget = null;
    },
  };

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

  function loop(): void {
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
    player.x += player.vx;
    player.y += player.vy;
    const wrapped = wrapAround(player, dims.w, dims.h);
    player.x = wrapped.x;
    player.y = wrapped.y;

    // Render. Logical-pixel coordinates because we already scaled the ctx.
    ctx.clearRect(0, 0, dims.w, dims.h);
    drawGrid(ctx, dims.w, dims.h, gridSize);
    drawPlayer(ctx, player);

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
  };
}

// accel is referenced via sampleInputs internally; export so a future test
// (or a tuning panel) can verify the same constant the loop uses.
void DEFAULT_ACCEL;