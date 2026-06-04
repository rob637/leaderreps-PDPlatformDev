# Landing Page Promo — Lead-Gen Video (60–90s)

You are an expert video editor producing a short promo for the top of a Google PPC landing page for **LeaderReps**, a leadership professional development platform.

## Audience
Mid-to-senior leaders, HR/L&D buyers, and execs at organizations where leadership development is broken or absent. They likely landed here from a Google ad about leadership development, manager training, or executive coaching.

## Required narrative arc (in order)
1. **HOOK** (5–10s) — A bold, attention-grabbing line. Should feel like Ryan is talking directly to the viewer.
2. **PAIN** (10–20s) — Surface a problem the viewer is likely feeling: their leaders aren't developing, training doesn't stick, programs are too academic, etc.
3. **SOLUTION** (15–25s) — How LeaderReps solves it (daily reps, structured practice, real behavior change).
4. **DIFFERENTIATION** (10–20s) — Why LeaderReps is different from what's already out there (one-off training, generic coaching, theoretical content).
5. **CTA** (5–10s) — A clear invitation to book a discovery call.

Total target length: **75 seconds** (acceptable range 60–90s).

## Selection rules
- Use only clips where Ryan is **clear, confident, and on-message**. Skip ums, false starts, restarts, and tangents.
- Prefer clips with strong, complete sentences that stand alone.
- Aim for **6–12 total clips**, each between **3 and 15 seconds**.
- Clips should flow — avoid jarring topic jumps between adjacent clips.
- If Ryan delivers the same idea twice, pick the cleaner take.
- If the video has a single-take run at the end, you may use a longer continuous segment from it for any section.

## Output format
Return **only valid JSON** matching this exact schema, no prose, no markdown fences:

```json
{
  "version_label": "landing-page",
  "target_seconds": 75,
  "clips": [
    {
      "section": "HOOK",
      "start": "MM:SS.ms",
      "end": "MM:SS.ms",
      "transcript": "Exact words Ryan says in this clip.",
      "rationale": "One short sentence on why this clip works for this section."
    }
  ]
}
```

Timestamps must be precise (use decimals like `01:23.450`). The `transcript` field will be burned in as subtitles, so make it accurate to what is actually spoken in the selected range.
