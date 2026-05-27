// src/components/admin/NudgeLeadMagnet.jsx
//
// Constructive Nudges composer — the in-platform tool a logged-in user uses
// to send an anonymous-but-traceable constructive nudge to a manager / peer.
//
// Flow:
//   1. Pick recipient (name + email)
//   2. Select 1–3 boss-issue patterns from the catalog
//   3. Auto-populated improvement suggestions + suggested Reps appear and can
//      be edited/removed before sending
//   4. Free-text "your note" (max 800 chars) — required, AI-moderated
//   5. "Run safety check" → moderateNudge HTTP endpoint
//   6. "Send anonymously" → sendNudge httpsCallable (requires auth)
//
// Backend:
//   - HTTP:     moderateNudge   (functions/index.js)
//   - callable: sendNudge       (functions/index.js)
//   - Firestore: nudges_messages/{id}

import React, { useEffect, useMemo, useState } from 'react';
import {
  Send,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  RefreshCw,
  Loader2,
  History,
  Mail,
  User as UserIcon,
  Check,
  Plus,
  Lightbulb,
  Target,
  Info,
} from 'lucide-react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAppServices } from '../../services/useAppServices';
import {
  NUDGE_ISSUES,
  NUDGE_CATEGORIES,
  NUDGE_ISSUES_BY_ID,
  NUDGE_MAX_SELECTED,
  NUDGE_MAX_CONTEXT_CHARS,
} from '../../data/nudgeCatalog';

const PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const MODERATE_URL = `https://us-central1-${PROJECT_ID}.cloudfunctions.net/moderateNudge`;

const DECISION_STYLES = {
  accept: {
    icon: ShieldCheck,
    label: 'Cleared to send',
    badge:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    border: 'border-emerald-300 dark:border-emerald-700',
    bar: 'bg-emerald-500',
  },
  rewrite: {
    icon: ShieldAlert,
    label: 'Suggested rewrite',
    badge:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    border: 'border-amber-300 dark:border-amber-700',
    bar: 'bg-amber-500',
  },
  reject: {
    icon: ShieldX,
    label: 'Blocked',
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
    border: 'border-rose-300 dark:border-rose-700',
    bar: 'bg-rose-500',
  },
};

const TONE_LABEL = {
  constructive: 'Constructive',
  neutral: 'Neutral',
  heated: 'Heated',
  attacking: 'Attacking',
};

function classNames(...xs) {
  return xs.filter(Boolean).join(' ');
}

async function callModerate(text, signal) {
  const res = await fetch(MODERATE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
    signal,
  });
  let body = null;
  try {
    body = await res.json();
  } catch {
    /* noop */
  }
  if (!res.ok || !body?.success) {
    const msg = body?.error || `Moderation failed (HTTP ${res.status})`;
    const err = new Error(msg);
    err.code = body?.code || 'http';
    throw err;
  }
  return body;
}

const NudgeLeadMagnet = () => {
  const { db, user } = useAppServices();

  // ── Recipient ──────────────────────────────────────────────────
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');

  // ── Issue picker (catalog ids) ─────────────────────────────────
  const [selectedIssueIds, setSelectedIssueIds] = useState([]);
  const [activeCategory, setActiveCategory] = useState(NUDGE_CATEGORIES[0].id);

  // Derived: improvements + reps pulled in from selected issues.
  // User can toggle individual items off via excludedSuggestions / excludedReps.
  const [excludedSuggestions, setExcludedSuggestions] = useState(new Set());
  const [excludedReps, setExcludedReps] = useState(new Set());

  // ── Note (the actual nudge text) ───────────────────────────────
  const [message, setMessage] = useState('');

  // ── Moderation + send state ────────────────────────────────────
  const [moderation, setModeration] = useState(null);
  const [moderating, setModerating] = useState(false);
  const [moderationError, setModerationError] = useState(null);

  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);
  const [sendError, setSendError] = useState(null);

  // ── Recent nudges (this user) ──────────────────────────────────
  const [recent, setRecent] = useState([]);

  // ── Derived values ─────────────────────────────────────────────
  const selectedIssues = useMemo(
    () =>
      selectedIssueIds
        .map((id) => NUDGE_ISSUES_BY_ID[id])
        .filter(Boolean),
    [selectedIssueIds]
  );

  const suggestionPool = useMemo(() => {
    const out = [];
    const seen = new Set();
    selectedIssues.forEach((iss) => {
      (iss.improvements || []).forEach((s) => {
        if (!seen.has(s)) {
          seen.add(s);
          out.push(s);
        }
      });
    });
    return out;
  }, [selectedIssues]);

  const repPool = useMemo(() => {
    const out = [];
    const seen = new Set();
    selectedIssues.forEach((iss) => {
      (iss.suggestedReps || []).forEach((r) => {
        if (!seen.has(r)) {
          seen.add(r);
          out.push(r);
        }
      });
    });
    return out;
  }, [selectedIssues]);

  const activeSuggestions = useMemo(
    () => suggestionPool.filter((s) => !excludedSuggestions.has(s)),
    [suggestionPool, excludedSuggestions]
  );
  const activeReps = useMemo(
    () => repPool.filter((r) => !excludedReps.has(r)),
    [repPool, excludedReps]
  );

  // ── Effects ────────────────────────────────────────────────────

  // Reset stale moderation when message changes
  useEffect(() => {
    if (moderation) {
      setModeration(null);
      setModerationError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message]);

  // Subscribe to this user's recent nudges
  useEffect(() => {
    if (!db || !user?.uid) return undefined;
    try {
      const q = query(
        collection(db, 'nudges_messages'),
        where('senderUid', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      const unsub = onSnapshot(
        q,
        (snap) => {
          setRecent(
            snap.docs.map((d) => ({ id: d.id, ...d.data() }))
          );
        },
        () => {
          // Permission errors are fine — leave recent empty.
        }
      );
      return () => unsub();
    } catch {
      return undefined;
    }
  }, [db, user?.uid]);

  // ── Handlers ───────────────────────────────────────────────────
  const toggleIssue = (id) => {
    setSelectedIssueIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      }
      if (prev.length >= NUDGE_MAX_SELECTED) return prev;
      return [...prev, id];
    });
  };

  const toggleExcluded = (set, setter, value) => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  };

  const handleModerate = async () => {
    setModerating(true);
    setModerationError(null);
    setModeration(null);
    try {
      const result = await callModerate(message.trim());
      setModeration(result);
    } catch (err) {
      setModerationError(err.message || 'Moderation failed');
    } finally {
      setModerating(false);
    }
  };

  const handleUseRewrite = () => {
    if (moderation?.rewritten) {
      setMessage(moderation.rewritten);
      // Clear moderation so user has to re-run the check on the new text.
      setModeration(null);
    }
  };

  const handleSend = async () => {
    setSending(true);
    setSendError(null);
    setSendResult(null);
    try {
      const functions = getFunctions();
      const sendNudge = httpsCallable(functions, 'sendNudge');
      const res = await sendNudge({
        recipientName: recipientName.trim(),
        recipientEmail: recipientEmail.trim(),
        message: message.trim(),
        selectedIssueIds,
        selectedIssueLabels: selectedIssues.map((i) => i.label),
        suggestions: activeSuggestions,
        reps: activeReps,
      });
      const data = res?.data || {};
      if (!data.success) {
        setSendError(
          data.reason ||
            'The safety check blocked this nudge. Please revise and try again.'
        );
        setModeration({
          decision: 'reject',
          reason: data.reason || 'Blocked',
          concerns: data.concerns || [],
          rewritten: '',
          deAnonymizationRisk: 'unknown',
          tone: 'unknown',
        });
      } else {
        setSendResult(data);
        // Clear the form on success
        setMessage('');
        setSelectedIssueIds([]);
        setExcludedSuggestions(new Set());
        setExcludedReps(new Set());
        setModeration(null);
      }
    } catch (err) {
      setSendError(
        err?.message || 'Send failed. Please try again in a moment.'
      );
    } finally {
      setSending(false);
    }
  };

  // ── Validation gates ───────────────────────────────────────────
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail.trim());
  const canModerate =
    message.trim().length >= 10 &&
    message.trim().length <= NUDGE_MAX_CONTEXT_CHARS &&
    !moderating;
  const canSend =
    !!user?.uid &&
    recipientName.trim().length > 0 &&
    isValidEmail &&
    selectedIssueIds.length > 0 &&
    message.trim().length >= 10 &&
    message.trim().length <= NUDGE_MAX_CONTEXT_CHARS &&
    moderation &&
    moderation.decision !== 'reject' &&
    !sending;

  const decisionStyle =
    moderation && DECISION_STYLES[moderation.decision]
      ? DECISION_STYLES[moderation.decision]
      : null;

  const charCount = message.length;
  const charOver = charCount > NUDGE_MAX_CONTEXT_CHARS;

  // Categorize issues for the picker
  const issuesByCategory = useMemo(() => {
    const map = {};
    NUDGE_ISSUES.forEach((i) => {
      if (!map[i.category]) map[i.category] = [];
      map[i.category].push(i);
    });
    return map;
  }, []);

  return (
    <div className="space-y-6">
      {/* Intro / how it works */}
      <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4 text-sm text-amber-900 dark:text-amber-200">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="font-semibold">
              How Constructive Nudges work
            </p>
            <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
              You stay anonymous to your recipient, but the nudge is sent by
              LeaderReps and logged for safety. Every message is reviewed by AI
              for tone — attacks, accusations, or identifying details get
              blocked before they ever reach anyone. The goal is feedback your
              manager can actually act on.
            </p>
          </div>
        </div>
      </div>

      {/* Compose card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-card p-5 sm:p-6 space-y-5">
        {/* Recipient */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide mb-1.5">
              <UserIcon className="w-3.5 h-3.5 inline mr-1" />
              Their first name
            </label>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Alex"
              maxLength={80}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-corporate-teal"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide mb-1.5">
              <Mail className="w-3.5 h-3.5 inline mr-1" />
              Their email
            </label>
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="alex@company.com"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-corporate-teal"
            />
          </div>
        </div>

        {/* Issue picker */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
              <Target className="w-3.5 h-3.5 inline mr-1" />
              What would you like them to lean into?
            </label>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {selectedIssueIds.length} / {NUDGE_MAX_SELECTED} selected
            </span>
          </div>

          {/* Category tabs */}
          <div className="flex flex-wrap gap-1.5 mb-3 border-b border-slate-200 dark:border-slate-700 pb-2">
            {NUDGE_CATEGORIES.map((cat) => {
              const count = (issuesByCategory[cat.id] || []).length;
              if (!count) return null;
              const selectedHere = selectedIssueIds.filter((id) =>
                (issuesByCategory[cat.id] || []).some((i) => i.id === id)
              ).length;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={classNames(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    activeCategory === cat.id
                      ? 'bg-corporate-navy text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  )}
                >
                  {cat.label}
                  {selectedHere > 0 && (
                    <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-corporate-teal text-white text-[10px] font-bold">
                      {selectedHere}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Issue cards in active category */}
          <div className="grid sm:grid-cols-2 gap-2">
            {(issuesByCategory[activeCategory] || []).map((iss) => {
              const selected = selectedIssueIds.includes(iss.id);
              const disabled =
                !selected && selectedIssueIds.length >= NUDGE_MAX_SELECTED;
              return (
                <button
                  key={iss.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => toggleIssue(iss.id)}
                  className={classNames(
                    'text-left rounded-lg border px-3 py-2.5 transition-all',
                    selected
                      ? 'border-corporate-teal bg-corporate-teal/10 ring-2 ring-corporate-teal/30'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600',
                    disabled && 'opacity-40 cursor-not-allowed'
                  )}
                >
                  <div className="flex items-start gap-2">
                    <div
                      className={classNames(
                        'mt-0.5 w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center',
                        selected
                          ? 'bg-corporate-teal border-corporate-teal'
                          : 'border-slate-300 dark:border-slate-600'
                      )}
                    >
                      {selected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-snug">
                      {iss.label}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Suggested improvements (auto from picked issues) */}
        {suggestionPool.length > 0 && (
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                <Lightbulb className="w-3.5 h-3.5 inline mr-1" />
                Suggestions to include in the email
              </h4>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {activeSuggestions.length} of {suggestionPool.length} included
              </span>
            </div>
            <ul className="space-y-1.5">
              {suggestionPool.map((s) => {
                const excluded = excludedSuggestions.has(s);
                return (
                  <li
                    key={s}
                    className={classNames(
                      'flex items-start gap-2 text-sm',
                      excluded
                        ? 'text-slate-400 dark:text-slate-500 line-through'
                        : 'text-slate-700 dark:text-slate-200'
                    )}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        toggleExcluded(
                          excludedSuggestions,
                          setExcludedSuggestions,
                          s
                        )
                      }
                      className={classNames(
                        'mt-0.5 w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors',
                        excluded
                          ? 'border-slate-300 dark:border-slate-600 bg-transparent'
                          : 'border-corporate-teal bg-corporate-teal'
                      )}
                      aria-label={excluded ? 'Include' : 'Remove'}
                    >
                      {excluded ? (
                        <Plus className="w-3 h-3 text-slate-400" />
                      ) : (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </button>
                    <span className="leading-snug">{s}</span>
                  </li>
                );
              })}
            </ul>

            {repPool.length > 0 && (
              <>
                <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide mt-4 mb-2">
                  <Sparkles className="w-3.5 h-3.5 inline mr-1" />
                  Suggested Reps to link in the email
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {repPool.map((r) => {
                    const excluded = excludedReps.has(r);
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() =>
                          toggleExcluded(excludedReps, setExcludedReps, r)
                        }
                        className={classNames(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                          excluded
                            ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 line-through'
                            : 'bg-corporate-navy text-white hover:bg-corporate-navy/90'
                        )}
                      >
                        {excluded ? (
                          <Plus className="w-3 h-3" />
                        ) : (
                          <Check className="w-3 h-3" />
                        )}
                        {r}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* Message */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
              Your note
            </label>
            <span
              className={classNames(
                'text-xs',
                charOver
                  ? 'text-rose-600 dark:text-rose-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400'
              )}
            >
              {charCount} / {NUDGE_MAX_CONTEXT_CHARS}
            </span>
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Be specific about the BEHAVIOR you'd like to see change — not the person. E.g.: 'In status meetings, decisions sometimes get changed a day later without context. It would help the team move faster if changes were briefly explained when they happen.'"
            rows={5}
            className={classNames(
              'w-full rounded-lg border bg-white dark:bg-slate-800 px-3 py-2 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-corporate-teal resize-y',
              charOver
                ? 'border-rose-400 dark:border-rose-600'
                : 'border-slate-300 dark:border-slate-600'
            )}
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            Tip: Stick to specific behaviors. Avoid names, dates, or anything
            that would unmask you. The AI will block attacks, accusations, or
            identifying details.
          </p>
        </div>

        {/* Action row */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
          <button
            type="button"
            disabled={!canModerate}
            onClick={handleModerate}
            className={classNames(
              'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors',
              canModerate
                ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 hover:bg-slate-300 dark:hover:bg-slate-600'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
            )}
          >
            {moderating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            {moderating ? 'Checking…' : 'Run safety check'}
          </button>

          <button
            type="button"
            disabled={!canSend}
            onClick={handleSend}
            className={classNames(
              'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors',
              canSend
                ? 'bg-corporate-teal text-white hover:bg-corporate-teal/90'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
            )}
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {sending ? 'Sending…' : 'Send anonymously'}
          </button>

          {!moderation && !moderating && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Run the safety check before sending.
            </span>
          )}
        </div>

        {/* Moderation result */}
        {moderationError && (
          <div className="rounded-xl border border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/30 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
            {moderationError}
          </div>
        )}

        {moderation && decisionStyle && (
          <div
            className={classNames(
              'rounded-xl border bg-white dark:bg-slate-900 overflow-hidden',
              decisionStyle.border
            )}
          >
            <div className={classNames('h-1 w-full', decisionStyle.bar)} />
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={classNames(
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold',
                    decisionStyle.badge
                  )}
                >
                  <decisionStyle.icon className="w-3.5 h-3.5" />
                  {decisionStyle.label}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Tone:{' '}
                  <span className="font-medium text-slate-700 dark:text-slate-200">
                    {TONE_LABEL[moderation.tone] || moderation.tone || '—'}
                  </span>
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Anonymity risk:{' '}
                  <span className="font-medium text-slate-700 dark:text-slate-200">
                    {moderation.deAnonymizationRisk || '—'}
                  </span>
                </span>
                {moderation.provider && (
                  <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto">
                    {moderation.provider}
                    {moderation.model ? ` · ${moderation.model}` : ''}
                  </span>
                )}
              </div>

              {moderation.reason && (
                <p className="text-sm text-slate-700 dark:text-slate-200">
                  {moderation.reason}
                </p>
              )}

              {moderation.concerns && moderation.concerns.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {moderation.concerns.map((c) => (
                    <span
                      key={c}
                      className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-300"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              )}

              {moderation.decision === 'rewrite' && moderation.rewritten && (
                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 space-y-2">
                  <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wide">
                    Suggested rewrite
                  </p>
                  <p className="text-sm text-slate-800 dark:text-slate-100 whitespace-pre-wrap">
                    {moderation.rewritten}
                  </p>
                  <button
                    type="button"
                    onClick={handleUseRewrite}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:underline"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Use this rewrite
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Send result */}
        {sendResult?.success && (
          <div className="rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200">
            <div className="flex items-center gap-2 font-semibold mb-1">
              <Check className="w-4 h-4" />
              Nudge sent anonymously
            </div>
            <p className="text-xs">
              Email delivered:{' '}
              {sendResult.emailDelivered ? 'yes' : 'queued (delivery pending)'}.
              They&rsquo;ll never see who sent it.
            </p>
          </div>
        )}
        {sendError && (
          <div className="rounded-xl border border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/30 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
            {sendError}
          </div>
        )}
      </div>

      {/* Recent nudges */}
      {recent.length > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-card p-5">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100 mb-3">
            <History className="w-4 h-4" />
            Your recent nudges
          </h3>
          <ul className="divide-y divide-slate-200 dark:divide-slate-700">
            {recent.map((r) => {
              const decision = r.moderation?.decision || 'unknown';
              const ds = DECISION_STYLES[decision];
              return (
                <li key={r.id} className="py-3 flex items-start gap-3">
                  <span
                    className={classNames(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0',
                      ds
                        ? ds.badge
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                    )}
                  >
                    {ds && <ds.icon className="w-3 h-3" />}
                    {decision}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800 dark:text-slate-200 truncate">
                      To <span className="font-semibold">{r.recipientName}</span>{' '}
                      <span className="text-slate-400 dark:text-slate-500">
                        · {r.selectedIssueLabels?.[0] || 'general'}
                        {r.selectedIssueLabels?.length > 1 &&
                          ` +${r.selectedIssueLabels.length - 1}`}
                      </span>
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {r.message}
                    </p>
                  </div>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 flex-shrink-0">
                    {r.emailDelivered ? 'sent' : r.status || '—'}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default NudgeLeadMagnet;
