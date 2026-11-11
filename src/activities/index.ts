// Registry: activity type → component. Phase 2 replaces the ItemBoard
// stand-ins with the real games.

import type { ComponentType } from 'react'
import type { ActivityType } from '../content/types.ts'
import { Flashcards } from './Flashcards.tsx'
import { ItemBoard } from './ItemBoard.tsx'
import type { ActivityProps } from './types.ts'

export const ACTIVITY_COMPONENTS: Record<ActivityType, ComponentType<ActivityProps>> = {
  flashcards: Flashcards,
  'simon-says': ItemBoard,
  'find-it': ItemBoard,
  'freeze-dance': ItemBoard,
  faces: ItemBoard,
  'listen-and-tap': ItemBoard,
  'memory-match': ItemBoard,
}
