# Knowledge Gaps & Problem Identification — The Journey of Xoje

This document maps the structural, agentic, and architectural bottlenecks found inside the `the-journey-of-xoje` repository, identifying gaps in knowledge retrieval, documentation overhead, and agent capabilities.

---

## 1. Knowledge Gaps and Documentation Problems

### 1.1 Multi-Layered Content Duplication (Data Redundancy)
There is a massive data redundancy problem with the CV content. The exact same professional content exists simultaneously in three independent layers:
1. **Live Canonical Profile**: `~/.personal-brand/DATA/*.json` (global profile state on the host machine, accessed by the `personal-brand` MCP server).
2. **Repository Local Fixture (CI/CD Standalone Fallback)**: `tests/fixtures/portfolio/*.json` (committed snapshot of the data, to guarantee the build passes in headless server environments).
3. **Generated Content Collections**: `src/content/cv.es.md` and `cv.en.md` (Markdown files generated at build-time by the build script, which are read by Astro's content collection).

*Consequences*: Sychronizing these three layers requires a manual multi-step process (`sync-personal-brand-data.mjs --apply --force` followed by copying and committing). If any step is missed, the deployed website immediately drifts from the user's actual live credentials.



### 1.3 Documentation vs. Reality Drift (Stale Docs)
With highly interactive elements (like the recent change of `prefixDefaultLocale` to `false` and the dynamic `base` configuration in PR #16), documentation like `SPEC.md` and `AGENTS.md` can easily fall out of sync. For example, `SPEC.md` still outlines the old A4 print CSS from Slice 1 and lists old `defaultLocale` routing prefix rules.

---

## 2. Agent Operational Problems

### 2.1 Missing Repository Index in codebase-memory-mcp (Inability to Understand Architecture)
The repository `/home/hermes/projects/the-journey-of-xoje` **is NOT indexed** inside `codebase-memory-mcp` (only `dev-tracker` is). 
- *Consequences*: When an agent enters the repository, it cannot use Cypher graphs, structural queries, BM25 ranked full-text searches, or trace caller/callee relationships natively. The agent is forced to fall back to expensive, brute-force ripgrep text-searches (`search_files`) and bulk file-reads, resulting in high turn-times and increased context bloat.

### 2.2 Fresh-Context Turn Overhead (Context Bloat)
Because sub-agents dispatched via `delegate_task` launch with a completely fresh, blank context window, they do not inherit the parent orchestrator's history or local project understanding. To understand how the game's CustomEvents communicate with Astro Nanostores, a sub-agent must read multiple files across layers (`types.ts`, `store.ts`, `render.ts`, and component `<script>` tags), blowing up the input token count on every delegation.

### 2.3 Binary Asset Blindness
The retro aesthetic depends heavily on sprite sheets (`src/assets/player.png` etc.). Standard text-based AI models are completely blind to binary assets. They cannot natively verify if a sprite sheet was sliced correctly, whether transparency was preserved, or where a visual glitch originates without invoking heavy programmatic scripts or spawning vision tools, making asset maintenance extremely expensive.

---

## 3. Code & Structural Problems

### 3.1 Structural Friction: SSR + Vanilla Client-Side Game Loop
The project merges server-side rendering (Astro components compiles to static HTML) with a highly stateful, long-running canvas-based game loop in vanilla TypeScript on the client side.
- *Consequences*: New agents struggle to identify the boundary. They try to inject reactive elements directly into Astro components (which compile to static nodes with zero runtime JS) instead of bridging state through global `window` CustomEvents and subscribing via client-side Nanostores, breaking the "no runtime JS by default" rule of the portfolio.

### 3.2 High Navigation Cost of Modular Code
The folder structure follows a strict modular Hexagonal + Atomic Design pattern (§11 of `project-doctrine`). While this is exceptionally clean and maintainable for humans, it results in a high navigation cost for AI agents. An agent searching for where a button click updates a store must traverse from `atoms/RetroButton.astro` to `organisms/SettingsPanel.astro` to `application/store.ts` to `infrastructure/init.ts`.
