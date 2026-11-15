// Stats for the teacher: sessions per week, total minutes, words by level,
// words she struggles with, recent sessions. Everything comes from this device.

import { findLesson, getItem } from '../content/index.ts'
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
