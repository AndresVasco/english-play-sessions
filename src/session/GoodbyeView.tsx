// Block 6. Phase 1: goodbye message + goodbye song lyrics.
// Phase 2 adds the sticker picker and celebration.

import { useEffect } from 'react'
import { common, promptAudio } from '../content/index.ts'
import type { Song } from '../content/types.ts'
import { Bi } from '../components/Peek.tsx'
import { play } from '../lib/audio.ts'

export function GoodbyeView({ song }: { song?: Song }) {
  const goodbye = common.prompts.stickers.find((p) => p.id === 'p-goodbye') ?? common.prompts.stickers[0]

  useEffect(() => {
    play({ src: promptAudio(goodbye), text: goodbye.en, lang: 'en' })
  }, [goodbye])

  return (
    <div className="goodbye">
      <div className="goodbye-wave" aria-hidden="true">
        👋
      </div>
      <Bi className="goodbye-text" en={goodbye.en} es={goodbye.es} />
      {song && (
        <ul className="goodbye-lyrics">
          {song.lines.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ul>
      )}
      <p className="teacher-hint">Sticker picker arrives in Phase 2.</p>
    </div>
  )
}
