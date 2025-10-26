// src/components/screens/DailyPractice.jsx - Updated for Logging

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';
import { ArrowLeft, CheckCircle, Loader, MessageSquare, Save, Target, User, Zap, Archive } from 'lucide-react';
// --- NEW: Firestore Imports ---
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/* =========================================================
   COLORS & UI COMPONENTS (Simplified - Unchanged)
========================================================= */
const COLORS = { NAVY: '#002E47', TEAL: '#47A88D', ORANGE: '#E04E1B', GREEN: '#10B981', LIGHT_GRAY: '#FCFCFA', SUBTLE: '#E5E7EB', TEXT: '#002E47', MUTED: '#4B5355'};
const Button = ({ children, onClick, disabled = false, variant = 'primary', className = '', ...rest }) => { /* ... unchanged ... */ let baseStyle = "px-6 py-3 rounded-xl font-semibold transition-all shadow-lg focus:outline-none focus:ring-4 text-white flex items-center justify-center gap-2"; if (variant === 'primary') { baseStyle += ` bg-[${COLORS.TEAL}] hover:bg-[#349881] focus:ring-[${COLORS.TEAL}]/50`; } else if (variant === 'secondary') { baseStyle += ` bg-[${COLORS.ORANGE}] hover:bg-[#C33E12] focus:ring-[${COLORS.ORANGE}]/50`; } else if (variant === 'outline') { baseStyle = `px-6 py-3 rounded-xl font-semibold transition-all shadow-md border-2 border-[${COLORS.TEAL}] text-[${COLORS.TEAL}] hover:bg-[${COLORS.TEAL}]/10 focus:ring-4 focus:ring-[${COLORS.TEAL}]/50 bg-[${COLORS.LIGHT_GRAY}] flex items-center justify-center gap-2`; } if (disabled) { baseStyle = "px-6 py-3 rounded-xl font-semibold bg-gray-300 text-gray-500 cursor-not-allowed shadow-inner transition-none flex items-center justify-center gap-2"; } return (<button {...rest} onClick={onClick} disabled={disabled} className={`${baseStyle} ${className}`}>{children}</button>); };
const Card = ({ children, title, icon: Icon, className = '', accent = 'TEAL' }) => { /* ... unchanged ... */ const accentColor = COLORS[accent] || COLORS.TEAL; return ( <div className={`relative p-6 rounded-2xl border-2 shadow-2xl bg-white text-left ${className}`} style={{ borderColor: COLORS.SUBTLE, color: COLORS.NAVY }}> <span style={{ position:'absolute', top:0, left:0, right:0, height:6, background: accentColor, borderTopLeftRadius:14, borderTopRightRadius:14 }} /> {Icon && (<div className="w-10 h-10 rounded-lg flex items-center justify-center border mb-3" style={{ borderColor: COLORS.SUBTLE, background: COLORS.LIGHT_GRAY }}><Icon className="w-5 h-5" style={{ color: accentColor }} /></div>)} {title && <h2 className="text-xl font-extrabold mb-2" style={{ color: COLORS.NAVY }}>{title}</h2>} {children} </div> ); };
// useReflectionParser is no longer needed for initialization
// const useReflectionParser = (journalString) => { /* ... unchanged ... */ };


/* =========================================================
   MAIN SCREEN COMPONENT: DailyReflectionRep
========================================================= */

export default function DailyPracticeScreen() {
  // --- UPDATED: Added db and userId ---
  const { commitmentData, updateCommitmentData, navigate, isLoading, db, userId } = useAppServices();
  const [isSaving, setIsSaving] = useState(false);
  const [isSavedConfirmation, setIsSavedConfirmation] = useState(false);

  // --- UPDATED: Initialize state to empty strings ---
  const [did, setDid] = useState('');
  const [noticed, setNoticed] = useState('');
  const [tryDiff, setTryDiff] = useState('');
  const [identity, setIdentity] = useState('');

  // --- REMOVED: useEffect hook that synced state from commitmentData ---
  // useEffect(() => { ... }, [initialReflection]);

  const handleSaveReflection = async () => {
    // Basic validation
    if (!did.trim() && !noticed.trim() && !tryDiff.trim() && !identity.trim()) {
        alert("Please fill in at least one reflection field.");
        return;
    }
    if (!db || !userId) {
        alert("Error: Database connection not available. Cannot save log.");
        console.error("Firestore db or userId is missing from useAppServices");
        return;
    }

    setIsSaving(true);
    setIsSavedConfirmation(false);

    // --- NEW: Prepare data for history log ---
    const reflectionEntry = {
      did: did.trim(),
      noticed: noticed.trim(),
      tryDiff: tryDiff.trim(),
      identity: identity.trim(),
      timestamp: serverTimestamp(), // Use Firestore server timestamp
      date: new Date().toISOString().split('T')[0] // Store simple YYYY-MM-DD for easy querying/display
    };

    try {
      // --- NEW: Save entry to the subcollection ---
      const historyCollectionRef = collection(db, `user_commitments/${userId}/reflection_history`);
      await addDoc(historyCollectionRef, reflectionEntry);

      // --- OLD LOGIC (REMOVED/COMMENTED): Update main journal field ---
      /*
      const newJournalString = [
        `Did: ${did.trim()}`,
        `Noticed: ${noticed.trim()}`,
        `Try: ${tryDiff.trim()}`,
        `Identity: ${identity.trim()}`
      ].join('\n');
      await updateCommitmentData({ reflection_journal: newJournalString });
      */
      // Optionally clear the main journal field if it exists after saving to history
      // await updateCommitmentData({ reflection_journal: '' }); // Uncomment if needed

      // Show confirmation AND clear fields
      setIsSavedConfirmation(true);
      setDid('');
      setNoticed('');
      setTryDiff('');
      setIdentity('');

      setTimeout(() => setIsSavedConfirmation(false), 3000); // Show confirmation briefly
      console.log("Daily Reflection saved to history log.");

    } catch (e) {
      console.error("Failed to save reflection to history:", e);
      alert("Failed to save reflection log. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Check if any field has been filled
  const canSave = did.trim() || noticed.trim() || tryDiff.trim() || identity.trim();

  if (isLoading && !commitmentData) { // Adjusted loading check
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Loader className="animate-spin text-[#47A88D] h-12 w-12" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-extrabold text-[#002E47] mb-2 flex items-center gap-3">
        <MessageSquare className="text-[#47A88D]" /> Daily Reflection Rep
      </h1>
      <p className="text-lg text-gray-600 mb-8">
        Take 1 minute at the end of your day to capture key insights. Consistency turns action into growth.
      </p>

      <Card title="1-Minute Reflection (3Q+1)" icon={Zap} accent="NAVY">
        {/* Form fields (textarea, input) remain unchanged */}
        <div className="space-y-6">
          {/* Question 1: What I did */}
          <div>
            <label className="block text-lg font-semibold text-[#002E47] mb-2">
              <span className="text-[#47A88D]">1.</span> What did I <strong className='text-[#47A88D]'>do</strong> today that made a difference?
            </label>
            <textarea value={did} onChange={(e) => setDid(e.target.value)} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#47A88D]" rows="3" placeholder="Behavior + Impact (e.g., Gave clear feedback to Alex - saw him light up.)"/>
          </div>
          {/* Question 2: What I noticed */}
          <div>
            <label className="block text-lg font-semibold text-[#002E47] mb-2">
              <span className="text-[#47A88D]">2.</span> What did I <strong className='text-[#47A88D]'>notice</strong> (in myself or others)?
            </label>
            <textarea value={noticed} onChange={(e) => setNoticed(e.target.value)} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#47A88D]" rows="3" placeholder="Awareness insight (e.g., I over-explained again in the team huddle.)"/>
          </div>
          {/* Question 3: What I'll try */}
          <div>
            <label className="block text-lg font-semibold text-[#002E47] mb-2">
              <span className="text-[#47A88D]">3.</span> What will I <strong className='text-[#47A88D]'>try</strong> differently tomorrow?
            </label>
            <textarea value={tryDiff} onChange={(e) => setTryDiff(e.target.value)} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#47A88D]" rows="3" placeholder="Forward action (e.g., Let silence do the work next time.)"/>
          </div>
          {/* Identity Cue */}
          <div>
            <label className="block text-lg font-semibold text-[#002E47] mb-2">
              <User className="inline-block w-5 h-5 mr-1 text-[#47A88D]" /> "I'm the kind of leader who..."
            </label>
            <input type="text" value={identity} onChange={(e) => setIdentity(e.target.value)} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#47A88D]" placeholder="Micro-affirmation (e.g., trusts my team to think.)"/>
          </div>
        </div>

        {/* Save Button & Confirmation (Unchanged) */}
        <div className="mt-8 pt-6 border-t border-gray-200 flex items-center gap-4">
          <Button onClick={handleSaveReflection} disabled={isSaving || !canSave} variant="primary" className="flex-1 text-lg">
            {isSaving ? <Loader className="animate-spin w-5 h-5 mr-2" /> : <Save className="w-5 h-5 mr-2" />}
            {isSaving ? 'Saving...' : 'Save Reflection to Log'} {/* Updated Button Text */}
          </Button>
          {isSavedConfirmation && ( <span className='text-sm font-bold text-green-600 flex items-center'><CheckCircle className='w-5 h-5 mr-1'/> Saved 🎉</span> )}
        </div>
      </Card>

      {/* Helper Text (Unchanged) */}
      <p className="text-sm text-gray-500 mt-6 text-center italic">
          <strong>Tip:</strong> Complete this reflection rep immediately after your last task or meeting of the day.
      </p>

      {/* View Log Button (Unchanged functionality, relies on App.jsx route) */}
      <div className="mt-8 pt-8 border-t border-gray-200 flex justify-center">
        <Button onClick={() => navigate('reflection-log')} variant="outline" className="text-md" >
          <Archive className="w-5 h-5 mr-2" />
          View Reflection Log
        </Button>
      </div>

    </div>
  );
}