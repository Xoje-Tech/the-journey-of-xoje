import AppButton from './AppButton.astro';

export default {
  title: 'UI/Atoms/Buttons/AppButton',
  component: AppButton,
  parameters: {
    docs: {
      description: {
        component:
          'Base button primitive with zero-specificity reset styles (:where). Use as the foundation for pill / retro / icon buttons; inject variants via the `class` prop.',
      },
    },
  },
};

export const Default = {
  args: {
    type: 'button',
    slots: { default: 'Press me' },
  },
};

export const MenuTrigger = {
  args: {
    type: 'button',
    'aria-haspopup': 'dialog',
    'aria-expanded': 'false',
    slots: { default: 'Open menu' },
  },
};