// src/components/screens/QuickStartAccelerator.jsx (Refactored for Consistency, Context)

import React, { useState, useEffect, useMemo, useCallback } from 'react';
// --- Core Services & Context ---
import { useAppServices } from '../../services/useAppServices.jsx'; // cite: useAppServices.jsx

// --- Icons ---
import {
  Zap, ShieldCheck, ArrowLeft, Target, Briefcase, Clock, Users, CornerRightUp, X, Activity, Cpu, Eye,
  CheckCircle, AlertTriangle, Lightbulb, BookOpen, Loader // Added Loader
} from 'lucide-react';

/* =========================================================
   PALETTE & UI COMPONENTS (Standardized)
========================================================= */
// --- Primary Color Palette ---
const COLORS = { NAVY: '#002E47', TEAL: '#47A88D', BLUE: '#002E47', ORANGE: '#E04E1B', GREEN: '#47A88D', AMBER: '#E04E1B', RED: '#E04E1B', LIGHT_GRAY: '#FCFCFA', OFF_WHITE: '#FFFFFF', SUBTLE: '#E5E7EB', TEXT: '#374151', MUTED: '#4B5355', PURPLE: '#47A88D', BG: '#F9FAFB' }; // cite: App.jsx

// --- Standardized UI Components (Matches Dashboard/Dev Plan) ---
const Button = ({ children, onClick, disabled = false, variant = 'primary', className = '', size = 'md', ...rest }) => { /* ... Re-use exact Button definition from Dashboard.jsx ... */
    let baseStyle = `inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed`;
    if (size === 'sm') baseStyle += ' px-4 py-2 text-sm'; else if (size === 'lg') baseStyle += ' px-8 py-4 text-lg'; else baseStyle += ' px-6 py-3 text-base'; // Default 'md'
    if (variant === 'primary') baseStyle += ` bg-[${COLORS.TEAL}] text-white shadow-lg hover:bg-[#47A88D] focus:ring-[${COLORS.TEAL}]/50`;
    else if (variant === 'secondary') baseStyle += ` bg-[${COLORS.ORANGE}] text-white shadow-lg hover:bg-[#C312] focus:ring-[${COLORS.ORANGE}]/50`;
    else if (variant === 'outline') baseStyle += ` bg-[${COLORS.OFF_WHITE}] text-[${COLORS.TEAL}] border-2 border-[${COLORS.TEAL}] shadow-md hover:bg-[${COLORS.TEAL}]/10 focus:ring-[${COLORS.TEAL}]/50`;
    else if (variant === 'nav-back') baseStyle += ` bg-white text-gray-700 border border-gray-300 shadow-sm hover:bg-gray-100 focus:ring-gray-300/50 px-4 py-2 text-sm`;
    else if (variant === 'ghost') baseStyle += ` bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-300/50 px-3 py-1.5 text-sm`;
    if (disabled) baseStyle += ' bg-gray-300 text-gray-500 shadow-inner border-transparent hover:bg-gray-300';
    return (<button {...rest} onClick={onClick} disabled={disabled} className={`${baseStyle} ${className}`}>{children}</button>);
};
const Card = ({ children, title, icon: Icon, className = '', onClick, accent = 'NAVY' }) => { /* ... Re-use exact Card definition from Dashboard.jsx ... */
    const interactive = !!onClick; const Tag = interactive ? 'button' : 'div'; const accentColor = COLORS[accent] || COLORS.NAVY; const handleKeyDown = (e) => { if (interactive && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onClick?.(); } };
    return (
        <Tag {...(interactive ? { type: 'button' } : {})} role={interactive ? 'button' : undefined} tabIndex={interactive ? 0 : undefined} onKeyDown={handleKeyDown} className={`relative p-6 rounded-2xl border-2 shadow-xl hover:shadow-lg transition-all duration-300 text-left ${className}`} style={{ background: 'linear-gradient(180deg,#FFFFFF, #FCFCFA)', borderColor: COLORS.SUBTLE, color: COLORS.NAVY }} onClick={onClick}>
            <span style={{ position:'absolute', top:0, left:0, right:0, height:6, background: accentColor, borderTopLeftRadius:14, borderTopRightRadius:14 }} />
            {Icon && title && ( <div className="flex items-center gap-3 mb-4"> <div className="w-10 h-10 rounded-lg flex items-center justify-center border flex-shrink-0" style={{ borderColor: COLORS.SUBTLE, background: COLORS.LIGHT_GRAY }}> <Icon className="w-5 h-5" style={{ color: accentColor }} /> </div> <h2 className="text-xl font-extrabold" style={{ color: COLORS.NAVY }}>{title}</h2> </div> )}
            {!Icon && title && <h2 className="text-xl font-extrabold mb-4 border-b pb-2" style={{ color: COLORS.NAVY, borderColor: COLORS.SUBTLE }}>{title}</h2>}
            <div className={Icon || title ? '' : ''}>{children}</div>
        </Tag>
    );
};
const LoadingSpinner = ({ message = "Loading..." }) => ( /* ... Re-use definition from DevelopmentPlan.jsx ... */
    <div className="min-h-[200px] flex items-center justify-center" style={{ background: COLORS.BG }}> <div className="flex flex-col items-center"> <Loader className="animate-spin h-12 w-12 mb-3" style={{ color: COLORS.TEAL }} /> <p className="font-semibold" style={{ color: COLORS.NAVY }}>{message}</p> </div> </div>
);

/* =========================================================
   UTILITIES (Local or Shared)
========================================================= */
// Markdown to HTML converter (Simplified version)
const mdToHtml = async (md) => { /* ... Re-use definition from Labs.jsx ... */
    if (!md) return ''; let html = md;
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-extrabold text-[#002E47] border-b border-gray-200 pb-2 mb-3 mt-5">$1</h2>');
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold text-[#47A88D] mt-4 mb-2">$1</h3>');
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong class="font-semibold">$1</strong>');
    html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\s*)+/g, (match) => `<ul class="list-disc list-inside space-y-1 mb-4 pl-4">${match.trim()}</ul>`);
    html = html.split('\n').map(line => { line = line.trim(); if (!line || line.startsWith('<h') || line.startsWith('<ul') || line.startsWith('<li') || line === '</ul>') return line; return `<p class="text-sm text-gray-700 mb-2">${line}</p>`; }).join('');
    html = html.replace(/<p><\/p>/g, '');
    return `<div class="prose prose-sm max-w-none">${html}</div>`;
};

// --- Mock LIS Critique (Fallback if API fails or key missing) ---
const LIS_MOCK_CRITIQUE = `## Leadership Identity Audit Score: 75/100

### Clarity and Specificity
**Critique:** Your draft uses somewhat passive language ("tries to do the right thing"). Aim for measurable actions.

### Action/Behavior Focus
**Critique:** Focus on *what you do* ("I lead by...") rather than just beliefs ("I believe in...").

### Aspirational Rigor
**Critique:** The statement describes competency, not necessarily excellence. Aim higher.

**Refined LIS Example:**
"I am a **dedicated anchor** who cultivates execution by maintaining **radical transparency**, and **I grow trust** by actively seeking and acting on constructive criticism."`;


/* =========================================================
   LISAuditorView Component (Refactored)
   - Allows users to draft and get AI critique on their Leadership Identity Statement.
========================================================= */
const LISAuditorView = ({ setQuickStartView }) => {
    // --- Consume Services ---
            const { callSecureGeminiAPI, hasGeminiKey } = useAppServices(); // cite: useAppServices.jsx

    // --- Local State ---
    const [lisDraft, setLisDraft] = useState('I am a dedicated leader who always tries to do the right thing for my team and my company. I believe in hard work.'); // Initial example draft
    const [isGenerating, setIsGenerating] = useState(false); // Loading state for AI critique
    const [critique, setCritique] = useState(''); // Raw markdown critique from AI
    const [critiqueHtml, setCritiqueHtml] = useState(''); // Rendered HTML critique

    // --- Effect to convert critique markdown to HTML ---
    useEffect(() => {
        if (!critique) { setCritiqueHtml(''); return; }
        (async () => setCritiqueHtml(await mdToHtml(critique)))();
    }, [critique]);

    // --- Handler to generate AI critique ---
    const generateCritique = useCallback(async () => {
        const draft = lisDraft.trim();
        if (!draft) { alert("Please provide your LIS draft first."); return; }

        setIsGenerating(true);
        setCritique(''); // Clear previous critique
        setCritiqueHtml('');

        // --- Use Mock Critique if API Key is missing ---
        if (!hasGeminiKey()) {
             console.warn("[LISAuditor] API Key missing. Using mock critique.");
             setCritique(LIS_MOCK_CRITIQUE); // Set mock data
             setIsGenerating(false);
             return;
        }

        // --- Prepare AI Prompt ---
        const systemPrompt = `You are an expert executive coach specializing in Leadership Identity Statements (LIS). Critique the user's LIS draft based on:
            1.  **Clarity & Specificity**: Is it concise and unambiguous?
            2.  **Action/Behavior Focus**: Does it define *actions* or just beliefs/traits?
            3.  **Aspirational Rigor**: Does it set a high, challenging standard?
            Respond ONLY with structured Markdown:
            ## Leadership Identity Audit Score: [Score]/100
            ### Clarity and Specificity \n **Critique:** [Your analysis]
            ### Action/Behavior Focus \n **Critique:** [Your analysis]
            ### Aspirational Rigor \n **Critique:** [Your analysis]
            **Refined LIS Example:** \n "[Concise, actionable example based on user's core ideas]"`;
        const userQuery = `Critique this LIS draft:\n\n"${draft}"`;

        try {
            // --- Call AI API ---
            const payload = {
                contents: [{ role: "user", parts: [{ text: userQuery }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
                model: 'gemini-1.5-flash', // Use flash model for faster critique // cite: QuickStartAccelerator.jsx (Original Logic)
            };
            const result = await callSecureGeminiAPI(payload); // cite: useAppServices.jsx
            const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;

            // --- Set Result ---
            setCritique(text || "Critique generation failed: No response from AI.");

        } catch (error) {
            console.error("[LISAuditor] AI Critique Error:", error);
            setCritique(`## Critique Error\n\nFailed to get AI feedback: ${error.message}`);
        } finally {
            setIsGenerating(false); // Reset loading state
        }
    }, [lisDraft, hasGeminiKey, callSecureGeminiAPI]); // Dependencies

    return (
        // Consistent page structure and padding
        <div className="p-6 md:p-4 sm:p-3 sm:p-4 lg:p-6 lg:p-8 lg:p-10 min-h-screen" style={{ background: COLORS.BG }}>
            {/* Header */}
            <header className='flex items-center gap-4 border-b-2 pb-3 mb-8' style={{borderColor: COLORS.NAVY+'30'}}>
                <ShieldCheck className='w-10 h-10 flex-shrink-0' style={{color: COLORS.NAVY}}/>
                <div>
                    <h1 className="text-xl sm:text-2xl sm:text-3xl md:text-4xl font-extrabold" style={{ color: COLORS.NAVY }}>Leadership Identity Statement (LIS) Auditor</h1>
                    <p className="text-md text-gray-600 mt-1">Refine your core leadership foundation.</p>
                </div>
            </header>
            <p className="text-lg text-gray-700 mb-6 max-w-3xl">Your LIS defines who you are at your best. Use the AI Rep Coach to ensure it's specific, actionable, and aligned.</p>

            {/* Back Button */}
            <Button onClick={() => setQuickStartView('quick-start-home')} variant="nav-back" className="mb-8">
                <ArrowLeft className="w-5 h-5 mr-2" /> Back to QuickStart Program
            </Button>

            {/* Main Content Grid */}
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8'>
                {/* Left Column: LIS Input */}
                <Card title="1. Draft Your Leadership Identity Statement" icon={ShieldCheck} accent='NAVY'>
                    <p className="text-gray-700 text-sm mb-4">Define who you are when leading at your best. Focus on actions and values.</p>
                    {/* LIS Input Textarea */}
                    <textarea
                        value={lisDraft}
                        onChange={(e) => setLisDraft(e.target.value)}
                        className="w-full p-3 mt-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#47A88D] h-32 text-sm" // Teal focus
                        placeholder="e.g., 'I build high-trust teams by modeling vulnerability and consistently delivering on commitments.'"
                        aria-label="Leadership Identity Statement Draft"
                    />
                    {/* Audit Button */}
                    <Button
                        onClick={generateCritique}
                        disabled={isGenerating || !lisDraft.trim()}
                        size="md" className="w-full mt-6"
                        variant="secondary" // Use Orange button
                    >
                        {isGenerating ? <Loader className="w-5 h-5 mr-2 animate-spin"/> : <Cpu className='w-5 h-5 mr-2' />}
                        {isGenerating ? 'Auditing Identity...' : 'Run LIS Audit with AI Rep Coach'}
                    </Button>
                     {!hasGeminiKey() && <p className="text-xs text-red-500 mt-2 text-center">API Key missing. Using mock critique.</p>}
                </Card>

                {/* Right Column: AI Critique Output */}
                <div className='lg:sticky lg:top-6'> {/* Make critique sticky */}
                    {isGenerating ? ( // Show loading spinner within Card
                        <Card title="AI Rep Coach Critique" icon={Cpu} accent='TEAL'>
                            <LoadingSpinner message="Analyzing your LIS..." />
                        </Card>
                    ) : critiqueHtml ? ( // Show critique if available
                        <Card title="AI Rep Coach Critique" icon={Cpu} accent='TEAL'>
                            <div dangerouslySetInnerHTML={{ __html: critiqueHtml }} />
                        </Card>
                    ) : ( // Placeholder if no critique yet
                        <Card title="AI Rep Coach Critique" icon={Cpu} accent='TEAL' className="border-dashed border-gray-300 bg-gray-50 text-center">
                            <p className="text-sm text-gray-500 italic py-8">Complete Step 1 and click "Run LIS Audit" to get feedback here.</p>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};


/* =========================================================
   QuickStart Accelerator MAIN ROUTER (Refactored Home View)
========================================================= */
const QuickStartAcceleratorScreen = () => {
    // --- Consume Services ---
    const { isLoading: isAppLoading, error: appError } = useAppServices(); // cite: useAppServices.jsx

    // --- Local State ---
    const [view, setQuickStartView] = useState('quick-start-home'); // Controls view: 'home' or 'lis-auditor'

    // --- Effect to scroll to top on mount ---
    useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, []);

    // --- Core Sessions Data (Could be moved to global metadata: COURSE_LIBRARY?) ---
    // Using local data as defined in the original file
    const sessions = useMemo(() => [ // cite: QuickStartAccelerator.jsx (Original Logic)
        { id: 1, title: 'Delivering Effective Feedback', focus: 'CLEAR Framework & The Magic Ratio (5:1)', keyRationale: 'Feedback is the currency of growth. Master objectivity (SBI) and ensure positive reinforcement outweighs correction to build a high-trust team environment.', preWork: ['Watch Session 1 Prep Video', 'Complete Pre-Session Exercises', 'Complete Workout Prep'] },
        { id: 2, title: 'Anchoring Feedback with Identity', focus: 'Leadership Identity Statement (LIS) & Anchored Feedback', keyRationale: 'Your LIS is your North Star. Grounding every action and conversation in your core values ensures integrity and makes your leadership predictable and trustworthy.', preWork: ['Watch Session 2 Prep Video', 'Complete Admired Leaders Exercise', 'Draft LIS (Use LIS Auditor Tool!)'] }, // Updated preWork
        { id: 3, title: 'Coaching One-on-One (1:1)', focus: '1:1 Structure, Direct-Led Agenda, and Coaching for Growth', keyRationale: 'Effective 1:1s are the most high-leverage time you spend. Shift from status updates to future-focused coaching and actively listening to employee challenges.', preWork: ['Sign up for 1:1 with Trainer', 'Review 1:1 Notes & Topics', 'Prepare for Personalized Coaching Session'] },
        { id: 4, title: 'Building Vulnerability-Based Trust', focus: 'Trust Fundamentals, 1:1 Habit, and Leading with Vulnerability', keyRationale: 'Trust is the foundation for speed and psychological safety. Learn to lead by modeling vulnerability and commitment, creating space for the team to take risks and admit mistakes.', preWork: ['Watch Session 4 Prep Video', 'Complete Pre-Session Exercises', 'Complete Reflections'] },
    ], []);

    // --- View Rendering Logic ---
    const renderView = () => {
        switch(view) {
            case 'lis-auditor':
                return <LISAuditorView setQuickStartView={setQuickStartView} />;
            case 'quick-start-home':
            default:
                // --- Refactored Home View ---
                return (
                    // Consistent page structure and padding
                    <div className="p-6 md:p-4 sm:p-3 sm:p-4 lg:p-6 lg:p-8 lg:p-10">
                        {/* Header */}
                        <header className='flex items-center gap-4 border-b-2 pb-3 mb-8' style={{borderColor: COLORS.ORANGE+'30'}}> {/* Use ORANGE accent */}
                            <Zap className='w-10 h-10 flex-shrink-0' style={{color: COLORS.ORANGE}}/>
                            <div>
                                <h1 className="text-xl sm:text-2xl sm:text-3xl md:text-4xl font-extrabold" style={{ color: COLORS.NAVY }}>QuickStart Program</h1>
                                <p className="text-md text-gray-600 mt-1">(Core Pillar)</p>
                            </div>
                        </header>
                        <p className="text-lg text-gray-700 mb-10 max-w-3xl">The foundational 4-session accelerator for the LeaderReps methodology. Review sessions, focus areas, and pre-work requirements.</p>

                        {/* Link to LIS Auditor Tool (Highlighted Card) */}
                        <Card title="Tool: Leadership Identity Statement (LIS) Auditor" icon={ShieldCheck} accent="TEAL" className="mb-8 cursor-pointer hover:border-teal-400" onClick={() => setQuickStartView('lis-auditor')}>
                            <p className='text-gray-700 text-sm'>Draft and refine your core leadership statement using AI critique. **Crucial pre-work for Session 2.**</p>
                            <div className="mt-4 text-[#47A88D] font-semibold flex items-center group">
                                Launch LIS Auditor <span className="inline-block transition-transform group-hover:translate-x-1 ml-1">&rarr;</span>
                            </div>
                        </Card>

                        {/* Session Cards */}
                        <h2 className='text-2xl font-bold mb-4 mt-10 border-b pb-1' style={{ color: COLORS.NAVY, borderColor: COLORS.SUBTLE }}>Program Sessions</h2>
                        <div className="space-y-4 sm:space-y-5 lg:space-y-6">
                            {sessions.map(session => (
                                // Use standard Card for each session
                                <Card key={session.id} title={`Session ${session.id}: ${session.title}`} icon={BookOpen} accent="NAVY">
                                    {/* Why it Matters */}
                                    <details className="mb-4 group">
                                        <summary className="text-sm font-semibold cursor-pointer list-none flex items-center gap-1" style={{ color: COLORS.NAVY }}>
                                            <Lightbulb className="w-4 h-4 text-amber-500"/> Why This Session Matters
                                            <span className="text-xs text-gray-400 group-open:rotate-90 transition-transform">▶</span>
                                        </summary>
                                        <blockquote className="mt-2 border-l-4 pl-4 py-1 text-sm italic text-gray-600" style={{ borderColor: COLORS.TEAL }}>
                                            {session.keyRationale}
                                        </blockquote>
                                    </details>

                                    {/* Grid for Focus & Pre-Work */}
                                    <div className="grid md:grid-cols-2 gap-4 pt-4 border-t" style={{ borderColor: COLORS.SUBTLE }}>
                                        {/* Core Focus */}
                                        <div>
                                            <h3 className="text-md font-semibold mb-2 flex items-center gap-1.5" style={{ color: COLORS.TEAL }}><Target className='w-4 h-4'/> Core Focus</h3>
                                            <p className="text-gray-700 text-sm">{session.focus}</p>
                                        </div>
                                        {/* Pre-Work */}
                                        <div>
                                            <h3 className="text-md font-semibold mb-2 flex items-center gap-1.5" style={{ color: COLORS.ORANGE }}><Clock className='w-4 h-4'/> Pre-Work Checklist</h3>
                                            <ul className="list-disc pl-5 text-gray-700 space-y-1 text-sm">
                                                {session.preWork.map((item, index) => (
                                                    <li key={index}>{item}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                );
        }
    };

    // --- Main Render ---
    // Feature Flag Check (Example)
    // if (!featureFlags?.enableQuickStart) { // cite: useAppServices.jsx
    //     return ( /* ... Render disabled message ... */ );
    // }

    // Loading/Error Checks
    if (isAppLoading) return <LoadingSpinner message="Loading QuickStart Program..." />;
    if (appError) return <ConfigError message={`Failed to load QuickStart Program: ${appError.message}`} />;

    return (
      <div className="min-h-screen" style={{ background: COLORS.BG }}> {/* Consistent BG */}
        {renderView()}
      </div>
    );
};

// Error component for configuration or loading issues
const ConfigError = ({ message }) => (
    <div className="min-h-[200px] flex items-center justify-center bg-red-50 p-4">
        <div className="flex flex-col items-center text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mb-3" />
            <h2 className="text-xl font-bold text-red-800">Configuration Error</h2>
            <p className="text-red-600 mt-1">{message}</p>
        </div>
    </div>
);

export default QuickStartAcceleratorScreen;