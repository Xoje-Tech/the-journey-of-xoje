import GameViewport from './GameViewport.astro';

export default {
  title: 'UI/Organisms/GameViewport',
  component: GameViewport,
  parameters: {
    docs: {
      description: {
        component:
          'Game canvas container (#game-canvas). screen.css pins it fixed and fullscreen (100dvh) behind every overlay; the engine boots inside it on DOMContentLoaded. In static builds the canvas renders empty — the live game runs in the app.',
      },
    },
  },
};

export const Canvas = {};