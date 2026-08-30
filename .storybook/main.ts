import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook-astro/framework';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Storybook 10 + @storybook-astro/framework (community framework with
 * first-class support for Astro 5/6/7 components, SSR via AstroContainer).
 *
 * - Stories are colocated as `*.stories.ts` next to the components under
 *   `src/modules/game/interface/components/`.
 * - The `@` alias mirrors tsconfig `paths` so stories and the Astro
 *   components they import resolve identically.
 * - Global design tokens are loaded in `preview.css` (screen.css `:root`).
 */
const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: ['@storybook/addon-a11y'],
  framework: {
    name: '@storybook-astro/framework',
    options: {},
  },
  async viteFinal(viteConfig) {
    viteConfig.resolve = viteConfig.resolve ?? {};
    viteConfig.resolve.alias = viteConfig.resolve.alias ?? {};
    viteConfig.resolve.alias['@'] = path.resolve(__dirname, '../src');
    return viteConfig;
  },
};

export default config;