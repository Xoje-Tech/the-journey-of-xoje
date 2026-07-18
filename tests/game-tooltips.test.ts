import { describe, it, expect, vi, beforeEach } from 'vitest';
import { init } from "../src/modules/game/infrastructure/init";
import { isStartedStore, activeTooltipStore, activeDialogStore } from "../src/modules/game/application/store";

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

describe('Game Tooltips Proximity Integration', () => {
  beforeEach(() => {
    isStartedStore.set(false);
    activeTooltipStore.set(null);
    activeDialogStore.set(null);
    vi.clearAllMocks();
    rafCallback = null;
  });

  it('should initialize activeTooltipStore to null', () => {
    const { canvas } = makeFakeCanvas();
    const handle = init(canvas as any);
    expect(activeTooltipStore.get()).toBeNull();
    handle.stop();
  });

  it('should remain null if player is far away from all collectibles', () => {
    const { canvas } = makeFakeCanvas();
    const handle = init(canvas as any);

    isStartedStore.set(true);

    if (handle.player && handle.collectibles) {
      // Place player far away
      handle.player.x = 100;
      handle.player.y = 100;

      // Place all collectibles far away
      handle.collectibles.forEach((c) => {
        c.x = 500;
        c.y = 500;
      });
    }

    if (rafCallback) {
      rafCallback(16);
    }

    expect(activeTooltipStore.get()).toBeNull();
    handle.stop();
  });

  it('should set activeTooltipStore when player is within 40px of a collectible', () => {
    const { canvas } = makeFakeCanvas();
    const handle = init(canvas as any);

    isStartedStore.set(true);

    if (handle.player && handle.collectibles) {
      // Place player at (100, 100)
      handle.player.x = 100;
      handle.player.y = 100;

      // Make first collectible uncollected and within 30px
      const first = handle.collectibles[0]!;
      first.collected = false;
      first.x = 100;
      first.y = 125; // 25px away (outside collision range 19px, inside proximity range 40px)

      if (handle.camera) {
        handle.camera.y = 10;
      }
    }

    if (rafCallback) {
      rafCallback(16);
    }

    const state = activeTooltipStore.get();
    expect(state).not.toBeNull();
    expect(state?.id).toBe(handle.collectibles?.[0]?.id);
    expect(state?.screenX).toBe(100);
    // Camera.y gets clamped to 0 since player is at y = 100 (camera centered: 100 - 300 = -200, clamped to [0, MAP_HEIGHT])
    expect(state?.screenY).toBe(125);
    expect(state?.type).toBe('skill');

    handle.stop();
  });

  it('should target the closest collectible if multiple are within 40px', () => {
    const { canvas } = makeFakeCanvas();
    const handle = init(canvas as any);

    isStartedStore.set(true);

    if (handle.player && handle.collectibles) {
      handle.player.x = 100;
      handle.player.y = 100;

      // Item 1: 35px away (outside collision range of 19px)
      const first = handle.collectibles[0]!;
      first.collected = false;
      first.x = 100;
      first.y = 135;

      // Item 2: 25px away (closest, outside collision range of 19px)
      const second = handle.collectibles[1]!;
      second.collected = false;
      second.x = 100;
      second.y = 125;
    }

    if (rafCallback) {
      rafCallback(16);
    }

    const state = activeTooltipStore.get();
    expect(state).not.toBeNull();
    expect(state?.id).toBe(handle.collectibles?.[1]?.id);

    handle.stop();
  });

  it('should clear activeTooltipStore when the item is collected', () => {
    const { canvas } = makeFakeCanvas();
    const handle = init(canvas as any);

    isStartedStore.set(true);

    if (handle.player && handle.collectibles) {
      handle.player.x = 100;
      handle.player.y = 100;

      const first = handle.collectibles[0]!;
      first.collected = false;
      first.x = 100;
      first.y = 120; // 20px away (within range)
    }

    if (rafCallback) {
      rafCallback(16);
    }

    expect(activeTooltipStore.get()).not.toBeNull();

    // Now collect it
    if (handle.collectibles) {
      handle.collectibles[0]!.collected = true;
    }

    if (rafCallback) {
      rafCallback(32);
    }

    expect(activeTooltipStore.get()).toBeNull();

    handle.stop();
  });

  it('should clear activeTooltipStore when game is not started or activeDialog is open', () => {
    const { canvas } = makeFakeCanvas();
    const handle = init(canvas as any);

    isStartedStore.set(true);

    if (handle.player && handle.collectibles) {
      handle.player.x = 100;
      handle.player.y = 100;

      const first = handle.collectibles[0]!;
      first.collected = false;
      first.x = 100;
      first.y = 120;
    }

    if (rafCallback) {
      rafCallback(16);
    }

    expect(activeTooltipStore.get()).not.toBeNull();

    // Now simulate active dialog
    activeDialogStore.set({ npcName: 'Héctor', skillId: 'kuka-robotics', text: 'Hey' });

    if (rafCallback) {
      rafCallback(32);
    }

    expect(activeTooltipStore.get()).toBeNull();

    handle.stop();
  });
});
