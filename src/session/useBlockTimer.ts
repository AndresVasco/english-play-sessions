import { useCallback, useEffect, useState } from 'react'

/** Countdown for the current block. Resets whenever `resetKey` changes. */
export function useBlockTimer(minutes: number, resetKey: string | number) {
  const [state, setState] = useState(() => ({ key: resetKey, startedAt: Date.now(), extraSec: 0 }))
  const [now, setNow] = useState(() => Date.now())

  // Reset during render (not in an effect) so no frame shows the old block's time.
  let current = state
  if (state.key !== resetKey) {
    current = { key: resetKey, startedAt: Date.now(), extraSec: 0 }
    setState(current)
  }

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 500)
    return () => window.clearInterval(id)
  }, [])

  const totalSec = minutes * 60 + current.extraSec
  const elapsedSec = Math.max(0, Math.floor((now - current.startedAt) / 1000))
  const remainingSec = Math.max(0, totalSec - elapsedSec)
  const extend = useCallback((sec: number) => setState((s) => ({ ...s, extraSec: s.extraSec + sec })), [])

  return { totalSec, elapsedSec, remainingSec, timeUp: remainingSec === 0, extend }
}

export const formatTime = (sec: number) =>
  `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`
