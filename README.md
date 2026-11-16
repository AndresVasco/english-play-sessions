# English Adventure

A teacher-led English session app (repository: `english-play-sessions`), with Pip, a friendly mascot. The teacher runs 20–25 minute play sessions with a young learner; the app supplies the cards, audio, music, timers and games.

This README is written for someone with no technical background. It grows with each build phase.

---

## 1. Open the app

The app lives at this free web address:

**https://andresvasco.github.io/english-play-sessions/**

1. Open **Chrome** or **Edge** on the PC (or Chrome on the phone).
2. Type or paste the address above into the bar at the top and press **Enter**.
3. **What you should see:** a sky with hills, the title **"English Adventure"** and the map of lessons.
4. **If you see "404 – There isn't a GitHub Pages site here":** the publishing step may still be running. Wait 2–3 minutes and reload the page. If it continues, check section 3.

### Install it (once per device)

Installing puts an **Adventure** icon on the PC or phone and lets the app work **without internet**.

**On the Windows PC (Chrome or Edge):**
1. Open the address above.
2. In the address bar, at the right, click the small **install icon** (a screen with a down arrow, or "App available"). In Edge it may be in the **⋯** menu → **Apps** → **Install this site as an app**.
3. Click **Install**.
4. **What you should see:** the app opens in its own window, and an **Adventure** icon appears in the Start menu (you can pin it to the taskbar).

**On an Android phone (Chrome):**
1. Open the address above in Chrome.
2. Tap the **⋮** menu (top right) → **Add to Home screen** (or **Install app**) → **Install**.
3. **What you should see:** an **Adventure** icon on the home screen.

**On an iPhone (Safari):** open the address in Safari → tap the **Share** button (square with an arrow) → **Add to Home Screen** → **Add**.

**If you don't see the install option:** reload the page once and wait a few seconds; the browser offers it only after the app has fully loaded.

### Offline

After opening the app once with internet, everything (lessons, audio, music) is saved on the device. It then works with no internet.

When a new version is published, the Home screen shows **"A new version of the app is ready — Update now"**. Tap it when you are not in a session (the app never updates by itself in the middle of a session).

---

## 2. How updates reach the app

- All the code and content live in this GitHub repository.
- Every time a change is saved to the `main` branch, GitHub builds the app and publishes it automatically (this takes about 2 minutes).
- You do **not** need to install anything on your computer for this.

---

## 3. If the published page doesn't update

1. Open the repository on github.com.
2. Click the **Actions** tab (top of the page).
3. The newest line should have a **green check ✓**. A **red ✗** means the publish failed: copy what it says and share it with Claude Code.

---

## 4. Running a session

1. On the home screen choose the unit at the top (1–12), then tap a lesson on the map. Green stops = lessons already played; the orange stop with Pip = today's lesson.
2. Check the lesson plan and tap **Start session**. The screen goes full screen on the PC.
3. The top bar shows the block (1/6 … 6/6) and the time left. When the time runs out the timer turns orange and the **Next block** button glows: move on when you are ready, or tap **+2 min**.
4. Teacher controls (bottom bar):

| Button | What it does | PC key |
|---|---|---|
| ↺ Repeat | Plays the current word again | R |
| +2 min | Adds 2 minutes to this block | E |
| 🔀 Game | Switches game (only when a block has two) | G |
| 📝 Notes | Opens your notes in Spanish | N |
| ✓ Got it / ↻ Again | Marks the current word | 1 / 2 |
| ▶ Next | Next card / command / round; in Freeze Dance it freezes or restarts the music; in Memory it deals new cards | Space |
| ⏭ Next block | Goes to the next block (🏁 Finish on the last one) | S |

5. Inside the games there are a few extra buttons: **⏸ Pause** and **🐢 − / + 🐇** speed (Simon Says), **🔄 Guess mode** (Faces), the big **❄️ Freeze! / 💃 Dance!** (Freeze Dance — she can press it), **▶ Play song** (songs), and **🏆 Award** (stickers, last lesson only).
6. The big **🇨🇴** button is for her: a tap shows Spanish under the English for 10 seconds; holding it plays the Spanish word, then the English one. (Key: P)

---

## 5. Progress, review and stats

- Every ✓ / ↻ and every 🇨🇴 peek is **saved immediately** on the device.
- Each word has a level from 0 to 3: ✓ raises it, ↻ lowers it. A peek never lowers it, but moves the word up in the review.
- The **Review with the body** block (Lessons 2–4) automatically mixes the commands with **her 6 weakest words**.
- Stickers she picks stay on the **Sticker board** on the Home screen.
- **📊 Stats** (Home, top right): sessions per week, total minutes, words by level, the words she finds hard, and recent sessions.

### Moving progress from the PC to the phone (or back)

Progress is not synced automatically (on purpose: no accounts, nothing about her goes to the internet). You move it with a file:

1. **On the PC:** Home → ⚙️ **Settings** → **⬇️ Export progress**. A file named `english-progress-YYYY-MM-DD.json` is saved in your **Downloads** folder.
2. **Send the file to the phone**, for example by WhatsApp or email to yourself, or with a USB cable.
3. **On the phone:** open the app → ⚙️ **Settings** → **⬆️ Import progress** → choose the file.
4. The app asks you to confirm and shows what the file contains. Tap **OK**.
5. **What you should see:** "✓ Progress imported". Before replacing anything, the app **saves and downloads a backup** of the phone's previous progress (`english-progress-backup-….json`).
6. **If you change your mind:** Settings → **↩️ Undo last import/reset**.
7. **If you see "This is not an English Adventure progress file"** or "different version": nothing was changed; check that you chose the right file.

Tip: always continue on the device that has the newest progress, and export again when you switch.

---

## 6. Adding a new unit

All course content lives in files; no code changes are needed.

All 12 units are already drafted (`docs/content/UNIT-01-CONTENT.md` … `UNIT-12-CONTENT.md`). To change one, or add a 13th:

1. Edit or write the unit in plain words in `docs/content/UNIT-XX-CONTENT.md` (same structure as Unit 1).
2. Ask Claude Code: *"Convert docs/content/UNIT-02-CONTENT.md into src/content/units/unit-02.json and generate its audio."*
3. The file is checked automatically before publishing (`npm run check-content`): if something is missing (for example a word without translation) publishing stops and the problem is listed in the **Actions** tab.

---

## 7. Regenerating the audio

The audio files are made once with Piper (free text-to-speech) and saved in `public/audio/`.

- **Easiest:** ask Claude Code in a cloud session: *"Regenerate the audio."* It runs `scripts/generate-audio.py`, which only remakes files whose text changed.
- **On your own computer (optional, for technical users):** install Python 3 and ffmpeg, then run:
  ```
  pip install -r scripts/requirements.txt
  python scripts/generate-audio.py
  ```
  Use `--force` to remake every file.

If an audio file is missing, the app uses the browser's own voice instead.

---

## Privacy

- Progress data about the learner is stored **only inside the browser of each device** (IndexedDB). It never goes to the internet; it only leaves the device when you export a file yourself.
- Exported progress files are excluded from the repository (`.gitignore`): never upload them to GitHub.
- No accounts, analytics or ads.
- The learner's name, photos or recordings must never be added to this repository.

## Credits and licenses

- English voice: Piper voice `en_US-hfc_female-medium`, trained on the Hi-Fi-CAPTAIN dataset (NICT), license **CC BY-NC-SA 4.0**. The generated English audio files are shared under the same license, for non-commercial use.
- Spanish voice: Piper voice `es_MX-claude-high`, license **Apache 2.0**.
- Text-to-speech engine: [Piper](https://github.com/OHF-Voice/piper1-gpl).
- Music: generated in the app with the Web Audio API.
