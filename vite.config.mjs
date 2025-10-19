// vite.config.mjs
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/',                 // important for Netlify unless you deploy under a subpath
  plugins: [react()],
  // If your index.html is at the repo root, leave `root` out.
  // If your app lives in a subfolder (e.g. "LR_PD_Plat_dev"), set:
  // root: 'LR_PD_Plat_dev',

  build: {
    outDir: 'dist',       // <- Netlify expects this
    emptyOutDir: true,    // clean before build
    sourcemap: true
  },

  // Nice-to-haves for local dev:
  server: { port: 5173, open: true },
  preview: { port: 4173 }
})
