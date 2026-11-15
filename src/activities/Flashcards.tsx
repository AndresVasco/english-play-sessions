// Flashcards: big picture + word. Tap the card to hear it.
// Teacher marks ✓ (got it: praise + confetti, next card) or ↻ (try again:
// a kind retry phrase, then the word again). No failure feedback ever.

import { useCallback, useEffect, useRef, useState } from 'react'
import { promptsFor } from '../content/index.ts'
import { play } from '../lib/audio.ts'
import { BigCard, PromptLine, itemClip, promptClip, useFeedback } from './shared.tsx'
import type { ActivityProps, MarkResult } from './types.ts'

export function Flashcards({ activity, items, handleRef, onFocus, onMark, celebrate }: ActivityProps) {
  const [index, setIndex] = useState(0)
  const prompt = promptsFor(activity)[0]
  const item = items[index % items.length]
  const first = useRef(true)
  const fb = useFeedback(celebrate)

  // When a card appears: say the instruction once (first card), then the word.
  useEffect(() => {
    if (!item) return
    onFocus([item])
    if (first.current) {
      first.current = false
      play(promptClip(prompt), itemClip(item))
    } else {
      play(itemClip(item))
    }
  }, [item, prompt, onFocus])

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
        // Move on after the praise, unless the teacher already moved.
        const markedIndex = index
        fb.praise().then(() => {
          window.setTimeout(() => setIndex((i) => (i === markedIndex ? (i + 1) % items.length : i)), 300)
        })
      } else {
        fb.retry(itemClip(item))
      }
    },
    [item, index, items.length, onMark, fb],
  )

  useEffect(() => {
    handleRef.current = { next, repeat, mark }
    return () => {
      handleRef.current = null
    }
  }, [handleRef, next, repeat, mark])

  if (!item) return null

  return (
    <div className="flashcards">
      <PromptLine prompt={prompt} />
      <BigCard item={item} onClick={repeat} />
      <div className="card-dots" aria-hidden="true">
        {items.map((it, i) => (
          <span key={it.id} className={i === index % items.length ? 'dot on' : 'dot'} />
        ))}
      </div>
      {fb.node}
    </div>
  )
}
