import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import eslint from 'vite-plugin-eslint';
import {ViteImageOptimizer} from 'vite-plugin-image-optimizer';

export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        // eslint(),
        ViteImageOptimizer({}),
    ],
    optimizeDeps: {
        include: ['firebase/firestore'],
    },
    server: {
      allowedHosts: ['mytariff.com'],
    },
    build: {
        minify: 'esbuild',
        sourcemap: false,
        cssCodeSplit: true,
    }
})

