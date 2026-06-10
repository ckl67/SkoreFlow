import base from '../config/vitest/vitest.base';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(
  base,
  defineConfig({
    test: {
      setupFiles: ['./vitest.setup.ts'],
      environment: 'jsdom', // ⚠️ Mandatory for React
      include: ['tests/**/*.test.ts'],
    },
  }),
);
