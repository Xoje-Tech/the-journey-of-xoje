import QualBag from './QualBag.astro';

export default {
  title: 'UI/Organisms/Bags/QualBag',
  component: QualBag,
  parameters: {
    docs: {
      description: {
        component:
          'Qualitative skills bag: HUD pill trigger (💼 0/N) + RetroModal grid of SkillCards filtered from `SKILL_TEMPLATES` (category: qualitative). The counter and unlocked card states react to `collectedSkillsStore`.',
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