// Loads all content. Adding a unit = dropping a new unit-XX.json file into
// src/content/units/ — it is picked up here automatically, no code changes.

import commonJson from './common.json'
import type { Activity, ActivityType, Common, Item, Lesson, Prompt, Song, Unit } from './types.ts'
import { validateContent } from './validate.ts'

const unitModules = import.meta.glob<Unit>('./units/unit-*.json', { eager: true, import: 'default' })

export const common = commonJson as Common
export const units: Unit[] = Object.values(unitModules).sort((a, b) => a.number - b.number)

const check = validateContent(common, units)
if (check.errors.length) console.error('Content problems:\n' + check.errors.join('\n'))
if (check.warnings.length) console.warn('Content warnings:\n' + check.warnings.join('\n'))

const itemsById = new Map<string, Item>()
for (const item of [...common.commands, ...units.flatMap((u) => u.items)]) itemsById.set(item.id, item)

const songsById = new Map<string, Song>()
for (const song of [...common.songs, ...units.flatMap((u) => u.songs)]) songsById.set(song.id, song)

export const getItem = (id: string) => itemsById.get(id)
export const getItems = (ids: string[]) => ids.map(getItem).filter((i): i is Item => Boolean(i))
export const getSong = (id: string | undefined) => (id ? songsById.get(id) : undefined)

export interface LessonRef {
  unit: Unit
  lesson: Lesson
}

export function findLesson(lessonId: string | null | undefined): LessonRef | undefined {
  if (!lessonId) return undefined
  for (const unit of units) {
    const lesson = unit.lessons.find((l) => l.id === lessonId)
    if (lesson) return { unit, lesson }
  }
  return undefined
}

export const getActivity = (unit: Unit, id: string): Activity | undefined =>
  unit.activities.find((a) => a.id === id)

/** Prompts for an activity: its own override, else the defaults for its type. */
export const promptsFor = (activity: Activity | { type: ActivityType | 'stickers'; prompts?: Prompt[] }) =>
  activity.prompts?.length ? activity.prompts : common.prompts[activity.type]

/** Fill the `___` blank of a prompt with an item (English / Spanish). */
export const fillPrompt = (prompt: Prompt, item?: Item) => ({
  en: item ? prompt.en.replace('___', item.text) : prompt.en,
  es: item ? prompt.es.replace('___', item.translation) : prompt.es,
})

/** Audio of an instruction. Prompts with a "___" blank have one file per item
 *  (audio/prompts/<prompt-id>--<item-id>.mp3), made by the audio script. */
export const promptAudio = (prompt: Prompt, item?: Item) =>
  prompt.en.includes('___')
    ? item
      ? `audio/prompts/${prompt.id}--${item.id}.mp3`
      : undefined
    : `audio/prompts/${prompt.id}.mp3`
export const phraseAudio = (prompt: Prompt) => `audio/phrases/${prompt.id}.mp3`

export const BLOCK_LABELS: Record<string, { en: string; es: string }> = {
  'hello-song': { en: 'Hello song', es: 'Canción de saludo' },
  review: { en: 'Review with the body', es: 'Repaso con el cuerpo' },
  'new-words': { en: 'New words', es: 'Palabras nuevas' },
  'movement-game': { en: 'Movement game', es: 'Juego de movimiento' },
  song: { en: 'Song moment', es: 'Momento de canción' },
  stickers: { en: 'Stickers & Goodbye', es: 'Stickers y despedida' },
}
