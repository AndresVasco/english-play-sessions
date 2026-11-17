// Connects the content and the saved progress to the challenge rules.

import type { Unit } from '../content/types.ts'
import { checkable, planChallenge, UNIT_SIZE, WEEKLY_SIZE, weeklyDue, type Candidate } from '../progress/evaluation.ts'
import type { ProgressData } from '../progress/types.ts'

export function candidatesFrom(units: Unit[]): Candidate[] {
  return units.flatMap((u) =>
    u.items.map((i) => ({ id: i.id, unitId: u.id, image: i.image, text: i.text, isCommand: i.tags.includes('command'), tags: i.tags })),
  )
}

/** Words she has already met (practised or peeked), that can be checked. */
function metCandidates(units: Unit[], data: ProgressData) {
  const met = new Set(data.items.filter((p) => p.timesSeen > 0 || p.peekCount > 0).map((p) => p.itemId))
  return candidatesFrom(units).filter((c) => met.has(c.id) && checkable(c))
}

/** The weekly challenge plan if it is due today, otherwise null. */
export function weeklyPlan(units: Unit[], data: ProgressData, now = Date.now()) {
  const pool = metCandidates(units, data)
  if (!weeklyDue(data.evaluations, pool.length, now)) return null
  return planChallenge(pool, data.items, WEEKLY_SIZE, now)
}

export function isWeeklyDue(units: Unit[], data: ProgressData, now = Date.now()) {
  return weeklyDue(data.evaluations, metCandidates(units, data).length, now)
}

/** The end-of-unit challenge: words of that unit. */
export function unitPlan(unit: Unit, data: ProgressData, now = Date.now()) {
  return planChallenge(candidatesFrom([unit]), data.items, UNIT_SIZE, now)
}
