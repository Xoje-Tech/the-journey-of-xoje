/**
 * src/game/player/types.ts
 *
 * Clean Architecture — Type definitions for the Player entity and animation engine.
 * Decoupled from canvas and DOM to allow pure unit-testability under vitest.
 */

export type PoseType = 'idle' | 'walk-down' | 'walk-up' | 'walk-left' | 'walk-right';

/**
 * State of the player's active animation.
 */
export interface AnimState {
  /** The current motion/pose category. */
  pose: PoseType;
  /** The column index of the spritesheet frame currently being drawn (0 to 8). */
  frameIndex: number;
  /** Milliseconds accumulated on the active frame. Used to trigger frame progression. */
  timeSinceLastFrame: number;
  /** True when the player is moving fast enough to trigger a visual skew (dash lean). */
  dashLeanActive: boolean;
  /** Cache of the previous active walk pose, so that when the player stops,
   * they face the direction they were last moving instead of default down. */
  lastWalkPose: PoseType;
}

/**
 * Static sizing and asset configuration for the player spritesheet.
 */
export interface PlayerSpriteConfig {
  /** Width of a single frame in the spritesheet (32 logical px). */
  frameW: number;
  /** Height of a single frame in the spritesheet (48 logical px). */
  frameH: number;
  /** Absolute URL/path to the sprite asset (e.g., '/sprites/player.png'). */
  spritesheetPath: string;
}
