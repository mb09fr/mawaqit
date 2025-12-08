import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { copyFileSync, mkdirSync, existsSync } from 'fs';

// Plugin to copy manifest and icons for Chrome Extension build
function copyExtensionFiles() {
  return {
    name: 'copy-extension-files',
    closeBundle() {
      const filesToCopy = [
        { src: 'manifest.json', dest: 'dist/manifest.json' },
        { src: 'icons/icon16.png', dest: 'dist/icons/icon16.png' },
        { src: 'icons/icon48.png', dest: 'dist/icons/icon48.png' },
        { src: 'icons/icon128.png', dest: 'dist/icons/icon128.png' },
      ];

      filesToCopy.forEach(({ src, dest }) => {
        const destDir = path.dirname(dest);
        if (!existsSync(destDir)) {
          mkdirSync(destDir, { recursive: true });
        }
        if (existsSync(src)) {
          copyFileSync(src, dest);
          console.log(`Copied ${src} to ${dest}`);
        }
      });
    }
  };
}

// Plugin to copy PWA files
function copyPWAFiles() {
  return {
    name: 'copy-pwa-files',
    closeBundle() {
      const filesToCopy = [
        { src: 'public/pwa-manifest.json', dest: 'dist-pwa/pwa-manifest.json' },
        { src: 'public/sw.js', dest: 'dist-pwa/sw.js' },
        { src: 'public/icons/icon-192.png', dest: 'dist-pwa/icons/icon-192.png' },
        { src: 'public/icons/icon-512.png', dest: 'dist-pwa/icons/icon-512.png' },
        { src: 'icons/icon48.png', dest: 'dist-pwa/icons/icon48.png' },
        { src: 'icons/icon128.png', dest: 'dist-pwa/icons/icon128.png' },
      ];

      filesToCopy.forEach(({ src, dest }) => {
        const destDir = path.dirname(dest);
        if (!existsSync(destDir)) {
          mkdirSync(destDir, { recursive: true });
        }
        if (existsSync(src)) {
          copyFileSync(src, dest);
          console.log(`[PWA] Copied ${src} to ${dest}`);
        }
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const isPWA = mode === 'pwa';

  return {
    build: {
      outDir: isPWA ? 'dist-pwa' : 'dist',
      rollupOptions: {
        input: {
          popup: path.resolve(__dirname, 'index.html'),
        },
        output: {
          entryFileNames: 'assets/[name].js',
          chunkFileNames: 'assets/[name].js',
          assetFileNames: 'assets/[name].[ext]'
        }
      },
      minify: 'terser',
      terserOptions: {
        mangle: false
      }
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      isPWA ? copyPWAFiles() : copyExtensionFiles(),
      isPWA && VitePWA({
        registerType: 'autoUpdate',
        injectRegister: null, // We handle registration in index.html
        manifest: false, // We use our own manifest file
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/api\.aladhan\.com\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 // 24 hours
                }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-stylesheets'
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-webfonts',
                expiration: {
                  maxEntries: 30,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                }
              }
            }
          ]
        }
      })
    ].filter(Boolean),
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});