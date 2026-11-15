import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/fredoka/latin-500.css'
import '@fontsource/fredoka/latin-600.css'
import '@fontsource/fredoka/latin-700.css'
import './index.css'
import App from './App.tsx'
import { SettingsProvider } from './lib/settings.tsx'
import { startServiceWorker } from './components/UpdateBanner.tsx'

startServiceWorker()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SettingsProvider>
      <App />
    </SettingsProvider>
  </StrictMode>,
)
