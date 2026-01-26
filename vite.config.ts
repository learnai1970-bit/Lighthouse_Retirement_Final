import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // This specifically fixes the "React is not defined" error
      jsxRuntime: 'automatic',
    }),
  ],
  esbuild: {
    // Second layer of defense for the white screen
    jsx: 'automatic',
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});