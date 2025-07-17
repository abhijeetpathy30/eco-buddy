
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/eco-buddy/', // Important for GitHub Pages deployment
  plugins: [react()],
  define: {
    // This makes the environment variable available in your client-side code
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  }
})
