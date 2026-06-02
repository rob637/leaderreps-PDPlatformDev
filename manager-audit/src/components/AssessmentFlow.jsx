import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import {
  ASSESSMENT_QUESTIONS,
  CATEGORIES,
  LIKERT_OPTIONS,
} from '../data/questions';

const ProgressBar = ({ current, total }) => {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
        <span>
          Question {current} of {total}
        </span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-[#277A68]"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
};

const LikertButton = ({ option, selected, onSelect }) => {
  return (
    <button
      type="button"
      onClick={() => onSelect(option.value)}
      className={`group w-full text-left rounded-2xl border-2 px-5 py-4 transition-all ${
        selected
          ? 'border-[#277A68] bg-[#277A68]/10'
          : 'border-slate-200 bg-white hover:border-[#277A68]/60 hover:bg-[#277A68]/5'
      }`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-base ${
            selected
              ? 'bg-[#277A68] text-white'
              : 'bg-slate-100 text-slate-600 group-hover:bg-[#277A68]/20 group-hover:text-[#277A68]'
          }`}
        >
          {option.value}
        </div>
        <div className="flex-1">
          <div
            className={`font-bold text-[#002E47] ${
              selected ? '' : ''
            }`}
          >
            {option.label}
          </div>
        </div>
      </div>
    </button>
  );
};

const AssessmentFlow = ({ onComplete, onBack }) => {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});

  const total = ASSESSMENT_QUESTIONS.length;
  const question = ASSESSMENT_QUESTIONS[index];
  const category = CATEGORIES[question.category];
  const currentAnswer = answers[question.id];

  const canAdvance = useMemo(
    () => currentAnswer !== undefined && currentAnswer !== null,
    [currentAnswer],
  );

  const handleSelect = (value) => {
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
  };

  const handleNext = () => {
    if (!canAdvance) return;
    if (index === total - 1) {
      onComplete(answers);
      return;
    }
    setIndex((i) => i + 1);
  };

  const handlePrev = () => {
    if (index === 0) {
      onBack?.();
      return;
    }
    setIndex((i) => i - 1);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="min-h-screen px-4 py-8"
    >
      <div className="max-w-2xl mx-auto">
        <ProgressBar current={index + 1} total={total} />

        <div className="mt-6 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-4">
            <span
              className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-widest uppercase"
              style={{
                backgroundColor: category.scored
                  ? 'rgba(39,122,104,0.10)'
                  : 'rgba(0,46,71,0.08)',
                color: category.scored ? '#277A68' : '#002E47',
              }}
            >
              {category.label}
            </span>
            {!category.scored && (
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                Reflection · not scored
              </span>
            )}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-xl sm:text-2xl font-bold leading-snug text-[#002E47]">
                {question.prompt}
              </h2>

              <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
                How often is this true?
              </p>

              <div className="mt-4 space-y-2">
                {LIKERT_OPTIONS.map((opt) => (
                  <LikertButton
                    key={opt.value}
                    option={opt}
                    selected={currentAnswer === opt.value}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-7 flex items-center justify-between">
            <button
              type="button"
              onClick={handlePrev}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:text-[#002E47] hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {index === 0 ? 'Back' : 'Previous'}
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={!canAdvance}
              className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                canAdvance
                  ? 'bg-[#E04E1B] hover:bg-[#C04313] text-white shadow-sm'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {index === total - 1 ? 'See my results' : 'Next'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AssessmentFlow;
