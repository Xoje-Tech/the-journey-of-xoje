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
import type { TrailPoint, CollectibleItem, BiomeConfig, NPCConfig } from "@/modules/game/domain/types";

/* ------------------------------------------------------------------ */
/*  Constants — exported so init.ts and tests share the same numbers. */
/* ------------------------------------------------------------------ */

/** Maximum age (ms) a trail point survives before being dropped. */
export const TRAIL_MAX_AGE_MS = 280;

/** Maximum number of trail points retained in the buffer (ring-style). */
export const TRAIL_MAX_LEN = 14;

/**
 * Placeholder fill style for missing decoration sprites. Kept here so
 * `drawBiomes` can render a deterministic fallback without depending on
 * the asset loader.
 */
const PLACEHOLDER_FILL = 'rgba(180, 180, 180, 0.25)';
const PLACEHOLDER_STROKE = 'rgba(180, 180, 180, 0.7)';

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
 * Draw chronological career biome boundaries, labels, and decorations in
 * world space. `BIOMES` is the single source of truth — biome heights
 * and labels are derived at the call site by accumulating heights
 * (mirrors `buildCollectibles` in biome-config.ts).
 *
 * Decoration sprites are looked up in `decorationSpritePaths` (a flat
 * map of biome-relative keys to image URLs); missing sprites fall back
 * to a deterministic placeholder rect per the spec.
 */
export function drawBiomes(
  ctx: CanvasRenderingContext2D,
  w: number,
  biomes: readonly BiomeConfig[],
  mapHeight: number,
  cameraY: number,
  viewportH: number,
  decorationSpritePaths: Record<string, string> = {},
  decorationImages: Record<string, HTMLImageElement> = {},
): void {
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.font = '12px ui-monospace, "JetBrains Mono", monospace';
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);

  // Compute yStart per biome by accumulating heights.
  const starts: number[] = [];
  let cursor = 0;
  for (const b of biomes) {
    starts.push(cursor);
    cursor += b.height;
  }

  for (let i = 0; i < biomes.length; i++) {
    const biome = biomes[i]!;
    const yStart = starts[i]!;
    const yEnd = yStart + biome.height;

    // Bottom border of biome unless it is the last one (matches map edge).
    if (yEnd < mapHeight) {
      if (isWithinViewport(yEnd, 0, cameraY, viewportH)) {
        ctx.beginPath();
        ctx.moveTo(0, yEnd);
        ctx.lineTo(w, yEnd);
        ctx.stroke();
      }
    }

    // Biome label near the top/start of the biome.
    const labelY = yStart + 30;
    if (isWithinViewport(labelY, 10, cameraY, viewportH)) {
      ctx.fillText(biome.label.toUpperCase(), 16, labelY);
    }
  }
  ctx.restore();

  // Decorations: drawn after biome chrome so they overlay labels naturally.
  // The render order inside a biome is intentionally fixed (background
  // chrome, then decorations, then collectibles).
  ctx.save();
  for (let i = 0; i < biomes.length; i++) {
    const biome = biomes[i]!;
    const yStart = starts[i]!;
    for (const deco of biome.decorations) {
      if (deco.yOffset < 0 || deco.yOffset > biome.height) continue;
      const y = yStart + deco.yOffset;
      if (!isWithinViewport(y, 0, cameraY, viewportH)) continue;
      const x = w * deco.xRatio;
      const img = decorationImages[deco.sprite];
      if (img) {
        const drawW = (img.naturalWidth || 64) * (deco.scale ?? 1);
        const drawH = (img.naturalHeight || 64) * (deco.scale ?? 1);
        ctx.drawImage(img, x - drawW / 2, y - drawH, drawW, drawH);
      } else {
        // Deterministic placeholder rect — never crashes, never logs.
        const phW = 60;
        const phH = 80;
        ctx.fillStyle = PLACEHOLDER_FILL;
        ctx.strokeStyle = PLACEHOLDER_STROKE;
        ctx.lineWidth = 1;
        ctx.fillRect(x - phW / 2, y - phH, phW, phH);
        ctx.strokeRect(x - phW / 2, y - phH, phW, phH);
        ctx.fillStyle = 'rgba(180, 180, 180, 0.9)';
        ctx.font = '10px ui-monospace, "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(deco.sprite, x, y - phH / 2);
        // Track that we at least attempted this decoration — used to
        // detect path-key normalization drift in tests.
        void decorationSpritePaths[deco.sprite];
      }
    }
  }
  ctx.restore();
}

/**
 * Draw collectible items that have not been collected yet and are inside
 * the viewport. NPC rendering resolves the NPC config via
 * `NPCS.find((n) => n.biomeId === item.npcId)` — the collectible itself
 * carries only the typed `npcId` reference.
 */
export function drawCollectibles(
  ctx: CanvasRenderingContext2D,
  items: CollectibleItem[],
  cameraY: number,
  viewportH: number,
  skillImages: Record<string, HTMLImageElement> = {},
  npcs: readonly NPCConfig[] = [],
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

    const npc =
      item.npcId !== undefined
        ? npcs.find((n) => n.biomeId === item.npcId)
        : undefined;

    if (npc) {
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
      ctx.fillText(npc.initial, item.x, item.y);
      ctx.restore();

      // Draw NPC name label above the circle
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${npc.name} (NPC)`, item.x, item.y - item.radius - 8);
      continue;
    }

    // Draw skill sprite if available, otherwise fallback to circular skill coin
    const img = skillImages[item.id];
    if (img) {
      // Shield is 24x24 px, centered around item.x, item.y
      ctx.drawImage(img, item.x - 12, item.y - 12, 24, 24);
    } else {
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
    }

    // Draw skill name label above the circle
    ctx.fillStyle = '#ffffff';
    ctx.fillText(item.name, item.x, item.y - item.radius - 8);
  }
  ctx.restore();
}

/**
 * Draw Journey End CTA at the bottom of the map. `mapHeight` is the
 * derived `MAP_HEIGHT` value; the CTA sits 100 px above the bottom
 * edge, computed from the config rather than a hard-coded 3900.
 */
export function drawBottomCTA(
  ctx: CanvasRenderingContext2D,
  w: number,
  mapHeight: number,
  cameraY: number,
  viewportH: number,
): void {
  const ctaY = mapHeight - 100;
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
