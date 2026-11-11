// Temporary screen for games that arrive in Phase 2. It keeps the session
// flowing: shows the game's instruction and its words as big tappable
// pictures (tap = hear the word) so the teacher can lead the game.

import { useEffect } from 'react'
import { fillPrompt, promptAudio, promptsFor } from '../content/index.ts'
import type { Item } from '../content/types.ts'
import { Bi } from '../components/Peek.tsx'
import { play } from '../lib/audio.ts'
import type { ActivityProps } from './types.ts'

export function ItemBoard({ activity, items, handleRef, onFocus }: ActivityProps) {
  const prompt = promptsFor(activity)[0]
  const text = fillPrompt(prompt)

  useEffect(() => {
    onFocus(items)
    const pa = promptAudio(prompt)
    if (pa) play({ src: pa, text: prompt.en, lang: 'en' })
  }, [items, prompt, onFocus])

  useEffect(() => {
    handleRef.current = {
      repeat: () => {
        const pa = promptAudio(prompt)
        if (pa) play({ src: pa, text: prompt.en, lang: 'en' })
      },
    }
    return () => {
      handleRef.current = null
    }
  }, [handleRef, prompt])

  const tap = (item: Item) => {
    onFocus([item])
    play({ src: item.audio, text: item.text, lang: 'en' })
  }

  return (
    <div className="item-board">
      <div className="activity-prompt">
        <Bi en={prompt.en.includes('___') ? text.en.replace('___', '…') : text.en} es={text.es.replace('___', '…')} />
      </div>
      <div className="item-grid">
        {items.map((item) => (
          <button type="button" key={item.id} className="item-tile" onClick={() => tap(item)}>
            <span className="item-tile-image" aria-hidden="true">
              {item.image}
            </span>
            <Bi en={item.text} es={item.translation} />
          </button>
        ))}
      </div>
      <p className="teacher-hint">
        {activity.title} · full game screen arrives in Phase 2. Tap a picture to hear it.
      </p>
    </div>
  )
}
