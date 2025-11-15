import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  base: '/shiny-octo-robot/',
  plugins: [react()],
  resolve: {
    alias: {
      '@engine': path.resolve(__dirname, '../src'),
    },
  },
});
