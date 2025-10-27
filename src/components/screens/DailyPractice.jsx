// src/components/screens/DailyPractice.jsx (Refactored for History Log & Consistency)

import React, { useState, useEffect, useMemo, useCallback } from 'react';
// --- Core Services & Context ---
import { useAppServices } from '../../services/useAppServices.jsx'; // cite: useAppServices.jsx

// --- Icons ---
import { ArrowLeft, CheckCircle, Loader, MessageSquare, Save, Target, User, Zap, Archive } from 'lucide-react';

// --- Firestore Imports (for saving reflections) ---
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'; // cite: App.jsx (similar usage)

/* =========================================================
   PALETTE & UI COMPONENTS (Standardized)
========================================================= */
// --- Primary Color Palette ---
const COLORS = { NAVY: '#002E47', TEAL: '#47A88D', BLUE: '#2563EB', ORANGE: '#E04E1B', GREEN: '#10B981', AMBER: '#F5A800', RED: '#E04E1B', LIGHT_GRAY: '#FCFCFA', OFF_WHITE: '#FFFFFF', SUBTLE: '#E5E7EB', TEXT: '#374151', MUTED: '#4B5355', PURPLE: '#7C3AED', BG: '#F9FAFB' }; // cite: App.jsx

// --- Standardized UI Components (Matches Dashboard/Dev Plan) ---
const Button = ({ children, onClick, disabled = false, variant = 'primary', className = '', size = 'md', ...rest }) => { /* ... Re-use exact Button definition from Dashboard.jsx ... */
    let baseStyle = `inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed`;
    if (size === 'sm') baseStyle += ' px-4 py-2 text-sm'; else if (size === 'lg') baseStyle += ' px-8 py-4 text-lg'; else baseStyle += ' px-6 py-3 text-base'; // Default 'md'
    if (variant === 'primary') baseStyle += ` bg-[${COLORS.TEAL}] text-white shadow-lg hover:bg-[#349881] focus:ring-[${COLORS.TEAL}]/50`;
    else if (variant === 'secondary') baseStyle += ` bg-[${COLORS.ORANGE}] text-white shadow-lg hover:bg-[#C312] focus:ring-[${COLORS.ORANGE}]/50`;
    else if (variant === 'outline') baseStyle += ` bg-[${COLORS.OFF_WHITE}] text-[${COLORS.TEAL}] border-2 border-[${COLORS.TEAL}] shadow-md hover:bg-[${COLORS.TEAL}]/10 focus:ring-[${COLORS.TEAL}]/50`;
    else if (variant === 'nav-back') baseStyle += ` bg-white text-gray-700 border border-gray-300 shadow-sm hover:bg-gray-100 focus:ring-gray-300/50 px-4 py-2 text-sm`;
    else if (variant === 'ghost') baseStyle += ` bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-300/50 px-3 py-1.5 text-sm`;
    if (disabled) baseStyle += ' bg-gray-300 text-gray-500 shadow-inner border-transparent hover:bg-gray-300';
    return (<button {...rest} onClick={onClick} disabled={disabled} className={`${baseStyle} ${className}`}>{children}</button>);
};
const Card = ({ children, title, icon: Icon, className = '', accent = 'NAVY' }) => { /* ... Re-use exact Card definition from Dashboard.jsx ... */
    const accentColor = COLORS[accent] || COLORS.NAVY;
    return (
        <div className={`relative p-6 rounded-2xl border-2 shadow-xl hover:shadow-lg transition-all duration-300 text-left ${className}`} style={{ background: 'linear-gradient(180deg,#FFFFFF, #FCFCFA)', borderColor: COLORS.SUBTLE, color: COLORS.NAVY }}>
            <span style={{ position:'absolute', top:0, left:0, right:0, height:6, background: accentColor, borderTopLeftRadius:14, borderTopRightRadius:14 }} />
            {Icon && title && ( <div className="flex items-center gap-3 mb-4"> <div className="w-10 h-10 rounded-lg flex items-center justify-center border flex-shrink-0" style={{ borderColor: COLORS.SUBTLE, background: COLORS.LIGHT_GRAY }}> <Icon className="w-5 h-5" style={{ color: accentColor }} /> </div> <h2 className="text-xl font-extrabold" style={{ color: COLORS.NAVY }}>{title}</h2> </div> )}
            {!Icon && title && <h2 className="text-xl font-extrabold mb-4 border-b pb-2" style={{ color: COLORS.NAVY, borderColor: COLORS.SUBTLE }}>{title}</h2>}
            <div className={Icon || title ? '' : ''}>{children}</div>
        </div>
    );
};
const LoadingSpinner = ({ message = "Loading..." }) => ( /* ... Re-use definition from DevelopmentPlan.jsx ... */
    <div className="min-h-screen flex items-center justify-center" style={{ background: COLORS.BG }}> <div className="flex flex-col items-center"> <Loader className="animate-spin h-12 w-12 mb-3" style={{ color: COLORS.TEAL }} /> <p className="font-semibold" style={{ color: COLORS.NAVY }}>{message}</p> </div> </div>
);

// --- Removed unused useReflectionParser hook ---

/* =========================================================
   MAIN SCREEN COMPONENT: DailyPracticeScreen (Reflection Rep)
========================================================= */

/**
 * DailyPracticeScreen Component
 * Provides a structured form for users to complete their daily reflection rep (Did, Noticed, Try, Identity).
 * Saves each reflection as a new entry in a Firestore subcollection (`reflection_history`).
 */
export default function DailyPracticeScreen() {
  // --- Consume Services ---
  // Get Firestore instance (db), user ID, navigation function, and loading state
  const { navigate, db, userId, isLoading: isAppLoading, error: appError } = useAppServices(); // cite: useAppServices.jsx

  // --- Local State ---
  const [isSaving, setIsSaving] = useState(false); // Loading state for save operation
  const [isSavedConfirmation, setIsSavedConfirmation] = useState(false); // Controls visibility of the "Saved" message
  // State for each reflection field, initialized to empty
  const [did, setDid] = useState('');
  const [noticed, setNoticed] = useState('');
  const [tryDiff, setTryDiff] = useState('');
  const [identity, setIdentity] = useState('');

  // --- Effect to scroll to top on mount ---
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, []);

  // --- Handler to Save Reflection to History Log ---
  const handleSaveReflection = useCallback(async () => {
    // 1. Basic Validation: Ensure at least one field is filled and DB connection exists
    if (!did.trim() && !noticed.trim() && !tryDiff.trim() && !identity.trim()) {
        alert("Please fill in at least one reflection field to save."); return;
    }
    if (!db || !userId) {
        alert("Error: Database connection unavailable. Cannot save reflection.");
        console.error("[DailyPracticeScreen] Firestore db or userId is missing."); return;
    }

    setIsSaving(true); // Set loading state
    setIsSavedConfirmation(false); // Hide previous confirmation
    console.log("[DailyPracticeScreen] Saving reflection...");

    // 2. Prepare Data Object for Firestore
    const reflectionEntry = {
      did: did.trim(),
      noticed: noticed.trim(),
      tryDiff: tryDiff.trim(),
      identity: identity.trim(),
      timestamp: serverTimestamp(), // Use Firestore server timestamp for accurate ordering // cite: App.jsx (similar usage)
      date: new Date().toISOString().split('T')[0] // Store simple YYYY-MM-DD for easy grouping/display // cite: DailyPractice.jsx (Original Logic)
    };

    try {
      // 3. Save Entry to Firestore Subcollection
      // Constructs the path: daily_practice / {userId} / reflection_history
      const historyCollectionRef = collection(db, `daily_practice/${userId}/reflection_history`); // cite: useAppServices.jsx (collection name), DailyPractice.jsx (subcollection logic)
      const savedDocRef = await addDoc(historyCollectionRef, reflectionEntry); // cite: App.jsx (similar usage)
      console.log("[DailyPracticeScreen] Reflection saved successfully to history log. Doc ID:", savedDocRef.id);

      // 4. Success Actions: Show confirmation & clear form fields
      setIsSavedConfirmation(true);
      setDid(''); setNoticed(''); setTryDiff(''); setIdentity(''); // Clear fields

      // Hide confirmation message after 3 seconds
      setTimeout(() => setIsSavedConfirmation(false), 3000);

      // --- Optional: Navigate away after save? ---
      // navigate('dashboard'); // Example: Go back to dashboard after saving

    } catch (e) {
      // 5. Error Handling
      console.error("[DailyPracticeScreen] Failed to save reflection to history:", e);
      alert("Failed to save reflection log. Please check the console and try again.");
    } finally {
      // 6. Reset Loading State
      setIsSaving(false);
    }
  }, [db, userId, did, noticed, tryDiff, identity]); // Dependencies for the callback

  // --- Derived State ---
  // Determine if the save button should be enabled (at least one field filled and not currently saving)
  const canSave = useMemo(() => (did.trim() || noticed.trim() || tryDiff.trim() || identity.trim()) && !isSaving,
    [did, noticed, tryDiff, identity, isSaving]
  );

  // --- Render Logic ---
  // Show loading spinner if app core data is loading
  if (isAppLoading) {
    return <LoadingSpinner message="Loading Daily Reflection..." />;
  }
  // Show error if app loading failed
  if (appError) {
      // Consider a more specific error component if needed
       return ( <div className="p-8 text-center text-red-600"> Error loading data: {appError.message} </div> );
  }

  return (
    // Consistent page structure and padding
    <div className="p-6 md:p-8 lg:p-10 max-w-3xl mx-auto min-h-screen" style={{ background: COLORS.BG }}>
      {/* Header */}
      <header className="mb-8 text-center md:text-left">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-2 flex items-center justify-center md:justify-start gap-3" style={{ color: COLORS.NAVY }}>
          <MessageSquare className="w-8 h-8" style={{ color: COLORS.TEAL }} /> Daily Reflection Rep
        </h1>
        <p className="text-lg text-gray-700">
          Capture key insights from today's practice. Consistency compounds growth.
        </p>
      </header>

      {/* Reflection Form Card */}
      <Card title="1-Minute Reflection (3Q+1)" icon={Zap} accent="NAVY">
        <div className="space-y-6">
          {/* Question 1: Did */}
          <div>
            <label htmlFor="did" className="block text-md font-semibold mb-2" style={{ color: COLORS.NAVY }}>
              <span className="font-bold text-lg mr-1" style={{ color: COLORS.TEAL }}>1.</span> What did I <strong style={{ color: COLORS.TEAL }}>do</strong> today that aligned with my goals?
            </label>
            <textarea id="did" value={did} onChange={(e) => setDid(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#47A88D] text-sm" // Standard input style
                      rows="3" placeholder="Specific action + impact (e.g., Used SBI framework with Sarah - conversation was productive.)" />
          </div>
          {/* Question 2: Noticed */}
          <div>
            <label htmlFor="noticed" className="block text-md font-semibold mb-2" style={{ color: COLORS.NAVY }}>
              <span className="font-bold text-lg mr-1" style={{ color: COLORS.TEAL }}>2.</span> What did I <strong style={{ color: COLORS.TEAL }}>notice</strong> (in self or others)?
            </label>
            <textarea id="noticed" value={noticed} onChange={(e) => setNoticed(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#47A88D] text-sm"
                      rows="3" placeholder="Key observation or insight (e.g., Noticed I felt defensive when my idea was challenged.)" />
          </div>
          {/* Question 3: Try */}
          <div>
            <label htmlFor="tryDiff" className="block text-md font-semibold mb-2" style={{ color: COLORS.NAVY }}>
              <span className="font-bold text-lg mr-1" style={{ color: COLORS.TEAL }}>3.</span> What will I <strong style={{ color: COLORS.TEAL }}>try</strong> differently tomorrow?
            </label>
            <textarea id="tryDiff" value={tryDiff} onChange={(e) => setTryDiff(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#47A88D] text-sm"
                      rows="3" placeholder="Concrete next step (e.g., Ask 'What makes you say that?' before reacting to challenges.)" />
          </div>
          {/* Identity Cue */}
          <div>
            <label htmlFor="identity" className="block text-md font-semibold mb-2" style={{ color: COLORS.NAVY }}>
              <User className="inline-block w-5 h-5 mr-1" style={{ color: COLORS.TEAL }} /> "I'm the kind of leader who..."
            </label>
            <input id="identity" type="text" value={identity} onChange={(e) => setIdentity(e.target.value)}
                   className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#47A88D] text-sm" // Standard input style
                   placeholder="Reinforce your identity (e.g., ...is curious under pressure.)"
                   title="Connect today's practice to your core leadership identity."/>
          </div>
        </div>

        {/* Save Button & Confirmation */}
        <div className="mt-8 pt-6 border-t border-gray-200 flex items-center gap-4">
          <Button onClick={handleSaveReflection} disabled={!canSave} variant="primary" size="lg" className="flex-1"> {/* Large primary button */}
            {isSaving ? <Loader className="animate-spin w-5 h-5 mr-2" /> : <Save className="w-5 h-5 mr-2" />}
            {isSaving ? 'Saving Reflection...' : 'Save Reflection to Log'}
          </Button>
          {/* Confirmation Message */}
          {isSavedConfirmation && (
            <span className='text-sm font-bold text-green-600 flex items-center shrink-0 animate-pulse'>
                <CheckCircle className='w-5 h-5 mr-1'/> Saved!
            </span>
          )}
        </div>
      </Card>

      {/* Helper Text */}
      <p className="text-sm text-gray-500 mt-6 text-center italic">
          Tip: Complete this reflection daily, perhaps triggered by your Habit Anchor.
      </p>

      {/* Navigation Footer */}
      <footer className="mt-10 pt-6 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
        {/* Button to View Log (Assuming 'reflection-log' route exists) */}
        <Button onClick={() => navigate('reflection-log')} variant="outline" size="sm" >
          <Archive className="w-4 h-4 mr-2" /> View Full Reflection Log
        </Button>
        {/* Button to go back to Dashboard */}
        <Button onClick={() => navigate('dashboard')} variant="nav-back" size="sm" >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to The Arena
        </Button>
      </footer>

    </div>
  );
}