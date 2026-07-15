import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  css: {
    devSourcemap: true, // <-- Added: Allows you to view your original Tailwind classes in the browser inspector
  },
  build: {
    sourcemap: false,
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: {
      // Force Vite to check regularly whether files have changed
      // Essential for shared/network folders
      usePolling: true,
    },
  },
});
