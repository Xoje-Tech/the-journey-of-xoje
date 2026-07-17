---
type: architecture
title: The Print CSS & Harvard Margins Contract
description: "Walkthrough of the A4 print sheet margins, Charter typography stacks, and automated print CSS validation."
timestamp: 2026-07-17T15:38:00Z
tags: [print, css, pdf, harvard-style]
---

# The Print CSS & Harvard Margins Contract

A primary goal of *The Journey of Xoje* is that the portfolio's **print output IS** the physical, Harvard-style CV of the developer. When a user presses `Ctrl+P`, the web browser compiles an elegant serif document.

---

## 1. The Print Contract Rules (`print.css`)

The print-specific stylesheet (`src/styles/print.css`) overrides the page during printing. It enforces the following rules:

1.  **Strict Margins**: Locked at `@page { size: A4; margin: 1.6cm 2cm; }` for a professional academic layout.
2.  **Classic Serif Stack**: Uses `font-family: Charter, Source Serif Pro, Liberation Serif, Times New Roman, serif;` with a line-height of `1.35` and font size of `10.5pt`.
3.  **Hide HUD Elements**: Targets all gameplay, navigation header, and locale-switching elements using `.no-print { display: none !important; }`.
4.  **Avoid Page-Breaks inside Sections**: Keeps experience blocks solid by using `section[data-cv-section] { page-break-inside: avoid; }`.
5.  **Remove Link URLs**: Prevents the browser from expanding anchors by utilizing `a[href]::after { content: ''; }`.

---

## 2. Automated Print CSS Verification (Vitest)

We enforce this contract deterministically in our continuous integration pipeline using a custom test suite (`tests/print-contract.test.ts`):

```typescript
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';

test('print.css contains Harvard margins contract', () => {
  const css = readFileSync(resolve(__dirname, '../src/styles/print.css'), 'utf8');
  expect(css).toMatch(/size\s*:\s*A4/);
  expect(css).toMatch(/margin\s*:\s*1\.6cm\s+2cm/);
  expect(css).toMatch(/\.no-print/);
});
```

To perform physical layout checks, the `print-preview-headless.mjs` script launches Chrome in headless mode with `--emulate-media=print` to export `tmp/print-preview-es.pdf` and verify page breaks and rendering byte-for-byte.
