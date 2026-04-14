import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle2,
  RotateCcw,
  Share2,
  Send,
  ExternalLink,
  Mail,
} from 'lucide-react';
import {
  START_ASSESSMENT_URL,
  getLinkedInShareText,
} from '../data/questions';

const scoreTheme = {
  'execution-engine': {
    text: 'text-[#277A68]',
    bg: 'bg-[#277A68]/10',
    border: 'border-[#277A68]/30',
  },
  'leaky-system': {
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

const ResultCard = ({ item, index }) => {
  const yesSelected = item.answer === 'yes';

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.06 * index }}
      className="rounded-2xl border border-slate-200 bg-white p-5"
    >
      <h3 className="text-xl font-bold text-[#002E47]">
        Question {index + 1}: {item.shortLabel}
      </h3>
      <p className="mt-2 text-slate-700">{item.prompt}</p>
      {item.note && <p className="mt-1 text-sm text-slate-500">{item.note}</p>}

      <div className="mt-4 grid md:grid-cols-2 gap-3">
        <div
          className={`rounded-xl border p-4 ${
            yesSelected
              ? 'border-[#277A68] bg-[#277A68]/10'
              : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="text-xs font-semibold uppercase tracking-wide text-[#277A68] mb-2">
            IF YES {yesSelected ? '[YOUR ANSWER]' : ''}
          </div>
          <p className="text-slate-700 text-sm leading-relaxed">{item.ifYes}</p>
        </div>

        <div
          className={`rounded-xl border p-4 ${
            yesSelected
              ? 'border-slate-200 bg-slate-50'
              : 'border-[#B84825] bg-[#B84825]/10'
          }`}
        >
          <div className="text-xs font-semibold uppercase tracking-wide text-[#B84825] mb-2">
            IF NOT YET {!yesSelected ? '[YOUR ANSWER]' : ''}
          </div>
          <p className="text-slate-700 text-sm leading-relaxed">{item.ifNotYet}</p>
        </div>
      </div>
    </motion.section>
  );
};

const Results = ({
  results,
  onRestart,
  onEmailSubmit,
  isSubmitting,
  submitState,
}) => {
  const [email, setEmail] = useState('');

  const theme = scoreTheme[results?.archetype] || scoreTheme['leaky-system'];

  const linkedInShareUrl = useMemo(() => {
    const text = getLinkedInShareText();
    const url = `${START_ASSESSMENT_URL}?utm_source=linkedin&utm_medium=organic-share`;
    const finalText = `${text} ${url}`;

    return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      url,
    )}&summary=${encodeURIComponent(finalText)}`;
  }, []);

  const handleEmailSubmit = (event) => {
    event.preventDefault();
    if (!email || !email.includes('@')) return;
    onEmailSubmit(email.trim());
  };

  if (!results) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen py-8 px-4"
    >
      <div className="max-w-4xl mx-auto space-y-5">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-lg">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Your Results
              </p>
              <h1 className="text-3xl md:text-4xl font-bold text-[#002E47] mt-1">
                You answered Yes to{' '}
                <span className="text-[#B84825]">
                  {results.yesCount} out of {results.totalQuestions}
                </span>{' '}
                questions.
              </h1>
            </div>

            <button
              onClick={onRestart}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>

          <div
            className={`mt-5 inline-flex items-center rounded-full px-4 py-2 border ${theme.bg} ${theme.border} ${theme.text} font-semibold`}
          >
            {results.scoreLabel}
          </div>

          <p className="mt-4 text-slate-700 leading-relaxed">{results.summary}</p>

          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href={linkedInShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl px-4 py-3 bg-[#0077B5] text-white font-semibold"
            >
              <Share2 className="w-4 h-4" />
              Share on LinkedIn
            </a>

            <button
              onClick={onRestart}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-3 border border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <RotateCcw className="w-4 h-4" />
              Take assessment again
            </button>
          </div>
        </section>

        <section className="space-y-4">
          {results.questionResults.map((item, index) => (
            <ResultCard key={item.id} item={item} index={index} />
          ))}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8">
          <h2 className="text-2xl font-bold text-[#002E47] mb-2">
            Get your results as a PDF + the Accountability Blueprint
          </h2>
          <p className="text-slate-700">
            Enter your email to receive your results and the Accountability System Blueprint, a one-page reference showing what a fully functioning accountability system looks like in practice.
          </p>
          <p className="text-slate-500 text-sm mt-2">
            You will also be subscribed to One More Rep, our free weekly leadership practice newsletter. Unsubscribe anytime.
          </p>

          <form className="mt-5" onSubmit={handleEmailSubmit}>
            <div className="flex flex-col sm:flex-row gap-3">
              <label className="sr-only" htmlFor="results-email">
                Email address
              </label>
              <div className="relative flex-1">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="results-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Your work email"
                  className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-3 focus:outline-none focus:ring-2 focus:ring-[#277A68]"
                  disabled={isSubmitting}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-white font-semibold disabled:opacity-60"
                style={{ backgroundColor: '#B84825' }}
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? 'Sending...' : 'Send me the Blueprint'}
              </button>
            </div>
          </form>

          {submitState === 'success' && (
            <p className="mt-3 text-sm text-[#277A68] inline-flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Check your inbox. Your resources are on the way.
            </p>
          )}
          {submitState === 'error' && (
            <p className="mt-3 text-sm text-[#B84825]">
              We could not send that right now. Please try again in a minute.
            </p>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8">
          <h2 className="text-2xl font-bold text-[#002E47]">
            Already know you want to go deeper?
          </h2>
          <p className="text-slate-700 mt-2">
            Foundation is a small cohort for managers who want to build this system through practice, not lectures.
          </p>
          <a
            href="https://www.leaderreps.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-4 text-[#277A68] font-semibold"
          >
            Learn more
            <ExternalLink className="w-4 h-4" />
          </a>
        </section>
      </div>
    </motion.div>
  );
};

export default Results;
