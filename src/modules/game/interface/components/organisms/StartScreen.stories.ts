import StartScreen from './StartScreen.astro';
import { expect, userEvent, within } from 'storybook/test';

export default {
  title: 'UI/Organisms/StartScreen',
  component: StartScreen,
  parameters: {
    docs: {
      description: {
        component:
          'Fullscreen start menu (fixed, 100dvh). Retro pixel background + 2x2 grid of RetroButtons (Start / Download CV / Settings / Controls) with keyboard and gamepad 2D navigation. Slides up when `isStartedStore` turns true.',
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

export const InteractiveNavigation = {
  args: { locale: 'es' },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    const startBtn = canvas.getByRole('button', { name: /Comenzar Juego/i });
    const settingsBtn = canvas.getByRole('button', { name: /Ajustes/i });
    await expect(startBtn).toBeInTheDocument();
    await expect(settingsBtn).toBeInTheDocument();
    await userEvent.hover(startBtn);
    await userEvent.hover(settingsBtn);
  },
};
