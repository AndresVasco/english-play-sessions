// Runs the fixed 6-block routine for one lesson.
// Top: block name + visible timer. Middle: the learner's focal content.
// Bottom: quiet teacher controls. The 🇨🇴 peek button is big, for her.

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ACTIVITY_COMPONENTS } from '../activities/index.ts'
import { MARKABLE, type ActivityHandle, type MarkResult } from '../activities/types.ts'
import { BLOCK_LABELS, getActivity, getItems, getSong } from '../content/index.ts'
import type { Activity, Item, Lesson, Unit } from '../content/types.ts'
import { Confetti } from '../components/Confetti.tsx'
import { PeekButton, PeekProvider } from '../components/Peek.tsx'
import { play, stopAudio } from '../lib/audio.ts'
import { GoodbyeView } from './GoodbyeView.tsx'
import { NotesPanel } from './NotesPanel.tsx'
import { SongView } from './SongView.tsx'
import { formatTime, useBlockTimer } from './useBlockTimer.ts'

/** Items an activity uses. Review blocks: the lesson's commands for now;
 *  Phase 3 adds the learner's weakest items (smart review). */
function activityItems(lesson: Lesson, activity: Activity): Item[] {
  if (activity.autoReview) return getItems([...lesson.commands, ...activity.itemIds])
  return getItems(activity.itemIds)
}

export interface SessionRecord {
  marks: { itemId: string; result: MarkResult; at: number }[]
  peeks: { itemId: string; at: number }[]
  stickers: { stickerId: string; at: number }[]
}

interface Props {
  unit: Unit
  lesson: Lesson
  onExit: () => void
}

export function SessionRunner(props: Props) {
  return (
    <PeekProvider>
      <Runner {...props} />
    </PeekProvider>
  )
}

function Runner({ unit, lesson, onExit }: Props) {
  const [blockIndex, setBlockIndex] = useState(0)
  const [activityIndex, setActivityIndex] = useState(0)
  const [notesOpen, setNotesOpen] = useState(false)
  const [burst, setBurst] = useState(0)
  const [focus, setFocus] = useState<Item[]>([])
  // In-memory record of this session. Saved to the device in Phase 3.
  const record = useRef<SessionRecord>({ marks: [], peeks: [], stickers: [] })
  const handleRef = useRef<ActivityHandle | null>(null)

  const block = lesson.blocks[blockIndex]
  const blockActivities = useMemo(
    () => (block.activityIds ?? []).map((id) => getActivity(unit, id)).filter((a): a is Activity => Boolean(a)),
    [block, unit],
  )
  const activity = blockActivities[activityIndex % Math.max(1, blockActivities.length)]
  const items = useMemo(() => (activity ? activityItems(lesson, activity) : []), [activity, lesson])
  const timer = useBlockTimer(block.minutes, blockIndex)
  const isLast = blockIndex === lesson.blocks.length - 1
  const label = BLOCK_LABELS[block.type]

  // Lesson 4 style blocks with 2 games: switch to the second at half time.
  const halfSwitched = useRef(false)
  useEffect(() => {
    halfSwitched.current = false
  }, [blockIndex])
  useEffect(() => {
    if (blockActivities.length > 1 && !halfSwitched.current && timer.elapsedSec >= timer.totalSec / 2 && activityIndex === 0) {
      halfSwitched.current = true
      setActivityIndex(1)
    }
  }, [blockActivities.length, timer.elapsedSec, timer.totalSec, activityIndex])

  const goToBlock = useCallback(
    (i: number) => {
      stopAudio()
      if (i >= lesson.blocks.length) {
        onExit()
        return
      }
      setBlockIndex(i)
      setActivityIndex(0)
      setFocus([])
    },
    [lesson.blocks.length, onExit],
  )

  const nextBlock = useCallback(() => goToBlock(blockIndex + 1), [goToBlock, blockIndex])
  const next = useCallback(() => {
    const handled = handleRef.current?.next?.()
    if (!handled) nextBlock()
  }, [nextBlock])
  const repeat = useCallback(() => handleRef.current?.repeat?.(), [])
  const switchGame = useCallback(() => {
    if (blockActivities.length > 1) {
      halfSwitched.current = true
      stopAudio()
      setActivityIndex((i) => (i + 1) % blockActivities.length)
    }
  }, [blockActivities.length])

  const canMark = Boolean(activity && MARKABLE.has(activity.type))
  const mark = useCallback((r: MarkResult) => handleRef.current?.mark?.(r), [])
  const onMark = useCallback((itemId: string, result: MarkResult) => {
    record.current.marks.push({ itemId, result, at: Date.now() })
  }, [])
  const celebrate = useCallback(() => setBurst((b) => b + 1), [])

  const recordPeek = useCallback(() => {
    const at = Date.now()
    focus.forEach((i) => record.current.peeks.push({ itemId: i.id, at }))
  }, [focus])
  const longPeek = useCallback(() => {
    recordPeek()
    const item = focus[0]
    if (item) {
      play({ src: item.audioEs, text: item.translation, lang: 'es' }, { src: item.audio, text: item.text, lang: 'en' })
    }
  }, [focus, recordPeek])

  const exit = useCallback(() => {
    if (window.confirm('End this session and go back?')) {
      stopAudio()
      onExit()
    }
  }, [onExit])

  // Keyboard shortcuts (PC)
  const peekBtn = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.repeat) return
      const k = e.key.toLowerCase()
      if (k === ' ' || k === 'arrowright') { e.preventDefault(); next() }
      else if (k === 'r') repeat()
      else if (k === 's') nextBlock()
      else if (k === 'e') timer.extend(120)
      else if (k === 'g') switchGame()
      else if (k === 'n') setNotesOpen((o) => !o)
      else if (k === 'escape') setNotesOpen(false)
      else if (k === 'p') peekBtn.current?.querySelector('button')?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
      else if (k === '1' && canMark) mark('got')
      else if (k === '2' && canMark) mark('again')
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'p') peekBtn.current?.querySelector('button')?.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [next, repeat, nextBlock, timer, switchGame, canMark, mark])

  useEffect(() => () => stopAudio(), [])

  // ---- Center content ----
  let center: ReactNode = null
  if (block.type === 'stickers') {
    center = (
      <GoodbyeView
        unit={unit}
        isLastLesson={lesson.number === Math.max(...unit.lessons.map((l) => l.number))}
        song={getSong(block.songId)}
        celebrate={celebrate}
        onSticker={(s) => record.current.stickers.push({ stickerId: s.id, at: Date.now() })}
      />
    )
  } else if (block.type === 'hello-song' || block.type === 'song') {
    const song = getSong(block.songId ?? lesson.songId)
    center = song ? <SongView key={blockIndex} song={song} handleRef={handleRef} /> : null
  } else if (activity) {
    const Component = ACTIVITY_COMPONENTS[activity.type]
    center = (
      <Component
        key={`${blockIndex}-${activity.id}`}
        unit={unit}
        lesson={lesson}
        activity={activity}
        items={items}
        handleRef={handleRef}
        onFocus={setFocus}
        onMark={onMark}
        celebrate={celebrate}
      />
    )
  }

  const pct = timer.totalSec ? Math.min(100, (timer.elapsedSec / timer.totalSec) * 100) : 0

  return (
    <div className="runner">
      <header className="runner-top">
        <button type="button" className="quiet-btn" onClick={exit} aria-label="End session" title="End session">
          ✕
        </button>
        <div className="runner-block">
          <span className="runner-step">
            {blockIndex + 1}/{lesson.blocks.length}
          </span>
          <span className="runner-label">{label?.en ?? block.type}</span>
        </div>
        <div className={timer.timeUp ? 'runner-timer up' : 'runner-timer'} aria-label="Time left in this block">
          {timer.timeUp ? '⏰ 0:00' : formatTime(timer.remainingSec)}
        </div>
        <div className="runner-progress" aria-hidden="true">
          <span style={{ width: `${pct}%` }} />
        </div>
      </header>

      <main className="runner-center">{center}</main>

      <div className="peek-anchor" ref={peekBtn}>
        <PeekButton onPeek={recordPeek} onLongPress={longPeek} />
      </div>

      <footer className="teacher-bar" aria-label="Teacher controls">
        <div className="tb-group">
          <button type="button" className="tb-btn" onClick={repeat} title="Repeat (R)">
            ↺<small>Repeat</small>
          </button>
          <button type="button" className="tb-btn" onClick={() => timer.extend(120)} title="Add 2 minutes (E)">
            +2<small>min</small>
          </button>
          {blockActivities.length > 1 && (
            <button type="button" className="tb-btn" onClick={switchGame} title="Switch game (G)">
              🔀<small>Game</small>
            </button>
          )}
          <button type="button" className="tb-btn" onClick={() => setNotesOpen(true)} title="Teacher notes (N)">
            📝<small>Notes</small>
          </button>
        </div>
        {canMark && (
          <div className="tb-group tb-marks">
            <button type="button" className="tb-btn mark" onClick={() => mark('got')} title="Got it (1)">
              ✓<small>Got it</small>
            </button>
            <button type="button" className="tb-btn mark" onClick={() => mark('again')} title="Try again (2)">
              ↻<small>Again</small>
            </button>
          </div>
        )}
        <div className="tb-group">
          <button type="button" className="tb-btn" onClick={next} title="Next (Space)">
            ▶<small>Next</small>
          </button>
          <button
            type="button"
            className={timer.timeUp ? 'tb-btn suggest' : 'tb-btn'}
            onClick={nextBlock}
            title={isLast ? 'Finish session (S)' : 'Next block (S)'}
          >
            {isLast ? '🏁' : '⏭'}
            <small>{isLast ? 'Finish' : 'Next block'}</small>
          </button>
        </div>
      </footer>

      <NotesPanel open={notesOpen} onClose={() => setNotesOpen(false)} activities={blockActivities} lesson={lesson} />
      <Confetti burst={burst} />
    </div>
  )
}
