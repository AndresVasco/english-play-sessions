// Simon Says: the app calls a command every few seconds (audio + big picture
// + text). The teacher can pause, mark ✓/↻, or jump to the next command.
// Speed comes from Settings ("Simon Says speed").

import { useCallback, useEffect, useRef, useState } from 'react'
import { promptsFor } from '../content/index.ts'
import type { Item } from '../content/types.ts'
import { play } from '../lib/audio.ts'
import { useSettings } from '../lib/settings.tsx'
import { BigCard, PromptLine, itemClip, pickNext, promptClip, useFeedback } from './shared.tsx'
import type { ActivityProps, MarkResult } from './types.ts'

export function SimonSays({ activity, items, handleRef, onFocus, onMark, celebrate }: ActivityProps) {
  const { settings } = useSettings()
  const prompt = promptsFor(activity)[0]
  const [current, setCurrent] = useState<Item | null>(null)
  const [paused, setPaused] = useState(false)
  const [count, setCount] = useState(0)
  const fb = useFeedback(celebrate)
  const started = useRef(false)

  const call = useCallback(() => {
    setCurrent((prev) => pickNext(items, prev ?? undefined))
    setCount((c) => c + 1)
  }, [items])

  // Start: "Listen and move!", then the first command.
  useEffect(() => {
    if (started.current) return
    started.current = true
    play(promptClip(prompt)).then(() => window.setTimeout(call, 400))
  }, [prompt, call])

  // Say each new command.
  useEffect(() => {
    if (!current) return
    onFocus([current])
    play(itemClip(current))
  }, [current, count, onFocus])

  // Automatic calling while not paused.
  useEffect(() => {
    if (paused || !current) return
    const id = window.setTimeout(call, settings.simonSeconds * 1000)
    return () => window.clearTimeout(id)
  }, [paused, current, count, call, settings.simonSeconds])

  const next = useCallback(() => {
    call()
    return true
  }, [call])
  const repeat = useCallback(() => {
    if (current) play(itemClip(current))
  }, [current])
  const mark = useCallback(
    (result: MarkResult) => {
      if (!current) return
      onMark(current.id, result)
      if (result === 'got') fb.praise()
      else fb.retry(itemClip(current))
    },
    [current, onMark, fb],
  )

  useEffect(() => {
    handleRef.current = { next, repeat, mark }
    return () => {
      handleRef.current = null
    }
  }, [handleRef, next, repeat, mark])

  return (
    <div className="flashcards">
      <PromptLine prompt={prompt} />
      {current ? <BigCard item={current} onClick={repeat} /> : <div className="flashcard placeholder">👂</div>}
      <button type="button" className="game-toggle" onClick={() => setPaused((p) => !p)}>
        {paused ? '▶ Continue' : `⏸ Pause · every ${settings.simonSeconds}s`}
      </button>
      {fb.node}
    </div>
  )
}
