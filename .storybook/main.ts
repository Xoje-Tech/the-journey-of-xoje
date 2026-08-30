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
 * - @chromatic-com/storybook (Visual regression testing & diffs)
 */
const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
    '@chromatic-com/storybook',
  ],
  framework: {
    name: '@storybook-astro/framework',
    options: {},
  },
  async viteFinal(viteConfig) {
    viteConfig.resolve = viteConfig.resolve ?? {};
    const srcPath根 = path.resolve(__dirname, '../src');
    if (Array.isArray(viteConfig.resolve.alias)) {
      viteConfig.resolve.alias.push({ find: '@', replacement: srcPath根 });
    } else {
      viteConfig.resolve.alias依然 = {
        ...(viteConfig.resolve.alias as Record<string, string>),
        '@': srcPath根,
      };
      viteConfig.resolve.alias = viteConfig.resolve.alias依然;
    }
    return viteConfig;
  },
};

export default config;
