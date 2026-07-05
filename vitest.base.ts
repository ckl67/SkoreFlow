import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    //Allows to use test functions such as `describe`, `it`, `expect` or `test` directly in your test files
    // without having to import them at the top of each file every time
    globals: true,
    // Indicates that the test runtime environment is Node.js
    environment: 'node',
    //Configure the code coverage ratio
    // 'text' will display a summary table directly in your terminal.
    // 'html' will generate a folder containing interactive web pages
    coverage: {
      reporter: ['text', 'html'],
    },
  },
});
