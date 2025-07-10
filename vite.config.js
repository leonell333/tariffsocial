import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg'],
  },
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: ['mytariff.com'],
  }
})
