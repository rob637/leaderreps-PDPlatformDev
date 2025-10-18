import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppServices } from '../../App.jsx';
import { Card, Button } from '../shared/UI';
import { getTimestamp } from '../../utils/ApiHelpers';
import { PlusCircle, X, CheckCircle, Target, TrendingUp, Clock, AlertTriangle, BarChart3, CornerRightUp } from 'lucide-react';
// We still need to import Constants for the collection name and tier definitions, but will use the context version of Tiers.
import { COMMITMENT_COLLECTION } from '../../data/Constants'; 

// --- Constants for this screen ---
const REPS_COLLECTION = 'daily_reps';

// --- Commitment Selector ---
// This is the view for managing (adding/removing) commitments
const CommitmentSelectorView = ({ setView, initialGoal, initialTier }) => {
    // Safely destructure LEADERSHIP_TIERS and allBooks, defaulting to empty objects
    const { updateCommitmentData, commitmentData, planningData, pdpData, LEADERSHIP_TIERS: Tiers = {} } = useAppServices();

    const [tab, setTab] = useState('bank');
    const [searchTerm, setSearchTerm] = useState('');
    const [customCommitment, setCustomCommitment] = useState('');
    const [linkedGoal, setLinkedGoal] = useState(''); 
    const [linkedTier, setLinkedTier] = useState('');
    const [targetColleague, setTargetColleague] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const userCommitments = commitmentData?.active_commitments || [];
    const activeCommitmentIds = new Set(userCommitments.map(c => c.id));
    
    // Combine all commitments from the bank into a flat array
    const allBankCommitments = useMemo(() => {
        try {
            // FIX: Safely import the bank here, handling the potential error if Constants.js is empty
            const constantsModule = require('../../data/Constants');
            const leadershipCommitmentBank = constantsModule.leadershipCommitmentBank || {};
            // FIX: Use Object.values safely
            return Object.values(leadershipCommitmentBank).flat();
        } catch (e) {
            console.warn("Could not load leadershipCommitmentBank from Constants. Defaulting to empty array.", e);
            return [];
        }
    }, []);

    // PDP Content Calculation
    const currentMonthPlan = pdpData?.plan?.find(m => m.month === pdpData?.currentMonth);
    const requiredPdpContent = currentMonthPlan?.requiredContent || [];
    // Filter out PDP content items that have already been converted to an active commitment
    const pdpContentReady = requiredPdpContent.filter(c => !userCommitments.some(uc => uc.sourceId === c.id));


    // DYNAMIC GOAL LINKING: Combine Vision/Mission and OKRs from Planning Data
    const okrGoals = planningData?.okrs?.map(o => o.objective) || [];
    const missionVisionGoals = [planningData?.vision, planningData?.mission].filter(Boolean);
    const availableGoals = [
        '--- Select the Goal this commitment supports ---', 
        ...okrGoals,
        ...missionVisionGoals,
        'Improve Feedback & Coaching Skills',
        'Risk Mitigation Strategy',
        'Other / New Goal'
    ];
    const initialLinkedGoal = availableGoals[0];

    useEffect(() => {
        if (initialGoal && initialGoal !== linkedGoal) {
            setLinkedGoal(initialGoal);
        }
        if (initialTier && initialTier !== linkedTier) {
            setLinkedTier(initialTier);
        }
        if (!linkedGoal) {
            setLinkedGoal(initialLinkedGoal);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialGoal, initialTier]);


    const filteredBankCommitments = allBankCommitments.filter(c => 
        !activeCommitmentIds.has(c.id) && 
        c.text.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddCommitment = async (commitment, source) => {
        if (!linkedGoal || linkedGoal === initialLinkedGoal || !linkedTier) return;
        setIsSaving(true);
        
        let newCommitment;
        if (source === 'pdp') {
            // Content from PDP is added as a commitment
            newCommitment = { 
                id: `pdp-content-${commitment.id}-${Date.now()}`, 
                text: `(PDP Focus) Complete: ${commitment.title} (${commitment.type})`, 
                status: 'Pending', 
                isCustom: true, 
                linkedGoal: linkedGoal, 
                linkedTier: linkedTier,
                targetColleague: `Est. ${commitment.duration} min`,
                sourceId: commitment.id, // Link back to the PDP content ID
                expectedReps: 1,
                currentReps: 0,
            };
        } else if (source === 'reading') {
            newCommitment = {
                id: `reading-commitment-${commitment.id}-${Date.now()}`,
                title: `Read: ${commitment.title}`,
                type: 'Reading',
                status: 'Pending',
                expectedReps: 1, 
                currentReps: 0,
                tier: commitment.tier,
                sourceId: commitment.id,
                linkedGoal: linkedGoal, 
                linkedTier: linkedTier,
            };
        } else {
            // Content from Commitment Bank
            newCommitment = { 
                ...commitment, 
                id: commitment.id + '-' + Date.now(),
                status: 'Pending', 
                linkedGoal: linkedGoal, 
                linkedTier: linkedTier,
                targetColleague: targetColleague.trim() || null,
                expectedReps: commitment.expectedReps || 1,
                currentReps: 0,
            };
        }

        const newCommitments = [...userCommitments, newCommitment];
        
        try {
             await updateCommitmentData(data => ({
                active_commitments: newCommitments,
                reps: data.reps || [],
                history: data.history || [],
            }), COMMITMENT_COLLECTION);
        } catch (e) {
            console.error("Error adding commitment:", e);
        }
        
        if (initialGoal !== linkedGoal) setLinkedGoal(initialLinkedGoal); 
        if (initialTier !== linkedTier) setLinkedTier('');
        setCustomCommitment('');
        setTargetColleague('');
        setIsSaving(false);
    };

    const handleCreateCustomCommitment = async () => {
        if (customCommitment.trim() && linkedGoal && linkedGoal !== initialLinkedGoal && linkedTier) {
            setIsSaving(true);
            const newId = Date.now();
            const newCommitments = [...userCommitments, { 
                id: newId, 
                text: customCommitment.trim(), 
                status: 'Pending', 
                isCustom: true, 
                linkedGoal: linkedGoal,
                linkedTier: linkedTier,
                targetColleague: targetColleague.trim() || null,
                expectedReps: 1,
                currentReps: 0,
            }];
            
            try {
                await updateCommitmentData(data => ({ active_commitments: newCommitments, reps: data.reps || [], history: data.history || [] }), COMMITMENT_COLLECTION);
            } catch (e) {
                console.error("Error creating custom commitment:", e);
            }

            setCustomCommitment('');
            if (initialGoal !== linkedGoal) setLinkedGoal(initialLinkedGoal);
            if (initialTier !== linkedTier) setLinkedTier('');
            setTargetColleague('');
            setIsSaving(false);
        }
    };

    const handleRemoveCommitment = async (id) => {
        if (!window.confirm('Are you sure you want to remove this active commitment? This is irreversible.')) return;
        
        setIsSaving(true);
        const updatedCommitments = userCommitments.filter(c => c.id !== id);

        try {
            await updateCommitmentData(data => ({ 
                active_commitments: updatedCommitments,
                reps: data.reps.filter(r => r.commitmentId !== id),
                history: data.history || [],
            }), COMMITMENT_COLLECTION);
        } catch (e) {
            console.error("Error removing commitment:", e);
        } finally {
            setIsSaving(false);
        }
    };

    const canAddCommitment = !!linkedGoal && linkedGoal !== initialLinkedGoal && !!linkedTier && !isSaving;

    const tabStyle = (currentTab) => 
        `px-4 py-2 font-semibold rounded-t-xl transition-colors ${
            tab === currentTab 
            ? 'bg-[#FCFCFA] text-[#002E47] border-t-2 border-x-2 border-[#47A88D]' 
            : 'bg-gray-200 text-gray-500 hover:text-[#002E47]'
        }`;

    return (
        <div className="p-8">
            <h1 className="text-3xl font-extrabold text-[#002E47] mb-4">Manage Your Scorecard Commitments</h1>
            <p className="text-lg text-gray-600 mb-6 max-w-3xl">Select the core micro-habits that directly support your current leadership development goals. Aim for 3-5 active commitments.</p>

            <Button onClick={() => setView('scorecard')} variant="secondary" className="mb-8" disabled={isSaving}>
                <CornerRightUp className="w-5 h-5 mr-2" /> Back to Scorecard
            </Button>
            
            <div className="lg:grid lg:grid-cols-3 gap-6">
                
                {/* Current Commitments List (Left Column) */}
                <Card title={`Active Commitments (${userCommitments.length})`} icon={CheckCircle} className='mb-8 lg:mb-0 lg:col-span-1 border-2 border-[#47A88D]/50'>
                    <div className="space-y-4 h-96 overflow-y-auto pr-2">
                        {userCommitments.length > 0 ? (
                            userCommitments.map(c => (
                                <div key={c.id} className="p-3 bg-gray-50 rounded-lg shadow-sm border flex justify-between items-center text-sm">
                                    <p className='text-gray-900 font-medium'>{c.text || c.title}</p>
                                    <button onClick={() => handleRemoveCommitment(c.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1" disabled={isSaving}>
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 italic text-center py-4">No active commitments. Add some below!</p>
                        )}
                    </div>
                </Card>

                {/* Selector/Input Area (Right Columns) */}
                <div className="lg:col-span-2 space-y-4">
                    <Card title="Goal and Tier Alignment (Mandatory)" icon={Target} className='p-6 bg-[#47A88D]/10 border-2 border-[#47A88D]'>
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
                                            disabled={goal === initialLinkedGoal}
                                        >
                                            {goal}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">2. Leadership Tier</label>
                                <select 
                                    value={linkedTier}
                                    onChange={(e) => setLinkedTier(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-[#002E47] focus:border-[#002E47] text-[#002E47] font-semibold"
                                >
                                     <option value="">--- Select Tier ---</option>
                                     {/* FIX: Safely access Object.values(Tiers) here */}
                                     {Object.values(Tiers || {}).map(tier => (
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
                            PDP Content ({pdpContentReady.length})
                        </button>
                        <button className={tabStyle('bank')} onClick={() => setTab('bank')}>
                            Commitment Bank ({filteredBankCommitments.length})
                        </button>
                        <button className={tabStyle('custom')} onClick={() => setTab('custom')}>
                            Custom Commitment
                        </button>
                    </div>
                    
                    {/* Tab Content */}
                    <div className='mt-0 bg-[#FCFCFA] p-6 rounded-b-3xl shadow-lg border-2 border-t-0 border-[#47A88D]/30'>
                    
                        {/* PDP Content Tab */}
                        {tab === 'pdp' && (
                            <div className="space-y-4">
                                <p className='text-sm text-gray-700'>Items required for the current PDP month ({currentMonthPlan?.month || 'N/A'}).</p>
                                <div className="h-64 overflow-y-auto pr-2 space-y-3 pt-2">
                                {pdpContentReady.length > 0 ? (
                                    pdpContentReady.map(c => (
                                        <div key={c.id} className="flex justify-between items-center p-3 text-sm bg-[#47A88D]/5 rounded-lg border border-[#47A88D]/20">
                                            <span className='text-gray-800 font-medium'>{c.title} ({c.type}) (~{c.duration} min)</span>
                                            <button 
                                                onClick={() => handleAddCommitment(c, 'pdp')}
                                                disabled={!canAddCommitment || isSaving}
                                                className={`font-semibold text-xs transition-colors p-1 flex items-center space-x-1 ${canAddCommitment ? 'text-[#47A88D] hover:text-[#349881]' : 'text-gray-400 cursor-not-allowed'}`}
                                            >
                                                <PlusCircle className='w-4 h-4'/>
                                                <span className='hidden sm:inline'>Add</span>
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 italic text-center py-10">No outstanding PDP content to add to your scorecard.</p>
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
                                
                                <div className="h-64 overflow-y-auto pr-2 space-y-3">
                                    {/* FIX: Safely access require('../../data/Constants').leadershipCommitmentBank */}
                                    {Object.entries(require('../../data/Constants').leadershipCommitmentBank || {}).map(([category, commitments]) => {
                                        const categoryCommitments = commitments.filter(c => 
                                            !userCommitments.some(uc => uc.text === c.text) && // Simple text match check to avoid re-adding bank items
                                            c.text.toLowerCase().includes(searchTerm.toLowerCase())
                                        );

                                        if (categoryCommitments.length === 0) return null;

                                        return (
                                            <div key={category}>
                                                <h3 className="text-sm font-bold text-[#002E47] border-b pb-1 mb-2">{category}</h3>
                                                {categoryCommitments.map(c => (
                                                    <div key={c.id} className="flex justify-between items-center p-2 text-sm bg-gray-50 rounded-lg mb-1">
                                                        <span className='text-gray-800'>{c.text}</span>
                                                        <button 
                                                            onClick={() => handleAddCommitment(c, 'bank')}
                                                            disabled={!canAddCommitment || isSaving}
                                                            className={`font-semibold text-xs transition-colors p-1 ${canAddCommitment ? 'text-[#47A88D] hover:text-[#349881]' : 'text-gray-400 cursor-not-allowed'}`}
                                                        >
                                                            <PlusCircle className='w-4 h-4'/>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })}
                                    {filteredBankCommitments.length === 0 && <p className="text-gray-500 italic mt-4 text-center">No unselected commitments match your search.</p>}
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
                                    disabled={!customCommitment.trim() || !canAddCommitment || isSaving} 
                                    className="w-full bg-[#47A88D] hover:bg-[#349881]"
                                >
                                    {isSaving ? 'Saving...' : 'Add Custom Commitment'}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Daily Practice Screen (default export) ---
const CommitmentItem = ({ commitment, onLogCommitment, onRemove }) => {
    // FIX: Safely access LEADERSHIP_TIERS from useAppServices
    const { LEADERSHIP_TIERS: Tiers = {} } = useAppServices();

    const getStatusColor = (status) => {
        if (status === 'Committed') return 'bg-green-100 text-green-800 border-green-500 shadow-md';
        if (status === 'Missed') return 'bg-red-100 text-red-800 border-red-500 shadow-md';
        return 'bg-gray-100 text-gray-700 border-gray-300 shadow-sm';
    };

    const getStatusIcon = (status) => {
        if (status === 'Committed') return <CheckCircle className="w-5 h-5 text-green-600" />;
        if (status === 'Missed') return <X className="w-5 h-5 text-[#E04E1B]" />;
        return <Clock className="w-5 h-5 text-gray-500" />;
    };

    const status = commitment.status || 'Pending';

    // FIX: Safely use Tiers here
    const tierMeta = commitment.linkedTier ? Tiers[commitment.linkedTier] : null;
    const tierLabel = tierMeta ? `${tierMeta.id}: ${tierMeta.name}` : 'N/A';
    const colleagueLabel = commitment.targetColleague || 'Self-Focus';

    return (
        <div className={`p-4 rounded-xl flex flex-col justify-between ${getStatusColor(status)} transition-all duration-300`}>
            <div className='flex items-start justify-between'>
                <div className='flex items-center space-x-2 text-lg font-semibold mb-2'>
                    {getStatusIcon(status)}
                    <span className='text-[#002E47] text-base'>{commitment.text || commitment.title}</span>
                </div>
                <button onClick={() => onRemove(commitment.id)} className="text-gray-400 hover:text-[#E04E1B] transition-colors p-1 rounded-full">
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
                    Focus: {colleagueLabel}
                </div>
            </div>
            
            <div className="flex space-x-2 mt-3 pt-3 border-t border-gray-300/50">
                <Button 
                    onClick={() => onLogCommitment(commitment.id, 'Committed')} 
                    disabled={status === 'Committed'}
                    className="px-3 py-1 text-xs bg-[#47A88D] hover:bg-[#349881] disabled:bg-green-300 disabled:shadow-none"
                    >
                    Committed
                </Button>
                <Button 
                    onClick={() => onLogCommitment(commitment.id, 'Missed')} 
                    disabled={status === 'Missed'}
                    className="px-3 py-1 text-xs bg-[#E04E1B] hover:bg-red-700 disabled:bg-red-300 disabled:shadow-none"
                    >
                    Missed
                </Button>
                {status !== 'Pending' && (
                    <Button
                        onClick={() => onLogCommitment(commitment.id, 'Pending')}
                        variant="outline"
                        className="px-3 py-1 text-xs border-gray-400 text-gray-700 hover:bg-gray-200"
                    >
                        Reset
                    </Button>
                )}
            </div>
        </div>
    );
}

const ScorecardView = ({ setView, initialGoal, initialTier, isSaving, commitmentData, handleLogCommitment, handleRemoveCommitment, handleSaveReflection, calculateTotalScore, calculateStreak, commitmentHistory, reflection, setReflection }) => {
    // FIX: Safely access LEADERSHIP_TIERS from useAppServices
    const { LEADERSHIP_TIERS: Tiers = {} } = useAppServices();

    const streak = calculateStreak(commitmentHistory);
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
                                <CornerRightUp className='w-4 h-4 mr-2'/> New PDP Focus:
                            </p>
                            {/* FIX: Safely access Tiers here */}
                            <p>Your new focus area is **{initialGoal || Tiers[initialTier]?.name || 'a new phase'}**. Click 'Manage Commitments' to align your daily practice to this goal!</p>
                            </div>
                    )}
                    <div className="mb-8 flex justify-between items-center">
                        <h3 className="text-2xl font-extrabold text-[#002E47]">
                            Today's Commitments ({commitmentData?.active_commitments?.length || 0})
                        </h3>
                        <Button onClick={() => setView('selector')} variant="outline" className="text-sm px-4 py-2" disabled={isSaving}>
                            <PlusCircle className="w-4 h-4 mr-2"/> Manage Commitments
                        </Button>
                    </div>

                    <Card title="Current Commitments" icon={Target} className="mb-8 border-l-4 border-[#47A88D] rounded-3xl">
                        <div className="space-y-4">
                            {commitmentData?.active_commitments?.length > 0 ? (
                                commitmentData.active_commitments.map(c => (
                                    <CommitmentItem 
                                        key={c.id} 
                                        commitment={c} 
                                        onLogCommitment={handleLogCommitment}
                                        onRemove={handleRemoveCommitment}
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
                                commitmentData?.active_commitments?.length > 0 && commitmentData.active_commitments.every(c => c.status === 'Committed') ? 'text-green-600 bg-green-50' : 'text-[#002E47] bg-gray-100'
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


            <Card title="Reinforcement Journal" icon={AlertTriangle} className="bg-[#002E47]/10 border-2 border-[#002E47]/20 rounded-3xl mt-8">
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

export default function DailyPracticeScreen({ initialGoal, initialTier }) {
    const { commitmentData, updateCommitmentData, isLoading, error } = useAppServices();
    const [view, setView] = useState('scorecard'); 
    const [isSaving, setIsSaving] = useState(false);
    
    // FIX: Safely initialize reflection if commitmentData is null on first render
    const [reflection, setReflection] = useState('');
    
    // Auto-switch to selector if navigation params are present
    useEffect(() => {
        if ((initialGoal || initialTier) && view === 'scorecard') {
            setView('selector');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialGoal, initialTier]);

    useEffect(() => {
        if (commitmentData) {
            setReflection(commitmentData.reflection_journal || '');
        }
    }, [commitmentData]);

    if (isLoading) {
        return (
            <div className="p-6 min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
                <p className="text-emerald-700 ml-3">Loading practice data...</p>
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
        
        // This logic handles both commitment status and rep count updates
        const updatedCommitments = userCommitments.map(c => {
            if (c.id === id) {
                // Determine if a rep needs to be added/removed (only for transition from Pending/Missed to Committed)
                const isNewCommit = status === 'Committed' && c.status !== 'Committed';
                const isUncommit = status !== 'Committed' && c.status === 'Committed';
                
                const newReps = (c.currentReps || 0) + (isNewCommit ? 1 : 0) - (isUncommit ? 1 : 0);
                const finalReps = Math.max(0, newReps);
                
                return { 
                    ...c, 
                    status: status,
                    currentReps: finalReps,
                };
            }
            return c;
        });

        await updateCommitmentData({ active_commitments: updatedCommitments });
        setIsSaving(false);
    };

    const handleRemoveCommitment = async (id) => {
        if (!window.confirm('Are you sure you want to remove this active commitment? This is irreversible.')) return;
        
        setIsSaving(true);
        const updatedCommitments = userCommitments.filter(c => c.id !== id);

        // Also remove associated reps (if applicable, though unnecessary for the scorecard view)
        await updateCommitmentData(data => ({ 
            active_commitments: updatedCommitments,
            reps: data.reps.filter(r => r.commitmentId !== id),
            history: data.history || [],
        }), COMMITMENT_COLLECTION);
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
        return `${committedCount}/${total}`;
    };
    
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
                break;
            } else {
                if (streak > 0) break;
            }
        }
        return streak;
    };


    const sharedProps = {
        setView,
        isSaving,
        initialGoal,
        initialTier,
        commitmentData,
        handleLogCommitment,
        handleRemoveCommitment,
        handleSaveReflection,
        calculateTotalScore,
        calculateStreak,
        commitmentHistory,
        reflection,
        setReflection
    };

    return view === 'selector' 
        ? <CommitmentSelectorView {...sharedProps} />
        : <ScorecardView {...sharedProps} />;
}
