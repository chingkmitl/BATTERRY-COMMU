import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');

  // Robustly resolve API Key from various possible sources
  // 1. env.API_KEY (from .env file loaded by Vite)
  // 2. process.env.API_KEY (from system/deployment environment like Vercel)
  // 3. VITE_ prefixed versions as fallback (common convention)
  // 4. Hardcoded fallback as requested
  const apiKey = env.API_KEY || process.env.API_KEY || env.VITE_API_KEY || process.env.VITE_API_KEY || "AIzaSyCGVCfNePtft0egn2OW2WLYGnDVZzQkIXY";

  return {
    plugins: [react()],
    define: {
      // Vital for using process.env.API_KEY in client-side code as required by Gemini SDK
      // Using JSON.stringify to ensure it's injected as a string literal
      'process.env.API_KEY': JSON.stringify(apiKey),
    },
    resolve: {
      alias: {
        // Ensure specific alias if needed
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    }
  };
});