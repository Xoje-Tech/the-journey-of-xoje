// Polyfill crypto.randomUUID for environments/contexts where window.crypto.randomUUID is undefined (e.g. non-secure LAN/Tailscale contexts)
if (typeof globalThis !== 'undefined') {
  if (!globalThis.crypto) {
    // @ts-expect-error polyfill
    globalThis.crypto = {};
  }
  if (!globalThis.crypto.randomUUID) {
    globalThis.crypto.randomUUID = () => {
      return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c: any) => {
        const rand =
          typeof crypto !== 'undefined' && crypto.getRandomValues
            ? crypto.getRandomValues(new Uint8Array(1))[0]
            : Math.floor(Math.random() * 256);
        return (+c ^ (rand & (15 >> (+c / 4)))).toString(16);
      }) as `${string}-${string}-${string}-${string}-${string}`;
    };
  }
}

import './preview.css';

/**
 * Standard Viewports tailored for The Journey of Xoje:
 * - Retro Canvas (800x600) for native game viewport testing
 * - Mobile Touch Viewports (375x667 & 667x375) for 100dvh & touch controls
 * - Tablet & Desktop HD for responsive UI overlays
 */
const customViewports = {
  retroCanvas: {
    name: 'Retro Canvas (800x600)',
    styles: {
      width: '800px',
      height: '600px',
    },
  },
  mobilePortrait: {
    name: 'Mobile Portrait (375x667)',
    styles: {
      width: '375px',
      height: '667px',
    },
  },
  mobileLandscape: {
    name: 'Mobile Landscape (667x375)',
    styles: {
      width: '667px',
      height: '375px',
    },
  },
  tablet: {
    name: 'Tablet iPad (768x1024)',
    styles: {
      width: '768px',
      height: '1024px',
    },
  },
  desktop1080p: {
    name: 'Desktop Full HD (1920x1080)',
    styles: {
      width: '1920px',
      height: '1080px',
    },
  },
};

const preview = {
  tags: ['autodocs'],
  parameters: {
    viewport: {
      viewports: customViewports,
      defaultViewport: 'responsive',
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview as any;
