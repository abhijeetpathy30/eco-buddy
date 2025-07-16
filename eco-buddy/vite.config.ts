
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/eco-buddy/', // Important for GitHub Pages deployment
  plugins: [react()],
  define: {
    'process.env.API_KEY': `"${process.env.API_KEY}"`
  }
})
