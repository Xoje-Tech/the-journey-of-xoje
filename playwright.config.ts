import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E config for the-journey-of-xoje.
 *
 * - `testDir: tests/e2e` — isolated E2E suite; Vitest unit tests stay in
 *   `tests/` and are untouched by this runner.
 * - `webServer` reuses `pnpm preview` (the same static bundle the
 *   print-preview headless harness drives). Port 4321 matches the
 *   existing `node scripts/print-preview-headless.mjs` flow.
 * - `use.baseURL: http://127.0.0.1:4321/the-journey-of-xoje` because
 *   astro preview mounts the static bundle at that subpath (not `/`).
 *   `astro.config.mjs` ships with `routing.prefixDefaultLocale: false`,
 *   so the ES locale is served from the subpath root and EN from
 *   `/en/`.
 * - chromium only — we have no cross-browser rendering targets; the
 *   game canvas is HTML5 + canvas, but the chrome (overlay, HUD,
 *   dialog, tooltip) is the contract under test and chromium covers
 *   it.
 * - `workers: 1` — the static preview server is shared state; parallel
 *   tests would race on `isStartedStore` + RAF callbacks.
 */
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['json', { outputFile: 'playwright-report/results.json' }]],
  use: {
    // baseURL is '/' because the dev server (configured above) serves
    // the bundle at the root. The production build mounts at
    // /the-journey-of-xoje, but the E2E suite runs against dev.
    baseURL: 'http://127.0.0.1:4321',
    actionTimeout: 5_000,
    navigationTimeout: 15_000,
    viewport: { width: 1280, height: 800 },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    // The production bundle uses `base: '/the-journey-of-xoje'` which
    // makes a bare '/' route 404. The dev server uses `base: '/'` so
    // the bundle is mounted at the root. We pick dev here because
    //   (a) the test cares about runtime DOM state, not prod
    //       optimizations;
    //   (b) `pnpm dev` returns fast (Astro's HMR layer is fine for
    //       our static content);
    //   (c) a bare-`/` baseline avoids the 404 trap and the test
    //       can use a single baseURL for both locales.
    command: 'pnpm dev --port 4321 --host 127.0.0.1',
    url: 'http://127.0.0.1:4321/',
    reuseExistingServer: !process.env.CI,
    timeout: 90_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
