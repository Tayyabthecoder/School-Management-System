import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'zustand',
      'axios',
      'recharts',
      'lucide-react',
      'clsx',
      '@tanstack/react-query',
    ],
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        // The end-to-end suite runs its own API on another port (see playwright.config.js).
        target: process.env.API_PROXY_TARGET || 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Vite 8 (Rolldown) wants a function here; the groups are the same as before.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (/node_modules\/(recharts|recharts-scale|react-smooth|victory-vendor|d3-[^/]+|internmap|decimal\.js-light)\//.test(id)) return 'charts'
          if (/node_modules\/lucide-react\//.test(id)) return 'icons'
          if (/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler|zustand|axios)\//.test(id)) return 'vendor'
          return undefined
        },
      },
    },
  },
})
