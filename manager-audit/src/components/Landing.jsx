import { motion } from 'framer-motion';
import { Clock3, ListChecks, Sparkles } from 'lucide-react';
import {
  ASSESSMENT_TITLE,
  ASSESSMENT_SUBTITLE_LINE_1,
  ASSESSMENT_SUBTITLE_LINE_2,
} from '../data/questions';

const Pill = ({ icon: Icon, label }) => (
  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-[#002E47]">
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
      className="min-h-screen flex flex-col"
    >
      {/* Header with logo */}
      <header className="p-4 md:p-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <img
            src="/logo-full.png"
            alt="LeaderReps"
            className="h-16 md:h-20"
          />
          <a
            href="https://www.leaderreps.com"
            className="text-[#E04E1B] hover:text-[#C04313] transition text-sm font-semibold"
          >
            Learn about our programs →
          </a>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-slate-200 p-6 md:p-12 shadow-xl"
          >
            <h1 className="font-sans text-4xl md:text-6xl font-extrabold leading-[1.1] text-[#002E47]">
              {ASSESSMENT_TITLE}
            </h1>

            <p className="mt-6 text-lg md:text-xl text-slate-700 leading-relaxed">
              {ASSESSMENT_SUBTITLE_LINE_1}
            </p>
            <p className="mt-4 text-lg md:text-xl text-slate-700 leading-relaxed">
              {ASSESSMENT_SUBTITLE_LINE_2}
            </p>

            <div className="mt-8 flex flex-wrap gap-2">
              <Pill icon={Clock3} label="3 minutes" />
              <Pill icon={ListChecks} label="10 questions" />
              <Pill icon={Sparkles} label="Instant score" />
            </div>

            <button
              onClick={onStart}
              className="mt-8 inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-[#47A88D] hover:bg-[#3a8a73] text-white font-bold text-base shadow-lg transition-colors"
            >
              Start the Audit
            </button>

            <p className="mt-3 text-sm text-slate-500">No email necessary.</p>
          </motion.div>
        </div>
      </main>
    </motion.div>
  );
};

export default Landing;
