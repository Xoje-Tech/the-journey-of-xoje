---
type: index
title: OKF Knowledge Catalog — The Journey of Xoje
description: "The official Open Knowledge Format (OKF) v0.1 index for The Journey of Xoje, providing a machine-readable, curated architectural map of the portfolio and game engine."
timestamp: 2026-07-17T15:35:00Z
tags: [okf, architecture, portfolio, index]
---

# OKF Knowledge Catalog — The Journey of Xoje

Welcome to the **Open Knowledge Format (OKF) Bundle** for *The Journey of Xoje*. This folder contains hand-curated, machine-readable documentation describing the design decisions, core game mechanics, and visual layouts of the portfolio.

---

## 1. Architectural Core (Hand-Curated)

These files document the "why" and "how" of our codebase, preserved from automatic regeneration:

*   **[Core Game Loop & Engine](architecture/engine-loop.md)**: Details the headless-testable game engine, rendering systems, coordinate mapping, and delta physics.
*   **[Reactivity & HUD Bridging](architecture/reactivity-hud.md)**: Explains the decoupled communication between the canvas engine and Astro Nanostores via global HTML5 `CustomEvents`.
*   **[The Print CSS Contract](architecture/print-css-contract.md)**: Outlines the Harvard-style serif layout, page breaks, and `@page` rules checked by our integration test suite.

---

## 2. Changelog & System Logs

*   **[Change Log](log.md)**: Tracking OKF bundle initialization and evolution.
