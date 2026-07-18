/**
 * tests/game-input.test.ts
 *
 * Unit tests for `src/game/input.ts`:
 *   - `sampleInputs(state, canvas, w, h)` returns a movement vector
 *     `{ vx, vy }` derived from:
 *       1. Keyboard (WASD + arrows) — instant override of mouseTarget.
 *       2. Mouse one-shot target — drives the player toward the click point;
 *          once the player arrives (within `arrivalRadius`), the target is
 *          cleared via `state.clearMouseTarget()`.
 *       3. Gamepad left stick with a 0.15 deadzone — within the deadzone the
 *          stick counts as zero, so the player doesn't drift at rest.
 *       4. Gamepad D-pad buttons override analog stick (button presses are
 *          discrete, so they win over noisy analog readings).
 *
 * The implementation must be a PURE function: it takes `state` (the
 * InputState snapshot from outside) and returns `{ vx, vy }`. Side effects
 * like `state.clearMouseTarget()` happen via the mutable `state` object
 * the caller owns, which is how we keep tests DOM-free.
 */
import { describe, it, expect } from 'vitest';
import { sampleInputs, pointerEventToCanvasTarget } from '../src/modules/game/application/input';
import type { InputState, CanvasDims } from '../src/modules/game/domain/types';

function makeState(overrides: Partial<InputState> = {}): InputState {
  const state: InputState = {
    keys: {},
    mouseTarget: null,
    gamepadConnected: false,
    clearMouseTarget: () => {
      state.mouseTarget = null;
    },
    ...overrides,
  };
  return state;
}

const DIMS: CanvasDims = { w: 200, h: 100, dpr: 1 };

// Tiny stub: we don't need a real HTMLCanvasElement — the input sampler
// only uses it to translate event coords, and we pass coords directly via
// `state.mouseTarget` in every test.
const FAKE_CANVAS = {} as HTMLCanvasElement;

describe('sampleInputs — keyboard axis', () => {
  it('returns (accel, 0) when ArrowRight is held', () => {
    const state = makeState({ keys: { ArrowRight: true } });
    const v = sampleInputs(state, FAKE_CANVAS, DIMS.w, DIMS.h);
    expect(v.vx).toBeGreaterThan(0);
    expect(v.vy).toBe(0);
  });

  it('returns (-accel, 0) when ArrowLeft is held', () => {
    const state = makeState({ keys: { ArrowLeft: true } });
    const v = sampleInputs(state, FAKE_CANVAS, DIMS.w, DIMS.h);
    expect(v.vx).toBeLessThan(0);
    expect(v.vy).toBe(0);
  });

  it('combines ArrowRight + ArrowDown into (accel, accel)', () => {
    const state = makeState({ keys: { ArrowRight: true, ArrowDown: true } });
    const v = sampleInputs(state, FAKE_CANVAS, DIMS.w, DIMS.h);
    expect(v.vx).toBeGreaterThan(0);
    expect(v.vy).toBeGreaterThan(0);
  });

  it('WASD aliases (a/w/s/d) produce the same axes as the arrow keys', () => {
    const stateW = makeState({ keys: { w: true } });
    const stateUp = makeState({ keys: { ArrowUp: true } });
    expect(sampleInputs(stateW, FAKE_CANVAS, DIMS.w, DIMS.h).vy).toBe(
      sampleInputs(stateUp, FAKE_CANVAS, DIMS.w, DIMS.h).vy,
    );
  });
});

describe('sampleInputs — keyboard overrides mouseTarget (OQ2)', () => {
  it('clears a pending mouseTarget when any movement key is pressed', () => {
    const state = makeState({
      keys: { ArrowRight: true },
      mouseTarget: { x: 150, y: 50 },
    });
    sampleInputs(state, FAKE_CANVAS, DIMS.w, DIMS.h);
    expect(state.mouseTarget).toBeNull();
  });

  it('does NOT clear mouseTarget when no keys are pressed (so mouse steering resumes naturally)', () => {
    const state = makeState({
      keys: {},
      mouseTarget: { x: 150, y: 50 },
    });
    sampleInputs(state, FAKE_CANVAS, DIMS.w, DIMS.h);
    expect(state.mouseTarget).not.toBeNull();
  });
});

describe('sampleInputs — gamepad analog stick', () => {
  it('treats stick value within the 0.15 deadzone as zero', () => {
    const state = makeState({ gamepadConnected: true });
    const stick = { x: 0.1, y: -0.05 }; // both inside deadzone
    const v = sampleInputs(state, FAKE_CANVAS, DIMS.w, DIMS.h, stick);
    expect(v.vx).toBe(0);
    expect(v.vy).toBe(0);
  });

  it('passes through a stick value above the deadzone (positive)', () => {
    const state = makeState({ gamepadConnected: true });
    const stick = { x: 0.5, y: 0 };
    const v = sampleInputs(state, FAKE_CANVAS, DIMS.w, DIMS.h, stick);
    expect(v.vx).toBeGreaterThan(0);
    expect(v.vy).toBe(0);
  });

  it('passes through a stick value above the deadzone (negative)', () => {
    const state = makeState({ gamepadConnected: true });
    const stick = { x: -0.8, y: -0.8 };
    const v = sampleInputs(state, FAKE_CANVAS, DIMS.w, DIMS.h, stick);
    expect(v.vx).toBeLessThan(0);
    expect(v.vy).toBeLessThan(0);
  });

  it('returns zero when no gamepad connected and no keys', () => {
    const state = makeState();
    const v = sampleInputs(state, FAKE_CANVAS, DIMS.w, DIMS.h);
    expect(v).toEqual({ vx: 0, vy: 0 });
  });
});

describe('sampleInputs — D-pad overrides analog', () => {
  it('D-pad up produces vy < 0 even when analog stick is below deadzone', () => {
    const state = makeState({ gamepadConnected: true });
    const stick = { x: 0.05, y: 0.05 }; // below deadzone
    const dpad = { up: true, down: false, left: false, right: false };
    const v = sampleInputs(state, FAKE_CANVAS, DIMS.w, DIMS.h, stick, dpad);
    expect(v.vy).toBeLessThan(0);
  });

  it('D-pad right overrides analog stick that is below deadzone', () => {
    const state = makeState({ gamepadConnected: true });
    const stick = { x: 0.0, y: 0.0 };
    const dpad = { up: false, down: false, left: false, right: true };
    const v = sampleInputs(state, FAKE_CANVAS, DIMS.w, DIMS.h, stick, dpad);
    expect(v.vx).toBeGreaterThan(0);
  });

  it('D-pad takes precedence over a contradicting analog stick', () => {
    // Analog stick is far left, D-pad says right — D-pad wins.
    const state = makeState({ gamepadConnected: true });
    const stick = { x: -0.9, y: 0 };
    const dpad = { up: false, down: false, left: false, right: true };
    const v = sampleInputs(state, FAKE_CANVAS, DIMS.w, DIMS.h, stick, dpad);
    expect(v.vx).toBeGreaterThan(0);
  });
});

describe('sampleInputs — gamepad overrides mouseTarget (Slice-A fix)', () => {
  // Symmetry with the keyboard path (lines 76-94): the OQ2 rule says "any
  // active movement input overrides mouse". Before Slice-A, only the
  // keyboard path called state.clearMouseTarget(). Releasing the D-pad or
  // stick left the player drifting back to a stale click point.

  it('D-pad press clears a pending mouseTarget (mirror of the keyboard path)', () => {
    const state = makeState({
      gamepadConnected: true,
      mouseTarget: { x: 150, y: 50 },
    });
    const dpad = { up: false, down: false, left: false, right: true };
    sampleInputs(state, FAKE_CANVAS, DIMS.w, DIMS.h, undefined, dpad);
    expect(state.mouseTarget).toBeNull();
  });

  it('analog stick above deadzone clears a pending mouseTarget', () => {
    const state = makeState({
      gamepadConnected: true,
      mouseTarget: { x: 150, y: 50 },
    });
    const stick = { x: 0.5, y: 0 };
    sampleInputs(state, FAKE_CANVAS, DIMS.w, DIMS.h, stick);
    expect(state.mouseTarget).toBeNull();
  });

  it('analog stick inside deadzone does NOT clear mouseTarget (rest state, not intent)', () => {
    const state = makeState({
      gamepadConnected: true,
      mouseTarget: { x: 150, y: 50 },
    });
    const stick = { x: 0.05, y: 0.05 }; // below deadzone
    sampleInputs(state, FAKE_CANVAS, DIMS.w, DIMS.h, stick);
    expect(state.mouseTarget).not.toBeNull();
  });

  it('D-pad NOT pressed and stick at zero does NOT clear mouseTarget (mirror of no-keys case)', () => {
    const state = makeState({
      gamepadConnected: true,
      mouseTarget: { x: 150, y: 50 },
    });
    const stick = { x: 0, y: 0 };
    const dpad = { up: false, down: false, left: false, right: false };
    sampleInputs(state, FAKE_CANVAS, DIMS.w, DIMS.h, stick, dpad);
    expect(state.mouseTarget).not.toBeNull();
  });
});

describe('sampleInputs — mouse-target steering', () => {
  it('produces a vector toward the click target', () => {
    // Player is conceptually at (0,0); target is straight to the right.
    const state = makeState({ mouseTarget: { x: 180, y: 0 } });
    const v = sampleInputs(state, FAKE_CANVAS, DIMS.w, DIMS.h);
    expect(v.vx).toBeGreaterThan(0);
    expect(v.vy).toBeCloseTo(0, 10);
  });

  it('produces a vector that points diagonally when target is off-axis', () => {
    const state = makeState({ mouseTarget: { x: 100, y: 100 } });
    const v = sampleInputs(state, FAKE_CANVAS, DIMS.w, DIMS.h);
    expect(v.vx).toBeGreaterThan(0);
    expect(v.vy).toBeGreaterThan(0);
  });

  it('clears the mouseTarget once the player is within arrivalRadius', () => {
    // Caller passes `playerPos` so the function can decide "arrived".
    const state = makeState({ mouseTarget: { x: 50, y: 50 } });
    sampleInputs(state, FAKE_CANVAS, DIMS.w, DIMS.h, undefined, undefined, { x: 51, y: 51 });
    expect(state.mouseTarget).toBeNull();
  });
});

/**
 * Slice-B (pointer events) — `pointerEventToCanvasTarget` covers the
 * canvas-local coordinate mapping for the unified mouse/touch/pen path.
 * We don't need a real DOM: a stub canvas with a fixed bounding rect
 * is enough, and the function only reads three things from the event:
 * `offsetX`/`offsetY` (when present) and `clientX`/`clientY`.
 */
describe('pointerEventToCanvasTarget — pointer events (Slice B)', () => {
  function makeCanvas(rect: DOMRect): HTMLCanvasElement {
    return {
      getBoundingClientRect: () => rect,
    } as HTMLCanvasElement;
  }

  it('uses offsetX/offsetY directly when present (modern PointerEvent path)', () => {
    const canvas = makeCanvas({
      left: 100,
      top: 50,
      right: 700,
      bottom: 650,
      width: 600,
      height: 600,
      x: 100,
      y: 50,
      toJSON: () => ({}),
    });
    const target = pointerEventToCanvasTarget(canvas, {
      offsetX: 42,
      offsetY: 17,
      clientX: 999, // ignored when offsetX is present
      clientY: 999,
    });
    expect(target).toEqual({ x: 42, y: 17 });
  });

  it('falls back to clientX - rect.left when offsetX is missing (legacy path)', () => {
    const canvas = makeCanvas({
      left: 100,
      top: 50,
      right: 700,
      bottom: 650,
      width: 600,
      height: 600,
      x: 100,
      y: 50,
      toJSON: () => ({}),
    });
    const target = pointerEventToCanvasTarget(canvas, {
      clientX: 142, // 142 - 100 = 42
      clientY: 67, // 67 - 50 = 17
    });
    expect(target).toEqual({ x: 42, y: 17 });
  });

  it('handles a tap at the canvas origin (top-left) correctly', () => {
    const canvas = makeCanvas({
      left: 0,
      top: 0,
      right: 400,
      bottom: 300,
      width: 400,
      height: 300,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    const target = pointerEventToCanvasTarget(canvas, {
      clientX: 0,
      clientY: 0,
    });
    expect(target).toEqual({ x: 0, y: 0 });
  });

  it('handles offsetX=0 / offsetY=0 distinctly from "missing" (type guard)', () => {
    // This is the regression that bites if you use `|| e.offsetX`:
    // `0 || fallback` evaluates to fallback. The `typeof === 'number'`
    // check correctly accepts 0 as a valid coordinate.
    const canvas = makeCanvas({
      left: 10,
      top: 20,
      right: 410,
      bottom: 320,
      width: 400,
      height: 300,
      x: 10,
      y: 20,
      toJSON: () => ({}),
    });
    const target = pointerEventToCanvasTarget(canvas, {
      offsetX: 0,
      offsetY: 0,
      clientX: 999,
      clientY: 999,
    });
    expect(target).toEqual({ x: 0, y: 0 });
  });

  it('produces a target the sampler can steer toward (integration with sampleInputs)', () => {
    // End-to-end: simulate a tap on the right half of the canvas and
    // verify sampleInputs produces a rightward vector toward it.
    const canvas = makeCanvas({
      left: 0,
      top: 0,
      right: DIMS.w,
      bottom: DIMS.h,
      width: DIMS.w,
      height: DIMS.h,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    const state = makeState({
      mouseTarget: pointerEventToCanvasTarget(canvas, {
        offsetX: 180,
        offsetY: 0,
        clientX: 180,
        clientY: 0,
      }),
    });
    const v = sampleInputs(state, canvas, DIMS.w, DIMS.h);
    expect(v.vx).toBeGreaterThan(0);
  });
});
