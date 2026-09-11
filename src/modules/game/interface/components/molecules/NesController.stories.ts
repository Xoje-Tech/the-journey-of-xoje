import NesController from './NesController.astro';

export default {
  title: 'UI/Molecules/NesController',
  component: NesController,
  parameters: {
    docs: {
      description: {
        component:
          'SVG NES controller diagram used inside the Controls guide modal, with localized pointer labels for the D-pad, Start, A and B buttons.',
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