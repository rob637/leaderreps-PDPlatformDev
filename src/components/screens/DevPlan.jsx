import React, { useState, useEffect, useMemo, useCallback } from 'react';
// FIX 1: Correct path depth (Up 2 levels: screens/ -> components/ -> src/)
import { useAppServices } from '../../App';
import { Card, Button, Tooltip } from '../shared/UI';
// FIX 2: Correct path depth for Constants
import { IconMap, LEADERSHIP_TIERS, PDP_COLLECTION, PDP_DOCUMENT, generatePlanData } from '../../data/Constants';
import { ArrowLeft, Target, BarChart3, Users, Clock as ClockIcon, Eye, X, CornerRightUp, BookOpen } from 'lucide-react';
import { doc, writeBatch, setDoc } from 'firebase/firestore'; 
// FIX 3: Correct path depth for ApiHelpers
import { mdToHtml } from '../../utils/ApiHelpers'; 

// NOTE: MOCK_CONTENT_DETAILS is imported from src/data/Constants.js in the imports above.
const MOCK_CONTENT_DETAILS = {
    'Reading': (title, skill) => `### Core Concepts of ${title}\n\n**Focus Skill:** ${skill}\n\nThis article highlights the importance of asynchronous communication, creating clear documentation, and setting "done" criteria upfront to reduce execution drag. Your primary takeaway should be the principle: **Clear is Kind, Vague is Cruel.**\n\n* **Action Item:** Schedule 30 minutes for process mapping.\n* **Key Term:** Psychological Safety.`,
    'Exercise': (title, skill) => `### Guided Practice: ${title}\n\n**Focus Skill:** ${skill}\n\nThis exercise requires you to journal or draft statements based on a self-reflective prompt. Use the questions below as a starting point. Your goal is to identify a core belief and define a corresponding measurable behavior.\n\n* **Prompt 1:** When was the last time you felt truly in integrity with your stated values?\n* **Prompt 2:** What is the most difficult piece of feedback you have successfully processed and implemented?`,
    'Journal': (title, skill) => `### Journal Prompt: ${title}\n\n**Focus Skill:** ${skill}\n\nDedicate 15 minutes to freewriting based on this reflection prompt. Do not edit or self-censored. Just write.\n\n* **Reflection Focus:** Describe a recent decision where the easiest path conflicted with the most ethical or strategically correct path. What was the impact on your long-term credibility?`,
    'Quiz': (title, skill) => `### Self-Assessment: ${title}\n\n**Focus Skill:** ${skill}\n\nThis is a quick self-score. Rate yourself 1-5 (1=Never, 5=Always) on the following statements.\n\n* I actively ask for negative feedback from my team.\n* I publicly own mistakes before assigning blame.`,
    'Case Study': (title, skill) => `### Case Study Setup: ${title}\n\n**Focus Skill:** ${skill}\n\nReview the following scenario description and prepare a 5-step action plan before running the simulation or discussing with your coach. The scenario involves a failure to delegate a crucial task to a capable subordinate, leading to team burnout and missed deadlines.`,
    'Tool': (title, skill) => `### Tool Overview: ${title}\n\n**Focus Skill:** ${skill}\n\nThis module guides you through a new framework. The current focus is risk identification and mitigation planning. The objective of this tool is to formalize risk assessment across your strategic goals.`,
};


// --- Content Details Modal ---
const ContentDetailsModal = ({ isVisible, onClose, content }) => {
    // NOTE: Icon components (BookOpen, X, Eye) are imported from lucide-react at the top of the file
    if (!isVisible || !content) return null;

    const { IconMap } = useAppServices();
    const [htmlContent, setHtmlContent] = useState('');
    const mockDetail = MOCK_CONTENT_DETAILS[content.type] 
                        ? MOCK_CONTENT_DETAILS[content.type](content.title, content.skill) 
                        : `### Content Unavailable\n\nNo detailed mock content available for type: **${content.type}**`;
    
    useEffect(() => {
        // mdToHtml is imported from ApiHelpers
        (async () => setHtmlContent(await mdToHtml(mockDetail)))();
    }, [content.id, mockDetail]);

    return (
        <div className="fixed inset-0 bg-[#002E47]/80 z-50 flex items-center justify-center p-4">
            <div className="bg-[#FCFCFA] rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-8">
                
                <div className="flex justify-between items-start border-b pb-4 mb-6">
                    <h2 className="text-3xl font-extrabold text-[#002E47] flex items-center">
                        <BookOpen className="w-8 h-8 mr-3 text-[#47A88D]" />
                        {content.title} ({content.type})
                    </h2>
                    <button onClick={onClose} className="p-2 text-gray-500 hover:text-[#E04E1B] transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="mb-6 text-sm flex space-x-4 border-b pb-4">
                    <p className="text-gray-700">**Tier:** {LEADERSHIP_TIERS[content.tier]?.name}</p>
                    <p className="text-gray-700">**Skill Focus:** {content.skill}</p>
                    <p className="text-gray-700">**Est. Duration:** {content.duration} min</p>
                </div>

                <div className="prose max-w-none text-gray-700">
                    <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
                </div>

                <Button onClick={onClose} className='mt-8 w-full'>
                    Close & Return to Plan
                </Button>
            </div>
        </div>
    );
};

// --- Modal for Tier Review ---
const TierReviewModal = ({ isVisible, onClose, tierId, planData }) => {
    if (!isVisible || !tierId) return null;

    const tierMeta = LEADERSHIP_TIERS[tierId];
    if (!tierMeta) return null;

    // Filter all months belonging to the completed tier
    const completedTierMonths = planData.plan
        .filter(m => m.tier === tierId && m.month < planData.currentMonth)
        .sort((a, b) => a.month - b.month);

    // Get the final self-rating used to generate the content for this tier
    const initialRating = planData.assessment.selfRatings[tierId];
    const difficultyText = initialRating >= 8 ? 'Mastery' : initialRating >= 5 ? 'Core' : 'Intro';

    return (
        <div className="fixed inset-0 bg-[#002E47]/80 z-50 flex items-center justify-center p-4">
            <div className="bg-[#FCFCFA] rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-8">
                
                <div className="flex justify-between items-start border-b pb-4 mb-6">
                    <h2 className="text-3xl font-extrabold text-[#002E47] flex items-center">
                        <Eye className="w-8 h-8 mr-3 text-[#47A88D]" />
                        Completed Tier Review: {tierMeta.name}
                    </h2>
                    <button onClick={onClose} className="p-2 text-gray-500 hover:text-[#E04E1B] transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="mb-6 space-y-2">
                    <p className="text-md text-gray-700">
                        **Initial Self-Rating:** <span className='font-bold text-[#47A88D]'>{initialRating}/10</span> 
                        (Content difficulty generated at the **{difficultyText}** level)
                    </p>
                    <p className="text-md text-gray-700">
                        **Duration:** {completedTierMonths.length} Months (Completed **{completedTierMonths.filter(m => m.status === 'Completed').length}** / {completedTierMonths.length} Months)
                    </p>
                </div>

                <h3 className="text-xl font-bold text-[#002E47] mb-4 border-b pb-2">Monthly Breakdown & Reflections</h3>
                
                <div className="space-y-6">
                    {completedTierMonths.map(month => (
                        <div key={month.month} className='p-5 bg-gray-50 rounded-xl border-l-4 border-[#002E47]/50 shadow-sm'>
                            <p className='text-lg font-extrabold text-[#002E47] mb-2'>Month {month.month} Focus: {month.theme}</p>
                            <div className='text-sm mb-3'>
                                <p className='font-semibold text-[#47A88D]'>Completed Content:</p>
                                <ul className='list-disc pl-5 text-gray-700'>
                                    {month.requiredContent.map(item => (
                                        <li key={item.id} className={`${item.status === 'Completed' ? 'line-through text-gray-600' : 'text-gray-400 italic'}`}>{item.title} ({item.type})</li>
                                    ))}
                                </ul>
                            </div>
                            <p className='text-sm text-gray-700'>
                                <span className='font-semibold'>Reflection:</span> {month.reflectionText || 'No reflection logged.'}
                            </p>
                        </div>
                    ))}
                </div>

                <Button onClick={onClose} className='mt-8 w-full'>
                    Close Review
                </Button>
            </div>
        </div>
    );
};


// --- Tracker Dashboard View ---
const TrackerDashboardView = ({ data, updatePdpData, saveNewPlan, db, userId, navigate }) => {
    const { appId, IconMap } = useAppServices();
    const currentMonth = data.currentMonth;
    const currentMonthPlan = data.plan.find(m => m.month === currentMonth);
    const nextMonthPlan = data.plan.find(m => m.month === currentMonth + 1);
    const nextMonthFocus = nextMonthPlan ? LEADERSHIP_TIERS[nextMonthPlan.tier].name : null;
    const nextMonthTier = nextMonthPlan ? nextMonthPlan.tier : null;

    const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
    const [reviewTierId, setReviewTierId] = useState(null);
    const [isContentModalVisible, setIsContentModalVisible] = useState(false);
    const [selectedContent, setSelectedContent] = useState(null);

    const assessment = data.assessment;

    const [localReflection, setLocalReflection] = useState(currentMonthPlan?.reflectionText || '');
    const [isSaving, setIsSaving] = useState(false);

    // Calculate completed tiers to show review buttons
    const completedTiers = useMemo(() => {
        const fullyCompletedTiers = Object.keys(LEADERSHIP_TIERS).filter(tierId => {
            const tierMonths = data.plan.filter(m => m.tier === tierId);
            if (tierMonths.length < 4) return false; 
            const lastMonthForTier = tierMonths.find(m => m.month < currentMonth);
            return lastMonthForTier && lastMonthForTier.status === 'Completed';
        });
        return fullyCompletedTiers;
    }, [data.plan, currentMonth]);


    // Sync local state with loaded Firestore data
    useEffect(() => {
        if (currentMonthPlan) {
            setLocalReflection(currentMonthPlan.reflectionText || '');
        }
    }, [currentMonthPlan]);

    // --- Handlers ---
    const handleCompleteMonth = async () => {
        const currentReflection = localReflection;
        if (currentReflection.length < 50) {
            alert('Reflection required! Please write at least 50 characters to mark this month complete.');
            return; 
        }

        setIsSaving(true);
        try {
            const batch = writeBatch(db);
            const docRef = doc(db, `/artifacts/${appId}/users/${userId}/${PDP_COLLECTION}/${PDP_DOCUMENT}`);

            const updatedPlan = data.plan.map(m => {
                if (m.month === currentMonth) {
                    return {
                        ...m,
                        status: 'Completed',
                        reflectionText: currentReflection,
                        monthCompletedDate: new Date().toISOString(),
                    };
                }
                return m;
            });
            
            batch.update(docRef, {
                plan: updatedPlan,
                currentMonth: currentMonth + 1,
                lastUpdate: new Date().toISOString(),
            });

            await batch.commit();

            setLocalReflection('');
            alert('Month successfully completed! Advancing to the next phase.');

            if (nextMonthFocus) {
                 navigate('daily-practice', { 
                    initialGoal: nextMonthFocus,
                    initialTier: nextMonthTier
                });
            }


        } catch (e) {
            console.error("Error advancing month via batch:", e);
            alert(`Failed to complete month. Error: ${e.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleResetPlan = async () => {
        const shouldReset = window.confirm("WARNING: Are you sure you want to discard this plan and regenerate? All plan history will be lost.");
        
        if (shouldReset) {
            setIsSaving(true);
            try {
                const docRef = doc(db, `/artifacts/${appId}/users/${userId}/${PDP_COLLECTION}/${PDP_DOCUMENT}`);
                await setDoc(docRef, { }, { merge: false }); 
                 alert("Plan successfully reset! Loading generator...");
            } catch (e) {
                alert(`Failed to reset plan. Error: ${e.message}`);
            } finally {
                setIsSaving(false);
            }
        }
    };

    const handleContentStatusToggle = (contentId) => {
        const updatedPlan = data.plan.map(m => {
            if (m.month === currentMonth) {
                const updatedContent = m.requiredContent.map(item => {
                    if (item.id === contentId) {
                        return { 
                            ...item, 
                            status: item.status === 'Completed' ? 'Pending' : 'Completed' 
                        };
                    }
                    return item;
                });
                return { ...m, requiredContent: updatedContent };
            }
            return m;
        });

        updatePdpData({ plan: updatedPlan });
    };

    const handleOpenTierReview = (tierId) => {
        setReviewTierId(tierId);
        setIsReviewModalVisible(true);
    };

    const handleOpenContentModal = (contentItem) => {
        setSelectedContent(contentItem);
        setIsContentModalVisible(true);
    };


    if (!currentMonthPlan) {
        return (
             <div className="p-8">
                <h1 className="text-3xl font-extrabold text-[#002E47] mb-6">Roadmap Complete!</h1>
                <p class='text-lg text-gray-600 mb-8'>Congratulations on completing your 24-month roadmap. You are now a **Seasoned Leader**!</p>
                <Button onClick={handleResetPlan}>Generate New Roadmap</Button>
            </div>
        )
    }

    const allContentCompleted = currentMonthPlan?.requiredContent?.every(item => item.status === 'Completed');
    const isReadyToComplete = allContentCompleted && localReflection.length >= 50;

    const progressPercentage = Math.min(100, (currentMonth / 24) * 100);

    const TierIcon = LEADERSHIP_TIERS[currentMonthPlan?.tier]?.icon 
                        ? IconMap[LEADERSHIP_TIERS[currentMonthPlan.tier].icon] 
                        : Target;

    return (
        <div className="p-8">
            <h1 className="text-3xl font-extrabold text-[#002E47] mb-6">Tracker Dashboard: Your 24-Month Roadmap</h1>
            <p className="text-lg text-gray-600 mb-8 max-w-3xl">This plan is tailored to your **Manager Status, Self-Ratings, and Goal Priorities**. Focus on completing your monthly content and reflecting on your growth.</p>
            
            {/* Progress Bar & Header */}
            <Card title={`Roadmap Progress: Month ${currentMonth} of 24`} icon={'Clock'} className="bg-[#002E47]/10 border-4 border-[#002E47]/20 mb-8">
                <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                    <div 
                        className="bg-[#47A88D] h-4 rounded-full transition-all duration-700" 
                        style={{ width: `${progressPercentage}%` }}
                    ></div>
                </div>
                <p className='text-sm font-medium text-[#002E47]'>
                    {Math.round(progressPercentage)}% Complete. Next Tier Focus in {4 - ((currentMonth - 1) % 4)} months.
                </p>
                {/* FIX: Closing the Button tag that was cut off */}
                <Button onClick={handleResetPlan} variant='outline' className='mt-4 text-xs px-4 py-2 text-[#E04E1B] border-[#E04E1B]/50 hover:bg-[#E04E1B]/10'>
                    Start Over / Re-Generate Plan
                </Button>
            </Card>
            
            {/* Tier Review Section */}
            {completedTiers.length > 0 && (
                <Card title="Tier Review Center" icon={'Eye'} className='mb-8 border-l-4 border-[#002E47]'>
                    <p className='text-sm text-gray-700 mb-4'>Review your progress and reflections for past, completed leadership tiers.</p>
                    <div className='flex flex-wrap gap-3'>
                        {completedTiers.map(tierId => {
                            const tier = LEADERSHIP_TIERS[tierId];
                            return (
                                <Button
                                    key={tierId}
                                    onClick={() => handleOpenTierReview(tierId)}
                                    variant="outline"
                                    className='text-xs px-4 py-2 border-[#002E47] text-[#002E47] hover:bg-[#002E47]/10'
                                >
                                    Review {tier.id}: {tier.name}
                                </Button>
                            );
                        })}
                    </div>
                </Card>
            )}

            {/* Current Month Plan */}
            <div className='lg:grid lg:grid-cols-3 lg:gap-8'>
                <div className='lg:col-span-2 space-y-8'>
                    {/* Use the safely retrieved TierIcon */}
                    <Card title={`Current Focus: ${currentMonthPlan?.theme}`} icon={TierIcon} className='border-l-8 border-[#47A88D]'>
                        
                        <div className='mb-4 text-sm'>
                            <p className='font-bold text-[#002E47]'>Tier: {LEADERSHIP_TIERS[currentMonthPlan?.tier]?.name}</p>
                            <p className='text-gray-600'>Target Difficulty: **{assessment?.selfRatings[currentMonthPlan?.tier] >= 8 ? 'Mastery' : assessment?.selfRatings[currentMonthPlan?.tier] >= 5 ? 'Core' : 'Intro'}** (based on your self-rating of {assessment?.selfRatings[currentMonthPlan?.tier]}/10)</p>
                        </div>

                        <h3 className='text-xl font-bold text-[#002E47] border-t pt-4 mt-4'>Required Content Items</h3>
                        <div className='space-y-3 mt-4'>
                            {currentMonthPlan?.requiredContent.map(item => (
                                <div key={item.id} className='flex items-center justify-between p-3 bg-gray-50 rounded-xl shadow-sm'>
                                    <div className='flex flex-col'>
                                        <p className={`font-semibold text-sm ${item.status === 'Completed' ? 'line-through text-gray-500' : 'text-[#002E47]'}`}>
                                            {item.title} ({item.type})
                                        </p>
                                        <p className='text-xs text-gray-600'>~{item.duration} min | Difficulty: {item.difficulty}</p>
                                    </div>
                                    <div className='flex space-x-2'>
                                        <Button
                                            onClick={() => handleOpenContentModal(item)}
                                            className='px-3 py-1 text-xs'
                                            variant='outline'
                                        >
                                            <Eye className="w-4 h-4"/>
                                        </Button>
                                        <Button
                                            onClick={() => handleContentStatusToggle(item.id)}
                                            className='px-3 py-1 text-xs'
                                            variant={item.status === 'Completed' ? 'secondary' : 'primary'}
                                            disabled={isSaving}
                                        >
                                            {item.status === 'Completed' ? 'Done ✓' : 'Mark Complete'}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card title="Monthly Reflection" icon={'Lightbulb'} className="bg-[#002E47]/10 border-2 border-[#002E47]/20">
                        <p className="text-gray-700 text-sm mb-4">
                            Reflect on the growth you achieved this month. How did the content impact your daily leadership behavior? (**Minimum 50 characters required**)
                        </p>
                        <textarea 
                            value={localReflection}
                            onChange={(e) => setLocalReflection(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-[#47A88D] focus:border-[#47A88D] h-40" 
                            placeholder="My reflection (required)..."
                        ></textarea>
                        <p className={`text-xs mt-1 ${localReflection.length < 50 ? 'text-[#E04E1B]' : 'text-[#47A88D]'}`}>
                            {localReflection.length} / 50 characters written.
                        </p>
                    </Card>

                </div>
                
                <div className='lg:col-span-1 space-y-8'>
                    <Card title="Advance Roadmap" icon={CornerRightUp} className='bg-[#47A88D]/10 border-4 border-[#47A88D]'>
                        <p className='text-sm text-gray-700 mb-4'>
                            Once all content items are marked complete and you have written your reflection, click below to lock this month's progress and move to **Month {currentMonth + 1}** of your plan.
                        </p>
                        <Button 
                            onClick={handleCompleteMonth} 
                            disabled={isSaving || !isReadyToComplete}
                            className='w-full bg-[#47A88D] hover:bg-[#349881]'
                        >
                            {isSaving ? 'Processing...' : `Complete Month ${currentMonth}`}
                        </Button>
                        {!allContentCompleted && (
                            <p className='text-[#E04E1B] text-xs mt-2'>* Finish all content items first.</p>
                        )}
                        {allContentCompleted && localReflection.length < 50 && (
                             <p className='text-[#E04E1B] text-xs mt-2'>* Reflection required (50 chars min).</p>
                        )}
                    </Card>
                    
                    {/* Next Month Preview Card */}
                    {nextMonthPlan && (
                        <Card title={`Next Month: Month ${currentMonth + 1}`} icon={'Clock'} className='bg-[#FCFCFA]'>
                            <p className='text-sm font-semibold text-[#002E47] mb-2'>Tier: {LEADERSHIP_TIERS[nextMonthPlan.tier].name}</p>
                            <p className='text-md text-gray-700 mb-3'>{nextMonthPlan.theme}</p>
                            <ul className='list-disc pl-5 text-sm text-gray-600 space-y-1'>
                                {nextMonthPlan.requiredContent.slice(0, 3).map((item, index) => (
                                    <li key={index}>{item.title} (~{item.duration} min)</li>
                                ))}
                            </ul>
                            <p className='text-xs text-[#47A88D] mt-3'>Total est. time: {nextMonthPlan.totalDuration} min.</p>
                        </Card>
                    )}
                </div>
            </div>
            
            {/* Modals */}
            <TierReviewModal
                isVisible={isReviewModalVisible}
                onClose={() => setIsReviewModalVisible(false)}
                tierId={reviewTierId}
                planData={data}
            />
            <ContentDetailsModal
                isVisible={isContentModalVisible}
                onClose={() => setIsContentModalVisible(false)}
                content={selectedContent}
            />
        </div>
    );
};


// --- Plan Generator View ---
const PlanGeneratorView = ({ userId, saveNewPlan, isLoading, error }) => {
    const [managerStatus, setManagerStatus] = useState('New');
    const [goalPriorities, setGoalPriorities] = useState([]);
    const [selfRatings, setSelfRatings] = useState({ T1: 5, T2: 5, T3: 5, T4: 5, T5: 5 });
    const [isGenerating, setIsGenerating] = useState(false);

    const isGoalLimitReached = goalPriorities.length >= 3;
    const canGenerate = managerStatus && goalPriorities.length > 0 && !isGenerating;

    const handleGoalToggle = (tierId) => {
        setGoalPriorities(prev => {
            if (prev.includes(tierId)) {
                return prev.filter(id => id !== tierId);
            }
            if (isGoalLimitReached) {
                alert("You can select a maximum of 3 goal priorities.");
                return prev;
            }
            return [...prev, tierId];
        });
    };

    const handleRatingChange = (tierId, value) => {
        setSelfRatings(prev => ({ ...prev, [tierId]: parseInt(value) }));
    };

    const handleGenerate = async () => {
        if (!canGenerate) return;
        setIsGenerating(true);
        
        const assessment = {
            managerStatus,
            goalPriorities,
            selfRatings,
            dateGenerated: new Date().toISOString(),
        };

        const newPlanData = generatePlanData(assessment, userId);

        const success = await saveNewPlan(newPlanData);
        if (!success) {
             alert("Failed to save the plan. Check the console for database errors.");
        }
        setIsGenerating(false);
    };

    return (
        <div className="p-8">
            <h1 className="text-3xl font-extrabold text-[#002E47] mb-6">Personalized 24-Month Plan Generator</h1>
            <p className="text-lg text-gray-600 mb-8 max-w-3xl">Answer a few questions about your current role and goals to instantly generate a hyper-personalized leadership roadmap designed to close your skill gaps over the next two years.</p>
            
            {error && (
                 <p className="text-[#E04E1B] p-4 bg-red-100 rounded-xl mb-6">Application Error: {error}</p>
            )}

            <div className="space-y-10">
                <Card title="1. Your Management Experience" icon={Users} className='border-l-4 border-[#47A88D]'>
                    <h3 className="text-md font-semibold text-gray-700 mb-3">Select your current status:</h3>
                    <div className="flex space-x-4">
                        {['New', 'Mid-Level', 'Seasoned'].map(status => (
                            <button
                                key={status}
                                onClick={() => setManagerStatus(status)}
                                className={`px-4 py-2 rounded-xl font-semibold transition-all shadow-md ${managerStatus === status ? 'bg-[#47A88D] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                                status
                            </button>
                        ))}
                    </div>
                    <p className='text-xs text-gray-500 mt-3'>This sets your starting tier (e.g., New starts at T1: Self-Awareness).</p>
                </Card>

                <Card title="2. Goal Priorities (Max 3)" icon={Target} className='border-l-4 border-[#002E47]'>
                    <h3 className="text-md font-semibold text-gray-700 mb-3">Which tiers are most important to you right now?</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.values(LEADERSHIP_TIERS).map(tier => (
                            <label key={tier.id} className={`flex items-center p-3 rounded-xl border-2 transition-all cursor-pointer ${goalPriorities.includes(tier.id) ? 'bg-[#002E47]/10 border-[#002E47]' : 'bg-[#FCFCFA] border-gray-200 hover:border-[#47A88D]'}`}>
                                <input
                                    type="checkbox"
                                    checked={goalPriorities.includes(tier.id)}
                                    onChange={() => handleGoalToggle(tier.id)}
                                    className="h-5 w-5 text-[#47A88D] rounded mr-3"
                                    disabled={isGoalLimitReached && !goalPriorities.includes(tier.id)}
                                />
                                <div>
                                    <p className="font-semibold text-[#002E47]">{tier.name}</p>
                                    <p className="text-xs text-gray-600">({tier.id})</p>
                                </div>
                            </label>
                        ))}
                    </div>
                </Card>

                <Card title="3. Self-Ratings (Skill Gap Assessment)" icon={BarChart3} className='border-l-4 border-[#47A88D]'>
                    <h3 className="text-md font-semibold text-gray-700 mb-6">Rate your current effectiveness (1 = Low Skill/Confidence, 10 = Mastery):</h3>
                    {Object.values(LEADERSHIP_TIERS).map(tier => (
                        <div key={tier.id} className="mb-6">
                            <p className="font-semibold text-[#002E47] flex justify-between">
                                <span>{tier.name}:</span>
                                <span className='text-xl font-extrabold text-[#47A88D]'>{selfRatings[tier.id]}/10</span>
                            </p>
                            <input
                                type="range"
                                min="1"
                                max="10"
                                value={selfRatings[tier.id]}
                                onChange={(e) => handleRatingChange(tier.id, e.target.value)}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg accent-[#47A88D]"
                            />
                            <p className='text-xs text-gray-500 mt-1'>Rating influences target **content difficulty** (Low rating = Intro/Core content; High rating = Mastery).</p>
                        </div>
                    ))}
                </Card>
            </div>

            <Button onClick={handleGenerate} disabled={!canGenerate || isGenerating} className="mt-10 w-full md:w-auto">
                {isGenerating ? (
                    <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Generating 24-Month Plan...
                    </div>
                ) : 'Generate Personalized 24-Month Plan'}
            </Button>
            <p className='text-sm text-gray-500 mt-4'>*Your data will be securely saved to your private roadmap in Firestore.</p>
        </div>
    );
};


// --- Main Router ---
export const ProfDevPlanScreen = () => {
    const { pdpData, saveNewPlan, isLoading, error, userId } = useAppServices();

    if (isLoading || pdpData === undefined) {
        return (
            <div className="p-8 min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#47A88D] mb-3"></div>
                    <p className="text-[#47A88D] font-medium">Loading Personalized Development Plan...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8">
                <p className="text-[#E04E1B] p-4 bg-red-100 rounded-xl">Application Error: {error}</p>
                <p className="text-gray-600 mt-4">If this error persists, check your browser console for Firebase configuration or security rule errors.</p>
            </div>
        );
    }

    if (pdpData === null) {
        return <PlanGeneratorView userId={userId} saveNewPlan={saveNewPlan} isLoading={false} error={null} />;
    }

    // pdpData exists -> show the tracker dashboard
    return <TrackerDashboardView data={pdpData} />;
};

export default ProfDevPlanScreen;
