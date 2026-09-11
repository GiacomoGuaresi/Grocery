import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// base = nome del repository, perché il sito è servito da GitHub Pages
// su giacomoguaresi.github.io/Grocery/
export default defineConfig({
  base: '/Grocery/',
  plugins: [
    react(),
    // PWA (Step 16): installabile, con la shell dell'app in cache così si apre
    // anche senza rete. I dati non passano dal service worker: la lista senza
    // rete la tiene l'app (src/storage/memoriaLocale.ts). Le icone le genera
    // `npm run icone` da public/icona.svg.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icona.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Grocery',
        short_name: 'Grocery',
        description: 'La lista della spesa di casa, generata ogni due settimane',
        lang: 'it',
        display: 'standalone',
        // Come l'intestazione e lo sfondo dell'app (tema.css).
        theme_color: '#f3e4d6',
        background_color: '#fbf4ec',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
})
