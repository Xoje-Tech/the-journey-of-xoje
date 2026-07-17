/**
 * tests/build-cv.test.ts
 *
 * Slice 3.1 contract for `scripts/build-cv-static.mjs`:
 *   1. The script MUST exist and be executable as `node scripts/build-cv-static.mjs`.
 *   2. After it runs, `src/content/cv.es.md` and `src/content/cv.en.md`
 *      MUST exist on disk.
 *   3. Both files MUST contain non-empty markdown that looks like a CV
 *      built from the static DATA snapshot in tests/fixtures/portfolio/.
 *      Shape-check: must contain a top-level heading (`# `) and at least
 *      three of the canonical CV sections (Experience / Skills / Education / About / Profile).
 *
 * Slice-1 note: this test was originally for `build-cv.mjs` which imported
 * from @personal-brand/{cv,kb,core}. Slice 3.1 removed that runtime
 * dependency in favor of a standalone script. The contract (script exists,
 * generates both locales, markdown is well-shaped) is preserved.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const PROJECT_ROOT = resolve(__dirname, '..');
const SCRIPT_PATH = resolve(PROJECT_ROOT, 'scripts/build-cv-static.mjs');
const ES_PATH = resolve(PROJECT_ROOT, 'src/content/cv.es.md');
const EN_PATH = resolve(PROJECT_ROOT, 'src/content/cv.en.md');

describe('build-cv-static.mjs — slice 3.1 contract', () => {
  beforeAll(() => {
    if (!existsSync(SCRIPT_PATH)) {
      throw new Error(`scripts/build-cv-static.mjs does not exist at ${SCRIPT_PATH}`);
    }
    const result = spawnSync('node', [SCRIPT_PATH], {
      cwd: PROJECT_ROOT,
      encoding: 'utf8',
      env: { ...process.env, PB_DATA_DIR: resolve(PROJECT_ROOT, 'tests/fixtures/portfolio') },
    });
    if (result.status !== 0) {
      throw new Error(
        `build-cv-static.mjs exited with status ${result.status}\nstdout: ${result.stdout}\nstderr: ${result.stderr}`,
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

  it('shape matches a CV (heading + ≥3 CV sections)', () => {
    const SECTION_HEADINGS = [
      'perfil',
      'profile',
      'sobre mí',
      'sobre mi',
      'about',
      'experiencia',
      'experience',
      'habilidades',
      'skills',
      'educación',
      'educacion',
      'education',
      'proyectos',
      'projects',
    ];
    for (const p of [ES_PATH, EN_PATH]) {
      const text = readFileSync(p, 'utf8').toLowerCase();
      expect(text, `${p} should start with a heading`).toMatch(/^#/m);
      const hits = SECTION_HEADINGS.filter((h) => text.includes(h));
      expect(
        hits.length,
        `${p} should have ≥3 known CV-section headings (got: ${hits.join(', ')})`,
      ).toBeGreaterThanOrEqual(3);
    }
  });
});
