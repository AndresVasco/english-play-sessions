// Run with: npm run check-review
// Checks the review rule from BUILD-BRIEF section 6 with fixed examples.

import { applyMark, applyPeek, emptyProgress, pickReview } from '../src/progress/review.ts'
import { planChallenge, scores, weeklyDue, WEEK_MS } from '../src/progress/evaluation.ts'
import type { Evaluation } from '../src/progress/types.ts'

let failures = 0
const expect = (name: string, actual: unknown, wanted: unknown) => {
  const ok = JSON.stringify(actual) === JSON.stringify(wanted)
  if (!ok) failures++
  console.log(`${ok ? '✓' : '✗'} ${name}${ok ? '' : `\n    got:    ${JSON.stringify(actual)}\n    wanted: ${JSON.stringify(wanted)}`}`)
}

// ✓ raises (max 3), ↻ lowers (min 0), a peek never changes the level
let p = emptyProgress('a')
p = applyMark(p, 'again', 't1')
expect('↻ at level 0 stays 0', p.level, 0)
for (let i = 0; i < 5; i++) p = applyMark(p, 'got', 't2')
expect('✓ five times stops at 3', p.level, 3)
p = applyPeek(p, 't3')
expect('peek keeps level, counts peek', [p.level, p.peekCount], [3, 1])

// Order: lowest level, then peeked in the last session, then oldest lastSeen; max 6
const mk = (id: string, level: number, lastSeen: string, lastPeeked: string | null = null) => ({
  ...emptyProgress(id), level, lastSeen, lastPeeked, timesSeen: 1,
})
const last = '2026-11-10T10:00:00Z'
const items = [
  mk('L3', 3, '2026-11-01'),
  mk('L1-new', 1, '2026-11-09'),
  mk('L1-old', 1, '2026-11-02'),
  mk('L1-peeked', 1, '2026-11-09', '2026-11-10T10:05:00Z'),
  mk('L1-peeked-before', 1, '2026-11-09', '2026-11-05T10:00:00Z'),
  mk('L0', 0, '2026-11-09'),
  mk('L2', 2, '2026-11-01'),
  mk('L2-b', 2, '2026-11-03'),
]
expect('review order', pickReview(items, last), ['L0', 'L1-peeked', 'L1-old', 'L1-new', 'L1-peeked-before', 'L2'])

// "With help" (Pip's Challenge) counts as seen but keeps the level
let h = { ...emptyProgress('h'), level: 2 }
h = applyMark(h, 'helped', 't4')
expect('with help keeps level, counts as seen', [h.level, h.timesSeen, h.timesCorrect], [2, 1, 0])

// ---- Pip's Challenge ----
const now = Date.parse('2026-11-20T10:00:00Z')
const day = 24 * 60 * 60 * 1000
const iso = (t: number) => new Date(t).toISOString()
const weekly = (t: number): Evaluation => ({ id: 'w', date: iso(t), kind: 'weekly', durationSec: 60, items: [] })
expect('weekly not due with few words', weeklyDue([], 5, now), false)
expect('weekly due the first time', weeklyDue([], 8, now), true)
expect('weekly not due 3 days after the last', weeklyDue([weekly(now - 3 * day)], 20, now), false)
expect('weekly due 7 days after the last', weeklyDue([weekly(now - WEEK_MS)], 20, now), true)

let seed = 1
const rng = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
const cands = Array.from({ length: 12 }, (_, i) => ({ id: `w${i}`, unitId: i < 6 ? 'u1' : 'u2', image: `img${i}`, text: `word${i}`, isCommand: false }))
cands.push({ id: 'cmd', unitId: 'u1', image: 'x', text: 'Jump!', isCommand: true }, { id: 'blank', unitId: 'u1', image: 'y', text: 'My name is…', isCommand: false }, { id: 'phrase', unitId: 'u1', image: 'z', text: 'Yes, I am!', isCommand: false, tags: ['phrase'] })
const prog = cands.map((c, i) => ({ ...emptyProgress(c.id), level: i % 4, timesSeen: 1, lastSeen: iso(i < 2 ? now - 10 * day : now - day) }))
const plan = planChallenge(cands, prog, 8, now, rng)
expect('challenge has 8 words', plan.length, 8)
expect('half comprehension, half production', plan.filter((p) => p.skill === 'comprehension').length, 4)
expect('old words (7+ days) are always included', ['w0', 'w1'].every((id) => plan.some((p) => p.itemId === id && p.retention)), true)
expect('commands, "…" and phrases are not checked', plan.some((p) => ['cmd', 'blank', 'phrase'].includes(p.itemId)), false)
expect('comprehension shows 4 different pictures incl. the answer', plan.filter((p) => p.skill === 'comprehension').every((p) => p.options?.length === 4 && p.options.includes(p.itemId) && new Set(p.options).size === 4), true)
const sc = scores({ id: 'e', date: iso(now), kind: 'weekly', durationSec: 60, items: [
  { itemId: 'a', skill: 'comprehension', result: 'got', retention: true },
  { itemId: 'b', skill: 'comprehension', result: 'again', retention: false },
  { itemId: 'c', skill: 'production', result: 'helped', retention: true },
  { itemId: 'd', skill: 'production', result: 'got', retention: false },
] })
expect('scores (alone = 1, with help = ½)', sc, { comprehension: 50, production: 75, retention: 75, overall: 63 })

if (failures) {
  console.error(`\n${failures} check(s) failed`)
  process.exit(1)
}
console.log('\n✓ Review rule and Pip\'s Challenge OK')
