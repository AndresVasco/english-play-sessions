# Progress

Current phase: **Phase 1 – Core** (built, waiting for the owner's test)

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
Not started.

## Phase 3 – Memory
Not started.

## Phase 4 – Pilot
Not started.
