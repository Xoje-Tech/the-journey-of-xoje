# The Journey of Xoje

> Static portfolio whose **print output IS** the Harvard-style CV produced by [`@personal-brand/cv`](https://github.com/Xoje-Tech/personal-brand).
>
> Slice 1: validated 2026-07-15. Print preview OK in Chromium (A4, STIX Two Text, Harvard margins).
>
> Status: **slice 2 in progress** — closing slice-1 debts (docs, DATA, tests) before any deploy.

---

## What is this?

A KISS, zero-runtime, zero-backend portfolio website. The screen is a thin wrapper around the CV; the print output is the actual CV.

- **URL (when deployed):** `https://xoje-tech.github.io/the-journey-of-xoje/`
- **Two locales:** Spanish (default, `/es/`) and English (`/en/`). Bare `/` redirects to `/es/`.
- **Source of truth for content:** the live DATA at `~/.personal-brand/DATA/*.json`, fed through the `cv-product-eng` orchestrator of `@personal-brand/cv`.
- **Architecture:** Astro 6 static export. No SSR, no integrations, no runtime JS.

The contract is captured in [`SPEC.md`](./SPEC.md). Read that first if you want to understand the **why**. This README is the **how**.

---

## Stack

| Layer           | Choice                                      | Why                                                                                 |
| --------------- | ------------------------------------------- | ----------------------------------------------------------------------------------- |
| Site generator  | **Astro 6**                                 | Static export, native i18n, content collections, zero JS by default                 |
| Package manager | **pnpm 11** (workspaces)                    | Required for the `link:` resolution against `../personal-brand/packages/*`          |
| Node            | **>= 22**                                   | Enforced in `package.json` `engines`                                                |
| Print preview   | **chromium --headless --print-to-pdf**      | See `scripts/print-preview-headless.mjs`. **No Playwright** — doctrine: lightweight |
| Tests           | **Vitest**                                  | Print contract + build script contract                                              |
| Content source  | **`@personal-brand/cv`** (linked workspace) | NOT a snapshot — the portfolio reads the live DATA at build time                    |

---

## Quick start

```bash
# Prereqs: Node ≥22, pnpm 11
pnpm install
pnpm dev          # http://localhost:4321/es/  (auto-redirects from /)
```

The `predev` hook runs `node scripts/build-cv.mjs` first, which reads `~/.personal-brand/DATA/*.json` and materializes `src/content/cv.es.md` and `src/content/cv.en.md`. **Don't edit those `.md` files by hand** — they are regenerated on every build.

---

## Build (production)

```bash
pnpm build        # runs build:cv (materialize content) → astro build → dist/
pnpm preview      # serves dist/ locally for verification
```

Output: `dist/{es,en}/index.html` + assets. Static. Deployable to any static host.

---

## Tests

```bash
pnpm test         # vitest run --passWithNoTests
pnpm test:watch   # vitest watch mode
pnpm typecheck    # tsc --noEmit
```

Current coverage:

- `tests/print-contract.test.ts` — validates the print CSS contains the Harvard contract (`@page A4`, `1.6cm`, `STIX Two Text`, `#1155cc`, `page-break-inside`, `.no-print`).
- `tests/build-cv.test.ts` — runs `scripts/build-cv.mjs` and validates both `cv.es.md` and `cv.en.md` are produced, non-empty, and contain the expected CV-section headings.

---

## Print preview (headless, no Playwright)

Slice-1 validation used Chromium's headless mode directly. Reproducible locally:

```bash
# In one terminal:
pnpm dev

# In another:
node scripts/print-preview-headless.mjs
# → tmp/print-preview-es.pdf
# → tmp/print-preview-en.pdf
```

Open the PDFs in any viewer. The print preview uses `--emulate-media=print`, so it activates `@media print` and respects `@page A4` exactly as a real `Ctrl+P` would.

---

## Project layout

```
the-journey-of-xoje/
├── SPEC.md                          # architecture contract — read this first
├── README.md                        # you are here
├── AGENTS.md                        # conventions for AI agents working on this repo
├── package.json                     # scripts, engines, linked workspace deps
├── pnpm-workspace.yaml              # declares the ../personal-brand link
├── astro.config.mjs                 # i18n: defaultLocale es, prefixDefaultLocale:true
├── scripts/
│   ├── build-cv.mjs                 # reads ~/.personal-brand/DATA, writes cv.{es,en}.md
│   └── print-preview-headless.mjs   # chromium --print-to-pdf for validation
├── src/
│   ├── content.config.ts            # Astro 6 content collection (glob loader)
│   ├── content/
│   │   ├── cv.es.md                 # GENERATED — do not edit
│   │   └── cv.en.md                 # GENERATED — do not edit
│   ├── components/
│   │   ├── CvDocument.astro
│   │   └── LocaleSwitch.astro
│   ├── layouts/
│   │   └── CvLayout.astro
│   ├── pages/
│   │   ├── index.astro              # 302 redirect → /es/
│   │   └── [locale]/
│   │       └── index.astro          # the only real route
│   ├── i18n/
│   │   ├── ui.es.json
│   │   └── ui.en.json
│   └── styles/
│       ├── screen.css
│       └── print.css                # THE contract — Harvard @page A4
└── tests/
    ├── print-contract.test.ts
    └── build-cv.test.ts
```

---

## DATA location

The CV content lives at `~/.personal-brand/DATA/*.json`, **not** in this repo:

```
~/.personal-brand/DATA/
├── profile.json      # name, contact, location, headline
├── experience.json   # array of experience entries
├── skills.json       # qualitative + technical skills
├── projects.json     # portfolio items
└── education.json    # degrees, certifications
```

To update the CV:

1. Edit the relevant file under `~/.personal-brand/DATA/`.
2. Re-run `pnpm build:cv` (or just `pnpm dev` — it runs `predev` automatically).
3. Regenerate the print preview: `node scripts/print-preview-headless.mjs`.

**Important:** `@personal-brand/cv` runs guardrails G01 / G04 / G05 over the DATA. G04 (no-invented-metrics) BLOCKER: an agent must never invent content. If a section is empty, it stays empty.

---

## Deployment (GitHub Pages)

The website is continuously deployed to **GitHub Pages** using GitHub Actions:

- **Deployment branch:** `master`
- **Workflow file:** `.github/workflows/deploy.yml`
- **URL:** `https://xoje-tech.github.io/the-journey-of-xoje/`

Any push or merge into the `master` branch automatically triggers the deployment action, which compiles the static site and deploys it.

---

## Slice status

| Slice           | Scope                                                       | Status                             |
| --------------- | ----------------------------------------------------------- | ---------------------------------- |
| 1               | Print-ready CV, two locales, headless preview               | ✅ Closed and validated 2026-07-15 |
| 2               | Close slice-1 debts (DATA, docs, tests), pre-deploy hygiene | ✅ Completed 2026-07-16            |
| 3 (Deploy)      | Static hosting on GitHub Pages                              | ✅ Completed and live 2026-07-16   |
| 4 (Interactive) | Videogame HUD: Pause button, NPCs, Skill pouches, animation | ✅ Completed and live 2026-07-17   |
| 5 (i18n)        | Translation of CV Body content (ES -> EN)                   | 🔄 Active (in Backlog)             |

Backlog tracked in dev-tracker project `the-journey-of-xoje`.

---

## Conventions

- **Git Flow:** PRs target `develop`. `master` is production.
- **Author:** Gandalf.
- **Repo:** `Xoje-Tech/the-journey-of-xoje` — **private**.
- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/). No `Co-Authored-By` lines, no AI attribution.
- **Code style:** Prettier (run `pnpm format`). TS strict (`tsconfig.json`).
- **No runtime JS:** keep it that way unless there's a hard reason.
- **No Playwright:** doctrine is lightweight. Use `chromium --headless` instead.

---

## License

Private. © Xoje-Tech. Not for redistribution.

---

## See also

- [`SPEC.md`](./SPEC.md) — architectural contract and resolved decisions
- [`AGENTS.md`](./AGENTS.md) — gotchas and conventions for AI agents
