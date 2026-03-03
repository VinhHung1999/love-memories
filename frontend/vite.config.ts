import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../shared/src'),
    },
  },
  server: {
    port: 3338,
    allowedHosts: ['love-scrum.hungphu.work', 'dev-love-scrum.hungphu.work'],
    proxy: {
      '/api': 'http://localhost:5006',
      '/uploads': 'http://localhost:5006',
    },
  },
  preview: {
    port: 3337,
    proxy: {
      '/api': 'http://localhost:5005',
      '/uploads': 'http://localhost:5005',
    },
  },
});
