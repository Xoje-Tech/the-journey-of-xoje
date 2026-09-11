import SoftBag from './SoftBag.astro';

export default {
  title: 'UI/Organisms/Bags/SoftBag',
  component: SoftBag,
  parameters: {
    docs: {
      description: {
        component:
          'Soft skills bag: HUD pill trigger (🧠 0/N) + RetroModal grid of SkillCards filtered from `SKILL_TEMPLATES` (category: soft). Counter and unlocked states react to `collectedSkillsStore`.',
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