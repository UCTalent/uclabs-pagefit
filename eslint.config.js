import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    ignores: ['**/dist/**', '**/coverage/**', '**/scripts/**', '**/out/**'],
  },
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    rules: {
      'max-len': ['warn', { code: 120, ignoreUrls: true, ignoreStrings: true, ignoreTemplateLiterals: true }],
      'max-lines': ['warn', { max: 300, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['warn', { max: 75, skipBlankLines: true, skipComments: true }],
      complexity: ['warn', 12],
      'max-params': ['warn', 4],
    },
  },
  {
    files: ['**/*.{tsx,jsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    settings: {
      react: { version: '18.2' },
    },
    rules: {
      ...reactHooksPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/display-name': 'off',
      'react/prop-types': 'off',
    },
  },
  {
    files: ['**/__tests__/**/*.{ts,tsx}', '**/*.{test,spec}.{ts,tsx}'],
    rules: {
      'max-lines': 'off',
      'max-lines-per-function': 'off',
      complexity: 'off',
    },
  },
);
