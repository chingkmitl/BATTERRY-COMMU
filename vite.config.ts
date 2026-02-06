import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Ensure specific alias if needed, usually empty for this structure
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
});