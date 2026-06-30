import base from '../../eslint.config';

export default [
  ...base,
  {
    // Recommended to define the the files for the rules
    files: ['**/*.ts', '**/*.js', '**/*.mjs'],
    rules: {},
  },
];
