# English Play Sessions

A teacher-led English session app. The teacher runs 20–25 minute play sessions with a young learner; the app supplies the cards, audio, music, timers and games.

This README is written for someone with no technical background. It grows with each build phase.

---

## 1. Open the app

The app lives at this free web address:

**https://andresvasco.github.io/english-play-sessions/**

1. Open **Chrome** or **Edge** on the PC (or Chrome on the phone).
2. Type or paste the address above into the bar at the top and press **Enter**.
3. **What you should see:** a smiling face and the title "English Play Sessions".
4. **If you see "404 – There isn't a GitHub Pages site here":** the publishing step may still be running. Wait 2–3 minutes and reload the page. If it continues, check section 3.

*(Installing the app on the PC and phone, and using it offline, arrive in Phase 3. Instructions will be added here.)*

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

1. On the home screen, tap a lesson (or the big **Continue** button).
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
| ▶ Next | Next card or next song line | Space |
| ⏭ Next block | Goes to the next block (🏁 Finish on the last one) | S |

5. The big **🇨🇴** button is for her: a tap shows Spanish under the English for 10 seconds; holding it plays the Spanish word, then the English one. (Key: P)

---

## 5. Adding a new unit

All course content lives in files; no code changes are needed.

1. Write the unit in plain words in `docs/content/UNIT-XX-CONTENT.md` (same structure as Unit 1).
2. Ask Claude Code: *"Convert docs/content/UNIT-02-CONTENT.md into src/content/units/unit-02.json and generate its audio."*
3. The file is checked automatically before publishing (`npm run check-content`): if something is missing (for example a word without translation) publishing stops and the problem is listed in the **Actions** tab.

---

## 6. Regenerating the audio

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

## Coming in later phases

- The full games, melodies and sticker picker (Phase 2)
- Saving progress, smart review, stats, export/import between the PC and the phone, installing and offline use (Phase 3)

---

## Privacy

- Progress data about the learner is stored **only inside the browser of each device**. It never goes to the internet.
- No accounts, analytics or ads.
- The learner's name, photos or recordings must never be added to this repository.

## Credits and licenses

- English voice: Piper voice `en_US-hfc_female-medium`, trained on the Hi-Fi-CAPTAIN dataset (NICT), license **CC BY-NC-SA 4.0**. The generated English audio files are shared under the same license, for non-commercial use.
- Spanish voice: Piper voice `es_MX-claude-high`, license **Apache 2.0**.
- Text-to-speech engine: [Piper](https://github.com/OHF-Voice/piper1-gpl).
- Music: generated in the app with the Web Audio API.
