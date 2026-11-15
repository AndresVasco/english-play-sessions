// find-it. Two variants:
// - "door" (Lesson 1): knock → the app shows sun 🌅 or moon 🌙 and asks
//   "Good morning or good night?" → teacher marks → she leaves: "Goodbye!".
// - default: "Find something ___!" with a countdown; teacher marks found/not.

import { useCallback, useEffect, useState } from 'react'
import { getItem, promptsFor } from '../content/index.ts'
import type { Item } from '../content/types.ts'
import { play } from '../lib/audio.ts'
import { BigCard, PromptLine, itemClip, pickNext, promptClip, useFeedback } from './shared.tsx'
import type { ActivityProps, MarkResult } from './types.ts'

export function FindIt(props: ActivityProps) {
  return props.activity.config?.variant === 'door' ? <DoorGame {...props} /> : <FindSomething {...props} />
}

type DoorStep = 'knock' | 'situation' | 'leave'

function DoorGame({ activity, items, handleRef, onFocus, onMark, celebrate }: ActivityProps) {
  const prompts = promptsFor(activity)
  const knockPrompt = prompts.find((p) => p.id === 'p-door-knock') ?? prompts[0]
  const whichPrompt = prompts.find((p) => p.id === 'p-door-which') ?? prompts[1] ?? prompts[0]
  // From the content: config.situations (comma-separated item ids) and
  // config.leaveItem (said when she leaves). Defaults: all items / none.
  const ids = String(activity.config?.situations ?? '').split(',').map((s) => s.trim()).filter(Boolean)
  const situations = ids.length ? items.filter((i) => ids.includes(i.id)) : items
  const goodbye = activity.config?.leaveItem ? getItem(String(activity.config.leaveItem)) : undefined
  const fb = useFeedback(celebrate)

  const [step, setStep] = useState<DoorStep>('knock')
  const [situation, setSituation] = useState<Item>(() => pickNext(situations))
  const [answered, setAnswered] = useState(false)

  const current = step === 'situation' ? situation : step === 'leave' ? goodbye : undefined

  const announce = useCallback(
    (s: DoorStep) => {
      if (s === 'knock') play(promptClip(knockPrompt))
      else if (s === 'situation') play(promptClip(whichPrompt))
      else if (goodbye) play(itemClip(goodbye))
    },
    [knockPrompt, whichPrompt, goodbye],
  )

  useEffect(() => {
    onFocus(current ? [current] : [])
    announce(step)
  }, [step, situation, current, onFocus, announce])

  const next = useCallback(() => {
    setAnswered(false)
    if (step === 'knock') {
      setSituation((prev) => pickNext(situations, prev))
      setStep('situation')
    } else if (step === 'situation' && goodbye) setStep('leave')
    else setStep('knock')
    return true
  }, [step, situations, goodbye])

  const mark = useCallback(
    (result: MarkResult) => {
      if (!current) return
      onMark(current.id, result)
      if (result === 'got') {
        setAnswered(true)
        fb.praise(itemClip(current)).then(() => window.setTimeout(() => next(), 600))
      } else {
        fb.retry(promptClip(step === 'situation' ? whichPrompt : knockPrompt))
      }
    },
    [current, onMark, fb, next, step, whichPrompt, knockPrompt],
  )

  const repeat = useCallback(() => announce(step), [announce, step])

  useEffect(() => {
    handleRef.current = { next, repeat, mark }
    return () => {
      handleRef.current = null
    }
  }, [handleRef, next, repeat, mark])

  return (
    <div className="flashcards">
      {step === 'knock' && (
        <>
          <PromptLine prompt={knockPrompt} />
          <button type="button" className="flashcard door" onClick={repeat} aria-label="Knock knock">
            <span className="flashcard-image" aria-hidden="true">
              🚪
            </span>
            <span className="knock" aria-hidden="true">
              ✊ knock, knock!
            </span>
          </button>
        </>
      )}
      {step === 'situation' && (
        <>
          <PromptLine prompt={whichPrompt} />
          {/* The word stays hidden until she answers: she has to say it. */}
          <BigCard item={situation} showWord={answered} onClick={repeat} />
        </>
      )}
      {step === 'leave' && goodbye && (
        <>
          <div className="activity-prompt">👋</div>
          <BigCard item={goodbye} onClick={() => play(itemClip(goodbye))} />
        </>
      )}
      <p className="teacher-hint">
        {step === 'knock' && 'Open the door, then tap ▶ Next'}
        {step === 'situation' && 'She greets: ✓ or ↻ (▶ Next skips)'}
        {step === 'leave' && 'She says goodbye: ✓ or ↻'}
      </p>
      {fb.node}
    </div>
  )
}

function FindSomething({ activity, items, handleRef, onFocus, onMark, celebrate }: ActivityProps) {
  const prompt = promptsFor(activity)[0]
  const seconds = Number(activity.config?.seconds ?? 20)
  const [target, setTarget] = useState<Item>(() => pickNext(items))
  const [left, setLeft] = useState(seconds)
  const fb = useFeedback(celebrate)

  useEffect(() => {
    onFocus([target])
    setLeft(seconds)
    play(promptClip(prompt, target))
    const id = window.setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000)
    return () => window.clearInterval(id)
  }, [target, prompt, seconds, onFocus])

  const next = useCallback(() => {
    setTarget((t) => pickNext(items, t))
    return true
  }, [items])
  const repeat = useCallback(() => play(promptClip(prompt, target)), [prompt, target])
  const mark = useCallback(
    (result: MarkResult) => {
      onMark(target.id, result)
      if (result === 'got') fb.praise(itemClip(target)).then(() => window.setTimeout(next, 600))
      else fb.retry(promptClip(prompt, target))
    },
    [target, onMark, fb, next, prompt],
  )

  useEffect(() => {
    handleRef.current = { next, repeat, mark }
    return () => {
      handleRef.current = null
    }
  }, [handleRef, next, repeat, mark])

  return (
    <div className="flashcards">
      <PromptLine prompt={prompt} item={target} />
      <BigCard item={target} onClick={repeat} />
      <div className="countdown" aria-label="Seconds left">
        {left > 0 ? `⏳ ${left}` : '⏳'}
      </div>
      {fb.node}
    </div>
  )
}
