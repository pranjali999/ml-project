import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Same-origin API in dev — avoids browser CORS issues with http://127.0.0.1:8000
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/isric': {
        target: 'https://rest.isric.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/isric/, ''),
      },
    },
  },
})
