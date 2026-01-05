import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    open: true,
    host: true, // Allow external access
    strictPort: false,
    allowedHosts: [
      'subdistinctively-unarousable-brad.ngrok-free.dev',
      '.ngrok-free.dev',
      '.ngrok.io',
      '.ngrok-free.app',
    ],
    hmr: {
      clientPort: 443, // Use HTTPS port for ngrok
    },
  },
})
