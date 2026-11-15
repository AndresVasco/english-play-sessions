import { findLesson, getItems, units } from '../content/index.ts'
import { getLegacyLastLessonId } from '../lib/settings.tsx'
import { useProgress } from '../progress/store.ts'
import { UpdateBanner } from '../components/UpdateBanner.tsx'

interface Props {
  openLesson: (lessonId: string) => void
  openSettings: () => void
  openStats: () => void
}

export function Home({ openLesson, openSettings, openStats }: Props) {
  const progress = useProgress()
  const lastId = progress?.meta.lastLessonId ?? getLegacyLastLessonId()
  const last = findLesson(lastId) ?? (units[0] ? { unit: units[0], lesson: units[0].lessons[0] } : undefined)
  const stickers = progress?.stickers ?? []

  return (
    <div className="screen home">
      <header className="screen-head">
        <h1>English Play Sessions</h1>
        <div className="head-actions">
          <button type="button" className="quiet-btn big" onClick={openStats} aria-label="Stats" title="Stats">
            📊
          </button>
          <button type="button" className="quiet-btn big" onClick={openSettings} aria-label="Settings" title="Settings">
            ⚙️
          </button>
        </div>
      </header>

      <UpdateBanner />

      {last && (
        <button type="button" className="continue-btn" onClick={() => openLesson(last.lesson.id)}>
          <span className="continue-icon" aria-hidden="true">▶</span>
          <span>
            <span className="continue-kicker">{lastId ? 'Continue' : 'Start here'}</span>
            <span className="continue-title">
              Unit {last.unit.number} · Lesson {last.lesson.number}: {last.lesson.title}
            </span>
          </span>
        </button>
      )}

      <section className="sticker-board" aria-label="Sticker board">
        <h2>Sticker board {stickers.length > 0 && <small>· {stickers.length}</small>}</h2>
        {stickers.length === 0 ? (
          <p className="unit-goal">Stickers she earns at the end of each session appear here.</p>
        ) : (
          <div className="board">
            {stickers.map((s) => (
              <span key={s.id} title={new Date(s.date).toLocaleDateString()}>
                {s.emoji}
              </span>
            ))}
          </div>
        )}
      </section>

      {units.map((unit) => (
        <section key={unit.id} className="unit">
          <h2>
            Unit {unit.number}: {unit.title}
          </h2>
          <p className="unit-goal">{unit.goal}</p>
          <div className="lesson-grid">
            {unit.lessons.map((lesson) => (
              <button type="button" key={lesson.id} className="lesson-card" onClick={() => openLesson(lesson.id)}>
                <span className="lesson-emoji" aria-hidden="true">
                  {getItems(lesson.newItems)
                    .slice(0, 3)
                    .map((i) => i.image)
                    .join(' ')}
                </span>
                <span className="lesson-num">Lesson {lesson.number}</span>
                <span className="lesson-title">{lesson.title}</span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
