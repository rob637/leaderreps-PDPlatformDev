# Conditioning Scorer Calibration Set

Hand-labeled fixtures + a runnable harness that measures how well the AI
scorer agrees with human judgement on the 4 Conditioning rep types.

This is the **measurement system** for the rubric. Without it, "the scorer
is good" is a vibe; with it, it's a number you can move.

## Files

- `fixtures.js` — 16 starter labeled transcripts (4 per RR), each carrying:
  - `transcript` — what the leader wrote
  - `expected` — per-condition scores (0–3) a human rater would assign
  - `expectedResult` — `pass` / `notYet` / `invalid`
  - `expectedStrong` — should this clear the strong-rep bar?
- `run.js` — runs the live scorer against fixtures and prints an agreement
  report.

## Run it

```bash
# from repo root
GEMINI_API_KEY=...      node functions/conditioning/calibration/run.js
ANTHROPIC_API_KEY=...   node functions/conditioning/calibration/run.js

# filter
node functions/conditioning/calibration/run.js --rr=DRF
node functions/conditioning/calibration/run.js --id=red-strong-01
```

The script reads `.env.local` from the repo root automatically if `dotenv`
is installed (it usually is via Vite).

## What it reports

- **Result agreement** — % of fixtures where the engine outcome
  (`pass` / `notYet` / `invalid`) matches the labeled expectation
- **Strong-rep agreement** — % where the strong-rep classification matches
- **Condition exact match** — % of all (fixture × condition) pairs where the
  AI score equals the human score exactly
- **Condition off-by-one** — same, but allowing ±1 (drift tolerance)

Exits non-zero if result agreement < 100% or condition exact match < 80%.
Wire into CI to catch prompt regressions.

## Adding fixtures

The single highest-leverage way to improve scorer quality is to add more
fixtures, especially:

1. **Edge cases humans actually disagree on** — these are where the model
   needs the clearest anchors.
2. **One fixture per fail rule** — guarantees regressions are caught.
3. **Adversarial inputs** — gaming attempts, off-topic, too-short.
4. **Real production transcripts** — once leaders have used the system,
   sample disagreements between AI and a human rater and turn them into
   fixtures.

When you tighten an anchor in `rrConfig.js`, re-review every fixture's
`expected` to make sure the human label still matches the new criterion.
