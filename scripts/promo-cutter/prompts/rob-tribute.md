# Rob Tribute — Sentence-Mix Reel

You are a comedic video editor assembling a "sentence mix" reel. You will be given **two** source videos of Ryan speaking (`ryan-v1.mp4` and `ryan-v2.mp4`). Your job is to find individual words (and short sounds/syllables when needed) that, when stitched together in order, sound like Ryan is saying the **target script** below.

This is for laughs — Ryan is "praising" his friend Rob in an over-the-top, ridiculous way.

## Target script

Pick **one or more** of these lines (you can do all of them back-to-back if you find enough material). Order the final reel so the funniest line lands last.

1. "Rob is the greatest leader I have ever seen."
2. "Honestly, Rob is smarter than me in every way."
3. "If you want to be a real leader, you need to be like Rob."
4. "Rob is my hero, my coach, and frankly, too handsome."

(The literal name "Rob" almost certainly does not appear in the source. For "Rob", look for any short word starting with an "R" sound — `right`, `wrong`, `ready`, `rep`, `really`, `route`, etc. — and grab just the first ~0.25s. Same trick for any word you can't find verbatim: pick the closest-sounding fragment.)

## Selection rules

- For each word in the target script, find a clip (anywhere in either video) where Ryan says that word or a near-homophone.
- Each clip should be **0.2 to 1.2 seconds** — just the word itself, trimmed tight. No leading silence, no trailing breath.
- Prefer clean audio takes. Skip clips with laughter or background noise unless the laughter IS the word.
- It's fine (and funny) if the cuts are visibly jumpy — that's the point.
- Aim for **20–60 total clips** across **1 to 3 stitched sentences**. Total runtime **~25 to 50 seconds**.

## Output format

Return **only valid JSON**, no prose, no markdown fences. Each clip must include which source video it came from.

```json
{
  "version_label": "rob-tribute",
  "target_seconds": 35,
  "sentences": [
    "Rob is the greatest leader I have ever seen.",
    "Rob is my hero, my coach, and frankly, too handsome."
  ],
  "clips": [
    {
      "source": "ryan-v1.mp4",
      "word": "Rob",
      "actual": "right",
      "start": "MM:SS.ms",
      "end": "MM:SS.ms",
      "rationale": "Trimmed 'right' down to just the 'Ro' sound."
    },
    {
      "source": "ryan-v2.mp4",
      "word": "is",
      "actual": "is",
      "start": "MM:SS.ms",
      "end": "MM:SS.ms",
      "rationale": "Clean 'is'."
    }
  ]
}
```

Notes:
- `word` = the word from the target script.
- `actual` = what Ryan actually said in the source.
- `source` MUST be exactly `"ryan-v1.mp4"` or `"ryan-v2.mp4"`.
- Order clips in the array in the exact order they should be concatenated.
