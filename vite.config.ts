import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync } from 'node:fs'
import type { Manifest } from 'vite'

// Follow static imports only. Dynamic imports belong to pages/features that
// must be fetched on demand, even when a new service worker is installing.
function getAppShellFiles() {
  const manifest: Manifest = JSON.parse(
    readFileSync(new URL('./dist/.vite/manifest.json', import.meta.url), 'utf8'),
  )
  const files = new Set(['index.html', 'icon.png'])
  const visited = new Set<string>()
  function visit(key: string) {
    if (visited.has(key)) return
    visited.add(key)
    const chunk = manifest[key]
    if (!chunk) throw new Error(`Missing app shell chunk: ${key}`)
    files.add(chunk.file)
    for (const css of chunk.css ?? []) files.add(css)
    for (const dependency of chunk.imports ?? []) visit(dependency)
  }
  const entries = Object.keys(manifest).filter(key => manifest[key].isEntry)
  if (!entries.length) throw new Error('No app entry found for PWA precaching')
  for (const entry of entries) visit(entry)
  return files
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',       // Kendi SW kodumuz var (push notifications)
      registerType: 'prompt',             // Kullanıcıya hissettirmeden route bazlı güncelleme
      srcDir: 'src',                      // SW kaynak dosya konumu
      filename: 'sw.ts',                   // SW dosya adı
      injectManifest: {
        globPatterns: ['index.html', 'icon.png', 'assets/*.{js,css}'],
        manifestTransforms: [entries => {
          const shellFiles = getAppShellFiles()
          return {
            manifest: entries.filter(entry => shellFiles.has(entry.url)),
            warnings: [],
          }
        }],
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
    manifest: true, // Used to identify the entry's static dependency graph.
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
        manualChunks(id) {
          const modulePath = id.replace(/\\/g, '/')
          if (!modulePath.includes('/node_modules/')) return

          // Match package directories, including client, JSX and CJS subpaths.
          // Resolving only the package entry can leave React's real code in index.
          if (/\/node_modules\/(react|react-dom|scheduler)\//.test(modulePath)) return 'vendor-react'
          if (/\/node_modules\/(react-router|react-router-dom)\//.test(modulePath)) return 'vendor-router'
          if (/\/node_modules\/(i18next|react-i18next|i18next-browser-languagedetector)\//.test(modulePath)) return 'vendor-i18n'
          if (modulePath.includes('/node_modules/html2canvas/')) return 'vendor-html2canvas'
          if (modulePath.includes('/node_modules/@radix-ui/')) return 'vendor-radix'
          if (/\/node_modules\/(chart.js|react-chartjs-2)\//.test(modulePath)) return 'vendor-chartjs'
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
