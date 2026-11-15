// Registry: activity type → component. Adding a new activity type means
// adding its component here and its name to ACTIVITY_TYPES (content/types.ts).

import type { ComponentType } from 'react'
import type { ActivityType } from '../content/types.ts'
import { Faces } from './Faces.tsx'
import { FindIt } from './FindIt.tsx'
import { Flashcards } from './Flashcards.tsx'
import { FreezeDance } from './FreezeDance.tsx'
import { ListenAndTap } from './ListenAndTap.tsx'
import { MemoryMatch } from './MemoryMatch.tsx'
import { SimonSays } from './SimonSays.tsx'
import type { ActivityProps } from './types.ts'

export const ACTIVITY_COMPONENTS: Record<ActivityType, ComponentType<ActivityProps>> = {
  flashcards: Flashcards,
  'simon-says': SimonSays,
  'find-it': FindIt,
  'freeze-dance': FreezeDance,
  faces: Faces,
  'listen-and-tap': ListenAndTap,
  'memory-match': MemoryMatch,
}
