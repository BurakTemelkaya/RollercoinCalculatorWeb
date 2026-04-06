import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Custom domain için base path ayarı
  base: '/',
  build: {
    target: "es2015",
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
          'vendor-helmet': ['react-helmet-async'],
        }
      }
    }
  }
})