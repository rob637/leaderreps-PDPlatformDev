// src/components/modals/TwoMinuteChallengeModal.jsx

import React, { useState, useMemo } from 'react';
import { X, Zap, CheckCircle, CornerRightUp, AlertTriangle } from 'lucide-react';
import { useAppServices } from '../../services/useAppServices.jsx';

const COLORS = {
  NAVY: '#002E47', TEAL: '#47A88D', BLUE: '#2563EB', ORANGE: '#E04E1B', OFF_WHITE: '#FFFFFF',
};

// --- ENHANCEMENT: 100 QUICK CHALLENGE REPS (T1-T5) ---
const QUICK_CHALLENGE_CATALOG = [
    // T1: Self-Awareness & Resilience (Quick Mindset/Energy Reset)
    { rep: "Take three deep, deliberate breaths before checking your first email.", tier: 'T1' },
    { rep: "Write down three things you are grateful for right now.", tier: 'T1' },
    { rep: "Step away from your screen for exactly 120 seconds.", tier: 'T1' },
    { rep: "Drink a full glass of water and note your mood shift.", tier: 'T1' },
    { rep: "Set a single, clear intention for the next 60 minutes.", tier: 'T1' },
    { rep: "Observe your posture and deliberately correct it.", tier: 'T1' },
    { rep: "Jot down the biggest distraction source from the last hour.", tier: 'T1' },
    { rep: "Smile (genuinely) at the next person you see or speak to.", tier: 'T1' },
    { rep: "Close all irrelevant tabs/apps on your computer.", tier: 'T1' },
    { rep: "Name one feeling you are currently experiencing.", tier: 'T1' },
    { rep: "Stretch your neck and shoulders for 30 seconds.", tier: 'T1' },
    { rep: "Re-read your mission statement or personal mantra.", tier: 'T1' },
    { rep: "Identify one task that can wait until tomorrow.", tier: 'T1' },
    { rep: "Do 10 simple standing stretches or twists.", tier: 'T1' },
    { rep: "Look at something green (a plant, outside) for 60 seconds.", tier: 'T1' },
    { rep: "Mentally list two small wins from the last 24 hours.", tier: 'T1' },
    { rep: "Give yourself a 2-minute limit for the next coffee/tea break.", tier: 'T1' },
    { rep: "Visualize one successful interaction you need to have today.", tier: 'T1' },
    { rep: "Change your workspace lighting/sound for better focus.", tier: 'T1' },
    { rep: "Acknowledge one source of stress and file it away mentally.", tier: 'T1' },

    // T2: Operational Excellence (Quick Efficiency/System Tweak)
    { rep: "Triage your email inbox, deleting 5 non-essential messages.", tier: 'T2' },
    { rep: "Move one low-priority task to the end of your weekly list.", tier: 'T2' },
    { rep: "Check if one meeting on your calendar has a clear agenda.", tier: 'T2' },
    { rep: "Send a 3-sentence summary of an idea instead of scheduling a call.", tier: 'T2' },
    { rep: "Clear 5 minutes of visual clutter from your desk/workspace.", tier: 'T2' },
    { rep: "Check one recurring task to see if it can be automated.", tier: 'T2' },
    { rep: "Update the due date on one task to reflect reality.", tier: 'T2' },
    { rep: "Draft 3 bullet points for the next status update document.", tier: 'T2' },
    { rep: "Organize 5 files/folders into a cleaner naming convention.", tier: 'T2' },
    { rep: "Turn one informal promise into a written checklist item.", tier: 'T2' },
    { rep: "Identify one process step that adds no value.", tier: 'T2' },
    { rep: "Set up a 10-minute time block for the next difficult task.", tier: 'T2' },
    { rep: "Create a draft email signature with updated contact info.", tier: 'T2' },
    { rep: "Quickly review your budget spending for the last week.", tier: 'T2' },
    { rep: "Find and save one high-value keyboard shortcut.", tier: 'T2' },
    { rep: "Write the objective for the next internal meeting.", tier: 'T2' },
    { rep: "Check one team member's status to ensure they aren't blocked.", tier: 'T2' },
    { rep: "Identify one tool you are using inefficiently.", tier: 'T2' },
    { rep: "Schedule a 15-minute preparation block for your next meeting.", tier: 'T2' },
    { rep: "Review the priority order of your top 5 tasks.", tier: 'T2' },
    
    // T3: Strategic Alignment (Quick Mission/Vision Check)
    { rep: "Connect one current project to a 5-year company vision statement.", tier: 'T3' },
    { rep: "Ask yourself: 'Is this decision mission-critical or merely urgent?'", tier: 'T3' },
    { rep: "Write down the #1 goal for your team this quarter.", tier: 'T3' },
    { rep: "Identify one potential market shift your team is ignoring.", tier: 'T3' },
    { rep: "Send a strategic article/link to a team member (2-sentence summary).", tier: 'T3' },
    { rep: "Draft one 'We Are Here' communication for your department.", tier: 'T3' },
    { rep: "Review the last successful project and list 3 repeatable actions.", tier: 'T3' },
    { rep: "Determine which task on your plate has the highest ROI.", tier: 'T3' },
    { rep: "Map one dependency between your team and another.", tier: 'T3' },
    { rep: "Spend 2 minutes thinking about next year's budget priorities.", tier: 'T3' },
    { rep: "Define the next biggest risk to your Q3 goal.", tier: 'T3' },
    { rep: "List 2 ways your recent actions reflected the company values.", tier: 'T3' },
    { rep: "Read a headline from a non-industry business publication.", tier: 'T3' },
    { rep: "Briefly visualize the ultimate success state of a current goal.", tier: 'T3' },
    { rep: "Check your calendar to see if time allocation matches strategy.", tier: 'T3' },
    { rep: "Draft a 1-sentence summary of your most complex challenge.", tier: 'T3' },
    { rep: "Look up one competitor's latest strategic move.", tier: 'T3' },
    { rep: "Identify one process that is currently creating organizational drift.", tier: 'T3' },
    { rep: "Read one sentence from your personal development plan.", tier: 'T3' },
    { rep: "Quickly audit one project for strategic waste.", tier: 'T3' },

    // T4: People Development & Coaching (Quick Positivity/Connection)
    { rep: "Send one quick thank-you Slack message right now.", tier: 'T4' },
    { rep: "Give specific, non-critical, reinforcing feedback to a peer.", tier: 'T4' },
    { rep: "Ask a direct report, 'What are you most proud of right now?'", tier: 'T4' },
    { rep: "Acknowledge one team member for effort, not just outcome.", tier: 'T4' },
    { rep: "Look up a team member's birthday or work anniversary.", tier: 'T4' },
    { rep: "Send a link to a resource that could help a team member grow.", tier: 'T4' },
    { rep: "Set a reminder to check in with one struggling team member tomorrow.", tier: 'T4' },
    { rep: "Practice 'active listening' with the next person who speaks to you.", tier: 'T4' },
    { rep: "Write down one skill you admire in a team member.", tier: 'T4' },
    { rep: "Send a quick, positive note about a meeting contribution.", tier: 'T4' },
    { rep: "Think of one question to ask your direct report about their long-term career path.", tier: 'T4' },
    { rep: "Plan a 15-minute learning block for a team member next week.", tier: 'T4' },
    { rep: "Find a positive data point about your team's performance to share.", tier: 'T4' },
    { rep: "Send a concise, positive affirmation to your team chat.", tier: 'T4' },
    { rep: "Identify one specific behavior to praise in your next interaction.", tier: 'T4' },
    { rep: "Offer to remove one low-value task from a team member's plate.", tier: 'T4' },
    { rep: "Ask a team member for their opinion on a non-work topic.", tier: 'T4' },
    { rep: "Schedule 5 minutes of buffer time before your next 1:1.", tier: 'T4' },
    { rep: "Write down the next specific coaching question you will ask.", tier: 'T4' },
    { rep: "Acknowledge a peer publicly for their support.", tier: 'T4' },
    
    // T5: Visionary Leadership & Culture (Quick Influence/Trust Building)
    { rep: "Jot down two behaviors that reinforce the team's sense of psychological safety.", tier: 'T5' },
    { rep: "Send a 1-sentence message re-affirming team vision.", tier: 'T5' },
    { rep: "Identify one decision where you could have been more transparent.", tier: 'T5' },
    { rep: "Review the biggest mistake you made last month and list the learning.", tier: 'T5' },
    { rep: "Write down one sentence you use to describe your personal leadership philosophy.", tier: 'T5' },
    { rep: "Find a way to simplify a complex concept for your team (jargon removal).", tier: 'T5' },
    { rep: "Plan a future action to model a desired cultural behavior.", tier: 'T5' },
    { rep: "Identify one way you can empower a junior colleague today.", tier: 'T5' },
    { rep: "Draft a brief communication that increases clarity, not urgency.", tier: 'T5' },
    { rep: "Connect a small team achievement to a huge organizational goal.", tier: 'T5' },
    { rep: "Think of one question that challenges the status quo.", tier: 'T5' },
    { rep: "Find a positive news story to share with your team for morale.", tier: 'T5' },
    { rep: "List 2 things your team does better than any other team.", tier: 'T5' },
    { rep: "Quickly review your most recent feedback for fairness/bias.", tier: 'T5' },
    { rep: "Acknowledge a difficult past failure and name the lesson learned.", tier: 'T5' },
    { rep: "Identify the next leadership behavior you need to master.", tier: 'T5' },
    { rep: "Ask a subordinate what they think the company vision means.", tier: 'T5' },
    { rep: "Plan a future action to model ethical decision-making.", tier: 'T5' },
    { rep: "Write a short note of appreciation to your own manager/mentor.", tier: 'T5' },
    { rep: "Define the one single metric that determines your team's current success.", tier: 'T5' },
];

const Button = ({ children, onClick, disabled = false, className = '', ...rest }) => (
    <button {...rest} onClick={onClick} disabled={disabled} className={`px-6 py-3 rounded-xl font-semibold transition-all shadow-lg text-white flex items-center justify-center ${className} ${disabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}>
      {children}
    </button>
);

// --- MODAL COMPONENT (UPDATED) ---
const TwoMinuteChallengeModal = ({ isVisible, onClose, sourceScreen }) => {
    const { updateCommitmentData, navigate } = useAppServices();
    const [isLogging, setIsLogging] = useState(false);
    const [logStatus, setLogStatus] = useState(null); // 'success' or 'error'
    
    // FIX 2: Randomly select a new rep every time the modal is rendered/made visible
    const randomRep = useMemo(() => {
        const randomIndex = Math.floor(Math.random() * QUICK_CHALLENGE_CATALOG.length);
        return QUICK_CHALLENGE_CATALOG[randomIndex];
    }, [isVisible]); // Rerun selection when modal visibility changes

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
        };

        try {
            await updateCommitmentData(data => ({
                ...data,
                active_commitments: [...(data?.active_commitments || []), newCommitment],
            }));
            setLogStatus('success');
            
            // FIX 1: Conditional Navigation (Navigate only if source was Dashboard)
            setTimeout(() => {
                if (sourceScreen === 'dashboard' && navigate) {
                    navigate('dashboard'); // Navigate back to dashboard
                }
                onClose(); // Close the modal (will stay on DP if navigated from DP)
            }, 1500); 

        } catch (e) {
            console.error("Failed to log 2-minute challenge:", e);
            setLogStatus('error');
            setIsLogging(false);
        } finally {
            // Note: setIsLogging(false) is handled in the timeout on success/error block on failure.
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"> 
            <div className={`relative bg-[${COLORS.OFF_WHITE}] rounded-xl shadow-2xl w-full max-w-lg p-8 text-center border-t-8 border-[${COLORS.BLUE}]`}>
                <button onClick={onClose} disabled={isLogging} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700">
                    <X className="w-6 h-6" />
                </button>

                <Zap className={`w-12 h-12 text-[${COLORS.BLUE}] mx-auto mb-4`} />
                <h3 className="text-2xl font-extrabold text-[#002E47] mb-2">Grab a Micro-Action Rep</h3>
                <p className="text-lg text-gray-600 mb-6">Frictionless training for momentum! Complete this action quickly.</p>

                <div className={`p-4 rounded-xl border-2 mb-6 ${logStatus === 'success' ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-100'}`}>
                    <p className='text-sm font-semibold text-gray-700 mb-1'>Today's Micro-Action ({randomRep.tier}):</p>
                    <p className={`text-xl font-bold text-left ${logStatus === 'success' ? 'text-green-600' : 'text-[#002E47]'}`}>
                        <CornerRightUp className='w-5 h-5 inline mr-2'/> {randomRep.rep}
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
                
                <button onClick={onClose} disabled={isLogging} className='text-sm text-gray-500 mt-4 hover:text-gray-700 block w-full'>
                    Close / Skip Challenge
                </button>
            </div>
        </div>
    );
};

export default TwoMinuteChallengeModal;