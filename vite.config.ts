import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages için base path ayarı
  // Eğer repository adınız "my-project" ise burayı '/my-project/' yapın.
  base: '/rollercoin-calculator/',
})
