#!/usr/bin/env node
/**
 * print-preview-headless.mjs
 *
 * Slice 1 — genera PDFs de /es/ y /en/ usando el chromium del sistema,
 * sin instalar playwright. Equivalente a hacer Ctrl+P en el navegador
 * pero automatizable.
 *
 * Uso:
 *   node scripts/print-preview-headless.mjs
 *
 * Salida:
 *   tmp/print-preview-es.pdf
 *   tmp/print-preview-en.pdf
 *
 * Requiere:
 *   - chromium en /usr/bin/chromium (CachyOS)
 *   - pnpm dev corriendo en localhost:4321
 *
 * Por qué NO playwright:
 *   - Es ~250 MB de binarios descargados por primera vez
 *   - El proyecto usa doctrine "lightweight" (no Playwright, engram 402)
 *   - Chromium --headless --print-to-pdf hace exactamente lo que necesitamos
 */

import { mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const CHROMIUM = '/usr/bin/chromium';
const BASE_URL = (process.env.BASE_URL ?? 'http://localhost:4321').replace(/\/$/, '');
const DEFAULT_LOCALE = 'es';
const LOCALES = /** @type {const} */ (['es', 'en']);
const OUT_DIR = resolve(process.cwd(), 'tmp');

/**
 * Build the URL for a given locale respecting the i18n routing contract.
 * Astro's `prefixDefaultLocale: false` means the default locale (es) lives
 * at the root `/`, while other locales are prefixed (e.g. `/en/`).
 *
 * @param {string} locale
 * @returns {string}
 */
function urlForLocale(locale) {
  if (locale === DEFAULT_LOCALE) {
    return `${BASE_URL}/`;
  }
  return `${BASE_URL}/${locale}/`;
}

/**
 * @param {string} locale
 * @param {string} outPath
 * @returns {Promise<void>}
 */
function renderPdf(locale, outPath) {
  const url = urlForLocale(locale);
  console.log(`[print-preview] ${locale} → ${outPath}`);
  console.log(`[print-preview]   url=${url}`);

  return new Promise((resolveP, rejectP) => {
    const args = [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--hide-scrollbars',
      // Forzar @media print vía emulateMedia (Chromium 96+)
      '--print-to-pdf-no-header',
      // NO usar --no-pdf-header-footer (default), queremos paginación limpia
      `--print-to-pdf=${outPath}`,
      url,
    ];

    const child = spawn(CHROMIUM, args, { stdio: ['ignore', 'pipe', 'pipe'] });

    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', rejectP);
    child.on('exit', (code) => {
      if (code === 0) {
        console.log(`[print-preview] ${locale} OK (exit 0)`);
        resolveP();
      } else {
        rejectP(new Error(`chromium exit ${code} for ${locale}\nstderr: ${stderr}`));
      }
    });
  });
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  for (const locale of LOCALES) {
    const outPath = resolve(OUT_DIR, `print-preview-${locale}.pdf`);
    // emulateMedia=print se aplica vía flag Chromium --emulate-media=print
    // (Chromium 96+). Lo agregamos acá para que respete @page/@media print.
    await renderPdfWithMedia(locale, outPath);
  }

  console.log('[print-preview] done');
}

/**
 * Variante que pasa --emulate-media=print para que el PDF se renderee
 * como si el usuario hubiera hecho Ctrl+P (activa los estilos @media print).
 *
 * @param {string} locale
 * @param {string} outPath
 */
function renderPdfWithMedia(locale, outPath) {
  const url = urlForLocale(locale);
  console.log(`[print-preview] ${locale} → ${outPath}`);
  console.log(`[print-preview]   url=${url}  (media: print)`);

  return new Promise((resolveP, rejectP) => {
    const args = [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--hide-scrollbars',
      '--no-pdf-header-footer',
      '--virtual-time-budget=2000',
      `--emulate-media=print`,
      `--print-to-pdf=${outPath}`,
      url,
    ];

    const child = spawn(CHROMIUM, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', (c) => {
      stderr += c.toString();
    });

    child.on('error', rejectP);
    child.on('exit', (code) => {
      if (code === 0) {
        console.log(`[print-preview] ${locale} OK (exit 0)`);
        resolveP();
      } else {
        rejectP(new Error(`chromium exit ${code} for ${locale}\nstderr: ${stderr.slice(0, 500)}`));
      }
    });
  });
}

main().catch((err) => {
  console.error(`[print-preview] FATAL: ${err.message}`);
  process.exitCode = 1;
});
