# Cloud Functions Inventory

Captured during Revamp pre-flight audit (2026-04-28). Source: [functions/index.js](../functions/index.js).
**Updated 2026-04-28** post-WS-5 to reflect what's now built and shipped on `Revamp` branch.

**Total exports:** 109. **Touched by revamp:** 7. **Adjacent (must not regress):** 6. **Out of scope:** 96.

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
| `scheduledNotificationCheck` | Schedule (every 15 min) | Notifications | **Modified in WS-5** to honor the Locker SMS toggle. Now reads `profile.notifications.sms` + `profile.phoneVerified` + `profile.phone` (with fallback to legacy `notificationSettings.phoneNumber`). |

## Non-critical functions (no changes needed)

`validateInvitation`, `acceptInvitation`, `sendInvitationEmail`, `sendMilestoneCompletionEmail`, `geminiProxy`, `debugUser`, `scheduledDailyNotifications`, `sendTestNotification`, `sendTestEmailSms`, `sendTestEmailSmsHttp`, `scheduledFollowUpReminders`, `apolloSearchProxy`.

## New functions to build for Revamp

| Function | Trigger | Workstream | Status |
|---|---|---|---|
| `onEventRegistration` | Firestore `events/{id}/registrations/{rid}` | WS-2 | **Deferred.** Events screen is a read-side aggregator over `coaching_registrations` + `community_registrations`; existing legacy triggers handle ICS/email. Revisit if/when WS-2 migrates writes onto a unified `events` collection. |
| `onEventCancellation` | Firestore `events/{id}/registrations/{rid}` (status→cancelled) | WS-2 | **Deferred.** Same reason as above. |
| `evaluateRep` | Callable | WS-3 | ✅ **Shipped** ([functions/index.js#L1954](../functions/index.js#L1954)). |
| `sendPhoneVerification` (was: `sendSms`) | Callable | WS-5 | ✅ **Shipped** ([functions/index.js#L23596](../functions/index.js#L23596)). |
| `verifyPhoneCode` (was: `verifyPhone`) | Callable | WS-5 | ✅ **Shipped** ([functions/index.js#L23648](../functions/index.js#L23648)). |
| `onCoachQuestionCreated` | Firestore `coach_questions/{id}` | WS-4 | ✅ **Shipped** ([functions/index.js#L9365](../functions/index.js#L9365)). |
| `onCoachResponseCreated` | Firestore `coach_questions/{id}/responses/{rid}` | WS-4 | **Not built.** Spec collapsed to single-doc model: response fields (`responseText`, `responseVideoUrl`, `respondedBy`, `respondedAt`) live on the parent doc. No subcollection trigger needed. Reopen if/when moderation tooling demands a separate response collection. |

## Daily Plan Coupling — VERIFIED CLEAN

`useDailyPlan.js`, `dailyLogService.js`, `dataUtils.js`, `unifiedContentService.js`, `createAppServices.js` do **not** query `coaching_*`, `community_*`, or `conditioning_*` collections directly. **No daily-plan refactor needed for the revamp.**

## Sub-app Firebase boundaries

| Sub-app | Firebase project | Action |
|---|---|---|
| Reppy | **Same project** as main app (`leaderreps-pd-platform` per [reppy/.env](../reppy/.env), env-overridable via `VITE_FIREBASE_PROJECT_ID`). Uses `reppy_*` prefixed collections (`reppy_users`, `reppy_invitations`, `reppy_config`) with dedicated rules in [firestore.rules](../firestore.rules) lines 107–120. **No collision with revamp.** No code changes needed. Document this with Ryan but no action required for cutover. |
| Corporate | Shared with main app | Static site, no data writes. Safe. |
| PassCPA | Separate (`cpa-review-dev`) | Independent. No coordination needed. |
| Accountability-Assessment | No firebase.js detected | Has its own SMS opt-in calling `submitSmsOptIn`. Defer unification per §11 of REVAMP-PLAN. |

## Drift indicator

~~`scheduledFirestoreBackup` is referenced in `functions/index.js` header comment but not exported.~~
**Resolved.** `scheduledFirestoreBackup` is now exported at [functions/index.js#L9451](../functions/index.js#L9451).
