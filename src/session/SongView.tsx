// Song blocks. Phase 1: big lyrics; "Next ▶" highlights the next line so
// the teacher can lead the singing. Phase 2 adds the generated melody.

import { useEffect, useState, type RefObject } from 'react'
import type { Song } from '../content/types.ts'
import type { ActivityHandle } from '../activities/types.ts'

export function SongView({ song, handleRef }: { song: Song; handleRef: RefObject<ActivityHandle | null> }) {
  const [line, setLine] = useState(0)

  useEffect(() => {
    handleRef.current = {
      // After the last line, "next" starts the song again.
      next: () => {
        setLine((l) => (l + 1) % song.lines.length)
        return true
      },
      repeat: () => setLine(0),
    }
    return () => {
      handleRef.current = null
    }
  }, [handleRef, song.lines.length])

  return (
    <div className="song">
      <div className="song-title">🎵 {song.title}</div>
      <ol className="lyrics">
        {song.lines.map((text, i) => (
          <li key={i} className={i === line ? 'lyric on' : 'lyric'}>
            <button type="button" onClick={() => setLine(i)}>
              {text}
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}
