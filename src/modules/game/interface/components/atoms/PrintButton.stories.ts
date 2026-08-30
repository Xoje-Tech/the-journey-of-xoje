import PrintButton from './PrintButton.astro';

export default {
  title: 'UI/Atoms/Buttons/PrintButton',
  component: PrintButton,
  parameters: {
    docs: {
      description: {
        component:
          'HUD print control (window.print). Hidden until the game starts; the preview forces it visible for cataloging. Print requests are also triggered by the `print-requested` window event (P shortcut).',
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