import { BLOCK_LABELS, getActivity, getItems, getSong, units, type LessonRef } from '../content/index.ts'
import { play } from '../lib/audio.ts'
import { isWeeklyDue } from '../challenge/plan.ts'
import { useProgress } from '../progress/store.ts'

interface Props {
  lessonRef: LessonRef
  back: () => void
  start: () => void
}

export function LessonOverview({ lessonRef, back, start }: Props) {
  const { unit, lesson } = lessonRef
  const newItems = getItems(lesson.newItems)
  const commands = getItems(lesson.commands)
  const totalMin = lesson.blocks.reduce((sum, b) => sum + b.minutes, 0)
  const progress = useProgress()
  const weeklyToday = progress ? isWeeklyDue(units, progress) : false

  return (
    <div className="screen overview">
      <header className="screen-head">
        <button type="button" className="quiet-btn big" onClick={back} aria-label="Back">
          ←
        </button>
        <div>
          <div className="kicker">
            Unit {unit.number} · Lesson {lesson.number}
          </div>
          <h1>{lesson.title}</h1>
        </div>
      </header>

      {weeklyToday && (
        <p className="challenge-notice">
          🏅 <strong>This session includes Pip's Challenge</strong> (weekly check, about 3 min) instead of the review in
          block 2. You can skip it at the start of the block; it will come back next session.
        </p>
      )}

      <p className="key-exchange">
        <strong>Key exchange:</strong> {lesson.keyExchange.en}
      </p>

      <h2>New words</h2>
      <div className="item-grid small">
        {newItems.map((item) => (
          <button
            type="button"
            key={item.id}
            className="item-tile"
            onClick={() => play({ src: item.audio, text: item.text, lang: 'en' })}
          >
            <span className="item-tile-image" aria-hidden="true">
              {item.image}
            </span>
            <span>{item.text}</span>
          </button>
        ))}
      </div>

      <h2>Commands</h2>
      <div className="chips">
        {commands.map((c) => (
          <span key={c.id} className={lesson.newCommands.includes(c.id) ? 'chip new' : 'chip'}>
            {c.image} {c.text}
            {lesson.newCommands.includes(c.id) && <em> new</em>}
          </span>
        ))}
      </div>

      <h2>Session plan · {totalMin} min</h2>
      <ol className="plan">
        {lesson.blocks.map((b, i) => {
          const games = (b.activityIds ?? []).map((id) => getActivity(unit, id)?.title).filter(Boolean)
          const song = getSong(b.songId)
          return (
            <li key={i}>
              <span className="plan-name">{BLOCK_LABELS[b.type]?.en ?? b.type}</span>
              <span className="plan-detail">{games.length ? games.join(' → ') : song?.title}</span>
              <span className="plan-min">{b.minutes} min</span>
            </li>
          )
        })}
      </ol>

      {lesson.teacherNotes?.length ? (
        <details className="overview-notes" lang="es">
          <summary>Notas para ti</summary>
          {lesson.teacherNotes.map((n, i) => (
            <p key={i}>{n}</p>
          ))}
        </details>
      ) : null}

      <button type="button" className="start-btn" onClick={start}>
        ▶ Start session
      </button>
    </div>
  )
}
