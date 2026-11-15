// When a new version of the app has been published, show a quiet banner
// (Home screen only) instead of reloading by surprise during a session.

import { useEffect, useState } from 'react'
import { registerSW } from 'virtual:pwa-register'

let updateFn: ((reload?: boolean) => Promise<void>) | null = null
let needRefresh = false
const listeners = new Set<() => void>()

export function startServiceWorker() {
  updateFn = registerSW({
    onNeedRefresh() {
      needRefresh = true
      listeners.forEach((l) => l())
    },
  })
}

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
      <button type="button" className="small-btn" onClick={() => updateFn?.(true)}>
        ⟳ Update now
      </button>
    </div>
  )
}
