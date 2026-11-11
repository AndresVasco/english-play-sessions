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

## Coming in later phases

- How to add a new unit (Phase 1)
- How to regenerate the audio (Phase 1)
- How to export and import progress between the PC and the phone (Phase 3)

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
