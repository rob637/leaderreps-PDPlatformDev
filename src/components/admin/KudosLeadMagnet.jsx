// src/components/admin/KudosLeadMagnet.jsx
//
// Kudos Lead Magnet — anonymous-feeling kudos sent from "the team at LeaderReps"
// to a prospect. Captures the prospect's email as a warm lead, AI-moderates
// the message before send, and logs every send to Firestore for follow-up.
//
// Backend dependency:
//   - Cloud Function: moderateKudos  (functions/index.js)
//   - Firestore collection: kudos_leads/{kudosId}
//
// Email delivery is intentionally stubbed for v1 — the salesperson can copy
// the moderated message and send it from their normal channel. Wire a real
// Trigger Email / SendGrid integration in v2.

import React, { useEffect, useMemo, useState } from 'react';
import {
  Heart, Send, Sparkles, ShieldCheck, ShieldAlert, ShieldX, RefreshCw,
  Copy, Check, Loader2, History, Mail, User as UserIcon, Building2,
} from 'lucide-react';
import {
  collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp,
} from 'firebase/firestore';
import { useAppServices } from '../../services/useAppServices';

const PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const MODERATE_URL = `https://us-central1-${PROJECT_ID}.cloudfunctions.net/moderateKudos`;
const MAX_LEN = 1500;

const DECISION_STYLES = {
  accept: {
    icon: ShieldCheck,
    label: 'Accepted',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    border: 'border-emerald-300 dark:border-emerald-700',
    bar: 'bg-emerald-500',
  },
  rewrite: {
    icon: ShieldAlert,
    label: 'Rewritten',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    border: 'border-amber-300 dark:border-amber-700',
    bar: 'bg-amber-500',
  },
  reject: {
    icon: ShieldX,
    label: 'Rejected',
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
    border: 'border-rose-300 dark:border-rose-700',
    bar: 'bg-rose-500',
  },
};

const RISK_STYLES = {
  none: 'text-slate-500 dark:text-slate-400',
  low: 'text-emerald-600 dark:text-emerald-400',
  medium: 'text-amber-600 dark:text-amber-400',
  high: 'text-rose-600 dark:text-rose-400',
};

const SAMPLES = [
  {
    label: 'Quiet impact',
    text:
      'You make hard things look easy and you never make anyone feel small for not getting it the first time. That is rare.',
  },
  {
    label: 'Calm under pressure',
    text:
      "You're one of the calmest people I know. I think about how you handle stress when I'm losing mine. Thank you for being you.",
  },
  {
    label: 'They make people better',
    text:
      'Quietly: you make the people around you better. You probably do not hear it enough.',
  },
];

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
  try { body = await res.json(); } catch { /* noop */ }
  if (!res.ok || !body?.success) {
    const msg = body?.error || `Moderation failed (HTTP ${res.status})`;
    const err = new Error(msg);
    err.code = body?.code || 'http';
    throw err;
  }
  return body;
}

const KudosLeadMagnet = () => {
  const { db, user, isAdmin } = useAppServices();

  // Compose form state
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [company, setCompany] = useState('');
  const [message, setMessage] = useState('');

  // Moderation state
  const [moderation, setModeration] = useState(null); // { decision, reason, rewritten, concerns, deAnonymizationRisk, sentiment, provider, model }
  const [moderating, setModerating] = useState(false);
  const [moderationError, setModerationError] = useState(null);

  // Send state
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null); // { kudosId, message }
  const [sendError, setSendError] = useState(null);

  // Copy feedback
  const [copied, setCopied] = useState(false);

  // History
  const [recent, setRecent] = useState([]);
  const [totalShown, setTotalShown] = useState(0);

  // Subscribe to recent kudos for this admin (last 10)
  useEffect(() => {
    if (!db || !isAdmin) return undefined;
    const q = query(
      collection(db, 'kudos_leads'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setRecent(rows);
        setTotalShown(rows.length);
      },
      (err) => {
        // Non-fatal — recent list is informational.
        // eslint-disable-next-line no-console
        console.warn('kudos_leads subscription error:', err);
      }
    );
    return () => unsub();
  }, [db, isAdmin]);

  const charsLeft = MAX_LEN - message.length;
  const tooLong = charsLeft < 0;
  const canModerate =
    !moderating && message.trim().length > 0 && !tooLong;

  const finalText = useMemo(() => {
    if (!moderation) return '';
    if (moderation.decision === 'reject') return '';
    return moderation.rewritten || '';
  }, [moderation]);

  const canSend =
    !sending &&
    moderation &&
    moderation.decision !== 'reject' &&
    recipientEmail.trim().length > 0 &&
    /\S+@\S+\.\S+/.test(recipientEmail) &&
    finalText.length > 0;

  const reset = (clearForm = false) => {
    setModeration(null);
    setModerationError(null);
    setSendResult(null);
    setSendError(null);
    setCopied(false);
    if (clearForm) {
      setRecipientName('');
      setRecipientEmail('');
      setCompany('');
      setMessage('');
    }
  };

  const handleModerate = async () => {
    if (!canModerate) return;
    setModerating(true);
    setModerationError(null);
    setModeration(null);
    setSendResult(null);
    setSendError(null);
    try {
      const result = await callModerate(message.trim());
      setModeration(result);
    } catch (err) {
      setModerationError(err.message || 'Moderation failed');
    } finally {
      setModerating(false);
    }
  };

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    setSendError(null);
    try {
      const docRef = await addDoc(collection(db, 'kudos_leads'), {
        recipientName: recipientName.trim() || null,
        recipientEmail: recipientEmail.trim().toLowerCase(),
        company: company.trim() || null,
        originalMessage: message.trim(),
        finalMessage: finalText,
        moderation: {
          decision: moderation.decision,
          reason: moderation.reason || null,
          concerns: moderation.concerns || [],
          deAnonymizationRisk: moderation.deAnonymizationRisk || 'none',
          sentiment: moderation.sentiment || 'neutral',
          provider: moderation.provider || null,
          model: moderation.model || null,
        },
        sentBy: {
          uid: user?.uid || null,
          email: user?.email || null,
        },
        emailDelivered: false, // v1: salesperson sends manually
        leadStatus: 'new',
        createdAt: serverTimestamp(),
      });
      setSendResult({ kudosId: docRef.id });
    } catch (err) {
      setSendError(err.message || 'Failed to log kudos');
    } finally {
      setSending(false);
    }
  };

  const handleCopy = async () => {
    if (!finalText) return;
    try {
      await navigator.clipboard.writeText(finalText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // noop
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-8 text-center text-rose-600">
        Admin access required.
      </div>
    );
  }

  const decisionStyle = moderation
    ? DECISION_STYLES[moderation.decision]
    : null;
  const DecisionIcon = decisionStyle?.icon;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="p-3 bg-gradient-to-br from-rose-500 to-orange-500 rounded-2xl shadow-lg flex-shrink-0">
          <Heart className="w-8 h-8 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Kudos Lead Magnet
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
              Beta
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Send a warm, AI-moderated kudos to a prospect "from the team at
            LeaderReps." Every send is logged as a warm lead. Messages pass
            through a safety + voice filter before they go out.
          </p>
        </div>
      </div>

      {/* Compose */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-slate-200 dark:border-slate-700 p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="block">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
              <UserIcon className="w-3.5 h-3.5" /> Recipient name
            </span>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Optional"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#47A88D]"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
              <Mail className="w-3.5 h-3.5" /> Recipient email <span className="text-rose-500">*</span>
            </span>
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="prospect@company.com"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#47A88D]"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
              <Building2 className="w-3.5 h-3.5" /> Company
            </span>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Optional"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#47A88D]"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between mb-1.5">
            <span className="flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5" /> Your kudos message
            </span>
            <span
              className={classNames(
                'text-[11px] font-medium',
                tooLong ? 'text-rose-500' : 'text-slate-400'
              )}
            >
              {charsLeft} chars left
            </span>
          </span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            placeholder="Write a warm, specific, anonymous-feeling note. Keep it positive — the AI will check it."
            className={classNames(
              'w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#47A88D] resize-y',
              tooLong
                ? 'border-rose-400 dark:border-rose-600'
                : 'border-slate-300 dark:border-slate-600'
            )}
          />
        </label>

        {/* Samples */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Quick start:
          </span>
          {SAMPLES.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => { setMessage(s.text); reset(false); }}
              className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Hard-rejects: sarcasm, surveillance, asks, weaponized framing.
            Rewrites: identifying details.
          </p>
          <button
            type="button"
            onClick={handleModerate}
            disabled={!canModerate}
            className={classNames(
              'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all',
              canModerate
                ? 'bg-[#002E47] hover:bg-[#003d5c] text-white'
                : 'bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-500 cursor-not-allowed'
            )}
          >
            {moderating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Checking…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Run safety check
              </>
            )}
          </button>
        </div>

        {moderationError && (
          <div className="text-sm text-rose-600 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 rounded-lg p-3">
            {moderationError}
          </div>
        )}
      </div>

      {/* Moderation result */}
      {moderation && decisionStyle && (
        <div
          className={classNames(
            'bg-white dark:bg-slate-800 rounded-2xl shadow-card border-2 overflow-hidden',
            decisionStyle.border
          )}
        >
          <div className={classNames('h-1', decisionStyle.bar)} />
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <span
                  className={classNames(
                    'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full',
                    decisionStyle.badge
                  )}
                >
                  <DecisionIcon className="w-3.5 h-3.5" />
                  {decisionStyle.label}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Risk:{' '}
                  <span
                    className={classNames(
                      'font-semibold',
                      RISK_STYLES[moderation.deAnonymizationRisk] || RISK_STYLES.none
                    )}
                  >
                    {moderation.deAnonymizationRisk || 'none'}
                  </span>
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Sentiment:{' '}
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {moderation.sentiment}
                  </span>
                </span>
                {moderation.provider && (
                  <span className="text-[11px] text-slate-400">
                    via {moderation.provider}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => reset(false)}
                className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 inline-flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Re-check
              </button>
            </div>

            {moderation.reason && (
              <p className="text-sm text-slate-600 dark:text-slate-300 italic">
                "{moderation.reason}"
              </p>
            )}

            {moderation.concerns?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {moderation.concerns.map((c) => (
                  <span
                    key={c}
                    className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}

            {moderation.decision !== 'reject' && (
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Final message
                </div>
                <p className="text-sm text-slate-800 dark:text-slate-100 whitespace-pre-wrap leading-relaxed">
                  {finalText}
                </p>
                {moderation.decision === 'rewrite' &&
                  finalText !== message.trim() && (
                    <details className="mt-3 text-xs text-slate-500">
                      <summary className="cursor-pointer hover:text-slate-700 dark:hover:text-slate-300">
                        See what changed
                      </summary>
                      <div className="mt-2 p-3 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                          Original
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                          {message.trim()}
                        </p>
                      </div>
                    </details>
                  )}
              </div>
            )}

            {moderation.decision === 'reject' && (
              <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg p-4 text-sm text-rose-700 dark:text-rose-300">
                This message cannot be sent. Edit your draft above and re-run
                the safety check.
              </div>
            )}

            {moderation.decision !== 'reject' && (
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy message'}
                </button>
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!canSend}
                  className={classNames(
                    'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all ml-auto',
                    canSend
                      ? 'bg-[#47A88D] hover:bg-[#3d9179] text-white'
                      : 'bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-500 cursor-not-allowed'
                  )}
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving…
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Log kudos as lead
                    </>
                  )}
                </button>
              </div>
            )}

            {sendError && (
              <div className="text-sm text-rose-600 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 rounded-lg p-3">
                {sendError}
              </div>
            )}

            {sendResult && (
              <div className="text-sm bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 flex items-start gap-3">
                <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-semibold text-emerald-700 dark:text-emerald-300">
                    Logged as lead.
                  </div>
                  <div className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                    Send the moderated message from your normal channel.
                    Lead id: <code className="font-mono">{sendResult.kudosId}</code>
                  </div>
                  <button
                    type="button"
                    onClick={() => reset(true)}
                    className="mt-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 underline hover:no-underline"
                  >
                    Send another
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent leads */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-slate-200 dark:border-slate-700">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
          <History className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Recent kudos leads
          </h3>
          <span className="text-xs text-slate-400">({totalShown})</span>
        </div>
        {recent.length === 0 ? (
          <div className="p-6 text-sm text-slate-500 text-center">
            No kudos sent yet. Compose one above to capture your first lead.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {recent.map((row) => {
              const style = DECISION_STYLES[row.moderation?.decision] || DECISION_STYLES.accept;
              const StyleIcon = style.icon;
              const when = row.createdAt?.toDate
                ? row.createdAt.toDate().toLocaleString()
                : '—';
              return (
                <div key={row.id} className="px-6 py-3 flex items-start gap-3 text-sm">
                  <span
                    className={classNames(
                      'inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded mt-0.5',
                      style.badge
                    )}
                  >
                    <StyleIcon className="w-3 h-3" />
                    {row.moderation?.decision || 'accept'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">
                        {row.recipientName || row.recipientEmail}
                      </span>
                      {row.company && <span>· {row.company}</span>}
                      <span className="ml-auto whitespace-nowrap">{when}</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                      {row.finalMessage || row.originalMessage || '(no text)'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footnote */}
      <p className="text-[11px] text-slate-400 text-center">
        v1: email delivery is manual — copy the moderated message and send it
        from your normal channel. v2 will wire up automated delivery and
        pay-it-forward links.
      </p>
    </div>
  );
};

export default KudosLeadMagnet;
