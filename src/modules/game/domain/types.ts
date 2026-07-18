/**
 * src/game/types.ts
 *
 * Shared interfaces for the videogame-ui slice. Pure type-only module — no
 * runtime code — so it can be imported from tests, init.ts, render.ts, etc.
 * without pulling in DOM or canvas dependencies.
 *
 * The shape mirrors the Interfaces section of openspec/changes/videogame-ui/design.md
 * (player = position + velocity + size; input state = keys + transient mouse
 * target + gamepad presence flag; canvas dims = logical + dpr; init options
 * expose tuning knobs with conservative defaults).
 */

export interface Player {
  /** Logical x position in CSS pixels (already scaled for DPR at render time). */
  x: number;
  /** Logical y position in CSS pixels. */
  y: number;
  /** Horizontal velocity in logical px / frame (friction applied per frame). */
  vx: number;
  /** Vertical velocity in logical px / frame. */
  vy: number;
  /** Player square edge length in logical px. */
  size: number;
}

/**
 * One snapshot of the player's position on the motion trail.
 * `age` is milliseconds since the point was recorded; the renderer
 * fades points to zero alpha as age approaches `TRAIL_MAX_AGE_MS`.
 */
export interface TrailPoint {
  x: number;
  y: number;
  age: number;
}

/**
 * Mutable input snapshot. Lives across frames — the game loop reads it
 * every tick, then clears the one-shot `mouseTarget` via
 * `clearMouseTarget()` once the player arrives at the click point (per OQ2).
 */
export interface InputState {
  /** Keyboard state map keyed by `event.key` value. */
  keys: Record<string, boolean>;
  /**
   * One-shot click target in logical canvas coordinates. Set on mousedown;
   * cleared by `clearMouseTarget()` once the player reaches it. Null when no
   * pending target.
   */
  mouseTarget: { x: number; y: number } | null;
  /** True when at least one gamepad has fired `gamepadconnected`. */
  gamepadConnected: boolean;
  /** Idempotent — clears the pending click target. */
  clearMouseTarget(): void;
}

/** Canvas dimensions in logical CSS px + device pixel ratio. */
export interface CanvasDims {
  /** Logical CSS width (matches `canvas.clientWidth`). */
  w: number;
  /** Logical CSS height (matches `canvas.clientHeight`). */
  h: number;
  /** Device pixel ratio at last resize — used for backing-store scaling. */
  dpr: number;
}

/**
 * Tuning knobs exposed by `init(canvas, opts)`. All optional; defaults live
 * in init.ts and are tuned for a smooth inertial glide (friction=0.92 per
 * user-decided OQ1, deadzone=0.15 per the design).
 */
export interface InitOptions {
  /** Grid cell size in logical px. */
  gridSize?: number;
  /** Velocity multiplier applied per frame (0.92 → ~0.92x after each frame). */
  friction?: number;
  /** Acceleration applied while an input is held (logical px / frame²). */
  acceleration?: number;
  /** Maximum absolute stick value that still counts as zero. */
  deadzone?: number;
  /** Custom spritesheet path/URL dynamically resolved by the bundler. */
  spritesheetPath?: string;
  /** Paths/URLs of generated skill sprites. */
  skillSpritePaths?: Record<string, string>;
  /** Path/URL of LCS building sprite. */
  lcsBuildingPath?: string;
  /** Locale language 'es' | 'en' passed from the front-end */
  locale?: 'es' | 'en';
}

export interface Camera {
  y: number; // Viewport top coordinate in world-space [0, MAP_HEIGHT - viewportHeight]
}

export interface NPCMetadata {
  name: string;
  initial: string;
  dialogue: {
    es: string;
    en: string;
  };
}

export interface ActiveDialog {
  npcName: string;
  skillId: string;
  text: string;
}

export interface CollectibleItem {
  id: string; // Slugified name of the skill
  name: string;
  category: 'technical' | 'qualitative' | 'soft';
  biome: string;
  x: number;
  y: number;
  radius: number;
  collected: boolean;
  npc?: NPCMetadata;
}

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  collectedSkills: Set<string>;
}

export interface GameStateUpdateEventPayload {
  collectedCount: number;
  totalCount: number;
  lastCollected: string | null;
  unlockedId: string; // The ID of the item just collected to unlock in DOM
}

export interface GameHandle {
  stop(): void;
  getFps(): number;
  start(): void;
  player?: Player;
  collectibles?: CollectibleItem[];
  camera?: Camera;
}

declare global {
  interface Window {
    gameHandle?: GameHandle;
  }
}
