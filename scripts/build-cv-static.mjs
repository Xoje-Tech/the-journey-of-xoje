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

// ─────────────────────────────────────────────────────────────────────────────
// Markdown renderers (mirror the output format of the previous build-cv.mjs)
// ─────────────────────────────────────────────────────────────────────────────

/** @param {any} profile */
function renderProfile(profile) {
  const c = profile.contact;
  const contact = [
    c.email,
    c.linkedin,
    c.github,
    c.phone,
  ]
    .filter(Boolean)
    .join(' · ');

  const lines = [
    `# ${profile.name}`,
    '',
    `_${profile.headline}_`,
    '',
    '---',
    '',
  ];
  if (profile.location) lines.push(`- **Ubicación**: ${profile.location}`);
  if (profile.timezone) lines.push(`- **Zona horaria**: ${profile.timezone}`);
  if (profile.languages) lines.push(`- **Idiomas**: ${profile.languages}`);
  if (contact) lines.push(`- **Contacto**: ${contact}`);
  lines.push('');

  if (profile.availability) {
    const a = profile.availability;
    if (a.status) lines.push(`**Disponibilidad**: ${a.status}`);
    if (a.type) lines.push(`**Tipo de trabajo**: ${a.type}`);
    if (a.startDate) lines.push(`**Inicio**: ${a.startDate}`);
    lines.push('');
  }

  // "Sobre mi" — short summary
  lines.push('## Sobre mi', '');
  lines.push(
    [
      profile.headline,
      profile.availability?.status,
      profile.availability?.type,
    ]
      .filter(Boolean)
      .join('. ') + '.',
    '',
  );

  return lines.join('\n');
}

/** @param {any[]} experience */
function renderExperience(experience) {
  const lines = ['## Experiencia', ''];
  for (const e of experience) {
    lines.push(`### ${e.title} — ${e.company}`, '');
    const meta = [];
    if (e.period) meta.push(`**Periodo**: ${e.period}`);
    if (e.type) meta.push(`**Tipo**: ${e.type}`);
    if (e.industry) meta.push(`**Industria**: ${e.industry}`);
    if (meta.length) {
      lines.push(meta.join(' · '));
    }
    if (e.team) lines.push(`**Equipo**: ${e.team}`);
    if (Array.isArray(e.stack) && e.stack.length) {
      lines.push(`**Stack**: ${e.stack.join(', ')}`);
    }
    lines.push('');

    if (Array.isArray(e.responsibilities) && e.responsibilities.length) {
      lines.push('**Responsabilidades**:');
      for (const r of e.responsibilities) lines.push(`- ${r}`);
      lines.push('');
    }
    if (e.results) {
      lines.push('**Resultados**:');
      const results = Array.isArray(e.results) ? e.results : [e.results];
      for (const r of results) lines.push(`- ${r}`);
      lines.push('');
    }
    if (e.notes) {
      const notes = Array.isArray(e.notes) ? e.notes : [e.notes];
      for (const n of notes) {
        lines.push(`> _Notas_: ${n}`);
      }
      lines.push('');
    }
  }
  return lines.join('\n');
}

/** @param {any[]} skills */
function renderSkills(skills) {
  // Group by tag[0]: "technical" vs "qualitative"
  const technical = skills.filter((s) => Array.isArray(s.tags) && s.tags.includes('technical'));
  const qualitative = skills.filter((s) => Array.isArray(s.tags) && s.tags.includes('qualitative'));
  const other = skills.filter(
    (s) => !Array.isArray(s.tags) || (!s.tags.includes('technical') && !s.tags.includes('qualitative')),
  );

  const lines = ['## Habilidades', ''];

  if (technical.length) {
    lines.push('### Tecnologias', '');
    for (const s of technical) {
      const level = s.level ? ` _(${s.level})_` : '';
      const ev = Array.isArray(s.evidence) ? s.evidence.join(', ') : s.evidence ?? '';
      lines.push(`- **${s.name}**${level}: ${ev}`);
    }
    lines.push('');
  }

  if (qualitative.length) {
    lines.push('### Competencias', '');
    for (const s of qualitative) {
      const level = s.level ? ` _(${s.level})_` : '';
      const ev = Array.isArray(s.evidence) ? s.evidence.join(', ') : s.evidence ?? '';
      lines.push(`- **${s.name}**${level}: ${ev}`);
    }
    lines.push('');
  }

  if (other.length) {
    lines.push('### Otros', '');
    for (const s of other) {
      const level = s.level ? ` _(${s.level})_` : '';
      const ev = Array.isArray(s.evidence) ? s.evidence.join(', ') : s.evidence ?? '';
      lines.push(`- **${s.name}**${level}: ${ev}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/** @param {any[]} education */
function renderEducation(education) {
  if (!Array.isArray(education) || education.length === 0) return '';
  const lines = ['## Educacion', ''];
  for (const e of education) {
    const title = [e.degree, e.institution].filter(Boolean).join(' — ');
    if (title) lines.push(`### ${title}`, '');
    if (e.period) lines.push(`**Periodo**: ${e.period}`);
    if (Array.isArray(e.tags) && e.tags.length) {
      lines.push(`**Tags**: ${e.tags.join(', ')}`);
    }
    if (e.notes) lines.push(`> ${e.notes}`);
    lines.push('');
  }
  return lines.join('\n');
}

/** @param {any[]} projects */
function renderProjects(projects) {
  if (!Array.isArray(projects) || projects.length === 0) return '';
  const lines = ['## Proyectos', ''];
  for (const p of projects) {
    if (p.name) lines.push(`### ${p.name}`, '');
    if (p.description) lines.push(p.description, '');
    if (Array.isArray(p.stack) && p.stack.length) {
      lines.push(`**Stack**: ${p.stack.join(', ')}`);
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

  // Validate
  try {
    validateProfile(bundle.profile);
    validateExperience(bundle.experience);
    validateSkills(bundle.skills);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[build-cv-static] VALIDATION FAILED: ${msg}`);
    process.exit(2);
  }

  // Render (identical for es/en — UI strings live in src/i18n/ui.{es,en}.json)
  const sections = [
    renderProfile(bundle.profile),
    renderExperience(bundle.experience),
    renderSkills(bundle.skills),
    renderEducation(bundle.education),
    renderProjects(bundle.projects),
  ].filter(Boolean);

  const markdown = sections.join('\n');

  await mkdir(CONTENT_DIR, { recursive: true });
  for (const locale of ['es', 'en']) {
    const outPath = join(CONTENT_DIR, `cv.${locale}.md`);
    await writeFile(outPath, markdown, 'utf8');
    console.log(`[build-cv-static] wrote ${outPath} (${markdown.length.toLocaleString()} bytes)`);
  }

  console.log('[build-cv-static] done');
}

main().catch((err) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`[build-cv-static] FATAL: ${msg}`);
  process.exit(1);
});