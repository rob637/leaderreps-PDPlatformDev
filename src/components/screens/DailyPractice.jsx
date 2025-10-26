// src/components/screens/DailyPractice.jsx - NEW: 1-Minute Reflection Rep

import React, { useState, useEffect, useCallback, useMemo } from 'react'; // <-- FIX: Added useMemo
import { useAppServices } from '../../services/useAppServices.jsx';
import { ArrowLeft, CheckCircle, Loader, MessageSquare, Save, Target, User, Zap } from 'lucide-react';

/* =========================================================
   COLORS & UI COMPONENTS (Simplified)
========================================================= */
const COLORS = {
  NAVY: '#002E47',
  TEAL: '#47A88D',
  ORANGE: '#E04E1B',
  GREEN: '#10B981',
  LIGHT_GRAY: '#FCFCFA',
  SUBTLE: '#E5E7EB',
  TEXT: '#002E47',
  MUTED: '#4B5355',
};

const Button = ({ children, onClick, disabled = false, variant = 'primary', className = '', ...rest }) => {
  let baseStyle = "px-6 py-3 rounded-xl font-semibold transition-all shadow-lg focus:outline-none focus:ring-4 text-white flex items-center justify-center gap-2";
  if (variant === 'primary') { baseStyle += ` bg-[${COLORS.TEAL}] hover:bg-[#349881] focus:ring-[${COLORS.TEAL}]/50`; }
  else if (variant === 'secondary') { baseStyle += ` bg-[${COLORS.ORANGE}] hover:bg-[#C33E12] focus:ring-[${COLORS.ORANGE}]/50`; }
  else if (variant === 'outline') { baseStyle = `px-6 py-3 rounded-xl font-semibold transition-all shadow-md border-2 border-[${COLORS.TEAL}] text-[${COLORS.TEAL}] hover:bg-[${COLORS.TEAL}]/10 focus:ring-4 focus:ring-[${COLORS.TEAL}]/50 bg-[${COLORS.LIGHT_GRAY}] flex items-center justify-center gap-2`; }
  if (disabled) { baseStyle = "px-6 py-3 rounded-xl font-semibold bg-gray-300 text-gray-500 cursor-not-allowed shadow-inner transition-none flex items-center justify-center gap-2"; }
  return (<button {...rest} onClick={onClick} disabled={disabled} className={`${baseStyle} ${className}`}>{children}</button>);
};

const Card = ({ children, title, icon: Icon, className = '', accent = 'TEAL' }) => {
  const accentColor = COLORS[accent] || COLORS.TEAL;
  return (
    <div
      className={`relative p-6 rounded-2xl border-2 shadow-2xl bg-white text-left ${className}`}
      style={{ borderColor: COLORS.SUBTLE, color: COLORS.NAVY }}
    >
      <span style={{ position:'absolute', top:0, left:0, right:0, height:6, background: accentColor, borderTopLeftRadius:14, borderTopRightRadius:14 }} />
      {Icon && (<div className="w-10 h-10 rounded-lg flex items-center justify-center border mb-3" style={{ borderColor: COLORS.SUBTLE, background: COLORS.LIGHT_GRAY }}><Icon className="w-5 h-5" style={{ color: accentColor }} /></div>)}
      {title && <h2 className="text-xl font-extrabold mb-2" style={{ color: COLORS.NAVY }}>{title}</h2>}
      {children}
    </div>
  );
};

// Simple hook to parse the combined reflection string
const useReflectionParser = (journalString) => {
    return useMemo(() => {
        const lines = (journalString || '').split('\n');
        const findLine = (prefix) => lines.find(line => line.startsWith(prefix))?.substring(prefix.length).trim() || '';
        return {
            did: findLine('Did:'),
            noticed: findLine('Noticed:'),
            tryDiff: findLine('Try:'),
            identity: findLine('Identity:')
        };
    }, [journalString]);
};

/* =========================================================
   MAIN SCREEN COMPONENT: DailyReflectionRep
========================================================= */

export default function DailyPracticeScreen() {
  const { commitmentData, updateCommitmentData, navigate, isLoading } = useAppServices();
  const [isSaving, setIsSaving] = useState(false);
  const [isSavedConfirmation, setIsSavedConfirmation] = useState(false);

  // Parse the existing journal string into structured state
  const initialReflection = useReflectionParser(commitmentData?.reflection_journal);
  const [did, setDid] = useState(initialReflection.did);
  const [noticed, setNoticed] = useState(initialReflection.noticed);
  const [tryDiff, setTryDiff] = useState(initialReflection.tryDiff);
  const [identity, setIdentity] = useState(initialReflection.identity);

  // Update local state if the underlying data changes (e.g., after daily reset)
  useEffect(() => {
    const currentParsed = useReflectionParser(commitmentData?.reflection_journal);
    setDid(currentParsed.did);
    setNoticed(currentParsed.noticed);
    setTryDiff(currentParsed.tryDiff);
    setIdentity(currentParsed.identity);
  }, [commitmentData?.reflection_journal]);

  const handleSaveReflection = async () => {
    setIsSaving(true);
    setIsSavedConfirmation(false);

    // Combine the state back into the single string format for saving
    const newJournalString = [
      `Did: ${did.trim()}`,
      `Noticed: ${noticed.trim()}`,
      `Try: ${tryDiff.trim()}`,
      `Identity: ${identity.trim()}`
    ].join('\n');

    try {
      // Pass the complete object to updateCommitmentData
      const dataToSave = {
        reflection_journal: newJournalString
        // Include other fields from commitmentData if updateCommitmentData replaces the whole doc
        // active_commitments: commitmentData?.active_commitments || [],
        // last_reset_date: commitmentData?.last_reset_date || '',
        // resilience_log: commitmentData?.resilience_log || {},
        // history: commitmentData?.history || [],
        // last_weekly_review: commitmentData?.last_weekly_review || null,
        // weekly_review_notes: commitmentData?.weekly_review_notes || ''
      };
      await updateCommitmentData(dataToSave);
      setIsSavedConfirmation(true);
      setTimeout(() => setIsSavedConfirmation(false), 3000); // Show confirmation briefly
      console.log("Daily Reflection Saved.");
    } catch (e) {
      console.error("Failed to save reflection:", e);
      alert("Failed to save reflection. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Check if any field has been filled
  const canSave = did.trim() || noticed.trim() || tryDiff.trim() || identity.trim();

  if (isLoading) {
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

      {/* Back Button (Optional but good UX) */}
      {/* <Button onClick={() => navigate('dashboard')} variant="outline" className="mb-8 text-sm px-4 py-2">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
      </Button> */}

      <Card title="1-Minute Reflection (3Q+1)" icon={Zap} accent="NAVY">
        <div className="space-y-6">
          {/* Question 1: What I did */}
          <div>
            <label className="block text-lg font-semibold text-[#002E47] mb-2">
              <span className="text-[#47A88D]">1.</span> What did I <strong className='text-[#47A88D]'>do</strong> today that made a difference?
            </label>
            <textarea
              value={did}
              onChange={(e) => setDid(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#47A88D]"
              rows="3"
              placeholder="Behavior + Impact (e.g., Gave clear feedback to Alex - saw him light up.)"
            />
          </div>

          {/* Question 2: What I noticed */}
          <div>
            <label className="block text-lg font-semibold text-[#002E47] mb-2">
              <span className="text-[#47A88D]">2.</span> What did I <strong className='text-[#47A88D]'>notice</strong> (in myself or others)?
            </label>
            <textarea
              value={noticed}
              onChange={(e) => setNoticed(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#47A88D]"
              rows="3"
              placeholder="Awareness insight (e.g., I over-explained again in the team huddle.)"
            />
          </div>

          {/* Question 3: What I'll try */}
          <div>
            <label className="block text-lg font-semibold text-[#002E47] mb-2">
              <span className="text-[#47A88D]">3.</span> What will I <strong className='text-[#47A88D]'>try</strong> differently tomorrow?
            </label>
            <textarea
              value={tryDiff}
              onChange={(e) => setTryDiff(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#47A88D]"
              rows="3"
              placeholder="Forward action (e.g., Let silence do the work next time.)"
            />
          </div>

          {/* Identity Cue */}
          <div>
            <label className="block text-lg font-semibold text-[#002E47] mb-2">
              <User className="inline-block w-5 h-5 mr-1 text-[#47A88D]" /> "I'm the kind of leader who..."
            </label>
            <input
              type="text"
              value={identity}
              onChange={(e) => setIdentity(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#47A88D]"
              placeholder="Micro-affirmation (e.g., trusts my team to think.)"
            />
          </div>
        </div>

        {/* Save Button & Confirmation */}
        <div className="mt-8 pt-6 border-t border-gray-200 flex items-center gap-4">
          <Button
            onClick={handleSaveReflection}
            disabled={isSaving || !canSave}
            variant="primary"
            className="flex-1 text-lg"
          >
            {isSaving ? <Loader className="animate-spin w-5 h-5 mr-2" /> : <Save className="w-5 h-5 mr-2" />}
            {isSaving ? 'Saving...' : 'Save Today\'s Reflection Rep'}
          </Button>
          {isSavedConfirmation && (
            <span className='text-sm font-bold text-green-600 flex items-center'>
              <CheckCircle className='w-5 h-5 mr-1'/> Saved 🎉
            </span>
          )}
        </div>
      </Card>

        {/* Helper Text */}
        <p className="text-sm text-gray-500 mt-6 text-center italic">
            <strong>Tip:</strong> Complete this reflection rep immediately after your last task or meeting of the day.
        </p>

    </div>
  );
}