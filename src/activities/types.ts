import type { RefObject } from 'react'
import type { Activity, Item, Lesson, Unit } from '../content/types.ts'

export type MarkResult = 'got' | 'again'

/** What the session runner can ask the current activity to do. */
export interface ActivityHandle {
  /** Go to the next step inside the activity. Return false if there is none
   *  (the runner then moves to the next block). */
  next?: () => boolean
  /** Replay the current audio / step */
  repeat?: () => void
  /** Teacher marking (only activities that support it) */
  mark?: (result: MarkResult) => void
}

export interface ActivityProps {
  unit: Unit
  lesson: Lesson
  activity: Activity
  items: Item[]
  handleRef: RefObject<ActivityHandle | null>
  /** Tell the runner which items are on screen (for the 🇨🇴 peek) */
  onFocus: (items: Item[]) => void
  /** Record a ✓/↻ mark for an item */
  onMark: (itemId: string, result: MarkResult) => void
  /** Short celebration (confetti) */
  celebrate: () => void
}

/** Activity types that show ✓/↻ marking buttons in the teacher bar */
export const MARKABLE = new Set<Activity['type']>(['flashcards'])
