import { useState, useCallback, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { ASSESSMENT_QUESTIONS } from '../data/questions';

// Renders prompt text with quoted portions in italics
const PromptText = ({ text }) => {
  const parts = text.split(/("[^"]+")/);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('"') && part.endsWith('"') ? (
          <em key={i}>{part}</em>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        )
      )}
    </>
  );
};

const ProgressBar = ({ current, total }) => (
  <div className="w-full max-w-md mx-auto mb-8">
    <div className="flex justify-between text-sm text-slate-600 mb-2">
      <span>
        Question {current + 1} of {total}
      </span>
      <span>{Math.round(((current + 1) / total) * 100)}%</span>
    </div>
    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: '#B84825' }}
        initial={{ width: 0 }}
        animate={{ width: `${((current + 1) / total) * 100}%` }}
        transition={{ duration: 0.3 }}
      />
    </div>
  </div>
);

const AnswerOption = ({ id, title, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full rounded-2xl p-5 text-left transition-all border ${
      active
        ? 'bg-[#B84825] text-white border-[#B84825] shadow-lg'
        : 'bg-white text-slate-700 border-slate-200 hover:border-[#C85530]'
    }`}
  >
    <div className="flex items-center justify-between gap-4">
      <span className="text-lg font-semibold">{title}</span>
      {active && <CheckCircle2 className="w-5 h-5" />}
    </div>
  </button>
);

const BinaryQuestion = ({ question, value, onChange }) => (
  <div className="space-y-4">
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <AnswerOption
        id="yes"
        title="Yes"
        active={value === 'yes'}
        onClick={() => onChange('yes')}
      />
    </motion.div>
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 }}
    >
      <AnswerOption
        id="not-yet"
        title="Inconsistent / Not Yet"
        active={value === 'not-yet'}
        onClick={() => onChange('not-yet')}
      />
    </motion.div>
    {question.note && (
      <p className="text-sm text-slate-500">{question.note}</p>
    )}
  </div>
);

const AssessmentFlow = ({ onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  
  const questions = ASSESSMENT_QUESTIONS;
  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers[currentQuestion.id] || null;
  const isAnswered = () => currentAnswer === 'yes' || currentAnswer === 'not-yet';

  const handleAnswer = useCallback((value) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  }, [currentQuestion.id]);

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Complete - convert answers to array format
      const answerArray = Object.entries(answers).map(([questionId, value]) => ({
        questionId,
        value,
      }));
      onComplete(answerArray);
    }
  }, [currentIndex, questions.length, answers, onComplete]);

  const handleBack = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  const getSectionLabel = () => 'Accountability System Pulse Check';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col p-4 md:p-8"
    >
      {/* Header */}
      <div className="max-w-2xl mx-auto w-full">
        <div className="text-center mb-4">
          <span className="text-orange text-sm font-medium uppercase tracking-wide">
            {getSectionLabel()}
          </span>
        </div>
        
        <ProgressBar current={currentIndex} total={questions.length} />
      </div>

      {/* Question */}
      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-2xl w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-xs text-slate-400 text-center mb-3">
                Go with your first instinct. If it isn't a consistent, recent "yes", it's a "not yet"
              </p>
              <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-slate-900 text-center mb-6">
                <PromptText text={currentQuestion.prompt} />
              </h2>
              <BinaryQuestion
                question={currentQuestion}
                value={currentAnswer}
                onChange={handleAnswer}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <div className="max-w-2xl mx-auto w-full pt-8">
        <div className="flex justify-between items-center gap-4">
          <button
            onClick={handleBack}
            disabled={currentIndex === 0}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl transition ${
              currentIndex === 0
                ? 'opacity-0 pointer-events-none'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Back</span>
          </button>

          <button
            onClick={handleNext}
            disabled={!isAnswered()}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
              isAnswered()
                ? 'text-white shadow-lg hover:shadow-xl'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
            style={
              isAnswered() ? { backgroundColor: '#B84825' } : undefined
            }
          >
            <span>
              {currentIndex === questions.length - 1
                ? 'See My Results'
                : 'Next'}
            </span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default AssessmentFlow;
