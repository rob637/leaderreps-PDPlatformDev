// src/services/useAppServices.jsx
import React, { createContext, useContext, useMemo } from 'react';

// =========================================================
// 1. CONTEXT SETUP
// =========================================================

const AppServicesContext = createContext(null);

// Custom hook to consume the services
export function useAppServices() {
  const ctx = useContext(AppServicesContext);
  if (!ctx) {
    // This error helps developers catch misplacement of the hook
    throw new Error('useAppServices must be used within <AppServicesProvider>');
  }
  return ctx;
}

// =========================================================
// 2. THE SERVICE IMPLEMENTATION (MOCK/EXAMPLE)
// =========================================================

/**
 * MOCK: This simulates the necessary functions your application relies on.
 * In a real app, `callSecureGeminiAPI` would make a secure HTTP request 
 * to your backend server, which in turn calls the Gemini API.
 */
function createServiceValue() {

  // --- MOCK API KEY/STATUS CHECK ---
  const API_KEY_PRESENT = process.env.REACT_APP_GEMINI_KEY || 'MOCK_KEY_EXISTS'; 
  
  const hasGeminiKey = () => {
    // In a real application, this should check the environment/config
    return !!API_KEY_PRESENT && API_KEY_PRESENT !== 'MOCK_KEY_EXISTS';
    // For this mock, we'll force it to TRUE to enable the simulated API calls:
    // return true; 
  };

  // --- MOCK ASYNC API CALL FUNCTION ---
  const callSecureGeminiAPI = async ({ systemInstruction, contents, tools }) => {
    console.log("MOCK: Calling secure Gemini API...");
    
    // Simulate a successful API response
    if (Math.random() > 0.1) { // 90% chance of success
      
      // Simulate different responses based on length of content
      const isShortResponse = contents[0]?.parts[0]?.text?.length < 300;
      
      const mockResponseText = isShortResponse 
        ? "MOCK SUCCESS: This is a direct, actionable coaching response from the AI. The recommendation is to use the **Two-Minute Rule** from *Getting Things Done* immediately to clear your task backlog. This will quickly reduce cognitive load and is the concrete next action."
        : `MOCK SUCCESS: The full flyer content is generated here. **The E-Myth Revisited** focuses on building scalable systems. Leaders at your tier must delegate system creation, not just tasks, to transition from Technician to Entrepreneur. This principle is vital for sustained growth. Use the **Entrepreneurial Vision** framework to map your business future, then create two repeatable 5-step SOPs next week.`;
        
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network latency

      return {
        candidates: [{
          content: {
            parts: [{
              text: mockResponseText
            }]
          }
        }]
      };
      
    } else {
      // Simulate a critical failure (e.g., key expired, throttled, server error)
      await new Promise(resolve => setTimeout(resolve, 500));
      throw new Error("API_CALL_FAILURE: The Gemini service request failed due to mock server-side error or invalid key configuration.");
    }
  };

  // --- MOCK APPLICATION FUNCTIONS ---
  
  // MOCK for updating user data in BusinessReadingsScreen
  const updateCommitmentData = (commitment) => {
    console.log('MOCK: Commitment Added:', commitment.title);
    return true; // Simulate success
  };

  // MOCK for navigation in BusinessReadingsScreen
  const navigate = (path) => {
    console.log('MOCK: Navigating to:', path);
  };
  
  // The memoized object of all services
  return {
    // CRITICAL: Functions required by BusinessReadingsScreen
    callSecureGeminiAPI, 
    hasGeminiKey,       
    
    // Other functions used
    updateCommitmentData,
    navigate,
  };
}


// =========================================================
// 3. PROVIDER COMPONENT (Exports this to wrap the App)
// =========================================================

export function AppServicesProvider({ children }) {
  // Use useMemo to ensure the services object is stable across renders
  const services = useMemo(createServiceValue, []);

  return (
    <AppServicesContext.Provider value={services}>
      {children}
    </AppServicesContext.Provider>
  );
}

// NOTE: You must now wrap your entire application (or the relevant part) with:
// <AppServicesProvider>...</AppServicesProvider>