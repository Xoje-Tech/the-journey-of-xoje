import ControlsGuide from './ControlsGuide.astro';

export default {
  title: 'UI/Organisms/ControlsGuide',
  component: ControlsGuide,
  parameters: {
    docs: {
      description: {
        component:
          'Controls modal (RetroModal) hosting the NES controller diagram. Opened from the start screen gamepad button; closed by the native dialog flow.',
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