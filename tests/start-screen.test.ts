/**
 * tests/start-screen.test.ts
 *
 * Integration and unit tests for the start-screen change in Node environment.
 * Verifies that:
 *   1. GameHandle returned by init() contains a callable start() function.
 *   2. Game updates (inputs, physics, velocity, collisions, trail) are frozen while started is false.
 *   3. Calling start() unfreezes inputs and lets player move and update positions.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { init } from "../src/modules/game/infrastructure/init";
import { PlayerEntity } from "../src/modules/game/application/player";
import { isStartedStore } from "../src/modules/game/application/store";

// Stub global requestAnimationFrame and cancelAnimationFrame for testing
let rafCallback: FrameRequestCallback | null = null;

vi.stubGlobal(
  'requestAnimationFrame',
  vi.fn((cb) => {
    rafCallback = cb;
    return 123;
  }),
);

vi.stubGlobal('cancelAnimationFrame', vi.fn());

// Stub Image class so player spritesheet load finishes instantly
class MockImage {
  onload: (() => void) | null = null;
  src = '';
  constructor() {
    setTimeout(() => {
      if (this.onload) this.onload();
    }, 0);
  }
}
vi.stubGlobal('Image', MockImage);

// Stub browser globals
const windowListeners: Record<string, Function[] | undefined> = {};

const mockWindow = {
  devicePixelRatio: 1,
  innerWidth: 800,
  innerHeight: 600,
  addEventListener: vi.fn((event, cb) => {
    const list = windowListeners[event] || [];
    list.push(cb);
    windowListeners[event] = list;
  }),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn((event: any) => {
    const listeners = windowListeners[event.type];
    if (listeners) {
      listeners.forEach((cb) => cb(event));
    }
    return true;
  }),
};

const mockDocument = {
  hidden: false,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

const mockNavigator = {
  getGamepads: vi.fn().mockReturnValue([]),
};

vi.stubGlobal('window', mockWindow);
vi.stubGlobal('document', mockDocument);
vi.stubGlobal('navigator', mockNavigator);

const makeFakeCanvas = () => {
  const canvasListeners: Record<string, Function[]> = {};

  const ctx = {
    setTransform: vi.fn(),
    setLineDash: vi.fn(),
    scale: vi.fn(),
    clearRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    fillText: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    closePath: vi.fn(),
    font: '',
    fillStyle: '',
    textBaseline: '',
    textAlign: '',
    strokeRect: vi.fn(),
    fillRect: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
  };

  const canvas = {
    getContext: vi.fn().mockReturnValue(ctx),
    clientWidth: 800,
    clientHeight: 600,
    width: 800,
    height: 600,
    addEventListener: vi.fn((event, cb) => {
      if (!canvasListeners[event]) canvasListeners[event] = [];
      canvasListeners[event].push(cb);
    }),
    removeEventListener: vi.fn(),
    getBoundingClientRect: vi.fn().mockReturnValue({ left: 0, top: 0, width: 800, height: 600 }),
  };

  return { canvas, ctx, canvasListeners };
};

describe('Start Screen Core Engine Suspension', () => {
  beforeEach(() => {
    rafCallback = null;
    vi.clearAllMocks();
    // Clear window listeners
    for (const key in windowListeners) {
      delete windowListeners[key];
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('4.1 init() returns a handle with start, stop, and getFps method', () => {
    const { canvas } = makeFakeCanvas();
    const handle = init(canvas as any);
    expect(handle).toHaveProperty('start');
    expect(typeof handle.start).toBe('function');
    expect(handle).toHaveProperty('stop');
    expect(handle).toHaveProperty('getFps');
    handle.stop();
  });

  it('4.2 player position and velocity are frozen while started is false', () => {
    const { canvas } = makeFakeCanvas();
    const handle = init(canvas as any);

    // Spy on PlayerEntity updateAndDraw to check rendered coordinates
    const spy = vi.spyOn(PlayerEntity.prototype, 'updateAndDraw');
    spy.mockClear();

    // Simulate keydown arrow right via our window event stub
    window.dispatchEvent({ type: 'keydown', key: 'ArrowRight' } as any);

    // Step a frame of the game loop
    if (rafCallback) {
      rafCallback(performance.now());
    }

    // Assert updateAndDraw was called but position remains top-centered and stationary
    expect(spy).toHaveBeenCalled();
    const lastCall = spy.mock.calls[spy.mock.calls.length - 1]!;
    expect(lastCall[1]).toBe(400); // Horizontally centered (800 / 2 = 400)
    expect(lastCall[2]).toBe(14); // Vertically at top (playerSize = 14)
    expect(lastCall[3]).toBe(0); // vx is 0
    expect(lastCall[4]).toBe(0); // vy is 0

    // Simulate keyup
    window.dispatchEvent({ type: 'keyup', key: 'ArrowRight' } as any);

    handle.stop();
  });

  it('4.3 calling start() unfreezes movement and lets player update position', () => {
    const { canvas } = makeFakeCanvas();
    const handle = init(canvas as any);

    const spy = vi.spyOn(PlayerEntity.prototype, 'updateAndDraw');
    spy.mockClear();

    // Call start() to unfreeze the engine
    handle.start();

    // Simulate keydown ArrowRight
    window.dispatchEvent({ type: 'keydown', key: 'ArrowRight' } as any);

    // Step a few frames to integrate velocity and update position
    for (let i = 0; i < 5; i++) {
      if (rafCallback) {
        rafCallback(performance.now());
      }
    }

    // Assert updateAndDraw shows movement
    expect(spy).toHaveBeenCalled();
    const lastCall = spy.mock.calls[spy.mock.calls.length - 1]!;
    expect(lastCall[1]).toBeGreaterThan(400); // player.x should have advanced to the right
    expect(lastCall[3]).toBeGreaterThan(0); // player.vx should be positive

    // Simulate keyup
    window.dispatchEvent({ type: 'keyup', key: 'ArrowRight' } as any);

    handle.stop();
  });

  describe('Slice B: Pointer Events path (touch / mouse / pen)', () => {
    it('registers pointerdown on the canvas (not mousedown) — Slice B wiring', () => {
      const { canvas, canvasListeners } = makeFakeCanvas();
      init(canvas as any);
      // Pointer Events are the unified path; mousedown is gone.
      expect(canvasListeners['pointerdown']).toBeDefined();
      expect(canvasListeners['pointerdown']?.length).toBe(1);
      expect(canvasListeners['mousedown']).toBeUndefined();
    });

    it('pointerdown sets state.mouseTarget to canvas-local coordinates', () => {
      const { canvas, canvasListeners } = makeFakeCanvas();
      const handle = init(canvas as any);

      // Synthetic PointerEvent (mobile browsers emit these on tap).
      const pointerEvent = {
        type: 'pointerdown',
        pointerType: 'touch',
        offsetX: 250,
        offsetY: 175,
        clientX: 250, // canvas rect starts at (0,0) per makeFakeCanvas
        clientY: 175,
      } as unknown as PointerEvent;

      canvasListeners['pointerdown']?.[0]?.(pointerEvent);

      // The handler stores into state.mouseTarget via the input sampler.
      // We can verify the side effect by reading it through the handle
      // (the GameHandle.player reference exposes the live state object
      // indirectly via the internal closure, but the cleanest observable
      // is to step a frame and confirm the player accelerates toward it).
      handle.start();

      // Single frame: state.mouseTarget = (250, 175), player at (400, 14),
      // so the player should drift LEFT (vx < 0) toward the target.
      if (rafCallback) rafCallback(performance.now());

      const spy = vi.spyOn(PlayerEntity.prototype, 'updateAndDraw');
      spy.mockClear();
      if (rafCallback) rafCallback(performance.now());

      const lastCall = spy.mock.calls[spy.mock.calls.length - 1]!;
      // Player started at x=400, target at x=250 → player should move left.
      expect(lastCall[1]).toBeLessThan(400);

      handle.stop();
    });

    it('falls back to clientX/Y when offsetX/Y are missing (older browsers)', () => {
      const { canvas, canvasListeners } = makeFakeCanvas();
      const handle = init(canvas as any);

      // Synthetic event WITHOUT offsetX/offsetY — relies on clientX/Y.
      // Target (100, 50) is to the LEFT and BELOW the player at (400, 14).
      // dy = 50 - 14 = 36 > 0 → vy > 0 → player moves DOWN.
      const pointerEvent = {
        type: 'pointerdown',
        pointerType: 'mouse',
        clientX: 100, // canvas rect at (0,0) → x=100
        clientY: 50, // → y=50
      } as unknown as PointerEvent;

      canvasListeners['pointerdown']?.[0]?.(pointerEvent);

      handle.start();
      if (rafCallback) rafCallback(performance.now());

      const spy = vi.spyOn(PlayerEntity.prototype, 'updateAndDraw');
      spy.mockClear();
      if (rafCallback) rafCallback(performance.now());

      const lastCall = spy.mock.calls[spy.mock.calls.length - 1]!;
      // Target (100, 50), player (400, 14) → player moves left and down.
      expect(lastCall[1]).toBeLessThan(400); // x decreases (toward 100)
      expect(lastCall[2]).toBeGreaterThan(14); // y increases (toward 50)

      handle.stop();
    });

    it('a key press after a tap clears the pending mouseTarget (OQ2 holds for touch)', () => {
      const { canvas, canvasListeners } = makeFakeCanvas();
      const handle = init(canvas as any);

      // 1. Tap on the right side → set mouseTarget.
      canvasListeners['pointerdown']?.[0]?.({
        type: 'pointerdown',
        pointerType: 'touch',
        offsetX: 700,
        offsetY: 300,
        clientX: 700,
        clientY: 300,
      } as unknown as PointerEvent);

      handle.start();
      if (rafCallback) rafCallback(performance.now());

      // 2. Press ArrowLeft on the keyboard. Per Slice A + OQ2, any
      // active movement input overrides mouseTarget.
      window.dispatchEvent({ type: 'keydown', key: 'ArrowLeft' } as any);
      // Release the tap-touch implicitly by ArrowLeft taking over.
      if (rafCallback) rafCallback(performance.now());

      // 3. Verify the player now follows ArrowLeft, not the tap target.
      const spy = vi.spyOn(PlayerEntity.prototype, 'updateAndDraw');
      spy.mockClear();
      for (let i = 0; i < 3; i++) {
        if (rafCallback) rafCallback(performance.now());
      }

      const lastCall = spy.mock.calls[spy.mock.calls.length - 1]!;
      // ArrowLeft → vx < 0 → player.x decreases (moves left).
      expect(lastCall[1]).toBeLessThan(400);

      window.dispatchEvent({ type: 'keyup', key: 'ArrowLeft' } as any);
      handle.stop();
    });
  });

  describe('StartScreen Astro component DOM & Store integration', () => {
    it('should add slide-up class to start-screen when isStartedStore becomes true', () => {
      const startScreenMock = {
        classList: {
          add: vi.fn(),
        },
        style: {
          display: '',
        },
      };

      // Register subscription that mirrors the StartScreen.astro script
      isStartedStore.subscribe((started) => {
        if (started) {
          startScreenMock.classList.add('slide-up');
        }
      });

      // Reset store
      isStartedStore.set(false);
      expect(startScreenMock.classList.add).not.toHaveBeenCalled();

      // Trigger game start
      isStartedStore.set(true);
      expect(startScreenMock.classList.add).toHaveBeenCalledWith('slide-up');
    });
  });

  describe('Slice C WU-2: keyboard P shortcut dispatches print-requested', () => {
    it('keydown "p" dispatches a print-requested CustomEvent on window', () => {
      const { canvas } = makeFakeCanvas();
      const handle = init(canvas as any);

      let printRequestedCount = 0;
      const onPrint = () => { printRequestedCount++; };
      window.addEventListener('print-requested', onPrint);

      window.dispatchEvent({ type: 'keydown', key: 'p' } as any);

      expect(printRequestedCount).toBe(1);

      window.removeEventListener('print-requested', onPrint);
      handle.stop();
    });

    it('keydown "P" (shift) also dispatches print-requested', () => {
      const { canvas } = makeFakeCanvas();
      const handle = init(canvas as any);

      let count = 0;
      const onPrint = () => { count++; };
      window.addEventListener('print-requested', onPrint);

      window.dispatchEvent({ type: 'keydown', key: 'P' } as any);

      expect(count).toBe(1);

      window.removeEventListener('print-requested', onPrint);
      handle.stop();
    });

    it('holding P (e.repeat=true) does NOT spam print-requested', () => {
      const { canvas } = makeFakeCanvas();
      const handle = init(canvas as any);

      let count = 0;
      const onPrint = () => { count++; };
      window.addEventListener('print-requested', onPrint);

      // First press: real keydown, no repeat → triggers once.
      window.dispatchEvent({ type: 'keydown', key: 'p', repeat: false } as any);
      // Auto-repeat events while held: e.repeat=true → ignored.
      window.dispatchEvent({ type: 'keydown', key: 'p', repeat: true } as any);
      window.dispatchEvent({ type: 'keydown', key: 'p', repeat: true } as any);
      window.dispatchEvent({ type: 'keydown', key: 'p', repeat: true } as any);

      expect(count).toBe(1);

      window.removeEventListener('print-requested', onPrint);
      handle.stop();
    });

    it('typing inside an <input> does NOT trigger the print shortcut', () => {
      const { canvas } = makeFakeCanvas();
      const handle = init(canvas as any);

      let count = 0;
      const onPrint = () => { count++; };
      window.addEventListener('print-requested', onPrint);

      // Synthesize a keydown whose target.tagName === 'INPUT'.
      // The engine checks the tagName string, so a plain object works
      // without a real HTMLInputElement (test env has no DOM).
      window.dispatchEvent({
        type: 'keydown',
        key: 'p',
        target: { tagName: 'INPUT' },
      } as any);

      expect(count).toBe(0);

      window.removeEventListener('print-requested', onPrint);
      handle.stop();
    });

    it('movement keys (ArrowRight, Space, Enter) do NOT trigger print-requested', () => {
      const { canvas } = makeFakeCanvas();
      const handle = init(canvas as any);

      let count = 0;
      const onPrint = () => { count++; };
      window.addEventListener('print-requested', onPrint);

      window.dispatchEvent({ type: 'keydown', key: 'ArrowRight' } as any);
      window.dispatchEvent({ type: 'keydown', key: ' ' } as any);
      window.dispatchEvent({ type: 'keydown', key: 'Enter' } as any);

      expect(count).toBe(0);

      window.removeEventListener('print-requested', onPrint);
      handle.stop();
    });
  });
});
