// Pip's Challenge: which words to check, and how to score the results.
// Pure functions (no screen, no storage) so they can be checked by
// `npm run check-review` before every build.

import type { Evaluation, EvaluationItem, EvalResult, ItemProgress } from './types.ts'

export const WEEKLY_SIZE = 8 // 4 comprehension + 4 production
export const UNIT_SIZE = 12 // 6 + 6
export const WEEK_MS = 7 * 24 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

/** A word that can be checked: needs a clear picture and no "…" blank. */
export interface Candidate {
  id: string
  /** Unit it belongs to (distractors come from the same unit when possible) */
  unitId: string
  image: string
  text: string
  isCommand: boolean
  tags?: string[]
}

/** Phrases, questions and prepositions have no single clear picture to check. */
const NOT_CHECKABLE_TAGS = ['phrase', 'question', 'preposition']

/** Commands are checked in Simon Says, except action verbs (Unit 7), which have clear pictures. */
export const checkable = (c: Candidate) =>
  (!c.isCommand || Boolean(c.tags?.includes('verb'))) &&
  !c.text.includes('…') &&
  !c.tags?.some((t) => NOT_CHECKABLE_TAGS.includes(t))

/** True when the weekly challenge is due: 7+ days since the last weekly one
 *  (or never), and she has met enough words to check. */
export function weeklyDue(evaluations: Evaluation[], metWords: number, now: number): boolean {
  if (metWords < WEEKLY_SIZE) return false
  const last = [...evaluations].reverse().find((e) => e.kind === 'weekly')
  return !last || now - Date.parse(last.date) >= WEEK_MS - DAY_MS / 2
}

export interface PlannedItem {
  itemId: string
  skill: EvaluationItem['skill']
  retention: boolean
  /** For comprehension: the pictures shown (target + distractors), shuffled */
  options?: string[]
}

type Rng = () => number
const shuffle = <T,>(list: T[], rng: Rng): T[] => {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const isOld = (p: ItemProgress | undefined, now: number) =>
  Boolean(p?.lastSeen) && now - Date.parse(p!.lastSeen!) >= WEEK_MS

/**
 * Choose the words of a challenge.
 * Order of priority: words not practised for 7+ days (retention), then the
 * weakest (lowest level), then the rest. Skills alternate so the split is
 * half comprehension, half production.
 */
export function planChallenge(
  candidates: Candidate[],
  progress: ItemProgress[],
  size: number,
  now: number,
  rng: Rng = Math.random,
): PlannedItem[] {
  const prog = new Map(progress.map((p) => [p.itemId, p]))
  const pool = candidates.filter(checkable)
  const ranked = shuffle(pool, rng).sort((a, b) => {
    const pa = prog.get(a.id)
    const pb = prog.get(b.id)
    return Number(isOld(pb, now)) - Number(isOld(pa, now)) || (pa?.level ?? 0) - (pb?.level ?? 0)
  })
  const chosen = ranked.slice(0, size)
  // Alternate skills over the ranked list, then shuffle the order she sees.
  const planned = chosen.map<PlannedItem>((c, i) => ({
    itemId: c.id,
    skill: i % 2 === 0 ? 'comprehension' : 'production',
    retention: isOld(prog.get(c.id), now),
  }))
  for (const p of planned) {
    if (p.skill !== 'comprehension') continue
    const target = pool.find((c) => c.id === p.itemId)!
    // Distractors: same unit, different picture; fill from all words if needed.
    const sameUnit = pool.filter((c) => c.unitId === target.unitId && c.id !== target.id && c.image !== target.image)
    const others = pool.filter((c) => c.unitId !== target.unitId && c.image !== target.image)
    const picks = [...shuffle(sameUnit, rng), ...shuffle(others, rng)].slice(0, 3).map((c) => c.id)
    p.options = shuffle([target.id, ...picks], rng)
  }
  return shuffle(planned, rng)
}

const VALUE: Record<EvalResult, number> = { got: 1, helped: 0.5, again: 0 }

/** Percentage (0–100) for a list of results, or null if there are none.
 *  On her own = 1, with help = ½, not yet = 0. */
export function percent(items: EvaluationItem[]): number | null {
  if (!items.length) return null
  return Math.round((items.reduce((s, i) => s + VALUE[i.result], 0) / items.length) * 100)
}

export function scores(e: Evaluation) {
  return {
    comprehension: percent(e.items.filter((i) => i.skill === 'comprehension')),
    production: percent(e.items.filter((i) => i.skill === 'production')),
    retention: percent(e.items.filter((i) => i.retention)),
    overall: percent(e.items),
  }
}
