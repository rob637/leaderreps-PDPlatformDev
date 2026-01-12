import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/e2e-tests/**',  // Exclude Playwright E2E tests
      '**/*.spec.js',     // Exclude Playwright spec files
    ],
    include: [
      'src/**/*.{test,spec}.{js,jsx,ts,tsx}',  // Only include src tests
    ],
  },
})