# Conversation Simulator — LeaderReps Lab

> **Status:** Internal prototype. Admin-only. Dev environment only.

Voice-first leadership rehearsal. Talk to a simulated direct report and get a
live transcript + latency/cost metrics. Phase 0 latency spike — decides go/no-go
on building the full simulator (rubric scoring, multiple personas, share links).

## Auth model

- Browser signs in with Firebase Auth (Google).
- App calls the `mintSimulatorToken` Cloud Function.
- Function checks the caller's email against `metadata/config.adminemails` and
  returns a short-lived (10-minute) ephemeral Gemini Live token.
- The browser connects to Gemini Live directly with that token. The long-lived
  `GEMINI_API_KEY` never leaves Secret Manager.

If `metadata/config.adminemails` doesn't include your email, the app shows
"Admin access required" after sign-in.

## Run locally

```bash
cd conversation-simulator
cp .env.example .env
# Fill in the dev Firebase config (same VITE_FIREBASE_* values used by the
# main PD Platform app for the dev project).
npm install
npm run dev
```

Open `http://localhost:5180`, sign in with an admin Google account, click
**Start conversation**, grant mic permission, and talk.

### Local-dev shortcut (no Firebase)

If you don't have the Firebase config handy, you can run the original Phase 0
mode by setting `VITE_GEMINI_API_KEY` in `.env`. The app will skip auth and use
that key directly. Do **not** deploy with that key set.

## Deploy

```bash
npm run deploy:simulator:dev
```

Builds `conversation-simulator/dist`, deploys to the
`leaderreps-conversation-simulator` Hosting site, and redeploys the
`mintSimulatorToken` function. URL:
<https://leaderreps-conversation-simulator.web.app>

The deploy script will refuse to run without `conversation-simulator/.env`.

## Kill criteria (the point of the spike)

| Metric | Pass | Kill |
| --- | --- | --- |
| Avg round-trip (TTFB after user turn ends) | ≤ 1200 ms | > 1200 ms sustained |
| Estimated cost per minute | ≤ $0.50 | > $0.50 sustained |
| Barge-in feels natural | Yes | Persona talks over you |
| Persona stays in character | Yes | Breaks on first push |

If any of these trip, swap providers (likely OpenAI Realtime) before Phase 1.
The audio pipeline in `src/lib/audio.js` is provider-agnostic; only
`src/lib/geminiLive.js` is Gemini-specific.

## Architecture

```
Browser
 ├─ Firebase Auth (Google) ───────► mintSimulatorToken (Cloud Fn)
 │                                      │ admin gate → Secret Manager
 │                                      ▼
 │                              ephemeral token (10 min, 1 use)
 ├─ AudioWorklet (public/pcm-processor.js)
 │     Float32 mic → PCM16 LE @ 16kHz → 100ms chunks
 ├─ src/lib/audio.js
 │     Mic capture + PCM16 @ 24kHz playback queue + barge-in flush
 ├─ src/lib/geminiLive.js
 │     @google/genai Live session, persona = system prompt
 └─ src/SpikePage.jsx
       UI, transcript, metrics
```

## What's NOT in this prototype (yet)

- Scorecard / rubric (Phase 3)
- Multiple personas (Phase 1 — one prompt today)
- Persistence / share links (Phase 4)
- Avatar / video
- Mobile support
- Public access

## Files of interest

- `src/lib/scenarios.js` — Jamie persona prompt (this is the IP; iterate here)
- `src/lib/geminiLive.js` — the only provider-specific file
- `functions/index.js` → `mintSimulatorToken` — the auth gate

## Cost ballpark

Gemini 2.0 Flash Live: ~$0.0001/s audio input, ~$0.0004/s output. A 5-minute
call is roughly $0.10–0.15. Live estimate in the Spike Metrics panel.
