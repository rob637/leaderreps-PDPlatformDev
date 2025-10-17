import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // FIX: Explicitly externalize lucide-react to resolve Rollup error during build
  build: {
    rollupOptions: {
      external: [
        'lucide-react' 
      ]
    }
  }
});
