import { common } from '../content/index.ts'
import { play } from '../lib/audio.ts'
import { useSettings } from '../lib/settings.tsx'

export function Settings({ back }: { back: () => void }) {
  const { settings, update } = useSettings()
  const sample = common.praise[0]

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
          min={3}
          max={15}
          step={1}
          value={settings.simonSeconds}
          onChange={(e) => update({ simonSeconds: Number(e.target.value) })}
        />
        <span>one command every {settings.simonSeconds} s</span>
      </label>

      <p className="setting-help">More settings (block durations, export/import) arrive in Phase 3.</p>

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
          <li>Pictures: system emoji. Music: generated in the app.</li>
        </ul>
      </section>
    </div>
  )
}
