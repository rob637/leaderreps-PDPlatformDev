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

  const [isEmailSubmitting, setIsEmailSubmitting] = useState(false);
  const [emailSubmitState, setEmailSubmitState] = useState('idle');

  const [isSmsSubmitting, setIsSmsSubmitting] = useState(false);
  const [smsSubmitState, setSmsSubmitState] = useState('idle');

  const handleStart = useCallback(() => {
    setStage('assessment');
  }, []);

  const handleAssessmentComplete = useCallback((finalAnswers) => {
    setAnswers(finalAnswers);
    const calculatedResults = calculateResults(finalAnswers);
    setResults(calculatedResults);
    setEmailSubmitState('idle');
    setSmsSubmitState('idle');
    setStage('results');
  }, []);

  const handleEmailSubmit = useCallback(
    async (submittedEmail, firstName = '') => {
      setIsEmailSubmitting(true);
      setEmailSubmitState('idle');

      try {
        const response = await fetch(
          `${FUNCTION_URL}/analyzeAccountabilityAssessment`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: submittedEmail,
              firstName,
              answers,
              results,
            }),
          },
        );

        if (!response.ok) {
          throw new Error('Failed to submit email.');
        }

        setEmailSubmitState('success');
      } catch (error) {
        console.error('Failed to send accountability resources:', error);
        setEmailSubmitState('error');
      }

      setIsEmailSubmitting(false);
    },
    [answers, results],
  );

  const handleSmsSubmit = useCallback(
    async ({ phone, email, smsConsent, consentText, source }) => {
      setIsSmsSubmitting(true);
      setSmsSubmitState('idle');

      try {
        const response = await fetch(`${FUNCTION_URL}/submitSmsOptIn`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone,
            email,
            smsConsent,
            consentText,
            source: source || 'accountability-assessment-results',
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to subscribe to SMS.');
        }

        setSmsSubmitState('success');
      } catch (error) {
        console.error('Failed to record SMS opt-in:', error);
        setSmsSubmitState('error');
      }

      setIsSmsSubmitting(false);
    },
    [],
  );

  const handleRestart = useCallback(() => {
    setStage('landing');
    setAnswers([]);
    setResults(null);
    setEmailSubmitState('idle');
    setSmsSubmitState('idle');
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
            onSmsSubmit={handleSmsSubmit}
            isEmailSubmitting={isEmailSubmitting}
            isSmsSubmitting={isSmsSubmitting}
            emailSubmitState={emailSubmitState}
            smsSubmitState={smsSubmitState}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
