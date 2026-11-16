# BUILD BRIEF: English Adventure (repo: english-play-sessions)

**Readiness:** Personal project, scoped in chat. v1 = app shell + Unit 1, built and tested. On 2026-11-16 the owner asked for Units 2–12 to be drafted too (see Decision log); their content is in `docs/content/UNIT-XX-CONTENT.md` and waits for the owner's review.

> **How Claude Code should use this brief**
> 1. This brief is the source of truth for what we're building. Read it fully, and read it first at the start of every session.
> 2. Companion file: `UNIT-01-CONTENT.md` holds the full content for Unit 1. You will convert it into the first content JSON file. Do not invent content for other units.
> 3. **Repository setup comes first (Phase 0).** Before creating anything on GitHub, tell me exactly what you will create (repo name, visibility, files) and wait for my OK. Never push without asking me first.
> 4. Before writing code, ask me your clarifying questions, starting with "Unknowns to confirm" (section 9). Then restate the v1 plan in plain words (screens, where data is stored, how I'll run and deploy it) and wait for my OK.
> 5. Build **v1 must-haves only.** Do not build the "Later" list. If something seems needed but isn't in v1, ask first.
> 6. **Guide me as if I know nothing about technology.** For every action I must do myself (installing a program, creating an account, opening a terminal, running a command, deploying), give me a numbered step-by-step: what it is and why we need it in one plain sentence, where to click or what to type exactly, what I should see when it works, and what to do if I see an error. One step at a time; wait for me to confirm before moving on. No jargon without a short explanation.
> 7. **Everything must be free ($0).** Never propose a paid service, a paid plan, a free trial that becomes paid, or anything that asks for a credit card. If something would require payment, stop and tell me, and propose a free alternative.
> 8. Nothing hardcoded that should be dynamic: all course content comes from content files, never from components.
> 9. When you change code, tell me which files changed and why. Make targeted changes, not broad rewrites.
> 10. Work in the phases at the end. After each phase, show me how to test it against the acceptance criteria.
> 11. Keep this brief and `PROGRESS.md` current. When a decision changes, update the brief in the same change, add a line to the Decision log and tell me what you changed.
> 12. If anything in this brief looks wrong or risky, say so before building around it.

## 0. Snapshot

| | |
|---|---|
| One line | A teacher-led English session app: I run 20–25 minute play sessions with my 8-year-old stepdaughter, and the app provides cards, audio, music, timers and games while I teach. |
| Owner | Andres (builder and the only operator) |
| Users | 1 operator (me) running sessions; 1 learner (age 8) who watches, listens, moves and taps occasionally |
| Learner profile | Spanish speaker, beginner English. Shows marked attention/hyperactivity traits (not diagnosed). Has restricted phone use. Learns best with movement, short blocks and immediate positive feedback. |
| Devices | **Main:** a touchscreen PC (Windows, Chrome or Edge). **Secondary:** my phone. |
| Deadline | None set |

## 1. The problem

I want to teach her English myself, in a way that is fun, physical and fits her attention span. Commercial apps are built for the child to use alone on a screen, which conflicts with her restricted phone use and with what works for her (playing with a person, moving around). I want a tool that runs the structure of each session so I can focus on her, and that remembers which words she struggles with so every review targets her actual gaps.

## 2. How a session works (the core loop)

Every session follows the same fixed routine. Predictability matters for her.

| Block | Minutes | What happens |
|---|---|---|
| 1. Hello song | 2 | Same greeting song every session |
| 2. Review with the body | 5 | TPR review of weak words from previous sessions (Simon Says style) |
| 3. New words | 5 | Max 5–6 new items with flashcards and audio |
| 4. Movement game | 8 | One game from the lesson (Find it!, Freeze Dance, Faces, etc.) |
| 5. Song or video moment | 3 | Short song tied to the topic |
| 6. Stickers and Goodbye | 2 | She picks/earns a sticker; goodbye routine |

Principles the app must respect:
- **The app conducts, the teacher teaches.** Most activity happens off-screen. The app supplies audio, cards, music and timers.
- **The teacher marks, the child doesn't get graded.** During activities I tap ✓ (got it) or ↻ (try again) for each item. No red X, no failure sounds, no scores shown to her.
- **Visible time.** A visible block timer so she knows how much is left. When a block ends, the app suggests moving on; I can extend or skip.
- **One-tap control.** Next, repeat, skip, extend +2 min, switch game: always reachable without menus.

## 3. Required capabilities

**v1 must-haves** (priority order):
1. **Content engine:** loads units, lessons, items and activities from JSON content files. Adding a unit = adding a file, no code changes.
2. **Session runner:** runs the 6-block routine for a chosen lesson, with visible block timer, auto-suggest next block, and one-tap controls (next, repeat, skip, +2 min).
3. **Activity types (reusable, fed by any lesson):**
   - `flashcards`: big image + word, tap to play audio, teacher marks ✓/↻
   - `simon-says`: app calls random TPR commands from the lesson (audio + big text), configurable interval, teacher can pause
   - `find-it`: app announces a target ("Find something…"), countdown, teacher marks found/not
   - `freeze-dance`: music plays, stops at random, app shows/says an item; she acts it out
   - `faces`: app shows a feeling card, she makes the face; or teacher-reversed mode
   - `listen-and-tap`: app plays a word, she taps the matching picture (the only learner-tap activity in v1)
   - `memory-match`: card pairs (picture ↔ word)
4. **Teacher notes panel:** each activity has a short script in Spanish (what to say, how to explain, a variant if she's bored). Collapsible, small, opened only by me.
5. **Progress and smart review:** each ✓/↻ updates a per-item mastery level. Block 2 (review) automatically pulls the weakest and least recently seen items.
6. **Sticker board:** end-of-session reward screen for her. Stickers accumulate visibly across sessions.
7. **Export / import progress:** one button exports all progress to a JSON file; another imports it (with confirmation and an automatic backup of current progress before replacing). This is how progress moves between the PC and my phone.
8. **Offline PWA:** installable on PC and phone, works with no internet after first load.
9. **Session log:** date, lesson, duration, blocks completed, items marked. A simple stats view for me.
10. **Spanish peek:** a 🇨🇴 button on every learner-facing screen. Tapping it shows the Spanish translation *below* the English (smaller, different color) for words and on-screen instructions; English never disappears. The Spanish hides automatically after the peek duration (default **10 seconds**, configurable in Settings). Long-press plays Spanish audio then English audio ("feliz… happy!"). Every peek on an item is recorded and counts as a weak signal for the review rule.

**Later** (do not build in v1):
- ~~Units 2–12 content~~ — drafted on 2026-11-16 at the owner's request; adjust after the Unit 1 pilot
- Automatic sync between devices (e.g. Firebase) and any login
- Phone-as-remote controlling the PC screen
- AI-generated content (teacher-side only, if ever)
- Printable worksheets/flashcards
- Multiple learner profiles

**Never** (the app must not do this):
- No accounts, analytics, telemetry or ads. No data about the child leaves the device.
- No paid services, paid plans, trials or anything that requires a credit card, at any phase.
- No external links or browsing on learner-facing screens.
- No AI chat with the child.
- No speech-recognition scoring of her pronunciation (unreliable for children's voices; would cause frustration). A "record and play back" button without scoring is allowed later.
- No copyrighted characters or branded images.
- No failure feedback aimed at the child (no "wrong", no buzzer, no lost points).
- No child's name, photos or recordings committed to the repository.

## 4. Screens and flows

- **Home:** continue last lesson (big button), choose unit → lesson, sticker board preview, settings.
- **Lesson overview (teacher):** items in this lesson, planned blocks, chosen game, "Start session".
- **Session runner:** full-screen, learner-friendly. Large central area (card/game), top bar with block name + visible timer, bottom bar with teacher controls (next, repeat, skip, +2 min, switch game, notes). Teacher controls are visually quiet so they don't distract her. The 🇨🇴 peek button is the exception: large and easy for her to reach.
- **Teacher notes:** slide-in panel over the runner.
- **Sticker screen:** celebration, she picks a sticker, goodbye.
- **Stats (teacher):** sessions per week, total minutes, items by mastery level, items she struggles with.
- **Settings:** audio volume, music on/off, Simon Says speed, block durations, peek duration (default 10 s), "always bilingual" toggle (shows Spanish under English permanently, for the first sessions; off by default), export/import progress, reset progress (with confirmation).

Main flow: Home → pick lesson → Lesson overview → Start → 6 blocks (each with ✓/↻ marking) → Sticker screen → back to Home; progress saved automatically after every mark.

## 5. Design rules for the learner

- Few elements per screen. One focal thing at a time.
- Touch targets large (min ~64px on PC touch, ~48px on phone).
- Landscape-first on PC; must also work in portrait on phone.
- Celebrations short (1–2 s): confetti/sound, then move on.
- Calm palette with one bright accent; no flashing.
- Images: emoji or open-licensed sets (e.g. OpenMoji, check license and include attribution). Original illustrations are fine.
- Music for Freeze Dance and songs: generated in-app (Web Audio API) or royalty-free tracks with a clear license. Do not bundle copyrighted songs.
- Spanish is a support, never a replacement: it only appears below the English, via peek or the "always bilingual" setting, and there is no Spanish-only mode.
- Keyboard shortcuts on PC (e.g. Space = next, R = repeat) as a convenience for me.

## 6. Data

**Content (read-only, in repo):** `src/content/units/unit-XX.json`
- **Unit:** id, number, title, theme, lessons[]
- **Lesson:** id, title, newItems[] (item ids), reviewFrom (unit ids), blocks[] (block type, duration, activity id), songId
- **Item:** id, text (English), translation (Spanish, shown to the learner via peek), image (emoji or asset path), audio (asset path), audioEs (asset path, for long-press peek), tags (e.g. feeling, command)
- **Activity:** id, type (one of the activity types), itemIds[], prompts[] (each with `en` and `es`, the on-screen instructions), config (e.g. interval, rounds), teacherNotes (Spanish)
- **Command (TPR):** id, text, audio, emoji (commands are items with tag `command`)

**Progress (on device, IndexedDB):**
- **ItemProgress:** itemId, level (0–3), timesSeen, timesCorrect, peekCount, lastSeen (date), lastPeeked (date)
- **SessionLog:** id, date, lessonId, durationSec, blocksCompleted, marks[] (itemId, result)
- **Stickers:** list of earned stickers with date
- **Meta:** schemaVersion, lastLessonId

**Review rule (simple, deterministic):** ✓ raises level by 1 (max 3), ↻ lowers by 1 (min 0). Review block picks items ordered by lowest level, then items peeked in the last session, then oldest lastSeen; max 6 items. A peek does not lower the level (it is not a mistake); it only moves the item up in the review order.

**Export file:** `english-progress-YYYY-MM-DD.json` with schemaVersion and all progress tables. Import validates schemaVersion before replacing.

**Audio:** pre-generated once into `public/audio/` (English) and `public/audio/es/` (Spanish, for long-press peek), one file per item, so pronunciation is consistent across devices. Use a **free, open-source text-to-speech tool** (Piper TTS, run in the Claude Code cloud session; voices in section 9), with no account and no API key; check that the chosen voices allow personal use. Runtime fallback: browser speech synthesis (free) if a file is missing. A generation script in `scripts/` lets me regenerate audio when content changes.

## 7. Repository and hosting

- Create a **new GitHub repository** for this project (suggested name: `english-play-sessions`; confirm with me).
- Repo holds the code **and the project docs**: `BUILD-BRIEF.md` (root), `PROGRESS.md` (root), `docs/content/UNIT-01-CONTENT.md`, and later `docs/content/UNIT-XX-CONTENT.md`.
- Use a **free GitHub account** (`AndresVasco`). Claude Code works in a cloud session and pushes to the repo itself (always asking first), so Git, `gh`, Node and Piper do not need to be installed on the owner's PC.
- `.gitignore` must exclude `.env`, exported progress files and any personal media.
- Hosting: GitHub Pages (static, no server), public repo. See section 9.

Suggested structure:
```
/
├── BUILD-BRIEF.md
├── PROGRESS.md
├── README.md
├── docs/content/UNIT-01-CONTENT.md
├── public/audio/ , public/icons/
├── scripts/generate-audio.(ts|py)
└── src/
    ├── content/units/unit-01.json
    ├── activities/   (one module per activity type)
    ├── session/      (runner, timer, blocks)
    ├── progress/     (IndexedDB, review rule, export/import)
    └── screens/
```

## 8. Constraints

- **Stack:** your recommendation, but simple. Suggested: React + Vite + TypeScript as a PWA. Code and UI in English; teacher notes in Spanish.
- **Sign-in:** none.
- **Data sensitivity:** progress data about a minor stays on the device. Only course content and code go to GitHub.
- **Budget:** **$0, always.** Only free and open-source tools and free hosting tiers; nothing that asks for a credit card. No custom domain (use the free address the host provides).
- **Browsers:** Chrome/Edge on Windows touch PC; Chrome or the default browser on my phone.

## 9. Unknowns (resolved 2026-11-11)

| Question | Answer |
|---|---|
| Hosting | **GitHub Pages**, deployed automatically by a GitHub Actions workflow on every push to `main`. Address: `https://andresvasco.github.io/english-play-sessions/` |
| Repo visibility | **Public** (required for free GitHub Pages). Safe because no learner data is ever committed. |
| TTS tool | **Piper TTS** (open source, free, no account). Run by Claude Code in the cloud session, so nothing is installed on the owner's PC. Fallback: browser speech synthesis. |
| Voices / accent | **US English: `en_US-hfc_female-medium`** (license CC BY-NC-SA 4.0: attribution, non-commercial, share-alike; OK for personal use). **Spanish (peek): `es_MX-claude-high`** (Apache 2.0). Chosen by ear from samples. Credits go in README and a Credits view in Settings. |
| App name | Full: **"English Adventure"** (changed 2026-11-16; was "English Play Sessions"). Short (under the icon): **"Adventure"**. |
| Music | **Generated in-app (Web Audio API).** Songs: the app plays a simple melody and shows the lyrics big, highlighting the current line (karaoke style); the teacher sings. TTS does not sing. Freeze Dance: generated loop that stops at random. |

**Content defaults (decided while planning, change freely):**
- `song-goodbye` plays on the Sticker screen (block 6).
- Lesson 4 movement block: memory-match first, switches to listen-and-tap at half time (or earlier via "switch game").
- Lesson 1 review uses its fixed commands (no history yet); Lessons 2–4 `auto-review` mixes the weakest items with the lesson's commands.
- 🏆 "Unit 1 complete": a quiet teacher button on the Lesson 4 Sticker screen awards it when the teacher decides.

## 10. Acceptance criteria

v1 is done when:
- [ ] The GitHub repo exists with code, `BUILD-BRIEF.md`, `PROGRESS.md` and `docs/content/UNIT-01-CONTENT.md`.
- [ ] Unit 1 is fully loaded from `unit-01.json`; no Unit 1 text is hardcoded in components.
- [ ] I can start a session for any Unit 1 lesson and run all 6 blocks with visible timers, from the touchscreen PC and from my phone.
- [ ] Every activity type in section 3 works with Unit 1 content.
- [ ] Marking ✓/↻ updates item levels, and the next session's review block shows the weakest items first.
- [ ] Export on the PC and import on the phone restores the same progress (with backup before replace).
- [ ] The app works offline after first load and can be installed on both devices.
- [ ] No failure feedback appears on learner-facing screens.
- [ ] Teacher notes show in Spanish and are hidden by default.
- [ ] Tapping 🇨🇴 shows Spanish under the English for words and instructions, hides after the configured time (default 10 s), and each peek is recorded on the item.
- [ ] A README, written for someone with no technical background, explains step by step how to run the app, add a unit, regenerate audio and deploy.
- [ ] Nothing in the project requires a payment or a credit card.

## 11. Phased build plan

- **Phase 0, setup:** confirm unknowns, create GitHub repo (with my OK), project scaffold, README, docs folder, `PROGRESS.md`, deploy a "hello" page.
- **Phase 1, core:** content schema + Unit 1 JSON from `UNIT-01-CONTENT.md`, Home, Lesson overview, Session runner with timer and controls, flashcards activity.
- **Phase 2, games:** simon-says, find-it, freeze-dance, faces, listen-and-tap, memory-match; teacher notes panel; sticker screen.
- **Phase 3, memory:** IndexedDB progress, ✓/↻ marking, review rule, session log + stats, export/import, PWA offline + install.
- **Phase 4, pilot:** 2 weeks of real sessions with Unit 1. I report what she loved and ignored; we adjust before writing Unit 2.

## 12. Course map (Units 1–12, for structure only)

All 12 units are drafted (2026-11-16). Unit 1 was written by the owner; Units 2–12 were drafted by Claude Code from this map and need the owner's review.

| Unit | Theme | Key phrase | Star game |
|---|---|---|---|
| 1 | Greetings & feelings | How are you? I'm happy! | Faces |
| 2 | Colors & numbers 1–20 | It's blue. I have five. | Find it! (colors) |
| 3 | My body | Touch your nose! | Simon Says |
| 4 | Family | This is my mom. | Family tree with cards |
| 5 | House & objects | Where is the ball? Under the bed! | Hide and seek with objects |
| 6 | Food | I like… / I don't like… | Pretend restaurant |
| 7 | Action verbs | I can jump! | Freeze Dance |
| 8 | Animals | It's big. It has four legs. | Act like the animal |
| 9 | Clothes & weather | It's sunny. Put on your hat! | Dress the doll for the weather |
| 10 | Daily routine | I wake up, I eat breakfast… | Order the picture cards |
| 11 | Places | Let's go to the park! | Floor map with tape |
| 12 | Final project | (her presentation) | Present her favorite animal or character |

## 13. Suggested first prompt for Claude Code

Upload `BUILD-BRIEF.md` and `UNIT-01-CONTENT.md` and paste:
```
I want to build this app. I've already thought it through in the attached BUILD-BRIEF.md, and UNIT-01-CONTENT.md has the content for Unit 1. Read both fully, ask me any questions starting with the Unknowns, then propose the Phase 0 plan (including the new GitHub repo) before creating anything or writing code.
```

## 14. Decision log (Claude Code keeps this current)

| Date | Decision or change | Why |
|---|---|---|
| 2026-11-10 | Brief created | Scoped in chat |
| 2026-11-10 | Teacher-led app, not child-operated | Learner has restricted phone use; value is in playing together |
| 2026-11-10 | v1 = Unit 1 only | Validate engagement before building all 12 units |
| 2026-11-10 | Touchscreen PC as main device + export/import to phone | No backend or login in v1; keeps child data on device |
| 2026-11-10 | New GitHub repo holds code and docs | Single home for the project |
| 2026-11-10 | $0 budget; Claude Code guides every manual step for a non-technical user | Owner requirement |
| 2026-11-10 | Spanish peek (10 s, configurable) instead of a full language switch | She needs Spanish support, but English must stay visible so she associates both; a full switch would become the default |
| 2026-11-11 | Hosting: public repo + GitHub Pages (replaces default private + Cloudflare/Vercel) | One free account, fewest steps; repo never contains learner data |
| 2026-11-11 | Audio generated with Piper in the Claude Code cloud session, not on the owner's PC | Owner installs nothing; `scripts/` still allows regeneration |
| 2026-11-11 | Voices: `en_US-hfc_female-medium` (EN) and `es_MX-claude-high` (ES) | Chosen by ear. EN voice is CC BY-NC-SA: if the app ever becomes commercial, the EN voice must be replaced |
| 2026-11-11 | App name "English Play Sessions", short name "English Play" | Short name fits under the phone icon |
| 2026-11-11 | Songs: generated melody + karaoke lyrics, teacher sings | TTS cannot sing; singing together fits "the app conducts, the teacher teaches" |
| 2026-11-11 | Content defaults listed in section 9 (goodbye song, L4 game split, L1 review, trophy button) | Small gaps in UNIT-01-CONTENT.md |
| 2026-11-11 | Schema additions: `common.json` (global commands, praise/retry, default prompts per activity type, hello/goodbye songs); Activity gets `title` and optional `autoReview`; Lesson gets `keyExchange`, `commands`, `newCommands`, `teacherNotes` | Needed to run sessions from content only |
| 2026-11-11 | Lesson 4 game split into two activities: `u1-l4-match` (memory-match) and `u1-l4-tap` (listen-and-tap) | Each activity has one type |
| 2026-11-11 | Teacher settings and "last lesson" stored in localStorage for now; learner progress goes to IndexedDB in Phase 3 | Settings are device conveniences, not learner data |
| 2026-11-11 | 🇨🇴 peek and teacher notes panel built in Phase 1 (planned for later) | Owner approved; both appear on every runner screen |
| 2026-11-15 | English audio regenerated with steadier settings (noise_scale 0.333, noise_w 0.2) and text without final punctuation read as a statement ("happy" → "Happy.") | Owner heard random intonation on single words ("Tired?", "ANGRY"); chose this option by ear from 3 samples |
| 2026-11-15 | 🇨🇴 peek button draws the flag (SVG) instead of the emoji | Windows shows flag emoji as the letters "CO" |
| 2026-11-15 | Songs: original melodies stored in the content (`tempo`, `melody`, `chords` per song), played by an in-app Web Audio engine, twice after a one-bar count-in | Owner approved the melodies by ear; music stays editable as content |
| 2026-11-15 | Door game data moved to content (`config.situations`, `config.leaveItem`) | No item ids hardcoded in components |
| 2026-11-15 | listen-and-tap records ✓ when she taps right on the first try, ↻ otherwise (never shown to her); memory-match records nothing | Learner-tap games have no teacher marking |
| 2026-11-15 | Simon Says default 4 s (was 6 s) with live 🐢/🐇 speed buttons in the game | Owner found it slow |
| 2026-11-15 | Import safety: validates app + schemaVersion, saves a backup in the device AND downloads it as a file, offers "Undo last import/reset" | Brief asks for a backup before replace; a downloaded file survives even if browser data is cleared |
| 2026-11-15 | PWA with `vite-plugin-pwa` (MIT, free); updates are offered with a banner on Home, never applied mid-session | A surprise reload during a session would break the routine |
| 2026-11-15 | "Last lesson" moved from localStorage to the progress Meta (exported with the progress) | Matches the data model in section 6 |
| 2026-11-15 | Short visits (< 30 s, no marks) are not logged as sessions | Keeps Stats meaningful |
| 2026-11-16 | Redesign "English Adventure": sky background (sun, clouds, hills), lesson map with stops, original mascot Pip (says instructions, hops only on ✓), chunky cards, paw-print timer, Fredoka font (OFL, bundled) | Owner chose option B's interface with option A's background from 3 mockups, to catch her attention |
| 2026-11-16 | App renamed "English Adventure"; short name "Adventure" (fits under the icon); repo name and progress-file format unchanged | Owner's choice; keeping the file format means old exports still import |
| 2026-11-16 | Units 2–12 drafted now (content docs + JSON + audio) instead of after the pilot | Owner's request; each unit still needs the owner's review |
| 2026-11-16 | Star games of the course map are played with the 7 existing activity types (e.g. restaurant = find-it "Can I have the ___, please?"); the physical game is explained in the teacher notes | No new code per unit |
