import SettingsPanel from './SettingsPanel.astro';

export default {
  title: 'UI/Organisms/SettingsPanel',
  component: SettingsPanel,
  parameters: {
    docs: {
      description: {
        component:
          'Settings modal (RetroModal) hosting the volume slider and gamepad status. Also opens on the gamepad Start button via the `gamepad-start` window event.',
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