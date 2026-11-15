// Song blocks: the app plays the song's generated melody (twice, after a
// one-bar count-in) and highlights each lyric line as it starts, karaoke
// style. The teacher sings with her. If music is off (Settings) or the song
// has no melody, "▶ Next" highlights the lines by hand.

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import type { Song } from '../content/types.ts'
import type { ActivityHandle } from '../activities/types.ts'
import { playSong, type Playing } from '../lib/music.ts'
import { useSettings } from '../lib/settings.tsx'

interface Props {
  song: Song
  handleRef?: RefObject<ActivityHandle | null>
  autoPlay?: boolean
  compact?: boolean
}

export function SongView({ song, handleRef, autoPlay = true, compact = false }: Props) {
  const { settings } = useSettings()
  const withMusic = settings.musicOn && Boolean(song.melody)
  const [line, setLine] = useState(withMusic ? -1 : 0)
  const [playing, setPlaying] = useState(false)
  const music = useRef<Playing | null>(null)

  const stop = useCallback(() => {
    music.current?.stop()
    music.current = null
    setPlaying(false)
  }, [])

  const start = useCallback(() => {
    music.current?.stop()
    if (!withMusic) {
      setLine(0)
      return
    }
    setLine(-1)
    setPlaying(true)
    music.current = playSong(song, setLine, () => {
      music.current = null
      setPlaying(false)
    })
  }, [song, withMusic])

  useEffect(() => {
    if (autoPlay) start()
    return () => music.current?.stop()
    // Start once when the block opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!handleRef) return
    handleRef.current = {
      // With music: Next goes on to the next block. Without: next line.
      next: () => {
        if (withMusic) return false
        setLine((l) => (l + 1) % song.lines.length)
        return true
      },
      repeat: start,
    }
    return () => {
      handleRef.current = null
    }
  }, [handleRef, withMusic, song.lines.length, start])

  return (
    <div className={compact ? 'song compact' : 'song'}>
      <div className="song-title">🎵 {song.title}</div>
      <ol className="lyrics">
        {song.lines.map((text, i) => (
          <li key={i} className={i === line ? 'lyric on' : 'lyric'}>
            <button type="button" onClick={() => !withMusic && setLine(i)}>
              {text}
            </button>
          </li>
        ))}
      </ol>
      {withMusic && (
        <button type="button" className="game-toggle" onClick={playing ? stop : start}>
          {playing ? (line < 0 ? '⏸ Get ready… 1, 2, 3, 4' : '⏸ Stop') : '▶ Play song'}
        </button>
      )}
    </div>
  )
}
