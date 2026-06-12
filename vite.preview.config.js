/* Dev-only config: builds preview.html (mock-data harness) into preview-dist
   with relative paths so it can be opened straight from the filesystem. */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'preview-dist',
    rollupOptions: { input: 'preview.html' },
  },
})
