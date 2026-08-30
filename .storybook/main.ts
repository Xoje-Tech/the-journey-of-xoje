import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook-astro/framework';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Storybook 10 + @storybook-astro/framework
 *
 * Addons:
 * - @storybook/addon-a11y (Automated accessibility checks)
 * - @storybook/addon-docs (Component documentation, prop tables, autodocs)
 *
 * Visual Regression Testing is handled 100% locally via Playwright (@playwright/test).
 */
const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
  ],
  framework: {
    name: '@storybook-astro/framework',
    options: {},
  },
  async viteFinal(viteConfig) {
    viteConfig.resolve = viteConfig.resolve ?? {};
    const srcPath = path.resolve(__dirname, '../src');
    if (Array.isArray(viteConfig.resolve.alias)) {
      viteConfig.resolve.alias.push({ find: '@', replacement: srcPath });
    } else {
      viteConfig.resolve.alias = {
        ...(viteConfig.resolve.alias as Record<string, string>),
        '@': srcPath,
      };
    }
    return viteConfig;
  },
};

export default config;
