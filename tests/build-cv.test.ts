/**
 * tests/build-cv.test.ts
 *
 * Slice 1 contract for `scripts/build-cv.mjs`:
 *   1. The script MUST exist and be executable as `node scripts/build-cv.mjs`.
 *   2. After it runs, `src/content/cv.es.md` and `src/content/cv.en.md`
 *      MUST exist on disk.
 *   3. Both files MUST contain non-empty markdown that looks like a CV
 *      generated via @personal-brand/cv's `cv-product-eng` variant.
 *      Shape-check: must contain a top-level heading (`# `) and at least
 *      three of the canonical CV sections (Experience / Skills / Education / About / Profile).
 *
 * RED phase: this test must FAIL if scripts/build-cv.mjs has not yet been
 * implemented (because src/content/cv.*.md won't exist).
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const PROJECT_ROOT = resolve(__dirname, '..');
const SCRIPT_PATH = resolve(PROJECT_ROOT, 'scripts/build-cv.mjs');
const ES_PATH = resolve(PROJECT_ROOT, 'src/content/cv.es.md');
const EN_PATH = resolve(PROJECT_ROOT, 'src/content/cv.en.md');

describe('build-cv.mjs — slice 1 contract', () => {
  beforeAll(() => {
    // If the script hasn't been written yet, the test will fail at the
    // `existsSync` checks below — that's the RED signal.
    if (!existsSync(SCRIPT_PATH)) {
      throw new Error(`scripts/build-cv.mjs does not exist at ${SCRIPT_PATH}`);
    }
    // Run the script synchronously. It writes both files.
    // We import and call the exported main() if available; otherwise
    // we just shell out.
    // For the RED→GREEN flow, the script defines a `main()` we can call.
    const { spawnSync } = require('node:child_process');
    const result = spawnSync('node', [SCRIPT_PATH], { cwd: PROJECT_ROOT, encoding: 'utf8' });
    if (result.status !== 0) {
      throw new Error(
        `build-cv.mjs exited with status ${result.status}\nstdout: ${result.stdout}\nstderr: ${result.stderr}`,
      );
    }
  }, 60_000);

  it('writes src/content/cv.es.md and src/content/cv.en.md', () => {
    expect(existsSync(ES_PATH), `expected ${ES_PATH} to exist`).toBe(true);
    expect(existsSync(EN_PATH), `expected ${EN_PATH} to exist`).toBe(true);
  });

  it('both files are non-empty markdown', () => {
    for (const p of [ES_PATH, EN_PATH]) {
      const stat = statSync(p);
      expect(stat.size, `${p} should be non-empty`).toBeGreaterThan(0);
      const text = readFileSync(p, 'utf8');
      expect(text.length, `${p} content should be > 100 chars`).toBeGreaterThan(100);
    }
  });

  it('shape matches the cv-product-eng variant (heading + ≥3 CV sections)', () => {
    const SECTION_HEADINGS = [
      'perfil', 'profile',
      'sobre mí', 'about',
      'experiencia', 'experience',
      'habilidades', 'skills',
      'educación', 'education',
      'proyectos', 'projects',
    ];
    for (const p of [ES_PATH, EN_PATH]) {
      const text = readFileSync(p, 'utf8').toLowerCase();
      expect(text, `${p} should start with a heading`).toMatch(/^#/m);
      const hits = SECTION_HEADINGS.filter((h) => text.includes(h));
      expect(hits.length, `${p} should have ≥3 known CV-section headings (got: ${hits.join(', ')})`).toBeGreaterThanOrEqual(3);
    }
  });
});
