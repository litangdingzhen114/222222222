import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: 'backend/admin-src',
  base: '/admin/',
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5175,
    proxy: {
      '/api': 'http://127.0.0.1:8787',
      '/health': 'http://127.0.0.1:8787',
      '/media': 'http://127.0.0.1:8787'
    }
  },
  build: {
    outDir: '../admin',
    emptyOutDir: true
  }
});
