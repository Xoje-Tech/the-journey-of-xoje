import VolumeSlider from './VolumeSlider.astro';

export default {
  title: 'UI/Atoms/Inputs/VolumeSlider',
  component: VolumeSlider,
  parameters: {
    docs: {
      description: {
        component:
          'SFX volume range input bound to the Nanostores `volumeStore` (persists the value on input; initial 70). Retro-styled thumb for the dark HUD theme.',
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