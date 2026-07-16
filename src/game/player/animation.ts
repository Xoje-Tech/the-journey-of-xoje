/**
 * src/game/player/animation.ts
 *
 * Clean Architecture — Pure animation selection logic.
 * Exclusively defines `pickFrame(...)` which determines the spritesheet column index.
 * Fully unit-tested under vitest 1.6.1.
 */
import type { AnimState, PoseType } from './types';

/**
 * Calculates the dynamic frame duration (ms) based on movement speed.
 * At higher speeds, frames transition faster to give a fluid running feel.
 */
function getFrameDuration(speed: number): number {
  return Math.max(80, 240 - speed * 30);
}

/**
 * Maps a walk pose to its static idle representation frame column index.
 */
function getIdleFrameIndex(lastWalkPose: PoseType): number {
  switch (lastWalkPose) {
    case 'walk-up':
      return 3; // frame 1 of walk-up is idle looking up
    case 'walk-left':
      return 5; // frame 1 of walk-left is idle looking left
    case 'walk-right':
      return 7; // frame 1 of walk-right is idle looking right
    case 'walk-down':
    default:
      return 0; // frame 0 is default idle looking down
  }
}

/**
 * Progresses the animation state based on physical velocity and elapsed time.
 * Pure function: returns a new, independent AnimState.
 *
 * @param vx       Horizontal velocity in logical px/frame.
 * @param vy       Vertical velocity in logical px/frame.
 * @param dtMs     Elapsed time since last frame in ms.
 * @param current  Active AnimState of the previous frame.
 */
export function pickFrame(
  vx: number,
  vy: number,
  dtMs: number,
  current: AnimState,
): AnimState {
  const speed = Math.sqrt(vx * vx + vy * vy);
  const dashLeanActive = speed > 4.0;

  // Handle rest state (Idle)
  if (vx === 0 && vy === 0) {
    return {
      pose: 'idle',
      frameIndex: getIdleFrameIndex(current.lastWalkPose),
      timeSinceLastFrame: 0,
      dashLeanActive: false,
      lastWalkPose: current.lastWalkPose,
    };
  }

  // Determine active walk pose based on dominant movement axis
  let activePose: PoseType;
  let minFrame: number;
  let maxFrame: number;

  if (Math.abs(vx) >= Math.abs(vy)) {
    // Horizontal dominates
    if (vx > 0) {
      activePose = 'walk-right';
      minFrame = 7;
      maxFrame = 8;
    } else {
      activePose = 'walk-left';
      minFrame = 5;
      maxFrame = 6;
    }
  } else {
    // Vertical dominates
    if (vy > 0) {
      activePose = 'walk-down';
      minFrame = 1;
      maxFrame = 2;
    } else {
      activePose = 'walk-up';
      minFrame = 3;
      maxFrame = 4;
    }
  }

  // Handle frame progression
  let timeAcc = current.timeSinceLastFrame + dtMs;
  const frameDuration = getFrameDuration(speed);
  
  let frameIndex = current.frameIndex;
  
  // If we just transitioned to a new walk pose, reset frame index to the direction's starting frame
  if (current.pose !== activePose) {
    frameIndex = minFrame;
    timeAcc = 0;
  } else if (timeAcc >= frameDuration) {
    // Swap between the two walk frames (minFrame and maxFrame)
    frameIndex = frameIndex === minFrame ? maxFrame : minFrame;
    timeAcc = timeAcc - frameDuration;
  }

  return {
    pose: activePose,
    frameIndex,
    timeSinceLastFrame: timeAcc,
    dashLeanActive,
    lastWalkPose: activePose,
  };
}
