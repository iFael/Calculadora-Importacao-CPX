import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    watch: {
      usePolling: true,
      ignored: ['**/DumpStack.log.tmp', '**/node_modules/**', '**/.git/**', 'C:\\DumpStack.log.tmp']
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})
