// For the teacher, after a challenge: the scores, each word's result, and
// (unit challenges) the unit's "can do" checklist.

import { useState } from 'react'
import { getItem } from '../content/index.ts'
import type { Unit } from '../content/types.ts'
import { scores } from '../progress/evaluation.ts'
import { setCanDo, useProgress } from '../progress/store.ts'
import type { Evaluation } from '../progress/types.ts'

const RESULT_LABEL = { got: '✓ on her own', helped: '🤝 with help', again: '↻ not yet' } as const

export function ScoreTiles({ e }: { e: Evaluation }) {
  const s = scores(e)
  const tile = (label: string, v: number | null, hint: string) => (
    <div className="stat-tile">
      <strong>{v === null ? '—' : `${v}%`}</strong>
      <span>{label}</span>
      <small>{hint}</small>
    </div>
  )
  return (
    <div className="stat-tiles">
      {tile('Understands', s.comprehension, 'touches the right picture')}
      {tile('Says it', s.production, 'on her own = 100, with help = 50')}
      {tile('Remembers', s.retention, 'words from 7+ days ago')}
    </div>
  )
}

export function CanDoList({ unit }: { unit: Unit }) {
  const progress = useProgress()
  // Show a tick immediately; the saved value catches up a moment later.
  const [pending, setPending] = useState<Record<number, boolean>>({})
  const saved = new Set(progress?.canDo.filter((c) => c.unitId === unit.id).map((c) => c.index) ?? [])
  const isDone = (i: number) => pending[i] ?? saved.has(i)
  if (!unit.canDo?.length) return null
  return (
    <ul className="can-do">
      {unit.canDo.map((text, i) => (
        <li key={i}>
          <label>
            <input
              type="checkbox"
              checked={isDone(i)}
              onChange={(e) => {
                const v = e.target.checked
                setPending((p) => ({ ...p, [i]: v }))
                setCanDo(unit.id, i, v).catch(() => setPending((p) => ({ ...p, [i]: !v })))
              }}
            />
            <span>{text}</span>
          </label>
        </li>
      ))}
    </ul>
  )
}

export function TeacherSummary({ e, unit, onDone }: { e: Evaluation; unit?: Unit; onDone: () => void }) {
  return (
    <div className="screen overview teacher-summary">
      <h1>Results · for you</h1>
      <p className="setting-help">
        {new Date(e.date).toLocaleString()} · {Math.max(1, Math.round(e.durationSec / 60))} min. She only saw stars and a medal.
      </p>
      <ScoreTiles e={e} />
      <h2>Words</h2>
      <ul className="session-list">
        {e.items.map((it) => {
          const item = getItem(it.itemId)
          return (
            <li key={it.itemId}>
              <span>
                {item?.image} {item?.text ?? it.itemId}
              </span>
              <span>{it.skill === 'comprehension' ? '👂 understands' : '🗣️ says'}</span>
              <span>{RESULT_LABEL[it.result]}</span>
              {it.retention && <span>🧠 7+ days</span>}
            </li>
          )
        })}
      </ul>
      {unit?.canDo?.length ? (
        <>
          <h2>She can… (tick what you have seen her do)</h2>
          <CanDoList unit={unit} />
        </>
      ) : null}
      <button type="button" className="start-btn" onClick={onDone}>
        Done
      </button>
    </div>
  )
}
