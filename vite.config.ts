import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relative asset URLs work at both / and /repository-name/ on static hosts.
export default defineConfig({
  plugins: [react()],
  base: './',
})
