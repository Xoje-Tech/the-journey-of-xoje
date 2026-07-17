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

/**
 * EN translation contract (slice "CV body EN", 2026-07-17):
 *   1. cv.es.md and cv.en.md MUST NOT be byte-identical (different content per locale).
 *   2. The EN file MUST contain at least 3 known English-language fragments
 *      (regression: if the EN overlay is missing, both files collapse to ES content).
 *   3. The ES file MUST still be primarily Spanish (regression: EN overlay
 *      bleeding into ES bundle).
 */
describe('CV body EN translation — option B overlay', () => {
  it('cv.es.md and cv.en.md differ (different content per locale)', () => {
    const es = readFileSync(ES_PATH, 'utf8');
    const en = readFileSync(EN_PATH, 'utf8');
    expect(es).not.toBe(en);
  });

  it('cv.en.md contains expected English-language fragments from the canonical translation', () => {
    const en = readFileSync(EN_PATH, 'utf8');
    const expectedFragments = [
      'Software Developer with AI Focus',     // title (EN)
      'Full Stack Developer',                  // title (EN)
      'Front-end Developer',                   // Twinny title (EN)
      'Multiplatform Application Development', // education (EN)
      'Native Spanish, professional English',  // languages (EN)
    ];
    const hits = expectedFragments.filter((f) => en.includes(f));
    expect(
      hits.length,
      `expected ≥3 EN fragments in cv.en.md, got: ${hits.join(', ')} (overlay may be missing)`,
    ).toBeGreaterThanOrEqual(3);
  });

  it('cv.es.md stays primarily Spanish (EN fragments do not bleed into ES)', () => {
    const es = readFileSync(ES_PATH, 'utf8');
    // At least one strong ES-only string should remain in ES file
    const esMarkers = [
      'Desarrollador de Software con enfoque en IA',
      'Desarrollo de aplicaciones multiplataforma',
    ];
    const hits = esMarkers.filter((m) => es.includes(m));
    expect(
      hits.length,
      `expected ES file to retain Spanish markers, got: ${hits.join(', ')}`,
    ).toBeGreaterThanOrEqual(1);
  });
});

/**
 * Labels i18n contract: the render labels in cv.{es,en}.md MUST come from
 * src/i18n/ui.{locale}.json (not hardcoded in build-cv-static.mjs). This
 * regression was discovered when reviewing PR #22 in production — labels
 * like "Ubicación", "Zona horaria", "Idiomas", "Periodo", "Tipo", etc.
 * were Spanish-only even on the EN locale.
 */
describe('CV labels i18n — locale-aware render', () => {
  it('cv.es.md uses Spanish labels from ui.es.json', () => {
    const es = readFileSync(ES_PATH, 'utf8');
    // A representative subset of labels that MUST appear in ES rendering
    const esLabels = ['Ubicación', 'Idiomas', 'Sobre mi', 'Experiencia', 'Responsabilidades'];
    const hits = esLabels.filter((l) => es.includes(l));
    expect(hits.length, `ES labels missing in cv.es.md: ${esLabels.join(', ')}`).toBe(esLabels.length);
  });

  it('cv.en.md uses English labels from ui.en.json (no Spanish leakage)', () => {
    const en = readFileSync(EN_PATH, 'utf8');
    // These MUST appear (English labels)
    const enLabels = [
      'Location', 'Languages', 'About me', 'Experience', 'Responsibilities',
      'Technologies', 'Competencies', 'Education', 'Availability',
    ];
    const enHits = enLabels.filter((l) => en.includes(l));
    expect(
      enHits.length,
      `EN labels missing in cv.en.md: ${enLabels.filter((l) => !en.includes(l)).join(', ')}`,
    ).toBe(enLabels.length);

    // These MUST NOT appear (Spanish-only labels leaking into EN)
    const esOnlyLabels = ['Ubicación', 'Zona horaria', 'Idiomas', 'Sobre mi', 'Responsabilidades'];
    const leaks = esOnlyLabels.filter((l) => en.includes(l));
    expect(leaks.length, `Spanish labels leaked into cv.en.md: ${leaks.join(', ')}`).toBe(0);
  });

  it('ui.es.json and ui.en.json both define the cv.labels section (parity)', () => {
    const uiEs = JSON.parse(readFileSync(resolve(PROJECT_ROOT, 'src/i18n/ui.es.json'), 'utf8'));
    const uiEn = JSON.parse(readFileSync(resolve(PROJECT_ROOT, 'src/i18n/ui.en.json'), 'utf8'));
    expect(uiEs.cv?.labels, 'ui.es.json missing cv.labels').toBeDefined();
    expect(uiEn.cv?.labels, 'ui.en.json missing cv.labels').toBeDefined();
    const keysEs = Object.keys(uiEs.cv.labels).sort();
    const keysEn = Object.keys(uiEn.cv.labels).sort();
    expect(keysEn, `label keys mismatch between ui.es.json (${keysEs.join(',')}) and ui.en.json (${keysEn.join(',')})`).toEqual(keysEs);
  });
});
