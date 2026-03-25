import { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import Landing from './components/Landing';
import CalculatorFlow from './components/CalculatorFlow';
import EmailCapture from './components/EmailCapture';
import Results from './components/Results';
import { calculateROI } from './data/calculations';

// Firebase function URL (production)
const FUNCTION_URL = 'https://us-central1-leaderreps-prod.cloudfunctions.net';

function App() {
  const [stage, setStage] = useState('landing'); // landing | calculator | email | results
  const [inputs, setInputs] = useState(null);
  const [results, setResults] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [contactInfo, setContactInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleStart = useCallback(() => {
    setStage('calculator');
  }, []);

  const handleCalculatorComplete = useCallback((calculatorInputs) => {
    setInputs(calculatorInputs);
    const calculatedResults = calculateROI(calculatorInputs);
    setResults(calculatedResults);
    setStage('email');
  }, []);

  const handleEmailSubmit = useCallback(async (contact) => {
    setContactInfo(contact);
    setIsLoading(true);

    try {
      // Call Cloud Function for AI insights and lead capture
      const response = await fetch(`${FUNCTION_URL}/processROICalculator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: contact.email,
          firstName: contact.firstName,
          lastName: contact.lastName,
          company: contact.company,
          title: contact.title,
          inputs,
          results,
        }),
      });

      const data = await response.json();
      
      if (data.aiInsights) {
        setAiInsights(data.aiInsights);
      }
    } catch (error) {
      console.error('Failed to process:', error);
      // Continue anyway - they'll still see results
    }

    setIsLoading(false);
    setStage('results');
  }, [inputs, results]);

  const handleRestart = useCallback(() => {
    setStage('landing');
    setInputs(null);
    setResults(null);
    setAiInsights(null);
    setContactInfo(null);
  }, []);

  return (
    <div className="min-h-screen">
      <AnimatePresence mode="wait">
        {stage === 'landing' && (
          <Landing key="landing" onStart={handleStart} />
        )}
        
        {stage === 'calculator' && (
          <CalculatorFlow 
            key="calculator" 
            onComplete={handleCalculatorComplete}
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
            inputs={inputs}
            results={results}
            aiInsights={aiInsights}
            contact={contactInfo}
            onRestart={handleRestart}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
