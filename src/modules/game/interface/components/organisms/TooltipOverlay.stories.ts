import TooltipOverlayDemo from '../../../../../../.storybook/TooltipOverlayDemo.astro';

export default {
  title: 'UI/Organisms/TooltipOverlay',
  component: TooltipOverlayDemo,
  parameters: {
    docs: {
      description: {
        component:
          'Proximity tooltip that hovers above a collectible when the player is close. Shows category (technical / qualitative / soft / NPC), title and biome; the engine positions it from `activeTooltipStore`. This story shows the chrome with sample data.',
      },
    },
  },
};

export const TechnicalSpanish = {
  args: {
    locale: 'es',
    category: 'Habilidad Técnica',
    title: 'TypeScript',
    biome: 'Entorno / Proyecto: LCS Robotics',
  },
};

export const TechnicalEnglish = {
  args: {
    locale: 'en',
    category: 'Technical Skill',
    title: 'TypeScript',
    biome: 'Environment / Project: LCS Robotics',
  },
};