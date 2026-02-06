import prettier from 'eslint-config-prettier';
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  {
    ignores: ['**/dist/**', '**/build/**', 'google-cloud-sdk/**', 'corporate/**', 'reppy/**', 'passcpa/**', 'e2e-tests/**', 'functions/**', 'debug-*.js'],
  },
  {
    files: ['**/*.{js,jsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.node,
        __APP_VERSION__: 'readonly',
      },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]' }],
      'react-refresh/only-export-components': 'warn',
      // UI Library Enforcement: Restrict imports of Button, Card to canonical UI library
      'no-restricted-imports': ['warn', {
        patterns: [
          {
            group: ['**/shared/Button*', '**/shared/Card*', '**/shared/UI*', '**/uiKit*', '**/CorporateUI*'],
            message: 'Import UI components from "@ui" or "../ui" instead. Use the canonical UI library at src/components/ui.'
          }
        ]
      }],
    },
  },
  prettier,
];
