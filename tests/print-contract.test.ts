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
