import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  // Las llamadas a /api van al backend Express (server/index.js)
  server: { proxy: { '/api': 'http://localhost:3001' } },
})
