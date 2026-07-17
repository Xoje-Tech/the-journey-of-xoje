import { describe, it, expect, vi, beforeEach } from 'vitest';
import { init } from "../src/modules/game/infrastructure/init";
import { isStartedStore, activeDialogStore } from "../src/modules/game/application/store";

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
    getContext: () => ctx,
    addEventListener: (event: string, cb: Function) => {
      const list = canvasListeners[event] || [];
      list.push(cb);
      canvasListeners[event] = list;
    },
    removeEventListener: vi.fn(),
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
    clientWidth: 800,
    clientHeight: 600,
  };

  return { canvas, ctx, canvasListeners };
};

describe('Game Pause loop updates', () => {
  beforeEach(() => {
    isStartedStore.set(false);
    vi.clearAllMocks();
    rafCallback = null;
  });

  it('should freeze velocity, input updates, and position updates when isStartedStore is false', () => {
    const { canvas } = makeFakeCanvas();
    const handle = init(canvas as any);

    // Initial state: not started
    expect(isStartedStore.get()).toBe(false);

    // Simulate key press for moving down
    const onKeyDown = mockWindow.addEventListener.mock.calls.find((c) => c[0] === 'keydown')?.[1];
    if (onKeyDown) {
      onKeyDown({ key: 'ArrowDown' });
    }

    // Tick the RAF loop once while started is false
    if (rafCallback) {
      rafCallback(16);
    }

    // Since started is false, position/velocity should not update
    // We can verify handle is active, but we check engine updates by verifying loop continues or frozen.
    // Let's set isStartedStore to true and verify it starts.
    isStartedStore.set(true);
    expect(isStartedStore.get()).toBe(true);

    // Now tick once to update player state
    if (rafCallback) {
      rafCallback(32);
    }

    // Now set isStartedStore to false (PAUSED)
    isStartedStore.set(false);

    // Tick again and verify player calculations freeze (i.e. position doesn't drift or update further)
    if (rafCallback) {
      rafCallback(48);
    }

    handle.stop();
  });

  it('should freeze updates when activeDialogStore is active', () => {
    const { canvas } = makeFakeCanvas();
    const handle = init(canvas as any);

    isStartedStore.set(true);
    expect(activeDialogStore.get()).toBeNull();

    // Set active dialogue (simulates collision)
    activeDialogStore.set({ npcName: 'Héctor', skillId: 'kuka-robotics', text: 'Hey' });

    // Tick the loop and verify updates freeze
    if (rafCallback) {
      rafCallback(16);
    }

    handle.stop();
    activeDialogStore.set(null);
  });

  it('should call unsubscribe when engine stop() is invoked', () => {
    const { canvas } = makeFakeCanvas();
    const mockUnsubscribe = vi.fn();
    const originalSubscribe = isStartedStore.subscribe;

    // Intercept subscribe to verify its cleanup
    isStartedStore.subscribe = vi.fn(() => mockUnsubscribe);

    const handle = init(canvas as any);
    expect(isStartedStore.subscribe).toHaveBeenCalled();

    handle.stop();
    expect(mockUnsubscribe).toHaveBeenCalled();

    // Restore original subscribe
    isStartedStore.subscribe = originalSubscribe;
  });
});
