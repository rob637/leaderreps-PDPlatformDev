import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { ASSESSMENT_QUESTIONS, ACCOUNTABILITY_DIMENSIONS } from '../data/questions';

const ProgressBar = ({ current, total }) => (
  <div className="w-full max-w-md mx-auto mb-8">
    <div className="flex justify-between text-sm text-white/60 mb-2">
      <span>Question {current + 1} of {total}</span>
      <span>{Math.round(((current + 1) / total) * 100)}%</span>
    </div>
    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
      <motion.div
        className="h-full bg-gradient-to-r from-orange to-orange/80 rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${((current + 1) / total) * 100}%` }}
        transition={{ duration: 0.3 }}
      />
    </div>
  </div>
);

const ScenarioQuestion = ({ question, value, onChange }) => (
  <div className="space-y-4">
    {question.options.map((option, i) => (
      <motion.button
        key={option.id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: i * 0.1 }}
        onClick={() => onChange(option.id)}
        className={`w-full p-4 md:p-5 rounded-2xl text-left transition-all duration-200 ${
          value === option.id
            ? 'bg-orange text-white shadow-lg shadow-orange/20'
            : 'glass hover:bg-white/10 text-white'
        }`}
      >
        <div className="flex items-center gap-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
            value === option.id ? 'bg-white/20' : 'bg-white/10'
          }`}>
            {option.id.toUpperCase()}
          </div>
          <span className="flex-1">{option.text}</span>
          {value === option.id && (
            <Check className="w-5 h-5" />
          )}
        </div>
      </motion.button>
    ))}
  </div>
);

const RatingQuestion = ({ question, value, onChange }) => {
  const labels = ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'];
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between gap-2">
        {[1, 2, 3, 4, 5].map((rating) => (
          <motion.button
            key={rating}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: rating * 0.05 }}
            onClick={() => onChange(rating)}
            className={`flex-1 aspect-square max-w-[80px] rounded-2xl flex items-center justify-center text-2xl font-bold transition-all duration-200 ${
              value === rating
                ? 'bg-orange text-white shadow-lg shadow-orange/20 scale-110'
                : 'glass hover:bg-white/10 text-white/80'
            }`}
          >
            {rating}
          </motion.button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-white/50 px-2">
        <span>Disagree</span>
        <span>Agree</span>
      </div>
      {value && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-orange font-medium"
        >
          {labels[value - 1]}
        </motion.div>
      )}
    </div>
  );
};

const RankingQuestion = ({ question, value = [], onChange }) => {
  const handleToggle = (optionId) => {
    if (value.includes(optionId)) {
      onChange(value.filter(id => id !== optionId));
    } else if (value.length < 3) {
      onChange([...value, optionId]);
    }
  };

  const getRank = (optionId) => {
    const index = value.indexOf(optionId);
    return index >= 0 ? index + 1 : null;
  };

  return (
    <div className="space-y-4">
      <p className="text-white/60 text-sm text-center mb-4">
        Selected: {value.length}/3
      </p>
      <div className="grid gap-3">
        {question.options.map((option, i) => {
          const rank = getRank(option.id);
          const isSelected = rank !== null;
          
          return (
            <motion.button
              key={option.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => handleToggle(option.id)}
              disabled={!isSelected && value.length >= 3}
              className={`p-4 rounded-2xl text-left transition-all duration-200 ${
                isSelected
                  ? 'bg-orange text-white shadow-lg shadow-orange/20'
                  : value.length >= 3
                  ? 'glass opacity-50 cursor-not-allowed text-white/50'
                  : 'glass hover:bg-white/10 text-white'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                  isSelected ? 'bg-white/20 font-bold' : 'bg-white/10'
                }`}>
                  {isSelected ? `#${rank}` : option.emoji}
                </div>
                <span className="flex-1">{option.text}</span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

const MultiSelectQuestion = ({ question, value = [], onChange }) => {
  const handleToggle = (optionId) => {
    if (value.includes(optionId)) {
      onChange(value.filter(id => id !== optionId));
    } else if (value.length < question.maxSelect) {
      onChange([...value, optionId]);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-white/60 text-sm text-center mb-4">
        Selected: {value.length}/{question.maxSelect}
      </p>
      <div className="grid gap-3">
        {question.options.map((option, i) => {
          const isSelected = value.includes(option.id);
          
          return (
            <motion.button
              key={option.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => handleToggle(option.id)}
              disabled={!isSelected && value.length >= question.maxSelect}
              className={`p-4 rounded-2xl text-left transition-all duration-200 ${
                isSelected
                  ? 'bg-orange text-white shadow-lg shadow-orange/20'
                  : value.length >= question.maxSelect
                  ? 'glass opacity-50 cursor-not-allowed text-white/50'
                  : 'glass hover:bg-white/10 text-white'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                  isSelected ? 'bg-white/20' : 'bg-white/10'
                }`}>
                  {isSelected ? <Check className="w-5 h-5" /> : option.emoji}
                </div>
                <span className="flex-1">{option.text}</span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

const AssessmentFlow = ({ onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  
  const questions = ASSESSMENT_QUESTIONS;
  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers[currentQuestion.id];
  
  const isAnswered = () => {
    if (!currentAnswer) return false;
    if (currentQuestion.type === 'ranking') return currentAnswer.length === 3;
    if (currentQuestion.type === 'multi-select') return currentAnswer.length >= 1;
    return true;
  };

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

  // Section labels
  const getSectionLabel = () => {
    if (currentQuestion.section === 1) return "Accountability Scenarios";
    if (currentQuestion.section === 2) return "Self-Assessment";
    if (currentQuestion.section === 3) return "Preferences & Growth";
    return "";
  };

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
              <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-white text-center mb-8">
                {currentQuestion.question}
              </h2>

              {currentQuestion.type === 'scenario' && (
                <ScenarioQuestion
                  question={currentQuestion}
                  value={currentAnswer}
                  onChange={handleAnswer}
                />
              )}

              {currentQuestion.type === 'rating' && (
                <RatingQuestion
                  question={currentQuestion}
                  value={currentAnswer}
                  onChange={handleAnswer}
                />
              )}

              {currentQuestion.type === 'ranking' && (
                <RankingQuestion
                  question={currentQuestion}
                  value={currentAnswer}
                  onChange={handleAnswer}
                />
              )}

              {currentQuestion.type === 'multi-select' && (
                <MultiSelectQuestion
                  question={currentQuestion}
                  value={currentAnswer}
                  onChange={handleAnswer}
                />
              )}
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
                : 'text-white/70 hover:text-white hover:bg-white/10'
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
                ? 'bg-orange hover:bg-orange/90 text-white shadow-lg hover:shadow-xl'
                : 'bg-white/10 text-white/30 cursor-not-allowed'
            }`}
          >
            <span>{currentIndex === questions.length - 1 ? 'See My Results' : 'Continue'}</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default AssessmentFlow;
