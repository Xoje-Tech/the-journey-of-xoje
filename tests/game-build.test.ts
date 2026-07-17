/**
 * tests/game-build.test.ts
 *
 * videogame-ui slice — Phase 3 build smoke + canvas + print-contract preservation.
 *
 * Contract:
 *   1. After `astro build`, both `dist/es/index.html` and `dist/en/index.html`
 *      MUST contain the literal substring `<canvas id="game-canvas"` (open tag
 *      with attributes — the closing `>` may have attributes stripped by Astro,
 *      but the open-tag id selector is invariant).
 *   2. The 7 slice-1 print-contract substrings (`@page`, `size: A4`, `1.6cm`,
 *      `no-print`, `page-break-inside`, `STIX Two Text`, `#1155cc`) MUST still
 *      be present somewhere in the emitted bundle — either in the inlined
 *      `<style>` of `dist/{es,en}/index.html` or in `dist/_astro/*.css`.
 *
 * Why a separate file (vs. reusing `tests/print-contract.test.ts`):
 *   - `print-contract.test.ts` is a pure regression test for slice 1; the
 *     doctrine "Keep `tests/print-contract.test.ts` passing without
 *     modification" requires the file to stay untouched.
 *   - This test owns the videogame-ui build assertions AND cross-checks the
 *     print contract (defence in depth — if print.css ever loses a rule,
 *     this test catches it even if `print-contract.test.ts` is bypassed).
 *
 * Build strategy:
 *   - This test depends on `pnpm build` having been run; a stale `dist/`
 *     will cause RED. To keep the test fast and avoid double-builds, it
 *     does NOT spawn `astro build` itself; instead `beforeAll` skips with
 *     a clear message if `dist/es/index.html` is missing.
 *   - The CI / verify phase is responsible for running `pnpm build` before
 *     this test. The local developer flow is `pnpm build && pnpm test`.
 *   - The full build is also exercised by `tests/print-contract.test.ts`,
 *     which runs `astro build` inside its own `beforeAll` — so the bundle
 *     is guaranteed fresh whenever the full vitest run happens.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';

const PROJECT_ROOT = resolve(__dirname, '..');
const DIST = resolve(PROJECT_ROOT, 'dist');
const ES_HTML = resolve(DIST, 'index.html');
const EN_HTML = resolve(DIST, 'en/index.html');

// Match `tests/print-contract.test.ts` exactly — keep these in sync if
// the slice-1 contract ever changes (and update both tests together).
const PRINT_CONTRACT_SUBSTRINGS: ReadonlyArray<readonly [string, RegExp]> = [
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
    const p = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(p);
    } else {
      yield p;
    }
  }
}

function readEmittedCssBundle(): string {
  // Concatenate every .css file AND every .html file — Astro inlines small
  // stylesheets into <style> in HTML; external sheets go to dist/_astro/*.css.
  // We need both because the contract is "the substring appears in the bundle",
  // not "the substring appears in a specific file".
  const parts: string[] = [];
  for (const p of walk(DIST)) {
    if (p.endsWith('.css') || p.endsWith('.html')) {
      parts.push(readFileSync(p, 'utf8'));
    }
  }
  return parts.join('\n\n');
}

describe('videogame-ui build contract', () => {
  beforeAll(() => {
    if (!existsSync(ES_HTML) || !existsSync(EN_HTML)) {
      // Fail loud with an actionable message — vitest will mark every test
      // in this describe block as failing the setup, which is the RED state
      // before `pnpm build` has been run.
      throw new Error(
        `game-build.test.ts requires \`pnpm build\` to have been run.\n` +
          `Missing: ${ES_HTML} or ${EN_HTML}\n` +
          `Run \`pnpm build\` first, then re-run \`pnpm test\`.`,
      );
    }
  });

  it('dist/es/index.html and dist/en/index.html exist after astro build', () => {
    expect(existsSync(ES_HTML), `missing ${ES_HTML}`).toBe(true);
    expect(existsSync(EN_HTML), `missing ${EN_HTML}`).toBe(true);
    // Sanity: files are non-empty.
    expect(statSync(ES_HTML).size).toBeGreaterThan(0);
    expect(statSync(EN_HTML).size).toBeGreaterThan(0);
  });

  it('dist/es/index.html contains the game-canvas open tag', () => {
    const html = readFileSync(ES_HTML, 'utf8');
    // The closing `>` may be followed by attributes; match the open-tag invariant.
    expect(html).toContain('<canvas id="game-canvas"');
  });

  it('dist/en/index.html contains the game-canvas open tag', () => {
    const html = readFileSync(EN_HTML, 'utf8');
    expect(html).toContain('<canvas id="game-canvas"');
  });

  it('dist/es/index.html does NOT use game-hud as a DOM element class (slice-2 polish)', () => {
    // The HUD is rendered via ctx.fillText in src/game/init.ts → drawHud;
    // no DOM element with class `game-hud` is ever created. We assert
    // against the HTML class-attribute surface (not the CSS selector) so
    // the pre-planned print.css suppression selector (slice 1) is allowed
    // to remain — its presence is dead CSS, not a HUD leak. If a future
    // change introduces a DOM-based HUD with that class, this test fires.
    const html = readFileSync(ES_HTML, 'utf8');
    expect(html).not.toMatch(/class="[^"]*\bgame-hud\b[^"]*"/);
  });

  it('dist/en/index.html does NOT use game-hud as a DOM element class (slice-2 polish)', () => {
    const html = readFileSync(EN_HTML, 'utf8');
    expect(html).not.toMatch(/class="[^"]*\bgame-hud\b[^"]*"/);
  });

  it.each(PRINT_CONTRACT_SUBSTRINGS)(
    'slice-1 print contract substring still present in emitted bundle: %s',
    (_label, needle) => {
      const haystack = readEmittedCssBundle();
      expect(
        needle.test(haystack),
        `expected emitted bundle to match /${needle.source}/ — print.css may have lost a rule`,
      ).toBe(true);
    },
  );
});