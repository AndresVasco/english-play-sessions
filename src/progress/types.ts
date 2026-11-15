// Learner progress, stored ONLY on this device (IndexedDB). Never sent anywhere.
// Moving progress between devices = export file → import file.

import type { MarkResult } from '../activities/types.ts'

/** Bump when the shape below changes; import refuses other versions. */
export const SCHEMA_VERSION = 1

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

export interface Meta {
  schemaVersion: number
  lastLessonId: string | null
}

export interface ProgressData {
  items: ItemProgress[]
  sessions: SessionLog[]
  stickers: EarnedSticker[]
  meta: Meta
}

/** The export file: english-progress-YYYY-MM-DD.json */
export interface ProgressFile extends ProgressData {
  schemaVersion: number
  app: 'english-play-sessions'
  exportedAt: string
}
