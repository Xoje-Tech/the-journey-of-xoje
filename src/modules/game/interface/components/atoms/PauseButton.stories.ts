import PauseButton from './PauseButton.astro';

export default {
  title: 'UI/Atoms/Buttons/PauseButton',
  component: PauseButton,
  parameters: {
    docs: {
      description: {
        component:
          'HUD pause control. Its container stays `display: none` until the Nanostores `isStartedStore` subscription reveals it; the preview forces it visible for cataloging.',
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