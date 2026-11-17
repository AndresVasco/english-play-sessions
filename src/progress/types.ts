// Learner progress, stored ONLY on this device (IndexedDB). Never sent anywhere.
// Moving progress between devices = export file → import file.

import type { MarkResult } from '../activities/types.ts'

/** Bump when the shape below changes. Import accepts this version and older
 *  ones it knows how to upgrade (see store.ts). v2 added evaluations + can-do. */
export const SCHEMA_VERSION = 2

/** A result in Pip's Challenge: on her own / with help / not yet. */
export type EvalResult = 'got' | 'helped' | 'again'

export interface ItemProgress {
  itemId: string
  /** 0..3 — ✓ raises by 1, ↻ lowers by 1 */
  level: number
  timesSeen: number
  timesCorrect: number
  peekCount: number
  /** ISO date-time */
  lastSeen: string | null
  lastPeeked: string | null
}

export interface SessionLog {
  id: string
  /** ISO date-time when the session started */
  date: string
  lessonId: string
  durationSec: number
  blocksCompleted: number
  marks: { itemId: string; result: MarkResult }[]
}

export interface EarnedSticker {
  id: string
  stickerId: string
  emoji: string
  lessonId: string
  date: string
}

/** One word checked in an evaluation ("Pip's Challenge"). */
export interface EvaluationItem {
  itemId: string
  /** comprehension = she taps the right picture; production = she says it */
  skill: 'comprehension' | 'production'
  result: EvalResult
  /** True if the word was last practised 7+ days before the challenge */
  retention: boolean
}

export interface Evaluation {
  id: string
  date: string
  kind: 'weekly' | 'unit'
  /** For unit challenges */
  unitId?: string
  /** Lesson whose review block hosted a weekly challenge */
  lessonId?: string
  durationSec: number
  items: EvaluationItem[]
}

/** A "can do" statement of a unit, ticked by the teacher. */
export interface CanDoCheck {
  /** `${unitId}#${index}` */
  id: string
  unitId: string
  index: number
  date: string
}

export interface Meta {
  schemaVersion: number
  lastLessonId: string | null
}

export interface ProgressData {
  items: ItemProgress[]
  sessions: SessionLog[]
  stickers: EarnedSticker[]
  evaluations: Evaluation[]
  canDo: CanDoCheck[]
  meta: Meta
}

/** The export file: english-progress-YYYY-MM-DD.json */
export interface ProgressFile extends ProgressData {
  schemaVersion: number
  app: 'english-play-sessions'
  exportedAt: string
}
