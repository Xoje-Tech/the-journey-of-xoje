import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook-astro/framework';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Storybook 10 + @storybook-astro/framework
 *
 * - Stories are colocated as `*.stories.ts` next to the components.
 * - Addons: a11y (accessibility audits) + docs (component documentation & autodocs).
 * - The `@` alias mirrors tsconfig `paths`.
 */
const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
  ],
  docs: {
    autodocs: 'tag',
  },
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
