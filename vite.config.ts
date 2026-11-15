import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// The app is served from https://<user>.github.io/english-play-sessions/
// so all asset paths must start with this base.
const BASE = '/english-play-sessions/'

export default defineConfig({
  base: BASE,
  plugins: [
    react(),
    // Installable app + offline: everything (code, content, audio, icons) is
    // saved on the device the first time the app opens.
    VitePWA({
      registerType: 'prompt', // never reload by itself in the middle of a session
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'English Play Sessions',
        short_name: 'English Play',
        description: 'Teacher-led English play sessions',
        start_url: BASE,
        scope: BASE,
        display: 'standalone',
        orientation: 'any',
        background_color: '#f6f3ec',
        theme_color: '#2f6f6a',
        lang: 'en',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,mp3}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        navigateFallback: `${BASE}index.html`,
      },
    }),
  ],
})
