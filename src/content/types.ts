// Content schema. Every unit file (src/content/units/unit-XX.json) and the
// shared file (src/content/common.json) must follow these shapes.
// Validation lives in validate.ts and runs before every build.

export const ACTIVITY_TYPES = [
  'flashcards',
  'simon-says',
  'find-it',
  'freeze-dance',
  'faces',
  'listen-and-tap',
  'memory-match',
] as const
export type ActivityType = (typeof ACTIVITY_TYPES)[number]

export const BLOCK_TYPES = [
  'hello-song',
  'review',
  'new-words',
  'movement-game',
  'song',
  'stickers',
] as const
export type BlockType = (typeof BLOCK_TYPES)[number]

/** An on-screen instruction. `___` is replaced by the current item
 *  (English text in `en`, Spanish translation in `es`).
 *  Audio, when the text has no `___`, lives at audio/prompts/<id>.mp3 */
export interface Prompt {
  id: string
  en: string
  es: string
}

/** A word, phrase or classroom command (commands have the tag "command"). */
export interface Item {
  id: string
  text: string
  translation: string
  /** An emoji, or a path to an image inside public/ */
  image: string
  /** English audio, path inside public/ (e.g. "audio/u1-hello.mp3") */
  audio: string
  /** Spanish audio for the long-press peek (e.g. "audio/es/u1-hello.mp3") */
  audioEs: string
  tags: string[]
}

export interface Activity {
  id: string
  type: ActivityType
  /** Short English name shown to the teacher (e.g. "Door game") */
  title: string
  itemIds: string[]
  /** Overrides the default prompts for this activity type (common.json) */
  prompts?: Prompt[]
  /** Activity-specific settings (interval, rounds, pairs, mode...) */
  config?: Record<string, string | number | boolean>
  /** Teacher script, in Spanish */
  teacherNotes: string
  /** Review blocks: also pull the learner's weakest items automatically */
  autoReview?: boolean
}

export interface Block {
  type: BlockType
  minutes: number
  /** Activities run in this block, in order ("switch game" cycles them) */
  activityIds?: string[]
  /** Song played in this block (song blocks and the goodbye) */
  songId?: string
}

export interface Lesson {
  id: string
  number: number
  title: string
  /** The model question/answer of the lesson */
  keyExchange: { en: string; es: string }
  newItems: string[]
  /** All commands available in this lesson (cumulative) */
  commands: string[]
  /** Commands introduced in this lesson */
  newCommands: string[]
  /** Unit ids whose items may appear in the review block */
  reviewFrom: string[]
  blocks: Block[]
  /** Song of the song-moment block */
  songId: string
  /** General teacher tips for the lesson, in Spanish */
  teacherNotes?: string[]
}

export interface Song {
  id: string
  title: string
  purpose: string
  lines: string[]
  /** Beats per minute */
  tempo?: number
  /** One entry per lyric line: notes as "G4:1 E4:1 R:2" (note:beats, R = rest) */
  melody?: string[]
  /** One entry per lyric line: chords spread evenly over the line, e.g. "C C F C" */
  chords?: string[]
}

export interface Sticker {
  id: string
  emoji: string
  /** Reserved stickers (e.g. "unit complete") are not offered normally */
  reserved?: boolean
  label?: string
}

export interface Unit {
  id: string
  number: number
  title: string
  theme: string
  goal: string
  items: Item[]
  activities: Activity[]
  songs: Song[]
  stickers: Sticker[]
  lessons: Lesson[]
  /** "She can…" statements the teacher ticks when she shows them (evaluation) */
  canDo?: string[]
}

/** Shared across all units */
export interface Common {
  schemaVersion: number
  commands: Item[]
  praise: Prompt[]
  retry: Prompt[]
  /** Default prompts per activity type, plus "stickers" and "challenge" (Pip's Challenge) */
  prompts: Record<ActivityType | 'stickers' | 'challenge', Prompt[]>
  songs: Song[]
}
