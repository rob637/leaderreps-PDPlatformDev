//  src/components/screens/QuickStartAccelerator.jsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Zap, ShieldCheck, ArrowLeft, Target, Briefcase, Clock, Users, CornerRightUp, X, Activity, Cpu, Eye, CheckCircle, AlertTriangle, Lightbulb
} from 'lucide-react';
import { useAppServices } from '../../services/useAppServices.jsx'; // Correct relative import

// --- MOCK UTILITIES (Replicated for component self-reliance) ---
const IconMap = {
    Zap: Zap, ShieldCheck: ShieldCheck, Target: Target, Briefcase: Briefcase, Clock: Clock, Users: Users, CheckCircle: CheckCircle, AlertTriangle: AlertTriangle, Cpu: Cpu, Eye: Eye, Lightbulb: Lightbulb, Activity: Activity, CornerRightUp: CornerRightUp, ArrowLeft: ArrowLeft, X: X,
};
async function mdToHtml(md) {
    let html = md;
    html = html.replace(/## (.*$)/gim, '<h2 class="text-2xl font-bold text-[#002E47] border-b pb-1 mb-3 mt-6">$1</h2>');
    html = html.replace(/### (.*$)/gim, '<h3 class="text-lg font-extrabold text-[#47A88D] mt-4 mb-2">$1</h3>');
    html = html.replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>');
    html = html.replace(/\n\n/g, '</p><p class="text-gray-700 text-sm mt-2">');
    html = html.replace(/\* (.*)/gim, '<li class="text-sm text-gray-700">$1</li>');
    html = html.replace(/<li>/g, '<ul class="list-disc list-inside space-y-1"><li>').replace(/<\/li>(?!<ul)/g, '</li></ul>');
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
    
    // Custom Card Component (Minimalist version for this file)
    const SimpleCard = ({ children, title, icon: Icon, className = '' }) => (
        <div className={`p-6 rounded-2xl border-2 shadow-xl bg-white ${className}`}>
             <h2 className="text-xl font-bold text-[#002E47] flex items-center mb-4">
                {Icon && <Icon className="w-6 h-6 mr-2 text-[#47A88D]" />}
                {title}
            </h2>
            {children}
        </div>
    );

    return (
        <div className="p-8">
            <h1 className="text-3xl font-extrabold text-[#002E47] mb-4">Leadership Identity Statement (LIS) Auditor</h1>
            <p className="text-lg text-gray-600 mb-6 max-w-3xl">Your LIS is the foundation of your leadership. Get expert feedback to ensure your statement is specific, actionable, and truly aligned with your highest self.</p>
            <button onClick={() => setQuickStartView('quick-start-home')} className="mb-8 px-4 py-2 font-semibold rounded-lg transition-colors bg-white text-[#002E47] border border-gray-300 hover:bg-gray-100">
                <ArrowLeft className="w-5 h-5 mr-2 inline" /> Back to QuickStart
            </button>

            <div className='lg:grid lg:grid-cols-2 gap-8'>
                <SimpleCard title="Draft Your Leadership Identity Statement" icon={ShieldCheck} className='border-l-4 border-[#002E47]'>
                    <p className="text-gray-700 text-sm mb-2">Write your LIS below. It should define who you are when you're leading at your absolute best.</p>
                    <textarea 
                        value={lisDraft} 
                        onChange={(e) => setLisDraft(e.target.value)} 
                        className="w-full p-3 mt-4 border border-gray-300 rounded-xl focus:ring-[#47A88D] focus:border-[#47A88D] h-32" 
                        placeholder="e.g., 'I am a visionary, transparent, and challenging leader who cultivates trust by owning failures and rewarding courageous feedback.'"
                    ></textarea>
                    
                    <button 
                        onClick={generateCritique} 
                        disabled={isGenerating || !lisDraft.trim()} 
                        className="mt-4 w-full px-4 py-2 font-semibold rounded-lg transition-colors bg-[#002E47] text-white hover:bg-gray-700"
                    >
                        {isGenerating ? (
                            <span className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                Auditing Identity...
                            </span>
                        ) : 'Run LIS Audit'}
                    </button>
                    {critiqueHtml && (
                        <button className='w-full text-center text-sm font-semibold text-[#47A88D] mt-3 hover:underline' onClick={() => setQuickStartView('lis-auditor-critique')}>
                            View Full Critique &rarr;
                        </button>
                    )}
                </SimpleCard>

                {/* Critique Preview */}
                {critiqueHtml && (
                    <SimpleCard title="AI Coach Preview" icon={Cpu} className='border-l-4 border-[#47A88D]'>
                        <div className="prose max-w-none prose-h3:text-[#47A88D] prose-p:text-gray-700 prose-ul:space-y-2">
                             <div dangerouslySetInnerHTML={{ __html: critiqueHtml }} />
                        </div>
                    </SimpleCard>
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
                        <h1 className="text-3xl font-extrabold text-[#002E47] mb-6">4-Session QuickStart Program</h1>
                        <p className="text-lg text-gray-600 mb-8 max-w-2xl">This program is the foundational accelerator for the LeaderReps methodology. Review the sessions, core focus, and pre-work below.</p>

                        <button 
                            onClick={() => setQuickStartView('lis-auditor')}
                            className='w-full text-left p-6 rounded-2xl border-4 shadow-xl mb-8 bg-[#47A88D]/10 border-[#47A88D] hover:shadow-2xl transition-all duration-300'
                        >
                            <h3 className='text-2xl font-extrabold text-[#002E47] flex items-center'>
                                <ShieldCheck className='w-6 h-6 mr-3 text-[#47A88D]'/> Draft & Refine Your Leadership Identity
                            </h3>
                            <p className='text-gray-700 text-sm mt-2'>Access the **LIS Auditor** to receive expert critique on your personal leadership foundation statement. This is crucial for Session 2 pre-work!</p>
                            <div className="mt-4 text-[#47A88D] font-semibold flex items-center">
                                Launch LIS Auditor &rarr;
                            </div>
                        </button>

                        <div className="space-y-6">
                            {sessions.map(session => (
                                <div key={session.id} className="p-6 rounded-2xl border-l-8 border-[#002E47] shadow-lg bg-white">
                                    <h2 className='text-xl font-extrabold text-[#002E47] mb-2'>Session {session.id}: {session.title}</h2>
                                    <p className='text-md font-semibold text-[#002E47] mb-4 border-b border-gray-200 pb-2'>Why this session matters:</p>
                                    
                                    <blockquote className="border-l-4 border-[#47A88D] pl-4 py-1 mb-4 text-sm italic text-gray-600">
                                        {session.keyRationale}
                                    </blockquote>
                                    
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <h3 className="text-lg font-semibold text-[#47A88D] mb-2">Core Focus</h3>
                                            <p className="text-gray-700 text-sm">{session.focus}</p>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-[#47A88D] mb-2">Pre-Work Checklist</h3>
                                            <ul className="list-disc pl-5 text-gray-700 space-y-1 text-sm">
                                                {session.preWork.map((item, index) => (
                                                    <li key={index} className="text-sm">{item}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
        }
    };

    return renderView();
};

export default QuickStartAcceleratorScreen;