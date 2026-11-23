import { execSync } from 'node:child_process'
import { defineConfig } from 'vitest/config'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// base = nome del repository, perché il sito è servito da GitHub Pages
// su giacomoguaresi.github.io/Grocery/
/** Il commit della build: in GitHub Actions c'è GITHUB_SHA, in locale lo dice git. */
function commitCorrente(): string {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA.slice(0, 7)
  try {
    return execSync('git rev-parse --short=7 HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch {
    return 'sviluppo'
  }
}

const COMMIT = commitCorrente()
const COSTRUITA = new Date().toISOString()

/**
 * versione.json accanto all'app, con commit e ora della build: l'app aperta lo
 * rilegge per sapere se ne è uscita una nuova (src/ui/aggiornamento.ts). Non
 * finisce nella cache del service worker (`globPatterns` non ha `json`).
 */
function versione(): Plugin {
  return {
    name: 'versione',
    apply: 'build',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'versione.json', source: `${JSON.stringify({ commit: COMMIT, costruita: COSTRUITA })}\n` })
    },
  }
}

export default defineConfig({
  define: { __COMMIT__: JSON.stringify(COMMIT), __COSTRUITA__: JSON.stringify(COSTRUITA) },
  base: '/Grocery/',
  plugins: [
    react(),
    versione(),
    // PWA (Step 16): installabile, con la shell dell'app in cache così si apre
    // anche senza rete. I dati non passano dal service worker: la lista senza
    // rete la tiene l'app (src/storage/memoriaLocale.ts). Le icone le genera
    // `npm run icone` da public/icona.svg.
    VitePWA({
      // Prima di passare a una versione nuova l'app chiede (src/ui/PopupAggiornamento.tsx),
      // e il service worker lo registra lei: niente registerSW.js.
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.ico', 'icona.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Grocery',
        short_name: 'Grocery',
        description: 'La lista della spesa di casa, generata ogni due settimane',
        lang: 'it',
        display: 'standalone',
        // Come l'intestazione e lo sfondo dell'app (tema.css).
        theme_color: '#b05a3c',
        background_color: '#fbf4ec',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        // Ricette (doc/14): con la PWA installata su Android, Grocery compare
        // nel menu "Condividi". Il link arriva come parametri dell'URL, che
        // App legge all'avvio per aprire l'import.
        share_target: {
          action: '/Grocery/',
          method: 'GET',
          params: { title: 'titolo', text: 'testo', url: 'link' },
        },
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'supabase/functions/_shared/**/*.test.ts'],
  },
})
