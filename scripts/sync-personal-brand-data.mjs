#!/usr/bin/env node
/**
 * sync-personal-brand-data.mjs
 *
 * Slice-2 formalization: replaces the inline DATA sync done by hand in
 * 2026-07-15. Produces the same output deterministically:
 *
 *   1. Reads the canonical CV markdown
 *      (~/projects/pb-beta/OUTPUTS/cv/cv-product-eng/cv_product_eng_final_harvard.md)
 *      AND the structured source notes
 *      (~/projects/pb-beta/DATA/experience.md, skills.md, projects.md).
 *
 *   2. Compares against ~/.personal-brand/DATA/{experience,skills}.json current.
 *
 *   3. Generates drafts under <project>/tmp/draft-{experience,skills}.json.
 *      --preview (default): writes drafts, prints diff summary, exits 0.
 *      --apply: writes drafts AND moves them into ~/.personal-brand/DATA/
 *               after a verified backup (retention 3) and Zod validation.
 *      --check: reads current DATA, regenerates drafts in memory, exits non-zero
 *               if any drift from canonical source is detected. No writes.
 *      --rollback: restores the most recent .bak.N file for the given slot.
 *
 *   4. Re-runs the portfolio's build:cv and tests post-apply, then regenerates
 *      the print-preview PDFs (only with --print flag).
 *
 * Usage:
 *   node scripts/sync-personal-brand-data.mjs --preview                 # default: write drafts to tmp/, print diff
 *   node scripts/sync-personal-brand-data.mjs --preview --print         # + regenerate PDFs (after build:cv)
 *   node scripts/sync-personal-brand-data.mjs --check                   # CI/cron gate: exit 3 if DATA != source
 *   node scripts/sync-personal-brand-data.mjs --apply                   # DESTRUCTIVE — write drafts into DATA (with --force)
 *   node scripts/sync-personal-brand-data.mjs --apply --force          # skip the "are you sure?" prompt
 *   node scripts/sync-personal-brand-data.mjs --apply --print --force  # apply + tests + PDFs
 *   node scripts/sync-personal-brand-data.mjs --rollback experience      # restore experience.json from latest bak
 *
 * Decision policy (as of 2026-07-15, after slice-2 review):
 *   The pb-beta editorial source has more bullets than the curated DATA
 *   in ~/.personal-brand/DATA/. The DATA was hand-edited to drop multi-bullet
 *   results/notes into single lines. The script defaults to NON-DESTRUCTIVE:
 *   --preview writes drafts to tmp/ for human review, --apply requires --force.
 *   This way the curated DATA is preserved unless the user explicitly chooses
 *   to overwrite.
 *
 * Exit codes:
 *   0  success (preview produced / apply done / check clean / rollback done)
 *   1  generic failure
 *   2  validation failure (Zod or guardrail G04)
 *   3  drift detected (--check mode)
 *   4  user confirmation required (interactive prompt hit non-TTY)
 *
 * Source-of-truth pointers:
 *   - CV markdown (HTML-like) is the rendered truth.
 *   - experience.md / skills.md in pb-beta are the editorial source — they
 *     carry notes that don't go to outputs.
 *   - DATA/*.json is the runtime truth that personal-brand/cv reads.
 *
 * Guardrails (from personal-brand/cv):
 *   - G04 No-Invented-Metrics BLOCKER: NEVER invent experience content.
 *     If the canonical source is silent on a field, leave it as "Sin metrica
 *     cuantificable declarada..." (see RESULTS_PLACEHOLDER below).
 *
 * Idempotency:
 *   - --preview is fully read-only against ~/.personal-brand/DATA.
 *   - --apply: if drafts hash equals current DATA hash, exit 0 with "no-op".
 *   - --check: same diff as preview, but exits non-zero on any drift.
 *
 * Backups:
 *   - ~/.personal-brand/DATA/<file>.bak.YYYYMMDD-HHMMSS before each --apply.
 *   - Retention: keep the 3 most recent .bak.* per file. Older ones pruned.
 *
 * This script is the canonical way to refresh the portfolio's CV content
 * from the pb-beta editorial source. Do NOT do this by hand.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, unlinkSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve, join } from 'node:path';
import { homedir } from 'node:os';

// ─────────────────────────────────────────────────────────────────────────────
// Constants and source-of-truth pointers
// ─────────────────────────────────────────────────────────────────────────────

const HOME = homedir();
const PB_BETA = join(HOME, 'projects', 'pb-beta');
const PB_CANONICAL_CV = join(PB_BETA, 'OUTPUTS', 'cv', 'cv-product-eng', 'cv_product_eng_final_harvard.md');
const PB_EXPERIENCE_MD = join(PB_BETA, 'DATA', 'experience.md');
const PB_SKILLS_MD = join(PB_BETA, 'DATA', 'skills.md');

const DATA_DIR = process.env.PB_DATA_DIR ?? join(HOME, '.personal-brand', 'DATA');

const PROJECT_ROOT = resolve(import.meta.dirname ?? new URL('.', import.meta.url).pathname, '..');
const TMP_DIR = join(PROJECT_ROOT, 'tmp');
const DRAFT_EXPERIENCE = join(TMP_DIR, 'draft-experience.json');
const DRAFT_SKILLS = join(TMP_DIR, 'draft-skills.json');

const BACKUP_RETENTION = 3;

const RESULTS_PLACEHOLDER = 'Sin metrica cuantificable declarada por ahora.';

const ARG = parseArgs(process.argv.slice(2));
const MODE = ARG.apply ? 'apply' : ARG.check ? 'check' : ARG.rollback ? 'rollback' : 'preview';
const PRINT = Boolean(ARG.print);

// ─────────────────────────────────────────────────────────────────────────────
// Argument parsing
// ─────────────────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const out = {};
  for (const a of argv) {
    if (a === '--apply') out.apply = true;
    else if (a === '--preview') out.preview = true;
    else if (a === '--check') out.check = true;
    else if (a === '--print') out.print = true;
    else if (a === '--help' || a === '-h') out.help = true;
    else if (a.startsWith('--')) out[a.slice(2)] = true;
    else out._positional = a;
  }
  return out;
}

if (ARG.help) {
  console.log(readFileSync(new URL(import.meta.url), 'utf8').split('\n').slice(1).join('\n').split('Usage:')[0].split('// ─')[0].trim());
  console.log('\nUsage: see header comment of this script.');
  process.exit(0);
}

// ─────────────────────────────────────────────────────────────────────────────
// Source readers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Read canonical CV markdown. We DO NOT parse the HTML inside it;
 * we treat it as a smoke-check that the source exists and is non-empty.
 * The structured DATA comes from experience.md / skills.md below.
 */
function readCanonicalCv() {
  if (!existsSync(PB_CANONICAL_CV)) {
    throw new Error(`canonical CV not found at ${PB_CANONICAL_CV}`);
  }
  const text = readFileSync(PB_CANONICAL_CV, 'utf8');
  if (text.length < 1000) {
    throw new Error(`canonical CV too small (${text.length} chars) — looks corrupt`);
  }
  return text;
}

/**
 * Parse `experience.md` into structured entries.
 * Sections look like:
 *   ## RIDE ON Riders & Mechanics
 *   > tagline
 *   - **Periodo**: 2026-03 -> 2026-06
 *   - **Titulo**: ...
 *   - **Tipo**: full-time
 *   - **Industria**: ...
 *   - **Equipo**: ...
 *   - **Stack**: a, b, c
 *   ### Responsabilidades
 *   - item
 *   ### Resultados
 *   - item
 *   ### Notas internas
 *   - item
 */
function parseExperienceMd() {
  const text = readFileSync(PB_EXPERIENCE_MD, 'utf8');
  /** @type {any[]} */
  const entries = [];
  // Match each `## <company>` section.
  // Two-step approach (avoids the JS regex pitfall where `(?=^## |\Z)` fails
  // at end-of-input because lazy `*?` consumes everything before `\Z` can match):
  //   1. Find each `## <title>` header position.
  //   2. Slice the body from this header to the next one (or EOF).
  const headerRe = /^## (?!\#)([^\n]+)$/gm;
  const positions = [];
  let hm;
  while ((hm = headerRe.exec(text)) !== null) {
    positions.push({ title: hm[1].trim(), start: hm.index, bodyStart: headerRe.lastIndex });
  }
  for (let i = 0; i < positions.length; i++) {
    const cur = positions[i];
    const next = positions[i + 1];
    const bodyEnd = next ? next.start : text.length;
    const body = text.slice(cur.bodyStart, bodyEnd);
  const company = cur.title;
    // Skip template placeholders (TODO markers without real data).
    if (body.includes('TODO:')) continue;
    const fields = parseFields(body);
    // Skip sections without a period or title — those are non-data sections.
    if (!fields['Periodo'] || !fields['Titulo']) continue;

    // Stable short IDs aligned with the canonical naming in DATA/.
    // This makes the script idempotent — re-running produces the same IDs
    // and avoids drift in JSON.stringify output. If you add a new role in
    // pb-beta/DATA/experience.md, add an entry here.
    const SHORT_IDS = {
      'RIDE ON Riders & Mechanics': { startYear: '2026-03', suffix: 'ride-on' },
      'RIDE-ON Riders & Mechanics': { startYear: '2025-08', suffix: 'ride-on' },
      'Twinny':                      { startYear: '2024-05', suffix: 'twinny' },
      'Crmble':                      { startYear: '2023-03', suffix: 'crmble' },
      'LCS Robotics':                { startYear: '2022-06', suffix: 'lcs-robotics' },
    };
    const idMap = SHORT_IDS[company];
    const id = idMap
      ? `${idMap.suffix}-${idMap.startYear.slice(0, 4)}`
      : slugify(`${company}-${(fields['Periodo'] ?? '').split('->')[0]?.trim() ?? ''}`);
    const period = normalizePeriod(fields['Periodo'] ?? '');
    const responsibilities = parseBulletList(body, 'Responsabilidades');
    const results = parseBulletList(body, 'Resultados').join(' ').trim() || RESULTS_PLACEHOLDER;
    const notes = parseBulletList(body, 'Notas internas').join(' ').trim();

    entries.push({
      id,
      title: fields['Titulo'] ?? '',
      type: fields['Tipo'] ?? 'full-time',
      industry: fields['Industria'] ?? '',
      company,
      period,
      team: fields['Equipo'] ?? '',
      stack: splitStack(fields['Stack'] ?? ''),
      responsibilities,
      results,
      notes,
      tags: [],
    });
  }
  return entries;
}

/**
 * Parse `skills.md` into structured entries.
 * Recognized tables (3-column Markdown tables):
 *   | Habilidad | Nivel | Evidencia |
 * 2-column tables for qualitative skills:
 *   | Habilidad | Evidencia |
 *
 * Discriminator by `tags` field: technical vs qualitative.
 */
function parseSkillsMd() {
  const text = readFileSync(PB_SKILLS_MD, 'utf8');
  /** @type {any[]} */
  const out = [];
  // Step 1: find all `## <section>` headers and their byte ranges.
  // Step 2: walk tables and decide inclusion based on the section they live in.
  const headerRe = /^## ([^\n]+)$/gm;
  /** @type {{ title: string, start: number, end: number }[]} */
  const sections = [];
  let hm;
  while ((hm = headerRe.exec(text)) !== null) {
    const title = hm[1].trim();
    const start = hm.index;
    // End of this section = start of the next `## ` heading, or EOF.
    const nextHeaderRe = /^## /gm;
    nextHeaderRe.lastIndex = start + 3;
    const next = nextHeaderRe.exec(text);
    sections.push({ title, start, end: next ? next.index : text.length });
  }

  // Tables to skip: anything under a "discarded", "competence levels", or
  // "template schema" heading.
  const SKIP_HEADINGS = [
    'skills descartadas',
    'niveles de competencia',
    'estado del archivo',
    'instrucciones de edicion',
    'plantilla de schema',
  ];

  // Step 3: walk tables, find their containing section.
  const tableRe = /\|[^\n]+\|\n\|[-\s|]+\|\n((?:\|[^\n]+\|\n?)+)/g;
  let match;
  while ((match = tableRe.exec(text)) !== null) {
    const matchStart = match.index;
    const containingSection = sections.find((s) => matchStart >= s.start && matchStart < s.end);
    const sectionTitle = (containingSection?.title ?? '').toLowerCase();

    if (SKIP_HEADINGS.some((h) => sectionTitle.includes(h))) {
      continue;
    }

    const headerLine = match[0].split('\n')[0];
    const headers = headerLine.split('|').map((h) => h.trim().toLowerCase()).filter(Boolean);
    const is3col = headers.length >= 3;
    const rows = match[1].trim().split('\n');
    for (const row of rows) {
      const values = row.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      if (values.length < 2) continue;
      const name = values[0];
      const evidenceRaw = is3col ? values[2] : values[1];
      const level = is3col ? values[1] : undefined;
      if (!name || name === 'Habilidad' || name === 'Patrón / Concepto' || name === 'Herramienta / Concepto') continue;
      if (name.startsWith('TODO')) continue;

      // G08 guardrail: BLOCKER on missing evidence. Skills without any
      // evidence in this source MUST NOT make it into DATA.
      if (!evidenceRaw || evidenceRaw.trim() === '' || evidenceRaw === '—') {
        continue;
      }

      const tags = ['technical'];
      // Qualitative sections: "Product & Process", "Leadership & Mentorship",
      // "Architecture & Patterns". Detect by section title or by header pattern.
      const isQualitativeSection =
        sectionTitle.includes('product') ||
        sectionTitle.includes('process') ||
        sectionTitle.includes('leadership') ||
        sectionTitle.includes('mentorship') ||
        sectionTitle.includes('arquitectura') ||
        sectionTitle.includes('architecture') ||
        sectionTitle.includes('ai & llm') ||
        sectionTitle.includes('ai &') ||
        sectionTitle.includes('ai ') ||
        headers[0].includes('patrón') ||
        headers[0].includes('concepto') ||
        headers[0].includes('capacidad');
      if (isQualitativeSection) tags[0] = 'qualitative';

      const evidence = evidenceRaw.split(/,\s*/).map((s) => s.trim()).filter(Boolean);

      out.push({
        name,
        level: level && level !== '—' ? level.toLowerCase() : undefined,
        tags,
        evidence,
      });
    }
  }
  return out;
}

function parseFields(body) {
  const out = {};
  for (const line of body.split('\n')) {
    const m = line.match(/^-\s+\*\*([^*]+)\*\*:\s*(.*)$/);
    if (m) out[m[1].trim()] = m[2].trim();
  }
  return out;
}

function parseBulletList(body, header) {
  const lines = body.split('\n');
  const out = [];
  let inside = false;
  for (const line of lines) {
    if (line.startsWith(`### ${header}`)) {
      inside = true;
      continue;
    }
    if (inside && line.startsWith('### ')) {
      inside = false;
      continue;
    }
    if (inside && line.startsWith('- ')) {
      out.push(line.slice(2).trim());
    }
  }
  return out;
}

function splitStack(stackField) {
  return stackField
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function normalizePeriod(raw) {
  // pb-beta uses "2026-03 -> 2026-06". We keep that format.
  return raw.replace(/\s+/g, ' ').trim();
}

function slugify(s) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 64);
}

// ─────────────────────────────────────────────────────────────────────────────
// Diff + apply
// ─────────────────────────────────────────────────────────────────────────────

function readJson(path) {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeJson(path, value) {
  writeFileSync(path, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function hashOf(obj) {
  return createHash('sha256').update(JSON.stringify(obj)).digest('hex').slice(0, 12);
}

function diffSummary(a, b) {
  if (!a) return 'no current DATA';
  const aHash = hashOf(a);
  const bHash = hashOf(b);
  if (aHash === bHash) return 'identical';
  const aLen = Array.isArray(a) ? a.length : 1;
  const bLen = Array.isArray(b) ? b.length : 1;
  return `drift (current ${aLen} items → draft ${bLen} items, hash ${aHash} → ${bHash})`;
}

function backupFile(path) {
  if (!existsSync(path)) return null;
  const ts = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
  // Format: YYYYMMDD-HHMMSS
  const stamp = `${ts.slice(0, 8)}-${ts.slice(8)}`;
  const bak = `${path}.bak.${stamp}`;
  writeFileSync(bak, readFileSync(path, 'utf8'), 'utf8');
  pruneBackups(path);
  return bak;
}

function pruneBackups(path) {
  const dir = path.substring(0, path.lastIndexOf('/'));
  const base = path.substring(path.lastIndexOf('/') + 1);
  const prefix = `${base}.bak.`;
  const baks = readdirSync(dir)
    .filter((f) => f.startsWith(prefix))
    .map((f) => ({ f, t: statSync(join(dir, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t);
  for (const b of baks.slice(BACKUP_RETENTION)) {
    unlinkSync(join(dir, b.f));
  }
}

function listBackups(path) {
  const dir = path.substring(0, path.lastIndexOf('/'));
  const base = path.substring(path.lastIndexOf('/') + 1);
  const prefix = `${base}.bak.`;
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.startsWith(prefix))
    .map((f) => join(dir, f))
    .sort();
}

function rollback(slot) {
  const path = join(DATA_DIR, `${slot}.json`);
  const baks = listBackups(path);
  if (baks.length === 0) {
    console.error(`[sync] no backups found for ${path}`);
    return 1;
  }
  const latest = baks[baks.length - 1];
  console.log(`[sync] rolling back ${path} ← ${latest}`);
  writeFileSync(path, readFileSync(latest, 'utf8'), 'utf8');
  return 0;
}

function applyDraft(draftPath, targetPath, label) {
  if (!existsSync(draftPath)) {
    console.error(`[sync] FATAL: draft ${draftPath} missing`);
    return false;
  }
  const bak = backupFile(targetPath);
  if (bak) console.log(`[sync] ${label}: backup → ${bak}`);
  const draft = readJson(draftPath);
  if (!Array.isArray(draft)) {
    console.error(`[sync] FATAL: draft ${draftPath} is not an array`);
    return false;
  }
  writeJson(targetPath, draft);
  console.log(`[sync] ${label}: applied ${draft.length} entries → ${targetPath}`);
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Post-apply verification
// ─────────────────────────────────────────────────────────────────────────────

function runBuildCv() {
  console.log('[sync] running pnpm build:cv ...');
  const r = spawnSync('pnpm', ['build:cv'], { cwd: PROJECT_ROOT, encoding: 'utf8' });
  if (r.status !== 0) {
    console.error(`[sync] build:cv FAILED:\n${r.stdout}\n${r.stderr}`);
    return false;
  }
  console.log(r.stdout.trim());
  return true;
}

function runTests() {
  console.log('[sync] running pnpm test ...');
  const r = spawnSync('pnpm', ['test'], { cwd: PROJECT_ROOT, encoding: 'utf8' });
  if (r.status !== 0) {
    console.error(`[sync] test FAILED:\n${r.stdout}\n${r.stderr}`);
    return false;
  }
  console.log(r.stdout.trim().split('\n').slice(-6).join('\n'));
  return true;
}

function runPrintPreview() {
  console.log('[sync] running print-preview-headless.mjs ...');
  const r = spawnSync('node', ['scripts/print-preview-headless.mjs'], { cwd: PROJECT_ROOT, encoding: 'utf8' });
  if (r.status !== 0) {
    console.error(`[sync] print-preview FAILED:\n${r.stdout}\n${r.stderr}`);
    return false;
  }
  console.log(r.stdout.trim());
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Zod-lite shape validation (no dependency on @personal-brand/core to keep
// this script self-contained — we only enforce the schema we KNOW the
// portfolio's scripts/build-cv.mjs uses via loadKb).
// ─────────────────────────────────────────────────────────────────────────────

function validateExperience(arr) {
  if (!Array.isArray(arr)) return 'not an array';
  for (const [i, e] of arr.entries()) {
    for (const k of ['id', 'title', 'company', 'period', 'team', 'stack', 'responsibilities', 'results']) {
      if (!(k in e)) return `entry[${i}] missing "${k}"`;
    }
    if (!Array.isArray(e.stack)) return `entry[${i}].stack not array`;
    if (!Array.isArray(e.responsibilities)) return `entry[${i}].responsibilities not array`;
  }
  return null;
}

function validateSkills(arr) {
  if (!Array.isArray(arr)) return 'not an array';
  for (const [i, s] of arr.entries()) {
    if (!('name' in s)) return `entry[${i}] missing "name"`;
    if (!Array.isArray(s.tags)) return `entry[${i}].tags not array`;
    if (!('evidence' in s)) return `entry[${i}] missing "evidence"`;
    if (!Array.isArray(s.evidence) && typeof s.evidence !== 'string') {
      return `entry[${i}].evidence not array|string`;
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`[sync] mode=${MODE} print=${PRINT} data_dir=${DATA_DIR}`);

  if (MODE === 'rollback') {
    const slot = ARG._positional ?? 'experience';
    const code = rollback(slot);
    process.exit(code);
  }

  // 1. Sanity check sources exist.
  readCanonicalCv();
  if (!existsSync(PB_EXPERIENCE_MD)) {
    throw new Error(`experience.md not found at ${PB_EXPERIENCE_MD}`);
  }
  if (!existsSync(PB_SKILLS_MD)) {
    throw new Error(`skills.md not found at ${PB_SKILLS_MD}`);
  }

  // 2. Parse sources → drafts.
  const expDraft = parseExperienceMd();
  const skDraft = parseSkillsMd();

  // 3. Validate drafts against the schema we know works.
  const expErr = validateExperience(expDraft);
  if (expErr) {
    console.error(`[sync] VALIDATION FAILED (experience): ${expErr}`);
    process.exit(2);
  }
  const skErr = validateSkills(skDraft);
  if (skErr) {
    console.error(`[sync] VALIDATION FAILED (skills): ${skErr}`);
    process.exit(2);
  }

  // 4. Compare against current DATA.
  const expCurrent = readJson(join(DATA_DIR, 'experience.json'));
  const skCurrent = readJson(join(DATA_DIR, 'skills.json'));

  console.log(`[sync] experience: ${diffSummary(expCurrent, expDraft)}`);
  console.log(`[sync] skills:     ${diffSummary(skCurrent, skDraft)}`);

  const expDrift = !expCurrent || hashOf(expCurrent) !== hashOf(expDraft);
  const skDrift = !skCurrent || hashOf(skCurrent) !== hashOf(skDraft);

  if (MODE === 'check') {
    if (expDrift || skDrift) {
      console.error('[sync] CHECK FAILED: drift detected between canonical source and live DATA');
      process.exit(3);
    }
    console.log('[sync] CHECK OK: DATA matches canonical source');
    process.exit(0);
  }

  // 5. Write drafts (always — preview AND apply).
  mkdirSync(TMP_DIR, { recursive: true });
  writeJson(DRAFT_EXPERIENCE, expDraft);
  writeJson(DRAFT_SKILLS, skDraft);
  console.log(`[sync] drafts written:`);
  console.log(`  - ${DRAFT_EXPERIENCE}  (${expDraft.length} entries)`);
  console.log(`  - ${DRAFT_SKILLS}       (${skDraft.length} entries)`);

  if (MODE === 'preview') {
    console.log('[sync] preview done. Re-run with --apply to write to DATA.');
    process.exit(0);
  }

  // 6. Apply (DESTRUCTIVE — requires --force).
  if (!ARG.force) {
    console.error('[sync] REFUSING to apply without --force.');
    console.error('[sync] Reason: drafts may differ from current DATA in editorial choices');
    console.error('[sync] (multi-bullet results/notes, capitalization, etc.). Review first.');
    console.error('[sync] To accept the source-of-truth overwrite, re-run with --apply --force.');
    process.exit(4);
  }
  const expOk = expDrift ? applyDraft(DRAFT_EXPERIENCE, join(DATA_DIR, 'experience.json'), 'experience') : true;
  const skOk = skDrift ? applyDraft(DRAFT_SKILLS, join(DATA_DIR, 'skills.json'), 'skills') : true;
  if (!expOk || !skOk) {
    console.error('[sync] apply FAILED');
    process.exit(1);
  }

  // 7. Re-run portfolio's own build + tests.
  if (!runBuildCv()) process.exit(1);
  if (!runTests()) process.exit(1);

  // 8. Optionally regenerate the print PDFs.
  if (PRINT) {
    if (!runPrintPreview()) process.exit(1);
  } else {
    console.log('[sync] tip: re-run with --print to regenerate tmp/print-preview-*.pdf');
  }

  console.log('[sync] done');
}

main().catch((err) => {
  console.error(`[sync] FATAL: ${err.message}`);
  process.exit(1);
});