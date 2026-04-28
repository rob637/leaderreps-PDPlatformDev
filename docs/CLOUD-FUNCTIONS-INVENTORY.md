# Cloud Functions Inventory

Captured during Revamp pre-flight audit (2026-04-28). Source: `functions/index.js`.

## Critical functions touching legacy domains (⚠️)

| Function | Trigger | Domain | Action for Revamp |
|---|---|---|---|
| `onCoachingRegistrationEvent` | Firestore `coaching_registrations/{id}` | Coaching | **Keep running.** Build parallel `onEventRegistration` for new `events` collection. |
| `onCoachingCancellationEvent` | Firestore `coaching_registrations/{id}` (status→cancelled) | Coaching | **Keep running.** Same pattern: parallel handler on new collection. |
| `onCommunityRegistrationEvent` | Firestore `community_registrations/{id}` | Community | **Keep running.** Same pattern. |
| `onCommunityCancellationEvent` | Firestore `community_registrations/{id}` (status→cancelled) | Community | **Keep running.** Same pattern. |
| `scheduledCoachingReminders` | Schedule: every 1 hour | Coaching | **Extend** to also query the new `events` collection. Single function reading both is cheaper than two. |
| `assessRepQuality` | Callable | Conditioning | **Replace** with new `evaluateRep` callable for Light. Old function stays callable for legacy data reads. |
| `manualRollover` / `scheduledDailyRollover` | HTTP / Schedule 11:59 PM | Daily Practice (touches active commitments) | **Verify** rollover doesn't reference removed entities. Audit found it touches `modules/{userId}/daily_practice` — not `coaching_sessions` directly. **Likely safe.** |

## Non-critical functions (no changes needed)

`validateInvitation`, `acceptInvitation`, `sendInvitationEmail`, `sendMilestoneCompletionEmail`, `geminiProxy`, `debugUser`, `scheduledDailyNotifications`, `sendTestNotification`, `sendTestEmailSms`, `sendTestEmailSmsHttp`, `scheduledFollowUpReminders`, `scheduledNotificationCheck`, `apolloSearchProxy`.

## New functions to build for Revamp

| Function | Trigger | Workstream |
|---|---|---|
| `onEventRegistration` | Firestore `events/{id}/registrations/{rid}` | WS-2 |
| `onEventCancellation` | Firestore `events/{id}/registrations/{rid}` (status→cancelled) | WS-2 |
| `evaluateRep` | Callable | WS-3 |
| `sendSms` | Callable | WS-5 |
| `verifyPhone` | Callable | WS-5 |
| `onCoachQuestionCreated` | Firestore `coach_questions/{id}` | WS-4 |
| `onCoachResponseCreated` | Firestore `coach_questions/{id}/responses/{rid}` | WS-4 |

## Daily Plan Coupling — VERIFIED CLEAN

`useDailyPlan.js`, `dailyLogService.js`, `dataUtils.js`, `unifiedContentService.js`, `createAppServices.js` do **not** query `coaching_*`, `community_*`, or `conditioning_*` collections directly. **No daily-plan refactor needed for the revamp.**

## Sub-app Firebase boundaries

| Sub-app | Firebase project | Action |
|---|---|---|
| Reppy | Env-driven (`VITE_FIREBASE_PROJECT_ID`) | Confirm with Ryan whether reppy-test points at main test project. No code changes needed either way. |
| Corporate | Shared with main app | Static site, no data writes. Safe. |
| PassCPA | Separate (`cpa-review-dev`) | Independent. No coordination needed. |
| Accountability-Assessment | No firebase.js detected | Has its own SMS opt-in calling `submitSmsOptIn`. Defer unification per §11 of REVAMP-PLAN. |

## Drift indicator

`scheduledFirestoreBackup` is referenced in `functions/index.js` header comment but not exported. Cleanup (low priority).
