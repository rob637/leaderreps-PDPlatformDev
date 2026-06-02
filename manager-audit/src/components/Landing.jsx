import { motion } from 'framer-motion';
import { ClipboardCheck, Clock, ListChecks, Sparkles } from 'lucide-react';
import { ASSESSMENT_TITLE, ASSESSMENT_SUBTITLE } from '../data/questions';

const Pill = ({ icon: Icon, label }) => (
  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-[#002E47]">
    <Icon className="w-3.5 h-3.5 text-[#277A68]" />
    {label}
  </span>
);

const Landing = ({ onStart }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen flex items-center justify-center px-4 py-10"
    >
      <div className="w-full max-w-2xl">
        <div className="text-center mb-6">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#002E47]/5 text-[#002E47] text-xs font-bold tracking-widest uppercase">
            <Sparkles className="w-3.5 h-3.5 text-[#277A68]" />
            LeaderReps Audit
          </span>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 sm:p-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight text-[#002E47]">
            {ASSESSMENT_TITLE}
          </h1>
          <p className="mt-3 text-lg text-slate-600 leading-relaxed">
            {ASSESSMENT_SUBTITLE}
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <Pill icon={Clock} label="3 minutes" />
            <Pill icon={ListChecks} label="10 questions" />
            <Pill icon={ClipboardCheck} label="Instant score" />
          </div>

          <div className="mt-7 space-y-3 text-sm text-slate-700 leading-relaxed">
            <p>
              You hold the standard. Your managers are supposed to enforce it.
              When that handoff breaks, performance leaks out everywhere —
              missed deadlines, average work going unaddressed, your strongest
              people quietly burning out.
            </p>
            <p>
              This audit scores your management team across the four reps that
              make accountability stick: setting expectations, following up on
              the work, reinforcing what&rsquo;s working, and redirecting
              what isn&rsquo;t. You&rsquo;ll see exactly where the gap is
              &mdash; and the one rep that closes it.
            </p>
          </div>

          <button
            onClick={onStart}
            className="mt-8 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-[#E04E1B] hover:bg-[#C04313] text-white font-bold text-base shadow-sm transition-colors"
          >
            Start the Audit
          </button>

          <p className="mt-4 text-xs text-slate-500">
            No login. We email your full results so you can share them with
            your leadership team.
          </p>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          A LeaderReps tool · leaderreps.com
        </p>
      </div>
    </motion.div>
  );
};

export default Landing;
