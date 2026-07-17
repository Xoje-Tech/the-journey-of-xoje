# Proposal: Game Skill Bags

## Intent
Enrich character skill progression by splitting the monolithic 15-skill backpack HUD/modal into three category-specific interactive bags (Technical, Qualitative, Soft) with full localization and generic modal triggers, while introducing 4 soft skills (increasing total count to 19).

## Scope

### In Scope
- Define 4 new soft skills (1 per biome) in `SKILL_TEMPLATES` (raising total to 19).
- Support `'soft'` skill rendering (distinct color/stroke) on canvas in `drawCollectibles`.
- Create `TechBag.astro`, `QualBag.astro`, `SoftBag.astro` to display separate HUD counts and modal dialogs.
- Make `RetroModal.astro` generic to handle triggers and reset `aria-expanded` attributes correctly.
- Implement `.hud-top-right` flexbox container next to `PauseButton` in `index.astro`.
- Map localized labels/titles for all 3 bags in `ui.es.json` & `ui.en.json`.
- Update progression tests to verify 19 skills and biome counts.

### Out of Scope
- Changing player speed, physics, or collision math.
- Developing additional gameplay biomes beyond the existing 4.

## Capabilities

### Modified Capabilities
- `journey-progression`: Replaces the single backpack (`#backpack-hud` and `#skill-matrix-modal`) with three category-specific bags/modals and expands the skill templates list to 19.

## Approach
1. **Types**: Extend `CollectibleItem` category to `'technical' | 'qualitative' | 'soft'`.
2. **Spawning**: Insert 4 soft skills into `SKILL_TEMPLATES` in `src/game/init.ts` at chronological y-positions.
3. **Canvas**: Update `drawCollectibles` to draw green coins for soft skills.
4. **UI**: Deprecate `BackpackButton` and `BackpackInventory`. Add `TechBag`, `QualBag`, and `SoftBag` in `src/components/game/`. Each subscribes to `collectedSkillsStore` and filters for its category.
5. **Layout**: In `index.astro`, wrap `PauseButton` and the three bags inside a `.hud-top-right` flex container with `gap: 8px`.
6. **Modularity**: Modify `RetroModal` to utilize `data-trigger-id` for generic `aria-expanded` resets.
7. **i18n**: Extract all text to `ui.en.json` and `ui.es.json`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/game/types.ts` | Modified | Add `'soft'` category to `CollectibleItem`. |
| `src/game/init.ts` | Modified | Add 4 soft skills to `SKILL_TEMPLATES` (total 19). |
| `src/game/render.ts` | Modified | Draw soft skills with a distinct green palette. |
| `src/components/ui/RetroModal.astro` | Modified | Support generic trigger element focus/aria reset. |
| `src/components/game/` | New/Removed | Remove Backpack components; create `TechBag`, `QualBag`, `SoftBag`. |
| `src/pages/[locale]/index.astro` | Modified | Position all 4 HUD buttons in `.hud-top-right` flex row. |
| `src/i18n/ui.*.json` | Modified | Add localized keys for bag labels and modal titles. |
| `tests/game-journey-progression.test.ts` | Modified | Expect 19 skills and update biome assertions. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Mobile overlap | Medium | Apply responsive Flexbox spacing (`gap: 8px`) and hide text labels under 480px. |
| Broken tests | High | Update `tests/game-journey-progression.test.ts` assertions to match 19-skill distribution. |

## Rollback Plan
Revert changes using `git checkout develop && git clean -df` to return to the verified, green-test baseline.

## Dependencies
- None (zero external packages added).

## Success Criteria
- [ ] 19 skills correctly spawned and collectible on the canvas.
- [ ] 3 separate HUD bags render matching counts dynamically.
- [ ] HUD buttons group nicely inside a responsive top-right flex row.
- [ ] Zero hardcoded bilingual strings.
- [ ] All tests pass successfully (`pnpm test`).
