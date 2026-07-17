/**
 * tests/game-player-animation.test.ts
 *
 * videogame-sprites-ai — Strict TDD Unit Tests for the player's animation logic.
 * Exclusively tests the pure helper function `pickFrame(...)` with 0 canvas or DOM dependencies.
 */
import { describe, it, expect } from 'vitest';
import { pickFrame } from '../src/modules/game/application/player/animation';
import type { AnimState } from '../src/modules/game/domain/player/types';

const createInitialState = (overrides: Partial<AnimState> = {}): AnimState => ({
  pose: 'idle',
  frameIndex: 0,
  timeSinceLastFrame: 0,
  dashLeanActive: false,
  lastWalkPose: 'walk-down',
  ...overrides,
});

describe('Player Animation - pickFrame (Pure Logic)', () => {
  it('at rest (vx=0, vy=0) defaults to idle pose (Frame 0)', () => {
    const state = createInitialState();
    const next = pickFrame(0, 0, 16, state);
    expect(next.pose).toBe('idle');
    expect(next.frameIndex).toBe(0);
    expect(next.dashLeanActive).toBe(false);
  });

  it('triggers walk-down and alternates frames 1 and 2 based on time', () => {
    const state = createInitialState({ pose: 'walk-down', frameIndex: 1 });

    // speed is 2.0. Frame duration formula: 240 - 2 * 30 = 180ms.
    // Progressing by 100ms should NOT trigger a frame swap.
    let next = pickFrame(0, 2.0, 100, state);
    expect(next.pose).toBe('walk-down');
    expect(next.frameIndex).toBe(1);
    expect(next.timeSinceLastFrame).toBe(100);

    // Progressing by another 90ms (total 190ms > 180ms threshold) should swap frame to 2.
    next = pickFrame(0, 2.0, 90, next);
    expect(next.pose).toBe('walk-down');
    expect(next.frameIndex).toBe(2);
    expect(next.timeSinceLastFrame).toBe(10); // 190 - 180 = 10ms leftover

    // Another 180ms should swap it back to 1.
    next = pickFrame(0, 2.0, 180, next);
    expect(next.pose).toBe('walk-down');
    expect(next.frameIndex).toBe(1);
    expect(next.timeSinceLastFrame).toBe(10);
  });

  it('triggers walk-up and loops through frames 3 and 4', () => {
    const state = createInitialState({ pose: 'walk-up', frameIndex: 3 });
    // speed 2.0 -> frame duration 180ms
    let next = pickFrame(0, -2.0, 190, state);
    expect(next.pose).toBe('walk-up');
    expect(next.frameIndex).toBe(4);

    next = pickFrame(0, -2.0, 190, next);
    expect(next.pose).toBe('walk-up');
    expect(next.frameIndex).toBe(3);
  });

  it('triggers walk-left and loops through frames 5 and 6', () => {
    const state = createInitialState({ pose: 'walk-left', frameIndex: 5 });
    // speed 3.0 -> frame duration 240 - 3 * 30 = 150ms
    let next = pickFrame(-3.0, 0, 160, state);
    expect(next.pose).toBe('walk-left');
    expect(next.frameIndex).toBe(6);

    next = pickFrame(-3.0, 0, 160, next);
    expect(next.pose).toBe('walk-left');
    expect(next.frameIndex).toBe(5);
  });

  it('triggers walk-right and loops through frames 7 and 8', () => {
    const state = createInitialState({ pose: 'walk-right', frameIndex: 7 });
    let next = pickFrame(3.0, 0, 160, state);
    expect(next.pose).toBe('walk-right');
    expect(next.frameIndex).toBe(8);
  });

  it('resolves dominant velocity correctly (vertical dominates)', () => {
    const state = createInitialState();
    // vx is 1.0, vy is 3.0. Vertical dominates.
    const next = pickFrame(1.0, 3.0, 16, state);
    expect(next.pose).toBe('walk-down');
  });

  it('resolves dominant velocity correctly (horizontal dominates)', () => {
    const state = createInitialState();
    // vx is -3.0, vy is 1.0. Horizontal dominates.
    const next = pickFrame(-3.0, 1.0, 16, state);
    expect(next.pose).toBe('walk-left');
  });

  it('retains last walk direction facing when entering idle', () => {
    // When player stopped after moving left, they should stay facing left (Frame 5)
    const state = createInitialState({
      pose: 'walk-left',
      frameIndex: 6,
      lastWalkPose: 'walk-left',
    });

    const next = pickFrame(0, 0, 16, state);
    expect(next.pose).toBe('idle');
    expect(next.frameIndex).toBe(5); // first frame of walk-left is the idle-left representation
    expect(next.lastWalkPose).toBe('walk-left');
  });

  it('dynamic frame duration scales with speed (slow walk)', () => {
    const state = createInitialState({ pose: 'walk-down', frameIndex: 1 });
    // speed is 1.0. Frame duration: 240 - 1 * 30 = 210ms.
    // 150ms shouldn't trigger a swap.
    const next = pickFrame(0, 1.0, 150, state);
    expect(next.frameIndex).toBe(1);
  });

  it('dynamic frame duration scales with speed (fast walk)', () => {
    const state = createInitialState({ pose: 'walk-down', frameIndex: 1 });
    // speed is 4.0. Frame duration: 240 - 4 * 30 = 120ms.
    // 150ms should trigger a swap.
    const next = pickFrame(0, 4.0, 150, state);
    expect(next.frameIndex).toBe(2);
  });

  it('dashLeanActive is active when total speed is high (> 4.0)', () => {
    const state = createInitialState();
    // speed is 4.5.
    const next = pickFrame(3.0, 3.0, 16, state); // magnitude = Math.sqrt(9+9) = 4.24
    expect(next.dashLeanActive).toBe(true);
  });

  it('dashLeanActive is disabled when speed is normal (<= 4.0)', () => {
    const state = createInitialState();
    const next = pickFrame(2.0, 2.0, 16, state); // magnitude = Math.sqrt(4+4) = 2.82
    expect(next.dashLeanActive).toBe(false);
  });
});
