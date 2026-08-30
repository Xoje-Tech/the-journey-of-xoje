import StartScreen from './StartScreen.astro';

export default {
  title: 'UI/Organisms/StartScreen',
  component: StartScreen,
  parameters: {
    docs: {
      description: {
        component:
          'Fullscreen start menu (fixed, 100dvh). Retro pixel background + 2x2 grid of RetroButtons (Start / Download CV / Settings / Controls) with keyboard and gamepad 2D navigation. Slides up when `isStartedStore` turns true.',
      },
    },
  },
};

export const Spanish = {
  args: { locale: 'es' },
};

export const English = {
  args: { locale: 'en' },
};