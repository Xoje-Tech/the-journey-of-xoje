/**
 * src/game/init.ts
 *
 * Public entry point for the videogame-ui slice. `init(canvas, opts)`
 * starts a `requestAnimationFrame` loop that:
 *   1. Polls input (keyboard on window, mouse on canvas, gamepad via
 *      `navigator.getGamepads()`).
 *   2. Integrates velocity with friction (physics.ts) and wraps the player
 *      around the canvas edges.
 *   3. Renders a grid background, the motion trail (P3), the player
 *      capsule (P1), and a telemetry HUD (P2).
 *
 * Phase-2 polish (added in this slice):
 *   - Capsule sprite (drawPlayerCapsule, P1): vertical pill, white fill,
 *     subtle dark stroke. Idle facing defaults to "down".
 *   - Motion trail (drawTrail, P3): a ring buffer of the last 14 player
 *     positions, fading to zero over 280 ms. Cleared on canvas wrap.
 *   - HUD (P2): "xoje.dev" + pos / vel / fps, drawn into the canvas via
 *     ctx.fillText so no DOM element is created (and the slice-1 print
 *     contract stays intact). FPS computed from a 30-frame rolling window.
 *   - Blink animation (P1): the capsule "blinks" for 120 ms every 3–5 s,
 *     timestamped from a single closure-scoped deadline.
 *
 * Design decisions encoded as constants (Phase 0):
 *   - friction = 0.92 (OQ1: user-confirmed smooth glide)
 *   - mouse click = one-shot target cleared on arrival (OQ2)
 *   - DPR-scaled backing store (OQ3): canvas.width/height in DEVICE pixels,
 *     CSS width/height in LOGICAL pixels, ctx.scale(dpr, dpr) before draw.
 *   - Vitest 1.6.1 stays; no new deps (OQ4, matches design doctrine).
 *   - page-break-inside: avoid still applies to the CV section (OQ5) — this
 *     module does not touch print.css.
 *
 * Tab-hidden safe: `document.visibilitychange` pauses the loop (no RAF
 * scheduling while hidden) and resumes when the tab is visible again.
 * Player state is preserved across pause/resume.
 *
 * Return value: `{ stop() }` cancels the RAF loop and detaches listeners.
 */
import { applyFriction, clampPlayerY, checkCollision } from '@/modules/game/application/physics';
import { sampleInputs, pointerEventToCanvasTarget } from '@/modules/game/application/input';
import { isStartedStore, activeDialogStore, activeTooltipStore } from '@/modules/game/application/store';
import {
  drawGrid,
  drawTrail,
  updateTrail,
  TRAIL_MAX_AGE_MS,
  TRAIL_MAX_LEN,
  drawBiomes,
  drawCollectibles,
  drawBottomCTA,
} from './render';
import { formatHud } from './hud';
import { PlayerEntity } from '@/modules/game/application/player';
import { createLogger } from '@/shared/lib/logger';
import type {
  CanvasDims,
  InitOptions,
  InputState,
  Player,
  TrailPoint,
  Camera,
  CollectibleItem,
  GameHandle,
} from "@/modules/game/domain/types";

const gameLogger = createLogger('game');

// Phase 0 decisions, encoded as named constants so the values are greppable
// and tests can reference them.
export const DEFAULT_FRICTION = 0.92; // OQ1: smooth glide
export const DEFAULT_GRID_SIZE = 40;
export const DEFAULT_PLAYER_SIZE = 14;
export const DEFAULT_ACCEL = 0.6;
export const MAP_HEIGHT = 4000;

const BIOME_LCS_ROBOTICS = 'LCS Robotics';
const BIOME_CRMBLE = 'Crmble';
const BIOME_TWINNY = 'Twinny';
const BIOME_RIDE_ON = 'RIDE ON';

export const SKILL_TEMPLATES = [
  // LCS Robotics (0 - 1000)
  {
    id: 'kuka-robotics',
    name: 'KUKA robotics tooling',
    category: 'technical' as const,
    biome: BIOME_LCS_ROBOTICS,
    xRatio: 0.3,
    y: 250,
  },
  {
    id: 'cultural-adaptability',
    name: 'Cultural adaptability',
    category: 'soft' as const,
    biome: BIOME_LCS_ROBOTICS,
    xRatio: 0.4,
    y: 350,
  },
  {
    id: 'international-ops',
    name: 'Operacion en entorno internacional',
    category: 'qualitative' as const,
    biome: BIOME_LCS_ROBOTICS,
    xRatio: 0.7,
    y: 500,
    npc: {
      name: 'Héctor',
      initial: 'H',
      dialogue: {
        es: '¡Ey Xoje! Bienvenido a bordo. En este entorno internacional de automoción vas a tener que comunicarte con equipos de todo el mundo. ¡La adaptabilidad es clave!',
        en: 'Hey Xoje! Welcome aboard. In this international automotive environment, you will have to communicate with teams from all over the world. Adaptability is key!',
      },
    },
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    category: 'technical' as const,
    biome: BIOME_LCS_ROBOTICS,
    xRatio: 0.5,
    y: 750,
  },

  // Crmble (1000 - 2000)
  {
    id: 'sass',
    name: 'Sass',
    category: 'technical' as const,
    biome: BIOME_CRMBLE,
    xRatio: 0.25,
    y: 1200,
  },
  {
    id: 'bootstrap',
    name: 'Bootstrap',
    category: 'technical' as const,
    biome: BIOME_CRMBLE,
    xRatio: 0.75,
    y: 1400,
  },
  {
    id: 'collaborative-creativity',
    name: 'Collaborative creativity',
    category: 'soft' as const,
    biome: BIOME_CRMBLE,
    xRatio: 0.5,
    y: 1500,
  },
  {
    id: 'design-system',
    name: 'Design system',
    category: 'qualitative' as const,
    biome: BIOME_CRMBLE,
    xRatio: 0.4,
    y: 1600,
    npc: {
      name: 'Laura',
      initial: 'L',
      dialogue: {
        es: 'Hola Jose. Diseñé estos componentes píxel-perfect. Vamos a construir juntos un sistema de componentes sólido para que sirva como única fuente de verdad.',
        en: "Hi Jose. I designed these pixel-perfect components. Let's build a solid component system together to serve as our single source of truth.",
      },
    },
  },
  {
    id: 'pixel-perfect',
    name: 'Pixel-perfect implementation',
    category: 'qualitative' as const,
    biome: BIOME_CRMBLE,
    xRatio: 0.6,
    y: 1800,
  },

  // Twinny (2000 - 3000)
  {
    id: 'angular',
    name: 'Angular',
    category: 'technical' as const,
    biome: BIOME_TWINNY,
    xRatio: 0.3,
    y: 2200,
  },
  {
    id: 'jira',
    name: 'Jira',
    category: 'technical' as const,
    biome: BIOME_TWINNY,
    xRatio: 0.7,
    y: 2400,
  },
  {
    id: 'peer-mentoring',
    name: 'Peer mentoring',
    category: 'soft' as const,
    biome: BIOME_TWINNY,
    xRatio: 0.6,
    y: 2500,
    npc: {
      name: 'Dani',
      initial: 'D',
      dialogue: {
        es: '¡Hola Xoje! Gracias por guiarme con Angular y explicarme los patrones de DDD. Tener un mentor en el equipo hace que aprender sea mucho más fácil.',
        en: 'Hi Xoje! Thanks for guiding me with Angular and explaining DDD patterns. Having a mentor in the team makes learning so much easier.',
      },
    },
  },
  {
    id: 'swagger',
    name: 'Swagger',
    category: 'technical' as const,
    biome: BIOME_TWINNY,
    xRatio: 0.5,
    y: 2600,
  },
  {
    id: 'ddd',
    name: 'Domain-Driven Design (DDD)',
    category: 'qualitative' as const,
    biome: BIOME_TWINNY,
    xRatio: 0.4,
    y: 2800,
  },

  // RIDE ON (3000 - 4000)
  {
    id: 'astro',
    name: 'Astro',
    category: 'technical' as const,
    biome: BIOME_RIDE_ON,
    xRatio: 0.2,
    y: 3200,
  },
  {
    id: 'vue',
    name: 'Vue',
    category: 'technical' as const,
    biome: BIOME_RIDE_ON,
    xRatio: 0.8,
    y: 3400,
  },
  {
    id: 'continuous-learning',
    name: 'Continuous learning',
    category: 'soft' as const,
    biome: BIOME_RIDE_ON,
    xRatio: 0.45,
    y: 3500,
  },
  {
    id: 'nodejs',
    name: 'Node.js',
    category: 'technical' as const,
    biome: BIOME_RIDE_ON,
    xRatio: 0.5,
    y: 3600,
  },
  {
    id: 'tdd',
    name: 'Test-Driven Development (TDD)',
    category: 'qualitative' as const,
    biome: BIOME_RIDE_ON,
    xRatio: 0.6,
    y: 3800,
    npc: {
      name: 'Marcos',
      initial: 'M',
      dialogue: {
        es: 'Qué tal, Xoje. Aquí en RIDE ON la calidad es innegociable. No subas nada sin escribir primero sus tests unitarios. ¡TDD es el camino!',
        en: "Hey Xoje. Here at RIDE ON, quality is non-negotiable. Don't upload anything without writing its unit tests first. TDD is the way!",
      },
    },
  },
];

// Phase-2 polish constants. Keep them next to the slice so anyone reading
// init.ts sees the magic numbers in context.
const FPS_WINDOW = 30; // rolling window for the FPS counter
const HUD_PAD_X = 16; // logical px from the left edge
const HUD_PAD_Y = 16; // logical px from the top edge
const HUD_FONT = '14px ui-monospace, "JetBrains Mono", Menlo, Consolas, monospace';
const HUD_COLOR = '#cfcfd0';
const HUD_LINE_HEIGHT = 18; // logical px per line at 14px font + line-height ~1.3

// Blink duration matching the visual specs (120ms parpadeo)
const BLINK_DURATION_MS = 120;
const BLINK_MIN_INTERVAL_MS = 3000;
const BLINK_MAX_INTERVAL_MS = 5000;

export function init(canvas: HTMLCanvasElement, opts: InitOptions = {}): GameHandle {
  let started = false;
  let hasStarted = false;
  const locale = opts.locale ?? 'es';

  const unsubscribe = isStartedStore.subscribe((val) => {
    started = val;
    if (val) {
      hasStarted = true;
    }
  });

  let isDialogActive = false;
  const unsubscribeDialog = activeDialogStore.subscribe((val) => {
    isDialogActive = !!val;
  });

  const onDialogDismissed = (e: Event) => {
    const customEvent = e as CustomEvent<{ skillId: string }>;
    const skillId = customEvent.detail.skillId;
    const item = collectibles.find((c) => c.id === skillId);
    if (item && !item.collected) {
      item.collected = true;
      const collectedCount = collectibles.filter((c) => c.collected).length;
      const totalCount = collectibles.length;
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('game-state-update', {
            detail: {
              collectedCount,
              totalCount,
              lastCollected: item.name,
              unlockedId: item.id,
            },
          }),
        );
      }
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('dialog-dismissed', onDialogDismissed);
  }
  const ctxOrNull = canvas.getContext('2d');
  if (!ctxOrNull) {
    throw new Error('[videogame-ui] could not acquire 2D context');
  }
  // Capture as a non-null const so closures see the narrowed type under
  // `noUncheckedIndexedAccess` + `strict`. TS doesn't preserve the `!ctx`
  // narrowing into the closures we define below.
  const ctx: CanvasRenderingContext2D = ctxOrNull;

  const friction = opts.friction ?? DEFAULT_FRICTION;
  const gridSize = opts.gridSize ?? DEFAULT_GRID_SIZE;
  const playerSize = DEFAULT_PLAYER_SIZE;

  const dims: CanvasDims = { w: 0, h: 0, dpr: 1 };

  const player: Player = {
    x: 0, // overwritten by initial-size handler so it lands top-center
    y: 0,
    vx: 0,
    vy: 0,
    size: playerSize,
  };

  const camera: Camera = { y: 0 };

  const collectibles: CollectibleItem[] = SKILL_TEMPLATES.map((t) => ({
    id: t.id,
    name: t.name,
    category: t.category,
    biome: t.biome,
    x: 0, // dynamic X coordinates mapped in resize()
    y: t.y,
    radius: 12,
    collected: false,
    npc: t.npc,
  }));

  /** Instantiate the clean architecture PlayerEntity and load spritesheet */
  const playerEntity = new PlayerEntity(opts.spritesheetPath);
  playerEntity.load().catch((err) => {
    gameLogger.error('Failed to load player spritesheet asynchronously:', { error: err });
  });

  /** Load skill sprites asynchronously */
  const skillImages: Record<string, HTMLImageElement> = {};
  if (opts.skillSpritePaths) {
    for (const [id, path] of Object.entries(opts.skillSpritePaths)) {
      if (typeof window !== 'undefined' && typeof Image !== 'undefined') {
        const img = new Image();
        img.src = path;
        img.onload = () => {
          skillImages[id] = img;
        };
        img.onerror = (err) => {
          gameLogger.error(`Failed to load skill sprite for: ${id} from ${path}`, { error: err });
        };
      }
    }
  }

  /** Ring buffer of trail points. Mutated by `updateTrail` per frame. */
  let trail: TrailPoint[] = [];

  const state: InputState = {
    keys: {},
    mouseTarget: null,
    gamepadConnected: false,
    clearMouseTarget() {
      state.mouseTarget = null;
    },
  };

  // FPS rolling-window state. We store timestamps (ms since the page
  // navigation start, via `performance.now()`) for the last `FPS_WINDOW`
  // frames, then compute `1000 / average_dt_ms`. We expose `getFps` from
  // the closure for any future caller (e.g. a dev-mode overlay), but no
  // test or production path reads it today.
  const frameTimes: number[] = [];
  let fpsValue = 0;
  function getFps(): number {
    return fpsValue;
  }

  // Blink animation state. `blinkStart` is the timestamp at which the
  // current blink began (or -Infinity if no blink is active). `nextBlinkAt`
  // is the timestamp at which the next blink should start. Both are
  // initialised so the first blink fires after `BLINK_MIN_INTERVAL_MS`.
  let blinkStart = -Infinity;
  let nextBlinkAt = performance.now() + randInRange(BLINK_MIN_INTERVAL_MS, BLINK_MAX_INTERVAL_MS);

  /**
   * Apply the current canvas size to the backing store and the CSS box.
   * Per OQ3, CSS keeps logical px (matches clientWidth/Height) and the
   * backing store is scaled by dpr for crisp drawing on retina displays.
   */
  function resize(): void {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const cssW = canvas.clientWidth || window.innerWidth;
    const cssH = canvas.clientHeight || window.innerHeight;
    dims.w = cssW;
    dims.h = cssH;
    dims.dpr = dpr;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    ctx.setTransform(1, 0, 0, 1, 0, 0); // reset prior scale
    ctx.scale(dpr, dpr);

    // On first resize, place the player horizontally centered at the top.
    if (player.x === 0 && player.y === 0) {
      player.x = cssW / 2;
      player.y = playerSize;
    }

    // Map collectible positions on resize based on screen width
    collectibles.forEach((item, idx) => {
      const template = SKILL_TEMPLATES[idx];
      if (template) {
        item.x = cssW * template.xRatio;
      }
    });
  }

  function onKeyDown(e: KeyboardEvent): void {
    state.keys[e.key] = true;

    // Keyboard shortcut for Print CV (Slice C WU-2). Fires once per
    // physical press — `e.repeat` is true while the key is held and we
    // don't want to spam the print dialog. The DOM PrintButton listens
    // to this CustomEvent and calls window.print(); decoupling here
    // keeps init.ts free of UI concerns.
    //
    // Ignore the shortcut when the user is typing in an input field
    // (future-proofing: today there are no text inputs in the game, but
    // if a settings form is ever added, this guard prevents P from
    // hijacking keystrokes inside it).
    //
    // The `typeof X === 'undefined'` guards exist because the test env
    // (Vitest without a DOM) doesn't define HTMLInputElement /
    // HTMLTextAreaElement as globals — a pattern we already use for
    // setInterval / clearInterval in this same engine. We use string
    // names instead of referencing the constructors directly so the
    // type-checker doesn't error out at compile time.
    const target = e.target as unknown as { tagName?: string; isContentEditable?: boolean } | null;
    const isTyping =
      target?.tagName === 'INPUT' ||
      target?.tagName === 'TEXTAREA' ||
      (target?.isContentEditable ?? false);
    if (isTyping || e.repeat) return;
    if (e.key === 'p' || e.key === 'P') {
      window.dispatchEvent(new CustomEvent('print-requested'));
    }
  }
  function onKeyUp(e: KeyboardEvent): void {
    state.keys[e.key] = false;
  }
  function onPointerDown(e: PointerEvent): void {
    state.mouseTarget = pointerEventToCanvasTarget(canvas, e);
  }
  function onGamepadConnected(): void {
    state.gamepadConnected = true;
  }
  function onGamepadDisconnected(): void {
    state.gamepadConnected = false;
  }
  function onVisibility(): void {
    if (document.hidden) {
      pause();
    } else {
      resume();
    }
  }

  // Initial sizing + listener wiring (before first frame).
  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('gamepadconnected', onGamepadConnected);
  window.addEventListener('gamepaddisconnected', onGamepadDisconnected);
  document.addEventListener('visibilitychange', onVisibility);

  // Gamepad A/B/Start edge-detect (Slice A, WU-2; Slice C WU-3 adds Start).
  // The dialog overlay and the retro modals live in the DOM, not on the
  // canvas, so they need to react to gamepad input even when the RAF
  // loop is paused (e.g. dialog open). We poll at 10 Hz — fast enough for
  // a confirm button, slow enough not to compete with the per-frame loop
  // on the same getGamepads() call.
  //
  // Edge detection: only fire when the button transitions from
  // released → pressed. Without this, holding A would spam clicks every
  // 100 ms.
  let prevAPressed = false;
  let prevBPressed = false;
  let prevStartPressed = false;
  const BUTTON_POLL_MS = 100;
  // Defensive: tests that mock `window` may not provide setInterval.
  // The interval id defaults to 0 (a falsy timer handle that
  // clearInterval tolerates), so stop() can always call clearInterval
  // safely even when no timer was created.
  let gamepadButtonTimer = 0;
  if (typeof window.setInterval === 'function') {
    gamepadButtonTimer = window.setInterval(() => {
      if (!state.gamepadConnected) return;
      const { a, b, start } = pollGamepadOnce();
      const aPressed = !!a;
      const bPressed = !!b;
      const startPressed = !!start;
      if (aPressed && !prevAPressed) {
        window.dispatchEvent(new CustomEvent('gamepad-a'));
      }
      if (bPressed && !prevBPressed) {
        window.dispatchEvent(new CustomEvent('gamepad-b'));
      }
      if (startPressed && !prevStartPressed) {
        window.dispatchEvent(new CustomEvent('gamepad-start'));
      }
      prevAPressed = aPressed;
      prevBPressed = bPressed;
      prevStartPressed = startPressed;
    }, BUTTON_POLL_MS);
  }

  let rafId = 0;
  let paused = false;
  let lastFrameMs = performance.now();

  function updateFps(now: number): void {
    frameTimes.push(now);
    if (frameTimes.length > FPS_WINDOW) frameTimes.shift();
    if (frameTimes.length >= 2) {
      const first = frameTimes[0]!;
      const last = frameTimes[frameTimes.length - 1]!;
      const span = last - first;
      fpsValue = span > 0 ? Math.round((1000 * (frameTimes.length - 1)) / span) : 0;
    }
  }

  function updateBlink(now: number): boolean {
    if (now >= nextBlinkAt) {
      blinkStart = now;
      nextBlinkAt = now + randInRange(BLINK_MIN_INTERVAL_MS, BLINK_MAX_INTERVAL_MS);
    }
    return now - blinkStart < BLINK_DURATION_MS;
  }

  /**
   * Polled once per frame (during play) for stick + dpad; also polled at
   * 10 Hz by a separate interval for the A/B/Start edge-detect that drives
   * dialog advance, modal close, and settings open — those events can fire
   * while the RAF loop is paused (e.g. dialog overlay open), so the polling
   * can't depend on `loop()` being scheduled.
   *
   * Standard mapping:
   *   buttons[0]  = A (south / confirm)
   *   buttons[1]  = B (east / cancel)
   *   buttons[9]  = Start (menu — NES-style Start button)
   *
   * We treat "pressed" as `pressed || touched` so soft-presses on
   * triggerless controllers still register.
   */
  function pollGamepadOnce(): {
    stick?: { x: number; y: number };
    dpad?: { up: boolean; down: boolean; left: boolean; right: boolean };
    a?: boolean;
    b?: boolean;
    start?: boolean;
  } {
    let stick: { x: number; y: number } | undefined;
    let dpad: { up: boolean; down: boolean; left: boolean; right: boolean } | undefined;
    let a: boolean | undefined;
    let b: boolean | undefined;
    let start: boolean | undefined;
    if (state.gamepadConnected && typeof navigator.getGamepads === 'function') {
      const pads = navigator.getGamepads();
      const pad = pads && pads[0];
      if (pad) {
        stick = { x: pad.axes[0] ?? 0, y: pad.axes[1] ?? 0 };
        dpad = {
          up: !!pad.buttons[12]?.pressed,
          down: !!pad.buttons[13]?.pressed,
          left: !!pad.buttons[14]?.pressed,
          right: !!pad.buttons[15]?.pressed,
        };
        // Standard mapping (W3C gamepad).
        a = !!(pad.buttons[0]?.pressed || pad.buttons[0]?.touched);
        b = !!(pad.buttons[1]?.pressed || pad.buttons[1]?.touched);
        // Start button is buttons[9] in standard mapping (between
        // shoulder buttons and stick clicks).
        start = !!(pad.buttons[9]?.pressed || pad.buttons[9]?.touched);
      }
    }
    return { stick, dpad, a, b, start };
  }

  function pollGamepad(): { stick?: { x: number; y: number }; dpad?: { up: boolean; down: boolean; left: boolean; right: boolean } } {
    const { stick, dpad } = pollGamepadOnce();
    return { stick, dpad };
  }

  function loop(): void {
    const now = performance.now();
    const dtMs = now - lastFrameMs;
    lastFrameMs = now;

    updateFps(now);
    const blinkActive = updateBlink(now);

    const isPlaying = started && !isDialogActive;

    if (isPlaying) {
      const { stick, dpad } = pollGamepad();

      const v = sampleInputs(state, canvas, dims.w, dims.h, stick, dpad, player);

      // Integrate: v = (v + input) * friction, then add to position.
      player.vx = (player.vx + v.vx) * friction;
      player.vy = (player.vy + v.vy) * friction;
      // Snap-to-zero when velocity is below an epsilon to stop endless creep.
      if (Math.abs(player.vx) < 1e-3) player.vx = 0;
      if (Math.abs(player.vy) < 1e-3) player.vy = 0;
      const prevX = player.x;
      player.x += player.vx;
      player.y += player.vy;

      // 1. Clamping player vertically instead of wrapping
      const clampedY = clampPlayerY(player.y, MAP_HEIGHT);
      if (clampedY !== player.y) {
        player.vy = 0;
        player.y = clampedY;
      }

      // 2. Horizontal wrapping
      player.x = ((player.x % dims.w) + dims.w) % dims.w;
      const didWrap = player.x !== prevX + player.vx;

      // 3. Viewport camera Y centers on player Y and clamps
      camera.y = clampPlayerY(player.y - dims.h / 2, MAP_HEIGHT - dims.h);

      // Trail update: append the current position, age the buffer, drop
      // old entries. Reset the trail when the player wraps around — a
      // teleport from one edge to another would otherwise leave a streak
      // across the canvas.
      trail = updateTrail(
        trail,
        dtMs,
        TRAIL_MAX_AGE_MS,
        TRAIL_MAX_LEN,
        didWrap ? null : { x: player.x, y: player.y },
      );
      if (didWrap) {
        // After a wrap, drop the old buffer entirely so the next frame's
        // trail starts fresh on the new edge.
        trail = [];
      }

      // Collisions check & Dispatch CustomEvent
      for (const item of collectibles) {
        if (!item.collected && checkCollision(player, item)) {
          if (item.npc) {
            // Trigger dialog overlay instead of direct collection
            const dialogText = locale === 'es' ? item.npc.dialogue.es : item.npc.dialogue.en;
            activeDialogStore.set({
              npcName: item.npc.name,
              skillId: item.id,
              text: dialogText,
            });
            // Stop movement to prevent overlapping
            player.vx = 0;
            player.vy = 0;
          } else {
            item.collected = true;
            const collectedCount = collectibles.filter((c) => c.collected).length;
            const totalCount = collectibles.length;
            if (typeof window !== 'undefined') {
              window.dispatchEvent(
                new CustomEvent('game-state-update', {
                  detail: {
                    collectedCount,
                    totalCount,
                    lastCollected: item.name,
                    unlockedId: item.id,
                  },
                }),
              );
            }
          }
        }
      }

      // Proximity scan for tooltips (Euclidean distance < 40px).
      // Type narrowed to the closest matching element of `collectibles`,
      // unknown at compile-time, so we use a permissive cast at the call site.
      type Collectible = (typeof collectibles)[number];
      let closestItem: Collectible | null = null;
      let minDistance = Infinity;
      for (const item of collectibles) {
        if (!item.collected) {
          const dist = Math.hypot(player.x - item.x, player.y - item.y);
          if (dist < 40 && dist < minDistance) {
            minDistance = dist;
            closestItem = item;
          }
        }
      }

      if (closestItem) {
        activeTooltipStore.set({
          id: closestItem.id,
          type: closestItem.npc ? 'npc' : 'skill',
          name: closestItem.npc ? closestItem.npc.name : closestItem.name,
          screenX: closestItem.x,
          screenY: closestItem.y - camera.y,
        });
      } else {
        activeTooltipStore.set(null);
      }
    } else {
      activeTooltipStore.set(null);
    }

    // Render. Logical-pixel coordinates because we already scaled the ctx.
    ctx.clearRect(0, 0, dims.w, dims.h);

    // Draw grid stationary background
    drawGrid(ctx, dims.w, dims.h, gridSize);

    // Draw World-space elements with camera translation
    ctx.save();
    ctx.translate(0, -camera.y);

    // Draw Biomes
    drawBiomes(ctx, dims.w, camera.y, dims.h);

    if (hasStarted) {
      // Draw Collectibles
      drawCollectibles(ctx, collectibles, camera.y, dims.h, skillImages);

      // Draw Bottom CTA
      drawBottomCTA(ctx, dims.w, camera.y, dims.h);

      // Draw Trail
      drawTrail(ctx, trail, TRAIL_MAX_AGE_MS);
    }

    // Draw and progress player spritesheet animation
    const animDt = isPlaying ? dtMs : 0;
    const blinkStatus = isPlaying ? blinkActive : false;
    playerEntity.updateAndDraw(ctx, player.x, player.y, player.vx, player.vy, animDt, blinkStatus);

    ctx.restore();

    drawHud(ctx, player, dims.w, dims.h, fpsValue);

    if (!paused) rafId = requestAnimationFrame(loop);
  }

  function pause(): void {
    if (paused) return;
    paused = true;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
  }
  function resume(): void {
    if (!paused) return;
    paused = false;
    rafId = requestAnimationFrame(loop);
  }

  rafId = requestAnimationFrame(loop);

  return {
    stop(): void {
      pause();
      unsubscribe();
      unsubscribeDialog();
      if (typeof window.clearInterval === 'function') {
        window.clearInterval(gamepadButtonTimer);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('dialog-dismissed', onDialogDismissed);
      }
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('gamepadconnected', onGamepadConnected);
      window.removeEventListener('gamepaddisconnected', onGamepadDisconnected);
      document.removeEventListener('visibilitychange', onVisibility);
    },
    getFps,
    start(): void {
      started = true;
    },
    player,
    collectibles,
    camera,
  };
}

/**
 * Render the HUD (brand + pos + vel + fps) into the top-left corner of
 * the canvas. `formatHud` returns the raw string; we draw it line-by-line.
 */
function drawHud(
  ctx: CanvasRenderingContext2D,
  player: Player,
  canvasW: number,
  canvasH: number,
  fps: number,
): void {
  ctx.save();
  ctx.font = HUD_FONT;
  ctx.fillStyle = HUD_COLOR;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  const text = formatHud(player, canvasW, canvasH, fps);
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i] ?? '', HUD_PAD_X, HUD_PAD_Y + i * HUD_LINE_HEIGHT);
  }
  ctx.restore();
}

/**
 * Random integer in the inclusive range `[min, max]`. Used for blink
 * scheduling — each blink interval is independently randomized so the
 * animation feels organic rather than metronomic.
 */
function randInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

// accel is referenced via sampleInputs internally; export so a future test
// (or a tuning panel) can verify the same constant the loop uses.
void DEFAULT_ACCEL;
void applyFriction; // re-export kept for future slice work; suppress unused-arg lint.
