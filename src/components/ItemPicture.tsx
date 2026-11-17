// The picture of a word: an ARASAAC pictogram when the item has one
// ("picture" in the content), otherwise its emoji. If the file can't load,
// the emoji is shown instead.

import { useState } from 'react'
import type { Item } from '../content/types.ts'

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
  return (
    <span className={className} aria-hidden="true">
      {item.image}
    </span>
  )
}
