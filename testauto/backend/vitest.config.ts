import base from '../../vitest.base';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(
  base,
  defineConfig({
    test: {
      environment: 'node',
      include: ['**/*.test.ts'],
      ///to exclude this file, regardless of the folder it is in
      exclude: ['**/stress.test.ts'],
    },
  })
);
