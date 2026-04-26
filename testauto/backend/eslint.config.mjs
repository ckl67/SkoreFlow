import base from '../../config/eslint/base.mjs';

export default [
  ...base,
  {
    // Recommended to define the the files for the rules
    files: ['**/*.ts', '**/*.js', '**/*.mjs'],
    rules: {},
  },
];
