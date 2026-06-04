#!/usr/bin/env python3
"""
transcribe.py — Extract audio from a video and produce a word-level
timestamp index using faster-whisper.

Usage:
    .venv/bin/python transcribe.py input/ryan-v1.mp4
    -> writes output/ryan-v1.words.json

JSON shape:
    {
      "source": "ryan-v1.mp4",
      "language": "en",
      "duration": 845.32,
      "words": [
        {"i": 0, "word": "hello", "start": 0.42, "end": 0.71},
        ...
      ]
    }
"""

import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from faster_whisper import WhisperModel

ROOT = Path(__file__).parent
INPUT = ROOT / "input"
OUTPUT = ROOT / "output"
OUTPUT.mkdir(exist_ok=True)

# Model: "small" is fast on CPU and accurate enough for clean speech.
# Bump to "medium" if accuracy is bad. Bump to "large-v3" if you have a GPU.
MODEL_SIZE = os.environ.get("WHISPER_MODEL", "small")
COMPUTE_TYPE = os.environ.get("WHISPER_COMPUTE", "int8")  # CPU-friendly


def die(msg):
    print(f"\n[transcribe] ERROR: {msg}\n", file=sys.stderr)
    sys.exit(1)


def main():
    if len(sys.argv) < 2:
        die("Usage: transcribe.py <video-file-in-input/-or-absolute-path>")

    arg = sys.argv[1]
    video = Path(arg) if os.path.isabs(arg) else INPUT / arg
    if not video.exists():
        die(f"Video not found: {video}")

    base = video.stem
    out_path = OUTPUT / f"{base}.words.json"
    print(f"[transcribe] video:  {video}")
    print(f"[transcribe] model:  {MODEL_SIZE} ({COMPUTE_TYPE})")
    print(f"[transcribe] output: {out_path}")

    # Extract mono 16kHz wav (Whisper's native format) to a temp file
    with tempfile.TemporaryDirectory() as td:
        wav = Path(td) / "audio.wav"
        print("[transcribe] extracting audio with ffmpeg...")
        r = subprocess.run(
            [
                "ffmpeg", "-y", "-i", str(video),
                "-vn", "-ac", "1", "-ar", "16000",
                "-c:a", "pcm_s16le", str(wav),
            ],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        )
        if r.returncode != 0:
            die("ffmpeg audio extraction failed")

        print(f"[transcribe] loading model {MODEL_SIZE} (first run downloads weights)...")
        model = WhisperModel(MODEL_SIZE, device="cpu", compute_type=COMPUTE_TYPE)

        print("[transcribe] transcribing (this takes a while on CPU)...")
        segments, info = model.transcribe(
            str(wav),
            language="en",
            word_timestamps=True,
            vad_filter=True,
            beam_size=5,
        )

        words = []
        for seg in segments:
            if not seg.words:
                continue
            for w in seg.words:
                token = (w.word or "").strip()
                if not token:
                    continue
                words.append({
                    "i": len(words),
                    "word": token,
                    "start": round(float(w.start), 3),
                    "end": round(float(w.end), 3),
                })
            # progress ping
            if len(words) % 200 < 5:
                print(f"  ... {len(words)} words, ~{seg.end:.1f}s in", flush=True)

        result = {
            "source": video.name,
            "language": info.language,
            "duration": round(float(info.duration), 3),
            "words": words,
        }
        out_path.write_text(json.dumps(result, indent=2))
        print(f"\n[transcribe] DONE. {len(words)} words over {info.duration:.1f}s")
        print(f"[transcribe] wrote {out_path}")


if __name__ == "__main__":
    main()
