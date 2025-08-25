import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'no-undef': 'error',
      'no-duplicate-imports': 'error',
      'no-redeclare': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ImportSpecifier[imported.name="default"]',
          message: 'Avoid using import { default } directly. Use `import X from "..."` instead.',
        },
      ],
      'no-use-before-define': ['error', { functions: false, classes: true, variables: true }],
    },
  }
);