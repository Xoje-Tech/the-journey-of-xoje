#!/usr/bin/env node
/**
 * build-cv-static.mjs
 *
 * Slice 3.1 — standalone CV markdown builder for the-journey-of-xoje.
 *
 * Replaces the previous `build-cv.mjs` which imported from @personal-brand/{cv,kb,core}.
 * The portfolio's CI doesn't have the personal-brand sibling repo, so we
 * stopped importing those packages and replicated the markdown format here.
 *
 * Trade-off: the @personal-brand guardrails (G01/G04/G05) no longer run at
 * portfolio build time. The DATA at tests/fixtures/portfolio/ is a static
 * snapshot, hand-curated by the user — so the guardrails' job (prevent
 * invented content) is already satisfied by the curation process.
 * When the user updates DATA, the canonical path is:
 *   1. Edit ~/.personal-brand/DATA/*.json
 *   2. Run scripts/sync-personal-brand-data.mjs --preview
 *   3. Copy the diffed values into tests/fixtures/portfolio/ (manual gate)
 *   4. Commit
 * The guardrails (if needed) run on the personal-brand side, not here.
 *
 * Output: writes src/content/cv.es.md and src/content/cv.en.md.
 * Both files are identical structurally — UI strings come from
 * src/i18n/ui.{es,en}.json in the Astro layer, not from this script.
 *
 * Usage:
 *   PB_DATA_DIR=./tests/fixtures/portfolio node scripts/build-cv-static.mjs
 *
 * Exit codes:
 *   0 success
 *   1 generic failure
 *   2 validation failure (missing fields)
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');
const CONTENT_DIR = join(PROJECT_ROOT, 'src/content');
const I18N_DIR = join(PROJECT_ROOT, 'src/i18n');

const DATA_DIR =
  process.env.PB_DATA_DIR ??
  // Default: use the committed fixture so the script works in CI without
  // requiring an external DATA directory. Local devs can override by setting
  // PB_DATA_DIR=$HOME/.personal-brand/DATA.
  join(PROJECT_ROOT, 'tests', 'fixtures', 'portfolio');

const FILES = ['profile', 'experience', 'skills', 'projects', 'education'];

/**
 * @returns {Promise<{
 *   profile: any,
 *   experience: any[],
 *   skills: any[],
 *   projects: any[],
 *   education: any[]
 * }>}
 */
async function readKbBundle() {
  const out = {};
  for (const name of FILES) {
    const file = join(DATA_DIR, `${name}.json`);
    const raw = await readFile(file, 'utf8');
    const parsed = JSON.parse(raw);
    out[name] = name === 'profile' ? parsed : Array.isArray(parsed) ? parsed : [];
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────────────────────

function validateProfile(p) {
  const required = ['name', 'contact', 'headline', 'location'];
  for (const k of required) {
    if (!(k in p)) throw new Error(`profile.json missing required field: ${k}`);
  }
  if (!p.contact.email) throw new Error('profile.contact.email is required');
}

function validateExperience(arr) {
  if (!Array.isArray(arr)) throw new Error('experience.json must be an array');
  for (const [i, e] of arr.entries()) {
    for (const k of ['id', 'title', 'company', 'period']) {
      if (!(k in e)) throw new Error(`experience[${i}] missing required field: ${k}`);
    }
  }
}

function validateSkills(arr) {
  if (!Array.isArray(arr)) throw new Error('skills.json must be an array');
  for (const [i, s] of arr.entries()) {
    if (!('name' in s)) throw new Error(`skills[${i}] missing required field: name`);
  }
}

/**
 * Load the cv.labels dict from src/i18n/ui.{locale}.json. Returns a flat
 * record of label keys → translated strings. Falls back to the ES dict if
 * the requested locale has no cv section (defensive).
 *
 * @param {'es'|'en'} locale
 * @returns {Record<string, string>}
 */
async function loadCvLabels(locale) {
  const file = join(I18N_DIR, `ui.${locale}.json`);
  const raw = await readFile(file, 'utf8');
  const ui = JSON.parse(raw);
  return ui?.cv?.labels ?? {};
}

// ─────────────────────────────────────────────────────────────────────────────
// Markdown renderers (mirror the output format of the previous build-cv.mjs)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {any} profile
 * @param {Record<string,string>} L - cv.labels dict for the target locale
 */
function renderProfile(profile, L) {
  const c = profile.contact;
  const contact = [c.email, c.linkedin, c.github, c.phone].filter(Boolean).join(' · ');

  const lines = [`# ${profile.name}`, '', `_${profile.headline}_`, '', '---', ''];
  if (profile.location) lines.push(`- **${L.location}**: ${profile.location}`);
  if (profile.timezone) lines.push(`- **${L.timezone}**: ${profile.timezone}`);
  if (profile.languages) lines.push(`- **${L.languages}**: ${profile.languages}`);
  if (contact) lines.push(`- **${L.contact}**: ${contact}`);
  lines.push('');

  if (profile.availability) {
    const a = profile.availability;
    if (a.status) lines.push(`**${L.availability}**: ${a.status}`);
    if (a.type) lines.push(`**${L.workType}**: ${a.type}`);
    if (a.startDate) lines.push(`**${L.start}**: ${a.startDate}`);
    lines.push('');
  }

  lines.push(`## ${L.aboutMe}`, '');
  lines.push(
    [profile.headline, profile.availability?.status, profile.availability?.type]
      .filter(Boolean)
      .join('. ') + '.',
    '',
  );

  return lines.join('\n');
}

/**
 * @param {any[]} experience
 * @param {Record<string,string>} L - cv.labels dict for the target locale
 */
function renderExperience(experience, L) {
  const lines = [`## ${L.experience}`, ''];
  for (const e of experience) {
    lines.push(`### ${e.title} — ${e.company}`, '');
    const meta = [];
    if (e.period) meta.push(`**${L.period}**: ${e.period}`);
    if (e.type) meta.push(`**${L.type}**: ${e.type}`);
    if (e.industry) meta.push(`**${L.industry}**: ${e.industry}`);
    if (meta.length) {
      lines.push(meta.join(' · '));
    }
    if (e.team) lines.push(`**${L.team}**: ${e.team}`);
    if (Array.isArray(e.stack) && e.stack.length) {
      lines.push(`**${L.stack}**: ${e.stack.join(', ')}`);
    }
    lines.push('');

    if (Array.isArray(e.responsibilities) && e.responsibilities.length) {
      lines.push(`**${L.responsibilities}**:`);
      for (const r of e.responsibilities) lines.push(`- ${r}`);
      lines.push('');
    }
    if (e.results) {
      lines.push(`**${L.results}**:`);
      const results = Array.isArray(e.results) ? e.results : [e.results];
      for (const r of results) lines.push(`- ${r}`);
      lines.push('');
    }
    if (e.notes) {
      const notes = Array.isArray(e.notes) ? e.notes : [e.notes];
      for (const n of notes) {
        lines.push(`> _${L.notes}_: ${n}`);
      }
      lines.push('');
    }
  }
  return lines.join('\n');
}

/**
 * @param {any[]} skills
 * @param {Record<string,string>} L - cv.labels dict for the target locale
 */
function renderSkills(skills, L) {
  // Group by tag[0]: "technical" vs "qualitative"
  const technical = skills.filter((s) => Array.isArray(s.tags) && s.tags.includes('technical'));
  const qualitative = skills.filter((s) => Array.isArray(s.tags) && s.tags.includes('qualitative'));
  const other = skills.filter(
    (s) =>
      !Array.isArray(s.tags) || (!s.tags.includes('technical') && !s.tags.includes('qualitative')),
  );

  const lines = [`## ${L.skills}`, ''];

  if (technical.length) {
    lines.push(`### ${L.technologies}`, '');
    for (const s of technical) {
      const level = s.level ? ` _(${s.level})_` : '';
      const ev = Array.isArray(s.evidence) ? s.evidence.join(', ') : (s.evidence ?? '');
      lines.push(`- **${s.name}**${level}: ${ev}`);
    }
    lines.push('');
  }

  if (qualitative.length) {
    lines.push(`### ${L.competencies}`, '');
    for (const s of qualitative) {
      const level = s.level ? ` _(${s.level})_` : '';
      const ev = Array.isArray(s.evidence) ? s.evidence.join(', ') : (s.evidence ?? '');
      lines.push(`- **${s.name}**${level}: ${ev}`);
    }
    lines.push('');
  }

  if (other.length) {
    lines.push(`### ${L.other}`, '');
    for (const s of other) {
      const level = s.level ? ` _(${s.level})_` : '';
      const ev = Array.isArray(s.evidence) ? s.evidence.join(', ') : (s.evidence ?? '');
      lines.push(`- **${s.name}**${level}: ${ev}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * @param {any[]} education
 * @param {Record<string,string>} L - cv.labels dict for the target locale
 */
function renderEducation(education, L) {
  if (!Array.isArray(education) || education.length === 0) return '';
  const lines = [`## ${L.education}`, ''];
  for (const e of education) {
    const title = [e.degree, e.institution].filter(Boolean).join(' — ');
    if (title) lines.push(`### ${title}`, '');
    if (e.period) lines.push(`**${L.period}**: ${e.period}`);
    if (Array.isArray(e.tags) && e.tags.length) {
      lines.push(`**${L.tags}**: ${e.tags.join(', ')}`);
    }
    if (e.notes) lines.push(`> ${e.notes}`);
    lines.push('');
  }
  return lines.join('\n');
}

/**
 * @param {any[]} projects
 * @param {Record<string,string>} L - cv.labels dict for the target locale
 */
function renderProjects(projects, L) {
  if (!Array.isArray(projects) || projects.length === 0) return '';
  const lines = [`## ${L.projects}`, ''];
  for (const p of projects) {
    if (p.name) lines.push(`### ${p.name}`, '');
    if (p.description) lines.push(p.description, '');
    if (Array.isArray(p.stack) && p.stack.length) {
      lines.push(`**${L.stack}**: ${p.stack.join(', ')}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`[build-cv-static] data source = ${DATA_DIR}`);
  const bundle = await readKbBundle();

  // Validate the canonical ES bundle (always required)
  try {
    validateProfile(bundle.profile);
    validateExperience(bundle.experience);
    validateSkills(bundle.skills);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[build-cv-static] VALIDATION FAILED: ${msg}`);
    process.exit(2);
  }

  // Optional EN overlay. When present at tests/fixtures/portfolio/cv.en.json,
  // its fields override the ES bundle for the EN locale. This is the manual
  // translation path (option B): canonical translation lives in the JSON;
  // if the file is absent, EN falls back to ES (status quo).
  const enOverlayPath = join(DATA_DIR, 'cv.en.json');
  let enOverlay = null;
  try {
    const { readFile } = await import('node:fs/promises');
    const raw = await readFile(enOverlayPath, 'utf8');
    enOverlay = JSON.parse(raw);
    console.log(`[build-cv-static] EN overlay loaded (${enOverlayPath})`);
  } catch (err) {
    if (err && err.code !== 'ENOENT') {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[build-cv-static] EN overlay parse failed: ${msg}`);
      process.exit(2);
    }
    console.log('[build-cv-static] no EN overlay found — EN locale will fall back to ES content');
  }

  await mkdir(CONTENT_DIR, { recursive: true });
  for (const locale of ['es', 'en']) {
    // For EN, use overlay when present; otherwise pass-through (legacy behaviour)
    const bundleForLocale = locale === 'en' && enOverlay ? overlayBundle(bundle, enOverlay) : bundle;
    const labels = await loadCvLabels(locale);
    const sections = [
      renderProfile(bundleForLocale.profile, labels),
      renderExperience(bundleForLocale.experience, labels),
      renderSkills(bundleForLocale.skills, labels),
      renderEducation(bundleForLocale.education, labels),
      renderProjects(bundleForLocale.projects, labels),
    ].filter(Boolean);

    const markdown = sections.join('\n');
    const outPath = join(CONTENT_DIR, `cv.${locale}.md`);
    await writeFile(outPath, markdown, 'utf8');
    console.log(`[build-cv-static] wrote ${outPath} (${markdown.length.toLocaleString()} bytes)`);
  }

  console.log('[build-cv-static] done');
}

/**
 * Apply an EN overlay on top of the canonical ES bundle. The overlay contains
 * translated versions of profile, experience, skills, education. Arrays
 * (experience, skills, education) are matched by `id` or `name` against the
 * canonical entries; missing entries fall back to ES.
 *
 * @param {any} bundle - canonical ES bundle from {profile,experience,skills,education,projects}.json
 * @param {any} overlay - EN translation overlay from cv.en.json
 * @returns {any} merged bundle for EN rendering
 */
function overlayBundle(bundle, overlay) {
  const overlayByIdOrName = (arr, key = 'id') => {
    const map = new Map();
    for (const item of arr || []) map.set(item[key], item);
    return map;
  };

  const expMap = overlayByIdOrName(overlay.experience, 'id');
  const eduMap = overlayByIdOrName(overlay.education, 'degree');
  const skillMap = overlayByIdOrName(overlay.skills, 'name');

  return {
    profile: overlay.profile ?? bundle.profile,
    experience: (bundle.experience || []).map((e) => expMap.get(e.id) ?? e),
    skills: (bundle.skills || []).map((s) => skillMap.get(s.name) ?? s),
    education: (bundle.education || []).map((e) => eduMap.get(e.degree) ?? e),
    projects: bundle.projects, // no overlay for projects yet
  };
}

main().catch((err) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`[build-cv-static] FATAL: ${msg}`);
  process.exit(1);
});
