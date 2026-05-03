import base from '../../config/vitest/vitest.base';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(
  base,
  defineConfig({
    test: {
      environment: 'node',
      include: ['**/*.test.ts'],
    },
  }),
);
