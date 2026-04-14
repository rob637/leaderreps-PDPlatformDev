import { motion } from 'framer-motion';
import { ChevronRight, Clock3, ShieldCheck, Target } from 'lucide-react';
import { ASSESSMENT_TITLE } from '../data/questions';

const Landing = ({ onStart }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col"
    >
      {/* Header */}
      <header className="p-4 md:p-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src="/logo-white.png" 
              alt="LeaderReps" 
              className="h-8 md:h-10"
            />
          </div>
          <a 
            href="https://www.leaderreps.com" 
            className="text-orange hover:text-orange/80 transition text-sm"
          >
            Learn about our programs →
          </a>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="max-w-3xl w-full">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-slate-200 p-6 md:p-10 shadow-xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#B84825]/10 text-[#B84825] text-sm font-semibold mb-6">
              <ShieldCheck className="w-4 h-4" />
              Accountability System Assessment
            </div>

            <h1 className="text-3xl md:text-5xl font-bold text-[#002E47] leading-tight mb-4">
              {ASSESSMENT_TITLE}
              <span className="block text-[#B84825] mt-2">Take the 3-Minute Test</span>
            </h1>

            <p className="text-slate-700 text-lg leading-relaxed mb-5">
              Every manager has an accountability system. The question is not whether yours exists. It is how consistent it is and how much weight it can carry.
            </p>

            <p className="text-slate-600 leading-relaxed mb-8">
              This is a quick five-question check on where your system is strong and where it has room to grow. Go with your first instinct. If it is not a consistent, recent yes, choose Inconsistent / Not Yet.
            </p>

            <div className="grid sm:grid-cols-3 gap-3 mb-8">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 flex items-center gap-2">
                <Clock3 className="w-4 h-4 text-[#277A68]" />
                3 minutes
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 flex items-center gap-2">
                <Target className="w-4 h-4 text-[#277A68]" />
                5 questions
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#277A68]" />
                Instant score + analysis
              </div>
            </div>

            <button
              onClick={onStart}
              className="group inline-flex items-center gap-2 rounded-xl px-6 py-4 text-white font-bold shadow-lg"
              style={{ backgroundColor: '#B84825' }}
            >
              Start Assessment
              <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition" />
            </button>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-white/40 text-sm">
        <p>© {new Date().getFullYear()} LeaderReps. All rights reserved.</p>
      </footer>
    </motion.div>
  );
};

export default Landing;
