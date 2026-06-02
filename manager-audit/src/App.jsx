import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import Landing from './components/Landing';
import AssessmentFlow from './components/AssessmentFlow';
import Results from './components/Results';
import { calculateResults } from './data/questions';

const FUNCTION_URL = 'https://us-central1-leaderreps-prod.cloudfunctions.net';

export default function App() {
  const [stage, setStage] = useState('landing'); // landing | assessment | results
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleStart = () => {
    setAnswers({});
    setResults(null);
    setSubmitted(false);
    setSubmitError(null);
    setStage('assessment');
  };

  const handleAssessmentComplete = (finalAnswers) => {
    const computed = calculateResults(finalAnswers);
    setAnswers(finalAnswers);
    setResults(computed);
    setStage('results');
  };

  const handleEmailSubmit = async ({ firstName, email, company }) => {
    if (!results) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const response = await fetch(`${FUNCTION_URL}/analyzeManagerAudit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: (firstName || '').trim(),
          email: (email || '').trim(),
          company: (company || '').trim(),
          answers,
          results,
        }),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(text || 'Could not send results.');
      }

      setSubmitted(true);
    } catch (err) {
      console.error('analyzeManagerAudit error', err);
      setSubmitError(
        err?.message ||
          'We hit a snag sending your results. Please try again in a moment.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetake = () => {
    setAnswers({});
    setResults(null);
    setSubmitted(false);
    setSubmitError(null);
    setStage('landing');
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#002E47]">
      <AnimatePresence mode="wait">
        {stage === 'landing' && (
          <Landing key="landing" onStart={handleStart} />
        )}
        {stage === 'assessment' && (
          <AssessmentFlow
            key="assessment"
            onComplete={handleAssessmentComplete}
            onBack={() => setStage('landing')}
          />
        )}
        {stage === 'results' && results && (
          <Results
            key="results"
            results={results}
            onEmailSubmit={handleEmailSubmit}
            submitting={submitting}
            submitError={submitError}
            submitted={submitted}
            onRetake={handleRetake}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
