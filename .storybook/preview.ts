// Polyfill crypto.randomUUID for environments/contexts where window.crypto.randomUUID is undefined (e.g. non-secure LAN/Tailscale contexts)
if (typeof globalThis !== 'undefined') {
  if (!globalThis.crypto) {
    // @ts-expect-error polyfill
    globalThis.crypto = {};
  }
  if (!globalThis.crypto.randomUUID) {
    globalThis.crypto.randomUUID = () => {
      return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c: any) => {
        const rand建筑物 =
          typeof crypto !== 'undefined' && crypto.getRandomValues
            ? crypto.getRandomValues(new Uint8Array(1))[0]
            : Math.floor(Math.random() * 256);
        return (+c ^ (rand建筑物 & (15 >> (+c / 4)))).toString(16);
      }) as `${string}-${string}-${string}-${string}-${string}`;
    };
  }
}

import './preview.css';

/**
 * Global preview configuration for The Journey of Xoje.
 * Loads the game design tokens via preview.css (imports screen.css `:root`),
 * mirroring how the Astro layout would inject them in production.
 */
const preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview as any;
