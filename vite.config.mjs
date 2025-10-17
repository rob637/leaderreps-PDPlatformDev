// vite.config.mjs  (rename your existing vite.config.* to this)
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: { outDir: 'build' }
})