// Checks that content files are complete and that every id they reference
// exists. Used by the app at startup and by `npm run check-content`
// (which runs before every build, so broken content never gets published).

import { ACTIVITY_TYPES, BLOCK_TYPES } from './types.ts'
import type { Common, Item, Prompt, Unit } from './types.ts'
import { checkSongMusic } from '../lib/music.ts'

export interface ValidationResult {
  errors: string[]
  warnings: string[]
}

const isNonEmptyString = (v: unknown): v is string =>
  typeof v === 'string' && v.trim().length > 0

export function validateContent(common: Common, units: Unit[]): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const err = (where: string, msg: string) => errors.push(`${where}: ${msg}`)

  if (typeof common.schemaVersion !== 'number') err('common.json', 'schemaVersion must be a number')

  // ---- Items (commands + every unit's items) must have unique ids ----
  const allItems = new Map<string, Item>()
  const checkItem = (where: string, item: Item) => {
    const at = `${where} item "${item.id}"`
    if (!isNonEmptyString(item.id)) err(where, 'an item has no id')
    if (allItems.has(item.id)) err(at, 'duplicate item id')
    allItems.set(item.id, item)
    for (const field of ['text', 'translation', 'image', 'audio', 'audioEs'] as const) {
      if (!isNonEmptyString(item[field])) err(at, `missing "${field}"`)
    }
    if (!Array.isArray(item.tags)) err(at, '"tags" must be a list')
  }
  common.commands.forEach((c) => {
    checkItem('common.json', c)
    if (!c.tags?.includes('command')) err(`common.json item "${c.id}"`, 'commands need the tag "command"')
  })
  units.forEach((u) => u.items.forEach((i) => checkItem(u.id, i)))

  // ---- Prompts ----
  const promptIds = new Set<string>()
  const checkPrompt = (where: string, p: Prompt) => {
    if (!isNonEmptyString(p.id)) return err(where, 'a prompt has no id')
    if (promptIds.has(p.id)) err(where, `duplicate prompt id "${p.id}"`)
    promptIds.add(p.id)
    if (!isNonEmptyString(p.en) || !isNonEmptyString(p.es)) err(where, `prompt "${p.id}" needs "en" and "es"`)
  }
  common.praise.forEach((p) => checkPrompt('common.json praise', p))
  common.retry.forEach((p) => checkPrompt('common.json retry', p))
  for (const type of [...ACTIVITY_TYPES, 'stickers'] as const) {
    const list = common.prompts[type]
    if (!list || list.length === 0) err('common.json prompts', `no default prompt for "${type}"`)
    else list.forEach((p) => checkPrompt(`common.json prompts.${type}`, p))
  }

  // ---- Songs (ids unique across common + units) ----
  const songIds = new Set<string>()
  const checkSongs = (where: string, songs: Common['songs']) =>
    songs.forEach((s) => {
      if (songIds.has(s.id)) err(where, `duplicate song id "${s.id}"`)
      songIds.add(s.id)
      if (!Array.isArray(s.lines) || s.lines.length === 0) err(where, `song "${s.id}" has no lines`)
      checkSongMusic(s).forEach((p) => err(where, `song "${s.id}": ${p}`))
    })
  checkSongs('common.json', common.songs)
  units.forEach((u) => checkSongs(u.id, u.songs))

  // ---- Units ----
  const unitIds = new Set<string>()
  const lessonIds = new Set<string>()
  for (const u of units) {
    if (unitIds.has(u.id)) err(u.id, 'duplicate unit id')
    unitIds.add(u.id)
    for (const f of ['title', 'theme', 'goal'] as const) if (!isNonEmptyString(u[f])) err(u.id, `missing "${f}"`)

    const activityIds = new Set<string>()
    for (const a of u.activities) {
      const at = `${u.id} activity "${a.id}"`
      if (activityIds.has(a.id)) err(at, 'duplicate activity id in this unit')
      activityIds.add(a.id)
      if (!ACTIVITY_TYPES.includes(a.type)) err(at, `unknown type "${a.type}"`)
      if (!isNonEmptyString(a.title)) err(at, 'missing "title"')
      if (!isNonEmptyString(a.teacherNotes)) err(at, 'missing "teacherNotes"')
      a.itemIds.forEach((id) => { if (!allItems.has(id)) err(at, `unknown item "${id}"`) })
      if (a.itemIds.length === 0 && !a.autoReview) err(at, 'has no items')
      a.prompts?.forEach((p) => checkPrompt(at, p))
      // Item ids referenced inside config (door game)
      for (const key of ['situations', 'leaveItem'] as const) {
        const v = a.config?.[key]
        if (typeof v === 'string') v.split(',').map((x) => x.trim()).filter(Boolean).forEach((id) => {
          if (!allItems.has(id)) err(at, `config.${key}: unknown item "${id}"`)
        })
      }
    }

    if (u.stickers.length === 0) err(u.id, 'needs at least one sticker')

    for (const l of u.lessons) {
      const at = `${u.id} lesson "${l.id}"`
      if (lessonIds.has(l.id)) err(at, 'duplicate lesson id')
      lessonIds.add(l.id)
      if (!isNonEmptyString(l.title)) err(at, 'missing "title"')
      ;[...l.newItems, ...l.commands, ...l.newCommands].forEach((id) => {
        if (!allItems.has(id)) err(at, `unknown item "${id}"`)
      })
      if (!songIds.has(l.songId)) err(at, `unknown song "${l.songId}"`)
      if (l.blocks.length !== 6) warnings.push(`${at}: has ${l.blocks.length} blocks (the routine expects 6)`)
      l.blocks.forEach((b, i) => {
        const bat = `${at} block ${i + 1}`
        if (!BLOCK_TYPES.includes(b.type)) err(bat, `unknown block type "${b.type}"`)
        if (!(typeof b.minutes === 'number' && b.minutes > 0)) err(bat, 'minutes must be more than 0')
        b.activityIds?.forEach((id) => { if (!activityIds.has(id)) err(bat, `unknown activity "${id}"`) })
        if (b.songId && !songIds.has(b.songId)) err(bat, `unknown song "${b.songId}"`)
        const needsActivity = b.type === 'review' || b.type === 'new-words' || b.type === 'movement-game'
        if (needsActivity && !b.activityIds?.length) err(bat, 'needs at least one activity')
        if ((b.type === 'hello-song' || b.type === 'song') && !b.songId) err(bat, 'needs a songId')
      })
    }
  }

  // reviewFrom must point at existing units
  units.forEach((u) =>
    u.lessons.forEach((l) =>
      l.reviewFrom.forEach((id) => {
        if (!unitIds.has(id)) err(`${u.id} lesson "${l.id}"`, `reviewFrom: unknown unit "${id}"`)
      }),
    ),
  )

  return { errors, warnings }
}
