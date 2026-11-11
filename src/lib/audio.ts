// Plays the pre-generated audio files. If a file is missing or fails, it falls
// back to the browser's built-in voice (free, works offline on most devices).
// Only one sequence plays at a time: starting a new one stops the previous.

export interface Clip {
  /** Path inside public/ (e.g. "audio/u1-hello.mp3"); optional */
  src?: string
  /** Text to speak with the browser voice if the file can't play */
  text: string
  lang: 'en' | 'es'
}

let volume = 0.9
let current: HTMLAudioElement | null = null
let token = 0

export const setVolume = (v: number) => {
  volume = Math.max(0, Math.min(1, v))
  if (current) current.volume = volume
}

const url = (src: string) => import.meta.env.BASE_URL + src.replace(/^\//, '')

export function stopAudio() {
  token++
  if (current) {
    current.pause()
    current = null
  }
  if ('speechSynthesis' in window) window.speechSynthesis.cancel()
}

function playFile(src: string, myToken: number): Promise<boolean> {
  return new Promise((resolve) => {
    const audio = new Audio(url(src))
    audio.volume = volume
    current = audio
    audio.onended = () => resolve(true)
    audio.onerror = () => resolve(false)
    audio.play().catch(() => resolve(false))
    // If something newer started, stop this one.
    const check = setInterval(() => {
      if (myToken !== token) {
        audio.pause()
        clearInterval(check)
        resolve(true)
      }
      if (audio.ended || audio.error) clearInterval(check)
    }, 100)
  })
}

function speak(text: string, lang: 'en' | 'es'): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) return resolve()
    const u = new SpeechSynthesisUtterance(text.replace(/…|___/g, ''))
    u.lang = lang === 'en' ? 'en-US' : 'es-MX'
    u.rate = 0.85
    u.volume = volume
    u.onend = () => resolve()
    u.onerror = () => resolve()
    window.speechSynthesis.speak(u)
  })
}

/** Play clips one after another. Resolves when done or interrupted. */
export async function play(...clips: Clip[]): Promise<void> {
  stopAudio()
  const myToken = token
  for (const clip of clips) {
    if (myToken !== token) return
    const ok = clip.src ? await playFile(clip.src, myToken) : false
    if (myToken !== token) return
    if (!ok) await speak(clip.text, clip.lang)
  }
}
