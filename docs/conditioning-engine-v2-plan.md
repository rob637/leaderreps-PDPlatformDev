# Conditioning Engine v2 — Calibration + Behavior Engine Enhancements

> **Source:** Boss's review notes — "LeaderReps Conditioning Tool — Calibration + Behavior Engine Enhancements."
> **Goal:** Make the engine feel like *leadership conditioning tied to real-world execution*, not *AI grading communication quality* — without weakening standards.
> **Active system:** [functions/conditioning/](../functions/conditioning) (engine + scorer + templates + calibration), surfaced via [src/components/screens/ConditioningLight.jsx](../src/components/screens/ConditioningLight.jsx) and [src/components/widgets/PracticeRepsHistoryWidget.jsx](../src/components/widgets/PracticeRepsHistoryWidget.jsx).
> **NOT in scope:** legacy `src/components/conditioning/*` flow and `debriefService` — flagged for deprecation, untouched here.

---

## Phase 0 — Foundations (do first, unblocks everything)

**0.1 Pick the canonical engine.** Confirm legacy [src/components/conditioning/QualityAssessmentCard.jsx](../src/components/conditioning/QualityAssessmentCard.jsx) rubric and [src/services/debriefService.js](../src/services/debriefService.js) labels are deprecated. Add a deprecation note; don't change their behavior yet. (Prevents drift while we tune the new engine.)

**0.2 Bump rubric version.** In [functions/conditioning/rrConfig.js](../functions/conditioning/rrConfig.js) bump `rubricVersion` from `2026-05-09` so the history widget can mark legacy reps clearly.

**0.3 Lock in calibration baseline.** Run `node functions/conditioning/calibration/run.js` and capture today's numbers as a regression baseline.

---

## Phase 1 — Hidden Contextual Sufficiency (Boss point #2 — highest leverage)

**Goal:** internal "stakes band" that modifies coaching intensity without changing visible verdicts.

**Where:**
- [functions/conditioning/scorer.js](../functions/conditioning/scorer.js): extend scorer JSON schema to also return `stakes: "low" | "moderate" | "high"` with explicit inference cues in the system prompt (e.g. "quick appreciation/minor follow-up = low", "accountability breakdown, repeated issues, strategic, high-visibility, behavioral standards = high"). Add `stakesRationale` (1 short string, internal only).
- [functions/conditioning/engine.js](../functions/conditioning/engine.js): accept `stakes` in `evaluateRep`, persist to rep doc, pass into output selection.
- [functions/conditioning/rrConfig.js](../functions/conditioning/rrConfig.js): add `STAKES_MODIFIERS` that adjust:
  - `low` → suppress gap observation when result is pass (reinforce only); short-circuit pattern feedback unless it's a hard critical-condition pattern.
  - `moderate` → current behavior unchanged.
  - `high` → for RED, require `Request == Strong` to qualify as "strong rep"; for DRF, suppress strong-rep label if Behavior is only Adequate.
- [functions/index.js](../functions/index.js) `evaluateRep` Cloud Function: persist `stakes` to `users/{uid}/reps_light` but do **not** include it in the UI payload (keep hidden).

**Tests:** add fixtures in [functions/conditioning/calibration/fixtures.js](../functions/conditioning/calibration/fixtures.js) covering each stakes band with `expectedStakes`; assert engine respects the modifier behavior.

---

## Phase 2 — Reframe UX Labels (Boss point #3)

**Where:** [functions/conditioning/rrConfig.js](../functions/conditioning/rrConfig.js) — replace the single `SCORE_LABEL` with a per-condition label map:

```js
RR_LABELS_BY_CONDITION = {
  'DRF.Behavior':       { 3: 'Clear',    2: 'Present',  1: 'Vague', 0: 'Missing' },
  'RED.Request':        { 3: 'Clear',    2: 'Partial',  1: 'Vague', 0: 'Missing' },
  'FUW.WorkAnchored':   { 3: 'Anchored', 2: 'General',  1: 'Weak',  0: 'Missing' },
  'SCE.Expectation':    { 3: 'Defined',  2: 'Partial',  1: 'Vague', 0: 'Missing' },
  // ...extend per boss's spec for every condition
}
```

- [functions/conditioning/engine.js](../functions/conditioning/engine.js) `buildQuickRead`: use per-condition label map.
- [src/components/screens/ConditioningLight.jsx](../src/components/screens/ConditioningLight.jsx) `tierClass`: update to handle the new label set (map labels → color tier internally so the visual pill system still works).
- Keep numeric scale internal unchanged — only the labels change.

**Tests:** update [src/test/conditioning-engine.test.js](../src/test/conditioning-engine.test.js) snapshot for `buildQuickRead` per RR.

---

## Phase 3 — Three-Mode Observation Logic (Boss points #4, #5, #8)

**Goal:** observations dynamically pick **Reinforce / Sharpen / Challenge** mode, and language emphasizes *repeatability*.

**Where:**
- [functions/conditioning/templates.js](../functions/conditioning/templates.js): restructure `OBSERVATIONS` from `${rr}.${condition}.${fail|gap|strong}` to `${rr}.${condition}.${reinforce|sharpen|challenge}`. Rewrite every template using the boss's repeatability lens (e.g. replace *"Behavior was vague"* → *"The behavior isn't specific enough to easily repeat."*). Keep a `pattern.*` set still keyed by condition.
- [functions/conditioning/engine.js](../functions/conditioning/engine.js) `generateOutput`: new selector:
  - `strong` case → **reinforce**
  - `pass` w/ gap + stakes ≥ moderate → **sharpen**
  - `pass` w/ gap + stakes = low → **suppress observation** (reinforce only, no question) — implements "protect against over-coaching"
  - `fail` → **challenge**
- Unit test: low-stakes pass returns no question and a reinforce-mode observation.

---

## Phase 4 — Leadership Courage Layer for RED (Boss point #6)

**Goal:** detect retreat/softening signals during RED reps as a hidden modifier, not a visible score.

**Where:**
- [functions/conditioning/scorer.js](../functions/conditioning/scorer.js): in the RED branch of `buildUserPrompt`, add a separate `courageSignals` JSON object the model returns: `{ retreatedToDiscussion, softenedUnderTension, indirectAccountability, overCollaboration, backedOffAfterDefensiveness }` with short quote evidence.
- [functions/conditioning/engine.js](../functions/conditioning/engine.js): if `rrType === 'RED'` and ≥1 courage signal fires:
  - Force `case` to `gap` even if it would have been `strong`.
  - Pick observation from a new RED bank `RED.Courage.<signalName>` in templates.
  - Example wording: *"The conversation shifted toward discussion rather than defining a standard."*
- Persist `courageSignals` to the rep doc; do not surface numerically.

**Calibration:** add 4–5 RED fixtures explicitly demonstrating each retreat pattern.

---

## Phase 5 — Identity-Based Pattern Feedback (Boss point #7)

**Where:**
- [functions/conditioning/patternDetection.js](../functions/conditioning/patternDetection.js): keep key-based detection; remove any numeric phrasing from outputs.
- [functions/conditioning/templates.js](../functions/conditioning/templates.js): rewrite every `pattern.*` template to identity voice (*"You consistently recognize effort, but stop short of naming the repeatable behavior."*) — never numbers, never "X of Y reps."
- [src/components/screens/ConditioningLight.jsx](../src/components/screens/ConditioningLight.jsx): when `patternTriggered === true`, render the observation in a visually distinct **"Leadership tendency"** card above the standard observation (currently invisible — payload already carries the flag in [functions/index.js](../functions/index.js) `evaluateRep` return).
- [src/components/widgets/PracticeRepsHistoryWidget.jsx](../src/components/widgets/PracticeRepsHistoryWidget.jsx): show a small "tendency surfaced" chip on reps where it fired.

---

## Phase 6 — Preserve Strictness Audit (Boss point #9)

**Audit, don't loosen.** After Phase 1 stakes modifier ships, verify:
- Critical conditions in `RR_CONFIG` ([functions/conditioning/rrConfig.js](../functions/conditioning/rrConfig.js)) still fail-out regardless of stakes.
- Add explicit fixture: high-stakes RED rep with implicit request must still fail.

---

## Phase 7 — Expanded Calibration Set (Boss points #10, #11, #12)

**Where:** [functions/conditioning/calibration/fixtures.js](../functions/conditioning/calibration/fixtures.js).

Grow from ~16 → ~80 fixtures:
- **Per RR:** 5 excellent, 5 acceptable, 5 fails (gold standard, per boss).
- **Per RR:** 3–4 borderline (manager-realistic vagueness).
- **RED special:** 5 high-tension (defensive direct reports, debate traps, emotional leakage, softening, retreat to collab) — each with `expectedCourageSignals`.
- **Realism stress tests** (new file `functions/conditioning/calibration/realism.js`):
  - Rambling voice-transcript style (long, filler words)
  - Minimal (one-sentence)
  - Mixed (reinforce + redirect in same rep)
  - "Gaming the rubric" inputs (keyword-stuffed but hollow)

Every fixture must sound human — real-sounding transcripts, not textbook.

**Harness updates:** [functions/conditioning/calibration/run.js](../functions/conditioning/calibration/run.js):
- Per-band breakdown (low / moderate / high stakes agreement %).
- Courage-signal precision/recall on RED fixtures.
- Tighten exit thresholds (result agreement ≥ 95%, condition exact ≥ 85%) **after** the new fixture set is in.

---

## Phase 8 — Voice & Tone Pass (Boss point #13)

**Where:** [functions/conditioning/templates.js](../functions/conditioning/templates.js) full rewrite pass with guardrails:
- No therapy language.
- No academic framework explanations.
- Reinforce mode = 1 sentence + name the repeatable behavior.
- Sharpen mode = 1 observation + 1 specific question.
- Challenge mode = 1 sentence that names the real issue.
- Pattern observations = identity language, 1–2 sentences.

Add a lint test in [src/test/conditioning-engine.test.js](../src/test/conditioning-engine.test.js) that fails if any template:
- exceeds N words, or
- contains banned phrases (*"great job"*, *"remember to"*, *"you should try to"*, any number+condition combo).

---

## Phase 9 — Schema & Persistence

[functions/index.js](../functions/index.js) `evaluateRep` writes additional **internal** fields to `users/{uid}/reps_light`:
- `stakes`, `stakesRationale`
- `courageSignals` (RED only)
- `mode` (`reinforce | sharpen | challenge | suppressed`)
- `rubricVersion` (already present; bumped in Phase 0)

Update [src/test/conditioning-scorer.test.js](../src/test/conditioning-scorer.test.js) to assert new schema fields are validated/clamped.

---

## Phase 10 — Rollout

1. Land Phases 0–2 with no flag (low-risk, label + foundation).
2. Land Phases 3 + 4 + 5 behind `VITE_FEATURE_CONDITIONING_V2` flag in [src/providers/FeatureProvider.jsx](../src/providers/FeatureProvider.jsx); when on, `ConditioningLight.jsx` reads the new payload fields.
3. Run calibration suite; require all new thresholds to pass before flipping flag in `.env.dev`.
4. Manual QA pass: 10 live reps per RR per team member, comparing v1 vs v2 outputs.
5. Promote to test → prod via `npm run deploy:test` / `npm run deploy:prod`.

---

## Suggested Execution Order (smallest blast radius first)

| Order | Phase | Risk | Why this slot |
|---|---|---|---|
| 1 | Phase 0 | none | Baseline |
| 2 | Phase 2 (labels) | low | Pure rename, visible win |
| 3 | Phase 7 (fixtures, partial) | none | Need before tuning |
| 4 | Phase 1 (stakes) | medium | Hidden, biggest lift |
| 5 | Phase 3 (modes) | medium | Builds on stakes |
| 6 | Phase 4 (courage) | medium | RED-only scope |
| 7 | Phase 5 (identity patterns) | low | UI polish + copy |
| 8 | Phase 8 (voice) | low | Copy pass |
| 9 | Phase 6 (strictness audit) | low | Verification |
| 10 | Phase 9 + 10 (schema + rollout) | low | Wrap-up |

---

## Open Questions / Decisions Needed Before Build

1. **Legacy deprecation:** confirm `src/components/conditioning/*` and `debriefService` can be sunset, or do they stay parallel? (Affects whether we duplicate label changes.)
2. **Stakes inference owner:** AI-inferred only, or do we also let the user tag stakes when submitting a rep? (Pure AI is faster to ship; user tag is more accurate.)
3. **Cost budget for self-consistency:** Phase 1+4 expand the scorer JSON schema. Do we raise `samples` from 1 → 3 for RED reps only (3× cost on RED) to stabilize courage-signal detection?
4. **Label rollout:** ship Phase 2 labels immediately (no flag) or behind v2 flag with the rest? Boss's spec implies these are the new defaults.
5. **Pattern UI surface:** should "Leadership tendency" appear inline on the rep result *and* on the history widget, or only one? (Recommend both — see Phase 5.)
