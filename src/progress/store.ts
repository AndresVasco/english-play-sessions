// Everything the app does with learner progress. Saved after every mark.

import { useEffect, useState } from 'react'
import type { MarkResult } from '../activities/types.ts'
import { get, getAll, put, remove, replaceAll, update } from './db.ts'
import { applyMark, applyPeek, emptyProgress } from './review.ts'
import {
  SCHEMA_VERSION,
  type CanDoCheck,
  type EarnedSticker,
  type EvalResult,
  type Evaluation,
  type ItemProgress,
  type Meta,
  type ProgressData,
  type ProgressFile,
  type SessionLog,
} from './types.ts'

const CHANGED = 'eps-progress-changed'
const changed = () => window.dispatchEvent(new Event(CHANGED))
const nowIso = () => new Date().toISOString()
const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

// ---------- Writes ----------

export async function recordMark(itemId: string, result: MarkResult | EvalResult) {
  const now = nowIso()
  await update<ItemProgress>('items', itemId, (old) => applyMark(old ?? emptyProgress(itemId), result, now))
  changed()
}

export async function recordPeek(itemIds: string[]) {
  const now = nowIso()
  for (const itemId of itemIds) {
    await update<ItemProgress>('items', itemId, (old) => applyPeek(old ?? emptyProgress(itemId), now))
  }
  changed()
}

export async function saveSession(log: SessionLog) {
  await put('sessions', log)
  changed()
}

export async function addSticker(stickerId: string, emoji: string, lessonId: string) {
  const s: EarnedSticker = { id: uid(), stickerId, emoji, lessonId, date: nowIso() }
  await put('stickers', s)
  changed()
}

/** Save a finished Pip's Challenge and apply its results to the word levels. */
export async function saveEvaluation(e: Evaluation) {
  const now = nowIso()
  for (const it of e.items) {
    await update<ItemProgress>('items', it.itemId, (old) => applyMark(old ?? emptyProgress(it.itemId), it.result, now))
  }
  await put('evaluations', e)
  changed()
}

/** Tick or untick a unit's "can do" statement. */
export async function setCanDo(unitId: string, index: number, done: boolean) {
  const id = `${unitId}#${index}`
  if (done) await put('canDo', { id, unitId, index, date: nowIso() } satisfies CanDoCheck)
  else await remove('canDo', id)
  changed()
}

export async function setLastLesson(lessonId: string) {
  await update<Meta>('meta', 'meta', (old) => ({ ...(old ?? defaultMeta()), lastLessonId: lessonId }))
  changed()
}

export const newSessionId = uid

// ---------- Reads ----------

const defaultMeta = (): Meta => ({ schemaVersion: SCHEMA_VERSION, lastLessonId: null })

export async function loadProgress(): Promise<ProgressData> {
  const [items, sessions, stickers, evaluations, canDo, meta] = await Promise.all([
    getAll<ItemProgress>('items'),
    getAll<SessionLog>('sessions'),
    getAll<EarnedSticker>('stickers'),
    getAll<Evaluation>('evaluations'),
    getAll<CanDoCheck>('canDo'),
    get<Meta>('meta', 'meta'),
  ])
  sessions.sort((a, b) => a.date.localeCompare(b.date))
  stickers.sort((a, b) => a.date.localeCompare(b.date))
  evaluations.sort((a, b) => a.date.localeCompare(b.date))
  return { items, sessions, stickers, evaluations, canDo, meta: meta ?? defaultMeta() }
}

/** Live progress for screens; reloads whenever something is saved. */
export function useProgress(): ProgressData | null {
  const [data, setData] = useState<ProgressData | null>(null)
  useEffect(() => {
    let alive = true
    const load = () =>
      loadProgress()
        .then((d) => alive && setData(d))
        .catch((e) => console.error('Could not load progress', e))
    load()
    window.addEventListener(CHANGED, load)
    return () => {
      alive = false
      window.removeEventListener(CHANGED, load)
    }
  }, [])
  return data
}

// ---------- Export / import / reset ----------

const today = () => new Date().toISOString().slice(0, 10)

export async function buildExport(): Promise<ProgressFile> {
  const data = await loadProgress()
  return { app: 'english-play-sessions', schemaVersion: SCHEMA_VERSION, exportedAt: nowIso(), ...data }
}

export function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function exportProgress() {
  downloadJson(await buildExport(), `english-progress-${today()}.json`)
}

/** Checks an import file. Returns a problem in plain words, or null if OK. */
export function checkImportFile(data: unknown): string | null {
  const f = data as Partial<ProgressFile>
  if (!f || typeof f !== 'object' || f.app !== 'english-play-sessions') return 'This is not an English Adventure progress file.'
  if (f.schemaVersion !== 1 && f.schemaVersion !== SCHEMA_VERSION)
    return `This file is from a different version of the app (version ${f.schemaVersion}, this app uses ${SCHEMA_VERSION}).`
  if (!Array.isArray(f.items) || !Array.isArray(f.sessions) || !Array.isArray(f.stickers) || !f.meta)
    return 'The file is incomplete.'
  const badItem = f.items.find((i) => typeof i?.itemId !== 'string' || typeof i.level !== 'number' || i.level < 0 || i.level > 3)
  if (badItem) return 'The file has damaged word records.'
  if (f.schemaVersion === SCHEMA_VERSION && (!Array.isArray(f.evaluations) || !Array.isArray(f.canDo)))
    return 'The file is incomplete.'
  return null
}

/** Bring an older export up to the current shape (v1 had no evaluations / can-do). */
export function upgradeFile(f: ProgressFile): ProgressFile {
  return { ...f, evaluations: f.evaluations ?? [], canDo: f.canDo ?? [], schemaVersion: SCHEMA_VERSION }
}

/** Keep a copy of the current progress (in the device and as a downloaded file). */
async function backupCurrent(reason: string) {
  const current = await buildExport()
  await put('backups', { reason, takenAt: nowIso(), data: current }, 'last')
  downloadJson(current, `english-progress-backup-${today()}.json`)
}

async function replaceWith(f: ProgressData) {
  await replaceAll({
    items: f.items.map((value) => ({ value })),
    sessions: f.sessions.map((value) => ({ value })),
    stickers: f.stickers.map((value) => ({ value })),
    evaluations: (f.evaluations ?? []).map((value) => ({ value })),
    canDo: (f.canDo ?? []).map((value) => ({ value })),
    meta: [{ value: { ...f.meta, schemaVersion: SCHEMA_VERSION }, key: 'meta' }],
  })
  changed()
}

export async function importProgress(f: ProgressFile) {
  await backupCurrent('before import')
  await replaceWith(upgradeFile(f))
}

export async function resetProgress() {
  await backupCurrent('before reset')
  await replaceWith({ items: [], sessions: [], stickers: [], evaluations: [], canDo: [], meta: defaultMeta() })
}

export async function getBackup(): Promise<{ reason: string; takenAt: string; data: ProgressFile } | undefined> {
  return get('backups', 'last')
}

export async function restoreBackup() {
  const b = await getBackup()
  if (!b) return false
  await replaceWith(upgradeFile(b.data))
  return true
}
