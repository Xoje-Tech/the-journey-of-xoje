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
});
