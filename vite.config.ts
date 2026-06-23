import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // 开发时把 /api 代理到本地 Node 服务（server/index.ts）。
    proxy: {
      '/api': 'http://localhost:8787',
    },
  },
})
