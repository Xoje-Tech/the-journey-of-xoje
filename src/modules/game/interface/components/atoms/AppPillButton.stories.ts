import AppPillButton from './AppPillButton.astro';

export default {
  title: 'UI/Atoms/Buttons/AppPillButton',
  component: AppPillButton,
  parameters: {
    docs: {
      description: {
        component:
          'HUD pill button built on AppButton. Consumes the `--comp-button-pill-*` design tokens from screen.css; used for HUD bags, pause and print actions.',
      },
    },
  },
};

export const Default = {
  args: {
    type: 'button',
    slots: { default: 'Pill button' },
  },
};

export const DialogTrigger = {
  args: {
    type: 'button',
    'aria-haspopup': 'dialog',
    'aria-expanded': 'false',
    slots: { default: '<span>💼</span> Bag <strong>0/8</strong>' },
  },
};