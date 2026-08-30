import SkillCard from './SkillCard.astro';

export default {
  title: 'UI/Molecules/SkillCard',
  component: SkillCard,
  parameters: {
    docs: {
      description: {
        component:
          'Card element for a skill collectible inside the bag modals. Ships with the locked state (🔒); the bag scripts flip it to the unlocked state (✅) when the matching skill id is collected.',
      },
    },
  },
};

export const Locked = {
  args: {
    id: 'storybook',
    name: 'Storybook',
    biome: 'LCS Robotics',
  },
};