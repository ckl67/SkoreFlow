import js from '@eslint/js';

export default [
  {
    ignores: ['**/node_modules/**', '**/venv/**', '**/dist/**', '**/build/**'],
  },

  js.configs.recommended,

  {
    rules: {
      'no-undef': 'error',
      'no-unused-vars': 'warn',
      'no-console': 'off',
    },
  },
];
