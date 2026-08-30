import DialogOverlayDemo from '../../../../../../.storybook/DialogOverlayDemo.astro';

export default {
  title: 'UI/Organisms/DialogOverlay',
  component: DialogOverlayDemo,
  parameters: {
    docs: {
      description: {
        component:
          'NPC dialog overlay (fixed bottom box + yellow name tag). The engine fills `dialog-npc-name` / `dialog-text` and advances with Space / gamepad A via `activeDialogStore`; this story shows the chrome with sample copy.',
      },
    },
  },
};

export const Spanish = {
  args: {
    locale: 'es',
    npcName: 'Mentora',
    text: 'Bienvenido al viaje. Recorre el mapa, habla con tus colegas y desbloquea habilidades de cada entorno.',
  },
};

export const English = {
  args: {
    locale: 'en',
    npcName: 'Mentor',
    text: 'Welcome to the journey. Walk the map, talk to your coworkers and unlock skills from each environment.',
  },
};