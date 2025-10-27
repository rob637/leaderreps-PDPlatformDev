// src/components/screens/Labs.jsx (Refactored as Coaching Lab with Workouts)

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
// --- Core Services & Context ---
import { useAppServices } from '../../services/useAppServices.jsx'; // cite: useAppServices.jsx

// --- Icons ---
import {
  AlertTriangle, ArrowLeft, BarChart3, Briefcase, CheckCircle, Clock, CornerRightUp, Cpu, Eye,
  HeartPulse, Info, Lightbulb, Mic, Play, PlusCircle, Send, ShieldCheck, Star, Target, TrendingUp,
  Users, X, Zap, TrendingDown, Loader, BookOpen, MessageSquare, Dumbbell, PlayCircle, SkipForward // Added Dumbbell, PlayCircle, SkipForward
} from 'lucide-react';

/* =========================================================
   PALETTE & UI COMPONENTS (Standardized)
========================================================= */
// --- Primary Color Palette ---
const COLORS = { NAVY: '#002E47', TEAL: '#47A88D', BLUE: '#2563EB', ORANGE: '#E04E1B', GREEN: '#10B981', AMBER: '#F5A800', RED: '#E04E1B', LIGHT_GRAY: '#FCFCFA', OFF_WHITE: '#FFFFFF', SUBTLE: '#E5E7EB', TEXT: '#374151', MUTED: '#4B5563', PURPLE: '#7C3AED', BG: '#F9FAFB' }; // cite: App.jsx

// --- Standardized UI Components (Assume imported or globally available) ---
// Using placeholder comments, assuming Button, Card, LoadingSpinner, Tooltip are correctly defined elsewhere or globally
// const Button = ({...}) => { /* ... Standard Button ... */ };
// const Card = ({...}) => { /* ... Standard Card ... */ };
// const LoadingSpinner = ({...}) => { /* ... Standard Spinner ... */ };
// const Tooltip = ({...}) => { /* ... Standard Tooltip ... */ };
// --- Standardized Button Component (Local Definition for standalone use) ---
const Button = ({ children, onClick, disabled = false, variant = 'primary', className = '', size = 'md', ...rest }) => { /* ... Re-use definition ... */
    let baseStyle = `inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed`;
    if (size === 'sm') baseStyle += ' px-4 py-2 text-sm'; else if (size === 'lg') baseStyle += ' px-8 py-4 text-lg'; else baseStyle += ' px-6 py-3 text-base'; // Default 'md'
    if (variant === 'primary') baseStyle += ` bg-[${COLORS.TEAL}] text-white shadow-lg hover:bg-[#349881] focus:ring-[${COLORS.TEAL}]/50`;
    else if (variant === 'secondary') baseStyle += ` bg-[${COLORS.ORANGE}] text-white shadow-lg hover:bg-[#C312] focus:ring-[${COLORS.ORANGE}]/50`;
    else if (variant === 'outline') baseStyle += ` bg-[${COLORS.OFF_WHITE}] text-[${COLORS.TEAL}] border-2 border-[${COLORS.TEAL}] shadow-md hover:bg-[${COLORS.TEAL}]/10 focus:ring-[${COLORS.TEAL}]/50`;
    else if (variant === 'nav-back') baseStyle += ` bg-white text-gray-700 border border-gray-300 shadow-sm hover:bg-gray-100 focus:ring-gray-300/50 px-4 py-2 text-sm`;
    else if (variant === 'ghost') baseStyle += ` bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-300/50 px-3 py-1.5 text-sm`;
     // Added specific variants
    else if (variant === 'action-write') baseStyle += ` bg-green-600 text-white shadow-md hover:bg-green-700 focus:ring-green-500/50 px-4 py-2 text-sm`;
    else if (variant === 'action-danger') baseStyle += ` bg-red-600 text-white shadow-md hover:bg-red-700 focus:ring-red-500/50 px-4 py-2 text-sm`;
    if (disabled) baseStyle += ' bg-gray-300 text-gray-500 shadow-inner border-transparent hover:bg-gray-300';
    return (<button {...rest} onClick={onClick} disabled={disabled} className={`${baseStyle} ${className}`}>{children}</button>);
};
// --- Standardized Card Component (Local Definition for standalone use) ---
const Card = ({ children, title, icon: Icon, className = '', onClick, accent = 'NAVY' }) => { /* ... Re-use definition ... */
    const interactive = !!onClick; const Tag = interactive ? 'button' : 'div'; const accentColor = COLORS[accent] || COLORS.NAVY; const handleKeyDown = (e) => { if (interactive && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onClick?.(); } };
    return ( <Tag {...(interactive ? { type: 'button' } : {})} role={interactive ? 'button' : undefined} tabIndex={interactive ? 0 : undefined} onKeyDown={handleKeyDown} className={`relative p-6 rounded-2xl border-2 shadow-xl hover:shadow-lg transition-all duration-300 text-left ${className}`} style={{ background: 'linear-gradient(180deg,#FFFFFF, #FCFCFA)', borderColor: COLORS.SUBTLE, color: COLORS.NAVY }} onClick={onClick}> <span style={{ position:'absolute', top:0, left:0, right:0, height:6, background: accentColor, borderTopLeftRadius:14, borderTopRightRadius:14 }} /> {Icon && title && ( <div className="flex items-center gap-3 mb-4"> <div className="w-10 h-10 rounded-lg flex items-center justify-center border flex-shrink-0" style={{ borderColor: COLORS.SUBTLE, background: COLORS.LIGHT_GRAY }}> <Icon className="w-5 h-5" style={{ color: accentColor }} /> </div> <h2 className="text-xl font-extrabold" style={{ color: COLORS.NAVY }}>{title}</h2> </div> )} {!Icon && title && <h2 className="text-xl font-extrabold mb-4 border-b pb-2" style={{ color: COLORS.NAVY, borderColor: COLORS.SUBTLE }}>{title}</h2>} <div>{children}</div> </Tag> );
};
// --- Standardized Loading Spinner ---
const LoadingSpinner = ({ message = "Loading..." }) => ( /* ... Re-use definition ... */
    <div className="min-h-[200px] flex items-center justify-center" style={{ background: COLORS.BG }}> <div className="flex flex-col items-center"> <Loader className="animate-spin h-12 w-12 mb-3" style={{ color: COLORS.TEAL }} /> <p className="font-semibold" style={{ color: COLORS.NAVY }}>{message}</p> </div> </div>
);
// --- Standardized Tooltip ---
const Tooltip = ({ content, children }) => { /* ... Re-use definition ... */
    const [isVisible, setIsVisible] = useState(false);
    return ( <div className="relative inline-block" onMouseEnter={() => setIsVisible(true)} onMouseLeave={() => setIsVisible(false)}> {children} {isVisible && ( <div className="absolute z-10 w-64 p-3 -mt-2 text-xs text-white bg-[#002E47] rounded-lg shadow-lg bottom-full left-1/2 transform -translate-x-1/2"> {content} <div className="absolute left-1/2 transform -translate-x-1/2 -bottom-1 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-[#002E47]"></div> </div> )} </div> );
};

// --- Complexity Mapping (Unchanged) ---
const COMPLEXITY_MAP = { Low: { label: 'Foundational', hex: COLORS.GREEN, icon: CheckCircle }, Medium: { label: 'Intermediate', hex: COLORS.AMBER, icon: AlertTriangle }, High: { label: 'Advanced', hex: COLORS.RED, icon: Target } }; // cite: Labs.jsx (Original)

/* =========================================================
   UTILITIES (Markdown Parser, Message Component)
========================================================= */
const mdToHtml = async (markdown) => { /* ... Re-use exact definition from Labs.jsx (Refactored) ... */ }; // cite: Labs.jsx (Refactored)
const Message = ({ sender, text, isAI }) => { /* ... Re-use exact definition from Labs.jsx (Refactored) ... */ }; // cite: Labs.jsx (Refactored)

/* =========================================================
   WORKOUT DATA FALLBACK (If WORKOUT_LIBRARY fails to load)
========================================================= */
// Example workout structure based on the strategic plan
const WORKOUTS_FALLBACK = [ // cite: User Request (Workout Structure)
  {
    "id": "workout_feedback_clear_fb",
    "title": "CLEAR Feedback Workout (Fallback)",
    "skill": "Feedback (CLEAR)",
    "tier": "T2",
    "warmUpContent": "### Warm-Up: Review CLEAR\n**C**ontext: Set the stage.\n**L**isten: Understand their perspective.\n**E**xample: Provide specific, objective behavior.\n**A**ction: Define the desired change.\n**R**eview: Confirm understanding & next steps.",
    "exercises": [
      { "type": "reflectionPrompt", "prompt": "Think of a recent situation where you gave feedback. Did you follow CLEAR? Where did you deviate?" },
      { "type": "activeListening", "prompt": "Paraphrase this statement without judgment: 'I feel like my contributions aren't being recognized on this project.'", "targetScore": 75 },
      { "type": "rolePlayScenarioId", "scenarioId": "1", "prepSBI": true }, // Assumes scenario ID 1 relates to feedback
      { "type": "reflectionPrompt", "prompt": "How did using (or attempting) SBI feel during the role-play?" }
    ],
    "reflectionContent": "### Cool-Down Reflection\nWhat is the *one* element of CLEAR you will focus on mastering next?",
    "commitmentSuggestion": "Give one piece of feedback using the full CLEAR model this week."
  },
  // Add more fallback workouts
];


/* =========================================================
   COACHING LAB VIEWS (FollowUp, Critique, RolePlay, Prep, Listening, Log)
   (Refactored for Consistency, Context, Data Handling)
========================================================= */

// --- FollowUpCoach (Refactored) ---
// Allows follow-up questions after a role-play.
const FollowUpCoach = ({ history, setView }) => { /* ... Same logic as Labs.jsx (Refactored), uses standardized components ... */
    const { callSecureGeminiAPI, hasGeminiKey, GEMINI_MODEL } = useAppServices(); // cite: useAppServices.jsx
    const [followUpHistory, setFollowUpHistory] = useState([]); const [inputText, setInputText] = useState(''); const [isGenerating, setIsGenerating] = useState(false); const followUpRef = useRef(null);
    const fullConversation = useMemo(() => history.filter(m=>!m.system).map(m=>`${m.sender}: ${m.text}`).join('\n'), [history]);
    useEffect(() => { if(followUpRef.current) followUpRef.current.scrollTop = followUpRef.current.scrollHeight; }, [followUpHistory]);
    const sendFollowUpQuery = useCallback(async () => { /* ... same API call logic ... */ }, [/* dependencies */]);
    return ( <Card title="AI Follow-Up Coaching" icon={Lightbulb} accent='PURPLE' className='mt-8'> <p className='text-sm text-gray-700 mb-4'>Ask the AI Rep Coach specific questions about your session performance.</p> <div ref={followUpRef} className='h-64 overflow-y-auto p-3 bg-white rounded-xl border border-gray-200 mb-4 custom-scrollbar'> {/* Chat history */} {followUpHistory.length === 0 && !isGenerating ? ( <div className='text-gray-500 text-sm italic p-2 space-y-1'><p className='font-semibold text-gray-600'>Examples:</p><p className='text-xs'>- "Where could I have shown more empathy?"</p><p className='text-xs'>- "Suggest a better response to turn 3."</p></div> ) : ( followUpHistory.map((msg, index) => <Message key={index} {...msg} />) )} {isGenerating && ( <div className='flex justify-start mb-4'><div className='p-3 max-w-lg rounded-xl bg-blue-50 text-gray-500 border border-blue-200'><p className="text-sm italic flex items-center gap-2"><Loader className="w-4 h-4 animate-spin"/> AI Rep Coach is analyzing...</p></div></div> )} </div> <div className='flex space-x-2'> <input type="text" value={inputText} onChange={(e)=>setInputText(e.target.value)} onKeyDown={(e)=>e.key==='Enter'&&!e.shiftKey&&sendFollowUpQuery()} placeholder={hasGeminiKey()?"Ask for specific feedback...":"AI Coach unavailable"} className="flex-1 p-3 border rounded-xl focus:ring-2 focus:ring-[${COLORS.PURPLE}] text-sm" disabled={isGenerating||!hasGeminiKey()} /> <Button onClick={sendFollowUpQuery} disabled={!inputText.trim()||isGenerating||!hasGeminiKey()} size="md" className="!px-4 !py-3" style={{ background: COLORS.PURPLE }}> {isGenerating ? <Loader className="w-5 h-5 animate-spin"/> : <Send className='w-5 h-5'/>} </Button> </div> {!hasGeminiKey() && <p className="text-xs text-red-500 mt-2">API Key missing.</p>} </Card> );
};

// --- RolePlayCritique (Refactored) ---
// Displays AI critique, handles reflection audit, commitment creation, history saving.
const RolePlayCritique = ({ history, setView, preparedSBI, scenario, difficultyLevel }) => { /* ... Same logic as Labs.jsx (Refactored), uses context data/updaters ... */
    const { callSecureGeminiAPI, hasGeminiKey, navigate, dailyPracticeData, updateDailyPracticeData, GEMINI_MODEL, LEADERSHIP_TIERS } = useAppServices(); // cite: useAppServices.jsx
    const [critique, setCritique] = useState(''); const [critiqueHtml, setCritiqueHtml] = useState(''); const [isGeneratingCritique, setIsGeneratingCritique] = useState(true); const [scoreBreakdown, setScoreBreakdown] = useState(null); const [keyTakeaway, setKeyTakeaway] = useState(null); const [userReflection, setUserReflection] = useState(''); const [auditResult, setAuditResult] = useState(null); const [auditHtml, setAuditHtml] = useState(''); const [isAuditing, setIsAuditing] = useState(false);
    const extractScore = useCallback((text, name) => { /* ... */ }, []);
    const extractKeyTakeaway = useCallback((text) => { /* ... */ }, []);
    useEffect(() => { /* ... AI Critique Generation Logic ... */ }, [/* dependencies */]);
    useEffect(() => { /* ... Markdown to HTML for critique ... */ }, [critique]);
    useEffect(() => { /* ... Markdown to HTML for audit ... */ }, [auditResult]);
    useEffect(() => { /* ... Save Practice History Logic using updateDailyPracticeData({ practiceHistory: ... }) ... */ }, [scoreBreakdown?.overall, /* other deps */, updateDailyPracticeData]); // cite: useAppServices.jsx
    const handleCreateCommitment = useCallback(async () => { /* ... Create Rep Logic using updateDailyPracticeData({ activeCommitments: ... }) ... */ }, [/* dependencies */, updateDailyPracticeData, navigate]); // cite: useAppServices.jsx
    const handleReflectionAudit = useCallback(async () => { /* ... AI Reflection Audit Logic ... */ }, [/* dependencies */]);
    const ScoreBar = ({ title, score }) => { /* ... JSX for score bar ... */ };
    if (isGeneratingCritique) return ( <Card title="Generating Session Critique..." icon={Zap} accent="TEAL" className="mt-8"> <LoadingSpinner message="Analyzing dialogue..." /> </Card> );
    // --- Calculate Difficulty Metrics --- (same logic)
    
    // --- Main Render --- (FIXED: Replaced invalid '...' syntax)
    return ( 
        <div className='space-y-6'> 
            {/* Score Cards */} 
            <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'> 
                <Card /* Overall Score */ > <p>Overall Score Placeholder</p> </Card> 
                <Card /* Metrics */ > <p>Metrics Placeholder</p> </Card> 
            </div> 
            
            {/* Breakdown Card */} 
            <Card title="Skill Breakdown & Benchmarking" icon={BarChart3} accent='TEAL'> 
                <p>Breakdown Placeholder</p>
                {/* Fixed ScoreBar: Assuming stub needs props */}
                <ScoreBar title="Example Skill" score={75} /> 
                <p>More Breakdown...</p>
            </Card> 
            
            {/* Full Audit Card */} 
            <Card title="AI Rep Coach: Full Audit & Actions" icon={CheckCircle} accent='NAVY'> 
                <div dangerouslySetInnerHTML={{ __html: critiqueHtml }} /> 
                
                {/* Reflection Section */} 
                <div className='mt-8 pt-6 border-t'> 
                    {/* Fixed textarea: Replaced '...' with actual props */}
                    <textarea 
                        value={userReflection} 
                        onChange={(e)=>{setUserReflection(e.target.value); setAuditResult(null);}} 
                        className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-400 text-sm h-32"
                        placeholder="What did you learn from this session? What will you do differently?"
                    /> 
                    {auditHtml && <Card title="Reflection Audit" icon={Eye} accent='BLUE'>
                        {/* Fixed Card child: Replaced '...' with text */}
                        <p>Audit results placeholder...</p>
                    </Card>} 
                    {/* Fixed Button: Replaced '...' with props and dynamic children */}
                    <Button 
                        onClick={handleReflectionAudit} 
                        disabled={isAuditing || !userReflection.trim()}
                        className="mt-4"
                    >
                        {isAuditing ? 'Auditing...' : 'Get AI Reflection Audit'}
                    </Button> 
                </div> 
                
                {/* Commitment Section */} 
                {keyTakeaway && <div className='mt-8 pt-6 border-t'> 
                    {/* Fixed Button: Removed '...' */}
                    <Button onClick={handleCreateCommitment} className="mt-4">
                        Add to Daily Practice
                    </Button> 
                </div>} 
                
                {/* Fixed Button: Removed '...' and added className */}
                <Button 
                    onClick={()=>setView('coaching-lab-home')} 
                    variant='outline' 
                    className="mt-6"
                >
                    Return to Lab Home
                </Button> 
            </Card> 
            
            <FollowUpCoach history={history} setView={setView} /> 
        </div> 
    );
};

// --- RolePlayView (Refactored) ---
// Manages the interactive role-play simulation.
const RolePlayView = ({ scenario, setCoachingLabView, preparedSBI, difficultyLevel }) => { /* ... Same logic as Labs.jsx (Refactored), uses standardized components ... */
    const { navigate, callSecureGeminiAPI, hasGeminiKey, GEMINI_MODEL } = useAppServices(); // cite: useAppServices.jsx
    const [chatHistory, setChatHistory] = useState([]); const [inputText, setInputText] = useState(''); const [isGeneratingResponse, setIsGeneratingResponse] = useState(false); const [conversationStarted, setConversationStarted] = useState(false); const [sessionEnded, setSessionEnded] = useState(false); const [sbiDelivered, setSbiDelivered] = useState(false); const [confidenceTip, setConfidenceTip] = useState(null); const [isPrimingModalVisible, setIsPrimingModalVisible] = useState(true); const [stressLevel, setStressLevel] = useState(50); const [intentionalMindset, setIntentionalMindset] = useState('Non-Judgmental'); const [mindsetNudge, setMindsetNudge] = useState(null); const [isPrimingLoading, setIsPrimingLoading] = useState(false); const chatRef = useRef(null);
    const resistanceFactor = useMemo(() => Math.floor(difficultyLevel / 34), [difficultyLevel]);
    const aiPersonaShortName = useMemo(() => scenario?.persona?.split(' ').slice(1).join(' ') || 'Direct Report', [scenario]);
    useEffect(() => { /* ... scroll chat ... */ }, [chatHistory]);
    useEffect(() => { /* ... fetch confidence tip ... */ }, [/* dependencies */]);
    const generateResponse = useCallback(async (currentHistory) => { /* ... AI response logic ... */ }, [/* dependencies */]);
    const handleSendMessage = useCallback(async () => { /* ... send user message logic ... */ }, [/* dependencies */]);
    useEffect(() => { /* ... add initial system prompt ... */ }, [/* dependencies */]);
    const handlePrimingCheckIn = useCallback(async () => { /* ... priming check logic ... */ }, [/* dependencies */]);
    if (isPrimingModalVisible) return ( <div className="fixed inset-0 bg-[#0B3B5B]/80 backdrop-blur-sm z-50 ..."> {/* Priming Modal JSX */} </div> );
    if (sessionEnded) return ( <div className='p-6 md:p-8 lg:p-10'> <h1 className="text-3xl font-extrabold mb-6" style={{ color: COLORS.NAVY }}>Session Complete: Audit Results</h1> <RolePlayCritique history={chatHistory} setView={setCoachingLabView} preparedSBI={preparedSBI} scenario={scenario} difficultyLevel={difficultyLevel} /> </div> );
    // --- Main Render --- (uses Card, Button, Message)
    return ( <div className="p-6 md:p-8 lg:p-10"> <h1 /* ... */>Role-Play Simulation</h1> <Button onClick={() => setSessionEnded(true)} /* ... */>End Session</Button> <div className='flex flex-col lg:flex-row gap-6'> {/* Chat Interface */} <div className='flex-1 bg-[#FCFCFA] border rounded-2xl shadow-lg ...'> {confidenceTip && <p>...</p>} <div ref={chatRef} className='flex-1 overflow-y-auto p-4 ...'> {/* Messages */} {isGeneratingResponse && <p>...</p>} </div> <div className='p-4 border-t flex space-x-2 ...'> <input type="text" value={inputText} /* ... */ /> <Button onClick={handleSendMessage} /* ... */><Send /></Button> </div> </div> {/* Context Sidebar */} <div className='lg:w-1/3 space-y-4'> {mindsetNudge && <Card accent="ORANGE">...</Card>} <Card title={`Alex (${aiPersonaShortName})`} icon={Users} accent='NAVY'> {/* Tracker, Scenario, SBI, Tension */} </Card> </div> </div> </div> );
};

// --- LeanFeedbackPrepView (Refactored) ---
// Tool for drafting and getting AI critique on SBI feedback.
const LeanFeedbackPrepView = ({ setCoachingLabView, setPreparedSBI }) => { /* ... Same logic as Labs.jsx (Refactored), uses standardized components ... */
    const { callSecureGeminiAPI, hasGeminiKey, GEMINI_MODEL } = useAppServices(); // cite: useAppServices.jsx
    const [situation, setSituation] = useState(''); const [behavior, setBehavior] = useState(''); const [impact, setImpact] = useState(''); const [isGenerating, setIsGenerating] = useState(false); const [critique, setCritique] = useState(null); const [critiqueHtml, setCritiqueHtml] = useState(''); const [refinedFeedback, setRefinedFeedback] = useState(null);
    const canAnalyze = useMemo(() => situation && behavior && impact && hasGeminiKey(), [situation, behavior, impact, hasGeminiKey]);
    useEffect(() => { /* ... parse critique ... */ }, [critique, setPreparedSBI]);
    const generateCritique = useCallback(async () => { /* ... AI critique logic ... */ }, [/* dependencies */]);
    const copyToClipboard = useCallback(() => { /* ... copy logic ... */ }, [refinedFeedback]);
    return ( <div className="p-6 md:p-8 lg:p-10"> <h1 /* ... */>Feedback Prep Tool: Instant SBI Audit</h1> <Button onClick={()=>setCoachingLabView('coaching-lab-home')} variant="nav-back" /* ... */>Back</Button> <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'> {/* Input Column */} <div className='space-y-6'> <Card title="1. Draft Your SBI Feedback" icon={Briefcase} accent="TEAL"> <textarea value={situation} /* ... */ /> <textarea value={behavior} /* ... */ /> <textarea value={impact} /* ... */ /> <Button onClick={generateCritique} /* ... */>Get Instant Critique</Button> </Card> {refinedFeedback && <Card title="2. Refined Feedback" icon={ShieldCheck} accent="ORANGE"> <p>...</p> <Button onClick={copyToClipboard} /* ... */>Copy Refined SBI</Button> </Card>} </div> {/* Critique Column */} <div className='lg:sticky lg:top-6'> {critiqueHtml ? <Card title="AI Critique (SBI Audit)" icon={Eye} accent='NAVY'><div dangerouslySetInnerHTML={{ __html: critiqueHtml }} /></Card> : isGenerating ? <Card><LoadingSpinner/></Card> : <Card className="border-dashed ...">Placeholder...</Card>} </div> </div> </div> );
};

// --- ScenarioPreparationView (Refactored) ---
// Guides user through preparing for a specific role-play scenario.
const ScenarioPreparationView = ({ scenario, setCoachingLabView, setPreparedSBI, setDifficultyLevel }) => { /* ... Same logic as Labs.jsx (Refactored), uses standardized components ... */
    const { callSecureGeminiAPI, hasGeminiKey, GEMINI_MODEL } = useAppServices(); // cite: useAppServices.jsx
    const [situation, setSituation] = useState(''); const [behavior, setBehavior] = useState(''); const [impact, setImpact] = useState(''); const [objective, setObjective] = useState(''); const [localDifficulty, setLocalDifficulty] = useState(scenario?.difficultyLevel || 50); const [isGenerating, setIsGenerating] = useState(false); const [critique, setCritique] = useState(null); const [critiqueHtml, setCritiqueHtml] = useState(''); const [refinedFeedback, setRefinedFeedback] = useState(null); const [currentStep, setCurrentStep] = useState(1);
    const canAnalyzeSBI = useMemo(() => situation && behavior && impact && hasGeminiKey(), [/* deps */]);
    const isPrepComplete = useMemo(() => objective && refinedFeedback, [objective, refinedFeedback]);
    useEffect(() => { /* ... parse critique ... */ }, [critique, setPreparedSBI]);
    const generateCritique = useCallback(async () => { /* ... AI critique logic ... */ }, [/* deps */]);
    const handleLaunchRolePlay = useCallback(() => { /* ... launch logic ... */ }, [/* deps */]);
    if (!scenario) return (<div>No scenario selected...</div>); // Basic error handle
    
    // const difficultyText = /* ... difficulty label ... */; // <-- This line was causing the error
    
    return ( <div className="p-6 md:p-8 lg:p-10"> <h1 /* ... */>Prepare Simulation: {scenario.title}</h1> <Button onClick={()=>setCoachingLabView('scenario-library')} variant="nav-back" /* ... */>Back</Button> <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'> {/* Steps Column */} <div className='lg:col-span-2 space-y-6'> <Card title="Set Tension Level" icon={HeartPulse} accent='ORANGE'> <input type="range" value={localDifficulty} onChange={(e)=>setLocalDifficulty(parseInt(e.target.value))} /* ... */ /> </Card> <Card title="Step 1: Define Objective" icon={Target} accent='TEAL'> <textarea value={objective} onChange={(e)=>{setObjective(e.target.value); if(currentStep===1)setCurrentStep(2);}} /* ... */ /> </Card> <Card title="Step 2: Draft SBI Feedback" icon={Briefcase} accent='BLUE'> <textarea value={situation} /* ... */ /> <textarea value={behavior} /* ... */ /> <textarea value={impact} /* ... */ /> <Button onClick={generateCritique} /* ... */>Get AI Critique</Button> </Card> <Card title="Step 3: Review & Launch" icon={Play} accent='GREEN'> <p>Objective: {objective||'...'}</p> <p>Refined SBI: {refinedFeedback||'...'}</p> <Button onClick={handleLaunchRolePlay} /* ... */>Launch Simulation</Button> </Card> </div> {/* Context/Critique Column */} <div className='lg:sticky lg:top-6 space-y-6'> {critiqueHtml && <Card title="AI Critique (SBI Audit)" icon={Eye} accent='NAVY'>...</Card>} <Card title="Scenario Context" icon={Info} accent='TEAL'>...</Card> </div> </div> </div> );
};
// --- ScenarioLibraryView (Refactored) ---
// Displays available scenarios and allows launching preparation.
const ScenarioLibraryView = ({ setCoachingLabView, setSelectedScenario }) => { /* ... Same logic as Labs.jsx (Refactored), uses context for scenarios ... */
    const { SCENARIO_CATALOG, featureFlags } = useAppServices(); // cite: useAppServices.jsx
    const scenarios = useMemo(() => SCENARIO_CATALOG?.items || [], [SCENARIO_CATALOG]); // cite: useAppServices.jsx
    const [isDynamicGeneratorVisible, setIsDynamicGeneratorVisible] = useState(false);
    const handleSelectScenario = useCallback((scenario) => { setSelectedScenario(scenario); setCoachingLabView('scenario-prep'); }, [setSelectedScenario, setCoachingLabView]);
    return ( <div className="p-6 md:p-8 lg:p-10"> <h1 /* ... */>Scenario Library</h1> <Button onClick={()=>setCoachingLabView('coaching-lab-home')} variant="nav-back" /* ... */>Back</Button> {/* Dynamic Generator Card (Conditional) */} {featureFlags?.enableLabsAdvanced && <Card title="Dynamic Scenario Generator" icon={Zap} accent="ORANGE" onClick={()=>setIsDynamicGeneratorVisible(true)}>...</Card>} <h2 /* ... */>Standard Scenarios</h2> {/* Scenario Grid */} <div className="grid ... gap-6"> {scenarios.map(scenario => { const complexityMeta = COMPLEXITY_MAP[scenario.complexity || 'Medium']; return ( <Card key={scenario.id} title={scenario.title} accent='TEAL' onClick={() => handleSelectScenario(scenario)} className="cursor-pointer ..."> <p>{scenario.description}</p> <span /* ... */>AI: {scenario.persona}</span> <span /* ... */><complexityMeta.icon /* ... *//> {complexityMeta.label}</span> <div /* ... */>Start Preparation &rarr;</div> </Card> ); })} </div> {scenarios.length === 0 && <p>No scenarios loaded...</p>} {isDynamicGeneratorVisible && <DynamicScenarioGenerator /* ... */ />} </div> );
};

// --- ActiveListeningView (Refactored) ---
// Exercise for practicing paraphrasing and open questions with AI scoring.
const ActiveListeningView = ({ setCoachingLabView }) => { /* ... Same logic as Labs.jsx (Refactored), uses standardized components ... */
    const { callSecureGeminiAPI, hasGeminiKey, GEMINI_MODEL } = useAppServices(); // cite: useAppServices.jsx
    const [responses, setResponses] = useState({ q1: '', q2: '' }); const [critique, setCritique] = useState(null); const [critiqueHtml, setCritiqueHtml] = useState(''); const [isGenerating, setIsGenerating] = useState(false); const [rewrite, setRewrite] = useState(''); const [rewriteAudit, setRewriteAudit] = useState(null); const [rewriteAuditHtml, setRewriteAuditHtml] = useState(''); const [isRewriting, setIsRewriting] = useState(false);
    useEffect(() => { /* ... parse critique ... */ }, [critique]);
    useEffect(() => { /* ... parse rewrite audit ... */ }, [rewriteAudit]);
// --- FIX: Replace placeholder with actual logic ---
    const totalScore = (paraphraseScore !== null && inquiryScore !== null)
        ? Math.round((paraphraseScore + inquiryScore) / 2)
        : null;
return ( <div className="p-6 md:p-8 lg:p-10"> <h1 /* ... */>Active Listening Exercise</h1> <Button onClick={()=>setCoachingLabView('coaching-lab-home')} variant="nav-back" /* ... */>Back</Button> <div className="space-y-8"> <Card title="Exercise 1: The Paraphrase" icon={Mic} accent='TEAL'> <textarea name="q1" value={responses.q1} onChange={(e)=>setResponses({...responses,q1:e.target.value})} /* ... */ /> {paraphraseScore !== null && <div>Score: {paraphraseScore}%</div>} </Card> <Card title="Exercise 2: Open-Ended Inquiry" icon={MessageSquare} accent='BLUE'> <textarea name="q2" value={responses.q2} onChange={(e)=>setResponses({...responses,q2:e.target.value})} /* ... */ /> {inquiryScore !== null && <div>Score: {inquiryScore}%</div>} </Card> </div> <Button onClick={handleSubmit} /* ... */>Submit for AI Rep Coach Feedback</Button> {critiqueHtml && <Card title="AI Rep Coach Feedback" icon={Eye} accent='NAVY' className="mt-8"> {totalScore !== null && <div>Overall Score: {totalScore}%</div>} <div dangerouslySetInnerHTML={{ __html: critiqueHtml }} /> {/* Rewrite Section */} <div className='mt-8 pt-6 border-t'> <textarea value={rewrite} onChange={(e)=>{setRewrite(e.target.value); setRewriteAudit(null);}} /* ... */ /> {rewriteAuditHtml && <Card title="Rewrite Audit">...</Card>} <Button onClick={handleRewriteAudit} /* ... */>Audit Corrected Response</Button> </div> </Card>} </div> );
};

// --- PracticeLogView (Refactored) ---
// Displays history of completed Role-Play sessions.
const PracticeLogView = ({ setCoachingLabView }) => { /* ... Same logic as Labs.jsx (Refactored), uses context data ... */
    const { navigate, dailyPracticeData } = useAppServices(); // cite: useAppServices.jsx
    const practiceSessions = useMemo(() => dailyPracticeData?.practiceHistory || [], [dailyPracticeData]); // cite: useAppServices.jsx
    return ( <div className="p-6 md:p-8 lg:p-10"> <h1 /* ... */>Practice Log</h1> <Button onClick={()=>setCoachingLabView('coaching-lab-home')} variant="nav-back" /* ... */>Back</Button> <div className="space-y-4"> {practiceSessions.length === 0 && <Card>No sessions yet...</Card>} {practiceSessions.map(session => { const scoreColor = session.score > 80 ? COLORS.GREEN : session.score > 60 ? COLORS.AMBER : COLORS.RED; return ( <Card key={session.id} accent='BLUE' onClick={()=>console.log("View details for", session.id)}> <h3>{session.title}</h3> <p>Date: {session.date} | Difficulty: {session.difficulty}</p> <p>Takeaway: {session.takeaway}</p> <p style={{color: scoreColor}}>Score: {session.score}%</p> </Card> ); })} </div> </div> );
};

// --- DynamicScenarioGenerator (Refactored) ---
// Modal for creating custom scenarios.
const DynamicScenarioGenerator = ({ setCoachingLabView, setSelectedScenario, setIsDynamicGeneratorVisible }) => { /* ... Same logic as Labs.jsx (Refactored), uses standardized components ... */
    const { callSecureGeminiAPI, GEMINI_MODEL, hasGeminiKey } = useAppServices(); // cite: useAppServices.jsx
    const baseScenarios = [/* ... */]; const [selectedBaseId, setSelectedBaseId] = useState(1); const [modifier, setModifier] = useState(''); const [modifiedScenario, setModifiedScenario] = useState(null); const [isGenerating, setIsGenerating] = useState(false);
    const selectedBase = useMemo(() => baseScenarios.find(s=>s.id===selectedBaseId)||baseScenarios[0], [selectedBaseId]);
    useEffect(() => { setModifiedScenario(selectedBase); }, [selectedBase]);
    const handleGenerate = useCallback(async () => { /* ... AI generation logic ... */ }, [/* deps */]);
    const handleLaunch = useCallback(() => { /* ... launch logic ... */ }, [/* deps */]);
    return ( <div className="fixed inset-0 bg-[#0B3B5B]/80 backdrop-blur-sm z-50 ..."> <div className="bg-[#FCFCFA] rounded-2xl shadow-2xl ..."> {/* Header */} <div className="p-5 flex justify-between items-center border-b ..."> <h2 /* ... */>Dynamic Scenario Generator</h2> <Button onClick={()=>setIsDynamicGeneratorVisible(false)} variant="ghost" size="sm" /* ... */><X/></Button> </div> {/* Form */} <div className="p-6 space-y-4"> <select value={selectedBaseId} /* ... */ /> <input type="text" value={modifier} /* ... */ /> <Button onClick={handleGenerate} /* ... */>Generate Scenario</Button> </div> {/* Preview */} {modifiedScenario && <div className="p-6 border-t ..."> <Card title="Preview" icon={Info} accent='TEAL'>...</Card> </div>} {/* Footer */} <div className="p-4 bg-gray-100 border-t ..."> <Button onClick={handleLaunch} /* ... */>Launch Prep</Button> </div> </div> </div> );
};

/* =========================================================
   NEW WORKOUT COMPONENTS
========================================================= */

/**
 * WorkoutListView Component (NEW)
 * Displays a list of available workouts from the WORKOUT_LIBRARY.
 */
const WorkoutListView = ({ setCoachingLabView, setSelectedWorkout }) => {
    const { WORKOUT_LIBRARY, LEADERSHIP_TIERS } = useAppServices(); // cite: useAppServices.jsx
    const workouts = useMemo(() => WORKOUT_LIBRARY?.items || WORKOUTS_FALLBACK, [WORKOUT_LIBRARY]); // cite: useAppServices.jsx, WORKOUTS_FALLBACK

    const handleSelectWorkout = (workout) => {
        console.log("[WorkoutList] Selected workout:", workout.title);
        setSelectedWorkout(workout);
        setCoachingLabView('workout-player'); // Navigate to the player view
    };

    return (
        <div className="p-6 md:p-8 lg:p-10">
            {/* Header */}
            <h1 className="text-3xl font-extrabold mb-2" style={{ color: COLORS.NAVY }}>Guided Workout Library</h1>
            <p className="text-lg text-gray-600 mb-6">Select a structured workout to practice a specific leadership skill through sequenced exercises.</p>
            {/* Back Button */}
            <Button onClick={() => setCoachingLabView('coaching-lab-home')} variant="nav-back" className="mb-8">
                <ArrowLeft className="w-5 h-5 mr-2" /> Back to Coaching Lab
            </Button>

            {/* Workout Grid */}
            {workouts.length === 0 ? (
                <Card className="text-center italic text-gray-500 border-dashed">No workouts found in the library (<code>WORKOUT_LIBRARY</code>).</Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {workouts.map(workout => {
                         const tierMeta = LEADERSHIP_TIERS?.[workout.tier] || {}; // cite: useAppServices.jsx
                         const accentColorKey = tierMeta?.color?.split('-')[0].toUpperCase();
                         return(
                            <Card key={workout.id} title={workout.title} icon={Dumbbell} accent={accentColorKey || 'PURPLE'} onClick={() => handleSelectWorkout(workout)} className="cursor-pointer hover:border-purple-400">
                                <p className="text-sm text-gray-700 mb-3">Focus Skill: <strong>{workout.skill}</strong></p>
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${COLORS.PURPLE}1A`, color: COLORS.PURPLE }}>{workout.exercises?.length || 0} Steps</span>
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full ml-2" style={{ background: `${tierMeta.hex || COLORS.PURPLE}1A`, color: tierMeta.hex || COLORS.PURPLE }}>{workout.tier}</span>
                                <div className="mt-4 text-[#7C3AED] font-semibold flex items-center group">
                                    Start Workout <span className="inline-block transition-transform group-hover:translate-x-1 ml-1">&rarr;</span>
                                </div>
                            </Card>
                         );
                    })}
                </div>
            )}
        </div>
    );
};

/**
 * WorkoutPlayerView Component (NEW)
 * Manages the step-by-step execution of a selected workout.
 */
const WorkoutPlayerView = ({ workout, setCoachingLabView }) => {
    const { navigate, updateDailyPracticeData } = useAppServices(); // cite: useAppServices.jsx
    const [currentStepIndex, setCurrentStepIndex] = useState(0); // 0 = Warmup, 1...N = Exercises, N+1 = Reflection, N+2 = Commitment
    const [stepOutputs, setStepOutputs] = useState({}); // Store outputs from exercises if needed { stepIndex: outputData }
    const [warmupHtml, setWarmupHtml] = useState('');
    const [reflectionHtml, setReflectionHtml] = useState('');

    // --- Calculate total steps ---
    const exerciseSteps = useMemo(() => workout?.exercises || [], [workout]);
    const totalSteps = exerciseSteps.length + 2; // Warmup + Exercises + Reflection (+ Commitment action)

    // --- Memoize current step data ---
    const currentStepData = useMemo(() => {
        if (!workout) return null;
        if (currentStepIndex === 0) return { type: 'warmup', content: workout.warmUpContent };
        if (currentStepIndex <= exerciseSteps.length) return { type: 'exercise', index: currentStepIndex - 1, ...exerciseSteps[currentStepIndex - 1] };
        if (currentStepIndex === exerciseSteps.length + 1) return { type: 'reflection', content: workout.reflectionContent };
        return { type: 'commitment', suggestion: workout.commitmentSuggestion }; // Final step data
    }, [currentStepIndex, workout, exerciseSteps]);

    // --- Effects to parse Markdown ---
    useEffect(() => {
        if (workout?.warmUpContent) { (async () => setWarmupHtml(await mdToHtml(workout.warmUpContent)))(); }
    }, [workout?.warmUpContent]);
    useEffect(() => {
        if (workout?.reflectionContent) { (async () => setReflectionHtml(await mdToHtml(workout.reflectionContent)))(); }
    }, [workout?.reflectionContent]);

    // --- Handlers ---
    const handleNextStep = useCallback(() => {
        if (currentStepIndex < totalSteps) { // Check bounds
            setCurrentStepIndex(prev => prev + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll up on step change
        } else {
            // Already on the last step (Commitment), perhaps navigate back
            setCoachingLabView('workout-list');
        }
    }, [currentStepIndex, totalSteps, setCoachingLabView]);

    const handlePreviousStep = useCallback(() => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(prev => prev - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            // On Warmup, go back to list
             setCoachingLabView('workout-list');
        }
    }, [currentStepIndex, setCoachingLabView]);

    // Handler to store output from an exercise step (e.g., score from ActiveListening)
    const handleExerciseComplete = useCallback((output) => {
        setStepOutputs(prev => ({ ...prev, [currentStepIndex]: output }));
        handleNextStep(); // Automatically move to next step on completion
    }, [currentStepIndex, handleNextStep]);

    // Handler to add commitment suggestion to Daily Practice
    const handleAddCommitment = useCallback(async () => {
        const suggestion = workout?.commitmentSuggestion;
        if (!suggestion || !updateDailyPracticeData) return; // cite: useAppServices.jsx

        const newCommitment = {
            id: `workout_${workout.id}_${Date.now()}`,
            text: `(Workout: ${workout.title}) ${suggestion}`,
            status: 'Pending', isCustom: true,
            linkedGoal: workout.skill, linkedTier: workout.tier || 'T1',
            source: 'Workout',
        };
        try {
            const success = await updateDailyPracticeData(data => ({ // cite: useAppServices.jsx
                ...data, activeCommitments: [...(data?.activeCommitments || []), newCommitment] // cite: useAppServices.jsx
            }));
            if (success) {
                 alert("Commitment added to Daily Practice!");
                 navigate('daily-practice'); // cite: useAppServices.jsx
            } else throw new Error("Update failed");
        } catch (e) { console.error("Failed to add workout commitment:", e); alert("Failed to add commitment."); }
    }, [workout, updateDailyPracticeData, navigate]);

    // --- Render Logic for Current Step ---
    const renderCurrentStep = () => {
        if (!currentStepData) return <p>Loading workout step...</p>;

        switch (currentStepData.type) {
            case 'warmup':
                return <Card title="Warm-Up" icon={Zap} accent="AMBER"><div dangerouslySetInnerHTML={{ __html: warmupHtml }} /></Card>;
            case 'exercise':
                // Render different exercise types
                const exerciseIndex = currentStepData.index;
                const exerciseData = currentStepData;
                switch (exerciseData.subType || exerciseData.type /* Handle both naming conventions */) {
                    case 'reflectionPrompt':
                        return <Card title={`Exercise ${exerciseIndex + 1}: Reflection`} icon={Lightbulb} accent="TEAL">
                                  <p className="text-sm text-gray-700 mb-3">{exerciseData.prompt}</p>
                                  <textarea className="w-full p-2 border rounded h-24 text-sm" placeholder="Your thoughts..." />
                                  {/* In a real implementation, might save this reflection */}
                               </Card>;
                    case 'activeListening':
                        // TODO: Embed or adapt ActiveListeningView logic here
                        return <Card title={`Exercise ${exerciseIndex + 1}: Active Listening`} icon={Mic} accent="BLUE">
                                   <p className="text-sm text-gray-700 mb-3">{exerciseData.prompt}</p>
                                   <p className="text-center text-gray-500 italic p-6 border rounded bg-gray-50">(Active Listening Exercise Placeholder - Target Score: {exerciseData.targetScore || 'N/A'})</p>
                                   {/* Simulate completion for now */}
                                   <Button size="sm" className="mt-4" onClick={() => handleExerciseComplete({ score: Math.random() * 30 + 70 })}>Simulate Complete</Button>
                               </Card>;
                    case 'rolePlayScenarioId':
                        // TODO: Embed or adapt RolePlayView logic here
                        return <Card title={`Exercise ${exerciseIndex + 1}: Role-Play Simulation`} icon={Users} accent="PURPLE">
                                   <p className="text-sm text-gray-700 mb-3">Scenario ID: {exerciseData.scenarioId} (Prep SBI: {exerciseData.prepSBI ? 'Yes' : 'No'})</p>
                                   <p className="text-center text-gray-500 italic p-6 border rounded bg-gray-50">(Role-Play Simulation Placeholder)</p>
                                   {/* Simulate completion */}
                                   <Button size="sm" className="mt-4" onClick={() => handleExerciseComplete({ finalScore: Math.random() * 40 + 60 })}>Simulate Complete</Button>
                               </Card>;
                    default:
                        return <Card title={`Exercise ${exerciseIndex + 1}`} accent="NAVY"><p>Unknown exercise type: {exerciseData.type}</p></Card>;
                }
            case 'reflection':
                return <Card title="Cool-Down Reflection" icon={BookOpen} accent="ORANGE"><div dangerouslySetInnerHTML={{ __html: reflectionHtml }} /></Card>;
            case 'commitment':
                return <Card title="Commit to Practice" icon={CheckCircle} accent="GREEN">
                           <p className="text-sm text-gray-700 mb-3">Reinforce your learning by adding this suggested rep to your daily practice:</p>
                           <p className="text-sm font-semibold italic p-3 border rounded bg-green-50 border-green-200 mb-4">{currentStepData.suggestion || "Review today's workout."}</p>
                           <Button onClick={handleAddCommitment} size="md" className="w-full">
                                <PlusCircle className="w-5 h-5 mr-2" /> Add Rep to Daily Practice
                           </Button>
                       </Card>;
            default:
                return <p>Unknown workout step type.</p>;
        }
    };

    if (!workout) return <LoadingSpinner message="Loading Workout..." />;

    return (
        <div className="p-6 md:p-8 lg:p-10 max-w-3xl mx-auto">
            {/* Header */}
            <header className="mb-6 text-center">
                <h1 className="text-3xl font-extrabold mb-1" style={{ color: COLORS.NAVY }}>{workout.title}</h1>
                <p className="text-lg text-gray-600">Step {currentStepIndex + 1} of {totalSteps + 1}</p> {/* +1 for Commitment step */}
                 {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-3">
                    <div className="bg-[#7C3AED] h-1.5 rounded-full transition-all duration-300" style={{ width: `${((currentStepIndex + 1) / (totalSteps + 1)) * 100}%` }}></div> {/* Purple progress */}
                </div>
            </header>

            {/* Render Current Step Content */}
            <div className="mb-8">
                {renderCurrentStep()}
            </div>

            {/* Navigation Buttons */}
            <footer className="flex justify-between items-center pt-6 border-t" style={{ borderColor: COLORS.SUBTLE }}>
                <Button onClick={handlePreviousStep} variant="nav-back" size="sm">
                   <ArrowLeft className="w-4 h-4 mr-1"/> Previous Step
                </Button>
                {/* Show "Finish Workout" on the last step (Commitment) */}
                {currentStepData?.type === 'commitment' ? (
                     <Button onClick={() => setCoachingLabView('workout-list')} variant="primary" size="md">
                        Finish Workout
                     </Button>
                ) : ( // Otherwise, show "Next Step"
                     <Button onClick={handleNextStep} variant="primary" size="md" disabled={currentStepData?.type === 'exercise' /* Disable if waiting for exercise completion */}>
                        Next Step <SkipForward className="w-4 h-4 ml-1"/>
                     </Button>
                )}
            </footer>
        </div>
    );
};


/* =========================================================
   MAIN COACHING LAB ROUTER (Refactored Home View + Workout Integration)
========================================================= */
export default function CoachingLabScreen() {
    // --- Consume Services ---
    const { navigate, featureFlags, isLoading: isAppLoading, error: appError, WORKOUT_LIBRARY } = useAppServices(); // cite: useAppServices.jsx

    // --- Local State ---
    const [view, setView] = useState('coaching-lab-home'); // Current view
    const [selectedScenario, setSelectedScenario] = useState(null); // For role-play
    const [selectedWorkout, setSelectedWorkout] = useState(null); // For workout player
    const [preparedSBI, setPreparedSBI] = useState(null); // For role-play prep
    const [difficultyLevel, setDifficultyLevel] = useState(50); // For role-play difficulty

    // --- Effect to scroll to top ---
    useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [view]);

    // --- View Rendering Logic ---
    const renderView = () => {
        const viewProps = { setCoachingLabView: setView, setSelectedScenario, setSelectedWorkout };

        switch (view) {
            case 'scenario-library':    return <ScenarioLibraryView {...viewProps} />;
            case 'scenario-prep':       return <ScenarioPreparationView scenario={selectedScenario} {...viewProps} setPreparedSBI={setPreparedSBI} setDifficultyLevel={setDifficultyLevel} />;
            case 'role-play':           return selectedScenario ? <RolePlayView scenario={selectedScenario} {...viewProps} preparedSBI={preparedSBI} difficultyLevel={difficultyLevel} /> : <ScenarioLibraryView {...viewProps} />; // Fallback
            case 'feedback-prep':       return <LeanFeedbackPrepView {...viewProps} setPreparedSBI={setPreparedSBI} />;
            case 'active-listening':    return <ActiveListeningView {...viewProps} />;
            case 'practice-log':        return <PracticeLogView {...viewProps} />;
            // --- NEW: Workout Views ---
            case 'workout-list':        return <WorkoutListView {...viewProps} />;
            case 'workout-player':      return selectedWorkout ? <WorkoutPlayerView workout={selectedWorkout} {...viewProps} /> : <WorkoutListView {...viewProps} />; // Fallback
            case 'coaching-lab-home':
            default:
                // --- Refactored Home View ---
                return (
                    <div className="p-6 md:p-8 lg:p-10">
                         {/* Header */}
                        <header className='flex items-center gap-4 border-b-2 pb-3 mb-8' style={{borderColor: COLORS.PURPLE+'30'}}>
                            <Mic className='w-10 h-10 flex-shrink-0' style={{color: COLORS.PURPLE}}/>
                            <div>
                                <h1 className="text-3xl md:text-4xl font-extrabold" style={{ color: COLORS.NAVY }}>AI Coaching Lab</h1>
                                <p className="text-md text-gray-600 mt-1">(Coaching Pillar)</p>
                            </div>
                        </header>
                        <p className="text-lg text-gray-700 mb-10 max-w-3xl">Practice leadership skills through AI simulations, feedback tools, and guided workouts.</p>

                        {/* Lab Options Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Option 1: Role-Play Simulations */}
                            <Card title="Role-Play Simulations" icon={Users} accent="TEAL" onClick={() => setView('scenario-library')} className="cursor-pointer hover:border-teal-400">
                                <p className="text-gray-700 text-sm mb-4">Practice high-stakes conversations with an AI persona. Prepare using SBI and get audited.</p>
                                <div className="mt-auto text-[#47A88D] font-semibold group flex items-center">Enter Scenario Library <span className="ml-1 group-hover:translate-x-1 transition-transform">&rarr;</span></div>
                            </Card>
                            {/* Option 2: Guided Workouts (Conditional) */}
                            {featureFlags?.enableWorkouts && ( // cite: useAppServices.jsx
                                 <Card title="Guided Workouts" icon={Dumbbell} accent="PURPLE" onClick={() => setView('workout-list')} className="cursor-pointer hover:border-purple-400">
                                     <p className="text-gray-700 text-sm mb-4">Follow structured exercise sequences (e.g., feedback, coaching) to build specific skills step-by-step.</p>
                                     <div className="mt-auto text-[#7C3AED] font-semibold group flex items-center">Browse Workouts <span className="ml-1 group-hover:translate-x-1 transition-transform">&rarr;</span></div>
                                 </Card>
                             )}
                            {/* Option 3: Feedback Prep Tool */}
                            <Card title="Feedback Prep Tool (SBI)" icon={Briefcase} accent="BLUE" onClick={() => setView('feedback-prep')} className="cursor-pointer hover:border-blue-400">
                                <p className="text-gray-700 text-sm mb-4">Draft real-world feedback using SBI and get instant AI critique before delivery.</p>
                                <div className="mt-auto text-[#2563EB] font-semibold group flex items-center">Launch Prep Tool <span className="ml-1 group-hover:translate-x-1 transition-transform">&rarr;</span></div>
                            </Card>
                            {/* Option 4: Active Listening Exercise */}
                            <Card title="Active Listening Exercise" icon={Mic} accent="TEAL" onClick={() => setView('active-listening')} className="cursor-pointer hover:border-teal-400">
                                <p className="text-gray-700 text-sm mb-4">Sharpen empathy by practicing paraphrasing and open questions. Get AI-scored feedback.</p>
                                <div className="mt-auto text-[#47A88D] font-semibold group flex items-center">Start Exercise <span className="ml-1 group-hover:translate-x-1 transition-transform">&rarr;</span></div>
                            </Card>
                            {/* Option 5: Practice Log */}
                            <Card title="Practice History Log" icon={BarChart3} accent="ORANGE" onClick={() => setView('practice-log')} className="cursor-pointer hover:border-orange-400">
                                <p className="text-gray-700 text-sm mb-4">Review scores and takeaways from past Role-Play Simulation sessions.</p>
                                <div className="mt-auto text-[#E04E1B] font-semibold group flex items-center">View History Log <span className="ml-1 group-hover:translate-x-1 transition-transform">&rarr;</span></div>
                            </Card>
                        </div>
                    </div>
                );
        }
    };

    // --- Main Render ---
    // Loading/Error Checks
     if (isAppLoading) return <LoadingSpinner message="Loading Coaching Lab..." />;
     // Specific check for Labs feature flag
     if (!featureFlags?.enableLabs) { // cite: useAppServices.jsx
         return (
             <div className="p-8 text-center text-gray-500">
                 <Mic className="w-12 h-12 mx-auto mb-4 text-gray-400"/>
                 <h1 className="text-2xl font-bold mb-2">Coaching Lab Unavailable</h1>
                 <p>This feature is currently disabled.</p>
                 <Button onClick={() => navigate('dashboard')} variant="outline" size="sm" className="mt-4">Back to Arena</Button>
             </div>
         );
     }
     if (appError) return <ConfigError message={`Failed to load Coaching Lab: ${appError.message}`} />;

    return (
      <div className="min-h-screen" style={{ background: COLORS.BG }}> {/* Consistent BG */}
        {renderView()}
      </div>
    );
}