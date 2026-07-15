#!/usr/bin/env node
/**
 * build-cv.mjs
 *
 * Slice 1 — materializes `src/content/cv.es.md` and `src/content/cv.en.md`
 * by invoking `@personal-brand/cv`'s `generateCv` orchestrator with the
 * `cv-product-eng` variant, once per locale.
 *
 * Data source: `~/.personal-brand/DATA/{profile,experience,skills,projects,education}.json`
 * (NOT in this repo — see AGENTS.md → "DATA location gotcha").
 *
 * NOTE on `loadKb` (F5.x):
 *   As of personal-brand@0.1, `loadKb()` accepts a `KbDataInput` object —
 *   not a directory path. We read the 5 JSON files ourselves and pass them
 *   in as parsed JSON. When F5.x ships `loadKb(directory)`, this script
 *   can shrink to a single call.
 *
 * Workflow per locale:
 *   1. Read & parse the 5 DATA JSONs into `{ profile, experience, skills, projects, education }`.
 *   2. `loadKb({ ... })` validates each section; partial-failure tolerance accepts
 *      the sections that parse cleanly. On the FIRST load, hard validation failures
 *      throw — we treat that as a build error.
 *   3. `getKb()` returns the typed KB.
 *   4. `generateCv({ variant: 'cv-product-eng' }, kb)` runs G01/G04/G05 guardrails
 *      and renders markdown.
 *   5. Write `src/content/cv.<locale>.md`.
 *
 * Slice-1 localization note:
 *   The `cv-product-eng` orchestrator emits **Spanish copy** for the CV body
 *   (it relies on the live DATA fields, which are Spanish in the user's
 *   ~/.personal-brand/DATA). The UI strings (Print, switch locale, etc.)
 *   live in `src/i18n/ui.{locale}.json` and are rendered by the Astro layouts
 *   and components — NOT by this script.
 *
 *   For slice 1, BOTH locales get the same canonical Spanish markdown from
 *   generateCv. G01/G04/G05 still validate the content (Spanish). The
 *   per-locale UI strings are what readers actually perceive as localized.
 *
 *   Slice 2 will introduce a post-processor that maps known Spanish headings
 *   ("Experiencia" → "Experience", "Habilidades" → "Skills", etc.) when
 *   G01/G04/G05 can be re-verified against the localized text. Until then,
 *   this is intentional and documented above.
 *
 * Logging: build scripts may use console.* per Astro convention; warnings
 * and errors are surfaced via console.error.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { generateCv } from '@personal-brand/cv';
import { loadKb, getKb } from '@personal-brand/kb';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');
const CONTENT_DIR = join(PROJECT_ROOT, 'src/content');

const LOCALES = /** @type {const} */ (['es', 'en']);
/** @typedef {typeof LOCALES[number]} Locale */

const DATA_DIR =
  process.env.PB_DATA_DIR ?? join(process.env.HOME ?? '', '.personal-brand', 'DATA');
const VARIANT = 'cv-product-eng';

const FILES = ['profile', 'experience', 'skills', 'projects', 'education'];
const EMPTY = {};

/** @returns {Promise<{profile: object, experience: object[], skills: object[], projects: object[], education: object[]}>} */
async function readKbBundle() {
  /** @type {Record<string, unknown>} */
  const out = {
    profile: undefined,
    experience: undefined,
    skills: undefined,
    projects: undefined,
    education: undefined,
  };
  for (const name of FILES) {
    const file = join(DATA_DIR, `${name}.json`);
    let raw;
    try {
      raw = await readFile(file, 'utf8');
    } catch (err) {
      console.error(`[build-cv] FATAL: cannot read ${file}: ${err.message}`);
      throw err;
    }
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      console.error(`[build-cv] FATAL: ${file} is not valid JSON: ${err.message}`);
      throw err;
    }
    // experience/skills/projects/education are arrays; profile is a singleton object.
    out[name] = name === 'profile' ? parsed ?? undefined : Array.isArray(parsed) ? parsed : [];
  }
  return {
    profile: /** @type {object} */ (out.profile ?? EMPTY),
    experience: /** @type {object[]} */ (out.experience ?? []),
    skills: /** @type {object[]} */ (out.skills ?? []),
    projects: /** @type {object[]} */ (out.projects ?? []),
    education: /** @type {object[]} */ (out.education ?? []),
  };
}

/** @returns {Promise<void>} */
async function main() {
  await mkdir(CONTENT_DIR, { recursive: true });

  console.log(`[build-cv] data source = ${DATA_DIR}`);
  const bundle = await readKbBundle();

  const loadResult = await loadKb(bundle);
  if (!loadResult.ok) {
    const err = /** @type {{ rule?: string, issues?: unknown }} */ (loadResult.error);
    const issues = err.issues ?? [];
    throw new Error(
      `loadKb failed: rule=${err.rule ?? 'unknown'} issues=${JSON.stringify(issues)}`,
    );
  }

  const kb = getKb();
  const cvData = {
    profile: kb.profile ?? EMPTY,
    experience: kb.experience,
    skills: kb.skills,
    projects: kb.projects,
    education: kb.education,
  };

  for (const locale of LOCALES) {
    const result = generateCv({ variant: VARIANT }, cvData);
    if (!result.ok) {
      const violations = result.error?.violations ?? [];
      throw new Error(
        `generateCv BLOCKER for locale "${locale}": ` +
          violations
            .map((/** @type {{ code: string | number, message: string }} */ v) => `${v.code}: ${v.message}`)
            .join('; '),
      );
    }
    const warnings = result.data?.warnings ?? [];
    if (warnings.length > 0) {
      console.error(
        `[build-cv] locale=${locale} generated with ${warnings.length} warning(s):`,
        warnings,
      );
    }
    const markdown = result.data?.markdown;
    if (typeof markdown !== 'string') {
      throw new Error(`generateCv returned ok:true but no markdown for locale ${locale}`);
    }
    const outPath = join(CONTENT_DIR, `cv.${locale}.md`);
    await writeFile(outPath, markdown, 'utf8');
    console.log(`[build-cv] wrote ${outPath} (${markdown.length.toLocaleString()} bytes)`);
  }

  console.log('[build-cv] done');
}

// Allow running directly OR being imported by tests.
const invokedDirectly =
  process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (invokedDirectly) {
  main().catch((err) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[build-cv] FATAL: ${msg}`);
    process.exitCode = 1;
  });
}

export { main, readKbBundle };
