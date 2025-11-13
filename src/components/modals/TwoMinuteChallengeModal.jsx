// src/components/modals/TwoMinuteChallengeModal.jsx

import React, { useState, useMemo } from 'react';
import { X, Zap, CheckCircle, CornerRightUp, AlertTriangle } from 'lucide-react';
import { useAppServices } from '../../services/useAppServices.jsx';

const COLORS = {
  NAVY: '#002E47', TEAL: '#47A88D', BLUE: '#2563EB', ORANGE: '#E04E1B', OFF_WHITE: '#FFFFFF',
};

// --- ENHANCEMENT: QUICK CHALLENGE CATALOG DELETED (Now loaded via service context) ---
// Fallback array for safety if service data hasn't loaded or is empty
const QUICK_CHALLENGE_FALLBACK = [
    { rep: "Take one deep, deliberate breath (T1 - Fallback)", tier: 'T1' },
    { rep: "Send a thank-you Slack (T4 - Fallback)", tier: 'T4' },
];


const Button = ({ children, onClick, disabled = false, className = '', ...rest }) => (
    <button {...rest} onClick={onClick} disabled={disabled} className={`px-6 py-3 rounded-xl font-semibold transition-all shadow-lg text-white flex items-center justify-center ${className} ${disabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}>
      {children}
    </button>
);

// --- MODAL COMPONENT (Feature 3: 2-Minute Challenge Mode) ---
const TwoMinuteChallengeModal = ({ isVisible, onClose, sourceScreen, onLogSuccess }) => {
    // CRITICAL FIX: Destructure the service data including the challenge catalog
    const { updateCommitmentData, navigate, QUICK_CHALLENGE_CATALOG } = useAppServices();

    const [isLogging, setIsLogging] = useState(false);
    const [logStatus, setLogStatus] = useState(null); // 'success' or 'error'
    const [journalNote, setJournalNote] = useState(''); // Feature 4: Journal note capture
    
    // Use service data for the catalog, falling back if not ready
    const catalog = QUICK_CHALLENGE_CATALOG || QUICK_CHALLENGE_FALLBACK;

    // Feature 3: Randomly select a new rep every time the modal is rendered/made visible
    const randomRep = useMemo(() => {
        if (catalog.length === 0) return QUICK_CHALLENGE_FALLBACK[0];
        const randomIndex = Math.floor(Math.random() * catalog.length);
        return catalog[randomIndex];
    }, [catalog]); // Rerun selection when modal visibility changes

    if (!isVisible) return null;

    const handleLog = async () => {
        setIsLogging(true);
        setLogStatus(null);
        
        // --- LOGIC FOR QUICK LOG ---
        const newCommitment = {
            id: `quick-log-${Date.now()}`,
            text: randomRep.rep, 
            status: 'Committed',
            isCustom: true,
            linkedGoal: `Momentum Rep (Quick Log)`,
            linkedTier: randomRep.tier, 
            targetColleague: 'Immediate/System',
            isQuickLog: true,
            note: journalNote, // Feature 4: Save journal note
        };

        try {
            // CRITICAL FIX: Correct spread syntax to properly update active_commitments
            await updateCommitmentData(data => ({
                ...data, // Spread data first to preserve other fields
                active_commitments: [ ...(data?.active_commitments || []), newCommitment ],
            }));
            
            setLogStatus('success');
            onLogSuccess(newCommitment); // Trigger parent micro-celebration/reflection
            
            // Navigate the user back to the Scorecard if they initiated this from the Dashboard
            setTimeout(() => {
                if (sourceScreen === 'dashboard' && navigate) {
                    navigate('daily-practice'); 
                }
                onClose(); // Close the modal
            }, 1500); 

        } catch (e) {
            console.error("Failed to log 2-minute challenge:", e);
            setLogStatus('error');
            setIsLogging(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"> 
            <div className={`relative bg-[${COLORS.OFF_WHITE}] rounded-xl shadow-2xl w-full max-w-lg p-8 text-center border-t-8 border-[${COLORS.BLUE}]`}>
                <button 
                    onClick={onClose} // CRITICAL FIX: Wire the button to the handler
                    disabled={isLogging} 
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
                >
                    <X className="w-6 h-6" />
                </button>

                <Zap className={`w-12 h-12 text-[${COLORS.BLUE}] mx-auto mb-4`} />
                <h3 className="text-2xl font-extrabold text-[#002E47] mb-2">Grab a Micro-Action Rep</h3>
                <p className="text-lg text-gray-600 mb-6">Frictionless training for momentum! Complete this action quickly (Feature 3).</p>

                <div className={`p-4 rounded-xl border-2 mb-6 ${logStatus === 'success' ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-100'}`}>
                    <p className='text-sm font-semibold text-gray-700 mb-1'>Today's Micro-Action ({randomRep.tier}):</p>
                    <p className={`text-xl font-bold text-left ${logStatus === 'success' ? 'text-green-600' : 'text-[#002E47]'}`}>
                        <CornerRightUp className='w-5 h-5 inline mr-2'/> {randomRep.rep}
                    </p>
                </div>
                
                {/* Feature 4: Journal Note Capture */}
                <textarea
                    value={journalNote}
                    onChange={(e) => setJournalNote(e.target.value)}
                    placeholder="Optional journal note: What did I notice? (Feature 4)"
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-[#47A88D] focus:border-[#47A88D] h-16 text-gray-800 mb-4"
                    disabled={isLogging || logStatus === 'success'}
                />

                {logStatus === 'success' ? (
                    <div className="flex items-center justify-center p-3 text-white rounded-xl bg-green-500 font-bold">
                        <CheckCircle className="w-5 h-5 mr-2" /> Nice Rep! Logged successfully.
                    </div>
                ) : (
                    <Button 
                        onClick={handleLog} 
                        disabled={isLogging}
                        className="w-full text-lg bg-[#2563EB] hover:bg-[#1E40AF]"
                    >
                        {isLogging ? 'Logging...' : 'I Did It! Log Rep Now'}
                    </Button>
                )}
                
                {logStatus === 'error' && (
                    <p className="text-sm text-red-500 mt-3 flex items-center justify-center">
                        <AlertTriangle className='w-4 h-4 mr-1'/> Log failed. Check active reps and try again.
                    </p>
                )}
                
                <button onClick={onClose} disabled={isLogging} className='text-sm text-gray-500 mt-4 hover:text-gray-700 block w-full'>
                    Close / Skip Challenge
                </button>
            </div>
        </div>
    );
};

export default TwoMinuteChallengeModal;