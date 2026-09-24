import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  // Relative asset paths — required so the built app loads correctly via
  // Electron's file:// protocol, not just from a web server root. Doesn't
  // change anything about how the app is served on the web.
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
  },
});
