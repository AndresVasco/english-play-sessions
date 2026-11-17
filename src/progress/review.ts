// The review rule (BUILD-BRIEF section 6), simple and deterministic:
// - ✓ raises the level by 1 (max 3), ↻ lowers it by 1 (min 0); in Pip's
//   Challenge "with help" counts as seen but keeps the level.
// - A peek never lowers the level; it only moves the item up in the review order.
// - Review picks items ordered by: lowest level, then peeked in the last
//   session, then oldest lastSeen. Max 6 items.

import type { MarkResult } from '../activities/types.ts'
import type { EvalResult, ItemProgress } from './types.ts'

export const MAX_LEVEL = 3
export const REVIEW_SIZE = 6

export function emptyProgress(itemId: string): ItemProgress {
  return { itemId, level: 0, timesSeen: 0, timesCorrect: 0, peekCount: 0, lastSeen: null, lastPeeked: null }
}

/** ✓ raises the level, ↻ lowers it; "with help" (evaluations) keeps it. */
export function applyMark(p: ItemProgress, result: MarkResult | EvalResult, now: string): ItemProgress {
  const level =
    result === 'got' ? Math.min(MAX_LEVEL, p.level + 1) : result === 'again' ? Math.max(0, p.level - 1) : p.level
  return {
    ...p,
    level,
    timesSeen: p.timesSeen + 1,
    timesCorrect: p.timesCorrect + (result === 'got' ? 1 : 0),
    lastSeen: now,
  }
}

export function applyPeek(p: ItemProgress, now: string): ItemProgress {
  return { ...p, peekCount: p.peekCount + 1, lastPeeked: now }
}

/**
 * Pick the review items.
 * @param progress  progress records of the candidate items (only items she has met)
 * @param lastSessionStart ISO start of the previous session (peeks after it count as "last session")
 */
export function pickReview(progress: ItemProgress[], lastSessionStart: string | null, max = REVIEW_SIZE): string[] {
  const peekedLast = (p: ItemProgress) =>
    p.lastPeeked !== null && (lastSessionStart === null || p.lastPeeked >= lastSessionStart) ? 1 : 0
  return [...progress]
    .sort(
      (a, b) =>
        a.level - b.level ||
        peekedLast(b) - peekedLast(a) ||
        (a.lastSeen ?? '').localeCompare(b.lastSeen ?? '') ||
        a.itemId.localeCompare(b.itemId),
    )
    .slice(0, max)
    .map((p) => p.itemId)
}
