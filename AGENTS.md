# AGENTS.md

> Conventions and gotchas for AI agents (and humans) working on `the-journey-of-xoje`.
>
> **Read [`SPEC.md`](./SPEC.md) first.** This file is the operational companion: source-of-truth pointers, gotchas discovered in earlier sessions, and the rules an agent must follow.

---

## Source of truth — what wins when there's a conflict

1. **`SPEC.md`** — architectural contract. If you think it should change, propose a slice change in `dev-tracker`, do not edit the spec silently.
2. **`docs/visual-style.md`** — visual design and styling standards (colors, typography, sprite styles, retro buttons). Read this before writing any CSS or creating sprite assets.
3. **`~/.personal-brand/DATA/*.json`** — content truth for the CV. The agent MUST NOT invent content (G04). If a field is missing, leave it missing; ask the user.
4. **`package.json`** `scripts` and `astro.config.mjs` — runtime/build truth.
5. **`tests/*.test.ts`** — behavioral contract. If you change behavior, the tests should change with you.

When in doubt, the **SPEC + DATA** pair wins over any inline comment in the code.

---

## Astro 6 gotchas (discovered slice-1, 2026-07-14)

These bite you hard if you forget them. They are the difference between a 30-second fix and a 2-hour rabbit hole.

### 1. `glob` moved

```ts
// ❌ Astro 5
import { glob } from 'astro:content';

// ✅ Astro 6
import { glob } from 'astro/loaders';
```

### 2. `schema: {}` BREAKS Astro 6

A truthy `schema` triggers `safeParseAsync` and crashes for legacy markdown. **Omit the `schema` key entirely** instead of passing `{}`.

### 3. Glob slugifies `cv.es.md` → `cves`

The default slug drops the inner dot, breaking locale resolution. Workaround:

```ts
const cv = defineCollection({
  loader: glob({
    pattern: 'cv.*.md',
    base: 'src/content',
    generateId: ({ entry }) => entry,   // ← preserves 'cv.es.md' as-is
  }),
});
```

### 4. `entry.render()` is gone

```ts
// ❌ Astro 5
const { Content } = await entry.render();

// ✅ Astro 6
const { Content } = await render(entry);   // top-level import from 'astro:content'
```

### 5. CSS minifier quirks

Production builds collapse whitespace and shorten colors. `size: A4` may become `size:A4`; `#1155cc` may become `#15c`. The test regex must tolerate both:

```ts
expect(css).toMatch(/size\s*:\s*A4/);
expect(css).toMatch(/#1155cc|#15c/i);
```

### 6. Build sequencing

`pnpm prebuild` runs but Astro can cache sync state from a previous run. The reliable order is:

```json
"build": "pnpm build:cv && astro build"   // ← explicit sequential, NOT prebuild-only
```

---

## DATA flow

```
~/.personal-brand/DATA/*.json
        │
        │ readKbBundle() in scripts/build-cv.mjs
        ▼
@personal-brand/kb → loadKb() → getKb()
        │
        ▼
@personal-brand/cv → generateCv({ variant: 'cv-product-eng' }, cvData)
        │                  │ runs G01 / G04 / G05 guardrails
        ▼                  │
src/content/cv.{es,en}.md  │ BLOCKER on G04 (no invented metrics)
        │
        │ Astro content collection (glob loader)
        ▼
src/pages/[locale]/index.astro
        │
        ▼
dist/{es,en}/index.html
```

If the DATA changes, just re-run `pnpm dev` (or `pnpm build`). The `predev` / `build:cv` hook regenerates the markdown files automatically.

---

## Guardrails (do not bypass)

The orchestrator in `@personal-brand/cv` runs three guardrails over the generated CV:

| Guardrail | What it does | Agent consequence |
|---|---|---|
| **G01** | Voice consistency | Don't paraphrase the CV body in code; trust the orchestrator output |
| **G04** | No invented metrics | **BLOCKER.** Never invent experience entries, skills, dates, responsibilities. If the DATA is incomplete, leave it incomplete and surface the gap to the user |
| **G05** | Format compliance | Don't bypass with `skipGuardrails: true` unless the user explicitly approves it (and document why) |

**You are not allowed** to write `src/content/cv.*.md` by hand. They are generated artifacts.

---

## Commands cheat sheet

| Task | Command |
|---|---|
| Run dev server | `pnpm dev` (auto-runs `build:cv` first via `predev`) |
| Run dev server on alternate port | `pnpm dev --port 4322` |
| Build for production | `pnpm build` |
| Preview the production build | `pnpm preview` |
| Regenerate `cv.{es,en}.md` only | `pnpm build:cv` |
| Run all tests | `pnpm test` |
| Run tests in watch mode | `pnpm test:watch` |
| Typecheck | `pnpm typecheck` |
| Format | `pnpm format` |
| Headless print preview (PDFs) | `node scripts/print-preview-headless.mjs` (needs `pnpm dev` running) |

---

## Slice-1 deliverables (already done)

- ✅ `astro.config.mjs` — i18n config: `defaultLocale: 'es'`, `prefixDefaultLocale: true`
- ✅ `src/content.config.ts` — Astro 6 content collection with `glob` + `generateId` workaround
- ✅ `src/pages/[locale]/index.astro` — render API using top-level `render(entry)`
- ✅ `src/styles/print.css` — Harvard contract enforced by tests
- ✅ `src/styles/screen.css` — screen-only nav and base typography
- ✅ `src/components/CvDocument.astro`, `LocaleSwitch.astro`, `layouts/CvLayout.astro`
- ✅ `scripts/build-cv.mjs` — reads DATA, writes both CV markdowns
- ✅ `scripts/print-preview-headless.mjs` — chromium headless PDF generator
- ✅ `tests/print-contract.test.ts` — 7 regex assertions
- ✅ `tests/build-cv.test.ts` — script-run + shape check
- ✅ Manual validation: print preview in Chromium (2026-07-15, both locales)

---

## Slice-2 deliverables (in progress)

Closing the slice-1 debts before any deploy:

- [x] `README.md` — entry point for humans
- [x] `AGENTS.md` — this file
- [x] `.gitignore` — `node_modules`, `dist`, `.astro`, generated `cv.*.md`, `tmp/`
- [ ] DATA complete — load all 4 experience entries (RIDE ON, Twinny, Crmble, LCS Robotics) + qualitative/technical skills into `~/.personal-brand/DATA/`
- [ ] Re-run `build-cv.mjs` with full DATA and re-validate print preview
- [ ] Confirm `tests/build-cv.test.ts` still passes with the full DATA
- [ ] Clean up `/tmp/portfolio-cleanup-*` (24h TTL from 2026-07-14, should have expired)

Slice 3 (deploy) is **not** part of slice 2 — deploy is the last thing, after the user OK.

---

## Site name — resolved

**"The Journey of Xoje"** is the H1 of every page in every locale. Tagline is screen-only (hidden in print). Resolved 2026-07-15; see `SPEC.md` → "Resolved decisions". If you ever need to revisit this, change it in `src/i18n/ui.{es,en}.json` AND update `SPEC.md` so they stay aligned.

---

## Operational rules

- **No sudo.** If a command needs root, surface it and stop.
- **No auto-merge, no auto-push.** The user merges PRs and pushes. The agent validates locally.
- **No inline destructive git operations.** Multi-step git chains (rebase, merge, push) go into reusable scripts under `~/.hermes/credentials/` or skill assets, not inline.
- **No invented DATA.** If you don't know it, ask the user. See G04.
- **No Playwright.** Doctrine is lightweight. Use `chromium --headless` (see `scripts/print-preview-headless.mjs`).
- **No new dependencies without asking.** If a task seems to need one, surface the option and let the user decide.
- **English in code, comments, identifiers, UI copy, and docs.** Spanish is for the persona reply only. The README/AGENTS files are documentation artifacts, not chat — keep them in English.
- **Commits are conventional.** No `Co-Authored-By:`, no AI attribution.

---

## When you finish a task

Persist significant findings in the user's memory layer:

- **Architecture / decisions** → `mem_save` with `topic_key: portfolio/<topic>` (engram, project scope).
- **Cross-session continuity** → `mem_session_summary` before the session ends.
- **Reusable procedures** → save as a skill with `skill_manage`, not in memory.

If you discover a new gotcha not listed above, **patch this file** so the next agent doesn't lose the same hour you did.