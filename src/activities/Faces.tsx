// Faces. Normal mode: the app shows a feeling, "Show me your ___ face!",
// she makes the face, the teacher marks ✓/↻.
// Guess mode (reversed): "Guess my face!" — the teacher makes a face, she
// says the word; she can tap a picture to answer.

import { useCallback, useEffect, useState } from 'react'
import { promptsFor } from '../content/index.ts'
import type { Item } from '../content/types.ts'
import { play } from '../lib/audio.ts'
import { BigCard, PromptLine, itemClip, pickNext, promptClip, useFeedback } from './shared.tsx'
import type { ActivityProps, MarkResult } from './types.ts'

export function Faces({ activity, items, handleRef, onFocus, onMark, celebrate }: ActivityProps) {
  const prompts = promptsFor(activity)
  const showPrompt = prompts.find((p) => p.en.includes('___')) ?? prompts[0]
  const guessPrompt = prompts.find((p) => !p.en.includes('___')) ?? prompts[0]
  const [guessMode, setGuessMode] = useState(activity.config?.mode === 'reversed')
  const [current, setCurrent] = useState<Item>(() => pickNext(items))
  const [chosen, setChosen] = useState<Item | null>(null)
  const fb = useFeedback(celebrate)

  useEffect(() => {
    if (guessMode) {
      onFocus(items)
      play(promptClip(guessPrompt))
    } else {
      onFocus([current])
      play(promptClip(showPrompt, current))
    }
  }, [guessMode, current, items, showPrompt, guessPrompt, onFocus])

  const next = useCallback(() => {
    setChosen(null)
    if (guessMode) play(promptClip(guessPrompt))
    else setCurrent((c) => pickNext(items, c))
    return true
  }, [guessMode, guessPrompt, items])

  const repeat = useCallback(() => {
    if (guessMode) play(promptClip(guessPrompt))
    else play(promptClip(showPrompt, current))
  }, [guessMode, guessPrompt, showPrompt, current])

  const mark = useCallback(
    (result: MarkResult) => {
      const item = guessMode ? chosen : current
      if (!item) {
        // Guess mode with no picture tapped: still celebrate her effort.
        if (result === 'got') fb.praise()
        else fb.retry()
        return
      }
      onMark(item.id, result)
      if (result === 'got') fb.praise().then(() => window.setTimeout(next, 500))
      else fb.retry(guessMode ? promptClip(guessPrompt) : promptClip(showPrompt, item))
    },
    [guessMode, chosen, current, onMark, fb, next, guessPrompt, showPrompt],
  )

  useEffect(() => {
    handleRef.current = { next, repeat, mark }
    return () => {
      handleRef.current = null
    }
  }, [handleRef, next, repeat, mark])

  const tap = (item: Item) => {
    setChosen(item)
    onFocus([item])
    play(itemClip(item))
  }

  return (
    <div className="flashcards">
      {guessMode ? (
        <>
          <PromptLine prompt={guessPrompt} />
          <div className="choice-grid">
            {items.map((item) => (
              <button
                type="button"
                key={item.id}
                className={chosen?.id === item.id ? 'choice chosen' : 'choice'}
                onClick={() => tap(item)}
                aria-label={item.text}
              >
                <span className="choice-image" aria-hidden="true">
                  {item.image}
                </span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <PromptLine prompt={showPrompt} item={current} />
          <BigCard item={current} onClick={repeat} />
        </>
      )}
      <button
        type="button"
        className="game-toggle"
        onClick={() => {
          setChosen(null)
          setGuessMode((g) => !g)
        }}
      >
        {guessMode ? '😀 Show-me mode' : '🔄 Guess mode (you make the face)'}
      </button>
      {fb.node}
    </div>
  )
}
