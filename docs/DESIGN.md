---
version: alpha
name: The Journey of Xoje
description: Muted retro pixel-art styled after Lisa the Painful with elegant serif print capabilities.
colors:
  primary: "#1c1c1f"
  secondary: "#a1a1aa"
  accent: "#eab308"
  neutral: "#f4f4f5"
  dark: "#09090b"
  print-bg: "#ffffff"
  print-text: "#000000"
typography:
  monospace-screen:
    fontFamily: "JetBrains Mono, Menlo, Consolas, Courier New, monospace"
    fontSize: "14px"
    lineHeight: "1.3"
  serif-print:
    fontFamily: "Charter, Source Serif Pro, Liberation Serif, Times New Roman, serif"
    fontSize: "14px"
    lineHeight: "1.35"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  retro-button:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral}"
    rounded: "0px"
    padding: "8px 16px"
  retro-button-hover:
    backgroundColor: "#27272a"
  retro-button-active:
    backgroundColor: "#3f3f46"
  start-screen-overlay:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral}"
  gamepad-indicator-active:
    textColor: "{colors.accent}"
  gamepad-indicator-inactive:
    textColor: "{colors.dark}"
  cv-page-print:
    backgroundColor: "{colors.print-bg}"
    textColor: "{colors.print-text}"
---

## Overview

A retro pixel-art aesthetic based on Lisa: The Painful, emphasizing stout slouched figures, heavy 1px sticker outlines, and a desaturated dark palette. A clean split exists between this screen-only monospace game interface and the print-only Harvard-style serif layout.

## Colors

- **Primary (#1c1c1f):** Screen backdrop. Muted, desaturated deep charcoal.
- **Secondary (#a1a1aa):** Slate gray for secondary typography and disabled icons.
- **Accent (#eab308):** Golden-yellow retro highlight for unlocked abilities and active gamepad signals.
- **Neutral (#f4f4f5):** Primary off-white text color to prevent glare.
- **Dark (#09090b):** Crisp black outline color (for 1px sticker borders and block shadows).
- **Print Background (#ffffff):** High contrast white for physical paper.
- **Print Text (#000000):** Jet black ink for crisp readable serif typography.

## Typography

- **Screen UI (Monospace):** Styled with JetBrains Mono or local equivalents. Gives a pure programmatic, raw retro-terminal aesthetic to backpack inventories, telemetry overlays, and start screens.
- **Print Layout (Serif):** High-density classical serif type stack centered on Charter or Source Serif Pro to enforce the Harvard CV contract in physical print outputs. Spec values are normalized to `14px` for machine token compatibility, but compile to standard `10.5pt` in the `print.css` stylesheet.

## Layout & Spacing

- **Margins**: Physical margins are locked at `1.6cm 2cm` inside `print.css` to respect standard resume guidelines.
- **Z-Indices**:
  - `canvas`: base
  - `start-screen`: `z-index: 15`
  - `backpack-hud`: `z-index: 20`
  - `modal-dialog`: `z-index: 30`

## Components

- **`retro-button`**: Solid blocky button without rounding, bordered by `border: 2px solid {colors.dark}` and carrying an unblurred offset box-shadow.
- **`start-screen-overlay`**: Full-screen overlay spanning `#start-screen` with a high `z-index` that handles the slide-up vertical transit.
