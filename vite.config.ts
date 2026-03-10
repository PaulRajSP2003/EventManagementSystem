import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://localhost:7135',
        changeOrigin: true,
        secure: false, // Allow self-signed certs
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      }
    }
  }
})
