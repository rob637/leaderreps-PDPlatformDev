//  src/components/screens/QuickStartAccelerator.jsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Zap, ShieldCheck, ArrowLeft, Target, Briefcase, Clock, Users, CornerRightUp, X, Activity, Cpu, Eye, CheckCircle, AlertTriangle, Lightbulb, MessageSquare, HeartPulse, TrendingUp
} from 'lucide-react';
// FIX: Mocking the useAppServices hook structure for local execution
const useAppServices = () => ({
    hasGeminiKey: () => true,
    callSecureGeminiAPI: async (payload) => {
        // Mock response for LIS Auditor
        return { candidates: [{ content: { parts: [{ text: LIS_MOCK_CRITIQUE }] } }] };
    },
    navigate: (view) => console.log(`Navigating to ${view}`),
});

/* =========================================================
   HIGH-CONTRAST PALETTE (Centralized for Consistency)
========================================================= */
const COLORS = {
  BG: '#FFFFFF',
  SURFACE: '#FFFFFF',
  BORDER: '#1F2937',
  SUBTLE: '#E5E7EB',
  TEXT: '#0F172A',
  MUTED: '#4B5563',
  NAVY: '#0B3B5B', // Deep Navy
  TEAL: '#219E8B', // Leadership Teal
  BLUE: '#2563EB',
  ORANGE: '#E04E1B', // High-Impact Orange
  GREEN: '#10B981',
  AMBER: '#F59E0B',
  RED: '#EF4444',
  LIGHT_GRAY: '#FCFCFA'
};

// Mock UI components (Standardized)
const Button = ({ children, onClick, disabled = false, variant = 'primary', className = '', ...rest }) => {
  let baseStyle = "px-6 py-3 rounded-xl font-semibold transition-all shadow-xl focus:outline-none focus:ring-4 text-white flex items-center justify-center";
  if (variant === 'primary') { baseStyle += ` bg-[${COLORS.TEAL}] hover:bg-[#1C8D7C] focus:ring-[${COLORS.TEAL}]/50`; }
  else if (variant === 'secondary') { baseStyle += ` bg-[${COLORS.ORANGE}] hover:bg-red-700 focus:ring-[${COLORS.ORANGE}]/50`; }
  else if (variant === 'outline') { baseStyle = `px-6 py-3 rounded-xl font-semibold transition-all shadow-md border-2 border-[${COLORS.TEAL}] text-[${COLORS.TEAL}] hover:bg-[${COLORS.TEAL}]/10 focus:ring-4 focus:ring-[${COLORS.TEAL}]/50 bg-[${COLORS.LIGHT_GRAY}] flex items-center justify-center`; }
  else if (variant === 'nav-back') { baseStyle = `px-4 py-2 rounded-lg font-medium transition-all shadow-sm border-2 border-gray-300 text-gray-700 hover:bg-gray-100 flex items-center justify-center`; }
  if (disabled) { baseStyle = "px-6 py-3 rounded-xl font-semibold bg-gray-300 text-gray-500 cursor-not-allowed shadow-inner transition-none flex items-center justify-center"; }
  return (
    <button {...rest} onClick={onClick} disabled={disabled} className={`${baseStyle} ${className}`}>
      {children}
    </button>
  );
};

const Card = ({ children, title, icon: Icon, className = '', onClick, accent = 'NAVY' }) => {
  const interactive = !!onClick;
  const Tag = interactive ? 'button' : 'div';
  const accentColor = COLORS[accent] || COLORS.NAVY;
  const handleKeyDown = (e) => {
    if (!interactive) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };
  return (
    <Tag
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={handleKeyDown}
      className={`relative p-6 rounded-2xl border-2 shadow-xl hover:shadow-2xl transition-all duration-300 text-left ${className}`}
      style={{ background: 'linear-gradient(180deg,#FFFFFF,#F9FAFB)', borderColor: COLORS.SUBTLE, color: COLORS.TEXT }}
      onClick={onClick}
    >
      <span style={{ position:'absolute', top:0, left:0, right:0, height:6, background: accentColor, borderTopLeftRadius:14, borderTopRightRadius:14 }} />

      {Icon && (
        <div className="w-10 h-10 rounded-lg flex items-center justify-center border mb-3" style={{ borderColor: COLORS.SUBTLE, background: '#F3F4F6' }}>
          <Icon className="w-5 h-5" style={{ color: COLORS.TEAL }} />
        </div>
      )}
      {title && <h2 className="text-xl font-extrabold mb-2" style={{ color: COLORS.NAVY }}>{title}</h2>}
      {children}
    </Tag>
  );
};

// --- MOCK UTILITIES (Replicated for component self-reliance) ---
async function mdToHtml(md) {
    let html = md;
    html = html.replace(/## (.*$)/gim, '<h2 class="text-2xl font-bold text-[#0B3B5B] border-b pb-1 mb-3 mt-6">$1</h2>');
    html = html.replace(/### (.*$)/gim, '<h3 class="text-lg font-extrabold text-[#219E8B] mt-4 mb-2">$1</h3>');
    html = html.replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>');
    html = html.replace(/\n\n/g, '</p><p class="text-gray-700 text-sm mt-2">');
    html = html.replace(/\* (.*)/gim, '<li class="text-sm text-gray-700">$1</li>');
    html = html.replace(/<li>/g, '<ul class="list-disc list-inside space-y-1"><li>').replace(/<\/li>(?!<ul>)/g, '</li></ul>');
    return `<div class="prose max-w-none text-gray-700">${html}</div>`;
}
// --- END MOCK UTILITIES ---

const LIS_MOCK_CRITIQUE = `## Leadership Identity Audit Score: 75/100

### Clarity and Specificity
**Critique:** Your draft is a good start but uses passive, subjective language ("always tries to do the right thing"). This makes it hard to measure. A stronger statement is built on measurable actions.

### Action/Behavior Focus
**Critique:** The phrase "I believe in hard work" is a passive belief. An actionable LIS must define a behavior, e.g., "I lead by modeling transparent accountability."

### Aspirational Rigor
**Critique:** The statement lacks a high, challenging standard. It defines competency rather than excellence.

**Refined LIS Example:**
"I am a **dedicated anchor** who cultivates high-speed execution by maintaining **radical transparency** in all decisions, and **I grow trust** by actively seeking and acting on constructive criticism."`;


/* =========================================================
   LISAuditorView (Step-by-Step LIS Creation)
========================================================= */
const LISAuditorView = ({ setQuickStartView }) => {
    // FIX: Call hook inside component
    const { hasGeminiKey, callSecureGeminiAPI } = useAppServices();
    
    // Initial draft from the source file
    const [lisDraft, setLisDraft] = useState('I am a dedicated leader who always tries to do the right thing for my team and my company. I believe in hard work.');
    const [isGenerating, setIsGenerating] = useState(false);
    const [critique, setCritique] = useState('');
    const [critiqueHtml, setCritiqueHtml] = useState('');

    useEffect(() => {
        if (!critique) { setCritiqueHtml(''); return; }
        (async () => setCritiqueHtml(await mdToHtml(critique)))();
    }, [critique]);

    const generateCritique = async () => {
        if (!lisDraft.trim()) { alert("Please provide your Leadership Identity Statement draft first."); return; }

        setIsGenerating(true);
        setCritique('');

        // Mock API logic if key is missing
        if (!hasGeminiKey()) { 
             setCritique(LIS_MOCK_CRITIQUE); 
             setIsGenerating(false);
             return;
        }

        const systemPrompt = "You are an elite executive coach specializing in Leadership Identity Statement (LIS) development. Your task is to critique the user's LIS draft based on clarity, actionability, and aspirational alignment. Your critique must be polite, structured using Markdown, and focus on: 1) **Clarity and Specificity**: Is the language vague or highly specific? 2) **Action/Behavior Focus**: Does it focus on *what they do* (actionable) or just *what they believe* (passive)? 3) **Aspirational Rigor**: Does it set a high, measurable standard for their leadership? Conclude with a refined, concise LIS example using the core values from the user's draft.";
        const userQuery = `Critique this Leadership Identity Statement draft:\n\n${lisDraft}`;

        try {
            const payload = {
                contents: [{ role: "user", parts: [{ text: userQuery }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
            };

            const result = await callSecureGeminiAPI(payload);
            const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
            setCritique(text || "Critique generation failed.");
        } catch (error) {
            console.error("Gemini API Error:", error);
            setCritique("An error occurred while connecting to the AI coach.");
        } finally {
            setIsGenerating(false);
        }
    };
    
    return (
        <div className="p-8">
            <h1 className="text-3xl font-extrabold text-[#0B3B5B] mb-4">Leadership Identity Statement (LIS) Auditor</h1>
            <p className="text-lg text-gray-600 mb-6 max-w-3xl">Your LIS is the foundation of your leadership. Get expert feedback to ensure your statement is specific, actionable, and truly aligned with your highest self.</p>
            <Button onClick={() => setQuickStartView('quick-start-home')} variant='nav-back' className="mb-8">
                <ArrowLeft className="w-5 h-5 mr-2 inline" /> Back to QuickStart
            </Button>

            <div className='lg:grid lg:grid-cols-2 gap-8'>
                <Card title="Draft Your Leadership Identity Statement" icon={ShieldCheck} accent='NAVY' className='border-l-4 border-[#0B3B5B]'>
                    <p className="text-gray-700 text-sm mb-2">Write your LIS below. It should define who you are when you're leading at your absolute best.</p>
                    <textarea 
                        value={lisDraft} 
                        onChange={(e) => setLisDraft(e.target.value)} 
                        className="w-full p-3 mt-4 border border-gray-300 rounded-xl focus:ring-[#219E8B] focus:border-[#219E8B] h-32" 
                        placeholder="e.g., 'I am a visionary, transparent, and challenging leader who cultivates trust by owning failures and rewarding courageous feedback.'"
                    ></textarea>
                    
                    <Button 
                        onClick={generateCritique} 
                        disabled={isGenerating || !lisDraft.trim()} 
                        className="mt-4 w-full bg-[#0B3B5B] hover:bg-gray-700"
                        accent='NAVY'
                    >
                        {isGenerating ? (
                            <span className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                Auditing Identity...
                            </span>
                        ) : 'Run LIS Audit'}
                    </Button>
                    {critiqueHtml && (
                        <button className='w-full text-center text-sm font-semibold mt-3 hover:underline' style={{ color: COLORS.TEAL }} onClick={() => setQuickStartView('lis-auditor-critique')}>
                            View Full Critique &rarr;
                        </button>
                    )}
                </Card>

                {/* Critique Preview */}
                {critiqueHtml && (
                    <Card title="AI Coach Preview" icon={Cpu} accent='TEAL' className='border-l-4 border-[#219E8B]'>
                        <div className="prose max-w-none prose-h3:text-[#219E8B] prose-p:text-gray-700 prose-ul:space-y-2">
                             <div dangerouslySetInnerHTML={{ __html: critiqueHtml }} />
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
};


/* =========================================================
   QuickStart Accelerator MAIN ROUTER
========================================================= */
const QuickStartAcceleratorScreen = () => {
    const [view, setQuickStartView] = useState('quick-start-home');
    const { navigate } = useAppServices();
    
    // Core Sessions data (from original backup.txt logic)
    const sessions = [
        { id: 1, title: 'Delivering Effective Feedback', focus: 'CLEAR Framework & The Magic Ratio (5:1)', keyRationale: 'Feedback is the currency of growth. Master objectivity (SBI) and ensure positive reinforcement outweighs correction to build a high-trust team environment.', preWork: ['Watch Session 1 Prep Video', 'Complete Pre-Session Exercises', 'Complete Workout Prep'] },
        { id: 2, title: 'Anchoring Feedback with Identity', focus: 'Leadership Identity Statement (LIS) & Anchored Feedback', keyRationale: 'Your LIS is your North Star. Grounding every action and conversation in your core values ensures integrity and makes your leadership predictable and trustworthy.', preWork: ['Watch Session 2 Prep Video', 'Complete Admired Leaders Exercise', 'Draft LIS'] },
        { id: 3, title: 'Coaching One-on-One (1:1)', focus: '1:1 Structure, Direct-Led Agenda, and Coaching for Growth', keyRationale: 'Effective 1:1s are the most high-leverage time you spend. Shift from status updates to future-focused coaching and actively listening to employee challenges.', preWork: ['Sign up for 1:1 with Trainer', 'Review 1:1 Notes & Topics', 'Prepare for Personalized Coaching Session'] },
        { id: 4, title: 'Building Vulnerability-Based Trust', focus: 'Trust Fundamentals, 1:1 Habit, and Leading with Vulnerability', keyRationale: 'Trust is the foundation for speed and psychological safety. Learn to lead by modeling vulnerability and commitment, creating space for the team to take risks and admit mistakes.', preWork: ['Watch Session 4 Prep Video', 'Complete Pre-Session Exercises', 'Complete Reflections'] },
    ];

    const renderView = () => {
        switch(view) {
            case 'lis-auditor':
                return <LISAuditorView setQuickStartView={setQuickStartView} />;
            case 'quick-start-home':
            default:
                return (
                    <div className="p-8">
                        <h1 className="text-3xl font-extrabold text-[#0B3B5B] mb-6">4-Session QuickStart Program</h1>
                        <p className="text-lg text-gray-600 mb-8 max-w-2xl">This program is the foundational accelerator for the LeaderReps methodology. Review the sessions, core focus, and pre-work below.</p>

                        <Card 
                            title="Draft & Refine Your Leadership Identity"
                            icon={ShieldCheck}
                            accent='TEAL'
                            onClick={() => setQuickStartView('lis-auditor')}
                            className='mb-8 border-4 border-[#219E8B]'
                            style={{ background: COLORS.TEAL + '1A' }}
                        >
                            <p className='text-gray-700 text-sm mt-2'>Access the **LIS Auditor** to receive expert critique on your personal leadership foundation statement. This is crucial for Session 2 pre-work!</p>
                            <div className="mt-4 font-semibold flex items-center" style={{ color: COLORS.NAVY }}>
                                Launch LIS Auditor &rarr;
                            </div>
                        </Card>

                        <div className="space-y-6">
                            {sessions.map(session => (
                                <Card key={session.id} title={`Session ${session.id}: ${session.title}`} accent='NAVY' className="border-l-8 border-[#0B3B5B]">
                                    <p className='text-md font-semibold text-[#0B3B5B] mb-4 border-b border-gray-200 pb-2'>Why this session matters:</p>
                                    
                                    <blockquote className="border-l-4 pl-4 py-1 mb-4 text-sm italic text-gray-600" style={{ borderColor: COLORS.TEAL }}>
                                        {session.keyRationale}
                                    </blockquote>
                                    
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <h3 className="text-lg font-semibold mb-2" style={{ color: COLORS.TEAL }}>Core Focus</h3>
                                            <p className="text-gray-700 text-sm">{session.focus}</p>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold mb-2" style={{ color: COLORS.TEAL }}>Pre-Work Checklist</h3>
                                            <ul className="list-disc pl-5 text-gray-700 space-y-1 text-sm">
                                                {session.preWork.map((item, index) => (
                                                    <li key={index} className="text-sm">{item}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                        
                        <Button onClick={() => navigate('prof-dev-plan')} className='mt-8 w-full' accent='ORANGE'>
                             <CornerRightUp className='w-5 h-5 mr-2'/> Start Your Personalized PDP
                        </Button>
                    </div>
                );
        }
    };

    return renderView();
};

export default QuickStartAcceleratorScreen;