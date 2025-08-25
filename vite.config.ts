import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // If the app is served at a sub-path, set base to that, e.g. '/app/'.
  // For root deployment, keep '/'.
  base: '/',

  build: {
    target: 'es2019',
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'vendor-react';
            if (id.includes('@tanstack') || id.includes('zustand')) return 'vendor-state';
            if (/(d3|recharts|chart|echarts)/.test(id)) return 'vendor-charts';
            return 'vendor';
          }
        },
      },
    },
  },

  // Dev server defaults are fine; don't add inline scripts or HTML injections anywhere.
});