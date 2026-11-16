# Progress

Current phase: **Phase 4 – Pilot** (all 12 units drafted; redesign built)

## Phase 0 – Setup ✅ (done 2026-11-11)
- [x] Unknowns confirmed (see BUILD-BRIEF.md section 9)
- [x] Voice samples generated and voices chosen
- [x] Project scaffold (React + Vite + TypeScript) with a "Hello" page
- [x] README, PROGRESS.md, docs/content/UNIT-01-CONTENT.md
- [x] Automatic deploy to GitHub Pages (`.github/workflows/deploy.yml`)
- [x] GitHub repo created by the owner and first push
- [x] GitHub Pages enabled
- [x] "Hello" page opens on the PC and on the phone

## Phase 1 – Core
- [x] Content schema (`src/content/types.ts`) + automatic content check before every build
- [x] `common.json` (commands, praise/retry, prompts, hello/goodbye songs) + `unit-01.json`
- [x] Audio: `scripts/generate-audio.py`, 78 files generated (EN items, ES peek, phrases, prompts)
- [x] Home, Lesson overview, Settings (volume, peek duration, always bilingual, credits)
- [x] Session runner: 6 blocks, visible timer, time-up suggestion, Repeat / +2 min / Switch game / Notes / Next / Next block, keyboard shortcuts
- [x] Flashcards with ✓/↻ (praise or kind retry phrase, confetti)
- [x] 🇨🇴 peek (tap: Spanish under English for the configured seconds; hold: Spanish then English audio)
- [x] Teacher notes panel (moved forward from Phase 2)
- [x] GitHub Actions updated to Node 24 versions (removes the deprecation warnings)
- [x] Owner tested on PC and phone (2026-11-15). Fixed: 🇨🇴 showed as "CO" on Windows; English single words had unstable tone (audio regenerated with steadier settings)
- Owner feedback for Phase 2: songs have no sound, door game doesn't announce the situation, memory has no pairs, games are silent (all were Phase 1 stand-ins)

Temporary in Phase 1 (replaced later):
- Games other than flashcards show a "board" of tappable pictures (Phase 2)
- Songs show lyrics without melody; goodbye has no sticker picker yet (Phase 2)
- Marks and peeks are kept only during the session, not saved (Phase 3)
- Review block uses the lesson's commands (smart review in Phase 3)
- Templated prompts ("Show me your ___ face!") have no recorded audio yet (Phase 2)

## Phase 2 – Games
- [x] Music engine (`src/lib/music.ts`, Web Audio): song melodies with chords and count-in; Freeze Dance loop. Melodies approved by the owner by ear.
- [x] Songs play with karaoke-style line highlight (music can be turned off in Settings)
- [x] find-it: door game (knock → sun/moon → goodbye) and "Find something ___!" with countdown
- [x] simon-says: automatic commands, pause, speed in Settings
- [x] faces: show-me mode and guess mode
- [x] freeze-dance: music stops at random, "Freeze! Be ___!", big ❄️/💃 button for her
- [x] memory-match: picture ↔ word pairs, no failure feedback
- [x] listen-and-tap: 4 choices, a wrong tap just repeats the word
- [x] Sticker screen: pick a sticker, goodbye message + goodbye song, 🏆 button on the last lesson
- [x] Audio for prompts with a blank, per item ("Show me your sad face!")
- [x] Settings: music on/off, Simon Says speed
- [x] Owner tested (2026-11-15): Simon Says felt slow → fixed in Phase 3 (default 4 s, live 🐢/🐇 buttons)

## Phase 3 – Memory
- [x] IndexedDB progress: items, sessions, stickers, meta (+ automatic backup)
- [x] ✓/↻ and peeks saved immediately; level rule 0–3; review picks her 6 weakest words (`npm run check-review` checks the rule before every build)
- [x] Session log (date, lesson, duration, blocks, marks) + Stats screen
- [x] Sticker board on Home; collection shown at goodbye
- [x] Export / import with validation, backup download before replacing, undo; reset with double confirmation
- [x] Settings: block durations
- [x] Installable PWA, works offline (107 files precached, incl. audio); update banner on Home only
- [x] Simon Says faster (4 s default, old 6 s setting moved to 4 s) with live speed buttons
- [x] Owner tested on iPhone (2026-11-16): install, offline, export ✓. Music now plays in iPhone silent mode.
- [ ] Owner tests on the PC: install, import the iPhone export, a session on the touchscreen

## Redesign + full course (2026-11-16, owner's request)
- [x] "English Adventure" redesign: sky, lesson map, Pip mascot, chunky cards, paw-print timer, Fredoka font
- [x] Units 2–12 drafted: content docs, JSON (48 lessons, ~280 words and commands), ~850 audio files
- [x] Every lesson of every unit clicked through in a browser, no errors
- [ ] Owner reviews Units 2–12 content (translations, teacher notes, games)

## Phase 4 – Pilot
Not started: 2 weeks of real sessions with Unit 1, noting what she loved / ignored / found too long.
