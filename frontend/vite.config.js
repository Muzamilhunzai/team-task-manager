import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://team-task-manager-production-7cb8.up.railway.app/',
        changeOrigin: true,
      }
    }
  }
})