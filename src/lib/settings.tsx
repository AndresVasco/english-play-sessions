// Teacher settings, stored in this browser (localStorage).
// Settings are device conveniences; learner progress lives in IndexedDB (Phase 3).

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { BlockType } from '../content/types.ts'

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
  /** Teacher overrides of block durations (minutes); empty = use the lesson's */
  blockMinutes: Partial<Record<BlockType, number>>
  /** Internal: lets new versions adjust old saved settings */
  settingsVersion: number
}

export const DEFAULT_SETTINGS: Settings = {
  volume: 0.9,
  peekSeconds: 10,
  alwaysBilingual: false,
  musicOn: true,
  simonSeconds: 4,
  blockMinutes: {},
  settingsVersion: 2,
}

const KEY = 'eps-settings'

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const saved = { ...DEFAULT_SETTINGS, settingsVersion: 1, ...JSON.parse(raw) } as Settings
      // v2: Simon Says was too slow — move the old default (6 s) to the new one (4 s).
      if (saved.settingsVersion < 2) {
        if (saved.simonSeconds === 6) saved.simonSeconds = DEFAULT_SETTINGS.simonSeconds
        saved.settingsVersion = 2
      }
      return saved
    }
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

// Before Phase 3 the last lesson lived here; now it is in the progress Meta.
// Kept only to read what older versions saved.
export const getLegacyLastLessonId = () => {
  try {
    return localStorage.getItem('eps-last-lesson')
  } catch {
    return null
  }
}
