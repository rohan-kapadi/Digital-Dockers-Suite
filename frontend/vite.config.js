import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import https from 'https';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    basicSsl()
  ],
  server: {
    https: true,
    host: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'https://localhost:5002',
        changeOrigin: true,
        secure: false,
        ws: true,
        xfwd: true,
        agent: new https.Agent({
          rejectUnauthorized: false
        })
      },
      '/socket.io': {
        target: process.env.VITE_API_PROXY_TARGET || 'https://localhost:5002',
        ws: true,
        changeOrigin: true,
        secure: false,
        xfwd: true,
        agent: new https.Agent({
          rejectUnauthorized: false
        })
      },
    },
  },
})
