// Teacher settings, stored in this browser (localStorage).
// Settings are device conveniences; learner progress lives in IndexedDB (Phase 3).

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

export interface Settings {
  /** 0..1 */
  volume: number
  /** Seconds the Spanish peek stays visible */
  peekSeconds: number
  /** Show Spanish under English permanently (for the first sessions) */
  alwaysBilingual: boolean
  /** Songs and Freeze Dance music */
  musicOn: boolean
  /** Seconds between Simon Says commands */
  simonSeconds: number
}

export const DEFAULT_SETTINGS: Settings = {
  volume: 0.9,
  peekSeconds: 10,
  alwaysBilingual: false,
  musicOn: true,
  simonSeconds: 6,
}

const KEY = 'eps-settings'

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    /* storage unavailable: use defaults */
  }
  return DEFAULT_SETTINGS
}

interface SettingsContextValue {
  settings: Settings
  update: (patch: Partial<Settings>) => void
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(load)
  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch }
      try {
        localStorage.setItem(KEY, JSON.stringify(next))
      } catch {
        /* ignore */
      }
      return next
    })
  }, [])
  const value = useMemo(() => ({ settings, update }), [settings, update])
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider')
  return ctx
}

// ---- Small device memory (last lesson). Moves to IndexedDB "Meta" in Phase 3. ----
const LAST_LESSON_KEY = 'eps-last-lesson'
export const getLastLessonId = () => {
  try {
    return localStorage.getItem(LAST_LESSON_KEY)
  } catch {
    return null
  }
}
export const setLastLessonId = (id: string) => {
  try {
    localStorage.setItem(LAST_LESSON_KEY, id)
  } catch {
    /* ignore */
  }
}
