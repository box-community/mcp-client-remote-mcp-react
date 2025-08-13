import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react({
    fastRefresh: false
  })],
  server: {
    port: 3000,
  },
  build: {
    outDir: 'build',
  },
});