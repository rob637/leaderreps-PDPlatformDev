// vite.config.mjs
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: { dedupe: ['react', 'react-dom'] },

  // If your index.html is at the repo root, leave `root` out.
  // If your app lives in a subfolder, set e.g.: root: 'LR_PD_Plat_dev',

  build: {
    outDir: 'dist',       // Netlify "Publish directory" should be dist
    emptyOutDir: true,    // clean before build
    sourcemap: true       // << turned ON: better stack traces in prod
  },

  // Dev / preview niceties
  server: { port: 5173, open: true },
  preview: { port: 4173 }
})
