// The picture of a word: an ARASAAC pictogram when the item has one
// ("picture" in the content), otherwise its emoji. If the file can't load,
// the emoji is shown instead.

import { useState } from 'react'
import type { Item } from '../content/types.ts'

/** Number of visible symbols in an emoji string ("👉👃" = 2). */
const symbolCount = (text: string) =>
  typeof Intl !== 'undefined' && 'Segmenter' in Intl
    ? [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text)].length
    : Array.from(text).length

export function ItemPicture({ item, className = '' }: { item: Item; className?: string }) {
  const [failed, setFailed] = useState(false)
  if (item.picture && !failed) {
    return (
      <img
        className={`item-picture ${className}`}
        src={import.meta.env.BASE_URL + item.picture}
        alt=""
        draggable={false}
        onError={() => setFailed(true)}
      />
    )
  }
  // Several emoji together stay on one line and get smaller, so they never
  // spill out of the card.
  const n = symbolCount(item.image)
  return (
    <span className={`${className} emoji-pic ${n > 1 ? `multi-${Math.min(n, 3)}` : ''}`} aria-hidden="true">
      {item.image}
    </span>
  )
}
