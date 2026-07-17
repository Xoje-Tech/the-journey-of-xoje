# Design: Game Skill Bags

Enrich character skill progression by splitting the monolithic 15-skill backpack HUD/modal into three category-specific interactive bags (Technical, Qualitative, Soft) with full localization and generic modal triggers, while introducing 4 soft skills (increasing total count to 19).

## Technical Approach

We will replace the single `BackpackButton` and `BackpackInventory` with three specialized bag components (`TechBag.astro`, `QualBag.astro`, `SoftBag.astro`). Each component houses its own HUD button, transient toast, and `<RetroModal>`. We will extend categories in `types.ts`, sort 19 templates chronologically in `init.ts`, draw green coins in `render.ts`, refactor `RetroModal.astro` for generic trigger focus/ARIA resets, and wrap the HUD buttons inside a responsive top-right flexbox row in `index.astro`.

## Architecture Decisions

| Option | Tradeoff | Decision |
|---|---|---|
| **Bag Isolation**<br>Three separate components vs. single tabbed modal | High modularity and cleaner Atomic structure vs. slightly more code duplication. | **Three separate components** (`TechBag`, `QualBag`, `SoftBag`) to fulfill explicit visual and architectural decoupling constraints. |
| **Bilingual Logic**<br>Ternary locale checks vs. full JSON i18n keys | Fast inline coding vs. hardcoded strings and potential translations drift. | **Centralized JSON i18n keys** under `ui.*.json` using data-attributes for client-side scripts to comply with DevXoje Criteria. |
| **Modal Resets**<br>Hardcoded selectors vs. dataset trigger mapping | Zero configuration vs. tight coupling and poor reusability. | **Decoupled trigger mapping** via `data-trigger-id` and a centralized dialog `'close'` event listener in `RetroModal.astro`. |

## Data Flow

```mermaid
sequenceDiagram
    autonumber
    actor Player
    participant Canvas as Game Canvas (render.ts)
    participant Loop as Game Loop (init.ts)
    participant Viewport as GameViewport (Astro)
    participant Store as collectedSkillsStore (Nanostores)
    participant Bag as SoftBag (Astro / HUD)

    Player->>Canvas: Overlaps Soft Skill Coin
    Loop->>Loop: Detects collision via checkCollision()
    Loop->>Loop: Sets item.collected = true
    Loop->>Viewport: Dispatches 'game-state-update' CustomEvent with details
    Viewport->>Store: Pushes unlockedId into collectedSkillsStore
    Store->>Bag: Emits updated skills list to subscribers
    Bag->>Bag: Filters list, increments count from "0/4" to "1/4"
    Bag->>Bag: Animates transient toast "+ [Skill Name]!" for 2500ms
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/game/types.ts` | Modify | Add `'soft'` category to `CollectibleItem` and update payloads. |
| `src/game/init.ts` | Modify | Insert 4 soft skills into `SKILL_TEMPLATES` ascending by `y` (preserving chronological order; total 19). |
| `src/game/render.ts` | Modify | Draw soft skills in `drawCollectibles` using green styling. |
| `src/components/ui/RetroModal.astro` | Modify | Support generic `data-trigger-id` focus/ARIA reset on `'close'`. |
| `src/components/game/BackpackButton.astro` | Delete | Deprecate and remove monolithic backpack button. |
| `src/components/game/BackpackInventory.astro` | Delete | Deprecate and remove monolithic backpack inventory. |
| `src/components/game/TechBag.astro` | Create | Astro component containing Technical bag HUD, toast, and modal. |
| `src/components/game/QualBag.astro` | Create | Astro component containing Qualitative bag HUD, toast, and modal. |
| `src/components/game/SoftBag.astro` | Create | Astro component containing Soft bag HUD, toast, and modal. |
| `src/pages/[locale]/index.astro` | Modify | Mount `TechBag`, `QualBag`, `SoftBag` inside a `.hud-top-right` row. |
| `src/i18n/ui.en.json` | Modify | Add English keys for bag HUD labels and modal titles. |
| `src/i18n/ui.es.json` | Modify | Add Spanish keys for bag HUD labels and modal titles. |
| `tests/game-journey-progression.test.ts` | Modify | Expect 19 skills and update biome counts (LCS: 4, Crmble: 5, Twinny: 5, RIDE ON: 5). |

## Interfaces / Contracts

### Extended CollectibleItem (`src/game/types.ts`)
```typescript
export interface CollectibleItem {
  id: string;
  name: string;
  category: 'technical' | 'qualitative' | 'soft';
  biome: string;
  x: number;
  y: number;
  radius: number;
  collected: boolean;
}
```

### Soft Skill Templates (`src/game/init.ts`)
```typescript
// 4 soft skills inserted into SKILL_TEMPLATES chronologically:
{ id: 'cultural-adaptability', name: 'Cultural adaptability', category: 'soft' as const, biome: 'LCS Robotics', xRatio: 0.4, y: 350 },
{ id: 'collaborative-creativity', name: 'Collaborative creativity', category: 'soft' as const, biome: 'Crmble', xRatio: 0.5, y: 1500 },
{ id: 'peer-mentoring', name: 'Peer mentoring', category: 'soft' as const, biome: 'Twinny', xRatio: 0.6, y: 2500 },
{ id: 'continuous-learning', name: 'Continuous learning', category: 'soft' as const, biome: 'RIDE ON', xRatio: 0.45, y: 3500 }
```

### i18n Extensions (`src/i18n/ui.*.json`)
```json
"game": {
  "techBagLabel": "Tech: ",
  "techBagTitle": "Technical Skills",
  "qualBagLabel": "Qual: ",
  "qualBagTitle": "Qualitative Skills",
  "softBagLabel": "Soft: ",
  "softBagTitle": "Soft Skills"
}
```

### Decoupled Modal Reset Pattern (`src/components/ui/RetroModal.astro`)
```typescript
const triggerId = modal.getAttribute('data-trigger-id');
modal.addEventListener('close', () => {
  if (triggerId) {
    const btn = document.getElementById(triggerId);
    if (btn) {
      btn.setAttribute('aria-expanded', 'false');
      btn.focus();
    }
  }
});
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit / Integration | Skill templates & counts | Update `game-journey-progression.test.ts` to expect 19 skills and updated biome distributions (4, 5, 5, 5). Verify ascending sorting by `y`. |
| Component | DOM subscription & Toast | Verify each bag updates counts on store publish and triggers CSS active state on its transient toast for 2500ms. |
| E2E / Visual | Accessibility & Layout | Verify `no-print` classes, check `.hud-top-right` horizontal flow, verify mobile responsiveness (labels hidden below 480px), and validate ARIA states and focus cycles via interactive headless navigation. |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, or process-integration boundaries are introduced by this change.

## Migration / Rollout

No data migration required. Flat file changes in client-side codebase.

## Open Questions

None. All constraints have been explicitly aligned and resolved.
