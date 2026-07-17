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
    generateId: ({ entry }) => entry, // ← preserves 'cv.es.md' as-is
  }),
});
```

### 4. `entry.render()` is gone

```ts
// ❌ Astro 5
const { Content } = await entry.render();

// ✅ Astro 6
const { Content } = await render(entry); // top-level import from 'astro:content'
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
dist/index.html         (ES, default locale, no prefix)
dist/en/index.html      (EN, locale-prefixed)
```

### i18n routing — `prefixDefaultLocale: false`

`astro.config.mjs` ships with `routing.prefixDefaultLocale: false` (changed from the
original `true` in PR #17, merged 2026-07-16, commit `d3a31a9`).

Consequences that surprised us and may surprise the next agent:

- `/` resolves to the **ES** version (default locale, served bare from the root).
- `/en/` resolves to the **EN** version (locale-prefixed).
- `dist/` ends up with `index.html` + `en/index.html`, **not** `es/index.html` + `en/index.html`.
- A grep for `dist/es/index.html` will fail; use `dist/index.html` for ES instead.
- The `src/pages/[locale]/index.astro` dynamic route still owns both — `prefixDefaultLocale: false` does not break dynamic routing, it only skips the prefix in the URL for the default locale.

If you ever need to flip it back to `true` (e.g. to comply with a future spec change),
expect a ripple effect across `src/pages/index.astro` (currently a thin redirect) and
the base-path logic in `astro.config.mjs` — both encode the "ES lives at `/`" assumption.

If the DATA changes, just re-run `pnpm dev` (or `pnpm build`). The `predev` / `build:cv` hook regenerates the markdown files automatically.

---

## Guardrails (do not bypass)

The orchestrator in `@personal-brand/cv` runs three guardrails over the generated CV:

| Guardrail | What it does        | Agent consequence                                                                                                                                             |
| --------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **G01**   | Voice consistency   | Don't paraphrase the CV body in code; trust the orchestrator output                                                                                           |
| **G04**   | No invented metrics | **BLOCKER.** Never invent experience entries, skills, dates, responsibilities. If the DATA is incomplete, leave it incomplete and surface the gap to the user |
| **G05**   | Format compliance   | Don't bypass with `skipGuardrails: true` unless the user explicitly approves it (and document why)                                                            |

**You are not allowed** to write `src/content/cv.*.md` by hand. They are generated artifacts.

---

## Commands cheat sheet

| Task                             | Command                                                              |
| -------------------------------- | -------------------------------------------------------------------- |
| Run dev server                   | `pnpm dev` (auto-runs `build:cv` first via `predev`)                 |
| Run dev server on alternate port | `pnpm dev --port 4322`                                               |
| Build for production             | `pnpm build`                                                         |
| Preview the production build     | `pnpm preview`                                                       |
| Regenerate `cv.{es,en}.md` only  | `pnpm build:cv`                                                      |
| Run all tests                    | `pnpm test`                                                          |
| Run tests in watch mode          | `pnpm test:watch`                                                    |
| Typecheck                        | `pnpm typecheck`                                                     |
| Format                           | `pnpm format`                                                        |
| Headless print preview (PDFs)    | `node scripts/print-preview-headless.mjs` (needs `pnpm dev` running) |

---

## Slice-1 deliverables (already done)

- ✅ `astro.config.mjs` — i18n config: `defaultLocale: 'es'`, `prefixDefaultLocale: false` (PR #17 flipped this from `true`; see "i18n routing" below)
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

## Slice-2 deliverables (closed)

Quality/debt closure before deploy:

- [x] `README.md` — entry point for humans
- [x] `AGENTS.md` — this file
- [x] `.gitignore` — `node_modules`, `dist`, `.astro`, generated `cv.*.md`, `tmp/`
- [x] DATA complete — all 4 experience entries (RIDE ON 2026 + 2025, Twinny, Crmble, LCS Robotics) + 28 skills in `~/.personal-brand/DATA/`
- [x] `build-cv.mjs` re-run with full DATA, print preview re-validated
- [x] `tests/build-cv.test.ts` still passes with full DATA (110/110 green as of 2026-07-17)
- [x] `/tmp/portfolio-cleanup-*` expired (24h TTL passed)
- [x] Atomic Design refactor (PR #10)
- [x] Code-review fixes: `as any` removed, i18n JSON centralised, SkillCard + NesController extracted as atoms (commit `bb01ad4`)
- [x] i18n routing fix (PR #17) — flipped to `prefixDefaultLocale: false`

## Slice-3 — Deploy (closed)

- [x] `astro build` exit 0, `dist/index.html` + `dist/en/index.html`
- [x] GitHub Pages deploy via `.github/workflows/`
- [x] Custom 404 + BASE_PATH handling resolved (PR #12 + i18n fix PR #17)
- [x] Live at https://xoje-tech.github.io/the-journey-of-xoje/

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

## OpenWiki

This repository has documentation located in the `openwiki/` directory.

Start here:
- [OpenWiki Quickstart](openwiki/quickstart.md)

OpenWiki includes repository overview, architecture notes, workflows, domain concepts, operations, integrations, testing guidance, and source maps.

When working in this repository, read the OpenWiki quickstart first, then follow its links to the relevant architecture, workflow, domain, operation, and testing notes.

---

## When you finish a task

Persist significant findings in the user's memory layer:

- **Architecture / decisions** → `mem_save` with `topic_key: portfolio/<topic>` (engram, project scope).
- **Cross-session continuity** → `mem_session_summary` before the session ends.
- **Reusable procedures** → save as a skill with `skill_manage`, not in memory.

If you discover a new gotcha not listed above, **patch this file** so the next agent doesn't lose the same hour you did.
