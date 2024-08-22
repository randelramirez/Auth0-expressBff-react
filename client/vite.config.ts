import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { // add this code
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true // changes host, referer remain the same
  
      },
      '/auth': {
        target: 'http://localhost:3000',
        changeOrigin: true // changes host, referer remain the same
  
      }
    }
  }
})
