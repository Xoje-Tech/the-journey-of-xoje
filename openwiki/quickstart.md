## The Journey of Xoje

This repository implements **Slice 1** of the portfolio website, focusing on generating a Harvard-style CV via the `cv-product-eng` orchestrator from `@personal-brand/cv`. The site is a static Astro 6 site with zero runtime JS, prioritizing print-ready output over interactive features.

### Key Features
- Zero-runtime, zero-backend design
- Two locales (Spanish/English) with `prefixDefaultLocale`
- Print preview validates Harvard contract via `src/styles/print.css`
- Data lives in `~/.personal-brand/DATA/*.json` (not in repo)

### Quick Start
```bash
pnpm install
pnpm dev  # Auto-generates CV markdown and serves at http://localhost:4321/es/
```

### Critical Files
- `SPEC.md`: Contract for Harvard print compliance
- `scripts/build-cv.mjs`: Materializes `cv.{es,en}.md` from DATA
- `src/styles/print.css`: Must enforce Harvard @page A4

For deeper docs, see `/openwiki/` directory.