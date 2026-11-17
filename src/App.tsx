// Screen navigation with the address "hash" (#/lesson/u1-l1), so the
// browser's back button works and each screen has its own address.

import { useCallback, useEffect, useState, type ReactNode } from 'react'
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
import { Sky } from './components/Sky.tsx'
import { ChallengeScreen } from './challenge/ChallengeScreen.tsx'

type Route =
  | { name: 'home' }
  | { name: 'settings' }
  | { name: 'stats' }
  | { name: 'lesson'; id: string }
  | { name: 'session'; id: string }
  | { name: 'challenge'; id: string }

function parse(hash: string): Route {
  const [, name, id] = hash.replace(/^#/, '').split('/')
  if (name === 'settings') return { name: 'settings' }
  if (name === 'stats') return { name: 'stats' }
  if (name === 'challenge' && id && units.some((u) => u.id === id)) return { name: 'challenge', id }
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
    if (route.name === 'session' || route.name === 'challenge') {
      document.documentElement.requestFullscreen?.().catch(() => {})
    } else if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {})
    }
  }, [route.name])

  let screen: ReactNode
  switch (route.name) {
    case 'settings':
      screen = <Settings back={() => go({ name: 'home' })} />
      break
    case 'stats':
      screen = <Stats back={() => go({ name: 'home' })} />
      break
    case 'lesson': {
      const ref = findLesson(route.id)!
      screen = (
        <LessonOverview
          lessonRef={ref}
          back={() => go({ name: 'home' })}
          start={() => {
            setLastLesson(route.id).catch(() => {})
            try {
              localStorage.setItem('eps-home-unit', ref.unit.id)
            } catch {
              /* ignore */
            }
            go({ name: 'session', id: route.id })
          }}
        />
      )
      break
    }
    case 'session': {
      const ref = findLesson(route.id)!
      screen = (
        <SessionRunner key={route.id} unit={ref.unit} units={units} lesson={ref.lesson} onExit={() => go({ name: 'home' })} />
      )
      break
    }
    case 'challenge': {
      const unit = units.find((u) => u.id === route.id)!
      screen = <ChallengeScreen key={route.id} unit={unit} onExit={() => go({ name: 'home' })} />
      break
    }
    default:
      screen = (
        <Home
          openLesson={(id) => go({ name: 'lesson', id })}
          openSettings={() => go({ name: 'settings' })}
          openStats={() => go({ name: 'stats' })}
          openChallenge={(unitId) => go({ name: 'challenge', id: unitId })}
        />
      )
  }

  return (
    <>
      <Sky />
      {screen}
    </>
  )
}
