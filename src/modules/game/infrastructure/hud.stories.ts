import HudPreview from '../../../../.storybook/HudPreview.astro';

export default {
  title: 'UI/HUD/CanvasHud',
  component: HudPreview,
  parameters: {
    docs: {
      description: {
        component:
          'Canvas-rendered debug HUD telemetry (hud.ts `formatHud`) — the exact multi-line string the engine draws with ctx.fillText: site, position (1 decimal), velocity (signed 2 decimals, negative-zero collapsed), input source and fps.',
      },
    },
  },
};

export const Idle = {
  args: {
    player: { x: 412.5, y: 187.0, vx: 0, vy: 0 },
    fps: 60,
    input: { source: 'idle', detail: '' },
  },
};

export const Moving = {
  args: {
    player: { x: 412.5, y: 187.0, vx: 2.45, vy: -0.13 },
    fps: 59,
    input: { source: 'keyboard', detail: 'W+A', debug: true },
  },
};

export const Touch = {
  args: {
    player: { x: 100.0, y: 240.0, vx: 0, vy: 0 },
    fps: 30,
    input: { source: 'touch', detail: '(150, 75)' },
  },
};