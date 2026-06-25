import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    sourcemap: false,
  },
  server: {
    port: 5173,
    proxy: {
      //To connect to Backend, We use "Proxy Vite" technique as ‘workaround’ see document: cors.md
      '/api': {
        target: 'http://192.168.1.138:8080',
        changeOrigin: true,
        secure: false,
      },
    },
    watch: {
      // Force Vite to check regularly whether files have changed
      // Essential for shared/network folders
      usePolling: true,
    },
  },
});
