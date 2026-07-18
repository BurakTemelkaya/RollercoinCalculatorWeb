import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',       // Kendi SW kodumuz var (push notifications)
      registerType: 'autoUpdate',          // Otomatik güncelle
      srcDir: 'src',                       // SW kaynak dosya konumu
      filename: 'sw.ts',                   // SW dosya adı
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
      },
      manifest: false,                     // Mevcut public/manifest.json'u kullan
      devOptions: {
        enabled: false,                    // Dev'de SW kapalı (mevcut davranış korunur)
      },
    }),
  ],
  // Custom domain için base path ayarı
  base: '/',
  css: {
    devSourcemap: false
  },
  build: {
    target: "es2015",
    chunkSizeWarningLimit: 1000,
    // Disable inlining of SVGs as base64 for production builds
    assetsInlineLimit: (filePath) => {
      if (filePath.endsWith('.svg') || filePath.endsWith('.png')) {
        return false;
      }
      return undefined;
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-router': ['react-router-dom'],
          'vendor-i18n': ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
          'vendor-html2canvas': ['html2canvas'],
          'vendor-radix': ['@radix-ui/react-select'],
          'vendor-chartjs': ['chart.js', 'react-chartjs-2'],
        }
      }
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://api.rollercoincalculator.app',
        changeOrigin: true,
        secure: false
      }
    }
  }
})