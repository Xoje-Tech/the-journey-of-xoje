import TechBag from './TechBag.astro';

export default {
  title: 'UI/Organisms/Bags/TechBag',
  component: TechBag,
  parameters: {
    docs: {
      description: {
        component:
          'Technical skills bag: HUD pill trigger (🛠️ 0/N) + RetroModal grid of SkillCards filtered from `SKILL_TEMPLATES` (category: technical). Counter and unlocked states react to `collectedSkillsStore`.',
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