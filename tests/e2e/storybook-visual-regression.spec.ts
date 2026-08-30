import { test, expect } from '@playwright/test';

/**
 * Visual regression tests for Storybook UI components.
 * Drives Playwright against Storybook stories to capture pixel-perfect visual snapshots
 * without third-party cloud subscriptions (100% local, free, private).
 */
test.describe('Storybook UI — Local Visual Regression Snapshots', () => {
  test('StartScreen component matches snapshot', async ({ page }) => {
    await page.goto('/iframe.html?id=ui-organisms-startscreen--spanish');
    await expect(page.locator('#start-screen')).toBeVisible();
    await expect(page.locator('#start-screen')).toHaveScreenshot('start-screen-es.png', {
      maxDiffPixelRatio: 0.05,
    });
  });

  test('HUD CanvasOverlay component matches snapshot', async ({ page }) => {
    await page.goto('/iframe.html?id=ui-hud-canvashud--idle');
    await expect(page.locator('#storybook-root')).toBeVisible();
    await expect(page.locator('#storybook-root')).toHaveScreenshot('hud-canvas-idle.png', {
      maxDiffPixelRatio: 0.05,
    });
  });

  test('RetroButton atoms match snapshot', async ({ page }) => {
    await page.goto('/iframe.html?id=ui-atoms-buttons-retrobutton--default');
    await expect(page.locator('#storybook-root')).toBeVisible();
    await expect(page.locator('#storybook-root')).toHaveScreenshot('retro-button-default.png', {
      maxDiffPixelRatio: 0.05,
    });
  });
});
