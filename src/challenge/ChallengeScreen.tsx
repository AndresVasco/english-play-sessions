// End-of-unit Pip's Challenge (the 🏅 stop on the map): a short session of
// its own, then the teacher's summary with the unit's "can do" checklist.

import { useCallback, useEffect, useState } from 'react'
import type { Item, Unit } from '../content/types.ts'
import { Confetti } from '../components/Confetti.tsx'
import { PeekButton, PeekProvider } from '../components/Peek.tsx'
import { play, stopAudio } from '../lib/audio.ts'
import type { PlannedItem } from '../progress/evaluation.ts'
import { loadProgress, recordPeek } from '../progress/store.ts'
import type { Evaluation } from '../progress/types.ts'
import { Challenge } from './Challenge.tsx'
import { unitPlan } from './plan.ts'
import { TeacherSummary } from './TeacherSummary.tsx'

export function ChallengeScreen({ unit, onExit }: { unit: Unit; onExit: () => void }) {
  return (
    <PeekProvider>
      <Inner unit={unit} onExit={onExit} />
    </PeekProvider>
  )
}

function Inner({ unit, onExit }: { unit: Unit; onExit: () => void }) {
  const [plan, setPlan] = useState<PlannedItem[] | null>(null)
  const [saved, setSaved] = useState<Evaluation | null>(null)
  const [showSummary, setShowSummary] = useState(false)
  const [focus, setFocus] = useState<Item[]>([])
  const [burst, setBurst] = useState(0)

  useEffect(() => {
    loadProgress().then((d) => setPlan(unitPlan(unit, d)))
    return () => stopAudio()
  }, [unit])

  const celebrate = useCallback(() => setBurst((b) => b + 1), [])

  if (showSummary && saved) return <TeacherSummary e={saved} unit={unit} onDone={onExit} />

  return (
    <div className="runner">
      <header className="runner-top">
        <button
          type="button"
          className="quiet-btn"
          onClick={() => (saved || window.confirm('Stop the challenge? Nothing is saved.')) && onExit()}
          aria-label="Close"
        >
          ✕
        </button>
        <div className="runner-block">
          <span className="runner-label">
            Pip's Challenge · Unit {unit.number}
          </span>
        </div>
      </header>
      <main className="runner-center">
        {plan && (
          <Challenge kind="unit" plan={plan} unitId={unit.id} onFocus={setFocus} celebrate={celebrate} onSaved={setSaved} />
        )}
      </main>
      <div className="peek-anchor">
        <PeekButton
          onPeek={() => focus.length && recordPeek(focus.map((i) => i.id))}
          onLongPress={() => {
            const it = focus[0]
            if (it) play({ src: it.audioEs, text: it.translation, lang: 'es' }, { src: it.audio, text: it.text, lang: 'en' })
          }}
        />
      </div>
      <footer className="teacher-bar">
        <span className="teacher-hint">Unit check · results are only for you</span>
        {saved && (
          <button type="button" className="tb-btn" onClick={() => setShowSummary(true)}>
            📋<small>See results</small>
          </button>
        )}
      </footer>
      <Confetti burst={burst} />
    </div>
  )
}
