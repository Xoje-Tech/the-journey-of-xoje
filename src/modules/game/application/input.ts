/**
 * src/game/input.ts
 *
 * Pure input sampler. Reads the current InputState plus optional live
 * gamepad/dpad snapshots and returns a normalized movement vector
 * `{ vx, vy }` to feed into the physics layer.
 *
 * Why a pure function (and not directly mutating player state):
 *   - Unit-testable without DOM (tests pass synthetic state + stick values).
 *   - The browser-side init.ts owns the event listeners; this module only
 *     decides what the current frame's input is.
 *
 * Precedence (highest first):
 *   1. Keyboard (WASD + arrows). When any movement key is held, the pending
 *      mouseTarget is cleared (OQ2: keyboard overrides mouse).
 *   2. Gamepad D-pad (discrete buttons). When pressed, D-pad wins over a
 *      contradicting analog stick. ALSO clears the pending mouseTarget
 *      (Slice-A fix: gamepad must override mouse just like keyboard does,
 *      otherwise the player drifts back to a stale click point after the
 *      user releases the D-pad).
 *   3. Gamepad analog stick with a 0.15 deadzone — inside the deadzone the
 *      stick reads as zero (no drift at rest). ABOVE the deadzone it ALSO
 *      clears the pending mouseTarget (same rationale as the D-pad).
 *   4. Mouse one-shot target — produces a unit vector toward the click
 *      point, normalized so diagonal isn't faster than axis-aligned.
 *
 * Mouse-arrival handling: when the caller passes `playerPos`, the function
 * checks whether the player is within `arrivalRadius` of `mouseTarget` and
 * calls `state.clearMouseTarget()` if so (one-shot semantics).
 */
import type { InputState } from "@/modules/game/domain/types";

/** Default analog-stick deadzone. Below this magnitude, treat the stick as zero. */
export const DEFAULT_DEADZONE = 0.15;

/** Default per-frame acceleration applied while a movement key is held. */
export const DEFAULT_ACCELERATION = 0.6;

/** Distance threshold (logical px) below which a click target is considered reached. */
const ARRIVAL_RADIUS = 1.5;

/**
 * Convert a PointerEvent to canvas-local logical coordinates.
 *
 * Exported as a pure function so unit tests can drive it with synthetic
 * PointerEvents (the DOM-emitted ones in jsdom are unreliable; using
 * `{} as PointerEvent` and filling offsetX/Y works fine).
 *
 * Pointer Events unify mouse / touch / pen under one path. The sampler
 * in `sampleInputs` only consumes `state.mouseTarget`, which is
 * pointer-type agnostic.
 *
 * - When the event exposes `offsetX`/`offsetY` (modern browsers, e.g.
 *   Chrome and Safari since 2018), we use them directly. They account
 *   for CSS transforms and scroll automatically.
 * - Older or synthetic events fall back to `clientX`/`clientY` minus the
 *   canvas bounding rect, which is the same math the previous
 *   `mousedown` handler used.
 */
export function pointerEventToCanvasTarget(
  canvas: HTMLCanvasElement,
  e: { offsetX?: number; offsetY?: number; clientX: number; clientY: number },
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  const x = typeof e.offsetX === 'number' ? e.offsetX : e.clientX - rect.left;
  const y = typeof e.offsetY === 'number' ? e.offsetY : e.clientY - rect.top;
  return { x, y };
}

export interface Dpad {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

export interface Stick {
  x: number;
  y: number;
}

export interface SampleInput {
  vx: number;
  vy: number;
  /**
   * Which input source produced the movement this frame. Used by the
   * HUD to show "keyboard:W", "gamepad:D-up", "mouse:(200,300)",
   * "touch:(150,75)", or "idle" — useful when validating input
   * behavior during dev. The enum is intentionally small and ordered
   * by precedence: keyboard > gamepad D-pad > gamepad stick > mouse >
   * touch > idle.
   */
  source: 'keyboard' | 'gamepad-dpad' | 'gamepad-stick' | 'mouse' | 'touch' | 'idle';
  /**
   * One-line, human-readable detail about what specifically was
   * pressed (e.g. "W", "D-up", "(200,300)", "(150,75)"). Used in the
   * compact HUD line so the dev sees exactly which key/axis/tap is
   * firing.
   */
  detail: string;
}

/**
 * Sample the current frame's input. Returns a velocity contribution
 * `{ vx, vy }` to add to the player, plus the source and a short
 * detail string for the debug HUD.
 *
 * The optional `stick` and `dpad` parameters exist so the browser-side
 * init.ts can pass live `navigator.getGamepads()` readings and the unit
 * tests can pass synthetic ones.
 *
 * `playerPos` is only consulted to decide whether to clear the one-shot
 * mouse target; pass `undefined` to skip arrival detection (e.g. when
 * testing without a player).
 */
export function sampleInputs(
  state: InputState,
  _canvas: HTMLCanvasElement | null,
  w: number,
  h: number,
  stick?: Stick,
  dpad?: Dpad,
  playerPos?: { x: number; y: number },
): SampleInput {
  const accel = DEFAULT_ACCELERATION;
  let vx = 0;
  let vy = 0;

  // 1. Keyboard (WASD + arrows). Keys win and clear the pending mouse target.
  const keys = state.keys;
  const keyRight = !!(keys['ArrowRight'] || keys['d'] || keys['D']);
  const keyLeft = !!(keys['ArrowLeft'] || keys['a'] || keys['A']);
  const keyUp = !!(keys['ArrowUp'] || keys['w'] || keys['W']);
  const keyDown = !!(keys['ArrowDown'] || keys['s'] || keys['S']);
  const anyKey = keyRight || keyLeft || keyUp || keyDown;

  if (anyKey) {
    vx += (keyRight ? accel : 0) + (keyLeft ? -accel : 0);
    vy += (keyDown ? accel : 0) + (keyUp ? -accel : 0);
    // Keyboard overrides any pending click target (OQ2).
    if (state.mouseTarget) state.clearMouseTarget();
    // Build the detail string: list held movement keys in priority
    // order (Up, Down, Left, Right) so the HUD line is stable across
    // frames and easy to read.
    const held: string[] = [];
    if (keyUp) held.push(keys['w'] || keys['W'] ? 'W' : 'ArrowUp');
    if (keyDown) held.push(keys['s'] || keys['S'] ? 'S' : 'ArrowDown');
    if (keyLeft) held.push(keys['a'] || keys['A'] ? 'A' : 'ArrowLeft');
    if (keyRight) held.push(keys['d'] || keys['D'] ? 'D' : 'ArrowRight');
    return { vx, vy, source: 'keyboard', detail: held.join('+') };
  }

  // 2. Gamepad D-pad wins over analog stick.
  if (state.gamepadConnected && dpad) {
    const dpadX = (dpad.right ? accel : 0) + (dpad.left ? -accel : 0);
    const dpadY = (dpad.down ? accel : 0) + (dpad.up ? -accel : 0);
    if (dpadX !== 0 || dpadY !== 0) {
      // Gamepad overrides mouse just like keyboard does (Slice-A fix).
      // Without this, releasing the D-pad leaves the player drifting back
      // toward a stale click point that the user no longer cares about.
      if (state.mouseTarget) state.clearMouseTarget();
      const dirs: string[] = [];
      if (dpad.up) dirs.push('D-up');
      if (dpad.down) dirs.push('D-down');
      if (dpad.left) dirs.push('D-left');
      if (dpad.right) dirs.push('D-right');
      return { vx: dpadX, vy: dpadY, source: 'gamepad-dpad', detail: dirs.join('+') };
    }
  }

  // 3. Gamepad analog stick with deadzone.
  if (state.gamepadConnected && stick) {
    const sx = Math.abs(stick.x) > DEFAULT_DEADZONE ? stick.x : 0;
    const sy = Math.abs(stick.y) > DEFAULT_DEADZONE ? stick.y : 0;
    if (sx !== 0 || sy !== 0) {
      // Same mouse-override rationale as the D-pad path above: a live
      // analog input is explicit user intent and must supersede a stale
      // pending click target.
      if (state.mouseTarget) state.clearMouseTarget();
      // Scale the stick output to the same per-frame feel as the keyboard accel.
      const detail = `(${stick.x.toFixed(2)},${stick.y.toFixed(2)})`;
      return { vx: sx * accel, vy: sy * accel, source: 'gamepad-stick', detail };
    }
  }

  // 4. Mouse one-shot target. Produce a unit vector toward the click point.
  if (state.mouseTarget) {
    const target = state.mouseTarget;
    const dx = target.x - (playerPos?.x ?? 0);
    const dy = target.y - (playerPos?.y ?? 0);
    const dist = Math.hypot(dx, dy);

    if (playerPos && dist <= ARRIVAL_RADIUS) {
      // Arrived — clear the one-shot target.
      state.clearMouseTarget();
      return { vx: 0, vy: 0, source: 'mouse', detail: `arrived@(${target.x},${target.y})` };
    }

    if (dist > 0) {
      // Normalize then scale by accel so steering feels as snappy as keys.
      // Mouse and touch share the same path (Pointer Events unify them);
      // we use the canvas-level pointer type recorded by init.ts on the
      // mouseTarget slot. See init.ts where it stores the target.
      const source: 'mouse' | 'touch' =
        (state as unknown as { lastPointerType?: 'mouse' | 'touch' | 'pen' }).lastPointerType === 'touch'
          ? 'touch'
          : 'mouse';
      const detail = `(${target.x},${target.y})`;
      return { vx: (dx / dist) * accel, vy: (dy / dist) * accel, source, detail };
    }
  }

  // Clamp to the canvas just in case (input sample shouldn't escape w/h).
  // w/h are referenced here so future tweaks (e.g. invert-axis-on-edge) have
  // a place to live without changing the call sites.
  void w;
  void h;
  return { vx: 0, vy: 0, source: 'idle', detail: '' };
}
