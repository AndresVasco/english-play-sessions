import { findLesson, getItems, units } from '../content/index.ts'
import { getLastLessonId } from '../lib/settings.tsx'

interface Props {
  openLesson: (lessonId: string) => void
  openSettings: () => void
}

export function Home({ openLesson, openSettings }: Props) {
  const last = findLesson(getLastLessonId()) ?? (units[0] ? { unit: units[0], lesson: units[0].lessons[0] } : undefined)

  return (
    <div className="screen home">
      <header className="screen-head">
        <h1>English Play Sessions</h1>
        <button type="button" className="quiet-btn big" onClick={openSettings} aria-label="Settings" title="Settings">
          ⚙️
        </button>
      </header>

      {last && (
        <button type="button" className="continue-btn" onClick={() => openLesson(last.lesson.id)}>
          <span className="continue-icon" aria-hidden="true">▶</span>
          <span>
            <span className="continue-kicker">{getLastLessonId() ? 'Continue' : 'Start here'}</span>
            <span className="continue-title">
              Unit {last.unit.number} · Lesson {last.lesson.number}: {last.lesson.title}
            </span>
          </span>
        </button>
      )}

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
