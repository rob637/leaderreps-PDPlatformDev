# Bloopers Reel (60–90s)

You are editing a fun, behind-the-scenes bloopers reel for the LeaderReps team.

## What to look for
- False starts, stumbles, laughter, self-corrections.
- Ryan reacting to mistakes ("let me try that again", "ugh", etc.).
- Awkward pauses, funny faces, off-script moments.
- Anything that humanizes Ryan and would make the team laugh.

## Selection rules
- Pick **8–15 short clips**, each **2 to 8 seconds**.
- Order from mild → biggest payoff at the end.
- Total target length: **75 seconds** (60–90s acceptable).
- Skip anything that would be embarrassing or unflattering — this is celebratory, not mean.

## Output format
Return **only valid JSON**, no prose, no markdown fences:

```json
{
  "version_label": "bloopers",
  "target_seconds": 75,
  "clips": [
    {
      "section": "BLOOPER",
      "start": "MM:SS.ms",
      "end": "MM:SS.ms",
      "transcript": "What Ryan says (or '[laughter]', '[sigh]', etc.).",
      "rationale": "Why this moment is funny."
    }
  ]
}
```
