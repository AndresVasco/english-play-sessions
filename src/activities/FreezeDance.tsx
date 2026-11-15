// Freeze Dance: music plays, then stops at a random moment and the app says
// "Freeze! Be ___!". She freezes with that face; the teacher marks ✓/↻.
// The big ❄️ / 💃 button lets her control the music (her favorite variant).

import { useCallback, useEffect, useRef, useState } from 'react'
import { promptsFor } from '../content/index.ts'
import type { Item } from '../content/types.ts'
import { play, stopAudio } from '../lib/audio.ts'
import { playDance, type Playing } from '../lib/music.ts'
import { useSettings } from '../lib/settings.tsx'
import { BigCard, PromptLine, itemClip, pickNext, promptClip, useFeedback } from './shared.tsx'
import type { ActivityProps, MarkResult } from './types.ts'

const randomDanceMs = (min: number, max: number) => (min + Math.random() * (max - min)) * 1000

export function FreezeDance({ activity, items, handleRef, onFocus, onMark, celebrate }: ActivityProps) {
  const { settings } = useSettings()
  const prompts = promptsFor(activity)
  const dancePrompt = prompts.find((p) => !p.en.includes('___')) ?? prompts[0]
  const freezePrompt = prompts.find((p) => p.en.includes('___')) ?? prompts[0]
  const minSec = Number(activity.config?.minDanceSec ?? 6)
  const maxSec = Number(activity.config?.maxDanceSec ?? 14)

  const [dancing, setDancing] = useState(true)
  const [current, setCurrent] = useState<Item | null>(null)
  const [round, setRound] = useState(0)
  const music = useRef<Playing | null>(null)
  const fb = useFeedback(celebrate)

  const freeze = useCallback(() => {
    music.current?.stop()
    music.current = null
    const item = pickNext(items, current ?? undefined)
    setCurrent(item)
    setDancing(false)
    onFocus([item])
    play(promptClip(freezePrompt, item))
  }, [items, current, freezePrompt, onFocus])

  const dance = useCallback(() => {
    stopAudio()
    setDancing(true)
    setRound((r) => r + 1)
  }, [])

  // While dancing: "Dance!", music on, and a random stop.
  useEffect(() => {
    if (!dancing) return
    onFocus([])
    play(promptClip(dancePrompt))
    if (settings.musicOn) music.current = playDance()
    const id = window.setTimeout(freeze, randomDanceMs(minSec, maxSec))
    return () => {
      window.clearTimeout(id)
      music.current?.stop()
      music.current = null
    }
    // freeze is intentionally not a dependency: a new round starts only via `round`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dancing, round, settings.musicOn])

  const next = useCallback(() => {
    if (dancing) freeze()
    else dance()
    return true
  }, [dancing, freeze, dance])
  const repeat = useCallback(() => {
    if (!dancing && current) play(promptClip(freezePrompt, current))
  }, [dancing, current, freezePrompt])
  const mark = useCallback(
    (result: MarkResult) => {
      if (dancing || !current) return
      onMark(current.id, result)
      if (result === 'got') fb.praise(itemClip(current)).then(() => window.setTimeout(dance, 500))
      else fb.retry(promptClip(freezePrompt, current))
    },
    [dancing, current, onMark, fb, dance, freezePrompt],
  )

  useEffect(() => {
    handleRef.current = { next, repeat, mark }
    return () => {
      handleRef.current = null
    }
  }, [handleRef, next, repeat, mark])

  return (
    <div className="flashcards">
      {dancing || !current ? (
        <>
          <PromptLine prompt={dancePrompt} />
          <div className="flashcard dancing" aria-hidden="true">
            <span className="flashcard-image">💃</span>
            {!settings.musicOn && <span className="teacher-hint">Music is off in Settings</span>}
          </div>
        </>
      ) : (
        <>
          <PromptLine prompt={freezePrompt} item={current} />
          <BigCard item={current} onClick={repeat} />
        </>
      )}
      <button type="button" className="big-action" onClick={dancing ? freeze : dance}>
        {dancing ? '❄️ Freeze!' : '💃 Dance!'}
      </button>
      {fb.node}
    </div>
  )
}
