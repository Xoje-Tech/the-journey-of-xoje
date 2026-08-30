import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config specifically for Storybook Testing (Visual Regression & a11y).
 * Runs against the local Storybook instance (port 6006) without booting the Astro web server.
 */
export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: ['**/storybook-visual-regression.spec.ts', '**/storybook-a11y.spec.ts'],
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:6006',
    viewport: { width: 1280, height: 800 },
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
