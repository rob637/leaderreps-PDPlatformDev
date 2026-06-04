# Promo Cutter

Local-only tool. Takes a long video → asks Gemini to pick the best clips → uses FFmpeg to cut, burn subtitles, and concatenate them into a 60–90s promo.

**Not deployed. Not part of the app build.** Lives here purely as a personal utility.

---

## One-time setup

```bash
cd scripts/promo-cutter
npm install
cp .env.example .env
# then edit .env and paste a Gemini API key from https://aistudio.google.com/apikey
```

FFmpeg must be installed (`ffmpeg -version` to check). On this dev container it already is.

---

## Get the source videos

Drop the two Vimeo MP4s into `input/`. The folder is gitignored.

```
scripts/promo-cutter/input/
├── ryan-v1.mp4   # original take
└── ryan-v2.mp4   # revised take
```

(File names are up to you — just pass whatever you call them as the first arg to the commands below.)

### Downloading from Vimeo

If you own the videos and the Vimeo settings allow it, the simplest path is the **Download** button on each Vimeo page. If that's disabled, ask the owner to enable it temporarily, or use `yt-dlp`:

```bash
# install once
pipx install yt-dlp   # or: brew install yt-dlp
yt-dlp -o 'input/ryan-v1.%(ext)s' 'https://vimeo.com/1196830575'
yt-dlp -o 'input/ryan-v2.%(ext)s' 'https://vimeo.com/1196833858'
```

---

## Iterate

### 1. Pick clips
```bash
npm run analyze -- ryan-v2.mp4 landing-page
```
Writes `output/ryan-v2--landing-page.json`. Open it. Eyeball the picks. Hand-edit timestamps or transcripts if you want.

### 2. Render
```bash
npm run render -- ryan-v2--landing-page.json ryan-v2.mp4
```
Writes `output/ryan-v2--landing-page.mp4`. Watch it.

### 3. Don't like it?
- **Bad clip choices?** Edit `prompts/landing-page.md` (more specific guidance) → re-run `analyze`.
- **Timing off on one clip?** Just edit the `start`/`end` in the JSON → re-run `render`.
- **Subtitles wrong?** Edit the `transcript` field in the JSON → re-run `render`.
- **Want a crossfade between clips?** `npm run render -- ... -- --crossfade=0.3`
- **No subtitles?** `npm run render -- ... -- --no-subs`

### 4. Bloopers reel
```bash
npm run analyze -- ryan-v1.mp4 bloopers
npm run render  -- ryan-v1--bloopers.json ryan-v1.mp4
```

---

## Prompts

Each `.md` file in `prompts/` is a separate "version." Add more by copying an existing one (e.g. `punchy.md`, `emotional.md`) and tweaking. The filename (minus `.md`) is what you pass as the second arg to `analyze`.

---

## Notes

- Subtitle timing is approximate — words are distributed evenly across each clip's duration. Good enough for landing-page muted viewing; if you want word-perfect timing later, we can add Whisper.
- Intermediate clip files are kept in `output/.tmp-*/` so you can spot-check individual cuts.
- Gemini's free tier handles 15-minute videos fine. Each `analyze` run uploads the full video (~1 min upload + ~30s processing).
