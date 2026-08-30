import RetroButton from './RetroButton.astro';
import iconPlay from '@/assets/icons/icon-play.png';
import { expect, userEvent, within } from 'storybook/test';

export default {
  title: 'UI/Atoms/Buttons/RetroButton',
  component: RetroButton,
  parameters: {
    docs: {
      description: {
        component:
          'Pixel-cartridge button for the start screen and game menus. Accepts an optional `icon` ({ src, alt }) rendered as a crisp-edged pixel image next to the label.',
      },
    },
  },
};

export const Default = {
  args: {
    type: 'button',
    slots: { default: 'Start Game' },
  },
};

export const WithIcon = {
  args: {
    type: 'button',
    icon: { src: iconPlay.src, alt: 'Play' },
    slots: { default: 'Start Game' },
  },
};

export const InteractiveClick = {
  args: {
    type: 'button',
    icon: { src: iconPlay.src, alt: 'Play' },
    slots: { default: 'Click Me' },
  },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');
    await expect(button).toBeInTheDocument();
    await userEvent.hover(button);
    await userEvent.click(button);
  },
};

export const Submit = {
  args: {
    type: 'submit',
    slots: { default: 'Save' },
  },
};
