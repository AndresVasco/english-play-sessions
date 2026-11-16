// When a new version of the app has been published, show a quiet banner
// (Home and Settings) instead of reloading by surprise during a session.
// iPhone home-screen apps often just "wake up" without reloading, so we
// also check for updates whenever the app comes back to the screen and
// every hour, and Settings has a manual "Check for updates" button.

import { useEffect, useState } from 'react'
import { registerSW } from 'virtual:pwa-register'

let updateFn: ((reload?: boolean) => Promise<void>) | null = null
let registration: ServiceWorkerRegistration | undefined
let needRefresh = false
const listeners = new Set<() => void>()

export function startServiceWorker() {
  updateFn = registerSW({
    onNeedRefresh() {
      needRefresh = true
      listeners.forEach((l) => l())
    },
    onRegisteredSW(_url, r) {
      registration = r
      if (!r) return
      const check = () => r.update().catch(() => {})
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check()
      })
      window.setInterval(check, 60 * 60 * 1000)
    },
  })
}

/** Ask the server for a new version now. Resolves to a short status for the teacher. */
export async function checkForUpdates(): Promise<'ready' | 'downloading' | 'latest' | 'offline'> {
  if (!registration) return 'offline'
  try {
    await registration.update()
  } catch {
    return 'offline'
  }
  if (needRefresh || registration.waiting) return 'ready'
  if (registration.installing) return 'downloading'
  return 'latest'
}

export const applyUpdate = () => updateFn?.(true)

export function UpdateBanner() {
  const [show, setShow] = useState(needRefresh)
  useEffect(() => {
    const l = () => setShow(true)
    listeners.add(l)
    return () => {
      listeners.delete(l)
    }
  }, [])
  if (!show) return null
  return (
    <div className="update-banner" role="status">
      <span>A new version of the app is ready.</span>
      <button type="button" className="small-btn" onClick={() => applyUpdate()}>
        ⟳ Update now
      </button>
    </div>
  )
}
