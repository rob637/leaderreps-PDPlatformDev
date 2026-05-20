import { useMemo, useState, Fragment } from 'react';
import { motion } from 'framer-motion';
import {
  RotateCcw,
  ExternalLink,
  Mail,
} from 'lucide-react';
import {
  START_ASSESSMENT_URL,
  getLinkedInShareText,
} from '../data/questions';

const TEAL = '#277A68';
const SIENNA = '#B84825';
const NAVY = '#002E47';

const scoreTheme = {
  'strong-system': {
    text: 'text-[#277A68]',
    bg: 'bg-[#277A68]/10',
    border: 'border-[#277A68]/30',
  },
  'room-to-strengthen': {
    text: 'text-[#B84825]',
    bg: 'bg-[#B84825]/10',
    border: 'border-[#B84825]/30',
  },
  'system-not-yet-installed': {
    text: 'text-[#002E47]',
    bg: 'bg-[#002E47]/10',
    border: 'border-[#002E47]/30',
  },
};

// Renders text with quoted portions in italics
const PromptText = ({ text }) => {
  const parts = text.split(/("[^"]+")/);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('"') && part.endsWith('"') ? (
          <em key={i}>{part}</em>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
};

const YourAnswerPill = ({ isYes }) => (
  <span
    className="inline-flex items-center gap-1 ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
    style={{
      backgroundColor: isYes ? `${TEAL}1A` : `${SIENNA}1A`,
      color: isYes ? TEAL : SIENNA,
    }}
  >
    Your Answer
  </span>
);

const ResultCard = ({ item, index }) => {
  const yesSelected = item.answer === 'yes';

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.06 * index }}
      className="py-6 border-t border-slate-100 first:border-t-0"
    >
      <h3 className="text-xl font-bold text-[#002E47]">
        Question {index + 1}: {item.shortLabel}
      </h3>
      <p className="mt-2 text-slate-700">
        <PromptText text={item.prompt} />
      </p>

      <div className="mt-4 grid md:grid-cols-2 gap-4">
        <div
          className={`rounded-xl border p-5 transition-all ${
            yesSelected
              ? 'border-[#277A68] bg-[#277A68]/5 ring-1 ring-[#277A68]'
              : 'border-slate-200 bg-white'
          }`}
        >
          <div
            className={`text-xs font-bold uppercase tracking-widest mb-2 flex items-center ${
              yesSelected ? 'text-[#277A68]' : 'text-slate-500'
            }`}
          >
            <span>Yes</span>
            {yesSelected && <YourAnswerPill isYes={true} />}
          </div>
          <p className="text-sm leading-relaxed text-slate-700">{item.ifYes}</p>
        </div>

        <div
          className={`rounded-xl border p-5 transition-all ${
            !yesSelected
              ? 'border-[#B84825] bg-[#B84825]/5 ring-1 ring-[#B84825]'
              : 'border-slate-200 bg-white'
          }`}
        >
          <div
            className={`text-xs font-bold uppercase tracking-widest mb-2 flex items-center ${
              !yesSelected ? 'text-[#B84825]' : 'text-slate-500'
            }`}
          >
            <span>Not Yet</span>
            {!yesSelected && <YourAnswerPill isYes={false} />}
          </div>
          <p className="text-sm leading-relaxed text-slate-700">{item.ifNotYet}</p>
        </div>
      </div>
    </motion.section>
  );
};

const Results = ({
  results,
  onRestart,
  onEmailSubmit,
  isEmailSubmitting,
  emailSubmitState,
}) => {
  const [email, setEmail] = useState('');
  const [copied, setCopied] = useState(false);

  const theme = scoreTheme[results?.archetype] || scoreTheme['room-to-strengthen'];

  const linkedInShareUrl = useMemo(() => {
    const url = `${START_ASSESSMENT_URL}?utm_source=linkedin&utm_medium=organic-share`;
    return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  }, []);

  const shareText = useMemo(() => getLinkedInShareText(), []);

  const handleEmailSubmit = (event) => {
    event.preventDefault();
    if (!email || !email.includes('@')) return;
    onEmailSubmit(email.trim(), '');
  };

  if (!results) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen py-8 px-4"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Logo Header */}
        <header className="flex items-center justify-between">
          <img
            src="/logo-full.png"
            alt="LeaderReps"
            className="h-16 md:h-20"
          />
        </header>

        {/* Main Results Card */}
        <section className="rounded-[2.5rem] border border-slate-200 bg-white p-8 md:p-12 shadow-xl">
          <div className="flex flex-wrap items-start justify-between gap-6 mb-4">
            <div className="space-y-2">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                Your Results
              </p>
              <h1 className="text-xl md:text-2xl font-black text-[#002E47] leading-tight">
                You answered &quot;Yes&quot; to{' '}
                <span className="text-[#B84825]">
                  {results.yesCount} out of {results.totalQuestions}
                </span>{' '}
                questions.
              </h1>
            </div>

            <button
              onClick={onRestart}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 text-sm font-bold transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Retake
            </button>
          </div>

          <div className="space-y-3">
            <div
              className={`inline-block px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest shadow-sm ${theme.bg} ${theme.text}`}
            >
              {results.scoreLabel}
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-black text-[#002E47] leading-tight">
                {results.headline}
              </h2>

              <div className="space-y-4 text-slate-600 leading-relaxed text-lg max-w-3xl">
                {results.summary.split('\n\n').map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
              Question by Question
            </h2>
            <div>
              {results.questionResults.map((item, index) => (
                <ResultCard key={item.id} item={item} index={index} />
              ))}
            </div>
          </div>
        </section>

        {/* Email — PDF & Blueprint */}
        <section className="rounded-[2.5rem] border border-slate-200 bg-white shadow-2xl overflow-hidden">
          <div className="p-8 md:p-10">
            {emailSubmitState === 'success' ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-teal-50 border border-teal-100 rounded-[2rem] p-10 text-center"
              >
                <p className="text-[#277A68] font-black text-2xl mb-2">Success! Check your inbox.</p>
                <p className="text-[#349881] text-lg mb-4">
                  We&apos;ve sent the PDF of your results and the Accountability System Blueprint.
                </p>
                <p className="text-[#349881]">
                  If you don&apos;t see the email in your inbox, please check your spam folder.
                </p>
              </motion.div>
            ) : (
              <form className="space-y-5" onSubmit={handleEmailSubmit}>
                <p className="text-slate-600 text-lg leading-relaxed">
                  <strong className="font-black text-[#002E47]">Enter your email to get a PDF of your results + the LeaderReps&apos; Accountability System Blueprint</strong> &mdash; a downloadable map of a high-functioning accountability system, the four behavior reps at its core, and how to run each one.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      id="results-email"
                      required
                      placeholder="Work Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 py-4 text-lg focus:outline-none focus:ring-4 focus:ring-[#B84825]/10 focus:border-[#B84825] transition-all"
                      disabled={isEmailSubmitting}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isEmailSubmitting}
                    className="bg-[#B84825] text-white px-8 py-4 rounded-2xl font-black text-lg hover:bg-[#C85530] transition-all shadow-xl shadow-orange-900/20 disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap active:scale-95"
                  >
                    {isEmailSubmitting ? 'Sending...' : 'Send me the Blueprint'}
                  </button>
                </div>

                {emailSubmitState === 'error' && (
                  <p className="text-red-500 font-bold ml-2">Something went wrong. Please try again.</p>
                )}

                <p className="text-xs text-slate-400 leading-relaxed ml-2">
                  You&apos;ll also be subscribed to One More Rep, our free weekly leadership newsletter.
                  Unsubscribe anytime.
                </p>
              </form>
            )}
          </div>
        </section>

        {/* Foundation CTA */}
        <section className="rounded-[2.5rem] border border-slate-200 bg-white p-8 md:p-10 shadow-lg">
          <p className="text-slate-600 text-base leading-relaxed">
            <strong className="text-[#002E47]">The assessment showed you where the gaps are. Foundation is where you close them.</strong>{' '}
            Foundation is a small cohort for managers who want to build their system through practice, not lectures.{' '}
            <a
              href="https://www.leaderreps.com/foundation"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#349881] font-bold hover:underline"
            >
              Learn More &rarr;
            </a>
          </p>
        </section>

        {/* LinkedIn Share */}
        <div className="rounded-[2.5rem] border border-slate-200 bg-white p-8 md:p-10 shadow-lg">
          <h3 className="text-xl font-black text-[#002E47] mb-4">Share on LinkedIn</h3>

          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Copy this text and paste it in your post after clicking Share.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 items-stretch">
              <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 font-medium leading-relaxed select-all">
                {shareText}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(shareText);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2500);
                }}
                className={`px-5 py-3 rounded-xl font-black text-sm transition-all whitespace-nowrap ${
                  copied
                    ? 'bg-[#277A68] text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
              >
                {copied ? '✓ Copied!' : 'Copy Text'}
              </button>
            </div>

            <a
              href={linkedInShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 bg-[#0077b5] text-white rounded-2xl font-black hover:bg-[#00669c] transition-all shadow-xl shadow-blue-900/10 hover:translate-y-[-2px]"
            >
              <ExternalLink className="w-5 h-5 text-white/80" />
              Share on LinkedIn
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Results;
