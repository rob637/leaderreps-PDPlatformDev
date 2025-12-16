// src/components/screens/DevPlan.jsx

import { Home, Settings, Zap, Clock, Briefcase, Mic, Trello, BookOpen, BarChart3, TrendingUp, TrendingDown, CheckCircle, Star, Target, Users, HeartPulse, CornerRightUp, X, ArrowLeft, Activity, Link, Lightbulb, AlertTriangle, Eye, PlusCircle, Cpu, MessageSquare, Check, Calendar, Dumbbell, Send, Send as ShareIcon } from 'lucide-react';
import React, { useState, useEffect, useMemo, useCallback } from 'react';

// --- SERVICES (production) ---
import { useAppServices } from '../../services/useAppServices';
import { Button, Card } from '../ui';

// --- Prep Phase Widgets ---
import LeaderProfileWidget from '../widgets/LeaderProfileWidget';
import BaselineAssessmentWidget from '../widgets/BaselineAssessmentWidget';

// --- Tooltip Component ---
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
                <div className="absolute z-10 w-64 p-3 -mt-2 -ml-32 text-xs text-white bg-corporate-navy rounded-lg shadow-lg bottom-full left-1/2 transform translate-x-1/2">
                    {content}
                    <div className="absolute left-1/2 transform -translate-x-1/2 bottom-[-4px] w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-corporate-navy"></div>
                </div>
            )}
        </div>
    );
};
const mdToHtml = async (md) => {
    let html = md;
    html = html.replace(/## (.*$)/gim, '<h2 class="text-2xl font-extrabold text-corporate-orange mb-3">$1</h2>');
    html = html.replace(/### (.*$)/gim, '<h3 class="text-xl font-bold text-corporate-teal mt-4 mb-2">$1</h3>');
    html = html.replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>');
    html = html.split('\n').map(line => line.trim()).filter(line => line.length > 0).map(line => {
        if (line.startsWith('<ul>') || line.startsWith('<li>') || line.startsWith('<h') || line.startsWith('<s')) return line;
        return `<p class="text-sm text-gray-700">${line}</p>`;
    }).join('');
    html = html.replace(/<p><\/p>/g, ''); 
    html = html.replace(/<ul>/g, '<ul><li class="text-sm text-gray-700">').replace(/<\/li>/g, '</li></ul>');
    return html;
};
const IconMap = {
    Zap: Zap, Users: Users, Briefcase: Briefcase, Target: Target, BarChart3: BarChart3, Clock: Clock, Eye: Eye, BookOpen: BookOpen, Lightbulb: Lightbulb, X: X, ArrowLeft: ArrowLeft, CornerRightUp: CornerRightUp, AlertTriangle: AlertTriangle, CheckCircle: CheckCircle, PlusCircle: PlusCircle, Cpu: Cpu, Star: Star, Mic: Mic, Trello: Trello, Settings: Settings, Home: Home, MessageSquare: MessageSquare, Check: Check, Calendar: Calendar, HeartPulse: HeartPulse, TrendingUp: TrendingUp, TrendingDown: TrendingDown, Activity: Activity, Link: Link, Dumbbell: Dumbbell
};

// --- PDP Utility & Plan Generation ---
const LEADERSHIP_TIERS = {
    T1: { id: 'T1', name: 'Lead Self & Mindsets', icon: 'HeartPulse', color: 'indigo-500' },
    T2: { id: 'T2', name: 'Lead Work & Execution', icon: 'Briefcase', color: 'green-600' },
    T3: { id: 'T3', name: 'Lead People & Coaching', icon: 'Users', color: 'yellow-600' },
    T4: { id: 'T4', name: 'Conflict & Team Health', icon: 'AlertTriangle', color: 'red-640' },
    T5: { id: 'T5', name: 'Strategy & Vision', icon: 'TrendingUp', color: 'cyan-600' },
};

// CRITICAL NEW CONSTANTS (Based on Step 2 of the prompt)
const ASSESSMENT_QUESTIONS = [
    { id: 1, text: "I have a clear sense of who I am as a leader and why I choose to lead.", dim: "Mindset", courses: ['Leadership Identity', 'Motive', 'PlayerToCoach'] },
    { id: 2, text: "When results fall short, I take full responsibility and look first at what I can do differently.", dim: "Ownership", courses: ['Ownership', 'Relationship with Boss'] },
    { id: 3, text: "I spend most of my time enabling others to perform rather than doing the work myself.", dim: "Delegation", courses: ['PlayerToCoach', 'Delegation', 'Coaching'] },
    { id: 4, text: "My team has clear, measurable goals and knows what success looks like each week.", dim: "Execution", courses: ['Goals', 'Metrics', 'Expectations'] },
    { id: 5, text: "I consistently set and reinforce clear expectations for quality, timelines, and ownership.", dim: "Clarity", courses: ['Expectations', 'Feedback', 'Meetings'] },
    { id: 6, text: "I regularly give reinforcing and redirecting feedback that helps people grow.", dim: "Clarity", courses: ['Feedback', 'Coaching', 'Recognition'] },
    { id: 7, text: "Decisions on my team are made efficiently, with the right people involved and clear follow-through.", dim: "Execution", courses: ['DecisionMaking', 'Meetings', 'Accountability'] },
    { id: 8, text: "I intentionally model openness and vulnerability to build trust within my team.", dim: "Trust", courses: ['VBTrust', 'OneOnOnes'] },
    { id: 9, text: "My team handles conflict directly and constructively, even when it’s uncomfortable.", dim: "TeamHealth", courses: ['Conflict', 'Commitment', 'Accountability', 'CrucialConversations'] },
    { id: 10, text: "I frequently recognize and celebrate progress and contributions in meaningful ways.", dim: "Recognition", courses: ['Recognition', 'Motivation', 'Coaching'] },
];

const CONTENT_LIBRARY = [
    // This is now the fallback library, but is complete for the generator function
    { skill: 'Leadership Identity', type: 'Tool', duration: 45, tier: 'T1', title: 'Defining Your Leadership Identity (LIS)', difficulty: 'Mastery' },
    { skill: 'Motive', type: 'Reading', duration: 30, tier: 'T1', title: 'Leadership Motive - Servant Leadership Primer', difficulty: 'Intro' },
    { skill: 'PlayerToCoach', type: 'Exercise', duration: 60, tier: 'T1', title: 'Player-to-Coach Delegation Framework', difficulty: 'Core' },
    { skill: 'Ownership', type: 'Case Study', duration: 50, tier: 'T1', title: 'Ownership and Accountability Audit', difficulty: 'Core' },
    { skill: 'Relationship with Boss', type: 'Reading', duration: 30, tier: 'T1', title: 'Relationship with Boss: Managing Upward', difficulty: 'Intro' },
    { skill: 'VBTrust', type: 'Reading', duration: 40, tier: 'T3', title: 'Leading the Way: Go 1st with V-B Trust', difficulty: 'Intro' },
    { skill: 'Goals', type: 'Exercise', duration: 60, tier: 'T2', title: 'Goals & OKR Prioritization Workshop', difficulty: 'Mastery' },
    { skill: 'Expectations', type: 'Reading', duration: 25, tier: 'T2', title: 'Setting Clear Expectations Protocol', difficulty: 'Intro' },
    { skill: 'Metrics', type: 'Tool', duration: 40, tier: 'T2', title: 'Leading & Lagging Metrics Dashboard Setup', difficulty: 'Core' },
    { skill: 'Feedback', type: 'Exercise', duration: 40, tier: 'T3', title: 'Delivering Effective Feedback (Radical Candor)', difficulty: 'Core' },
    { skill: 'Delegation', type: 'Exercise', duration: 45, tier: 'T2', title: 'Effective Delegation using Delegation Matrix', difficulty: 'Core' },
    { skill: 'Effective Meetings', type: 'Tool', duration: 30, tier: 'T2', title: 'Effective Meetings: Decision-Focused Agenda', difficulty: 'Intro' },
    { skill: 'DecisionMaking', type: 'Case Study', duration: 55, tier: 'T2', title: 'Decision-Making / Problem Solving Framework', difficulty: 'Mastery' },
    { skill: 'OneOnOnes', type: 'Tool', duration: 30, tier: 'T3', title: 'Effective 1:1s: Coaching-First Structure', difficulty: 'Core' },
    { skill: 'TeamHealth', type: 'Tool', duration: 40, tier: 'T4', title: 'Team Health: Consensual Commitment Framework', difficulty: 'Core' },
    { skill: 'Conflict', type: 'Exercise', duration: 30, tier: 'T4', title: 'Conflict Management Style Quiz & Strategy', difficulty: 'Core' },
    { skill: 'Commitment', type: 'Tool', duration: 40, tier: 'T4', title: 'Team Health: Consensual Commitment Framework', difficulty: 'Core' },
    { skill: 'Accountability', type: 'Exercise', duration: 55, tier: 'T4', title: 'Team Health: Peer Accountability Implementation', difficulty: 'Mastery' },
    { skill: 'Coaching', type: 'Role-Play', duration: 45, tier: 'T3', title: 'Practice: GROW Model Coaching Session', difficulty: 'Core' },
    { skill: 'Recognition', type: 'Reading', duration: 25, tier: 'T3', title: 'Recognition and Motivation Principles', difficulty: 'Intro' },
    { skill: 'Motivation', type: 'Case Study', duration: 50, tier: 'T3', title: 'Intrinsic Motivation and Team Engagement', difficulty: 'Mastery' },
    { skill: 'CrucialConversations', type: 'Role-Play', duration: 60, tier: 'T4', title: 'Crucial Conversations / Conflict Mgmt Practice', difficulty: 'Mastery' },
    { skill: 'Vision', type: 'Exercise', duration: 45, tier: 'T5', title: 'Vision Statement Workshop', difficulty: 'Core' },
    { skill: 'StrategicPlanning', type: 'Tool', duration: 30, tier: 'T5', title: 'Pre-Mortem Risk Audit', difficulty: 'Mastery' },
    { skill: 'Influence', type: 'Reading', duration: 40, tier: 'T5', title: 'Long-Range Strategic Planning Principles', difficulty: 'Intro' },
    { skill: 'Accountability', type: 'Reading', duration: 25, tier: 'T4', title: 'Article: The Link Between Ownership and Trust', difficulty: 'Intro', id: '408' },
    { skill: 'Delegation', type: 'Tool', duration: 35, tier: 'T2', title: 'Delegation Audit & Follow-up Checklist', difficulty: 'Core', id: '215' },
    { skill: 'Vision', type: 'Tool', duration: 30, tier: 'T5', title: 'Vision Alignment Diagnostic', difficulty: 'Core', id: '507' },
    { skill: 'Conflict', type: 'Case Study', duration: 55, tier: 'T4', title: 'Case: Mediating Personality Clashes', difficulty: 'Mastery', id: '411' },
];


const generatePlanData = (assessment, ownerUid, contentLibrary) => {
    const { selfRatings, overallConfidence, openEndedGoal } = assessment;

    // 1. SCORING & PRIORITIZATION
    const dimScores = {}; 
    const dimCounts = {}; 
    
    ASSESSMENT_QUESTIONS.forEach(q => {
        const score = selfRatings[q.id]; 
        dimScores[q.dim] = (dimScores[q.dim] || 0) + score;
        dimCounts[q.dim] = (dimCounts[q.dim] || 0) + 1;
    });

    const finalScores = Object.keys(dimScores).map(dim => ({
        dimension: dim,
        score: dimScores[dim] / dimCounts[dim],
        relatedCourses: ASSESSMENT_QUESTIONS.filter(q => q.dim === dim).flatMap(q => q.courses)
    }));

    // Identify Top 3 Growth Areas (lowest scores)
    finalScores
        .sort((a, b) => a.score - b.score) 
        .slice(0, 3) 
        .map(d => d.dimension);
    
    // 2. COURSE MAPPING AND SEQUENCING (6 x 90-day blocks)
    const fullPlan = [];
    const usedContentIds = new Set();
    const trainingBlocks = [
        // Q1: Foundation Focus
        { tier: 'T1', theme: 'Feedback & Trust Foundation', primarySkills: ['Feedback', 'VBTrust', 'PlayerToCoach'] },
        // Q2: Structure Focus
        { tier: 'T2', theme: 'Execution, Goals & Expectations', primarySkills: ['Goals', 'Delegation', 'Expectations'] },
        // Q3: Delegation Focus
        { tier: 'T3', theme: 'Coaching & Empowerment', primarySkills: ['Coaching', 'OneOnOnes', 'Delegation'] },
        // Q4: Health Focus
        { tier: 'T4', theme: 'Conflict Resolution & Commitment', primarySkills: ['Conflict', 'Commitment', 'CrucialConversations'] },
        // Q5: Advanced Systems
        { tier: 'T2', theme: 'Systemization and Decision Making', primarySkills: ['Metrics', 'DecisionMaking', 'Effective Meetings'] },
        // Q6: Capstone
        { tier: 'T5', theme: 'Visionary Leadership & Synthesis', primarySkills: ['Vision', 'StrategicPlanning', 'Influence'] },
    ];
    
    // Logic to select content and assign difficulty/duration
    const getTargetDifficulty = (rating) => rating >= 4.5 ? 'Mastery' : rating >= 3.5 ? 'Core' : 'Intro';
    const adjustDuration = (rating, duration) => {
        if (rating >= 4.5) return Math.round(duration * 0.8); 
        if (rating <= 2.5) return Math.round(duration * 1.2); 
        return duration;
    };
    
    for (let cycle = 1; cycle <= 6; cycle++) { 
        const blockDef = trainingBlocks[cycle - 1];
        const primaryTier = blockDef.tier;
        // Use the initial assessment Q score as a proxy for the Tier's self-rating
        const currentRating = selfRatings[cycle] || 3; 
        const targetDifficulty = getTargetDifficulty(currentRating);
        const maxContent = currentRating <= 3 ? 6 : 4; 

        const requiredContent = [];
        
        // 1. Filter Content Pool: Prioritize items matching the cycle's primary skills
        let pool = (contentLibrary || CONTENT_LIBRARY).filter(item => blockDef.primarySkills.includes(item.skill));
        
        // Ensure a variety of types (Tool, Exercise, Reading, Case Study, Role-Play)
        pool.sort((a, b) => {
            const order = { 'Tool': 1, 'Exercise': 2, 'Role-Play': 3, 'Reading': 4, 'Case Study': 5, 'Coaching': 6, 'Video': 7 };
            return (order[a.type] || 9) - (order[b.type] || 9);
        });

        // 2. Assign dynamic number of items (up to maxContent)
        let count = 0;
        for (const item of pool) {
            if (count < maxContent && !usedContentIds.has(item.skill)) { 
                requiredContent.push({
  });
                usedContentIds.add(item.skill);
                count++;
            }
        }
        
        fullPlan.push({
  });
    }

    return {
        ownerUid,
        assessment: { ...assessment, selfRatings: selfRatings, overallConfidence, openEndedGoal },
        plan: fullPlan,
        currentMonth: 1, 
        progressScans: [], // Initialize the history array for 90-day checkpoints
        latestScenario: null,
        lastUpdate: new Date().toISOString(),
        leadershipProfile: finalScores
    };
};


// --- Component 4: PDP Content Details Modal ---
const ContentDetailsModal = ({ isVisible, onClose, content }) => { 
    if (!isVisible || !content) return null;
    
    return <ContentDetailsModalInternal onClose={onClose} content={content} />;
};

const MOCK_CONTENT_DETAILS_FINAL = {
    Reading: (title, skill) => `## Reading: ${title}\n### Focus: ${skill}\nThis is a reading module focusing on ${skill} theory.`,
    Exercise: (title, skill) => `## Exercise: ${title}\n### Focus: ${skill}\nThis is a practical exercise for skill ${skill}.`,
    'Role-Play': (title, skill) => `## Role-Play: ${title}\n### Focus: ${skill}\nThis is a simulation for skill ${skill}.`, 
    CaseStudy: (title, skill) => `## Executive Analysis: ${title}\n### Focus: ${skill}\nThis is a case study analysis for skill ${skill}.`,
    Tool: (title, skill) => `## Tool Implementation: ${title}\n### Focus: ${skill}\nThis is a tool implementation module for skill ${skill}.`,
    Coaching: (title, skill) => `## AI Coaching Lab: ${title}\n### Focus: ${skill}\nThis is an AI coaching session for skill ${skill}.`,
};

const ContentDetailsModalInternal = ({ onClose, content }) => {
    const [htmlContent, setHtmlContent] = useState('');
    const [rating, setRating] = useState(0); 
    const [isLogging, setIsLogging] = useState(false);
    
    const tierData = LEADERSHIP_TIERS[content.tier] || { name: 'Unknown Tier' };

    const memoizedMockDetail = useMemo(() => {
        const detailGenerator = MOCK_CONTENT_DETAILS_FINAL[content.type];
        return detailGenerator
            ? detailGenerator(content.title, content.skill)
            : `## Content Unavailable\n\nNo detailed content available for **${content.title}** (Type: ${content.type}).`;
    }, [content.title, content.skill, content.type]); 
    
    const handleLogLearning = async () => {
        if (rating === 0) { return; }
        setIsLogging(true);
        await new Promise(r => setTimeout(r, 800));
        // NOTE: In a real app, you would dispatch a data update here to log learning progress.
        setIsLogging(false);
        onClose();
    };

    useEffect(() => {
        let isCancelled = false;
        setHtmlContent('');
        setRating(0);

        (async () => {
            const html = await mdToHtml(memoizedMockDetail);
            if (!isCancelled) {
                setHtmlContent(html);
            }
        })();

        return () => {
            isCancelled = true;
        };
    }, [memoizedMockDetail]);
    
    return (
        <div className="fixed inset-0 bg-corporate-navy/80 z-50 flex items-center justify-center p-4">
            <div className="bg-corporate-light-gray rounded-3xl shadow-2xl w-full max-h-[90vh] overflow-y-auto p-3 sm:p-4 lg:p-6">
                <div className="flex justify-between items-start border-b pb-4 mb-6">
                    <h2 className="text-xl sm:text-2xl sm:text-3xl font-extrabold text-corporate-navy flex items-center">
                        <BookOpen className="w-8 h-8 mr-3 text-corporate-teal" />
                        {content.title} ({content.type})
                    </h2>
                    <button onClick={onClose} className="p-2 text-gray-500 hover:text-corporate-orange transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <div className="mb-6 text-sm flex space-x-4 border-b pb-4">
                    <p className="text-gray-700 font-semibold">Tier: <span className='text-corporate-navy'>{tierData.name}</span></p>
                    <p className="text-gray-700 font-semibold">Skill Focus: <span className='text-corporate-navy'>{content.skill}</span></p>
                    <p className="text-gray-700 font-semibold">Est. Duration: <span className='text-corporate-navy'>{content.duration} min</span></p>
                </div>
                <div className="prose max-w-none text-gray-700">
                    {htmlContent ? (
                        <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
                    ) : (
                        <p className='text-gray-500 flex items-center'>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-2"></div>
                            Loading content details...
                        </p>
                    )}
                </div>
                <div className='mt-8 pt-6 border-t border-gray-200'>
                    <h3 className='text-lg font-bold text-corporate-navy mb-3 flex items-center'>
                        <Star className="w-5 h-5 mr-2 text-corporate-orange" />
                        Review & Log Learning
                    </h3>
                    <p className="text-sm text-gray-700 mb-4">
                        Rate the content's quality and helpfulness. This feedback loop helps the AI personalize future modules.
                    </p>
                    <div className='flex items-center space-x-4 mb-4'>
                        <div className='flex space-x-1'>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    className={`w-6 h-6 cursor-pointer transition-colors ${
                                        star <= rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
                                    }`}
                                    onClick={() => setRating(star)}
                                />
                            ))}
                        </div>
                        <span className='text-md font-semibold text-corporate-navy'>{rating > 0 ? `${rating}/5 Stars` : 'Rate Content'}</span>
                    </div>
                    <Button onClick={handleLogLearning} disabled={isLogging || rating === 0} className='w-full'>
                        {isLogging ? 'Logging...' : 'Log Learning & Submit Rating'}
                    </Button>
                </div>
            </div>
        </div>
    );
};


// --- Component 3: Roadmap Timeline View (Unchanged) ---
const RoadmapTimeline = ({ data, navigateToMonth, viewMonth }) => {
    return (
        <Card title="24-Month Roadmap Timeline" icon={Trello} accent="PURPLE" className='lg:sticky lg:top-4 bg-white shadow-2xl border-l-4 border-corporate-teal'>
            <p className='text-sm text-gray-600 mb-4'>Review your full two-year journey. Click a month to review its content and reflection.</p>
            <div className='max-h-96 overflow-y-auto space-y-2 pr-2'>
                {data.plan.map(monthData => {
                    const isCurrentView = monthData.month === viewMonth;
                    const isFuture = monthData.month > data.currentMonth; 
                    const isCompleted = monthData.status === 'Completed';
                    const isClickable = true; 

                    return (
                        <div key={monthData.month}
                             className={`p-3 rounded-lg border flex justify-between items-center transition-all cursor-pointer shadow-sm
                                         ${isCurrentView ? 'bg-corporate-teal/20 border-corporate-teal font-extrabold' : isCompleted ? 'bg-corporate-teal/10 border-corporate-teal' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}
                                         ${isFuture && !isCurrentView ? 'opacity-80' : ''}` 
                             }
                             onClick={() => {
                                 if (isClickable) navigateToMonth(monthData.month); 
                             }}
                        >
                            <span className={`text-sm ${isCurrentView ? 'text-corporate-teal' : 'text-corporate-navy'}`}>
                                **Training Month {monthData.month}**: {monthData.theme}
                            </span>
                            <span className="flex items-center space-x-1 text-xs">
                                <Check size={16} className={isCompleted ? 'text-green-600' : 'text-gray-400'} />
                                <span className={isCompleted ? 'text-green-600' : 'text-gray-400'}>
                                    {monthData.month === data.currentMonth ? 'CURRENT' : isCompleted ? 'COMPLETED' : isFuture ? 'FUTURE' : 'PENDING'}
                                </span>
                            </span>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
};


// --- Component 2: Tracker Dashboard View ---
const TrackerDashboardView = ({ data, updatePdpData, navigate }) => {
    const [viewMonth, setViewMonth] = useState(data.currentMonth); 
    
    const monthPlan = useMemo(() => data.plan.find(m => m.month === viewMonth), [data.plan, viewMonth]);
    
    const isCurrentView = viewMonth === data.currentMonth; 
    const isPastOrCurrent = viewMonth <= data.currentMonth; 
    
    const assessment = data.assessment;

    const [localReflection, setLocalReflection] = useState(monthPlan?.reflectionText || '');
    const [isSaving, setIsSaving] = useState(false);
    const [briefing, setBriefing] = useState(monthPlan?.briefingText || null); 
    const [briefingLoading, setBriefingLoading] = useState(false);
    
    const [isContentModalVisible, setIsContentModalVisible] = useState(false);
    const [selectedContent, setSelectedContent] = useState(null);

    const [togglingIds, setTogglingIds] = useState(() => new Set());

    const { callSecureGeminiAPI, hasGeminiKey, GEMINI_MODEL } = useAppServices(); 

    // --- Handlers ---
    const handleContentStatusToggle = useCallback((contentId) => {
        if (!isCurrentView) return; 
        updatePdpData(oldData => {
            const updatedContent = monthPlan.requiredContent.map(item =>
                item.id === contentId ? { 
                    ...item, 
                    status: item.status === 'Completed' ? 'Pending' : 'Completed',
                    dateCompleted: item.status === 'Completed' ? null : new Date().toISOString(), // NEW: Completion Timestamp
                } : item
            );
            const updatedPlan = oldData.plan.map(m =>
                m.month === data.currentMonth ? { ...m, requiredContent: updatedContent } : m
            );
            return { ...oldData, plan: updatedPlan };
        });
    }, [isCurrentView, updatePdpData, monthPlan, data.currentMonth]);

    const toggleContent = useCallback((id) => {
        if (!isPastOrCurrent) return; 
        setTogglingIds(prev => { const n = new Set(prev); n.add(id); return n; });
        handleContentStatusToggle(id);
        setTimeout(() => {
            setTogglingIds(prev => { const n = new Set(prev); n.delete(id); return n; });
        }, 400);
    }, [isPastOrCurrent, handleContentStatusToggle]);

    const fetchMonthlyBriefing = useCallback(async (plan, assessment) => {
        if (briefingLoading || !hasGeminiKey() || !plan || !assessment || !isCurrentView) return;
        
        if (plan.briefingText || briefing) {
            setBriefing(plan.briefingText || briefing);
            return;
        }

        setBriefingLoading(true);
        const currentTier = LEADERSHIP_TIERS[plan.tier];
        const rating = assessment.selfRatings?.[currentTier] || 5; 

        const systemPrompt = `You are a concise Executive Coach. Analyze the user's current Roadmap phase (fitness training). Given their focus tier (${currentTier.name}) and their initial self-rating (${rating}/10), provide: 1) A 1-sentence **Executive Summary** of the goal (the rep/skill). 2) A 1-sentence **Coaching Nudge** on how to prioritize the month's learning based on their skill gap. Use bold markdown for key phrases.`;

        const userQuery = `Generate a monthly briefing for the user's current focus: ${plan.theme}. Required content/reps includes: ${plan.requiredContent.map(c => c.title).join(', ')}.`;

        try {
            const payload = {
                contents: [{ role: "user", parts: [{ text: userQuery }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
                model: GEMINI_MODEL,
            };
            const result = await callSecureGeminiAPI(payload);
            const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (text && text !== briefing) {
                setBriefing(text);
            }

        } catch (e) {
            setBriefing("AI coach unavailable. Focus on completing your required content first.");
        } finally {
            setBriefingLoading(false);
        }
    }, [briefingLoading, hasGeminiKey, callSecureGeminiAPI, isCurrentView, briefing, GEMINI_MODEL]);


    const handleCompleteMonth = async () => {
        // Check if this month is the end of a 90-day block (Month 3, 6, 9, etc.)
        const is90DayCheckPoint = data.currentMonth % 3 === 0;

        setIsSaving(true);
        const briefingToSave = briefing ? briefing.replace('## Monthly Executive Briefing', '## Saved Executive Briefing') : '';
        
        await updatePdpData(oldData => {
            const updatedPlan = oldData.plan.map(m => 
                m.month === oldData.currentMonth ? { 
                    ...m, 
                    status: 'Completed', 
                    reflectionText: localReflection, 
                    monthCompletedDate: new Date().toISOString(),
                    briefingText: briefingToSave, 
                } : m
            );
            return { 
                ...oldData, 
                plan: updatedPlan, 
                currentMonth: oldData.currentMonth + 1 
            };
        });
        setIsSaving(false);
        
        if (is90DayCheckPoint) {
            // CRITICAL: Navigate back to the assessment generator review screen to re-run the assessment
            navigate('/prof-dev-plan-review'); // Navigate to a review/re-assessment screen
        } else {
            setViewMonth(data.currentMonth + 1);
            window.scrollTo(0, 0); 
        }
    };

    // FIX: Implement robust plan clearing logic here.
    const handleResetPlan = async () => {
        // CRITICAL: Save a minimum, empty data structure to the document to clear the old plan's existence.
        setIsSaving(true);
        try {
            await updatePdpData({ 
  });
            // After data is cleared, navigate to the generator screen.
            navigate('/prof-dev-plan');
            window.scrollTo(0,0); 
        } catch(e) {
            console.error("Failed to reset plan:", e);
            const isDeveloperMode = localStorage.getItem('arena-developer-mode') === 'true';
            if (isDeveloperMode) {
              alert("Failed to reset plan data. Check database permissions or refresh the page manually.");
            }
        } finally{
            setIsSaving(false);
        }
    };

    const handleOpenContentModal = (contentItem) => { setSelectedContent(contentItem); setIsContentModalVisible(true); };

    const handleSaveReflection = () => {
        if (!isCurrentView || localReflection === monthPlan?.reflectionText || localReflection.length === 0) return;

        setIsSaving(true);
        updatePdpData(oldData => {
            const updatedPlan = oldData.plan.map(m =>
                m.month === data.currentMonth ? { ...m, reflectionText: localReflection } : m
            );
            
            // NEW FEATURE: Save the current assessment answers as a historical 'Progress Scan'
            const newProgressScan = {
                cycle: Math.ceil(oldData.currentMonth / 3), // Cycle 1, 2, 3, etc.
                month: oldData.currentMonth,
                date: new Date().toISOString(),
                // NOTE: Use the current assessment scores for the snapshot
                // Mapping the 10 questions' Likert scores to the dimensions for historical comparison
                scores: oldData.assessment.selfRatings, 
                reflection: localReflection,
            };

            return { 
                ...oldData, 
                plan: updatedPlan,
                // Append the scan to a new historical array
                progressScans: [...(oldData.progressScans || []), newProgressScan] 
            };
        }).then(() => {
            setIsSaving(false);
        }).catch((e) => {
             console.error("Reflection Save Failed:", e);
             setIsSaving(false);
        });
    };
    
    // Effects simplified for this context
    useEffect(() => { setLocalReflection(monthPlan?.reflectionText || ''); setBriefing(monthPlan?.briefingText || null); setBriefingLoading(false); window.scrollTo(0, 0); }, [monthPlan]);
    useEffect(() => { if (monthPlan && assessment && isCurrentView && !monthPlan.briefingText && !briefingLoading) { fetchMonthlyBriefing(monthPlan, assessment); } }, [monthPlan, assessment, fetchMonthlyBriefing, isCurrentView, briefingLoading]);
    
    
    // --- Data Calculation (Ensuring safety for current/future/past logic) ---
    const currentTierId = monthPlan?.tier;
    const selfRating = assessment?.selfRatings?.[currentTierId] || 5; 
    const lowRatingFlag = currentTierId && selfRating <= 4;
    const allContentCompleted = monthPlan?.requiredContent?.every(item => item.status === 'Completed');
    const isReadyToComplete = allContentCompleted && localReflection.length >= 50;
    const requiredContent = monthPlan?.requiredContent || [];
    const totalDuration = data.plan.reduce((sum, m) => sum + m.totalDuration, 0);
    const completedDuration = data.plan.filter(m => m.month < data.currentMonth).reduce((sum, m) => sum + m.totalDuration, 0);
    const progressPercentage = totalDuration > 0 ? Math.round((completedDuration / totalDuration) * 100) : 0;
    const TierIcon = IconMap[LEADERSHIP_TIERS[currentTierId]?.icon || 'Target'];
    const completedItems = requiredContent.filter(item => item.status === 'Completed').length;
    const tierProgress = { overallPercentage: requiredContent.length > 0 ? Math.round((completedItems / requiredContent.length) * 100) : 0, completedContent: completedItems, totalContent: requiredContent.length }; 
    const safeBriefing = briefingLoading && isCurrentView ? 'Loading AI Briefing...' : (typeof briefing === 'string' ? briefing : 'Historical briefing unavailable.');


    return (
        <div className="p-3 sm:p-4 lg:p-6 md:p-10 min-h-screen bg-corporate-light-gray text-corporate-navy">
            <div className='flex items-center gap-4 border-b-2 pb-2 mb-8' style={{borderColor: 'var(--corporate-teal-30)'}}>
                <Dumbbell className='w-10 h-10' style={{color: 'var(--corporate-teal)'}}/>
                <h1 className="text-4xl font-extrabold text-corporate-navy">Development Roadmap Tracker</h1>
            </div>

            {/* Progress Bar & Header */}
            <Card title={`Roadmap Progress: Training Month ${data.currentMonth} of 24`} icon={Clock} accent='NAVY' className="bg-corporate-navy/10 border-4 border-corporate-navy/20 mb-8">
                <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                    <div
                        className="bg-corporate-teal h-4 rounded-full transition-all duration-700"
                        style={{ width: `${progressPercentage}%` }}
                    ></div>
                </div>
                <p className='text-sm font-medium text-corporate-navy'>
                    {Math.round(progressPercentage)}% Complete. Next Tier Focus in {4 - ((data.currentMonth - 1) % 4)} months.
                </p>
                <div className='flex space-x-4 mt-4'>
                    <Button onClick={handleResetPlan} variant='outline' className='text-xs px-4 py-2 text-corporate-orange border-corporate-orange/50 hover:bg-corporate-orange/10'>
                        Start Over / Re-Run Assessment
                    </Button>
                    <Button onClick={() => {}} variant='outline' className='text-xs px-4 py-2 border-corporate-navy text-corporate-navy hover:bg-corporate-navy/10'>
                        <ShareIcon className="w-4 h-4 mr-1" /> Share Monthly Focus
                    </Button>
                </div>
            </Card>

            {/* Current Month Plan */}
            <div className='lg:grid lg:grid-cols-4 lg:gap-4 sm:gap-6 lg:gap-8'>
                
                <div className='lg:col-span-1 space-y-4 sm:space-y-6 lg:space-y-8 order-1'>
                    <RoadmapTimeline data={data} navigateToMonth={setViewMonth} viewMonth={viewMonth} />
                    
                    <Card title={`Tier Mastery Status (${currentTierId})`} icon={Star} accent='NAVY' className='bg-corporate-light-gray border-l-4 border-corporate-navy text-center'>
                         <div className="relative w-32 h-32 mx-auto mb-4">
                            <svg viewBox="0 0 36 36" className="w-full h-32 h-full transform -rotate-90">
                                <path className="text-gray-300" fill="none" stroke="currentColor" strokeWidth="3.8" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                                <path className="text-corporate-teal" fill="none" stroke="currentColor" strokeWidth="3.8" strokeDasharray={`${tierProgress.overallPercentage}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                            </svg>
                            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                                <span className="text-xl sm:text-2xl sm:text-3xl font-extrabold text-corporate-navy">{tierProgress.overallPercentage}%</span>
                            </div>
                        </div>
                        <p className='text-md font-semibold text-corporate-navy mb-1'>{tierProgress.completedContent} / {tierProgress.totalContent} Content Reps Completed</p>
                        <p className='text-xs text-gray-600'>For Tier: **{LEADERSHIP_TIERS[currentTierId]?.name}**</p>
                    </Card>

                </div>


                <div className='lg:col-span-3 space-y-4 sm:space-y-6 lg:space-y-8 order-2'>
                    
                    {/* VIEWING WARNINGS - THESE DISPLAY FOR FUTURE/PAST MONTHS */}
                    {viewMonth > data.currentMonth && ( // Check if viewing a future month
                        <div className='p-4 rounded-xl bg-yellow-100 border-2 border-yellow-400 shadow-md text-yellow-800 font-semibold flex items-center gap-3'>
                            <AlertTriangle className='w-5 h-5'/> 
                            Viewing **Future Training Month {viewMonth}**. You must complete Month **{data.currentMonth}** before accessing this content. Content is read-only.
                        </div>
                    )}
                    {!isCurrentView && isPastOrCurrent && (
                        <div className='p-4 rounded-xl bg-gray-100 border-2 border-gray-400 shadow-md text-gray-800 font-semibold flex items-center gap-3'>
                            <Clock className='w-5 h-5'/> 
                            Viewing **Historical Training Month {viewMonth}**. Content and Reflection are read-only.
                        </div>
                    )}

                    {/* CONTENT CARD (Always Renders) */}
                    <Card title={`Focus: ${monthPlan?.theme} (Training Month ${viewMonth})`} icon={TierIcon} accent='TEAL' className='border-l-8 border-corporate-teal'>

                        {/* AI Monthly Briefing (Renders for all months) */}
                        <div className='mb-4 p-4 rounded-xl bg-corporate-navy/10 border border-corporate-navy/20'>
                            <h3 className='font-bold text-corporate-navy mb-1 flex items-center'><Activity className="w-4 h-4 mr-2 text-corporate-teal" /> Monthly Executive Briefing</h3>
                            {briefingLoading && isCurrentView ? (
                                <p className='text-sm text-gray-600 flex items-center'><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-2 rounded-full"></div> Drafting advice...</p>
                            ) : (
                                <div className="prose max-w-none text-gray-700">
                                    <div dangerouslySetInnerHTML={{ __html: safeBriefing }} /> 
                                </div>
                            )}
                        </div>
                        
                        {/* Status / Difficulty (Renders for all months) */}
                        <div className='mb-4 text-sm border-t pt-4'>
                            <p className='font-bold text-corporate-navy'>Tier: {LEADERSHIP_TIERS[currentTierId]?.name}</p>
                            <p className='text-gray-600'>Target Difficulty: **{selfRating >= 8 ? 'Mastery' : selfRating >= 5 ? 'Core' : 'Intro'}** (Self-Rating: {selfRating}/10)</p>
                            {lowRatingFlag && (
                                <p className='font-semibold mt-1 flex items-center text-corporate-orange'>
                                    <AlertTriangle className='w-4 h-4 mr-1' /> HIGH RISK TIER: Prioritize Content Completion.
                                </p>
                            )}
                        </div>

                        <h3 className='text-xl font-bold text-corporate-navy border-t pt-4 mt-4'>Required Content Reps (Lessons)</h3>
                        <div className='space-y-3 mt-4'>
                            {requiredContent.map(item => {
                                const isCompleted = item.status === 'Completed';
                                const isToggling = togglingIds.has(item.id);
                                // UPGRADE 2: Action button text is always "View Content" or "Go to Practice" regardless of month status
                                const actionButtonText = (item.type === 'Role-Play' || item.type === 'Exercise' || item.type === 'Tool') ? 'Go to Practice' : 'View Content/Rep'; 

                                return (
                                    <div key={item.id} className='flex items-center justify-between p-3 bg-gray-50 rounded-xl shadow-sm'>
                                        <div className='flex flex-col'>
                                            <p className={`font-semibold text-sm ${isCompleted && isPastOrCurrent ? 'line-through text-gray-500' : 'text-corporate-navy'}`}>
                                                {item.title} ({item.type})
                                                {lowRatingFlag && <span className='ml-2 text-xs text-corporate-orange font-extrabold'>(CRITICAL)</span>}
                                            </p>
                                            <p className='text-xs text-gray-600'>~{item.duration} min | Difficulty: {item.difficulty}</p>
                                        </div>
                                        <div className='flex space-x-2'>
                                            <Button
                                                onClick={() => {
                                                    // UPGRADE 2: Allow viewing of ALL content in future, current, and past months
                                                    handleOpenContentModal(item);
                                                }}
                                                className='px-3 py-1 text-xs'
                                                variant='primary'
                                                disabled={false} // Always enabled for viewing
                                            >
                                                {actionButtonText}
                                            </Button>

                                            <Button
                                                onClick={() => toggleContent(item.id)}
                                                className={`px-3 py-1 text-xs transition-colors duration-300 ${isToggling ? 'opacity-50' : ''}`}
                                                variant={isCompleted ? 'secondary' : 'primary'}
                                                // UPGRADE 2: Only enabled for the current month.
                                                disabled={isSaving || isToggling || !isCurrentView}
                                            >
                                                {isToggling ? 'Updating...' : isCompleted ? 'Rep Completed ✓' : 'Mark Complete'}
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>

                    {/* REFLECTION AND ADVANCEMENT CARDS (Only render if current month) */}
                    {isCurrentView && (
                    <>
                        <Card title="Monthly Reflection" icon={Lightbulb} accent="NAVY" className='bg-corporate-navy/10 border-2 border-corporate-navy/20'>
                            <p className="text-gray-700 text-sm mb-4">
                                Reflect on the growth you achieved this month. How did the content/reps impact your daily leadership behavior? (**Minimum 50 characters required**)
                            </p>
                            <textarea
                                value={localReflection} 
                                onChange={(e) => setLocalReflection(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-corporate-teal focus:border-corporate-teal h-40"
                                placeholder="My reflection (required)..."
                                readOnly={!isCurrentView}
                            ></textarea>
                            {isCurrentView && (
                                <div className='flex justify-between items-center mt-1'>
                                    <p className={`text-xs ${localReflection.length < 50 ? 'text-corporate-orange' : 'text-corporate-teal'}`}>
                                        {localReflection.length} / 50 characters written.
                                    </p>
                                    <span className={`text-xs font-semibold ${isSaving ? 'text-gray-500' : 'text-corporate-teal'}`}>
                                        {isSaving ? 'Saving...' : 'Reflection ready'}
                                    </span>
                                </div>
                            )}
                            {!isCurrentView && <p className='text-xs text-gray-500 mt-2'>Reflection is read-only for this month.</p>}
                            
                            {isCurrentView && (
                                 <Button
                                    onClick={handleSaveReflection}
                                    disabled={isSaving || localReflection === monthPlan?.reflectionText || localReflection.length === 0}
                                    className='w-full mt-4 bg-corporate-navy hover:bg-gray-700'
                                >
                                    {isSaving ? 'Saving Reflection...' : 'Save Reflection'}
                                </Button>
                            )}
                        </Card>

                        <Card title="Recalibrate Skill Assessment" icon={Activity} accent='ORANGE' className='bg-corporate-orange/10 border-4 border-corporate-orange'>
                            <p className="text-gray-700 text-sm mb-4">
                                Feel like you've mastered this tier? Re-run your initial **Self-Ratings** to check your progress and generate an **accelerated, revised roadmap** to match your new skill level.
                            </p>
                            <Button
                                onClick={handleResetPlan} 
                                variant="secondary"
                                className='w-full bg-corporate-orange hover:bg-red-700'
                            >
                                <Target className='w-4 h-4 mr-2' /> Re-Run Assessment
                            </Button>
                        </Card>
                        
                        <Card title="Advance Roadmap" icon={CornerRightUp} accent='TEAL' className='bg-corporate-teal/10 border-4 border-corporate-teal'>
                            <p className='text-sm text-gray-700 mb-4'>
                                Once all content and your reflection are complete, lock in your progress and move to **Training Month {data.currentMonth + 1}** of your Roadmap (Progressive Overload).
                            </p>
                            <Button
                                onClick={handleCompleteMonth}
                                disabled={isSaving || !isReadyToComplete}
                                className='w-full bg-corporate-teal hover:bg-corporate-teal'
                            >
                                {isSaving ? 'Processing...' : `Complete Month ${data.currentMonth} and Advance`}
                            </Button>
                            {!allContentCompleted && (
                                <p className='text-corporate-orange text-xs mt-2'>* Finish all content reps first.</p>
                            )}
                            {allContentCompleted && localReflection.length < 50 && (
                                <p className='text-corporate-orange text-xs mt-2'>* Reflection required (50 chars min).</p>
                            )}
                        </Card>
                    </>
                    )} 
                </div>
            </div>
            
            <ContentDetailsModal 
                isVisible={isContentModalVisible} 
                onClose={() => setIsContentModalVisible(false)} 
                content={selectedContent}
            />

        </div>
    );
};


// --- Component 1: Plan Generator View ---
const PlanGeneratorView = ({ userId, saveNewPlan, navigate, setGeneratedPlanData, generatePlanDataWrapper }) => {
    // Assessment State Management
    // FIX 1: Initial assessment score set to 3 (Neutral) instead of 0
    const [assessmentAnswers, setAssessmentAnswers] = useState(ASSESSMENT_QUESTIONS.reduce((acc, q) => ({ ...acc, [q.id]: 3 }), {})); 
    const [openEndedGoal, setOpenEndedGoal] = useState('');
    const [overallConfidence, setOverallConfidence] = useState(5);
    const [isGenerating, setIsGenerating] = useState(false);
    
    // Derived State
    const allAnswered = useMemo(() => Object.values(assessmentAnswers).every(a => a >= 1), [assessmentAnswers]);
    const canGenerate = allAnswered && !isGenerating;

    const handleAnswerChange = (qId, value) => {
        setAssessmentAnswers(prev => ({ ...prev, [qId]: parseInt(value) }));
    };

    const handleGenerate = async () => {
        if (!canGenerate) return;
        setIsGenerating(true);

        // 1. Map answers (Likert 1-5) to required structure
        const selfRatings = {};
        ASSESSMENT_QUESTIONS.forEach(q => {
            // The score ID is the question ID (1-5)
            selfRatings[q.id] = assessmentAnswers[q.id]; 
        });
        
        // 2. Compute Final Assessment Object for the Generator Utility
        const assessment = { 
            selfRatings: selfRatings,
            openEndedGoal: openEndedGoal,
            overallConfidence: overallConfidence,
            dateGenerated: new Date().toISOString(),
        };

        const newPlanData = generatePlanDataWrapper(assessment, userId);

        try {
            await saveNewPlan(newPlanData);
            setIsGenerating(false);
            setGeneratedPlanData({ userPlan: newPlanData, genericPlan: { totalDuration: 1200, avgIntroContent: 8, avgMasteryContent: 3 } });
            navigate('/prof-dev-plan-review'); // Redirect to review screen
        } catch (e) {
            setIsGenerating(false);
            console.error('Failed to save new plan after generation.', e);
            const isDeveloperMode = localStorage.getItem('arena-developer-mode') === 'true';
            if (isDeveloperMode) {
              alert('Saving your new plan failed. Please check your connection and try again.');
            }
        }
    };

    return (
        <div className="p-3 sm:p-4 lg:p-6 md:p-10 min-h-screen bg-corporate-light-gray text-corporate-navy">
            <div className='flex items-center gap-4 border-b-2 pb-2 mb-8' style={{borderColor: 'var(--corporate-teal-30)'}}>
                <Dumbbell className='w-10 h-10 text-corporate-teal'/>
                <h1 className="text-4xl font-extrabold text-corporate-navy">Personalized Arena Assessment</h1>
            </div>
            <p className="text-lg text-gray-600 mb-8 max-w-3xl">Apply the principle of **Progressive Overload**. Answer 10 core questions (1-5 scale) to instantly map your skill gaps and generate a 2-year Roadmap designed for accelerating growth.</p>

            <div className="space-y-10">
                <Card title="1. Leadership Assessment (1-5 Scale)" icon={BarChart3} accent='TEAL'>
                    <h3 className="text-md font-semibold text-gray-700 mb-3">Rate your current effectiveness (1 = Strongly Disagree, 5 = Strongly Agree):</h3>
                    
                    {ASSESSMENT_QUESTIONS.map(q => {
                        const answer = assessmentAnswers[q.id] || 3; // Default display score is 3
                        const scoreColor = answer >= 4 ? 'var(--corporate-teal)' : 'var(--corporate-orange)';

                        return (
                            <div key={q.id} className="mb-6 border p-3 rounded-lg bg-gray-50">
                                <p className="font-semibold text-corporate-navy mb-2 text-sm">{q.id}. {q.text}</p>
                                <div className='flex flex-col space-y-1'>
                                    <p className="font-semibold text-corporate-navy flex justify-between">
                                        <span className='text-sm text-gray-600'>Rating:</span>
                                        <span className='text-xl font-extrabold' style={{ color: scoreColor }}>{answer} / 5</span>
                                    </p>
                                    <input
                                        type="range"
                                        min="1" max="5"
                                        value={answer} // Pass the current state value
                                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg"
                                        style={{ accentColor: scoreColor }}
                                    />
                                    <div className='flex justify-between text-xs text-gray-500'>
                                        <span>Strongly Disagree</span>
                                        <span>Neutral</span>
                                        <span>Strongly Agree</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {!allAnswered && <p className='text-corporate-orange text-xs mt-2'>* Please answer all 10 questions to continue.</p>}
                </Card>
                
                <Card title="2. Final Input" icon={MessageSquare} accent='ORANGE'>
                    <label className="block text-sm font-medium text-gray-700 mb-1">90-Day Goal (Optional Open-Ended)</label>
                    <textarea
                        value={openEndedGoal}
                        onChange={(e) => setOpenEndedGoal(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-corporate-orange focus:border-corporate-orange h-20"
                        placeholder="What’s one leadership behavior you most want to strengthen in the next 90 days?"
                    ></textarea>
                    
                    <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">Overall Confidence (1-10 Scale)</label>
                    <div className='flex flex-col space-y-1'>
                        <p className="font-semibold text-corporate-navy flex justify-between">
                            <span className='text-sm text-gray-600'>Overall Leadership Confidence:</span>
                            <span className='text-xl font-extrabold' style={{ color: 'var(--corporate-navy)' }}>{overallConfidence} / 10</span>
                        </p>
                        <input
                            type="range"
                            min="1" max="10"
                            value={overallConfidence}
                            onChange={(e) => setOverallConfidence(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg"
                            style={{ accentColor: 'var(--corporate-navy)' }}
                        />
                    </div>
                </Card>
            </div>

            <Button onClick={handleGenerate} disabled={!canGenerate || isGenerating} className="mt-10 w-full md:w-auto">
                {isGenerating ? (
                    <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Generating 24-Month Roadmap...
                    </div>
                ) : 'Generate Personalized 24-Month Roadmap'}
            </Button>
            <p className='text-sm text-gray-500 mt-4'>*Your data will be securely saved to your private roadmap in Firestore.</p>
        </div>
    );
};

// --- Component 4: Plan Review Screen (Unchanged, relies on generator output) ---
const PlanReviewScreen = ({ generatedPlan, navigate, clearReviewData, finalizeWithData }) => { 
    if (!generatedPlan || !generatedPlan.userPlan || !generatedPlan.userPlan.leadershipProfile) return (
         <div className="p-4 sm:p-3 sm:p-4 lg:p-6 lg:p-8 min-h-screen">
             <p className='text-xl text-corporate-orange font-bold'>Error: Personalized plan data is incomplete. Please re-run the assessment.</p>
             <Button onClick={() => navigate('/prof-dev-plan')} className='mt-4'>Go to Assessment</Button>
         </div>
    );

    const userPlan = generatedPlan.userPlan;
    const leadershipProfile = userPlan.leadershipProfile; 

    const userTotalDuration = userPlan.plan.reduce((sum, m) => sum + m.totalDuration, 0);
    // Use fixed mock values here since the full plan has 6 blocks * max 6 items = 36 total. 
    // We can simulate the personalization benefit based on the default library above.
    const userIntroContent = userPlan.plan.flatMap(m => m.requiredContent).filter(c => c.difficulty === 'Intro').length || 12;
    const userMasteryContent = userPlan.plan.flatMap(m => m.requiredContent).filter(c => c.difficulty === 'Mastery').length || 6; 
    
    // Mock comparative data if not provided (safety)
    const mockGenericTotalDuration = 1200;
    const mockGenericMasteryContent = 3;
    const mockGenericIntroContent = 8;
    
    const durationDifference = mockGenericTotalDuration - userTotalDuration;
    const introDifference = mockGenericIntroContent - userIntroContent;
    const masteryDifference = userMasteryContent - mockGenericMasteryContent;

    const StatItem = ({ label, value, diff, unit = '', isPositiveBetter = true }) => {
        const isGood = isPositiveBetter ? diff > 0 : diff < 0;
        const diffColor = diff === 0 ? 'var(--corporate-teal)' : isGood ? 'var(--corporate-teal)' : 'var(--corporate-orange)';
        const diffSign = diff > 0 ? '+' : '';
        return (
            <div className='flex justify-between items-center py-2 border-b border-gray-200'>
                <span className='font-semibold'>{label}:</span>
                <div className='text-right'>
                    <span className={`font-bold text-lg mr-2`} style={{color: 'var(--corporate-navy)'}}>{value} {unit}</span>
                    <span className={`text-xs font-semibold`} style={{ color: diffColor }}>({diffSign}{diff} {unit})</span>
                </div>
            </div>
        );
    };
    
    const handleFinalize = async () => {
        if (typeof finalizeWithData === 'function') {
            finalizeWithData(userPlan);
        } else {
            clearReviewData();
            navigate('/prof-dev-plan');
        }
        window.scrollTo(0, 0);
    };

    const handleStartOver = () => { 
        clearReviewData(); 
        navigate('/prof-dev-plan');
    };

    return (
        <div className="page-corporate container-corporate animate-corporate-fade-in">
            <div className="content-full">
                <div className='flex items-center gap-4 border-b-2 pb-2 mb-8' style={{borderColor: 'var(--corporate-teal)'+'30'}}>
                <CheckCircle className='w-10 h-10' style={{color: 'var(--corporate-teal)'}}/>
                <h1 className="text-4xl font-extrabold" style={{ color: 'var(--corporate-navy)' }}>Roadmap Successfully Generated!</h1>
            </div>
            <p className="text-lg text-gray-600 mb-8 max-w-3xl">Review your personalized Roadmap highlights below. Your full 24-month training plan has been created and is ready to view in the Tracker Dashboard.</p>

            <Card title="Leadership Profile Snapshot" icon={Target} accent='ORANGE' className='mt-8 border-l-4 border-corporate-orange bg-corporate-orange/10'>
                 <h3 className="text-xl font-extrabold text-corporate-navy mb-4">Your Top 3 Growth Focus Areas:</h3>
                 <div className='space-y-3 mb-6'>
                    {leadershipProfile.slice(0, 3).map((d, i) => (
                         <div key={d.dimension} className='p-3 bg-white rounded-lg shadow-sm border border-gray-200'>
                            <p className='text-sm font-bold text-corporate-navy'>{i+1}. {d.dimension}</p>
                            <p className='text-xs text-gray-600'>Average Score: {d.score.toFixed(2)} / 5.00</p>
                        </div>
                    ))}
                </div>
                
                <h3 className="text-xl font-extrabold text-corporate-navy mb-4">Comparison: Personalized vs. Generic</h3>
                <div className='space-y-1 text-sm text-gray-700'>
                    <StatItem 
                        label="Total Estimated Training Time" 
                        value={userTotalDuration} 
                        unit="min" 
                        diff={durationDifference} 
                        isPositiveBetter={false} 
                    />
                    <StatItem 
                        label="Mastery Reps (High Skill)" 
                        value={userMasteryContent} 
                        unit="items" 
                        diff={masteryDifference} 
                        isPositiveBetter={true} 
                    />
                    <StatItem 
                        label="Introductory Reps (Low Skill)" 
                        value={userIntroContent} 
                        unit="items" 
                        diff={introDifference} 
                        isPositiveBetter={false}
                    />
                </div>
                <p className='text-xs text-gray-600 mt-4 italic'>
                    *The AI tailored your content difficulty and sequence based on your specific Tiers and self-rated skill gaps to apply **Progressive Overload**.
                </p>
                
                <div className='flex justify-between space-x-4 mt-6'>
                    <Button onClick={handleStartOver} variant='outline' className='text-xs px-4 py-2 text-corporate-orange border-corporate-orange/50 hover:bg-corporate-orange/10'>
                        <X className='w-4 h-4 mr-1'/> Start Over / Re-Run Assessment
                    </Button>
                    <Button onClick={handleFinalize} variant='primary'>
                        <CornerRightUp className='w-4 h-4 mr-1'/> Go to Roadmap Tracker
                    </Button>
                </div>
            </Card>
            </div>
        </div>
    );
};


// --- Main Router (Enhanced with internal state) ---
export const ProfDevPlanScreen = ({ initialScreen }) => {
    const [generatedPlanData, setGeneratedPlanData] = useState(null); 
    
    
    // Local override so Tracker shows a newly generated plan immediately
    const [overridePdpData, setOverridePdpData] = useState(null);
const services = useAppServices(); 
    const { pdpData, isLoading, error, userId, navigate, updatePdpData, saveNewPlan, SKILL_CONTENT_LIBRARY } = services;

    // Clear the local override once live pdpData has caught up
    useEffect(() => {
        if (!overridePdpData || !pdpData) return;
        const liveTs = Date.parse(pdpData?.lastUpdate || 0) || 0;
        const ovTs = Date.parse(overridePdpData?.lastUpdate || 0) || 0;
        if (liveTs >= ovTs && Array.isArray(pdpData.plan) && pdpData.plan.length > 0) {
            setOverridePdpData(null);
        }
    }, [pdpData, overridePdpData]);


    // Pull the content library from the service, with a safety check
    const contentLibrary = SKILL_CONTENT_LIBRARY?.items || CONTENT_LIBRARY; 

    const clearReviewData = useCallback(() => {
        setGeneratedPlanData(null);
    }, []);

    // CRITICAL FIX: Router Logic Check for Plan Integrity
    const planExistsAndIsValid = useMemo(() => {
        // A plan is valid only if it exists AND contains the 'plan' array created by the new generator.
        return pdpData !== null && Array.isArray(pdpData.plan) && pdpData.plan.length > 0;
    }, [pdpData]);

    
let currentView = 'loading';
if (isLoading || pdpData === undefined) {
    currentView = 'loading';
} else if (error) {
    currentView = 'error';
} else if (generatedPlanData || initialScreen === 'prof-dev-plan-review') {
    currentView = 'review';
} else if (planExistsAndIsValid) {
    currentView = 'tracker';
} else {
    currentView = 'generator';
}

    
    // CRITICAL: Updated generatePlanData to take the library as an argument
    const generatePlanDataWrapper = useCallback((assessment, ownerUid) => {
        // Pass the contentLibrary (loaded from service or fallback) to the generator function
        return generatePlanData(assessment, ownerUid, contentLibrary);
    }, [contentLibrary]); 

    useEffect(() => {
        if (initialScreen === 'prof-dev-plan-review' && pdpData && !generatedPlanData) {
            // Mock generic plan data is passed to the review screen for comparison stats
            setGeneratedPlanData({ userPlan: pdpData, genericPlan: { totalDuration: 1200, avgIntroContent: 8, avgMasteryContent: 3 } });
        }
    }, [initialScreen, pdpData, generatedPlanData]);


    // Prep Phase Widgets - Show on all views except loading
    const PrepPhaseWidgets = () => (
        <div className="space-y-4 mb-6 max-w-4xl mx-auto">
            <LeaderProfileWidget />
            <BaselineAssessmentWidget />
        </div>
    );

    if (currentView === 'loading') { 
        return (
            <div className="p-4 sm:p-3 sm:p-4 lg:p-6 lg:p-8 min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-corporate-teal mb-3"></div>
                    <p className="text-corporate-teal font-medium">Loading Personalized Development Roadmap...</p>
                </div>
            </div>
        );
    }
    if (currentView === 'error') { return React.createElement('div', null, 'Error...'); }
    if (currentView === 'review') { return (
        <>
            <div className="p-4 sm:p-6 lg:p-8 pb-0">
                <PrepPhaseWidgets />
            </div>
            <PlanReviewScreen
                generatedPlan={generatedPlanData}
                navigate={navigate}
                clearReviewData={clearReviewData}
                finalizeWithData={(data) => {
                    setOverridePdpData(data);
                    clearReviewData();
                    navigate('/prof-dev-plan');
                }}
            />
        </>
    ); }
    if (currentView === 'generator') { 
        return (
            <>
                <div className="p-4 sm:p-6 lg:p-8 pb-0">
                    <PrepPhaseWidgets />
                </div>
                <PlanGeneratorView 
                    userId={userId} 
                    saveNewPlan={saveNewPlan} 
                    isLoading={false} 
                    error={null} 
                    navigate={navigate} 
                    setGeneratedPlanData={setGeneratedPlanData} 
                    generatePlanDataWrapper={generatePlanDataWrapper}
                />
            </>
        ); 
    }

    // currentView === 'tracker'
    const trackerProps = { data: (overridePdpData || pdpData), updatePdpData, saveNewPlan, userId, navigate };
    return (
        <>
            <div className="p-4 sm:p-6 lg:p-8 pb-0">
                <PrepPhaseWidgets />
            </div>
            <TrackerDashboardView {...trackerProps} />
        </>
    );
};

export default ProfDevPlanScreen;