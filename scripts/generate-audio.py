#!/usr/bin/env python3
"""Generate the app's audio files with Piper TTS (free, open source, offline).

What it creates (all inside public/audio/):
  audio/<item-id>.mp3          English, every item and command
  audio/es/<item-id>.mp3       Spanish, for the long-press peek
  audio/phrases/<id>.mp3       Praise ("Good job!") and retry ("One more time!")
  audio/prompts/<id>.mp3       On-screen instructions without a "___" blank
  audio/prompts/<id>--<item>.mp3  Instructions with the blank filled per item

Only files whose text changed (or that are missing) are regenerated; this is
tracked in public/audio/manifest.json. Use --force to regenerate everything.

Requirements: Python 3.9+, `pip install -r scripts/requirements.txt`, ffmpeg.
Voices are downloaded once into scripts/voices/ (not committed to git).

Voices (see BUILD-BRIEF.md section 9 and the Decision log):
  English  en_US-hfc_female-medium  CC BY-NC-SA 4.0 (non-commercial use)
  Spanish  es_MX-claude-high        Apache 2.0
"""

from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
import sys
import tempfile
import unicodedata
import urllib.request
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "src" / "content"
PUBLIC = ROOT / "public"
MANIFEST = PUBLIC / "audio" / "manifest.json"
VOICES_DIR = Path(__file__).resolve().parent / "voices"
HF = "https://huggingface.co/rhasspy/piper-voices/resolve/main"

VOICES = {
    # lang: (voice name, path in the piper-voices repo, speed: >1 is slower,
    #        noise_scale, noise_w_scale: lower = steadier tone; None = voice default)
    # English uses steadier settings: with the defaults, single words came out
    # with random intonation ("Tired?", "ANGRY"). Chosen by ear (2026-11-15).
    "en": ("en_US-hfc_female-medium", "en/en_US/hfc_female/medium", 1.15, 0.333, 0.2),
    "es": ("es_MX-claude-high", "es/es_MX/claude/high", 1.10, None, None),
}


def speakable(text: str) -> str:
    """Remove emoji and the '…' blank so the voice reads only the words.
    Text without final punctuation becomes a calm statement ("happy" -> "Happy.")
    so single words keep a steady, falling tone."""
    text = text.replace("…", "").replace("___", "")
    kept = [ch for ch in text if unicodedata.category(ch)[0] in "LNPZ"]
    words = " ".join("".join(kept).split()).strip()
    if words and words[-1] not in ".!?":
        words = words[0].upper() + words[1:] + "."
    return words


def collect_jobs() -> list[tuple[str, str, str]]:
    """Return (output path inside public/, language, text) for every file."""
    common = json.loads((CONTENT / "common.json").read_text("utf8"))
    units = [json.loads(p.read_text("utf8")) for p in sorted((CONTENT / "units").glob("unit-*.json"))]

    jobs: list[tuple[str, str, str]] = []
    for item in common["commands"] + [i for u in units for i in u["items"]]:
        jobs.append((item["audio"], "en", item["text"]))
        jobs.append((item["audioEs"], "es", item["translation"]))
    for p in common["praise"] + common["retry"]:
        jobs.append((f"audio/phrases/{p['id']}.mp3", "en", p["en"]))
    prompts = [p for lst in common["prompts"].values() for p in lst]
    prompts += [p for u in units for a in u["activities"] for p in a.get("prompts", [])]
    for p in prompts:
        if "___" not in p["en"]:
            jobs.append((f"audio/prompts/{p['id']}.mp3", "en", p["en"]))
    # Prompts with a blank ("Show me your ___ face!"): one file per item of
    # each activity that uses them.
    items = {i["id"]: i for i in common["commands"] + [i for u in units for i in u["items"]]}
    seen = set()
    for u in units:
        for a in u["activities"]:
            for p in a.get("prompts") or common["prompts"][a["type"]]:
                if "___" not in p["en"]:
                    continue
                for item_id in a["itemIds"]:
                    path = f"audio/prompts/{p['id']}--{item_id}.mp3"
                    if path not in seen:
                        seen.add(path)
                        jobs.append((path, "en", p["en"].replace("___", items[item_id]["text"])))
    return jobs


def ensure_voice(lang: str) -> Path:
    name, repo_path = VOICES[lang][:2]
    VOICES_DIR.mkdir(exist_ok=True)
    model = VOICES_DIR / f"{name}.onnx"
    for suffix in (".onnx", ".onnx.json"):
        target = VOICES_DIR / f"{name}{suffix}"
        if not target.exists():
            print(f"Downloading voice {name}{suffix} …")
            urllib.request.urlretrieve(f"{HF}/{repo_path}/{name}{suffix}", target)
    return model


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--force", action="store_true", help="regenerate every file")
    args = parser.parse_args()

    try:
        from piper import PiperVoice, SynthesisConfig
    except ImportError:
        print("Piper is not installed. Run: pip install -r scripts/requirements.txt")
        return 1

    manifest: dict[str, str] = {}
    if MANIFEST.exists() and not args.force:
        manifest = json.loads(MANIFEST.read_text("utf8"))

    jobs = collect_jobs()
    loaded: dict[str, PiperVoice] = {}
    made = skipped = 0
    for out_path, lang, text in jobs:
        words = speakable(text)
        name, _, speed, noise, noise_w = VOICES[lang]
        key = hashlib.sha1(f"{name}|{speed}|{noise}|{noise_w}|{words}".encode()).hexdigest()[:16]
        target = PUBLIC / out_path
        if manifest.get(out_path) == key and target.exists():
            skipped += 1
            continue
        if lang not in loaded:
            loaded[lang] = PiperVoice.load(str(ensure_voice(lang)))
        target.parent.mkdir(parents=True, exist_ok=True)
        with tempfile.TemporaryDirectory() as tmp:
            wav_path = Path(tmp) / "out.wav"
            with wave.open(str(wav_path), "wb") as wav_file:
                config = SynthesisConfig(length_scale=speed)
                if noise is not None:
                    config = SynthesisConfig(length_scale=speed, noise_scale=noise, noise_w_scale=noise_w)
                loaded[lang].synthesize_wav(words, wav_file, syn_config=config)
            subprocess.run(
                ["ffmpeg", "-loglevel", "error", "-y", "-i", str(wav_path), "-ac", "1", "-b:a", "48k", str(target)],
                check=True,
            )
        manifest[out_path] = key
        made += 1
        print(f"  ✓ {out_path}  ←  {words}")

    # Forget files that are no longer in the content
    wanted = {j[0] for j in jobs}
    manifest = {k: v for k, v in sorted(manifest.items()) if k in wanted}
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n", "utf8")
    print(f"Done: {made} generated, {skipped} unchanged, {len(jobs)} total.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
