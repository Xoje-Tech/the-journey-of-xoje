# Knowledge Audit — The Journey of Xoje

This document captures the discovery phase of the knowledge system inside `the-journey-of-xoje` repository, analyzing how information, documentation, and agent workflows are structured, maintained, and retrieved.

---

## 1. Repository Discovery

### 1.1 Folder Structure and Directory Tree
The repository follows a clean, highly structured layout combining Astro 6 static web framework conventions with a domain-driven Hexagonal Architecture + Atomic Design pattern on the frontend:

```
the-journey-of-xoje/
├── SPEC.md                          # Architectural contract (goals, non-goals, decisions)
├── README.md                        # Developer onboarding & "how-to" manual
├── AGENTS.md                        # AI agent operational guidelines, gotchas, & rules
├── package.json                     # Scripts, Astro 6 engine, dependencies
├── pnpm-workspace.yaml              # Intentionally disabled workspace (pre-approved local file link pattern)
├── astro.config.mjs                 # Astro 6 configuration (locales, base, dev-server, build-routing)
├── tsconfig.json                    # Strict TypeScript setup
├── docs/
│   └── DESIGN.md                    # Visual token design specification (Google token style)
├── openspec/                        # Spec-Driven Development (SDD) files & historic change logs
│   ├── config.yaml                  # OpenSpec context and rules
│   ├── specs/                       # Delta specifications (e.g., journey-progression, start-screen)
│   └── changes/                     # Active and archived feature branch records (proposal, design, tasks, verify)
├── scripts/
│   ├── build-cv-static.mjs          # Reads static JSON data, generates content markdown
│   ├── sync-personal-brand-data.mjs # Sells and syncs content with external pb-beta and ~/.personal-brand/DATA
│   ├── print-preview-headless.mjs   # Headless Chromium PDF print-to-pdf generator
│   ├── generate-sprites.py          # Programmatic retro sprite generator utilizing PIL/Pillow
│   └── .venv/                       # Dedicated Python virtual environment for Pillow dependency
├── src/
│   ├── content.config.ts            # Content collection registration (glob loaders)
│   ├── content/
│   │   ├── cv.es.md                 # Generated Markdown (Spanish) - DO NOT EDIT
│   │   └── cv.en.md                 # Generated Markdown (English) - DO NOT EDIT
│   ├── i18n/
│   │   ├── ui.es.json               # Localized UI string dictionaries
│   │   └── ui.en.json
│   ├── layouts/
│   │   └── CvLayout.astro           # Base HTML shell linking screen.css & print.css
│   ├── pages/
│   │   ├── index.astro              # Standard index render (direct Spanish load, zero-delay redirect)
│   │   └── [locale]/
│   │       └── index.astro          # Localized index route (mounts CV and Game HUD components)
│   ├── styles/
│   │   ├── screen.css               # Screen-only retro HUD and monospace game styling
│   │   └── print.css                # Print-only Harvard-style serif typography and margins
│   ├── shared/
│   │   ├── components/
│   │   │   └── LocaleSwitch.astro   # Context-aware locale switching toggle
│   │   └── lib/
│   │       └── logger.ts            # Centralized namespaced logger (eslint warning-free)
│   └── modules/
│       ├── cv/                      # CV representation layer
│       │   └── interface/components/organisms/CvDocument.astro
│       └── game/                    # Fully decupled game engine & visual elements
│           ├── domain/              # Entities, types, domain variables
│           ├── application/         # Core logic (physics, collision, input, animation, state)
│           ├── infrastructure/      # Bootstrappers and render/audio loops (init.ts, render.ts, hud.ts)
│           └── interface/components/
│               ├── atoms/           # Raw UI blocks (RetroButton, RetroModal, PauseButton, VolumeSlider)
│               ├── molecules/       # Connected elements (NesController, SkillCard, GamepadStatus)
│               └── organisms/       # Self-contained systems (GameViewport, BackpackButton, DialogOverlay)
└── tests/                           # Robust Vitest suite (110 passed assertions)
    ├── print-contract.test.ts       # Asserts that print.css maintains the strict Harvard margins contract
    ├── build-cv.test.ts             # Validates that build-cv-static generates correct content schemas
    └── game-*.test.ts               # Unit and integration checks for physics, input, animation, and pause HUD
```

### 1.2 Core Architecture
The application is a **KISS (Keep It Simple, Stupid), zero-runtime-JS static web application** in production. It utilizes:
1. **Astro 6 Static HTML Generation**: Generates high-density, performant, static pages at build-time.
2. **Nanostores Client-State sharing**: Lightweight client-side reactiveness (<1KB) for sharing audio, gamepad, dialogue overlays, and collected skills inventory between the game canvas and DOM elements without importing massive framework runtimes (Vue/React).
3. **Decoupled Game Engine Design**: The core game engine (`src/modules/game/application/`) has absolutely no dependencies on the DOM, allowing it to be fully unit-tested in Node.js (via Vitest). The interface layer bridges with the engine using HTML5 CustomEvents (`game-state-update`, `dialog-dismissed`) and updates Nanostores reactive state.
4. **The Split Print/Screen Layout**: Screen CSS (`screen.css`) displays a desaturated, stout 16-bit pixel-art interface based on *Lisa the Painful*. Print CSS (`print.css`) overrides the page upon `Ctrl+P` (or Chromium PDF print-to-pdf), hiding all HUD chrome, rendering high-contrast serif typography (*Charter* / *Source Serif Pro*), stripping URLs, and locking margins at `1.6cm 2cm` (Harvard style).

### 1.3 technologies
- **Site Generator**: Astro v6.0.0
- **Package Manager**: pnpm v11.9.0
- **Language**: TypeScript (Strict)
- **State Management**: Nanostores v1.4.0 (client-side)
- **Testing Runner**: Vitest v1.6.1 (with JSDOM and custom canvas mock helpers)
- **Assets Generation**: Python (v3.14.6) with Pillow library (PIL) for programmatic retro pixel-art rendering
- **Styles**: Standard CSS Variables & Scoped CSS (Transitioning to Tailwind v4-ready conventions)

### 1.4 Workspace and Monorepo Status
The repository is technically a **single-package project** that lives inside a larger, multi-repository environment. 
- **Workspace Linkage**: It is not a pnpm-workspace in itself (so it does not pollute transitive packages), but it connects directly to sibling directory `../personal-brand` during local dev.
- **Stand-alone Build**: To prevent build-failures inside headless CI/CD systems where the sibling directories don't exist, the build pipeline was refactored in Slice 3.1 to read a static DATA snapshot located under `tests/fixtures/portfolio/` instead of importing `@personal-brand/{cv,kb,core}` npm workspace dependencies at build time.

### 1.5 Documentation Locations
1. **Repository Core**: Root `README.md`, `SPEC.md`, and `AGENTS.md`.
2. **Visual Tokens**: `docs/DESIGN.md`.
3. **OpenSpec Pipeline**: `openspec/config.yaml`, `openspec/specs/`, and `openspec/changes/`.
4. **Historical Change Records**: Retained inside `openspec/changes/archive/` (e.g. `2026-07-16-videogame-ui`, `2026-07-17-game-npcs`, `2026-07-17-game-pause`, `2026-07-17-game-skill-bags`).

---

## 2. Knowledge Mapping

### 2.1 Developer Onboarding & Operational Knowledge
- **`README.md`**: Provides the structural "how-to". Explains scripts (`pnpm dev`, `pnpm build`, `pnpm test`), how content snapshots are loaded, and the location of live files.
- **`SPEC.md`**: Architectural "contract" and "why". Explicitly documents Goals, Non-Goals, Source of Truth for content, the strict print CSS contract, and a checklist of "Resolved Decisions" (such as the landing page i18n redirect and title H1 resolution).
- **`AGENTS.md`**: Operational "companion" specifically written for AI agents. Documents critical Astro 6 API changes (e.g., content-collection `glob` imports shifting from `astro:content` to `astro/loaders`, omission of empty `schema: {}` to prevent async validation crashes, custom slug generation, and build sequencing requirements).
- **`docs/DESIGN.md`**: Governs style tokens. Follows the Google `DESIGN.md` token specification, documenting colors, z-indices, font stacks, and component outlines.

### 2.2 Active SDD specifications & planning
- **OpenSpec Archive**: Standardized Markdown specifications of features, written during planning (proposals, specs, design plans, and verification reports). Each milestone (e.g., `game-npcs`, `game-skill-bags`) is represented here with detailed scenarios and implementation details.

---

## 3. Agent Ecosystem

### 3.1 Active Model Context Protocol (MCP) Servers
The local Hermes agent environment operates with three heavily-integrated MCP servers:
1. **`personal-brand`**: Command `pb-mcp`. Connects directly to the user's canonical profile, experience, skills, and education JSON files inside `~/.personal-brand/DATA/`. Provides tools for modifying and querying the user's brand, CV bullets, and experiences.
2. **`dev-tracker`**: Command `node /home/hermes/projects/dev-tracker/dist/src/mcp/index.js`. Integrates the local Kanban board REST API as tools for scheduling, tracking, and moving development tasks and tickets.
3. **`codebase-memory-mcp`**: Command `/home/hermes/.local/bin/codebase-memory-mcp`. A high-performance codebase analyzer and graph indexing server. Builds an active knowledge graph of the repositories (`home-hermes-projects-dev-tracker` is currently indexed with 1,870 nodes and 3,471 edges).

### 3.2 Automation Scripts & Tooling
- **`build-cv-static.mjs`**: Invoked via `pnpm predev`, `pnpm prebuild`, and `build:cv`. Parses the `profile`, `experience`, `skills`, `projects`, and `education` JSONs from the data snaphost directory, validates schema fields, and compiles `src/content/cv.es.md` and `cv.en.md`.
- **`sync-personal-brand-data.mjs`**: Syncs live experience/skills Markdown data from the user's `pb-beta` editorial workspace into the `~/.personal-brand/DATA/` folder. Handles drift checks (`--check`), preview of diffs (`--preview`), destructive applies with force (`--apply`), backups (retention of 3 historical backups per slot), and post-sync PDF print-previews.
- **`print-preview-headless.mjs`**: Launches a Chromium headless shell, navigates to the running Astro dev server, and uses chromium's native `--print-to-pdf` capability to compile print outputs to `tmp/print-preview-es.pdf` and `tmp/print-preview-en.pdf` for visual verification.
- **`generate-sprites.py`**: Invokes Python 3.14.6 with Pillow to render pixel-art character sprites, apply outline filters, and save files locally.

### 3.3 CI/CD & Deploy Pipelines
- **GitHub Actions (`.github/workflows/deploy.yml`)**: Continuous integration and deployment configuration that triggers on pushes to the `master` branch. Compiles the Astro static site and deploys it to **GitHub Pages** (live at `https://xoje-tech.github.io/the-journey-of-xoje/`).

---

## 4. Developer Workflows

### 4.1 Feature Implementation Workflow
1. **Initialization**: Project initialization and stack verification (checking `sdd-init`).
2. **Exploration**: Running exploration (`sdd-explore`) to examine codebase paths and dependencies.
3. **Proposal & Spec**: Writing feature proposals and specifications in `openspec/` using Gherkin Given/When/Then scenarios.
4. **Design & Tasks**: Outlining design contracts and task breakdowns (grouped hierarchically in `tasks.md`).
5. **Implement & Test**: Executing the implementation. Strictly follows the co-located tests pattern (writing `.test.ts` next to the application code where relevant, or inside `tests/`).
6. **Verify**: Verifying with `pnpm test` and compiling `pnpm build`. Creating print-preview PDFs to verify margins.
7. **Commit & PR**: Creating atomic Conventional Commits. Pushing to a feature branch (`feat/xyz`) and opening a PR to `develop`.
8. **Archive**: Moving the planning files to `openspec/changes/archive/` and resetting the active open-change state.

### 4.2 Release Process
- **develop** is the integration branch. Direct pushes to `master` are strictly prohibited.
- When `develop` is stable and has been approved by the user, a PR is opened from `develop` to `master`.
- Merging to `master` triggers the GitHub Pages CD pipeline.

---

## 5. Metrics & Discovery Summary

- **Total Test Files**: 12 passing
- **Total Assertions**: 110 passed in 3.45 seconds
- **Astro Component Count**: ~20 highly modular elements
- **Monorepo/Workspace Boundaries**: Standalone build configuration with explicit directory-sync scripts to avoid environment lock-in.
