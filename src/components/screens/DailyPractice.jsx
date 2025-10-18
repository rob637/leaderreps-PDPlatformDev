/* eslint-disable no-console */
import React, { useState, useEffect, useMemo } from 'react';
import { useAppServices } from '../../App.jsx';
import { 
    Target, Clock, PlusCircle, X, CheckCircle, Zap, BarChart3, CornerRightUp, BookOpen, Briefcase, Users, Mic, HeartPulse, TrendingUp, Lightbulb
} from 'lucide-react';
// Note: These constants and the commitment bank are assumed to be available
// via a shared dependency structure or loaded from context/a global asset.
import { LEADERSHIP_TIERS } from '../../data/Constants'; 

// --- COLOR PALETTE (From App.jsx) ---
const COLORS = {
    NAVY: '#002E47',
    TEAL: '#47A88D',
    ORANGE: '#E04E1B',
    LIGHT_GRAY: '#FCFCFA',
};

// --- Custom/Placeholder UI Components (Replicated for self-contained file) ---
const Button = ({ children, onClick, disabled = false, variant = 'primary', className = '', ...rest }) => {
    let baseStyle = "px-6 py-3 rounded-xl font-semibold transition-all shadow-xl focus:outline-none focus:ring-4 text-white";

    if (variant === 'primary') { baseStyle += ` bg-[${COLORS.TEAL}] hover:bg-[#349881] focus:ring-[#47A88D]/50`; } 
    else if (variant === 'secondary') { baseStyle += ` bg-[${COLORS.ORANGE}] hover:bg-red-700 focus:ring-[#E04E1B]/50`; } 
    else if (variant === 'outline') { baseStyle = `px-6 py-3 rounded-xl font-semibold transition-all shadow-md border-2 border-[${COLORS.TEAL}] text-[${COLORS.TEAL}] hover:bg-[#47A88D]/10 focus:ring-4 focus:ring-[#47A88D]/50 bg-[${COLORS.LIGHT_GRAY}]`; }

    if (disabled) { baseStyle = "px-6 py-3 rounded-xl font-semibold bg-gray-300 text-gray-500 cursor-not-allowed shadow-inner transition-none"; }

    return (
        <button {...rest} onClick={onClick} disabled={disabled} className={`${baseStyle} ${className}`}>
            {children}
        </button>
    );
};

const Card = ({ children, title, icon: Icon, className = '', onClick }) => {
    const interactive = !!onClick;
    const Tag = interactive ? 'button' : 'div';

    return (
        <Tag 
            role={interactive ? "button" : undefined}
            tabIndex={interactive ? 0 : undefined}
            className={`bg-[${COLORS.LIGHT_GRAY}] p-6 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 ${interactive ? `cursor-pointer hover:border-[${COLORS.NAVY}] border-2 border-transparent` : ''} ${className}`}
            onClick={onClick}
        >
            {Icon && <Icon className="w-8 h-8 text-[#47A88D] mb-4" />}
            {title && <h2 className="text-xl font-bold text-[#002E47] mb-2">{title}</h2>}
            {children}
        </Tag>
    );
};

const Tooltip = ({ content, children }) => {
    const [isVisible, setIsVisible] = useState(false);
    
    return (
        <div 
            className="relative inline-block"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            {isVisible && (
                <div className="absolute z-10 w-64 p-3 -mt-2 -ml-32 text-xs text-white bg-[#002E47] rounded-lg shadow-lg bottom-full left-1/2 transform translate-x-1/2">
                    {content}
                    <div className="absolute left-1/2 transform -translate-x-1/2 bottom-[-4px] w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[#002E47]"></div>
                </div>
            )}
        </div>
    );
};
// --- END Custom UI Components ---


// --- COMMITMENT BANK DATA ---
const leadershipCommitmentBank = {
    'Focus & Productivity': [
        { id: 'bank_1', text: 'Identify and block out 90 minutes for "Deep Work" on a high-leverage task.', isCustom: false },
        { id: 'bank_2', text: 'Close email/chat apps entirely for the first two hours of the workday.', isCustom: false },
        { id: 'bank_3', text: 'Review and confirm alignment with my top 3 OKRs before starting my day.', isCustom: false },
        { id: 'bank_4', text: 'Decline one non-essential meeting to protect focused work time.', isCustom: false },
        { id: 'bank_5', text: 'Process emails only during two dedicated 30-minute windows.', isCustom: false },
        { id: 'bank_6', text: 'List the one non-negotiable win for tomorrow before leaving the office.', isCustom: false },
        { id: 'bank_7', text: 'Do not check external news or social media before 10 AM.', isCustom: false },
        { id: 'bank_8', text: 'Time-box all low-leverage administrative tasks to 60 minutes max.', isCustom: false },
    ],
    'Feedback & Coaching': [
        { id: 'bank_11', text: 'Deliver one piece of specific, objective (SBI) constructive feedback.', isCustom: false },
        { id: 'bank_12', text: 'Deliver one piece of specific, genuine positive reinforcement (5:1 Ratio).', isCustom: false },
        { id: 'bank_13', text: 'Conduct one scheduled 1:1 session with a direct report, focusing on their agenda.', isCustom: false },
        { id: 'bank_14', text: 'Use a powerful, open-ended question in a team meeting.', isCustom: false },
        { id: 'bank_15', text: 'Paraphrase and validate a colleague’s emotion during a difficult discussion.', isCustom: false },
        { id: 'bank_16', text: 'Actively listen for 5 minutes without interrupting anyone.', isCustom: false },
    ],
    'Trust & Identity': [
        { id: 'bank_21', text: 'Log one instance where I consciously acted in alignment with my Leadership Identity Statement (LIS).', isCustom: false },
        { id: 'bank_22', text: 'Lead by modeling vulnerability: admit one specific error or uncertainty to the team.', isCustom: false },
        { id: 'bank_23', text: 'Hold myself and one direct report accountable for a clear, measurable commitment.', isCustom: false },
        { id: 'bank_24', text: 'Say "no" to a request that conflicts with my top strategic priority.', isCustom: false },
        { id: 'bank_25', text: 'Practice silence during a debate to allow psychological safety for others.', isCustom: false },
    ],
    'Strategy & Planning': [
        { id: 'bank_31', text: 'Review the organizational Vision/Mission statement and relate it to my team’s QTR goals.', isCustom: false },
        { id: 'bank_32', text: 'Refine one Key Result in the Planning Hub to be more clearly "from X to Y".', isCustom: false },
        { id: 'bank_33', text: 'Conduct a mini "Pre-Mortem" audit on a minor decision I am making.', isCustom: false },
        { id: 'bank_34', text: 'Delegate a task that I believe I could do better/faster, but that the other person needs for development.', isCustom: false },
        { id: 'bank_35', text: 'Review my weekly calendar: is 80% of my time spent on tasks that drive the top 20% of results?', isCustom: false },
    ],
};


// --- COMMITMENT ITEM COMPONENT ---
const CommitmentItem = ({ commitment, onLogCommitment, onRemove, disabled }) => {
    const getStatusColor = (status) => {
        if (status === 'Committed') return 'bg-green-100 text-green-800 border-green-500 shadow-md';
        if (status === 'Missed') return 'bg-red-100 text-red-800 border-red-500 shadow-md';
        return 'bg-gray-100 text-gray-700 border-gray-300 shadow-sm';
    };

    const getStatusIcon = (status) => {
        if (status === 'Committed') return <CheckCircle className="w-5 h-5 text-green-600" />;
        if (status === 'Missed') return <Zap className="w-5 h-5 text-[#E04E1B] transform rotate-45" />;
        return <Clock className="w-5 h-5 text-gray-500" />;
    };

    const status = commitment.status || 'Pending';

    // Display logic for Tier and Colleague
    const tierMeta = commitment.linkedTier ? LEADERSHIP_TIERS[commitment.linkedTier] : null;
    const tierLabel = tierMeta ? `${tierMeta.id}: ${tierMeta.name}` : 'N/A';
    const colleagueLabel = commitment.targetColleague ? `Focus: ${commitment.targetColleague}` : 'Self-Focus';

    return (
        <div className={`p-4 rounded-xl flex flex-col justify-between ${getStatusColor(status)} transition-all duration-300`}>
            <div className='flex items-start justify-between'>
                <div className='flex items-center space-x-2 text-lg font-semibold mb-2'>
                    {getStatusIcon(status)}
                    <span className='text-[#002E47] text-base'>{commitment.text}</span>
                </div>
                <button onClick={() => onRemove(commitment.id)} className="text-gray-400 hover:text-[#E04E1B] transition-colors p-1 rounded-full" disabled={disabled}>
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className='flex space-x-3 mb-3 overflow-x-auto'>
                <div className='text-xs text-[#002E47] bg-[#002E47]/10 px-3 py-1 rounded-full inline-block font-medium whitespace-nowrap'>
                    Goal: {commitment.linkedGoal || 'N/A'}
                </div>
                {commitment.linkedTier && (
                    <div className='text-xs text-[#47A88D] bg-[#47A88D]/10 px-3 py-1 rounded-full inline-block font-medium whitespace-nowrap'>
                        Tier: {tierLabel}
                    </div>
                )}
                <div className='text-xs text-[#E04E1B] bg-[#E04E1B]/10 px-3 py-1 rounded-full inline-block font-medium whitespace-nowrap'>
                    {colleagueLabel}
                </div>
            </div>
            
            <div className="flex space-x-2 mt-3 pt-3 border-t border-gray-300/50">
                <Button 
                    onClick={() => onLogCommitment(commitment.id, 'Committed')} 
                    disabled={status === 'Committed' || disabled}
                    className="px-3 py-1 text-xs bg-[#47A88D] hover:bg-[#349881] disabled:bg-green-300 disabled:shadow-none"
                    >
                    Committed
                </Button>
                <Button 
                    onClick={() => onLogCommitment(commitment.id, 'Missed')} 
                    disabled={status === 'Missed' || disabled}
                    className="px-3 py-1 text-xs bg-[#E04E1B] hover:bg-red-700 disabled:bg-red-300 disabled:shadow-none"
                    >
                    Missed
                </Button>
                {status !== 'Pending' && (
                    <Button
                        onClick={() => onLogCommitment(commitment.id, 'Pending')}
                        variant="outline"
                        className="px-3 py-1 text-xs border-gray-400 text-gray-700 hover:bg-gray-200"
                        disabled={disabled}
                    >
                        Reset
                    </Button>
                )}
            </div>
        </div>
    );
};


// --- COMMITMENT SELECTOR VIEW ---
const CommitmentSelectorView = ({ setView, initialGoal, initialTier }) => {
    // Centralize functions and data via context
    const { updateCommitmentData, commitmentData, planningData, pdpData, navigate } = useAppServices();

    const [tab, setTab] = useState('bank');
    const [searchTerm, setSearchTerm] = useState('');
    const [customCommitment, setCustomCommitment] = useState('');
    // UX Polish: Now correctly initialized with initialGoal/initialTier from navigation params
    const [linkedGoal, setLinkedGoal] = useState(initialGoal || ''); 
    const [linkedTier, setLinkedTier] = useState(initialTier || '');
    const [targetColleague, setTargetColleague] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const userCommitments = commitmentData?.active_commitments || [];
    // Prefix PDP content IDs to avoid collision with bank IDs
    const activeCommitmentIds = new Set(userCommitments.map(c => c.id.startsWith('pdp-content-') ? c.id.split('-').slice(0, 3).join('-') : c.id));
    
    // PDP Content Calculation
    const currentMonthPlan = pdpData?.plan?.find(m => m.month === pdpData?.currentMonth);
    const requiredPdpContent = currentMonthPlan?.requiredContent || [];

    // Combine all commitments from the bank into a flat array
    const allBankCommitments = Object.values(leadershipCommitmentBank).flat();

    const filteredBankCommitments = allBankCommitments.filter(c => 
        !activeCommitmentIds.has(c.id) && 
        c.text.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // DYNAMIC GOAL LINKING: Combine Vision/Mission and OKRs from Planning Data
    const okrGoals = planningData?.okrs?.map(o => o.objective) || [];
    const missionVisionGoals = [planningData?.vision, planningData?.mission].filter(Boolean);
    const availableGoals = useMemo(() => [
        '--- Select the Goal this commitment supports ---', // Default disabled option
        ...okrGoals,
        ...missionVisionGoals,
        'Improve Feedback & Coaching Skills', // Used as a fixed option in FeedbackPrepToolView
        'Risk Mitigation Strategy', // Used as a fixed option in PreMortemView
        'Other / New Goal'
    ].filter((v, i, a) => v && a.indexOf(v) === i), [okrGoals, missionVisionGoals]);

    const initialSelectGoalOption = availableGoals[0];

    // UX Polish: Update linkedGoal/linkedTier from props
    useEffect(() => {
        if (initialGoal && initialGoal !== linkedGoal) {
            setLinkedGoal(initialGoal);
        }
        if (initialTier && initialTier !== linkedTier) {
            setLinkedTier(initialTier);
        }
    }, [initialGoal, initialTier]);


    // Set default linkedGoal if none is selected on initial load
    useEffect(() => {
        if (!linkedGoal) {
            setLinkedGoal(initialSelectGoalOption);
        }
    }, [linkedGoal, initialSelectGoalOption]);


    const handleAddCommitment = async (commitment, source) => {
        if (!linkedGoal || linkedGoal === initialSelectGoalOption || !linkedTier) return;
        setIsSaving(true);
        
        let newCommitment;
        const baseCommitment = { 
            status: 'Pending', 
            isCustom: (source === 'custom' || source === 'pdp'),
            linkedGoal: linkedGoal, 
            linkedTier: linkedTier,
            targetColleague: targetColleague.trim() || null,
        };

        if (source === 'pdp') {
            // Content from PDP is added as a custom-like commitment tied to its goal/tier
            newCommitment = { 
                ...baseCommitment,
                id: `pdp-content-${commitment.id}`, // Use a persistent ID tied to the PDP content
                text: `(PDP Focus) Complete: ${commitment.title} (${commitment.type})`, 
                targetColleague: `Est. ${commitment.duration} min`, // Overwrite targetColleague with duration info
            };
            // FIX: If PDP item already exists (due to ID collision), prevent re-adding
            if (activeCommitmentIds.has(newCommitment.id)) {
                 setIsSaving(false);
                 return;
            }
        } else if (source === 'bank') {
            // Content from Commitment Bank
            newCommitment = { 
                ...baseCommitment, 
                ...commitment, // Overwrite base properties (like text, id, isCustom)
            };
        } else if (source === 'custom') {
             newCommitment = {
                ...baseCommitment,
                id: Date.now().toString(),
                text: customCommitment.trim(),
            };
        } else {
            setIsSaving(false);
            return;
        }

        const newCommitments = [...userCommitments, newCommitment];
        
        await updateCommitmentData({ active_commitments: newCommitments });
        
        // Reset inputs after adding
        if (source === 'custom') setCustomCommitment('');
        setTargetColleague('');
        setIsSaving(false);
    };

    const handleCreateCustomCommitment = () => {
        if (customCommitment.trim() && linkedGoal && linkedGoal !== initialSelectGoalOption && linkedTier) {
            handleAddCommitment(null, 'custom');
        }
    };


    const canAddCommitment = !!linkedGoal && linkedGoal !== initialSelectGoalOption && !!linkedTier && !isSaving;

    const tabStyle = (currentTab) => 
        `px-4 py-2 font-semibold rounded-t-xl transition-colors ${
            tab === currentTab 
            ? `bg-[${COLORS.LIGHT_GRAY}] text-[#002E47] border-t-2 border-x-2 border-[${COLORS.TEAL}] shadow-md` 
            : 'bg-gray-200 text-gray-500 hover:text-[#002E47]'
        }`;
        
    const filteredPdpContent = requiredPdpContent
        .filter(c => !activeCommitmentIds.has(`pdp-content-${c.id}`))
        .filter(c => !userCommitments.find(uc => uc.id === `pdp-content-${c.id}`)); // Double check filter

    return (
        <div className="p-8">
            <h1 className="text-3xl font-extrabold text-[#002E47] mb-4">Manage Your Scorecard Commitments</h1>
            <p className="text-lg text-gray-600 mb-6 max-w-3xl">Select the core micro-habits that directly support your current leadership development goals. You should aim for 3-5 active commitments.</p>

            <Button onClick={() => setView('scorecard')} variant="secondary" className="mb-8" disabled={isSaving}>
                <ArrowLeft className="w-5 h-5 mr-2" /> Back to Scorecard
            </Button>

            <Card title="Goal and Tier Alignment (Mandatory)" icon={Target} className='mb-8 p-6 bg-[#47A88D]/10 border-2 border-[#47A88D]'>
                <p className="text-sm text-gray-700 mb-4">Ensure your daily action is tied to a strategic goal **and** a core leadership tier.</p>
                
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">1. Strategic Goal</label>
                        <select 
                            value={linkedGoal}
                            onChange={(e) => setLinkedGoal(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-[#002E47] focus:border-[#002E47] text-[#002E47] font-semibold"
                        >
                            {availableGoals.map(goal => (
                                <option 
                                    key={goal} 
                                    value={goal}
                                    disabled={goal === initialSelectGoalOption}
                                >
                                    {goal}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">2. Leadership Tier (T1-T5)</label>
                        <select 
                            value={linkedTier}
                            onChange={(e) => setLinkedTier(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-[#002E47] focus:border-[#002E47] text-[#002E47] font-semibold"
                        >
                             <option value="">--- Select Tier ---</option>
                             {Object.values(LEADERSHIP_TIERS).map(tier => (
                                <option key={tier.id} value={tier.id}>
                                    {tier.id}: {tier.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                
                <label className="block text-sm font-medium text-gray-700 mb-1">3. Target Colleague (Optional for inter-personal skills)</label>
                <input
                    type="text"
                    value={targetColleague}
                    onChange={(e) => setTargetColleague(e.target.value)}
                    placeholder="e.g., Alex, Sarah, or Leave Blank for Self-Focus"
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-[#47A88D] focus:border-[#47A88D]"
                />

                {!canAddCommitment && <p className='text-[#E04E1B] text-sm mt-3'>* Please select a Strategic Goal and a Leadership Tier to activate the 'Add' buttons.</p>}
            </Card>

            {/* Tab Navigation */}
            <div className="flex space-x-2 border-b border-gray-300 -mb-px">
                <button className={tabStyle('pdp')} onClick={() => setTab('pdp')}>
                    <Briefcase className='w-4 h-4 inline mr-1'/> PDP Content ({filteredPdpContent.length})
                </button>
                <button className={tabStyle('bank')} onClick={() => setTab('bank')}>
                    <BookOpen className='w-4 h-4 inline mr-1'/> Commitment Bank ({filteredBankCommitments.length})
                </button>
                <button className={tabStyle('custom')} onClick={() => setTab('custom')}>
                    <PlusCircle className='w-4 h-4 inline mr-1'/> Custom Commitment
                </button>
            </div>
            
            {/* Tab Content */}
            <div className={`mt-0 bg-[${COLORS.LIGHT_GRAY}] p-6 rounded-b-3xl shadow-lg border-2 border-t-0 border-[${COLORS.TEAL}]/30`}>
            
                {/* PDP Content Tab */}
                {tab === 'pdp' && (
                    <div className="space-y-4">
                        <p className='text-sm text-gray-700'>These items are currently required for you to complete Month **{currentMonthPlan?.month || 'N/A'}** ({currentMonthPlan?.theme || 'N/A Focus'}) of your personalized plan.</p>
                        <div className="h-96 overflow-y-auto pr-2 space-y-3 pt-2">
                        {filteredPdpContent.length > 0 ? (
                            filteredPdpContent.map(c => (
                                <div key={c.id} className="flex justify-between items-center p-3 text-sm bg-[#47A88D]/5 rounded-lg border border-[#47A88D]/20">
                                    <span className='text-gray-800 font-medium'>{c.title} ({c.type}) - Est. {c.duration} min</span>
                                    <Tooltip content={`Adds this PDP item to your daily scorecard for tracking (linked goal/tier required).`}>
                                    <button 
                                        onClick={() => handleAddCommitment(c, 'pdp')}
                                        disabled={!canAddCommitment}
                                        className={`font-semibold text-xs transition-colors p-1 flex items-center space-x-1 ${canAddCommitment ? `text-[${COLORS.TEAL}] hover:text-[#349881]` : 'text-gray-400 cursor-not-allowed'}`}
                                    >
                                        <PlusCircle className='w-4 h-4'/>
                                        <span className='hidden sm:inline'>Add to Scorecard</span>
                                    </button>
                                    </Tooltip>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 italic text-center py-10">No required content for the current PDP month, or you have already added all items.</p>
                        )}
                        </div>
                    </div>
                )}
                
                {/* Commitment Bank Tab */}
                {tab === 'bank' && (
                     <div className="space-y-4">
                        <input
                            type="text"
                            placeholder="Filter Commitment Bank by keyword (e.g., 'feedback' or 'OKR')"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-[#47A88D] focus:border-[#47A88D] mb-4"
                        />
                        
                        <div className="h-96 overflow-y-auto pr-2 space-y-3">
                            {Object.entries(leadershipCommitmentBank).map(([category, commitments]) => {
                                const categoryCommitments = commitments.filter(c => 
                                    !activeCommitmentIds.has(c.id) && 
                                    c.text.toLowerCase().includes(searchTerm.toLowerCase())
                                );

                                if (categoryCommitments.length === 0) return null;

                                return (
                                    <div key={category}>
                                        <h3 className="text-sm font-bold text-[#002E47] border-b pb-1 mb-2">{category}</h3>
                                        {categoryCommitments.map(c => (
                                            <div key={c.id} className="flex justify-between items-center p-2 text-sm bg-gray-50 rounded-lg mb-1">
                                                <span className='text-gray-800'>{c.text}</span>
                                                <Tooltip content={`Adds this commitment (linked goal/tier required).`}>
                                                <button 
                                                    onClick={() => handleAddCommitment(c, 'bank')}
                                                    disabled={!canAddCommitment}
                                                    className={`font-semibold text-xs transition-colors p-1 ${canAddCommitment ? `text-[${COLORS.TEAL}] hover:text-[#349881]` : 'text-gray-400 cursor-not-allowed'}`}
                                                >
                                                    <PlusCircle className='w-4 h-4'/>
                                                </button>
                                                </Tooltip>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                            {filteredBankCommitments.length === 0 && searchTerm && (
                                <p className="text-gray-500 italic mt-4 text-center">No unselected commitments match your search.</p>
                            )}
                            {filteredBankCommitments.length === 0 && !searchTerm && (
                                <p className="text-gray-500 italic mt-4 text-center">Select from the categories above once you have chosen a goal/tier.</p>
                            )}
                        </div>
                     </div>
                )}
                
                {/* Custom Commitment Tab */}
                {tab === 'custom' && (
                    <div className="space-y-4">
                        <p className='text-sm text-gray-700'>Define a hyper-specific, measurable action tailored to your unique challenges.</p>
                        <textarea 
                            value={customCommitment}
                            onChange={(e) => setCustomCommitment(e.target.value)}
                            placeholder="e.g., Conduct a 10-minute debrief after every client meeting."
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-[#47A88D] focus:border-[#47A88D] h-20 mb-4"
                        />
                        <Button 
                            onClick={handleCreateCustomCommitment} 
                            disabled={!customCommitment.trim() || !canAddCommitment} 
                            className={`w-full bg-[${COLORS.TEAL}] hover:bg-[#349881]`}
                        >
                            {isSaving ? 'Saving...' : 'Add Custom Commitment'}
                        </Button>
                    </div>
                )}

            </div>
        </div>
    );
};


// --- DAILY PRACTICE SCREEN ROUTER (MAIN EXPORT) ---
export default function DailyPracticeScreen({ initialGoal, initialTier }) {
    // Centralize functions and data via context
    const { commitmentData, isLoading, error, updateCommitmentData } = useAppServices();

    // Use initialGoal/initialTier to determine the starting view
    const [view, setView] = useState((initialGoal || initialTier) ? 'selector' : 'scorecard'); 
    const [isSaving, setIsSaving] = useState(false);
    const [reflection, setReflection] = useState(commitmentData?.reflection_journal || '');

    useEffect(() => {
        if (commitmentData) {
            setReflection(commitmentData.reflection_journal);
        }
    }, [commitmentData]);

    // Switch view to selector if navigation params dictate a setup action
    useEffect(() => {
        if (initialGoal || initialTier) {
            setView('selector');
        }
    }, [initialGoal, initialTier]);


    if (isLoading) {
        return (
            <div className="p-8 min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#47A88D] mb-3"></div>
                    <p className="text-[#47A88D] font-medium">Loading Daily Commitment Scorecard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return <div className="p-8"><p className="text-[#E04E1B] p-4 bg-red-100 rounded-xl">Error loading data: {error}</p></div>;
    }

    const userCommitments = commitmentData?.active_commitments || [];
    const commitmentHistory = commitmentData?.history || [];

    const handleLogCommitment = async (id, status) => {
        setIsSaving(true);
        const updatedCommitments = userCommitments.map(c => c.id === id ? { ...c, status: status } : c);
        await updateCommitmentData({ active_commitments: updatedCommitments });
        setIsSaving(false);
    };

    const handleRemoveCommitment = async (id) => {
        setIsSaving(true);
        const updatedCommitments = userCommitments.filter(c => c.id !== id);
        await updateCommitmentData({ active_commitments: updatedCommitments });
        setIsSaving(false);
    };

    const handleSaveReflection = async () => {
        setIsSaving(true);
        await updateCommitmentData({ reflection_journal: reflection });
        setIsSaving(false);
    };

    const calculateTotalScore = () => {
        const total = userCommitments.length;
        const committedCount = userCommitments.filter(c => c.status === 'Committed').length;
        return `${committedCount} / ${total}`;
    };

    // Streak Calculation Logic
    const calculateStreak = (history) => {
        let streak = 0;
        const validHistory = Array.isArray(history) ? history : [];
        
        for (let i = validHistory.length - 1; i >= 0; i--) {
            const scoreParts = validHistory[i].score.split('/');
            if (scoreParts.length !== 2) continue;
            
            const [committed, total] = scoreParts.map(Number);
            
            if (committed === total && total > 0) {
                streak++;
            } else if (total > 0) {
                // Stop streak if a scored day was not completed (e.g., 2/3)
                break;
            }
        }
        return streak;
    };


    const streak = calculateStreak(commitmentHistory);

    const renderView = () => {
        switch (view) {
            case 'selector':
                return <CommitmentSelectorView 
                            setView={setView} 
                            initialGoal={initialGoal} 
                            initialTier={initialTier} 
                        />;
            case 'scorecard':
            default:
                return (
                    <div className="p-8">
                        <h1 className="text-3xl font-extrabold text-[#002E47] mb-6">Daily Commitment Scorecard (Leadership Practice)</h1>
                        <p className="text-lg text-gray-600 mb-8 max-w-3xl">Track your daily commitment to the non-negotiable leadership actions that reinforce your professional identity. Consistently hitting this score is the key to sustained executive growth.</p>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Scorecard Column */}
                        <div className='lg:col-span-2'>
                            {(initialGoal || initialTier) && (
                                <div className="p-4 mb-6 bg-[#47A88D]/10 border border-[#47A88D] rounded-xl text-sm font-medium text-[#002E47]">
                                    <p className='font-bold flex items-center'>
                                        <CornerRightUp className='w-4 h-4 mr-2'/> Next Step Recommended:
                                    </p>
                                    <p>Your new focus area is **{initialGoal || LEADERSHIP_TIERS[initialTier]?.name || 'a new phase'}**. Click 'Manage Commitments' to align your daily practice to this goal!</p>
                                </div>
                            )}
                            <div className="mb-8 flex justify-between items-center">
                                <h3 className="text-2xl font-extrabold text-[#002E47]">
                                    Today's Commitments ({userCommitments.length})
                                </h3>
                                <Button onClick={() => setView('selector')} variant="outline" className="text-sm px-4 py-2" disabled={isSaving}>
                                    <PlusCircle className="w-4 h-4 mr-2"/> Manage Commitments
                                </Button>
                            </div>

                            <Card title="Current Commitments" icon={Target} className="mb-8 border-l-4 border-[#47A88D] rounded-3xl">
                                <div className="space-y-4">
                                    {userCommitments.length > 0 ? (
                                        userCommitments.map(c => (
                                            <CommitmentItem 
                                                key={c.id} 
                                                commitment={c} 
                                                onLogCommitment={handleLogCommitment}
                                                onRemove={handleRemoveCommitment}
                                                disabled={isSaving}
                                            />
                                        ))
                                    ) : (
                                        <p className="text-gray-500 italic text-center py-4">Your scorecard is empty. Click 'Manage Commitments' to start building your daily practice!</p>
                                    )}
                                </div>

                                <div className="mt-8 pt-4 border-t border-gray-200 flex justify-between items-center">
                                    <h3 className="text-2xl font-extrabold text-[#002E47]">
                                        Daily Score:
                                    </h3>
                                    <span className={`text-4xl font-extrabold p-3 rounded-xl shadow-inner min-w-[100px] text-center ${
                                        userCommitments.length > 0 && userCommitments.every(c => c.status === 'Committed') ? 'text-green-600 bg-green-50' : 'text-[#002E47] bg-gray-100'
                                    }`}>
                                        {calculateTotalScore()}
                                    </span>
                                </div>
                            </Card>
                        </div>
                        
                        {/* History Column */}
                        <div className='lg:col-span-1 space-y-8'>
                            <Card title="Commitment History" icon={BarChart3} className='bg-[#002E47]/10 border-2 border-[#002E47]/20'>
                                <p className='text-gray-700 text-sm mb-4'>
                                **Data is persistent and loaded from Firestore!** (Last 7 days)
                                </p>
                                <div className='p-6 bg-[#FCFCFA] border border-gray-200 rounded-xl'>
                                    <h4 className='text-lg font-semibold text-[#002E47] mb-2'>Last 7 Days</h4>
                                    <div className='flex justify-between text-xs font-mono text-gray-700 space-x-1 overflow-x-auto'>
                                        {/* Display only the last 7 items */}
                                        {commitmentHistory.slice(-7).map(item => (
                                            <div key={item.date} className='flex flex-col items-center min-w-[40px]'>
                                                <span className='font-bold'>{item.date.split('-').pop()}</span>
                                                <span className={`text-lg font-extrabold ${item.score.split('/').length === 2 && item.score.split('/')[0] === item.score.split('/')[1] && Number(item.score.split('/')[1]) > 0 ? 'text-green-600' : 'text-[#E04E1B]'}`}>{item.score}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <p className='mt-3 text-[#47A88D] font-medium'>Current Streak: {streak} {streak === 1 ? 'Day' : 'Days'}</p>
                                </div>
                            </Card>
                        </div>
                        </div>


                        <Card title="Reinforcement Journal" icon={Lightbulb} className={`bg-[#002E47]/10 border-2 border-[#002E47]/20 rounded-3xl ${userCommitments.length > 0 ? 'mt-8' : 'mt-0'}`}>
                            <p className="text-gray-700 text-sm mb-4">
                                Reflect on today's performance. How did executing (or missing) these leadership commitments impact your team's momentum and your own executive presence? This reinforcement loop is vital.
                            </p>
                            <textarea 
                                value={reflection}
                                onChange={(e) => setReflection(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-[#47A88D] focus:border-[#47A88D] h-40" 
                                placeholder="My reflection (required)..."
                            ></textarea>
                            <Button 
                                variant="secondary" 
                                onClick={handleSaveReflection}
                                disabled={isSaving}
                                className="mt-4 w-full"
                            >
                                {isSaving ? 'Saving...' : 'Save Daily Reflection'}
                            </Button>
                        </Card>

                    </div>
                );
        }
    }

    return renderView();
}
