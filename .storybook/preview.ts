import './preview.css';
import type { Preview } from '@storybook-astro/framework';

/**
 * Global preview configuration for The Journey of Xoje.
 * Loads the game design tokens via preview.css (imports screen.css `:root`),
 * mirroring how the Astro layout would inject them in production.
 */
const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;