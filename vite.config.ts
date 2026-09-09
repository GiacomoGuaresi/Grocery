import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// base = nome del repository, perché il sito è servito da GitHub Pages
// su giacomoguaresi.github.io/Grocery/
export default defineConfig({
  base: '/Grocery/',
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
})
