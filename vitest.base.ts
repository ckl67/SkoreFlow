import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node', // default backend
    coverage: {
      reporter: ['text', 'html'],
    },
  },
});
