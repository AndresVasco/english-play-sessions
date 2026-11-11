// Flashcards: big picture + word. Tap the card to hear it.
// Teacher marks ✓ (got it: praise + confetti, next card) or ↻ (try again:
// a kind retry phrase, then the word again). No failure feedback ever.

import { useCallback, useEffect, useRef, useState } from 'react'
import { common, fillPrompt, phraseAudio, promptAudio, promptsFor } from '../content/index.ts'
import type { Item, Prompt } from '../content/types.ts'
import { Bi } from '../components/Peek.tsx'
import { play } from '../lib/audio.ts'
import type { ActivityProps, MarkResult } from './types.ts'

const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)]
const itemClip = (item: Item) => ({ src: item.audio, text: item.text, lang: 'en' as const })
const phraseClip = (p: Prompt) => ({ src: phraseAudio(p), text: p.en, lang: 'en' as const })

export function Flashcards({ activity, items, handleRef, onFocus, onMark, celebrate }: ActivityProps) {
  const [index, setIndex] = useState(0)
  const [feedback, setFeedback] = useState<Prompt | null>(null)
  const prompt = promptsFor(activity)[0]
  const item = items[index % items.length]
  const first = useRef(true)
  const feedbackTimer = useRef<number | undefined>(undefined)

  // When a card appears: say the instruction once (first card), then the word.
  useEffect(() => {
    if (!item) return
    onFocus([item])
    const pa = promptAudio(prompt)
    if (first.current && pa) {
      first.current = false
      play({ src: pa, text: prompt.en, lang: 'en' }, itemClip(item))
    } else {
      play(itemClip(item))
    }
  }, [item, prompt, onFocus])

  useEffect(() => () => window.clearTimeout(feedbackTimer.current), [])

  const showFeedback = (p: Prompt) => {
    setFeedback(p)
    window.clearTimeout(feedbackTimer.current)
    feedbackTimer.current = window.setTimeout(() => setFeedback(null), 1500)
  }

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % items.length)
    return true
  }, [items.length])

  const repeat = useCallback(() => {
    if (item) play(itemClip(item))
  }, [item])

  const mark = useCallback(
    (result: MarkResult) => {
      if (!item) return
      onMark(item.id, result)
      if (result === 'got') {
        const praise = pick(common.praise)
        showFeedback(praise)
        celebrate()
        // Move on after the praise, unless the teacher already moved.
        const markedIndex = index
        play(phraseClip(praise)).then(() => {
          window.setTimeout(() => setIndex((i) => (i === markedIndex ? (i + 1) % items.length : i)), 300)
        })
      } else {
        const retry = pick(common.retry)
        showFeedback(retry)
        play(phraseClip(retry), itemClip(item))
      }
    },
    [item, index, items.length, onMark, celebrate],
  )

  useEffect(() => {
    handleRef.current = { next, repeat, mark }
    return () => {
      handleRef.current = null
    }
  }, [handleRef, next, repeat, mark])

  if (!item) return null
  const text = fillPrompt(prompt)

  return (
    <div className="flashcards">
      <div className="activity-prompt">
        <Bi en={text.en} es={text.es} />
      </div>
      <button type="button" className="flashcard" onClick={repeat} aria-label={`Play "${item.text}"`}>
        <span className="flashcard-image" aria-hidden="true">
          {item.image}
        </span>
        <Bi className="flashcard-word" en={item.text} es={item.translation} />
      </button>
      <div className="card-dots" aria-hidden="true">
        {items.map((it, i) => (
          <span key={it.id} className={i === index % items.length ? 'dot on' : 'dot'} />
        ))}
      </div>
      {feedback && (
        <div className="feedback" role="status">
          <Bi en={feedback.en} es={feedback.es} />
        </div>
      )}
    </div>
  )
}
