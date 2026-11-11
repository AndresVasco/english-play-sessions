// Run with: npm run check-content
// Validates src/content/common.json and every src/content/units/unit-XX.json.
// Also lists audio files that are missing (the app then falls back to the
// browser's voice, so missing audio is a warning, not an error).

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { validateContent } from '../src/content/validate.ts'
import type { Common, Unit } from '../src/content/types.ts'

const root = join(import.meta.dirname, '..')
const contentDir = join(root, 'src/content')
const readJson = (p: string) => JSON.parse(readFileSync(p, 'utf8'))

const common = readJson(join(contentDir, 'common.json')) as Common
const unitFiles = readdirSync(join(contentDir, 'units')).filter((f) => /^unit-\d+\.json$/.test(f)).sort()
const units = unitFiles.map((f) => readJson(join(contentDir, 'units', f)) as Unit)

const { errors, warnings } = validateContent(common, units)

const items = [...common.commands, ...units.flatMap((u) => u.items)]
const missingAudio = items
  .flatMap((i) => [i.audio, i.audioEs])
  .filter((p) => !existsSync(join(root, 'public', p)))
if (missingAudio.length) {
  warnings.push(`${missingAudio.length} audio file(s) missing (run the audio script): ${missingAudio.slice(0, 5).join(', ')}${missingAudio.length > 5 ? '…' : ''}`)
}

console.log(`Checked ${unitFiles.length} unit file(s): ${unitFiles.join(', ')}`)
warnings.forEach((w) => console.warn(`  ⚠ ${w}`))
if (errors.length) {
  console.error(`\n✗ Content has ${errors.length} problem(s):`)
  errors.forEach((e) => console.error(`  - ${e}`))
  process.exit(1)
}
console.log('✓ Content OK')
