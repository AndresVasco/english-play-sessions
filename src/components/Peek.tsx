// Spanish peek: English is always shown; Spanish appears BELOW it (smaller,
// different color) while a peek is active or when "always bilingual" is on.

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useSettings } from '../lib/settings.tsx'

interface PeekContextValue {
  showSpanish: boolean
  /** Start (or restart) a timed peek */
  peek: () => void
}

const PeekContext = createContext<PeekContextValue>({ showSpanish: false, peek: () => {} })

export function PeekProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings()
  const [until, setUntil] = useState(0)
  const timer = useRef<number | undefined>(undefined)

  const peek = useCallback(() => {
    const ms = settings.peekSeconds * 1000
    setUntil(Date.now() + ms)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setUntil(0), ms)
  }, [settings.peekSeconds])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const showSpanish = settings.alwaysBilingual || until > 0
  return <PeekContext.Provider value={{ showSpanish, peek }}>{children}</PeekContext.Provider>
}

export const usePeek = () => useContext(PeekContext)

/** English text with its Spanish translation underneath when peeking. */
export function Bi({ en, es, className = '' }: { en: string; es: string; className?: string }) {
  const { showSpanish } = usePeek()
  return (
    <span className={`bi ${className}`}>
      <span className="bi-en">{en}</span>
      {showSpanish && (
        <span className="bi-es" lang="es">
          {es}
        </span>
      )}
    </span>
  )
}

const LONG_PRESS_MS = 550

/** The big 🇨🇴 button. Tap = peek. Long-press = peek + Spanish then English audio. */
export function PeekButton({ onPeek, onLongPress }: { onPeek: () => void; onLongPress: () => void }) {
  const { peek } = usePeek()
  const pressTimer = useRef<number | undefined>(undefined)
  const longFired = useRef(false)

  const start = () => {
    longFired.current = false
    pressTimer.current = window.setTimeout(() => {
      longFired.current = true
      peek()
      onLongPress()
    }, LONG_PRESS_MS)
  }
  const end = () => {
    window.clearTimeout(pressTimer.current)
    if (!longFired.current) {
      peek()
      onPeek()
    }
    longFired.current = true // ignore the click that follows
  }
  const cancel = () => window.clearTimeout(pressTimer.current)

  return (
    <button
      type="button"
      className="peek-button"
      aria-label="Spanish peek"
      title="Tap: show Spanish · Hold: hear Spanish then English (P)"
      onPointerDown={start}
      onPointerUp={end}
      onPointerLeave={cancel}
      onContextMenu={(e) => e.preventDefault()}
    >
      <ColombiaFlag />
    </button>
  )
}

/** Drawn flag: Windows shows emoji flags as letters ("CO"), so we draw it. */
function ColombiaFlag() {
  return (
    <svg className="peek-flag" viewBox="0 0 6 4" aria-hidden="true">
      <rect width="6" height="2" fill="#FCD116" />
      <rect y="2" width="6" height="1" fill="#003893" />
      <rect y="3" width="6" height="1" fill="#CE1126" />
    </svg>
  )
}
