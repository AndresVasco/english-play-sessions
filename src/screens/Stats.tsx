// Stats for the teacher: sessions per week, total minutes, words by level,
// words she struggles with, recent sessions. Everything comes from this device.

import { findLesson, getItem, units } from '../content/index.ts'
import { CanDoList } from '../challenge/TeacherSummary.tsx'
import { scores } from '../progress/evaluation.ts'
import type { Evaluation } from '../progress/types.ts'
import { MAX_LEVEL } from '../progress/review.ts'
import { useProgress } from '../progress/store.ts'
import type { ItemProgress } from '../progress/types.ts'

const LEVEL_LABELS = ['New / hard', 'Learning', 'Almost', 'Knows it']

/** Monday of the week of `d`, as YYYY-MM-DD */
function weekStart(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7))
  return x
}

export function Stats({ back }: { back: () => void }) {
  const data = useProgress()

  if (!data) return <div className="screen">Loading…</div>

  const totalMin = Math.round(data.sessions.reduce((s, x) => s + x.durationSec, 0) / 60)

  // Last 8 weeks, oldest first
  const thisWeek = weekStart(new Date())
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const start = new Date(thisWeek)
    start.setDate(start.getDate() - 7 * (7 - i))
    const end = new Date(start)
    end.setDate(end.getDate() + 7)
    const n = data.sessions.filter((s) => {
      const d = new Date(s.date)
      return d >= start && d < end
    }).length
    return { label: `${start.getDate()}/${start.getMonth() + 1}`, n }
  })
  const maxWeek = Math.max(1, ...weeks.map((w) => w.n))

  const byLevel = Array.from({ length: MAX_LEVEL + 1 }, (_, l) => data.items.filter((i) => i.level === l))
  const struggles = [...data.items]
    .filter((i) => i.timesSeen > 0 || i.peekCount > 0)
    .sort((a, b) => a.level - b.level || b.peekCount - a.peekCount || b.timesSeen - a.timesSeen)
    // Hard = level 0, or ever marked ↻, or peeked twice or more
    .filter((i) => i.level === 0 || i.timesCorrect < i.timesSeen || i.peekCount >= 2)
    .slice(0, 10)

  const name = (p: ItemProgress) => {
    const it = getItem(p.itemId)
    return it ? `${it.image} ${it.text}` : p.itemId
  }

  return (
    <div className="screen stats">
      <header className="screen-head">
        <button type="button" className="quiet-btn big" onClick={back} aria-label="Back">
          ←
        </button>
        <h1>Stats</h1>
      </header>

      <div className="stat-tiles">
        <div className="stat-tile">
          <strong>{data.sessions.length}</strong>
          <span>sessions</span>
        </div>
        <div className="stat-tile">
          <strong>{totalMin}</strong>
          <span>minutes in total</span>
        </div>
        <div className="stat-tile">
          <strong>{data.items.length}</strong>
          <span>words practised</span>
        </div>
        <div className="stat-tile">
          <strong>{data.stickers.length}</strong>
          <span>stickers</span>
        </div>
      </div>

      <EvaluationsSection evaluations={data.evaluations} canDoCount={data.canDo.length} />

      <h2>Sessions per week</h2>
      <div className="week-bars" role="img" aria-label="Sessions per week, last 8 weeks">
        {weeks.map((w, i) => (
          <div key={i} className="week-bar">
            <span className="week-n">{w.n || ''}</span>
            <span className="week-fill" style={{ height: `${(w.n / maxWeek) * 100}%` }} />
            <span className="week-label">{w.label}</span>
          </div>
        ))}
      </div>

      <h2>Words by level</h2>
      <div className="levels">
        {byLevel.map((list, l) => (
          <div key={l} className={`level level-${l}`}>
            <div className="level-head">
              <strong>{list.length}</strong> {LEVEL_LABELS[l]} <small>(level {l})</small>
            </div>
            <div className="level-words">{list.map((p) => <span key={p.itemId}>{name(p)}</span>)}</div>
          </div>
        ))}
      </div>

      <h2>Words she finds hard</h2>
      {struggles.length === 0 ? (
        <p className="setting-help">Nothing yet — mark ✓/↻ during sessions and this list fills in.</p>
      ) : (
        <table className="struggles">
          <thead>
            <tr>
              <th>Word</th>
              <th>Level</th>
              <th>✓ / seen</th>
              <th>Spanish peeks</th>
            </tr>
          </thead>
          <tbody>
            {struggles.map((p) => (
              <tr key={p.itemId}>
                <td>{name(p)}</td>
                <td>{p.level}</td>
                <td>
                  {p.timesCorrect} / {p.timesSeen}
                </td>
                <td>{p.peekCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Recent sessions</h2>
      {data.sessions.length === 0 ? (
        <p className="setting-help">No sessions yet.</p>
      ) : (
        <ul className="session-list">
          {[...data.sessions]
            .reverse()
            .slice(0, 15)
            .map((s) => {
              const ref = findLesson(s.lessonId)
              const got = s.marks.filter((m) => m.result === 'got').length
              return (
                <li key={s.id}>
                  <span>{new Date(s.date).toLocaleDateString()}</span>
                  <span>{ref ? `L${ref.lesson.number} ${ref.lesson.title}` : s.lessonId}</span>
                  <span>{Math.round(s.durationSec / 60)} min</span>
                  <span>{s.blocksCompleted}/6 blocks</span>
                  <span>
                    ✓ {got} · ↻ {s.marks.length - got}
                  </span>
                </li>
              )
            })}
        </ul>
      )}
    </div>
  )
}

const SERIES = [
  { key: 'comprehension', label: 'Understands', color: '#5b4bd6' },
  { key: 'production', label: 'Says it', color: '#f08a24' },
  { key: 'retention', label: 'Remembers (7+ days)', color: '#2f9e74' },
] as const

/** Pip's Challenge results: trend, history, words to reinforce, can-do lists. */
function EvaluationsSection({ evaluations, canDoCount }: { evaluations: Evaluation[]; canDoCount: number }) {
  const recent = evaluations.slice(-10)
  const points = recent.map((e) => scores(e))
  const W = 600
  const H = 180
  const x = (i: number) => (recent.length < 2 ? W / 2 : 30 + (i * (W - 60)) / (recent.length - 1))
  const y = (v: number) => H - 20 - (v / 100) * (H - 40)

  // Latest result per word in the last 30 days; keep the ones not yet solid.
  const since = Date.now() - 30 * 24 * 60 * 60 * 1000
  const latest = new Map<string, { result: string; skill: string }>()
  for (const e of evaluations) {
    if (Date.parse(e.date) < since) continue
    for (const it of e.items) latest.set(it.itemId, { result: it.result, skill: it.skill })
  }
  const reinforce = [...latest].filter(([, v]) => v.result !== 'got')
  const unitsWithCanDo = units.filter((u) => u.canDo?.length)
  const canDoTotal = unitsWithCanDo.reduce((s, u) => s + (u.canDo?.length ?? 0), 0)

  return (
    <section className="evaluations">
      <h2>Pip's Challenge 🏅</h2>
      {evaluations.length === 0 ? (
        <p className="setting-help">
          No challenges yet. The weekly one appears in block 2 once she has met 8 words; the unit one is the 🏅 stop at
          the end of each unit's map.
        </p>
      ) : (
        <>
          <div className="trend" role="img" aria-label="Results of the last challenges">
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
              {[0, 50, 100].map((v) => (
                <g key={v}>
                  <line x1="30" x2={W - 30} y1={y(v)} y2={y(v)} className="trend-grid" />
                  <text x="2" y={y(v) + 4} className="trend-axis">
                    {v}%
                  </text>
                </g>
              ))}
              {SERIES.map((ser) => {
                const pts = points
                  .map((p, i) => (p[ser.key] === null ? null : `${x(i)},${y(p[ser.key] as number)}`))
                  .filter(Boolean)
                return (
                  <g key={ser.key}>
                    <polyline points={pts.join(' ')} fill="none" stroke={ser.color} strokeWidth="3" strokeLinejoin="round" />
                    {points.map((p, i) =>
                      p[ser.key] === null ? null : <circle key={i} cx={x(i)} cy={y(p[ser.key] as number)} r="4" fill={ser.color} />,
                    )}
                  </g>
                )
              })}
            </svg>
            <div className="trend-legend">
              {SERIES.map((s) => (
                <span key={s.key}>
                  <i style={{ background: s.color }} /> {s.label}
                </span>
              ))}
            </div>
          </div>

          <table className="struggles">
            <thead>
              <tr>
                <th>Date</th>
                <th>Check</th>
                <th>Understands</th>
                <th>Says it</th>
                <th>Remembers</th>
              </tr>
            </thead>
            <tbody>
              {[...evaluations].reverse().slice(0, 12).map((e) => {
                const sc = scores(e)
                const unit = units.find((u) => u.id === e.unitId)
                const pct = (v: number | null) => (v === null ? '—' : `${v}%`)
                return (
                  <tr key={e.id}>
                    <td>{new Date(e.date).toLocaleDateString()}</td>
                    <td>{e.kind === 'weekly' ? 'Weekly' : `Unit ${unit?.number ?? ''}`}</td>
                    <td>{pct(sc.comprehension)}</td>
                    <td>{pct(sc.production)}</td>
                    <td>{pct(sc.retention)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <h3>Words to reinforce (last 30 days)</h3>
          {reinforce.length === 0 ? (
            <p className="setting-help">All the words checked recently are solid. 🎉</p>
          ) : (
            <div className="level-words reinforce">
              {reinforce.map(([id, v]) => {
                const it = getItem(id)
                return (
                  <span key={id}>
                    {it?.image} {it?.text ?? id} <small>({v.result === 'helped' ? 'with help' : 'not yet'})</small>
                  </span>
                )
              })}
            </div>
          )}
        </>
      )}

      <h3>
        She can… <small>· {canDoCount} of {canDoTotal} ticked</small>
      </h3>
      {unitsWithCanDo.map((u) => (
        <details key={u.id} className="overview-notes">
          <summary>
            Unit {u.number}: {u.title}
          </summary>
          <CanDoList unit={u} />
        </details>
      ))}
    </section>
  )
}
