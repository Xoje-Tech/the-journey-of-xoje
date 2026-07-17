/**
 * src/game/player/index.ts
 *
 * Clean Architecture — Player Composition Root.
 * Orchestrates the loading of the spritesheet image asset, animation state progression,
 * and canvas rendering.
 */
import { pickFrame } from './animation';
import { drawPlayerFrame } from './sprite';
import type { AnimState } from "@/modules/game/domain/player/types";

export class PlayerEntity {
  private img: HTMLImageElement | null = null;
  private animState: AnimState;
  private spritesheetPath: string;
  private isLoaded = false;

  constructor(spritesheetPath = '/src/assets/player.png') {
    this.spritesheetPath = spritesheetPath;
    this.animState = {
      pose: 'idle',
      frameIndex: 0,
      timeSinceLastFrame: 0,
      dashLeanActive: false,
      lastWalkPose: 'walk-down',
    };
  }

  /**
   * Safe browser-compatible loader for the spritesheet image asset.
   * Resolves when the image is fully loaded, allowing safe game-loop start.
   */
  public load(): Promise<void> {
    if (typeof window === 'undefined' || typeof Image === 'undefined') {
      // Server-side / headless test runner compatibility.
      // Resolves immediately so node tests don't hang.
      this.isLoaded = true;
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      this.img = new Image();
      this.img.src = this.spritesheetPath;
      this.img.onload = () => {
        this.isLoaded = true;
        resolve();
      };
      this.img.onerror = (err) => {
        reject(
          new Error(
            `[PlayerEntity] failed to load spritesheet from: ${this.spritesheetPath} (err: ${err})`,
          ),
        );
      };
    });
  }

  /**
   * Get the current active animation state of the player entity.
   */
  public getAnimState(): AnimState {
    return this.animState;
  }

  /**
   * Progresses player animation state and renders the appropriate frame
   * onto the active 2D canvas context.
   *
   * @param ctx          Canvas 2D context.
   * @param playerX      Current player logical center X position.
   * @param playerY      Current player logical center Y position.
   * @param vx           Horizontal velocity component in logical px/frame.
   * @param vy           Vertical velocity component in logical px/frame.
   * @param dtMs         Elapsed frame duration in milliseconds.
   * @param blinkActive  True if parpadeo overlay should draw.
   */
  public updateAndDraw(
    ctx: CanvasRenderingContext2D,
    playerX: number,
    playerY: number,
    vx: number,
    vy: number,
    dtMs: number,
    blinkActive: boolean,
  ): void {
    // 1. Progress the animation frame logic (pure helper)
    this.animState = pickFrame(vx, vy, dtMs, this.animState);

    // 2. Render if loaded (skip silently to avoid canvas crashes if loading lags)
    if (this.isLoaded && this.img) {
      drawPlayerFrame(ctx, this.img, this.animState, playerX, playerY, blinkActive, vx);
    } else {
      // Fallback: draw a simple outline of the sprite size while loading
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.setLineDash([2, 2]);
      ctx.strokeRect(playerX - 16, playerY - 24, 32, 48);
      ctx.restore();
    }
  }
}
