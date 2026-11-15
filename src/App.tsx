// Screen navigation with the address "hash" (#/lesson/u1-l1), so the
// browser's back button works and each screen has its own address.

import { useCallback, useEffect, useState } from 'react'
import { findLesson, units } from './content/index.ts'
import { setVolume, stopAudio } from './lib/audio.ts'
import { setMusicVolume } from './lib/music.ts'
import { useSettings } from './lib/settings.tsx'
import { setLastLesson } from './progress/store.ts'
import { Stats } from './screens/Stats.tsx'
import { Home } from './screens/Home.tsx'
import { LessonOverview } from './screens/LessonOverview.tsx'
import { Settings } from './screens/Settings.tsx'
import { SessionRunner } from './session/SessionRunner.tsx'

type Route = { name: 'home' } | { name: 'settings' } | { name: 'stats' } | { name: 'lesson'; id: string } | { name: 'session'; id: string }

function parse(hash: string): Route {
  const [, name, id] = hash.replace(/^#/, '').split('/')
  if (name === 'settings') return { name: 'settings' }
  if (name === 'stats') return { name: 'stats' }
  if ((name === 'lesson' || name === 'session') && id && findLesson(id)) return { name, id }
  return { name: 'home' }
}

const toHash = (r: Route) => (r.name === 'home' ? '#/' : 'id' in r ? `#/${r.name}/${r.id}` : `#/${r.name}`)

export default function App() {
  const [route, setRoute] = useState<Route>(() => parse(window.location.hash))
  const { settings } = useSettings()

  useEffect(() => {
    setVolume(settings.volume)
    setMusicVolume(settings.volume * 0.8)
  }, [settings.volume])

  useEffect(() => {
    const onHash = () => setRoute(parse(window.location.hash))
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const go = useCallback((r: Route) => {
    stopAudio()
    window.location.hash = toHash(r)
  }, [])

  // Full screen during a session (PC); leave it afterwards.
  useEffect(() => {
    if (route.name === 'session') {
      document.documentElement.requestFullscreen?.().catch(() => {})
    } else if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {})
    }
  }, [route.name])

  switch (route.name) {
    case 'settings':
      return <Settings back={() => go({ name: 'home' })} />
    case 'stats':
      return <Stats back={() => go({ name: 'home' })} />
    case 'lesson': {
      const ref = findLesson(route.id)!
      return (
        <LessonOverview
          lessonRef={ref}
          back={() => go({ name: 'home' })}
          start={() => {
            setLastLesson(route.id).catch(() => {})
            go({ name: 'session', id: route.id })
          }}
        />
      )
    }
    case 'session': {
      const ref = findLesson(route.id)!
      return (
        <SessionRunner
          key={route.id}
          unit={ref.unit}
          units={units}
          lesson={ref.lesson}
          onExit={() => go({ name: 'home' })}
        />
      )
    }
    default:
      return (
        <Home
          openLesson={(id) => go({ name: 'lesson', id })}
          openSettings={() => go({ name: 'settings' })}
          openStats={() => go({ name: 'stats' })}
        />
      )
  }
}
