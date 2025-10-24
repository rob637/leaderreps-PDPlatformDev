// src/components/modals/TwoMinuteChallengeModal.jsx

import React, { useState } from 'react';
import { X, Zap, CheckCircle, CornerRightUp, AlertTriangle } from 'lucide-react';
import { useAppServices } from '../../services/useAppServices.jsx';

const COLORS = {
  NAVY: '#002E47', TEAL: '#47A88D', BLUE: '#2563EB', ORANGE: '#E04E1B', OFF_WHITE: '#FFFFFF',
};

const Button = ({ children, onClick, disabled = false, className = '', ...rest }) => (
    <button {...rest} onClick={onClick} disabled={disabled} className={`px-6 py-3 rounded-xl font-semibold transition-all shadow-lg text-white flex items-center justify-center ${className} ${disabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}>
      {children}
    </button>
);

const TwoMinuteChallengeModal = ({ isVisible, onClose, repText }) => {
    const { updateCommitmentData, commitmentData } = useAppServices();
    const [isLogging, setIsLogging] = useState(false);
    const [logStatus, setLogStatus] = useState(null); // 'success' or 'error'

    if (!isVisible) return null;

    const handleLog = async () => {
        setIsLogging(true);
        setLogStatus(null);
        
        // --- MOCK LOGIC FOR QUICK LOG ---
        const newCommitment = {
            id: `quick-log-${Date.now()}`,
            text: repText, // The micro-action (e.g., "Send one thank-you Slack message")
            status: 'Committed',
            isCustom: true,
            linkedGoal: 'Frictionless Start Goal',
            linkedTier: 'T3', // Assuming a common tier for quick wins
            targetColleague: 'Self/System',
            isQuickLog: true,
        };

        try {
            await updateCommitmentData(data => ({
                ...data,
                active_commitments: [...(data?.active_commitments || []), newCommitment],
            }));
            setLogStatus('success');
            setTimeout(onClose, 1500); // Close quickly on success
        } catch (e) {
            console.error("Failed to log 2-minute challenge:", e);
            setLogStatus('error');
        } finally {
            setIsLogging(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className={`relative bg-[${COLORS.OFF_WHITE}] rounded-xl shadow-2xl w-full max-w-lg p-8 text-center border-t-8 border-[${COLORS.BLUE}]`}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700">
                    <X className="w-6 h-6" />
                </button>

                <Zap className={`w-12 h-12 text-[${COLORS.BLUE}] mx-auto mb-4`} />
                <h3 className="text-2xl font-extrabold text-[#002E47] mb-2">2-Minute Challenge</h3>
                <p className="text-lg text-gray-600 mb-6">Remove the friction! Log this micro-action right now to build momentum for your day.</p>

                <div className={`p-4 rounded-xl border-2 mb-6 ${logStatus === 'success' ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-100'}`}>
                    <p className='text-sm font-semibold text-gray-700 mb-1'>Micro-Action:</p>
                    <p className={`text-xl font-bold text-left ${logStatus === 'success' ? 'text-green-600' : 'text-[#002E47]'}`}>
                        <CornerRightUp className='w-5 h-5 inline mr-2'/> {repText}
                    </p>
                </div>

                {logStatus === 'success' ? (
                    <div className="flex items-center justify-center p-3 text-white rounded-xl bg-green-500 font-bold">
                        <CheckCircle className="w-5 h-5 mr-2" /> Challenge Rep Logged!
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
            </div>
        </div>
    );
};

export default TwoMinuteChallengeModal;