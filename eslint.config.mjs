import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPluginAstro from 'eslint-plugin-astro';
import sonarjs from 'eslint-plugin-sonarjs';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...eslintPluginAstro.configs['recommended'],
  ...eslintPluginAstro.configs['jsx-a11y-recommended'],
  sonarjs.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // DevXoje Strict Quality Standards
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
      "sonarjs/no-duplicate-string": "warn",
      "sonarjs/cognitive-complexity": ["warn", 40], // Raised for complex retro physics loops
      "sonarjs/pseudo-random": "off", // Math.random is perfectly safe for game blink intervals
      "sonarjs/void-use": "off", // void is used to suppress TS compilation unused variables
      "no-console": "warn",
    },
  },
  {
    ignores: [
      "dist/**/*",
      ".astro/**/*",
      ".atl/**/*",
      "node_modules/**/*",
      "tests/**/*",
      "scripts/**/*",
      "eslint.config.mjs",
      "vitest.config.ts",
      ".pnpmfile.cjs"
    ]
  }
);
