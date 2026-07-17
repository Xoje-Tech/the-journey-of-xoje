import { defineConfig } from 'astro/config';

// Lightweight static portfolio. No SSR adapter, no integrations — Astro 6
// content collections + native i18n are all we need.
//
// Slice 1 contract: every URL is locale-prefixed, no bare `/` rendering.
// `pages/index.astro` redirects `/` → `/es/`.
export default defineConfig({
  site: 'https://xoje-tech.github.io',
  base: process.env.NODE_ENV === 'production' ? '/the-journey-of-xoje' : '/',
  output: 'static',
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  build: {
    inlineStylesheets: 'auto',
  },
});
