// Helpers shared by all activities.

import { useCallback, useEffect, useRef, useState } from 'react'
import { common, phraseAudio, promptAudio } from '../content/index.ts'
import type { Item, Prompt } from '../content/types.ts'
import { Bi } from '../components/Peek.tsx'
import { Pip, pipCheer } from '../components/Pip.tsx'
import { play, type Clip } from '../lib/audio.ts'
import { ItemPicture } from '../components/ItemPicture.tsx'

export const pick = <T,>(list: T[]): T => list[Math.floor(Math.random() * list.length)]

export function shuffle<T>(list: T[]): T[] {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Random item, avoiding an immediate repeat when possible. */
export function pickNext<T>(list: T[], previous?: T): T {
  if (list.length < 2) return list[0]
  let next = pick(list)
  while (next === previous) next = pick(list)
  return next
}

export const itemClip = (item: Item): Clip => ({ src: item.audio, text: item.text, lang: 'en' })
export const phraseClip = (p: Prompt): Clip => ({ src: phraseAudio(p), text: p.en, lang: 'en' })
/** An instruction, with its "___" filled by `item` when needed. */
export const promptClip = (p: Prompt, item?: Item): Clip => ({
  src: promptAudio(p, item),
  text: item ? p.en.replace('___', item.text) : p.en,
  lang: 'en',
})

/** Praise (✓) and kind retry (↻) feedback: a big friendly bubble + audio.
 *  Never a failure sound. */
export function useFeedback(celebrate: () => void) {
  const [bubble, setBubble] = useState<Prompt | null>(null)
  const timer = useRef<number | undefined>(undefined)
  const show = useCallback((p: Prompt) => {
    setBubble(p)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setBubble(null), 1500)
  }, [])
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const praise = useCallback(
    (...after: Clip[]) => {
      const p = pick(common.praise)
      show(p)
      celebrate()
      pipCheer()
      return play(phraseClip(p), ...after)
    },
    [celebrate, show],
  )
  const retry = useCallback(
    (...after: Clip[]) => {
      const p = pick(common.retry)
      show(p)
      return play(phraseClip(p), ...after)
    },
    [show],
  )
  const node = bubble ? (
    <div className="feedback" role="status">
      <Bi en={bubble.en} es={bubble.es} />
    </div>
  ) : null
  return { praise, retry, node }
}

/** The instruction at the top of an activity, said by Pip in a speech
 *  bubble (with "___" filled in). */
export function PromptLine({ prompt, item }: { prompt: Prompt; item?: Item }) {
  const en = item ? prompt.en.replace('___', item.text) : prompt.en
  const es = item ? prompt.es.replace('___', item.translation) : prompt.es
  return (
    <div className="pip-says">
      <Pip size={84} />
      <div className="activity-prompt bubble">
        <Bi en={en} es={es} />
      </div>
    </div>
  )
}

/** Big centered picture + word (used by several games). */
export function BigCard({ item, showWord = true, onClick }: { item: Item; showWord?: boolean; onClick?: () => void }) {
  return (
    <button type="button" className="flashcard" onClick={onClick} aria-label={`Play "${item.text}"`}>
      <ItemPicture item={item} className="flashcard-image" />
      {showWord && <Bi className="flashcard-word" en={item.text} es={item.translation} />}
    </button>
  )
}
