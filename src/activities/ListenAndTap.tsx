// Listen and tap: the app says a word, she touches the matching picture.
// Right picture: praise + confetti, then a new word. Another picture: the
// word is simply said again — never "wrong". First-try answers are recorded
// as ✓, otherwise ↻ (data for the teacher only, never shown to her).

import { useCallback, useEffect, useState } from 'react'
import { promptsFor } from '../content/index.ts'
import type { Item } from '../content/types.ts'
import { play } from '../lib/audio.ts'
import { PromptLine, itemClip, pickNext, promptClip, shuffle, useFeedback } from './shared.tsx'
import type { ActivityProps } from './types.ts'
import { ItemPicture } from '../components/ItemPicture.tsx'

function newRound(items: Item[], choices: number, previous?: Item) {
  const target = pickNext(items, previous)
  const others = shuffle(items.filter((i) => i.id !== target.id)).slice(0, choices - 1)
  return { target, options: shuffle([target, ...others]) }
}

export function ListenAndTap({ activity, items, handleRef, onFocus, onMark, celebrate }: ActivityProps) {
  const prompt = promptsFor(activity)[0]
  const choices = Math.min(items.length, Number(activity.config?.choices ?? 4))
  const [round, setRound] = useState(() => newRound(items, choices))
  const [tries, setTries] = useState(0)
  const [solved, setSolved] = useState(false)
  const [first, setFirst] = useState(true)
  const fb = useFeedback(celebrate)

  useEffect(() => {
    onFocus([round.target])
    if (first) {
      setFirst(false)
      play(promptClip(prompt), itemClip(round.target))
    } else play(itemClip(round.target))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round])

  const next = useCallback(() => {
    setTries(0)
    setSolved(false)
    setRound((r) => newRound(items, choices, r.target))
    return true
  }, [items, choices])
  const repeat = useCallback(() => play(itemClip(round.target)), [round])

  useEffect(() => {
    handleRef.current = { next, repeat }
    return () => {
      handleRef.current = null
    }
  }, [handleRef, next, repeat])

  const tap = (item: Item) => {
    if (solved) return
    if (item.id === round.target.id) {
      setSolved(true)
      onMark(item.id, tries === 0 ? 'got' : 'again')
      fb.praise(itemClip(item)).then(() => window.setTimeout(next, 500))
    } else {
      setTries((t) => t + 1)
      play(itemClip(round.target))
    }
  }

  return (
    <div className="flashcards">
      <PromptLine prompt={prompt} />
      <button type="button" className="listen-btn" onClick={repeat} aria-label="Hear the word again">
        👂🔊
      </button>
      <div className="choice-grid">
        {round.options.map((item) => (
          <button
            type="button"
            key={item.id}
            className={solved && item.id === round.target.id ? 'choice chosen' : 'choice'}
            onClick={() => tap(item)}
            aria-label={item.text}
          >
            <ItemPicture item={item} className="choice-image" />
          </button>
        ))}
      </div>
      {fb.node}
    </div>
  )
}
