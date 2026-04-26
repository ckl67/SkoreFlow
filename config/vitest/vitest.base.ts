import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node', // défaut backend
    coverage: {
      reporter: ['text', 'html'],
    },
  },
});
