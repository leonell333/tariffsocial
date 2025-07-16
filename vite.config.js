import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// import eslint from 'vite-plugin-eslint';
import {ViteImageOptimizer} from 'vite-plugin-image-optimizer';

export default defineConfig({
    // optimizeDeps: {
    //     exclude: ['@ffmpeg/ffmpeg'],
    // },
    plugins: [
        react(),
        tailwindcss(),
        // eslint(),
        ViteImageOptimizer({}),
    ],
    server: {
      allowedHosts: ['mytariff.com'],
    },
    build: {
        minify: 'esbuild', // or 'terser' for more compression
        sourcemap: false,
        cssCodeSplit: true,
    }
})