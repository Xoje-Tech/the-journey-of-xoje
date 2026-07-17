/**
 * src/game/render.ts
 *
 * Canvas 2D drawing primitives for the videogame-ui slice, plus a pure
 * helper (`updateTrail`) so the deterministic parts of
 * the trail animation can be unit-tested without a DOM.
 *
 * Exports:
 *   - `drawGrid(ctx, w, h, gridSize)` — light grid lines so the player can
 *      perceive displacement against a stationary background.
 *   - `drawTrail(ctx, trail, maxAgeMs)` — small fading dots behind the
 *      player (P3, see design).
 *   - `updateTrail(...)` — pure: age + drop + append for the trail buffer.
 *   - Constants: `TRAIL_MAX_AGE_MS`, `TRAIL_MAX_LEN`.
 *
 * Visual language is deliberately minimal: the player is the only moving
 * thing on screen, so all the polish lives here.
 */
import type { TrailPoint, CollectibleItem } from "@/modules/game/domain/types";

/* ------------------------------------------------------------------ */
/*  Constants — exported so init.ts and tests share the same numbers. */
/* ------------------------------------------------------------------ */

/** Maximum age (ms) a trail point survives before being dropped. */
export const TRAIL_MAX_AGE_MS = 280;

/** Maximum number of trail points retained in the buffer (ring-style). */
export const TRAIL_MAX_LEN = 14;

/* ------------------------------------------------------------------ */
/*  Pure helpers                                                      */
/* ------------------------------------------------------------------ */

/**
 * Advance the trail buffer by one frame: age every existing point by
 * `dtMs`, drop points whose age exceeds `maxAgeMs`, optionally append
 * the current player position, and cap the buffer at `maxLen`.
 *
 * Pure: returns a fresh array, never mutates the input. Caller owns the
 * state and replaces its reference each frame.
 *
 * @param trail    Current trail buffer.
 * @param dtMs     Frame delta in milliseconds (typically ~16 at 60fps).
 * @param maxAgeMs Age cutoff in ms.
 * @param maxLen   Hard cap on buffer length.
 * @param current  Player position to append, or null to skip (used for
 *                 pause / wrap-reset frames where we don't want a fresh
 *                 trail point).
 */
export function updateTrail(
  trail: TrailPoint[],
  dtMs: number,
  maxAgeMs: number,
  maxLen: number,
  current: { x: number; y: number } | null,
): TrailPoint[] {
  // 1. Age + drop in a single pass.
  const aged: TrailPoint[] = [];
  for (const p of trail) {
    const next = p.age + dtMs;
    if (next <= maxAgeMs) aged.push({ x: p.x, y: p.y, age: next });
  }
  // 2. Optionally append the current point.
  if (current) {
    aged.push({ x: current.x, y: current.y, age: 0 });
  }
  // 3. Cap to maxLen, dropping the OLDEST (front of the array).
  if (aged.length > maxLen) {
    return aged.slice(aged.length - maxLen);
  }
  return aged;
}

/* ------------------------------------------------------------------ */
/*  Drawing primitives                                                */
/* ------------------------------------------------------------------ */

/**
 * Draw the grid background. Subtle white lines at 6% alpha so the player
 * can perceive displacement against a stationary reference.
 */
export function drawGrid(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  gridSize: number,
): void {
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= w; x += gridSize) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
  }
  for (let y = 0; y <= h; y += gridSize) {
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
  }
  ctx.stroke();
  ctx.restore();
}

/**
 * Draw the player's motion trail as small fading dots. Each point's
 * alpha decays linearly from `0.5` at age 0 to `0` at age `maxAgeMs`.
 *
 * Color matches the capsule (off-white) but is darkened via the alpha
 * channel — no separate color constant is needed.
 */
export function drawTrail(
  ctx: CanvasRenderingContext2D,
  trail: TrailPoint[],
  maxAgeMs: number,
): void {
  if (trail.length === 0) return;
  ctx.save();
  ctx.fillStyle = '#7a7a7e';
  for (const p of trail) {
    const alpha = (1 - p.age / maxAgeMs) * 0.5;
    if (alpha <= 0) continue;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Viewport culling helper: returns true if an entity with a center y and a radius/height
 * overlaps with the current vertical viewport [cameraY, cameraY + viewportHeight].
 */
export function isWithinViewport(
  y: number,
  radius: number,
  cameraY: number,
  viewportHeight: number,
): boolean {
  return y + radius >= cameraY && y - radius <= cameraY + viewportHeight;
}

/**
 * Draw chronological career biome boundaries and labels in world space.
 */
export function drawBiomes(
  ctx: CanvasRenderingContext2D,
  w: number,
  cameraY: number,
  viewportH: number,
): void {
  const biomes = [
    { name: 'LCS Robotics', yStart: 0, yEnd: 1000 },
    { name: 'Crmble', yStart: 1000, yEnd: 2000 },
    { name: 'Twinny', yStart: 2000, yEnd: 3000 },
    { name: 'RIDE ON', yStart: 3000, yEnd: 4000 },
  ];

  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.font = '12px ui-monospace, "JetBrains Mono", monospace';
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);

  for (const b of biomes) {
    // Draw bottom border of biome if it's less than MAP_HEIGHT (4000)
    if (b.yEnd < 4000) {
      if (isWithinViewport(b.yEnd, 0, cameraY, viewportH)) {
        ctx.beginPath();
        ctx.moveTo(0, b.yEnd);
        ctx.lineTo(w, b.yEnd);
        ctx.stroke();
      }
    }

    // Draw biome label near the top/start of the biome
    const labelY = b.yStart + 30;
    if (isWithinViewport(labelY, 10, cameraY, viewportH)) {
      ctx.fillText(b.name.toUpperCase(), 16, labelY);
    }
  }
  ctx.restore();
}

/**
 * Draw collectible items that have not been collected yet and are inside the viewport.
 */
export function drawCollectibles(
  ctx: CanvasRenderingContext2D,
  items: CollectibleItem[],
  cameraY: number,
  viewportH: number,
): void {
  ctx.save();
  ctx.font = '10px ui-monospace, "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (const item of items) {
    if (item.collected) continue;

    if (!isWithinViewport(item.y, item.radius, cameraY, viewportH)) {
      continue;
    }

    if (item.npc) {
      // Draw circular yellow NPC coin
      ctx.beginPath();
      ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(241, 196, 15, 0.25)';
      ctx.strokeStyle = 'rgba(241, 196, 15, 0.9)';
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();

      // Draw NPC initial inside the circle
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px ui-monospace, "JetBrains Mono", monospace';
      ctx.fillText(item.npc.initial, item.x, item.y);
      ctx.restore();

      // Draw NPC name label above the circle
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${item.npc.name} (NPC)`, item.x, item.y - item.radius - 8);
      continue;
    }

    // Draw circular skill coin
    ctx.beginPath();
    ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
    if (item.category === 'technical') {
      ctx.fillStyle = 'rgba(100, 200, 255, 0.2)';
      ctx.strokeStyle = 'rgba(100, 200, 255, 0.8)';
    } else if (item.category === 'qualitative') {
      ctx.fillStyle = 'rgba(255, 180, 100, 0.2)';
      ctx.strokeStyle = 'rgba(255, 180, 100, 0.8)';
    } else {
      ctx.fillStyle = 'rgba(100, 255, 100, 0.2)';
      ctx.strokeStyle = 'rgba(100, 255, 100, 0.8)';
    }
    ctx.lineWidth = 1.5;
    ctx.fill();
    ctx.stroke();

    // Draw skill name label above the circle
    ctx.fillStyle = '#ffffff';
    ctx.fillText(item.name, item.x, item.y - item.radius - 8);
  }
  ctx.restore();
}

/**
 * Draw Journey End CTA at the bottom of the map.
 */
export function drawBottomCTA(
  ctx: CanvasRenderingContext2D,
  w: number,
  cameraY: number,
  viewportH: number,
): void {
  const ctaY = 3900;
  if (isWithinViewport(ctaY, 50, cameraY, viewportH)) {
    ctx.save();

    // Draw a prominent finishing line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(0, ctaY);
    ctx.lineTo(w, ctaY);
    ctx.stroke();

    // Draw beautiful CTA text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px ui-monospace, "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✨ THE JOURNEY CONTINUES ✨', w / 2, ctaY + 30);

    ctx.font = '11px ui-monospace, "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillText('You have reached the end of the timeline!', w / 2, ctaY + 55);

    ctx.restore();
  }
}
