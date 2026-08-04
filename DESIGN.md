---
version: alpha
name: The Journey of Xoje Design System
description: Retro-pixel gaming meets professional product engineer CV.
colors:
  primary: "#1c1c1f"     # Dark zinc for primary backgrounds
  secondary: "#f4f4f5"   # Light zinc for text and focus rings
  neutral: "#09090b"     # Solid deep black for borders and shadows
  accent: "#0b66c2"      # Classic professional blue accent
  hud-bg: "rgba(30, 30, 35, 0.85)"      # Semi-transparent dark background for HUD
  hud-bg-hover: "rgba(45, 45, 50, 0.95)" # Darker background on hover for HUD
  hud-border: "rgba(255, 255, 255, 0.15)" # Thin light border for HUD
typography:
  h1:
    fontFamily: "ui-monospace, 'JetBrains Mono', Menlo, Consolas, monospace"
    fontSize: "2.5rem"
    fontWeight: "700"
    lineHeight: "1.2"
  body-md:
    fontFamily: "ui-monospace, 'JetBrains Mono', Menlo, Consolas, monospace"
    fontSize: "14px"
rounded:
  none: "0px"
  md: "8px"
  pill: "20px"
spacing:
  sm: "8px"
  md: "16px"
components:
  button-pill:
    backgroundColor: "{colors.hud-bg}"
    textColor: "{colors.secondary}"
    rounded: "{rounded.pill}"
    padding: "8px 16px"
  button-pill-hover:
    backgroundColor: "{colors.hud-bg-hover}"
  button-retro:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.secondary}"
    rounded: "{rounded.none}"
    padding: "8px 16px"
---

## Overview

The Journey of Xoje is a retro pixel-art gamified CV portfolio. Its design merges two contrasting worlds:
1. **The Gaming Overlay:** Dark, immersive, pixelated, using translucent pill-shaped elements and custom thick focus halos.
2. **The Harvard-style Document:** Pristine, light, high-contrast serif document optimized for screen reading and A4 physical printing.

## Colors

- **Primary (#1c1c1f):** Grounding dark zinc used for panels, modals, and retro screen components.
- **Secondary (#f4f4f5):** High-contrast light text on dark backgrounds and the source for focus indicators.
- **Neutral (#09090b):** Deep void black for shadows and borders to emulate retro cartridge games.
- **Accent (#0b66c2):** Professional branding blue used for the document links.
- **HUD Background (rgba(30, 30, 35, 0.85)):** Translucent glass for overlays, keeping the canvas game elements visible underneath.

## Typography

Strict monospace for game overlays to match the terminal/cartridge gaming aesthetics, contrasting with serif choices in the printable document.

## Layout

A 2D orthographic camera layout on the canvas, balanced with a centered max-800px column layout for the screen-only document text.

## Shapes

- **None (0px):** For sharp, pixelated cartridge components (e.g., retro buttons, main panels).
- **Pill (20px):** Modern HUD-friendly circular capsule forms for gameplay overlays.

## Components

### `button-pill`
HUD interactive items like skill bags, print buttons, and pause buttons. Employs circular border radii and translucent backgrounds.

### `button-retro`
Title-screen buttons with sharp, pixelated edges and chunky drop-shadow borders.
