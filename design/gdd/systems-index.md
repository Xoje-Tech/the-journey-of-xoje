# Systems Index — the-journey-of-xoje

This index categorizes all game systems in `the-journey-of-xoje` by Priority (Foundation → Core → Feature → Presentation → Polish) and Tier (MVP vs. Post-MVP). This ensures we establish solid engineering foundations before developing the facade.

## Roster of Game Systems

| System | Priority | Tier | GDD Path | Description |
|---|---|---|---|---|
| **Physics & Collision** | Foundation | MVP | `design/gdd/physics-collision.md` | Core physical motion, friction integration, map clamping, and collision bounds. |
| **Movement & Input** | Core | MVP | `design/gdd/movement-input.md` | Dual keyboard/touch/gamepad navigation, analog stick deadzones, motion trails, and click-to-move pathing. |
| **Biome Engine & Map** | Core | MVP | `design/gdd/biome-engine.md` | Career biomes (LCS Robotics, Crmble, Twinny, RIDE ON) vertical layouts, yOffset scaling, tileable tile generation, and camera bounds. |
| **Collectibles & NPC Dialog** | Feature | MVP | `design/gdd/collectibles-dialog.md` | Skill item collections, bilingue NPC dialog overlays, and modal D-pad/Start navigation. |
| **HUD & Settings Panel** | Presentation | MVP | `design/gdd/hud-settings.md` | Skill counter bags, debug telemetry overlays, volume sliders, and pause controls. |
| **Visual Polish & Sound** | Polish | Post-MVP | `design/gdd/visual-polish-sound.md` | Ambient spritesheet animations, audio trigger logic, and particle effects. |
