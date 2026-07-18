/**
 * tests/print-contract.test.ts
 *
 * Slice 1 print contract. The contract lives in src/styles/print.css and
 * consists of FIVE required substrings in the emitted CSS bundle:
 *
 *   "@page"
 *   "size: A4"
 *   "1.6cm"
 *   "no-print"
 *   "page-break-inside"
 *
 * The only deterministic way to verify without a headless browser is to:
 *   1. Run `astro build` so the bundler emits dist/_astro/*.css (small
 *      stylesheets may be inlined into HTML — handle both).
 *   2. Read each emitted CSS file and the emitted HTML files; if a CSS
 *      rule appears in either, count it.
 *   3. Assert every contract substring is present somewhere.
 *
 * RED phase: this test will FAIL if print.css is missing the rules,
 * OR if the build hasn't been run yet. We build first, then assert.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const PROJECT_ROOT = resolve(__dirname, '..');
const DIST = resolve(PROJECT_ROOT, 'dist');

const REQUIRED_SUBSTRINGS = [
  '@page',
  'size: A4',
  '1.6cm',
  'no-print',
  'page-break-inside',
  'STIX Two Text',
  '#1155cc',
] as const;

// CSS substrings appear in the SOURCE (print.css) verbatim, but Astro/Vite
// minifies whitespace in the emitted bundle — `size: A4` becomes `size:A4`,
// `1.6cm 2cm` becomes `1.6cm 2cm` (space between values preserved by the
// margin shorthand). We search for source-style substrings (more readable
// failure messages) but also accept their minified twin when relevant.
const REQUIRED_SUBSTRINGS_NORMALIZED: ReadonlyArray<readonly [string, RegExp]> = [
  ['@page', /@page\b/],
  ['size: A4', /size:\s*A4\b/],
  ['1.6cm', /1\.6cm\b/],
  ['no-print', /no-print\b/],
  ['page-break-inside', /page-break-inside\b/],
  ['STIX Two Text', /STIX\s*Two\s*Text/i],
  ['#1155cc', /#1155c[cf]\b|#15c\b/i],
];

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = `${dir}/${entry.name}`;
    if (entry.isDirectory()) {
      yield* walk(p);
    } else {
      yield p;
    }
  }
}

function readAllEmittedCss(): string {
  if (!existsSync(DIST)) return '';
  const parts: string[] = [];
  for (const p of walk(DIST)) {
    if (p.endsWith('.css')) parts.push(readFileSync(p, 'utf8'));
    if (p.endsWith('.html')) parts.push(readFileSync(p, 'utf8'));
  }
  return parts.join('\n\n');
}

describe('print contract — slice 1', () => {
  beforeAll(() => {
    // Make sure content is generated first (prebuild hook normally does this).
    // Slice 3.1: switched from build-cv.mjs (which imported @personal-brand/*)
    // to build-cv-static.mjs (standalone, no external runtime deps).
    const buildCv = spawnSync('node', ['scripts/build-cv-static.mjs'], {
      cwd: PROJECT_ROOT,
      encoding: 'utf8',
      env: { ...process.env, PB_DATA_DIR: resolve(PROJECT_ROOT, 'tests/fixtures/portfolio') },
    });
    if (buildCv.status !== 0) {
      throw new Error(
        `build-cv-static.mjs failed before print-contract test\nstderr: ${buildCv.stderr}`,
      );
    }
    // Run astro build. Clean dist first so we test fresh output.
    spawnSync('rm', ['-rf', 'dist'], { cwd: PROJECT_ROOT });
    const build = spawnSync('pnpm', ['exec', 'astro', 'build'], {
      cwd: PROJECT_ROOT,
      encoding: 'utf8',
      env: { ...process.env, NODE_ENV: 'production' },
    });
    if (build.status !== 0) {
      throw new Error(
        `astro build failed during print-contract test\nstderr: ${build.stderr}\nstdout: ${build.stdout}`,
      );
    }
  }, 120_000);

  it('astro build emits dist/ with both locale HTML pages', () => {
    expect(existsSync(resolve(DIST, 'index.html'))).toBe(true);
    expect(existsSync(resolve(DIST, 'en/index.html'))).toBe(true);
  });

  it.each(REQUIRED_SUBSTRINGS_NORMALIZED)(
    'emitted CSS contains required print-contract substring: %s',
    (_label, needle) => {
      const haystack = readAllEmittedCss();
      expect(needle.test(haystack), `expected emitted CSS to match /${needle.source}/`).toBe(true);
    },
  );
});

/**
 * Regression test for issue #9 (dogfooding 2026-07-17): the print-preview
 * script was generating `BASE_URL/${locale}/` for both locales, which
 * broke the default locale (es) after PR #17 flipped `prefixDefaultLocale`
 * to false. ES lives at `/` (root), not `/es/`.
 *
 * This test asserts the print-preview script contains the URL-construction
 * logic that respects the i18n routing contract. It does NOT run the script
 * (which requires a live dev server); it verifies the static code shape.
 */
describe('print-preview-headless.mjs — issue #9 regression', () => {
  const SCRIPT_PATH = resolve(PROJECT_ROOT, 'scripts/print-preview-headless.mjs');

  it('script exists and is readable', () => {
    expect(existsSync(SCRIPT_PATH)).toBe(true);
  });

  it('script defines a urlForLocale helper (or equivalent) for default locale at /', () => {
    const src = readFileSync(SCRIPT_PATH, 'utf8');
    // After PR #17 the default locale lives at `/`. The script must reflect
    // that, NOT hardcode `${BASE_URL}/${locale}/`.
    expect(src).toMatch(/function\s+urlForLocale|if\s*\(\s*locale\s*===\s*['"]es['"]\s*\)/);
  });

  it('script does NOT contain the buggy pattern `BASE_URL}/${locale}/` for both locales', () => {
    const src = readFileSync(SCRIPT_PATH, 'utf8');
    // The old buggy line was: const url = `${BASE_URL}/${locale}/`;
    // After the fix it should be: const url = urlForLocale(locale);
    expect(src).not.toMatch(/const\s+url\s*=\s*`\$\{BASE_URL\}\/\$\{locale\}\/`/);
  });

  it('script strips trailing slash from BASE_URL to avoid double slashes', () => {
    const src = readFileSync(SCRIPT_PATH, 'utf8');
    expect(src).toMatch(/\.replace\([^)]+\)/);
  });
});

describe('TooltipOverlay.astro — print safety', () => {
  const TOOLTIP_PATH = resolve(PROJECT_ROOT, 'src/modules/game/interface/components/organisms/TooltipOverlay.astro');

  it('component exists and is readable', () => {
    expect(existsSync(TOOLTIP_PATH)).toBe(true);
  });

  it('component includes the no-print class on its main wrapper', () => {
    const src = readFileSync(TOOLTIP_PATH, 'utf8');
    expect(src).toMatch(/class="[^"]*no-print[^"]*"/);
  });
});

/**
 * Slice C WU-1: PrintButton appears in the built HTML so users can print
 * from inside the game (Brecha 8: window.print() was only reachable from
 * the Start Screen before).
 *
 * We verify the static contract — the print button element exists in
 * both locales and is marked no-print so it doesn't pollute the CV PDF.
 */
describe('PrintButton.astro — Slice C WU-1', () => {
  const PRINT_BTN_PATH = resolve(PROJECT_ROOT, 'src/modules/game/interface/components/atoms/PrintButton.astro');

  it('PrintButton.astro source exists', () => {
    expect(existsSync(PRINT_BTN_PATH)).toBe(true);
  });

  it('PrintButton source declares no-print on the wrapper', () => {
    const src = readFileSync(PRINT_BTN_PATH, 'utf8');
    // The wrapper MUST be no-print so it doesn't show up in the PDF.
    expect(src).toMatch(/class="[^"]*no-print[^"]*"/);
  });

  it('PrintButton source wires click → window.print()', () => {
    const src = readFileSync(PRINT_BTN_PATH, 'utf8');
    // Same handler as StartScreen's Download CV button — single source
    // of truth for the print action.
    expect(src).toMatch(/window\.print\(\)/);
  });

  it('PrintButton source subscribes to isStartedStore for visibility', () => {
    const src = readFileSync(PRINT_BTN_PATH, 'utf8');
    // Visible only while the game is running (same pattern as PauseButton).
    expect(src).toMatch(/isStartedStore/);
  });

  it('built ES HTML contains the print button id', () => {
    const html = readFileSync(resolve(DIST, 'index.html'), 'utf8');
    expect(html).toMatch(/id="print-cv-btn"/);
  });

  it('built EN HTML contains the print button id', () => {
    const html = readFileSync(resolve(DIST, 'en/index.html'), 'utf8');
    expect(html).toMatch(/id="print-cv-btn"/);
  });

  it('built HTML localizes the print button label correctly', () => {
    const esHtml = readFileSync(resolve(DIST, 'index.html'), 'utf8');
    const enHtml = readFileSync(resolve(DIST, 'en/index.html'), 'utf8');
    // Spanish: "Imprimir CV"; English: "Print CV" — both from ui.{es,en}.json.
    expect(esHtml).toMatch(/Imprimir\s*CV/);
    expect(enHtml).toMatch(/Print\s*CV/);
  });
});

/**
 * Slice C WU-2: keyboard P shortcut. The engine in init.ts dispatches a
 * 'print-requested' CustomEvent on keydown('p'). PrintButton listens to
 * it. We verify the source contract here because the runtime dispatch
 * path is covered by integration tests in start-screen.test.ts.
 */
describe('Print requested event — Slice C WU-2 source contract', () => {
  const PRINT_BTN_PATH = resolve(PROJECT_ROOT, 'src/modules/game/interface/components/atoms/PrintButton.astro');
  const INIT_PATH = resolve(PROJECT_ROOT, 'src/modules/game/infrastructure/init.ts');

  it('PrintButton source listens for print-requested', () => {
    const src = readFileSync(PRINT_BTN_PATH, 'utf8');
    expect(src).toMatch(/addEventListener\(['"]print-requested['"]/);
  });

  it('init.ts source dispatches print-requested on keydown "p"', () => {
    const src = readFileSync(INIT_PATH, 'utf8');
    // The dispatch happens inside the onKeyDown handler.
    expect(src).toMatch(/'print-requested'/);
    expect(src).toMatch(/e\.key === ['"]p['"]/);
  });

  it('init.ts source respects e.repeat to avoid auto-repeat spam', () => {
    const src = readFileSync(INIT_PATH, 'utf8');
    // The guard must check e.repeat BEFORE dispatching.
    expect(src).toMatch(/e\.repeat/);
  });
});

/**
 * Slice C WU-3: gamepad Start button (buttons[9]) opens the Settings
 * modal. The engine dispatches 'gamepad-start' on edge-detect, and
 * SettingsPanel.astro listens for it.
 */
describe('Gamepad Start → Settings — Slice C WU-3 source contract', () => {
  const INIT_PATH = resolve(PROJECT_ROOT, 'src/modules/game/infrastructure/init.ts');
  const SETTINGS_PATH = resolve(PROJECT_ROOT, 'src/modules/game/interface/components/organisms/SettingsPanel.astro');

  it('init.ts source polls buttons[9] (Start) in pollGamepadOnce', () => {
    const src = readFileSync(INIT_PATH, 'utf8');
    // buttons[9] is Start in standard W3C gamepad mapping.
    expect(src).toMatch(/buttons\[9\]/);
  });

  it('init.ts source dispatches gamepad-start on edge-detect', () => {
    const src = readFileSync(INIT_PATH, 'utf8');
    expect(src).toMatch(/'gamepad-start'/);
    // Edge-detect must track previous state to avoid spam.
    expect(src).toMatch(/prevStartPressed/);
  });

  it('SettingsPanel source listens for gamepad-start and opens the modal', () => {
    const src = readFileSync(SETTINGS_PATH, 'utf8');
    expect(src).toMatch(/addEventListener\(['"]gamepad-start['"]/);
    expect(src).toMatch(/showModal\(\)/);
  });

  it('SettingsPanel source does not double-open the modal if already open', () => {
    const src = readFileSync(SETTINGS_PATH, 'utf8');
    // Guard: don't call showModal() if already open (it would throw or
    // be a no-op depending on the browser).
    expect(src).toMatch(/!settingsModal\.open/);
  });
});

/**
 * Slice C WU-4: D-pad navigation inside modals. The engine dispatches
 * per-direction CustomEvents; RetroModal listens and cycles focus
 * through the modal's focusables.
 */
describe('Gamepad D-pad navigation in modals — Slice C WU-4 source contract', () => {
  const INIT_PATH = resolve(PROJECT_ROOT, 'src/modules/game/infrastructure/init.ts');
  const MODAL_PATH = resolve(PROJECT_ROOT, 'src/modules/game/interface/components/atoms/RetroModal.astro');

  it('init.ts source tracks previous D-pad state for edge detection', () => {
    const src = readFileSync(INIT_PATH, 'utf8');
    // The per-direction dispatch only fires on released → press transition.
    expect(src).toMatch(/prevDpadState/);
  });

  it.each(['up', 'down', 'left', 'right'] as const)(
    'init.ts source dispatches gamepad-dpad-%s on edge transition',
    (dir) => {
      const src = readFileSync(INIT_PATH, 'utf8');
      expect(src).toMatch(new RegExp(`'gamepad-dpad-${dir}'`));
    },
  );

  it.each(['up', 'down', 'left', 'right'] as const)(
    'RetroModal source listens for gamepad-dpad-%s',
    (dir) => {
      const src = readFileSync(MODAL_PATH, 'utf8');
      // The modal cycles focus on any direction event.
      expect(src).toMatch(new RegExp(`addEventListener\\(['"]gamepad-dpad-${dir}['"]`));
    },
  );

  it('RetroModal source guards navigation behind modal.open check', () => {
    const src = readFileSync(MODAL_PATH, 'utf8');
    // The D-pad handler must check modal.open before touching focus,
    // otherwise it would intercept D-pad events meant for the game.
    expect(src).toMatch(/if\s*\(\s*!modal\.open\s*\)/);
  });
});

/**
 * Slice F — fix for click-camera-offset bug.
 *
 * Before the fix, pointerEventToCanvasTarget returned screen-space
 * coordinates (clientX - rect.left, clientY - rect.top), but the sampler
 * compared those against player.y in WORLD coordinates. When the camera
 * had scrolled (player.y > viewport.h / 2), clicking below the visible
 * player stored a Y value that was ABOVE player.y in world space, and
 * the sampler steered the player toward it — visually the player
 * "didn't progress" toward where you clicked.
 *
 * The fix lives in onPointerDown (init.ts): add camera.y to the
 * screen-space Y before storing it. pointerEventToCanvasTarget stays
 * pure (it has no access to camera) — the conversion happens in the
 * handler that owns the engine state.
 */
describe('Click→world coordinate fix — Slice F source contract', () => {
  const INIT_PATH = resolve(PROJECT_ROOT, 'src/modules/game/infrastructure/init.ts');

  it('init.ts onPointerDown adds camera.y to the screen-space Y', () => {
    const src = readFileSync(INIT_PATH, 'utf8');
    // The fix is a literal `screen.y + camera.y` in onPointerDown.
    // We anchor it to the handler by looking for the constant substring
    // adjacent to `state.mouseTarget =`.
    expect(src).toMatch(/screen\.y\s*\+\s*camera\.y/);
  });

  it('init.ts onPointerDown does NOT store pointerEventToCanvasTarget directly', () => {
    const src = readFileSync(INIT_PATH, 'utf8');
    // Regression guard: the old (buggy) line was
    //   state.mouseTarget = pointerEventToCanvasTarget(canvas, e);
    // The fix stores screen.x / screen.y separately and adds camera.y.
    // We assert the buggy literal is gone so future refactors don't
    // silently regress.
    expect(src).not.toMatch(/state\.mouseTarget\s*=\s*pointerEventToCanvasTarget/);
  });
});

/**
 * Slice D — StartScreen keyboard + gamepad navigation. Closes the
 * Brecha 5 from the inputs audit (no way to control the start screen
 * with anything other than a mouse click).
 *
 * We verify the static contract: the start screen source wires
 * keyboard arrow listeners, gamepad D-pad listeners, and gamepad A
 * activation. Runtime behavior is covered by integration tests in
 * start-screen.test.ts (which uses the engine mock).
 */
describe('StartScreen navigation — Slice D source contract', () => {
  const START_SCREEN_PATH = resolve(
    PROJECT_ROOT,
    'src/modules/game/interface/components/organisms/StartScreen.astro',
  );
  const RETRO_BTN_PATH = resolve(
    PROJECT_ROOT,
    'src/modules/game/interface/components/atoms/RetroButton.astro',
  );

  it('StartScreen source auto-focuses the first button on DOMContentLoaded', () => {
    const src = readFileSync(START_SCREEN_PATH, 'utf8');
    // The auto-focus should run inside DOMContentLoaded.
    expect(src).toMatch(/startGameBtn\.focus\(\)/);
  });

  it.each(['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'] as const)(
    'StartScreen source handles keyboard %s',
    (key) => {
      const src = readFileSync(START_SCREEN_PATH, 'utf8');
      expect(src).toMatch(new RegExp(`['"]${key}['"]`));
    },
  );

  it('StartScreen source wires moveFocus with wrap-around (modulo)', () => {
    const src = readFileSync(START_SCREEN_PATH, 'utf8');
    // The modulo + double-modulo idiom handles negative deltas correctly.
    expect(src).toMatch(/% total/);
  });

  it.each(['gamepad-dpad-up', 'gamepad-dpad-down', 'gamepad-dpad-left', 'gamepad-dpad-right'] as const)(
    'StartScreen source listens for gamepad D-pad %s',
    (event) => {
      const src = readFileSync(START_SCREEN_PATH, 'utf8');
      expect(src).toMatch(new RegExp(`addEventListener\\(['"]${event}['"]`));
    },
  );

  it('StartScreen source handles gamepad-a activation', () => {
    const src = readFileSync(START_SCREEN_PATH, 'utf8');
    expect(src).toMatch(/addEventListener\(['"]gamepad-a['"]/);
    // And calls click on the focused button.
    expect(src).toMatch(/active\.click\(\)/);
  });

  it('StartScreen source does NOT intercept navigation while a modal is open', () => {
    const src = readFileSync(START_SCREEN_PATH, 'utf8');
    // Modals have their own focus management (Slice C WU-4).
    expect(src).toMatch(/settingsModal\?\.open\s*\|\|\s*controlsModal\?\.open/);
  });

  it('RetroButton source has a visible :focus-visible style', () => {
    const src = readFileSync(RETRO_BTN_PATH, 'utf8');
    // Required so keyboard navigation is actually visible to the user.
    expect(src).toMatch(/:focus-visible/);
  });
});
