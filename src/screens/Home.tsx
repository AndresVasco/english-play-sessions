// Home: "English Adventure". Each unit is a path; each lesson is a stop.
// Green = lessons already played, orange = today's lesson (with Pip).
// The teacher can open any stop (nothing is locked).

import { useEffect, useMemo, useState } from 'react'
import { findLesson, getItems, units } from '../content/index.ts'
import type { Unit } from '../content/types.ts'
import { Pip } from '../components/Pip.tsx'
import { UpdateBanner } from '../components/UpdateBanner.tsx'
import { getLegacyLastLessonId } from '../lib/settings.tsx'
import { useProgress } from '../progress/store.ts'

interface Props {
  openLesson: (lessonId: string) => void
  openSettings: () => void
  openStats: () => void
  openChallenge: (unitId: string) => void
}

function useNarrow() {
  const q = '(max-width: 640px)'
  const [narrow, setNarrow] = useState(() => window.matchMedia(q).matches)
  useEffect(() => {
    const m = window.matchMedia(q)
    const on = () => setNarrow(m.matches)
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [])
  return narrow
}

/** Stop positions (percent of the map box): a winding path. */
function stopPositions(n: number, narrow: boolean) {
  return Array.from({ length: n }, (_, i) => {
    if (narrow) return { x: i % 2 === 0 ? 28 : 72, y: n === 1 ? 50 : 10 + (i * 80) / (n - 1) }
    return { x: n === 1 ? 50 : 10 + (i * 80) / (n - 1), y: i % 2 === 0 ? 34 : 70 }
  })
}

function pathD(points: { x: number; y: number }[], narrow: boolean) {
  return points
    .map((p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`
      const a = points[i - 1]
      return narrow
        ? `C ${a.x} ${(a.y + p.y) / 2}, ${p.x} ${(a.y + p.y) / 2}, ${p.x} ${p.y}`
        : `C ${(a.x + p.x) / 2} ${a.y}, ${(a.x + p.x) / 2} ${p.y}, ${p.x} ${p.y}`
    })
    .join(' ')
}

interface MapProps {
  unit: Unit
  done: Set<string>
  today: string | undefined
  challengeDone: boolean
  openLesson: (id: string) => void
  openChallenge: (unitId: string) => void
}

function UnitMap({ unit, done, today, challengeDone, openLesson, openChallenge }: MapProps) {
  const narrow = useNarrow()
  // One stop per lesson + the 🏅 Pip's Challenge stop at the end of the unit
  const pts = stopPositions(unit.lessons.length + 1, narrow)
  const last = pts[pts.length - 1]
  return (
    <div className={narrow ? 'map narrow' : 'map'} style={narrow ? { height: (unit.lessons.length + 1) * 150 + 40 } : undefined}>
      <svg className="map-path" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path d={pathD(pts, narrow)} />
      </svg>
      {unit.lessons.map((lesson, i) => {
        const state = lesson.id === today ? 'now' : done.has(lesson.id) ? 'done' : ''
        const emoji = getItems(lesson.newItems)[0]?.image ?? '⭐'
        return (
          <button
            type="button"
            key={lesson.id}
            className={`stop ${state}`}
            style={{ left: `${pts[i].x}%`, top: `${pts[i].y}%` }}
            onClick={() => openLesson(lesson.id)}
          >
            <span className="stop-circle" aria-hidden="true">
              {emoji}
            </span>
            <span className="stop-title">{lesson.title}</span>
            <span className="stop-sub">
              Lesson {lesson.number}
              {state === 'now' ? ' · Today!' : state === 'done' ? ' ✓' : ''}
            </span>
            {state === 'now' && <Pip size={86} className="stop-pip" />}
          </button>
        )
      })}
      <button
        type="button"
        className={`stop challenge-stop ${challengeDone ? 'done' : ''}`}
        style={{ left: `${last.x}%`, top: `${last.y}%` }}
        onClick={() => openChallenge(unit.id)}
      >
        <span className="stop-circle" aria-hidden="true">
          🏅
        </span>
        <span className="stop-title">Pip's Challenge</span>
        <span className="stop-sub">End of unit{challengeDone ? ' ✓' : ''}</span>
      </button>
    </div>
  )
}

// The unit shown on Home is remembered on this device, so coming back from a
// lesson, a session or a challenge returns to the same unit.
const UNIT_KEY = 'eps-home-unit'
const readUnit = () => {
  try {
    return localStorage.getItem(UNIT_KEY)
  } catch {
    return null
  }
}
const rememberUnit = (id: string) => {
  try {
    localStorage.setItem(UNIT_KEY, id)
  } catch {
    /* storage unavailable: the app still works */
  }
}

export function Home({ openLesson, openSettings, openStats, openChallenge }: Props) {
  const progress = useProgress()
  const lastId = progress?.meta.lastLessonId ?? getLegacyLastLessonId()
  const last = findLesson(lastId)
  const done = useMemo(() => new Set(progress?.sessions.map((s) => s.lessonId) ?? []), [progress])
  const [unitId, setUnitIdState] = useState<string | null>(readUnit)
  const setUnitId = (id: string) => {
    rememberUnit(id)
    setUnitIdState(id)
  }
  const unit = units.find((u) => u.id === unitId) ?? last?.unit ?? units[0]
  // Today's stop: the last lesson used; otherwise the first lesson not played yet.
  const today = last?.lesson.id ?? units.flatMap((u) => u.lessons).find((l) => !done.has(l.id))?.id
  const stickers = progress?.stickers ?? []
  const [showAll, setShowAll] = useState(false)

  return (
    <div className="screen home">
      <header className="screen-head">
        <div>
          <h1 className="brand">English Adventure</h1>
          {unit && (
            <div className="kicker">
              Unit {unit.number} · {unit.title}
            </div>
          )}
        </div>
        <div className="head-actions">
          {stickers.length > 0 && (
            <button type="button" className="sticker-pill" onClick={() => setShowAll((s) => !s)} aria-label="Sticker board">
              {stickers.slice(-5).map((s) => (
                <span key={s.id}>{s.emoji}</span>
              ))}
              {stickers.length > 5 && <small>+{stickers.length - 5}</small>}
            </button>
          )}
          <button type="button" className="quiet-btn big" onClick={openStats} aria-label="Stats" title="Stats">
            📊
          </button>
          <button type="button" className="quiet-btn big" onClick={openSettings} aria-label="Settings" title="Settings">
            ⚙️
          </button>
        </div>
      </header>

      <UpdateBanner />

      {showAll && (
        <section className="sticker-board" aria-label="Sticker board">
          <h2>
            My stickers <small>· {stickers.length}</small>
          </h2>
          <div className="board">
            {stickers.map((s) => (
              <span key={s.id} title={new Date(s.date).toLocaleDateString()}>
                {s.emoji}
              </span>
            ))}
          </div>
        </section>
      )}

      {units.length > 1 && (
        <nav className="unit-tabs" aria-label="Units">
          {units.map((u) => (
            <button
              type="button"
              key={u.id}
              className={u.id === unit?.id ? 'unit-tab on' : 'unit-tab'}
              onClick={() => setUnitId(u.id)}
              title={u.title}
            >
              <span aria-hidden="true">{u.items[0]?.image}</span> {u.number}
            </button>
          ))}
        </nav>
      )}

      {unit && (
        <UnitMap
          key={unit.id}
          unit={unit}
          done={done}
          today={today}
          challengeDone={Boolean(progress?.evaluations.some((e) => e.kind === 'unit' && e.unitId === unit.id))}
          openLesson={(id) => {
            rememberUnit(unit.id)
            openLesson(id)
          }}
          openChallenge={(id) => {
            rememberUnit(id)
            openChallenge(id)
          }}
        />
      )}
    </div>
  )
}
