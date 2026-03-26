import { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import Landing from './components/Landing';
import AssessmentFlow from './components/AssessmentFlow';
import EmailCapture from './components/EmailCapture';
import Results from './components/Results';
import { calculateResults } from './data/questions';

// Firebase function URL (production)
const FUNCTION_URL = 'https://us-central1-leaderreps-prod.cloudfunctions.net';

function App() {
  const [stage, setStage] = useState('landing'); // landing | assessment | email | results
  const [answers, setAnswers] = useState([]);
  const [results, setResults] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleStart = useCallback(() => {
    setStage('assessment');
  }, []);

  const handleAssessmentComplete = useCallback((finalAnswers) => {
    setAnswers(finalAnswers);
    const calculatedResults = calculateResults(finalAnswers);
    setResults(calculatedResults);
    setStage('email');
  }, []);

  const handleEmailSubmit = useCallback(async (submittedEmail, firstName) => {
    setEmail(submittedEmail);
    setIsLoading(true);

    try {
      // Call Cloud Function for AI analysis and email
      const response = await fetch(`${FUNCTION_URL}/analyzeLeadershipAssessment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: submittedEmail,
          firstName,
          answers,
          results,
        }),
      });

      const data = await response.json();
      
      if (data.aiInsights) {
        setAiInsights(data.aiInsights);
      }
    } catch (error) {
      console.error('Failed to get AI insights:', error);
      // Continue anyway - they'll still see basic results
    }

    setIsLoading(false);
    setStage('results');
  }, [answers, results]);

  const handleRestart = useCallback(() => {
    setStage('landing');
    setAnswers([]);
    setResults(null);
    setAiInsights(null);
    setEmail('');
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
        
        {stage === 'email' && (
          <EmailCapture 
            key="email" 
            results={results}
            onSubmit={handleEmailSubmit}
            isLoading={isLoading}
          />
        )}
        
        {stage === 'results' && (
          <Results 
            key="results"
            results={results}
            aiInsights={aiInsights}
            email={email}
            onRestart={handleRestart}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
