import RetroModal from './RetroModal.astro';

export default {
  title: 'UI/Atoms/Modal/RetroModal',
  component: RetroModal,
  parameters: {
    docs: {
      description: {
        component:
          'Retro-styled native <dialog> used by Settings, Controls and the skill bags. The app opens it at runtime via showModal() (focus trap, gamepad A/B handling); the preview renders it as a static block so the chrome and slot content are visible.',
      },
    },
  },
};

export const Default = {
  args: {
    id: 'sample-modal',
    title: 'Settings',
    closeId: 'close-sample-modal',
    slots: { default: '<p>Modal body content goes here.</p>' },
  },
};

export const WithTrigger = {
  args: {
    id: 'triggered-modal',
    title: 'Controls',
    closeId: 'close-triggered-modal',
    triggerId: 'open-controls',
    slots: {
      default:
        '<p>This dialog is wired to a trigger button via <code>triggerId</code> in the real app.</p>',
    },
  },
};