import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages için base path ayarı
  base: '/RollercoinCalculatorWeb/',
  build: {
    // Disable inlining of SVGs as base64 for production builds
    assetsInlineLimit: (filePath) => {
      if (filePath.endsWith('.svg') || filePath.endsWith('.png')) {
        return false;
      }
      return undefined;
    }
  }
})