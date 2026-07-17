---
type: architecture
title: Core Game Loop & Engine Mechanics
description: "Walkthrough of the 16-bit game loop, delta physics, input polling, sprite frames, and headless JSDOM testing boundaries."
timestamp: 2026-07-17T15:36:00Z
tags: [game-engine, game-loop, physics, vitest]
---

# Core Game Loop & Engine Mechanics

The game engine in *The Journey of Xoje* is a lightweight, stout, retro adventure designed to be 100% testable in a headless environment. It lives under `src/modules/game/`.

---

## 1. Engine Directory Mapping

The codebase enforces a strict separation between the **Engine Logic (pure JS/TS)** and **Rendering/DOM Viewport (Astro/CSS)**:

```
src/modules/game/
├── domain/                  # Entities and variable schemas
│   ├── types.ts             # Game state models (Player, Position, GameState)
│   └── player/types.ts      # Sprite schemas and layout frames
├── application/             # Game physics and loop triggers
│   ├── physics.ts           # Collision detection and coordinate moves
│   ├── input.ts             # Gamepad and keyboard listeners
│   ├── store.ts             # Nanostores client state
│   └── player/              # Player movement and sprite-frame animations
└── infrastructure/          # Engine binders (headless-friendly)
    ├── init.ts              # Core bootstrapper and tick-updater
    ├── render.ts            # Canvas paint cycles
    └── hud.ts               # Sound volume and controls
```

---

## 2. Headless Testability

By decoupling coordinates, movement logic, and input-handling from the browser's DOM classes, we can run all 49 game tests inside Vitest under a standard Node.js server. 

### Physics and Move Assertion (Vitest)
```typescript
import { updatePosition } from './physics';
import { expect, test } from 'vitest';

test('player moves right when D is pressed', () => {
  const initial = { x: 100, y: 100 };
  const input = { right: true };
  const updated = updatePosition(initial, input, 16); // 16ms delta
  expect(updated.x).toBeGreaterThan(initial.x);
});
```

---

## 3. Pixel-Art Spritesheets
The visual assets (e.g. `src/assets/player.png`) are generated using Python Pillow (`generate-sprites.py`), creating a thick 1px desaturated outline around character states (idle, walk, jump). Frames are mapped statically within `src/modules/game/domain/player/types.ts` to coordinate coordinate clips cleanly on rendering cycles.
