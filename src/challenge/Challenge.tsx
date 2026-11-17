// Pip's Challenge — what SHE sees: a short game with Pip.
// - Comprehension: she hears a word and touches a picture (scored silently).
// - Production: she sees a picture and says the word; the teacher marks
//   ✓ on her own / 🤝 with help / ↻ not yet, then the word is said for her.
// Every answer fills a star. There is never a "wrong" signal, and at the end
// she always gets a medal for playing. Results are only for the teacher.

import { useCallback, useEffect, useRef, useState } from 'react'
import { common, getItem, promptAudio } from '../content/index.ts'
import type { Item, Prompt } from '../content/types.ts'
import { Bi } from '../components/Peek.tsx'
import { Pip, pipCheer } from '../components/Pip.tsx'
import { play } from '../lib/audio.ts'
import { BigCard, PromptLine, itemClip } from '../activities/shared.tsx'
import type { PlannedItem } from '../progress/evaluation.ts'
import type { EvalResult, Evaluation, EvaluationItem } from '../progress/types.ts'
import { addSticker, newSessionId, saveEvaluation } from '../progress/store.ts'

const prompt = (id: string): Prompt =>
  common.prompts.challenge.find((p) => p.id === id) ?? common.prompts.challenge[0]
const say = (p: Prompt) => play({ src: promptAudio(p), text: p.en, lang: 'en' })

export const MEDAL = { id: 'pip-medal', emoji: '🏅' }

interface Props {
  kind: Evaluation['kind']
  plan: PlannedItem[]
  unitId?: string
  lessonId?: string
  /** Weekly only: the teacher can skip it today (normal review instead) */
  onSkip?: () => void
  onFocus: (items: Item[]) => void
  celebrate: () => void
  /** Called once, when the results are saved */
  onSaved?: (e: Evaluation) => void
}

export function Challenge({ kind, plan, unitId, lessonId, onSkip, onFocus, celebrate, onSaved }: Props) {
  const [phase, setPhase] = useState<'intro' | 'play' | 'medal'>('intro')
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const results = useRef<EvaluationItem[]>([])
  const startedAt = useRef(Date.now())
  const busy = useRef(false)
  const step = plan[index]
  const item = step ? getItem(step.itemId) : undefined

  useEffect(() => {
    if (phase === 'intro') say(prompt('p-challenge-start'))
  }, [phase])

  // Each new word: say the instruction, then (comprehension) the word.
  useEffect(() => {
    if (phase !== 'play' || !item || !step) return
    setRevealed(false)
    busy.current = false
    if (step.skill === 'comprehension') {
      onFocus([])
      const p = prompt('p-challenge-listen')
      play({ src: promptAudio(p), text: p.en, lang: 'en' }, itemClip(item))
    } else {
      onFocus([])
      say(prompt('p-challenge-say'))
    }
  }, [phase, index, item, step, onFocus])

  const finish = useCallback(() => {
    setPhase('medal')
    const e: Evaluation = {
      id: newSessionId(),
      date: new Date(startedAt.current).toISOString(),
      kind,
      unitId,
      lessonId,
      durationSec: Math.round((Date.now() - startedAt.current) / 1000),
      items: results.current,
    }
    saveEvaluation(e)
      .then(() => onSaved?.(e))
      .catch((err) => console.error('Could not save the challenge', err))
    addSticker(MEDAL.id, MEDAL.emoji, lessonId ?? unitId ?? '').catch(() => {})
    celebrate()
    pipCheer()
    say(prompt('p-challenge-done'))
  }, [kind, unitId, lessonId, celebrate, onSaved])

  const record = useCallback(
    (result: EvalResult) => {
      if (!step || busy.current) return
      busy.current = true
      results.current.push({ itemId: step.itemId, skill: step.skill, result, retention: step.retention })
      const nextStep = () => (index + 1 >= plan.length ? finish() : setIndex((i) => i + 1))
      if (step.skill === 'production' && item) {
        // Always model the word for her, whatever the mark.
        setRevealed(true)
        play(itemClip(item)).then(() => window.setTimeout(nextStep, 500))
      } else {
        window.setTimeout(nextStep, 600)
      }
    },
    [step, item, index, plan.length, finish],
  )

  if (phase === 'intro') {
    return (
      <div className="challenge">
        <div className="challenge-hero" aria-hidden="true">
          🏅
        </div>
        <div className="pip-says">
          <Pip size={96} />
          <div className="activity-prompt bubble">
            <Bi en={prompt('p-challenge-start').en} es={prompt('p-challenge-start').es} />
          </div>
        </div>
        <button
          type="button"
          className="big-action"
          onClick={() => {
            startedAt.current = Date.now()
            setPhase('play')
          }}
        >
          ▶ Start
        </button>
        <p className="teacher-hint">
          {kind === 'weekly' ? 'Weekly check' : 'Unit check'} · {plan.length} words · about {Math.ceil(plan.length / 3)} min
        </p>
        {onSkip && (
          <button type="button" className="game-toggle" onClick={onSkip}>
            Skip today → normal review
          </button>
        )}
      </div>
    )
  }

  if (phase === 'medal') {
    const done = prompt('p-challenge-done')
    return (
      <div className="challenge">
        <div className="challenge-medal" aria-hidden="true">
          🏅
        </div>
        <Bi className="goodbye-text" en={done.en} es={done.es} />
        <Stars total={plan.length} filled={plan.length} />
      </div>
    )
  }

  if (!step || !item) return null

  return (
    <div className="challenge">
      <Stars total={plan.length} filled={index} />
      {step.skill === 'comprehension' ? (
        <>
          <PromptLine prompt={prompt('p-challenge-listen')} />
          <button type="button" className="listen-btn" onClick={() => play(itemClip(item))} aria-label="Hear the word again">
            👂🔊
          </button>
          <div className="choice-grid">
            {(step.options ?? [step.itemId]).map((id) => {
              const opt = getItem(id)
              if (!opt) return null
              return (
                <button
                  type="button"
                  key={id}
                  className="choice"
                  onClick={() => record(id === step.itemId ? 'got' : 'again')}
                  aria-label={opt.text}
                >
                  <span className="choice-image" aria-hidden="true">
                    {opt.image}
                  </span>
                </button>
              )
            })}
          </div>
        </>
      ) : (
        <>
          <PromptLine prompt={prompt('p-challenge-say')} />
          <BigCard item={item} showWord={revealed} onClick={() => revealed && play(itemClip(item))} />
          <div className="teacher-marks" aria-label="For the teacher">
            <span className="teacher-marks-label">She says it…</span>
            <button type="button" className="tb-btn mark" onClick={() => record('got')} disabled={revealed}>
              ✓<small>On her own</small>
            </button>
            <button type="button" className="tb-btn mark" onClick={() => record('helped')} disabled={revealed}>
              🤝<small>With help</small>
            </button>
            <button type="button" className="tb-btn mark" onClick={() => record('again')} disabled={revealed}>
              ↻<small>Not yet</small>
            </button>
          </div>
        </>
      )}
    </div>
  )
}

/** One star per word: filled as she answers (effort, not score). */
function Stars({ total, filled }: { total: number; filled: number }) {
  return (
    <div className="challenge-stars" aria-label={`${filled} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={i < filled ? 'on' : ''}>
          {i < filled ? '⭐' : '☆'}
        </span>
      ))}
    </div>
  )
}
