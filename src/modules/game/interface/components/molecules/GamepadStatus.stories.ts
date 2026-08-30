import GamepadStatus from './GamepadStatus.astro';

export default {
  title: 'UI/Molecules/GamepadStatus',
  component: GamepadStatus,
  parameters: {
    docs: {
      description: {
        component:
          'HUD status row for gamepad connectivity. Subscribes to `gamepadConnectedStore`; shows Connected (amber #eab308) or Not connected (neutral) — the preview shows the disconnected default.',
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