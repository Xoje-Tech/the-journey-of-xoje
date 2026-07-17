---
type: architecture
title: Reactivity & HUD Bridging via CustomEvents
description: "Documents the decoupled event bridging model between the headless game engine canvas and the Astro Nanostores HUD components."
timestamp: 2026-07-17T15:37:00Z
tags: [reactivity, events, nanostores, hud]
---

# Reactivity & HUD Bridging via CustomEvents

A major architectural challenge in *The Journey of Xoje* is updating standard HTML/CSS components (like the inventory backpack badges or typewriter dialog modals) from a canvas-based game loop without importing massive SPA framework runtimes (Vue, React).

We solve this using a **unidirectional CustomEvents + Nanostores bridging pattern** (project-doctrine §11.8).

---

## 1. Unidirectional Event Flow Schema

```
 [ Game Loop (Canvas) ]  ───(Collides with Skill)───► [ DOM Window Event ]
                                                             │
                                                     (Dispatches CustomEvent)
                                                             │
                                                             ▼
 [ SoftBag / TechBag ]   ◄───(Mutes state reactive)─── [ Nanostores Store ]
  (Subscribes to Store)
```

---

## 2. Technical Implementation

### Phase A: Engine dispatches standard DOM CustomEvents
When the player collides with an obstacle or skill entity, the engine does not access the DOM elements directly. It dispatches a serializable payload:
```typescript
const event = new CustomEvent('game-state-update', {
  detail: { unlockedId: 'soft/reactivity' }
});
window.dispatchEvent(event);
```

### Phase B: Bridging Viewport updates Nanostores
A parent component (e.g. `GameViewport.astro`) acts as the listener, updating client-side Nanostores:
```typescript
import { collectedSkillsStore } from '../application/store';

window.addEventListener('game-state-update', (e) => {
  const { unlockedId } = (e as CustomEvent).detail;
  const current = collectedSkillsStore.get();
  if (!current.includes(unlockedId)) {
    collectedSkillsStore.set([...current, unlockedId]);
  }
});
```

### Phase C: HUD Components react to the Store
Individual static Astro elements (such as `SoftBag.astro`) subscribe to the store, and trigger CSS classes or toggle visibility upon updates:
```typescript
collectedSkillsStore.subscribe((skills) => {
  const softCount = skills.filter(s => s.startsWith('soft/')).length;
  document.getElementById('soft-badge').innerText = softCount;
});
```

This decoupled model ensures the engine remains 100% testable in headless node, while the HUD remains lightweight and ultra-performant.
