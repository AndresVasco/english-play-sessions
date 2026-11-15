// In-app music with the Web Audio API: no music files, no licenses.
// Songs: a soft "music box" melody + chord pad + bass + quiet beat ticks,
// after a one-bar count-in. The same scheduling code works with a live
// AudioContext (the app) and an OfflineAudioContext (rendering to a file).

import type { Song } from '../content/types.ts'

const NOTE_INDEX: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }

/** "G4" -> frequency in Hz; supports sharps/flats ("F#4", "Bb3") */
export function noteFreq(note: string): number {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(note)
  if (!m) throw new Error(`Bad note "${note}"`)
  const semis = NOTE_INDEX[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0)
  const midi = (Number(m[3]) + 1) * 12 + semis
  return 440 * Math.pow(2, (midi - 69) / 12)
}

const CHORDS: Record<string, string[]> = {
  C: ['C3', 'E3', 'G3'],
  Dm: ['D3', 'F3', 'A3'],
  Em: ['E3', 'G3', 'B3'],
  F: ['F3', 'A3', 'C4'],
  G: ['G2', 'B2', 'D3'],
  Am: ['A2', 'C3', 'E3'],
}

export interface ParsedNote {
  note: string | null
  beats: number
}

export function parseLine(line: string): ParsedNote[] {
  return line
    .trim()
    .split(/\s+/)
    .map((tok) => {
      const [n, b] = tok.split(':')
      const beats = Number(b ?? 1)
      if (!(beats > 0)) throw new Error(`Bad beats in "${tok}"`)
      if (n !== 'R') noteFreq(n) // validates
      return { note: n === 'R' ? null : n, beats }
    })
}

/** Throws if the song's music data is not playable. Used by the content check. */
export function checkSongMusic(song: Song): string[] {
  const problems: string[] = []
  if (!song.melody) return problems
  if (song.melody.length !== song.lines.length) problems.push('melody needs one entry per lyric line')
  if (song.chords && song.chords.length !== song.lines.length) problems.push('chords need one entry per lyric line')
  song.melody.forEach((l, i) => {
    try {
      parseLine(l)
    } catch (e) {
      problems.push(`melody line ${i + 1}: ${(e as Error).message}`)
    }
  })
  song.chords?.forEach((l, i) =>
    l.split(/\s+/).forEach((c) => {
      if (!CHORDS[c]) problems.push(`chords line ${i + 1}: unknown chord "${c}" (known: ${Object.keys(CHORDS).join(', ')})`)
    }),
  )
  return problems
}

// ---------- Instruments ----------

function tone(ctx: BaseAudioContext, dest: AudioNode, freq: number, start: number, dur: number, gain: number, type: OscillatorType, attack = 0.01) {
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = type
  osc.frequency.value = freq
  g.gain.setValueAtTime(0, start)
  g.gain.linearRampToValueAtTime(gain, start + attack)
  g.gain.exponentialRampToValueAtTime(gain * 0.55, start + Math.max(attack + 0.01, dur * 0.6))
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur + 0.12)
  osc.connect(g).connect(dest)
  osc.start(start)
  osc.stop(start + dur + 0.15)
}

let noiseBuffer: AudioBuffer | null = null
function noise(ctx: BaseAudioContext) {
  if (!noiseBuffer || noiseBuffer.sampleRate !== ctx.sampleRate) {
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate)
    const d = noiseBuffer.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  }
  return noiseBuffer
}

function tick(ctx: BaseAudioContext, dest: AudioNode, start: number, gain: number, freq = 6000) {
  const src = ctx.createBufferSource()
  src.buffer = noise(ctx)
  const f = ctx.createBiquadFilter()
  f.type = 'highpass'
  f.frequency.value = freq
  const g = ctx.createGain()
  g.gain.setValueAtTime(gain, start)
  g.gain.exponentialRampToValueAtTime(0.0001, start + 0.06)
  src.connect(f).connect(g).connect(dest)
  src.start(start)
  src.stop(start + 0.08)
}

function kick(ctx: BaseAudioContext, dest: AudioNode, start: number, gain: number) {
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.frequency.setValueAtTime(140, start)
  osc.frequency.exponentialRampToValueAtTime(45, start + 0.12)
  g.gain.setValueAtTime(gain, start)
  g.gain.exponentialRampToValueAtTime(0.0001, start + 0.18)
  osc.connect(g).connect(dest)
  osc.start(start)
  osc.stop(start + 0.2)
}

// ---------- Songs ----------

export interface SongSchedule {
  /** Seconds from start when each lyric line begins (one list per repeat) */
  lineStarts: number[]
  duration: number
}

/** Schedule a whole song on `ctx` starting at `t0`. Returns line timings. */
export function scheduleSong(ctx: BaseAudioContext, dest: AudioNode, song: Song, t0: number, repeats = 2): SongSchedule {
  const beat = 60 / (song.tempo ?? 100)
  const lineStarts: number[] = []
  let t = t0

  // Count-in: one bar of the first chord + 4 ticks
  const firstChord = song.chords?.[0]?.split(/\s+/)[0] ?? 'C'
  for (let b = 0; b < 4; b++) tick(ctx, dest, t + b * beat, b === 0 ? 0.12 : 0.07)
  CHORDS[firstChord].forEach((n) => tone(ctx, dest, noteFreq(n), t, beat * 3.6, 0.05, 'sine', 0.2))
  t += 4 * beat

  for (let r = 0; r < repeats; r++) {
    song.lines.forEach((_, i) => {
      lineStarts.push(t - t0)
      const notes = song.melody ? parseLine(song.melody[i]) : []
      const lineBeats = notes.reduce((s, n) => s + n.beats, 0) || 8
      // Melody: triangle + soft octave sine = "music box"
      let nt = t
      for (const n of notes) {
        if (n.note) {
          const f = noteFreq(n.note)
          const d = n.beats * beat * 0.92
          tone(ctx, dest, f, nt, d, 0.22, 'triangle')
          tone(ctx, dest, f * 2, nt, d * 0.6, 0.04, 'sine')
        }
        nt += n.beats * beat
      }
      // Chords: pad + bass on each chord's first beat
      const chords = song.chords?.[i]?.split(/\s+/) ?? []
      const per = chords.length ? lineBeats / chords.length : lineBeats
      chords.forEach((c, k) => {
        const ct = t + k * per * beat
        CHORDS[c].forEach((n) => tone(ctx, dest, noteFreq(n), ct, per * beat * 0.95, 0.045, 'sine', 0.08))
        tone(ctx, dest, noteFreq(CHORDS[c][0]) / 2, ct, Math.min(per, 2) * beat * 0.8, 0.16, 'sine')
      })
      // Gentle beat ticks
      for (let b = 0; b < lineBeats; b++) tick(ctx, dest, t + b * beat, b % 2 === 0 ? 0.05 : 0.03)
      t += lineBeats * beat
    })
  }
  return { lineStarts, duration: t - t0 + 0.4 }
}

// ---------- Live playback ----------

let ctx: AudioContext | null = null
let master: GainNode | null = null
let musicVolume = 0.8

/** iPhone/iPad: the silent switch mutes Web Audio unless the page declares
 *  itself a media player (Safari 17+). Spoken words already play anyway. */
function preferPlaybackSession() {
  const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession
  if (session) {
    try {
      session.type = 'playback'
    } catch {
      /* not supported: nothing to do */
    }
  }
}

export function audioContext() {
  if (!ctx) {
    preferPlaybackSession()
    ctx = new AudioContext()
    master = ctx.createGain()
    master.gain.value = musicVolume
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  return { ctx, master: master! }
}

export function setMusicVolume(v: number) {
  musicVolume = v
  if (master) master.gain.value = v
}

/** A running piece of music that can be stopped. */
export interface Playing {
  stop: () => void
}

/** Play a song; `onLine(i)` fires as each lyric line starts, `onEnd` at the end. */
export function playSong(song: Song, onLine: (line: number) => void, onEnd: () => void): Playing {
  const { ctx: c, master: m } = audioContext()
  // Each song plays through its own gain node so it can be cut instantly.
  const out = c.createGain()
  out.connect(m)
  const start = c.currentTime + 0.1
  const sched = scheduleSong(c, out, song, start)
  const timers = sched.lineStarts.map((s, k) => window.setTimeout(() => onLine(k % song.lines.length), (0.1 + s) * 1000))
  timers.push(window.setTimeout(onEnd, (0.1 + sched.duration) * 1000))
  return {
    stop: () => {
      timers.forEach((id) => window.clearTimeout(id))
      out.gain.setTargetAtTime(0, c.currentTime, 0.03)
      window.setTimeout(() => out.disconnect(), 300)
    },
  }
}

// ---------- Freeze Dance loop ----------

const DANCE_BASS = ['C3', 'C3', 'G2', 'A2', 'F2', 'F2', 'G2', 'G2']
const DANCE_RIFF = ['E5', 'G5', 'A5', 'G5', 'E5', 'D5', 'C5', 'D5', 'E5', 'G5', 'C6', 'A5', 'G5', 'E5', 'D5', 'C5']
const DANCE_CHORDS = ['C', 'C', 'Am', 'Am', 'F', 'F', 'G', 'G']

/** Schedule `bars` bars of upbeat dance music starting at t0. Returns end time. */
export function scheduleDance(c: BaseAudioContext, dest: AudioNode, t0: number, bars: number, tempo = 120, barOffset = 0) {
  const beat = 60 / tempo
  let t = t0
  for (let bar = 0; bar < bars; bar++) {
    const k = (bar + barOffset) % 8
    for (let b = 0; b < 4; b++) {
      const bt = t + b * beat
      kick(c, dest, bt, 0.5)
      tick(c, dest, bt + beat / 2, 0.06)
      tone(c, dest, noteFreq(DANCE_BASS[k]), bt, beat * 0.45, 0.2, 'triangle')
      tone(c, dest, noteFreq(DANCE_BASS[k]) * 2, bt + beat / 2, beat * 0.3, 0.08, 'square')
    }
    CHORDS[DANCE_CHORDS[k]].forEach((n) => tone(c, dest, noteFreq(n) * 2, t, beat * 3.8, 0.035, 'sawtooth', 0.05))
    for (let s = 0; s < 8; s++) {
      if ((bar + s) % 3 === 2) continue // leave some gaps so it breathes
      const n = DANCE_RIFF[((bar + barOffset) * 8 + s) % DANCE_RIFF.length]
      tone(c, dest, noteFreq(n), t + s * (beat / 2), beat * 0.4, 0.09, 'square')
    }
    t += 4 * beat
  }
  return t
}

/** Endless dance music until stopped. */
export function playDance(tempo = 120): Playing {
  const { ctx: c, master: m } = audioContext()
  const out = c.createGain()
  out.connect(m)
  let next = c.currentTime + 0.05
  let bar = 0
  const ahead = () => {
    while (next < c.currentTime + 2) {
      next = scheduleDance(c, out, next, 1, tempo, bar)
      bar++
    }
  }
  ahead()
  const id = window.setInterval(ahead, 500)
  return {
    stop: () => {
      window.clearInterval(id)
      out.gain.setTargetAtTime(0, c.currentTime, 0.02)
      window.setTimeout(() => out.disconnect(), 300)
    },
  }
}
