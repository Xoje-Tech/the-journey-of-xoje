## Architecture

The project follows a modular Astro 6 structure with two primary domains:

### 1. Game Module
- Implements a embedded portfolio experience through
- Components:
  - Input handling (`input.ts`)
  - Physics engine (`physics.ts`)
  - Player management (`player/` directory)
  - Game state (`store.ts`)
- Built with TypeScript and Atomic Design principles

### 2. CV/Portfolio Module
- Zero-runtime static site generator
- Generates Harvard-style CVs from `~/.personal-brand/DATA/*.json`
- Enforced by `@personal-brand/cv` guardrails in:
  - G01: Voice consistency
  - G04: Content integrity (no invented data)
  - G05: Print contract compliance

### Data Flow
1. DATA files at `~/.personal-brand/DATA/` are read by `scripts/build-cv.mjs`
2. Markdown files (`cv.es.md/cv.en.md`) are generated at build time
3. Content is consumed by Astro's component tree in `src/components`

### Key Technologies
- Astro 6 (static export, i18n)
- Pnpm workspace (monorepo with linked `/personal-brand`)
- Vitest (contract testing)
- Headless Chrome for print validation

See `SPEC.md` for concrete print contract requirements and `AGENTS.md` for operational rules.