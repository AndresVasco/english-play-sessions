// Memory match: picture cards and word cards, face down. She turns two.
// A pair (picture ↔ its word) stays up, the word is said and confetti falls.
// Not a pair: both turn back quietly. No failure sound, no score.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { promptsFor } from '../content/index.ts'
import type { Item } from '../content/types.ts'
import { Bi } from '../components/Peek.tsx'
import { play } from '../lib/audio.ts'
import { PromptLine, itemClip, promptClip, shuffle, useFeedback } from './shared.tsx'
import { pipCheer } from '../components/Pip.tsx'
import type { ActivityProps } from './types.ts'

interface Card {
  key: string
  item: Item
  kind: 'picture' | 'word'
}

function deal(items: Item[], pairs: number): Card[] {
  const chosen = shuffle(items).slice(0, pairs)
  return shuffle(chosen.flatMap((item) => [
    { key: `${item.id}-p`, item, kind: 'picture' as const },
    { key: `${item.id}-w`, item, kind: 'word' as const },
  ]))
}

export function MemoryMatch({ activity, items, handleRef, onFocus, celebrate }: ActivityProps) {
  const prompt = promptsFor(activity)[0]
  const pairs = Math.min(items.length, Number(activity.config?.pairs ?? 6))
  const [game, setGame] = useState(0)
  const cards = useMemo(() => deal(items, pairs), [items, pairs, game]) // eslint-disable-line react-hooks/exhaustive-deps
  const [open, setOpen] = useState<string[]>([])
  const [matched, setMatched] = useState<Set<string>>(new Set())
  const busy = useRef(false)
  const fb = useFeedback(celebrate)
  const done = matched.size === pairs

  useEffect(() => {
    play(promptClip(prompt))
  }, [prompt, game])

  const restart = useCallback(() => {
    setOpen([])
    setMatched(new Set())
    busy.current = false
    setGame((g) => g + 1)
    return true
  }, [])

  useEffect(() => {
    handleRef.current = { next: restart, repeat: () => play(promptClip(prompt)) }
    return () => {
      handleRef.current = null
    }
  }, [handleRef, restart, prompt])

  useEffect(() => {
    if (done) fb.praise()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done])

  const flip = (card: Card) => {
    if (busy.current || open.includes(card.key) || matched.has(card.item.id)) return
    onFocus([card.item])
    play(itemClip(card.item))
    const nowOpen = [...open, card.key]
    setOpen(nowOpen)
    if (nowOpen.length < 2) return
    const [a, b] = nowOpen.map((k) => cards.find((c) => c.key === k)!)
    busy.current = true
    if (a.item.id === b.item.id) {
      window.setTimeout(() => {
        setMatched((m) => new Set(m).add(a.item.id))
        setOpen([])
        celebrate()
        pipCheer()
        busy.current = false
      }, 500)
    } else {
      window.setTimeout(() => {
        setOpen([])
        busy.current = false
      }, 1400)
    }
  }

  return (
    <div className="memory">
      <PromptLine prompt={prompt} />
      <div className="memory-grid">
        {cards.map((card) => {
          const up = open.includes(card.key) || matched.has(card.item.id)
          return (
            <button
              type="button"
              key={card.key}
              className={`memory-card ${up ? 'up' : ''} ${matched.has(card.item.id) ? 'matched' : ''}`}
              onClick={() => flip(card)}
              aria-label={up ? card.item.text : 'Card'}
            >
              {up ? (
                card.kind === 'picture' ? (
                  <span className="memory-picture">{card.item.image}</span>
                ) : (
                  <Bi className="memory-word" en={card.item.text} es={card.item.translation} />
                )
              ) : (
                <span className="memory-back">?</span>
              )}
            </button>
          )
        })}
      </div>
      {done && (
        <button type="button" className="big-action" onClick={restart}>
          🔁 Play again
        </button>
      )}
      {fb.node}
    </div>
  )
}
