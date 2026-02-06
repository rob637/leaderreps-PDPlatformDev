import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  Flag, 
  Clock, 
  CheckCircle, 
  XCircle,
  Lightbulb,
  Bot,
  BookOpen,
  Filter,
  Shuffle,
  Target,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useStudy } from '../../hooks/useStudy';
import { useQuestions } from '../../hooks/useQuestions';
import { CPA_SECTIONS } from '../../config/examConfig';
import clsx from 'clsx';

const Practice = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { userProfile } = useAuth();
  const { recordMCQAnswer, logActivity } = useStudy();
  
  // Session state
  const [sessionConfig, setSessionConfig] = useState(null);
  const [inSession, setInSession] = useState(false);
  
  // Question state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [flagged, setFlagged] = useState(new Set());
  
  // Timer
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);

  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers[currentQuestion?.id];
  const isAnswered = currentAnswer !== undefined;

  // Timer effect
  useEffect(() => {
    let interval;
    if (inSession && startTime) {
      interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [inSession, startTime]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Start a practice session
  const startSession = (config) => {
    // For now, using mock questions
    const mockQuestions = generateMockQuestions(config);
    setQuestions(mockQuestions);
    setSessionConfig(config);
    setInSession(true);
    setStartTime(Date.now());
    setCurrentIndex(0);
    setAnswers({});
    setSelectedAnswer(null);
    setShowExplanation(false);
    setFlagged(new Set());
    
    logActivity('practice_started', { config });
  };

  // Handle answer selection
  const handleSelectAnswer = (answerIndex) => {
    if (isAnswered) return;
    setSelectedAnswer(answerIndex);
  };

  // Submit answer
  const handleSubmitAnswer = async () => {
    if (selectedAnswer === null || isAnswered) return;

    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: {
        selected: selectedAnswer,
        correct: isCorrect,
        time: elapsed
      }
    }));
    setShowExplanation(true);

    // Record in study provider
    await recordMCQAnswer(
      currentQuestion.id,
      currentQuestion.topic,
      currentQuestion.subtopic,
      isCorrect,
      currentQuestion.difficulty
    );
  };

  // Navigation
  const goToQuestion = (index) => {
    setCurrentIndex(index);
    setSelectedAnswer(answers[questions[index]?.id]?.selected ?? null);
    setShowExplanation(answers[questions[index]?.id] !== undefined);
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      goToQuestion(currentIndex + 1);
    }
  };

  const prevQuestion = () => {
    if (currentIndex > 0) {
      goToQuestion(currentIndex - 1);
    }
  };

  // Toggle flag
  const toggleFlag = () => {
    setFlagged(prev => {
      const next = new Set(prev);
      if (next.has(currentQuestion?.id)) {
        next.delete(currentQuestion?.id);
      } else {
        next.add(currentQuestion?.id);
      }
      return next;
    });
  };

  // End session
  const endSession = () => {
    const totalQuestions = questions.length;
    const answeredCount = Object.keys(answers).length;
    const correctCount = Object.values(answers).filter(a => a.correct).length;
    
    logActivity('practice_completed', {
      totalQuestions,
      answeredCount,
      correctCount,
      accuracy: answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0,
      totalTime: elapsed
    });

    // Show results or go back
    setInSession(false);
    setSessionConfig(null);
  };

  // Session configuration screen
  if (!inSession) {
    return <SessionSetup onStart={startSession} userProfile={userProfile} />;
  }

  // Loading state
  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  const progressPercent = ((currentIndex + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;
  const correctCount = Object.values(answers).filter(a => a.correct).length;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Progress */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-slate-600">
                {currentIndex + 1} / {questions.length}
              </span>
              <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                <div 
                  className="h-full bg-primary-500 transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Timer & Stats */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-slate-600">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-mono">{formatTime(elapsed)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-accent-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">{correctCount}/{answeredCount}</span>
              </div>
              <button
                onClick={endSession}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                End Session
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="flex-1 p-4 sm:p-6 max-w-4xl mx-auto w-full">
        <div className="card mb-4">
          {/* Question Header */}
          <div className="card-header flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={clsx(
                "px-2 py-0.5 rounded text-xs font-medium",
                currentQuestion.difficulty === 'easy' && "bg-green-100 text-green-700",
                currentQuestion.difficulty === 'medium' && "bg-amber-100 text-amber-700",
                currentQuestion.difficulty === 'hard' && "bg-red-100 text-red-700"
              )}>
                {currentQuestion.difficulty}
              </span>
              <span className="text-sm text-slate-500">{currentQuestion.topic}</span>
            </div>
            <button
              onClick={toggleFlag}
              className={clsx(
                "p-2 rounded-lg transition-colors",
                flagged.has(currentQuestion.id)
                  ? "bg-amber-100 text-amber-600"
                  : "text-slate-400 hover:bg-slate-100 hover:text-amber-500"
              )}
            >
              <Flag className="w-5 h-5" />
            </button>
          </div>

          {/* Question Text */}
          <div className="card-body">
            <p className="text-slate-900 text-lg leading-relaxed mb-6">
              {currentQuestion.question}
            </p>

            {/* Answer Choices */}
            <div className="space-y-3">
              {currentQuestion.choices.map((choice, index) => {
                const isSelected = selectedAnswer === index;
                const isCorrect = index === currentQuestion.correctAnswer;
                const showResult = isAnswered;

                return (
                  <button
                    key={index}
                    onClick={() => handleSelectAnswer(index)}
                    disabled={isAnswered}
                    className={clsx(
                      "w-full p-4 rounded-xl border-2 text-left transition-all flex items-start gap-3",
                      !showResult && isSelected && "border-primary-500 bg-primary-50",
                      !showResult && !isSelected && "border-slate-200 hover:border-primary-300",
                      showResult && isCorrect && "border-accent-500 bg-accent-50",
                      showResult && isSelected && !isCorrect && "border-red-500 bg-red-50",
                      showResult && !isSelected && !isCorrect && "border-slate-200 opacity-50"
                    )}
                  >
                    {/* Choice Letter */}
                    <span className={clsx(
                      "w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-sm flex-shrink-0",
                      !showResult && isSelected && "bg-primary-500 text-white",
                      !showResult && !isSelected && "bg-slate-100 text-slate-600",
                      showResult && isCorrect && "bg-accent-500 text-white",
                      showResult && isSelected && !isCorrect && "bg-red-500 text-white",
                      showResult && !isSelected && !isCorrect && "bg-slate-100 text-slate-400"
                    )}>
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className={clsx(
                      "flex-1 pt-1",
                      showResult && isCorrect && "text-accent-800",
                      showResult && isSelected && !isCorrect && "text-red-800"
                    )}>
                      {choice}
                    </span>
                    {showResult && isCorrect && (
                      <CheckCircle className="w-5 h-5 text-accent-600 flex-shrink-0" />
                    )}
                    {showResult && isSelected && !isCorrect && (
                      <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Submit Button */}
            {!isAnswered && (
              <button
                onClick={handleSubmitAnswer}
                disabled={selectedAnswer === null}
                className={clsx(
                  "mt-6 w-full btn-primary py-3",
                  selectedAnswer === null && "opacity-50 cursor-not-allowed"
                )}
              >
                Submit Answer
              </button>
            )}
          </div>
        </div>

        {/* Explanation */}
        {showExplanation && (
          <div className="card mb-4">
            <div className="card-header flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              <h3 className="font-semibold text-slate-900">Explanation</h3>
            </div>
            <div className="card-body">
              <p className="text-slate-700 leading-relaxed">
                {currentQuestion.explanation}
              </p>
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100">
                <button className="btn-secondary text-sm flex items-center gap-2">
                  <Bot className="w-4 h-4" />
                  Ask Penny
                </button>
                <button className="btn-secondary text-sm flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Review Lesson
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={prevQuestion}
            disabled={currentIndex === 0}
            className="btn-secondary flex items-center gap-2"
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>
          
          {/* Question Dots */}
          <div className="flex-1 flex items-center justify-center gap-1.5 overflow-x-auto py-2">
            {questions.slice(0, Math.min(10, questions.length)).map((q, index) => (
              <button
                key={q.id}
                onClick={() => goToQuestion(index)}
                className={clsx(
                  "w-8 h-8 rounded-lg text-xs font-medium transition-colors flex-shrink-0",
                  currentIndex === index && "bg-primary-500 text-white",
                  currentIndex !== index && answers[q.id]?.correct && "bg-accent-100 text-accent-700",
                  currentIndex !== index && answers[q.id] && !answers[q.id].correct && "bg-red-100 text-red-700",
                  currentIndex !== index && !answers[q.id] && "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {index + 1}
              </button>
            ))}
            {questions.length > 10 && (
              <span className="text-sm text-slate-400">+{questions.length - 10}</span>
            )}
          </div>

          <button
            onClick={nextQuestion}
            disabled={currentIndex === questions.length - 1}
            className="btn-primary flex items-center gap-2"
          >
            Next
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Session Setup Component
const SessionSetup = ({ onStart, userProfile }) => {
  const [config, setConfig] = useState({
    section: userProfile?.examSection || 'REG',
    mode: 'study', // study, timed, exam
    count: 10,
    topics: [],
    difficulty: 'all'
  });

  const section = CPA_SECTIONS[config.section];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Target className="w-8 h-8 text-primary-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Practice Questions</h1>
        <p className="text-slate-600 mt-2">Configure your practice session</p>
      </div>

      <div className="card">
        <div className="card-body space-y-6">
          {/* Section Select */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Exam Section
            </label>
            <select
              value={config.section}
              onChange={(e) => setConfig(prev => ({ ...prev, section: e.target.value }))}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {Object.entries(CPA_SECTIONS).map(([key, s]) => (
                <option key={key} value={key}>{s.shortName} - {s.name}</option>
              ))}
            </select>
          </div>

          {/* Practice Mode */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Practice Mode
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'study', name: 'Study', desc: 'Learn at your pace' },
                { id: 'timed', name: 'Timed', desc: '90 sec per question' },
                { id: 'exam', name: 'Exam', desc: 'Simulate real exam' },
              ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setConfig(prev => ({ ...prev, mode: mode.id }))}
                  className={clsx(
                    "p-3 rounded-xl border-2 text-center transition-all",
                    config.mode === mode.id 
                      ? "border-primary-500 bg-primary-50"
                      : "border-slate-200 hover:border-primary-300"
                  )}
                >
                  <div className="font-medium text-slate-900">{mode.name}</div>
                  <div className="text-xs text-slate-500">{mode.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Question Count */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Number of Questions
            </label>
            <div className="flex items-center gap-3">
              {[5, 10, 20, 30].map((count) => (
                <button
                  key={count}
                  onClick={() => setConfig(prev => ({ ...prev, count }))}
                  className={clsx(
                    "flex-1 py-2 rounded-lg border-2 font-medium transition-all",
                    config.count === count
                      ? "border-primary-500 bg-primary-50 text-primary-700"
                      : "border-slate-200 text-slate-600 hover:border-primary-300"
                  )}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Difficulty
            </label>
            <div className="flex items-center gap-3">
              {[
                { id: 'all', name: 'All Levels' },
                { id: 'easy', name: 'Easy' },
                { id: 'medium', name: 'Medium' },
                { id: 'hard', name: 'Hard' },
              ].map((diff) => (
                <button
                  key={diff.id}
                  onClick={() => setConfig(prev => ({ ...prev, difficulty: diff.id }))}
                  className={clsx(
                    "flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-all",
                    config.difficulty === diff.id
                      ? "border-primary-500 bg-primary-50 text-primary-700"
                      : "border-slate-200 text-slate-600 hover:border-primary-300"
                  )}
                >
                  {diff.name}
                </button>
              ))}
            </div>
          </div>

          {/* Start Button */}
          <button
            onClick={() => onStart(config)}
            className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2"
          >
            <Shuffle className="w-5 h-5" />
            Start Practice
          </button>
        </div>
      </div>
    </div>
  );
};

// Mock question generator
const generateMockQuestions = (config) => {
  const questions = [];
  for (let i = 0; i < config.count; i++) {
    questions.push({
      id: `q-${Date.now()}-${i}`,
      topic: 'Individual Taxation',
      subtopic: 'Capital Gains',
      difficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)],
      question: `Question ${i + 1}: A taxpayer sold stock for $15,000 that was purchased 2 years ago for $10,000. The taxpayer is in the 24% tax bracket. What is the amount of tax on this gain?`,
      choices: [
        '$750 (15% × $5,000)',
        '$1,200 (24% × $5,000)',
        '$1,000 (20% × $5,000)',
        '$500 (10% × $5,000)'
      ],
      correctAnswer: 0,
      explanation: 'Long-term capital gains (assets held more than 1 year) are taxed at preferential rates. For taxpayers in the 24% ordinary income bracket, long-term capital gains are taxed at 15%. The gain is $15,000 - $10,000 = $5,000. Tax = 15% × $5,000 = $750.'
    });
  }
  return questions;
};

export default Practice;
