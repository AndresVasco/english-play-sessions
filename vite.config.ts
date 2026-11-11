import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The app is served from https://<user>.github.io/english-play-sessions/
// so all asset paths must start with this base.
export default defineConfig({
  base: '/english-play-sessions/',
  plugins: [react()],
})
