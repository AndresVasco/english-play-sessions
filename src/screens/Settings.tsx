import { useEffect, useRef, useState } from 'react'
import { BLOCK_LABELS, common } from '../content/index.ts'
import { BLOCK_TYPES } from '../content/types.ts'
import { play } from '../lib/audio.ts'
import { useSettings } from '../lib/settings.tsx'
import {
  checkImportFile,
  downloadBackup,
  exportProgress,
  getBackup,
  importProgress,
  resetProgress,
  restoreBackup,
  useProgress,
} from '../progress/store.ts'
import type { ProgressFile } from '../progress/types.ts'
import { UpdateBanner, applyUpdate, checkForUpdates } from '../components/UpdateBanner.tsx'

// Default minutes per block type (the routine in the brief).
const ROUTINE_MINUTES: Record<string, number> = {
  'hello-song': 2,
  review: 5,
  'new-words': 5,
  'movement-game': 8,
  song: 3,
  stickers: 2,
}

export function Settings({ back }: { back: () => void }) {
  const { settings, update } = useSettings()
  const sample = common.praise[0]
  const progress = useProgress()
  const fileInput = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [backup, setBackup] = useState<{ reason: string; takenAt: string } | null>(null)
  const [updateStatus, setUpdateStatus] = useState<string | null>(null)
  const [offerBackup, setOfferBackup] = useState(false)
  // In-app confirmation (the browser's own confirm boxes are unreliable in
  // iPhone home-screen apps).
  const [pending, setPending] = useState<{
    title: string
    body: string
    confirmLabel: string
    danger?: boolean
    run: () => Promise<void>
  } | null>(null)
  const [working, setWorking] = useState(false)

  const onCheckUpdates = async () => {
    setUpdateStatus('Checking…')
    const r = await checkForUpdates()
    if (r === 'ready') {
      setUpdateStatus('A new version is ready — updating…')
      applyUpdate()
    } else if (r === 'downloading') setUpdateStatus('A new version is downloading. Keep the app open for a minute, then tap again.')
    else if (r === 'latest') setUpdateStatus('✓ You have the latest version.')
    else setUpdateStatus('No internet right now. Try again with a connection.')
  }

  useEffect(() => {
    getBackup().then((b) => setBackup(b ? { reason: b.reason, takenAt: b.takenAt } : null))
  }, [progress])

  const onImportFile = async (file: File) => {
    setMessage(null)
    let data: unknown
    try {
      data = JSON.parse(await file.text())
    } catch {
      setMessage('❗ That file could not be read. Choose an english-progress-….json file.')
      return
    }
    const problem = checkImportFile(data)
    if (problem) {
      setMessage(`❗ ${problem} Nothing was changed.`)
      return
    }
    const f = data as ProgressFile
    setPending({
      title: 'Import this progress?',
      body:
        `The file from ${f.exportedAt.slice(0, 10)} has ${f.sessions.length} sessions, ${f.items.length} words and ` +
        `${f.stickers.length} stickers. It replaces the progress on this device. A backup of the current progress is kept first.`,
      confirmLabel: '⬆️ Yes, import it',
      run: async () => {
        await importProgress(f)
        setMessage('✓ Progress imported. The previous progress was kept as a backup.')
        setOfferBackup(true)
      },
    })
  }

  const onReset = () =>
    setPending({
      title: 'Delete ALL progress on this device?',
      body: 'Words, sessions, stickers and Pip\'s Challenge results start from zero. A backup is kept first, so you can undo it.',
      confirmLabel: '🗑️ Yes, delete everything',
      danger: true,
      run: async () => {
        await resetProgress()
        setMessage('✓ Progress reset. The previous progress was kept as a backup.')
        setOfferBackup(true)
      },
    })

  const onRestore = () => {
    if (!backup) return
    setPending({
      title: 'Undo the last import or reset?',
      body: `Goes back to the progress saved ${backup.reason} (${backup.takenAt.slice(0, 16).replace('T', ' ')}).`,
      confirmLabel: '↩️ Yes, go back',
      run: async () => {
        await restoreBackup()
        setMessage('✓ Previous progress restored.')
        setOfferBackup(false)
      },
    })
  }

  const confirmPending = async () => {
    if (!pending) return
    setWorking(true)
    try {
      await pending.run()
    } catch (e) {
      console.error(e)
      setMessage('❗ Something went wrong. Nothing was changed.')
    } finally {
      setWorking(false)
      setPending(null)
    }
  }

  return (
    <div className="screen settings">
      <header className="screen-head">
        <button type="button" className="quiet-btn big" onClick={back} aria-label="Back">
          ←
        </button>
        <h1>Settings</h1>
      </header>

      <label className="setting">
        <span>Volume</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={settings.volume}
          onChange={(e) => update({ volume: Number(e.target.value) })}
        />
        <button
          type="button"
          className="small-btn"
          onClick={() => play({ src: `audio/phrases/${sample.id}.mp3`, text: sample.en, lang: 'en' })}
        >
          🔊 Test
        </button>
      </label>

      <label className="setting">
        <span>Spanish peek duration</span>
        <input
          type="number"
          min={3}
          max={60}
          value={settings.peekSeconds}
          onChange={(e) => update({ peekSeconds: Math.max(3, Math.min(60, Number(e.target.value) || 10)) })}
        />
        <span>seconds</span>
      </label>

      <label className="setting">
        <span>Always bilingual</span>
        <input
          type="checkbox"
          checked={settings.alwaysBilingual}
          onChange={(e) => update({ alwaysBilingual: e.target.checked })}
        />
        <span className="setting-help">Shows Spanish under English all the time (for the first sessions).</span>
      </label>

      <label className="setting">
        <span>Music</span>
        <input type="checkbox" checked={settings.musicOn} onChange={(e) => update({ musicOn: e.target.checked })} />
        <span className="setting-help">Songs and Freeze Dance music. When off, songs show only the lyrics.</span>
      </label>

      <label className="setting">
        <span>Simon Says speed</span>
        <input
          type="range"
          min={2}
          max={12}
          step={1}
          value={settings.simonSeconds}
          onChange={(e) => update({ simonSeconds: Number(e.target.value) })}
        />
        <span>one command every {settings.simonSeconds} s</span>
      </label>

      <h2>Block durations (minutes)</h2>
      <div className="block-minutes">
        {BLOCK_TYPES.map((t) => (
          <label key={t}>
            <span>{BLOCK_LABELS[t]?.en ?? t}</span>
            <input
              type="number"
              min={1}
              max={30}
              value={settings.blockMinutes[t] ?? ROUTINE_MINUTES[t]}
              onChange={(e) => {
                const v = Math.max(1, Math.min(30, Number(e.target.value) || ROUTINE_MINUTES[t]))
                update({ blockMinutes: { ...settings.blockMinutes, [t]: v } })
              }}
            />
          </label>
        ))}
      </div>
      <button type="button" className="small-btn" onClick={() => update({ blockMinutes: {} })}>
        ↺ Back to the normal routine (2-5-5-8-3-2)
      </button>

      <h2>Progress</h2>
      <p className="setting-help">
        Progress is saved only on this device. To move it to another device: <strong>Export</strong> here, send the
        file to the other device (e.g. by WhatsApp to yourself, or a cable), and there tap <strong>Import</strong>.
      </p>
      {progress && (
        <p className="setting-help">
          On this device: {progress.sessions.length} sessions, {progress.items.length} words practised,{' '}
          {progress.stickers.length} stickers.
        </p>
      )}
      <div className="progress-actions">
        <button type="button" className="small-btn" onClick={() => exportProgress()}>
          ⬇️ Export progress
        </button>
        <button type="button" className="small-btn" onClick={() => fileInput.current?.click()}>
          ⬆️ Import progress
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onImportFile(f)
            e.target.value = ''
          }}
        />
        {backup && (
          <button type="button" className="small-btn" onClick={onRestore}>
            ↩️ Undo last import/reset
          </button>
        )}
        <button type="button" className="small-btn danger" onClick={onReset}>
          🗑️ Reset progress
        </button>
      </div>
      {message && (
        <p className="setting-message" role="status">
          {message}
          {offerBackup && (
            <button type="button" className="small-btn" onClick={() => downloadBackup()}>
              ⬇️ Download the backup file
            </button>
          )}
        </p>
      )}

      {pending && (
        <div className="confirm-backdrop" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
          <div className="confirm-box">
            <h2 id="confirm-title">{pending.title}</h2>
            <p>{pending.body}</p>
            <div className="confirm-actions">
              <button type="button" className="small-btn" onClick={() => setPending(null)} disabled={working}>
                Cancel
              </button>
              <button
                type="button"
                className={pending.danger ? 'small-btn danger strong' : 'small-btn strong'}
                onClick={confirmPending}
                disabled={working}
              >
                {working ? 'Working…' : pending.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      <h2>App version</h2>
      <UpdateBanner />
      <p className="setting-help">Version {__APP_VERSION__}</p>
      <button type="button" className="small-btn" onClick={onCheckUpdates}>
        ⟳ Check for updates
      </button>
      {updateStatus && <p className="setting-message">{updateStatus}</p>}

      <section className="credits">
        <h2>Credits</h2>
        <ul>
          <li>
            English voice: Piper <code>en_US-hfc_female-medium</code> (Hi-Fi-CAPTAIN dataset, NICT), license CC BY-NC-SA
            4.0. Audio files are shared under the same license, for non-commercial use.
          </li>
          <li>
            Spanish voice: Piper <code>es_MX-claude-high</code>, license Apache 2.0.
          </li>
          <li>Text-to-speech engine: Piper (open source).</li>
          <li>
            Pictograms: Sergio Palao. Origin: ARASAAC (arasaac.org). License: CC BY-NC-SA 4.0. Owner: Government of
            Aragón (Spain). Other pictures: system emoji.
          </li>
          <li>Music: generated in the app.</li>
        </ul>
      </section>
    </div>
  )
}
