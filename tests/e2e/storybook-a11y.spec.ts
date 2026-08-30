import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Automated Accessibility (a11y) Audits against Storybook UI Components.
 * Scans components for WCAG 2.1 Level A and AA compliance using Axe Core.
 */
test.describe('Storybook UI — Automated WCAG 2.1 AA Accessibility Audits', () => {
  const stories = [
    { name: 'StartScreen (Spanish)', url: '/iframe.html?id=ui-organisms-startscreen--spanish' },
    { name: 'StartScreen (English)', url: '/iframe.html?id=ui-organisms-startscreen--english' },
    { name: 'HUD Canvas (Idle)', url: '/iframe.html?id=ui-hud-canvashud--idle' },
    { name: 'RetroButton (Default)', url: '/iframe.html?id=ui-atoms-buttons-retrobutton--default' },
    { name: 'RetroModal (Default)', url: '/iframe.html?id=ui-atoms-modal-retromodal--default' },
    { name: 'VolumeSlider (Default)', url: '/iframe.html?id=ui-atoms-inputs-volumeslider--default' },
    { name: 'ControlsGuide (Default)', url: '/iframe.html?id=ui-organisms-controlsguide--default' },
    { name: 'DialogOverlay (Default)', url: '/iframe.html?id=ui-organisms-dialogoverlay--default' },
  ];

  for (const story of stories) {
    test(`A11y Audit: ${story.name} satisfies WCAG 2.1 AA standards`, async ({ page }) => {
      await page.goto(story.url);
      await page.waitForLoadState('domcontentloaded');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      expect(results.violations).toEqual([]);
    });
  }
});
