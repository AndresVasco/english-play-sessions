// Block 6: she picks a sticker (short celebration), then the goodbye message
// and the goodbye song. On the last lesson of a unit the teacher has a quiet
// button to award the reserved "unit complete" sticker (🏆).
// Earned stickers are saved on the device and shown on the Home sticker board.

import { useEffect, useState } from 'react'
import { common, promptAudio } from '../content/index.ts'
import type { Song, Sticker, Unit } from '../content/types.ts'
import { Bi } from '../components/Peek.tsx'
import { play } from '../lib/audio.ts'
import { useFeedback } from '../activities/shared.tsx'
import { SongView } from './SongView.tsx'
import { useProgress } from '../progress/store.ts'

interface Props {
  unit: Unit
  isLastLesson: boolean
  song?: Song
  celebrate: () => void
  onSticker: (sticker: Sticker) => void
}

export function GoodbyeView({ unit, isLastLesson, song, celebrate, onSticker }: Props) {
  const stickerPrompts = common.prompts.stickers
  const pickPrompt = stickerPrompts.find((p) => p.id === 'p-stickers-pick') ?? stickerPrompts[0]
  const goodbye = stickerPrompts.find((p) => p.id === 'p-goodbye') ?? stickerPrompts[stickerPrompts.length - 1]
  const offered = unit.stickers.filter((s) => !s.reserved)
  const trophy = unit.stickers.find((s) => s.reserved)
  const [chosen, setChosen] = useState<Sticker[]>([])
  const [phase, setPhase] = useState<'pick' | 'goodbye'>('pick')
  const [songReady, setSongReady] = useState(false)
  const fb = useFeedback(celebrate)
  const progress = useProgress()
  const collection = progress?.stickers ?? []

  useEffect(() => {
    play({ src: promptAudio(pickPrompt), text: pickPrompt.en, lang: 'en' })
  }, [pickPrompt])

  useEffect(() => {
    // Say goodbye first, then the goodbye song starts.
    if (phase === 'goodbye') play({ src: promptAudio(goodbye), text: goodbye.en, lang: 'en' }).then(() => setSongReady(true))
  }, [phase, goodbye])

  const choose = (s: Sticker) => {
    if (phase !== 'pick') return
    setChosen((c) => [...c, s])
    onSticker(s)
    fb.praise().then(() => window.setTimeout(() => setPhase('goodbye'), 500))
  }

  const award = (s: Sticker) => {
    if (chosen.some((c) => c.id === s.id)) return
    setChosen((c) => [...c, s])
    onSticker(s)
    fb.praise()
  }

  return (
    <div className="goodbye">
      {phase === 'pick' ? (
        <>
          <Bi className="goodbye-text" en={pickPrompt.en} es={pickPrompt.es} />
          <div className="sticker-grid">
            {offered.map((s) => (
              <button type="button" key={s.id} className="sticker" onClick={() => choose(s)} aria-label={s.id}>
                {s.emoji}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="sticker-won" aria-label="Your stickers">
            {chosen.map((s) => (
              <span key={s.id}>{s.emoji}</span>
            ))}
          </div>
          {collection.length > chosen.length && (
            <div className="board small" aria-label="Her sticker collection">
              {collection.map((s) => (
                <span key={s.id}>{s.emoji}</span>
              ))}
            </div>
          )}
          <Bi className="goodbye-text" en={goodbye.en} es={goodbye.es} />
          {song && songReady && <SongView song={song} compact />}
        </>
      )}
      {isLastLesson && trophy && (
        <button type="button" className="game-toggle" onClick={() => award(trophy)}>
          {trophy.emoji} Award “{trophy.label ?? 'Unit complete'}”
        </button>
      )}
      {fb.node}
    </div>
  )
}
