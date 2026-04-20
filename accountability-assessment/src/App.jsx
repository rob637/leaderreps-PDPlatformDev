import { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import Landing from './components/Landing';
import AssessmentFlow from './components/AssessmentFlow';
import Results from './components/Results';
import { calculateResults } from './data/questions';

// Firebase function URL (production)
const FUNCTION_URL = 'https://us-central1-leaderreps-prod.cloudfunctions.net';

function App() {
  const [stage, setStage] = useState('landing'); // landing | assessment | results
  const [answers, setAnswers] = useState([]);
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [submitState, setSubmitState] = useState('idle');

  const handleStart = useCallback(() => {
    setStage('assessment');
  }, []);

  const handleAssessmentComplete = useCallback((finalAnswers) => {
    setAnswers(finalAnswers);
    const calculatedResults = calculateResults(finalAnswers);
    setResults(calculatedResults);
    setSubmitState('idle');
    setStage('results');
  }, []);

  const handleEmailSubmit = useCallback(async (submittedEmail, firstName = '', smsOptIn = {}) => {
    setIsLoading(true);
    setSubmitState('idle');

    try {
      const response = await fetch(`${FUNCTION_URL}/analyzeAccountabilityAssessment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: submittedEmail,
          firstName,
          answers,
          results,
          // Optional A2P 10DLC SMS opt-in payload (only present when user checked consent box)
          ...smsOptIn,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit email.');
      }

      setSubmitState('success');
    } catch (error) {
      console.error('Failed to send accountability resources:', error);
      setSubmitState('error');
    }

    setIsLoading(false);
  }, [answers, results]);

  const handleRestart = useCallback(() => {
    setStage('landing');
    setAnswers([]);
    setResults(null);
    setSubmitState('idle');
  }, []);

  return (
    <div className="min-h-screen">
      <AnimatePresence mode="wait">
        {stage === 'landing' && (
          <Landing key="landing" onStart={handleStart} />
        )}
        
        {stage === 'assessment' && (
          <AssessmentFlow 
            key="assessment" 
            onComplete={handleAssessmentComplete}
          />
        )}

        {stage === 'results' && (
          <Results 
            key="results"
            results={results}
            onRestart={handleRestart}
            onEmailSubmit={handleEmailSubmit}
            isSubmitting={isLoading}
            submitState={submitState}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
