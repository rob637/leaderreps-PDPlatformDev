// vite.config.mjs - OPTIMIZED for performance and security
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import fs from 'node:fs';

const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  
  return {
  define: {
    '__APP_VERSION__': JSON.stringify(packageJson.version),
    global: 'globalThis'
  },
  plugins: [
    {
      name: 'generate-version-json',
      writeBundle() {
        if (!fs.existsSync('build')) fs.mkdirSync('build');
        fs.writeFileSync('build/version.json', JSON.stringify({ version: packageJson.version }));
      }
    },
    {
      // Convert the eager <link rel="stylesheet"> for the main CSS bundle into
      // an async preload+swap to eliminate render-blocking CSS. The boot
      // skeleton is fully styled inline so initial paint is unaffected.
      name: 'async-css-link',
      apply: 'build',
      transformIndexHtml(html) {
        return html.replace(
          /<link rel="stylesheet" crossorigin href="([^"]+\.css)">/g,
          (_m, href) =>
            `<link rel="preload" as="style" href="${href}" onload="this.onload=null;this.rel='stylesheet'">` +
            `<noscript><link rel="stylesheet" href="${href}"></noscript>`
        );
      }
    },
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icons/*.png', 'icons/*.svg', 'images/*.png'],
      
      // Inject service worker registration with update detection
      injectRegister: 'auto',
      
      // Generate manifest from public/manifest.webmanifest
      manifest: false, // Use existing manifest.webmanifest
      
      workbox: {
        // clientsClaim: false - Don't auto-take control, wait for user to update
        clientsClaim: false,
        // skipWaiting: false - Let the user decide when to update (Google-style)
        // The UpdateNotification component will prompt the user
        skipWaiting: false,

        // Comprehensive glob patterns for all assets
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,jpg,jpeg,gif,webp,woff,woff2}'
        ],
        
        // Maximum cache size (50MB)
        maximumFileSizeToCacheInBytes: 50 * 1024 * 1024,
        
        // Navigation fallback
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [
          /^\/_/,
          /\/[^/?]+\.[^/]+$/,
          /^\/api\//
        ],
        
        // Runtime caching strategies
        runtimeCaching: [
          // Version check - Network Only (always fetch fresh version)
          {
            urlPattern: ({ url }) => url.pathname.endsWith('version.json'),
            handler: 'NetworkOnly',
          },
          
          // Firebase Auth - Network Only (always fresh auth state)
          {
            urlPattern: ({ url }) => 
              url.origin.includes('identitytoolkit.googleapis.com') ||
              url.origin.includes('securetoken.googleapis.com'),
            handler: 'NetworkOnly',
          },
          
          // Google Fonts CSS - Stale While Revalidate
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
          
          // Google Fonts - Cache First (font files rarely change)
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          
          // Images - Cache First with fallback
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          
          // App navigation - Network First
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages-cache',
              networkTimeoutSeconds: 5,
            },
          },
        ],
        
        // Clean up outdated caches automatically
        cleanupOutdatedCaches: true,
      },
      
      // Development options
      devOptions: {
        enabled: false, // Disable SW in development for easier debugging
        type: 'module',
      },
    }),
  ],
  
  resolve: { 
    dedupe: ['react', 'react-dom'],
    alias: {
      '@': '/src',
      '@ui': '/src/components/ui',
      '@components': '/src/components',
      '@hooks': '/src/hooks',
      '@utils': '/src/utils',
      '@services': '/src/services',
      '@lib': '/src/lib',
      '@config': '/src/config'
    }
  },

  // PERFORMANCE: Optimized build configuration
  build: {
    outDir: 'build', 
    emptyOutDir: true,
    sourcemap: false,
    
    // Bundle size optimization
    rollupOptions: {
      input: {
        main: './index.html',
      },
      output: {
        manualChunks: (id) => {
          // Vendor chunks - split heavy dependencies
          if (id.includes('node_modules')) {
            // React DOM - must come before general react check
            if (id.includes('react-dom') || id.includes('scheduler')) {
              return 'react-dom';
            }
            // React core - only the main package
            if (id.includes('/node_modules/react/')) {
              return 'react';
            }
            // Firebase - large but essential, keep together
            if (id.includes('firebase')) {
              return 'firebase';
            }
            // Lucide icons - very large, separate chunk
            if (id.includes('lucide-react')) {
              return 'icons';
            }
            // Framer Motion - animations
            if (id.includes('framer-motion')) {
              return 'motion';
            }
            // Date/time utilities
            if (id.includes('date-fns') || id.includes('dayjs')) {
              return 'dates';
            }
            // Heavy admin/lazy-only libs — give each its own chunk so they
            // don't sink into the eagerly-preloaded `vendor` chunk.
            if (id.includes('recharts')) return 'recharts';
            if (id.includes('react-live') || id.includes('@babel') || id.includes('prismjs')) return 'react-live';
            if (id.includes('@monaco-editor') || id.includes('monaco-editor')) return 'monaco';
            if (id.includes('@google/genai') || id.includes('openai')) return 'ai-sdk';
            if (id.includes('@tanstack')) return 'tanstack';
            if (id.includes('@dnd-kit')) return 'dnd-kit';
            if (id.includes('marked') || id.includes('dompurify')) return 'markdown';
            if (id.includes('cmdk')) return 'cmdk';
            if (id.includes('csv-parse')) return 'csv';
            // Other vendor - keep small
            return 'vendor';
          }
          
          // Note: We intentionally do NOT manually chunk admin screens.
          // Each admin screen is lazy-loaded via ScreenRouter and forms its
          // own chunk naturally, which keeps the eager critical-path bundle
          // free of admin code for non-admin users. Forcing them into a
          // single 'admin' chunk caused that chunk to become the de-facto
          // common chunk for Vite runtime helpers (__vitePreload), which
          // pulled the entire admin bundle into the eager preload graph.
          
          // Constants/data - shared across app, must initialize first
          if (id.includes('/data/Constants') || id.includes('/data/')) {
            return 'shared';
          }

          // widgetTemplates is imported by FeatureProvider (eager) AND by
          // several admin screens. Force it into the shared chunk so that
          // eager FeatureProvider doesn't drag the admin chunk into the
          // critical path.
          if (id.includes('/config/widgetTemplates')) {
            return 'shared';
          }
          
          // Dashboard - critical path, separate chunk
          if (id.includes('Dashboard') || id.includes('/dashboard/')) {
            return 'dashboard';
          }
          
          // Development Plan - large, separate chunk
          if (id.includes('DevelopmentPlan') || id.includes('/devplan/')) {
            return 'devplan';
          }
          
          // Coaching features
          if (id.includes('Coaching') || id.includes('/coaching/')) {
            return 'coaching';
          }
          
          // Widgets - commonly shared
          if (id.includes('/widgets/')) {
            return 'widgets';
          }
          
          // UI components - shared across app
          if (id.includes('/components/ui/')) {
            return 'ui';
          }
        },
        
        // Asset file naming
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      },
      
      // External dependencies (for CDN loading if needed)
      external: []
    },
    
    // Performance thresholds
    chunkSizeWarningLimit: 500,
    
    // Minification with better compression
    minify: 'esbuild',
    target: 'es2020',
    
    // Drop console.log statements in production builds
    // Keeps console.error and console.warn for debugging production issues
    esbuild: {
      drop: isProduction ? ['debugger'] : [],
      pure: isProduction ? ['console.log', 'console.debug', 'console.info'] : [],
    },
  },

  // Dev server configuration
  server: { 
    port: 5173, 
    open: true,
    hmr: {
      overlay: true
    }
  },
  preview: { port: 4173 },
  
  // Test configuration
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
  }
}});