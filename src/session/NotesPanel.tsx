// Teacher notes (Spanish). Slides in over the runner; closed by default.

import type { Activity, Lesson } from '../content/types.ts'

interface Props {
  open: boolean
  onClose: () => void
  activities: Activity[]
  lesson: Lesson
}

export function NotesPanel({ open, onClose, activities, lesson }: Props) {
  return (
    <>
      {open && <div className="notes-backdrop" onClick={onClose} />}
      <aside className={open ? 'notes-panel open' : 'notes-panel'} aria-hidden={!open} lang="es">
        <div className="notes-head">
          <strong>Notas para ti</strong>
          <button type="button" className="quiet-btn" onClick={onClose} aria-label="Close notes">
            ✕
          </button>
        </div>
        {activities.length === 0 && <p className="notes-empty">Este bloque no tiene notas.</p>}
        {activities.map((a) => (
          <section key={a.id}>
            <h3>{a.title}</h3>
            <p>{a.teacherNotes}</p>
          </section>
        ))}
        {lesson.teacherNotes?.length ? (
          <section>
            <h3>Para toda la lección</h3>
            {lesson.teacherNotes.map((n, i) => (
              <p key={i}>{n}</p>
            ))}
          </section>
        ) : null}
      </aside>
    </>
  )
}
