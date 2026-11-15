// Run with: npm run check-review
// Checks the review rule from BUILD-BRIEF section 6 with fixed examples.

import { applyMark, applyPeek, emptyProgress, pickReview } from '../src/progress/review.ts'

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

if (failures) {
  console.error(`\n${failures} check(s) failed`)
  process.exit(1)
}
console.log('\n✓ Review rule OK')
