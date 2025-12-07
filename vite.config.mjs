// vite.config.mjs - OPTIMIZED for performance and security
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import fs from 'node:fs';

const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));

export default defineConfig({
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
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'icons/*.svg', 'images/*.png'],
      
      // Inject service worker registration with update detection
      injectRegister: 'auto',
      
      // Generate manifest from public/manifest.webmanifest
      manifest: false, // Use existing manifest.webmanifest
      
      workbox: {
        // Ensure the new service worker takes control immediately
        clientsClaim: true,
        skipWaiting: true,

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
          // Firestore API - Network First (fresh data, fallback to cache)
          {
            urlPattern: ({ url }) => 
              url.origin === 'https://firestore.googleapis.com' ||
              url.origin.includes('googleapis.com'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firestore-api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
              networkTimeoutSeconds: 10,
            },
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
      output: {
        manualChunks: {
          // Vendor chunks
          vendor: ['react', 'react-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          ui: ['lucide-react'],
          
          // Feature chunks for better caching
          dashboard: ['./src/components/screens/Dashboard.jsx'],
          labs: ['./src/components/screens/CoachingLabScreen.jsx'],
          admin: ['./src/components/screens/AdminDataMaintenance.jsx']
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
    chunkSizeWarningLimit: 1000,
    
    // Minification
    minify: 'esbuild',
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
  }
})