import { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Award,
  Sparkles,
  Loader2,
  Copy,
  Check,
  Mail,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';
import { useNavigation } from '../../providers/NavigationProvider.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { getRfKudosFeedback } from '../../services/aiService.js';

/**
 * Reinforcing Feedback ("RF Kudos") composer.
 *
 * Companion to the anonymous Kudos product — but built for the *specific*,
 * identified, behavior-anchored reinforcing feedback leaders are taught to
 * give in Week 1 of the Foundation track.
 *
 * The form uses a lightweight SBI frame (Situation → Behavior → Impact)
 * so the leader can't ship the kind of vague "you're awesome" message
 * the anonymous Kudos moderator (rightly) rejects.
 *
 * AI assist:
 *   - Scores the draft for specificity, behavioral clarity, and impact.
 *   - Surfaces what's missing (vague language, no observable behavior,
 *     no stated impact, evaluative judgments instead of observations).
 *   - Returns a polished version the leader can adopt or ignore.
 *
 * The user owns delivery: copy to clipboard, open in mail client, or
 * just read it back to themselves before saying it in person.
 */
export default function RFKudosScreen() {
  const { goBack, canGoBack } = useNavigation();
  const { userProfile } = useAuth();
  const senderFirstName =
    userProfile?.firstName || userProfile?.displayName?.split(' ')[0] || '';

  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [situation, setSituation] = useState('');
  const [behavior, setBehavior] = useState('');
  const [impact, setImpact] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [copied, setCopied] = useState(false);

  const composed = useMemo(
    () => composeDraft({ recipientName, situation, behavior, impact }),
    [recipientName, situation, behavior, impact],
  );

  const canSubmit =
    recipientName.trim().length > 0 &&
    situation.trim().length >= 10 &&
    behavior.trim().length >= 10 &&
    impact.trim().length >= 10 &&
    !loading;

  async function handleGetFeedback() {
    if (!canSubmit) return;
    setError(null);
    setFeedback(null);
    setLoading(true);
    try {
      const result = await getRfKudosFeedback({
        recipientName: recipientName.trim(),
        situation: situation.trim(),
        behavior: behavior.trim(),
        impact: impact.trim(),
        draft: composed,
      });
      setFeedback(result);
    } catch (err) {
      console.error('RF Kudos feedback error:', err);
      setError(
        err?.message ||
          "We couldn't reach the coach right now. Your draft is still saved below.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setRecipientName('');
    setRecipientEmail('');
    setSituation('');
    setBehavior('');
    setImpact('');
    setFeedback(null);
    setError(null);
    setCopied(false);
  }

  const messageToShare = feedback?.polished || composed;

  async function handleCopy() {
    if (!messageToShare) return;
    try {
      await navigator.clipboard.writeText(messageToShare);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError('Copy failed — long-press the message to copy manually.');
    }
  }

  const mailtoHref = useMemo(() => {
    if (!messageToShare) return null;
    const subject = encodeURIComponent(
      `A bit of reinforcing feedback${
        recipientName.trim() ? `, ${recipientName.trim()}` : ''
      }`,
    );
    const body = encodeURIComponent(
      `${messageToShare}\n\n— ${senderFirstName || 'me'}`,
    );
    const to = recipientEmail.trim() ? encodeURIComponent(recipientEmail.trim()) : '';
    return `mailto:${to}?subject=${subject}&body=${body}`;
  }, [messageToShare, recipientName, recipientEmail, senderFirstName]);

  return (
    <div className="min-h-screen pb-20 px-4 pt-4">
      {canGoBack && (
        <button
          onClick={goBack}
          className="text-stone-500 hover:text-lab-navy mb-3 inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>
      )}

      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-9 h-9 rounded-2xl bg-lab-teal/10 flex items-center justify-center">
            <Award size={18} className="text-lab-teal" />
          </div>
          <h1 className="text-2xl font-bold text-lab-navy">Reinforcing Feedback</h1>
        </div>
        <p className="text-sm text-stone-500 leading-relaxed">
          The good kind, done well — specific, behavioral, and named. Anonymous
          kudos make someone smile; <em>this</em> is the feedback that changes
          what they do next.
        </p>
      </div>

      {/* SBI frame primer */}
      <div className="bg-amber-50/60 border border-amber-200/60 rounded-2xl p-4 mb-5">
        <div className="flex items-start gap-2">
          <Lightbulb size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-stone-700 leading-relaxed">
            <p className="font-semibold text-amber-900 mb-1">
              Use the SBI frame
            </p>
            <p>
              <span className="font-semibold">Situation</span> · when &amp;
              where it happened &nbsp;·&nbsp;{' '}
              <span className="font-semibold">Behavior</span> · what they
              actually did &nbsp;·&nbsp;{' '}
              <span className="font-semibold">Impact</span> · why it mattered.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Field
          label="Who is this for?"
          hint="Their first name — we'll address them by it."
        >
          <input
            type="text"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            maxLength={60}
            placeholder="e.g. Jordan"
            className={inputClass}
          />
        </Field>

        <Field
          label="Their email"
          hint="Optional — only used if you choose to send by email."
        >
          <input
            type="email"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            placeholder="jordan@example.com"
            className={inputClass}
          />
        </Field>

        <Field
          label="Situation"
          hint="When and where did this happen? Anchor it in time."
          example="In yesterday's pricing review with the leadership team…"
        >
          <textarea
            rows={2}
            value={situation}
            onChange={(e) => setSituation(e.target.value)}
            maxLength={400}
            placeholder="In yesterday's pricing review…"
            className={textareaClass}
          />
        </Field>

        <Field
          label="Behavior"
          hint="What did they actually do or say? Stick to observables — no labels, no judgments."
          example="…you paused the room, surfaced the unspoken assumption about margins, and asked Priya to walk us through her data again…"
        >
          <textarea
            rows={3}
            value={behavior}
            onChange={(e) => setBehavior(e.target.value)}
            maxLength={600}
            placeholder="You paused the room and asked…"
            className={textareaClass}
          />
        </Field>

        <Field
          label="Impact"
          hint="Why did it matter — to you, to the team, to the work?"
          example="…it shifted the whole conversation. We avoided locking in a price we'd have regretted, and Priya later told me it was the first time she felt fully heard in that room."
        >
          <textarea
            rows={3}
            value={impact}
            onChange={(e) => setImpact(e.target.value)}
            maxLength={600}
            placeholder="It changed the conversation because…"
            className={textareaClass}
          />
        </Field>
      </div>

      {/* Live preview */}
      {composed && (
        <div className="mt-6">
          <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-2 px-1">
            Draft Preview
          </p>
          <div className="glass-card p-4">
            <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">
              {composed}
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-5 flex flex-col gap-2.5">
        <button
          onClick={handleGetFeedback}
          disabled={!canSubmit}
          className="w-full rounded-2xl bg-lab-teal text-white font-semibold py-3 px-4 flex items-center justify-center gap-2 disabled:bg-stone-200 disabled:text-stone-400 hover:bg-lab-teal/90 transition-colors"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Coaching your draft…
            </>
          ) : (
            <>
              <Sparkles size={18} />
              {feedback ? 'Re-coach my draft' : 'Get AI feedback on my draft'}
            </>
          )}
        </button>

        {(recipientName || situation || behavior || impact) && (
          <button
            onClick={handleReset}
            className="text-xs text-stone-400 hover:text-stone-600 font-medium"
          >
            Start over
          </button>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700 flex items-start gap-2">
          <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {feedback && (
        <FeedbackPanel
          feedback={feedback}
          messageToShare={messageToShare}
          onCopy={handleCopy}
          copied={copied}
          mailtoHref={mailtoHref}
        />
      )}
    </div>
  );
}

const inputClass =
  'w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm text-lab-navy bg-white focus:outline-none focus:border-lab-teal focus:ring-2 focus:ring-lab-teal/20';

const textareaClass =
  'w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm text-lab-navy bg-white focus:outline-none focus:border-lab-teal focus:ring-2 focus:ring-lab-teal/20 resize-y leading-relaxed';

function Field({ label, hint, example, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-lab-navy mb-1">
        {label}
      </label>
      {hint && <p className="text-xs text-stone-500 mb-1.5">{hint}</p>}
      {children}
      {example && (
        <p className="text-[11px] text-stone-400 italic mt-1.5 leading-relaxed">
          e.g. {example}
        </p>
      )}
    </div>
  );
}

function FeedbackPanel({ feedback, messageToShare, onCopy, copied, mailtoHref }) {
  const quality = feedback?.quality || 'good';
  const qualityMeta = QUALITY_META[quality] || QUALITY_META.good;

  return (
    <div className="mt-6 space-y-4">
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-2">
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${qualityMeta.badge}`}
          >
            {qualityMeta.label}
          </span>
          {feedback?.scores && (
            <div className="flex items-center gap-2 text-[11px] text-stone-500">
              <ScoreDot label="Specific" value={feedback.scores.specificity} />
              <ScoreDot label="Behavioral" value={feedback.scores.behavioral} />
              <ScoreDot label="Impact" value={feedback.scores.impact} />
            </div>
          )}
        </div>
        {feedback?.summary && (
          <p className="text-sm text-stone-700 leading-relaxed">
            {feedback.summary}
          </p>
        )}
      </div>

      {Array.isArray(feedback?.strengths) && feedback.strengths.length > 0 && (
        <div className="rounded-2xl bg-lab-teal/5 border border-lab-teal/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={14} className="text-lab-teal" />
            <p className="text-[11px] font-bold uppercase tracking-wider text-lab-teal">
              What's working
            </p>
          </div>
          <ul className="space-y-1.5">
            {feedback.strengths.map((s, i) => (
              <li
                key={i}
                className="text-sm text-stone-700 leading-relaxed pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-lab-teal"
              >
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {Array.isArray(feedback?.suggestions) && feedback.suggestions.length > 0 && (
        <div className="rounded-2xl bg-amber-50/70 border border-amber-200/60 p-4">
          <div className="flex items-center gap-2 mb-2">
            <RefreshCw size={14} className="text-amber-700" />
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
              Try sharpening
            </p>
          </div>
          <ul className="space-y-1.5">
            {feedback.suggestions.map((s, i) => (
              <li
                key={i}
                className="text-sm text-stone-700 leading-relaxed pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-amber-700"
              >
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {feedback?.polished && (
        <div className="rounded-2xl bg-white border-2 border-lab-teal/40 p-4 shadow-card">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={14} className="text-lab-teal" />
            <p className="text-[11px] font-bold uppercase tracking-wider text-lab-teal">
              Polished version
            </p>
          </div>
          <p className="text-sm text-stone-800 leading-relaxed whitespace-pre-wrap">
            {feedback.polished}
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <button
          onClick={onCopy}
          className="flex-1 rounded-xl bg-lab-navy text-white text-sm font-semibold py-2.5 px-4 flex items-center justify-center gap-2 hover:bg-lab-navy/90 transition-colors"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? 'Copied' : 'Copy to clipboard'}
        </button>
        {mailtoHref && (
          <a
            href={mailtoHref}
            className="flex-1 rounded-xl border border-lab-navy/20 text-lab-navy text-sm font-semibold py-2.5 px-4 flex items-center justify-center gap-2 hover:bg-lab-navy/5 transition-colors"
          >
            <Mail size={16} />
            Open in email
          </a>
        )}
      </div>

      <p className="text-[11px] text-stone-400 text-center italic px-4">
        Reinforcing feedback lands hardest in person. The version above is yours
        to keep — say it out loud, send it, or use it as a script.
      </p>
    </div>
  );
}

const QUALITY_META = {
  strong: {
    label: 'Strong reinforcing feedback',
    badge: 'bg-lab-teal/10 text-lab-teal',
  },
  good: {
    label: 'Good — small tweaks',
    badge: 'bg-amber-100 text-amber-800',
  },
  'needs-work': {
    label: 'Needs sharpening',
    badge: 'bg-stone-200 text-stone-700',
  },
};

function ScoreDot({ label, value }) {
  if (typeof value !== 'number') return null;
  const color =
    value >= 4
      ? 'bg-lab-teal'
      : value >= 3
      ? 'bg-amber-500'
      : 'bg-stone-300';
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`w-1.5 h-1.5 rounded-full ${color}`} />
      <span>{label}</span>
    </span>
  );
}

function composeDraft({ recipientName, situation, behavior, impact }) {
  const name = recipientName.trim();
  const parts = [];
  const opener = name ? `${name}, ` : '';
  if (situation.trim()) parts.push(`${opener}${situation.trim()}`);
  if (behavior.trim()) parts.push(behavior.trim());
  if (impact.trim()) parts.push(impact.trim());
  return parts.join(' ');
}
