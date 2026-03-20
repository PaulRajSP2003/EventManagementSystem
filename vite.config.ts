import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'https://camp-api-prod-d8aqdmbfhqe9bpac.centralindia-01.azurewebsites.net',
        changeOrigin: true,
        secure: false,
      },
      '/notificationHub': {
        target: 'https://camp-api-prod-d8aqdmbfhqe9bpac.centralindia-01.azurewebsites.net',
        changeOrigin: true,
        secure: false,
        ws: true,
      }
    }
  }
})
