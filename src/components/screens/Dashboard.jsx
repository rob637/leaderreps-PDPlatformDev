import React, { useState, useEffect, useMemo } from 'react';
// FIX: Changed '../../../App' to correct path '../../App'
import { useAppServices } from '../../App';
import { Card, Button, Tooltip, NavItem } from '../shared/UI';
// FIX: Changed '../../../data/Constants' to correct path '../../data/Constants'
import { LEADERSHIP_TIERS } from '../../data/Constants'; 
import { ArrowLeft, Zap, ShieldCheck, CornerRightUp, Users, Settings, AlertTriangle, Home, Clock, TrendingUp, Mic, BookOpen, Target, Briefcase } from 'lucide-react';
// FIX: Changed '../../../utils/ApiHelpers' to correct path '../../utils/ApiHelpers'
import { mdToHtml, callSecureGeminiAPI, hasGeminiKey, GEMINI_MODEL } from '../../utils/ApiHelpers.js';
import { signOut } from 'firebase/auth'; // Explicitly import signOut

// --- DashboardScreen ---
export const DashboardScreen = () => {
    // FIX: Removed unnecessary destructuring of IconMap as components are imported directly.
    const { navigate, user } = useAppServices(); 

    return (
        <div className="p-8 space-y-8">
            <h1 className="text-3xl font-extrabold text-[#002E47]">Welcome back, {user.name}!</h1>
            <p className="text-lg text-gray-600">Your hub for leadership practice, strategy, and growth.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Icons passed as components */}
                <Card title="QuickStart Program Overview" icon={Zap} onClick={() => navigate('quick-start-accelerator')}>
                    <p className="text-gray-600 text-sm mb-4">Review the core curriculum of the 4-Session QuickStart program: Feedback, Identity, Coaching, and Trust.</p>
                    <Button onClick={() => navigate('quick-start-accelerator')} variant="outline" className="w-full">Review Sessions</Button>
                </Card>

                <Card title="Professional Development Plan (Prof Dev Plan)" icon={Briefcase} onClick={() => navigate('prof-dev-plan')} className="lg:col-span-1 border-4 border-[#47A88D] bg-[#47A88D]/10">
                    <p className="text-gray-700 font-medium text-sm mb-4">Your personalized growth plan. Track your progress, set goals, and access your tailored learning path.</p>
                    <Button onClick={() => navigate('prof-dev-plan')} className="w-full bg-[#002E47] hover:bg-gray-800">Start Development</Button>
                </Card>

                <Card title="Coaching & Crucial Conversations Lab" icon={Mic} onClick={() => navigate('coaching-lab')}>
                    <p className="text-gray-600 text-sm mb-4">Practice high-stakes conversations and refine your feedback skills using structured templates and AI critique.</p>
                    <Button onClick={() => navigate('coaching-lab')} variant="outline" className="w-full">Go to Lab</Button>
                </Card>
                
                <Card title="Daily Practice & Commitment" icon={Clock} onClick={() => navigate('daily-practice')}>
                    <p className="text-gray-600 text-sm mb-4">Manage your micro-habits, log daily commitments, and track the consistent effort required for long-term growth.</p>
                    <Button onClick={() => navigate('daily-practice')} variant="outline" className="w-full">Go to Hub</Button>
                </Card>

                <Card title="Vision & OKR Planning Hub" icon={TrendingUp} onClick={() => navigate('planning-hub')}>
                    <p className="text-gray-600 text-sm mb-4">Draft your leadership vision and set measurable Quarterly Objectives and Key Results (OKRs).</p>
                    <Button onClick={() => navigate('planning-hub')} variant="outline" className="w-full">Plan Strategy</Button>
                </Card>

                <Card title="Business Readings" icon={BookOpen} onClick={() => navigate('business-readings')}>
                    <p className="text-gray-600 text-sm mb-4">Access categorized, one-page summaries of top leadership and business books, generated on demand.</p>
                    <Button onClick={() => navigate('business-readings')} variant="outline" className="w-full">Explore Summaries</Button>
                </Card>
            </div>
        </div>
    );
}

// --- QuickStartScreen (Router) ---
const LISAuditorView = ({ setQuickStartView }) => {
    const { navigate } = useAppServices(); 
    const [lisDraft, setLisDraft] = useState('I am a dedicated leader who always tries to do the right thing for my team and my company. I believe in hard work.');
    const [isGenerating, setIsGenerating] = useState(false);
    const [critique, setCritique] = useState('');
    const [critiqueHtml, setCritiqueHtml] = useState('');

    const ShieldCheckIcon = ShieldCheck;
    const ArrowLeftIcon = ArrowLeft; 

    useEffect(() => {
        if (!critique) { setCritiqueHtml(''); return; }
        (async () => setCritiqueHtml(await mdToHtml(critique)))();
    }, [critique]);

    const generateCritique = async () => {
        if (!lisDraft.trim()) { alert("Please provide your Leadership Identity Statement draft first."); return; }

        setIsGenerating(true);
        setCritique('');

        const systemPrompt = "You are an elite executive coach specializing in LIS development. Your task is to critique the user's LIS draft based on clarity, actionability, and aspirational alignment. Your critique must be polite, structured using Markdown, and focus on: 1) **Clarity and Specificity**; 2) **Action/Behavior Focus**; 3) **Aspirational Rigor**. Conclude with a refined, concise LIS example using the core values from the user's draft.";
        const userQuery = `Critique this Leadership Identity Statement draft:\n\n${lisDraft}`;

        try {
            if (!hasGeminiKey()) { 
                setCritique("## AI Critique Unavailable\n\n**ERROR**: The Gemini API Key is missing.");
                setIsGenerating(false);
                return;
            }

            const payload = { contents: [{ role: "user", parts: [{ text: userQuery }] }], systemInstruction: { parts: [{ text: systemPrompt }] } };

            const result = await callSecureGeminiAPI(payload);
            const aiText = result?.candidates?.[0]?.content?.parts?.[0]?.text || "Could not generate critique. The model may have blocked the request or the response was empty.";
            setCritique(aiText);

        } catch (error) {
            console.error("Gemini API Error:", error);
            setCritique("An error occurred while connecting to the AI coach.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="p-8">
            <h1 className="text-3xl font-extrabold text-[#002E47] mb-4">Leadership Identity Statement (LIS) Auditor</h1>
            <p className="text-lg text-gray-600 mb-6 max-w-3xl">Your LIS is the foundation of your leadership. Get expert feedback to ensure your statement is specific, actionable, and truly aligned with your highest self.</p>
            <Button onClick={() => setQuickStartView('quick-start-home')} variant="outline" className="mb-8">
                <ArrowLeftIcon className="w-5 h-5 mr-2" /> Back to QuickStart
            </Button>

            <Card title="Draft Your Leadership Identity Statement" icon={ShieldCheckIcon} className='mb-8 border-l-4 border-[#002E47]'>
                <p className="text-gray-700 text-sm mb-2">Write your LIS below. It should define who you are when you're leading at your absolute best.</p>
                <textarea 
                    value={lisDraft} 
                    onChange={(e) => setLisDraft(e.target.value)} 
                    className="w-full p-3 mt-4 border border-gray-300 rounded-xl focus:ring-[#47A88D] focus:border-[#47A88D] h-32" 
                    placeholder="e.g., 'I am a visionary, transparent, and challenging leader who cultivates trust by owning failures and rewarding courageous feedback.'"
                ></textarea>
                
                <Tooltip 
                    content={hasGeminiKey() 
                        ? "Runs your draft through the AI Coach for structured critique." 
                        : "AI Critique is unavailable. Check App Settings for configuration."
                    }
                >
                    <Button 
                        onClick={generateCritique} 
                        disabled={isGenerating || !lisDraft.trim()} 
                        className="mt-4 w-full md:w-auto"
                    >
                        {isGenerating ? (
                            <div className="flex items-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                Auditing Identity...
                            </div>
                        ) : 'Run LIS Audit'}
                    </Button>
                </Tooltip>
            </Card>

            {critiqueHtml && (
                <Card title="AI Coach Critique" className="mt-8 bg-[#002E47]/10 border border-[#002E47]/20 rounded-3xl">
                    <div className="prose max-w-none prose-h3:text-[#47A88D] prose-p:text-gray-700 prose-ul:space-y-2">
                        <div dangerouslySetInnerHTML={{ __html: critiqueHtml }} />
                    </div>
                </Card>
            )}
        </div>
    );
};

export const QuickStartScreen = () => {
    const [view, setQuickStartView] = useState('quick-start-home');
    const { IconMap } = useAppServices();
    const ZapIcon = Zap;

    const sessions = [
        { id: 1, title: 'Delivering Effective Feedback', focus: 'CLEAR Framework & The Magic Ratio (5:1)', keyRationale: 'Feedback is the currency of growth. Master objectivity (SBI) and ensure positive reinforcement outweighs correction to build a high-trust team environment.', preWork: ['Watch Session 1 Prep Video', 'Complete Pre-Session Exercises', 'Complete Workout Prep'] },
        { id: 2, title: 'Anchoring Feedback with Identity', focus: 'Leadership Identity Statement (LIS) & Anchored Feedback', keyRationale: 'Your LIS is your North Star. Grounding every action and conversation in your core values ensures integrity and makes your leadership predictable and trustworthy.', preWork: ['Watch Session 2 Prep Video', 'Draft Leadership Identity Statement', 'Feedback Reflection'] },
        { id: 3, title: 'Coaching One-on-One (1:1)', focus: '1:1 Structure, Direct-Led Agenda, and Coaching for Growth', keyRationale: 'Effective 1:1s are the most high-leverage time you spend. Shift from status updates to future-focused coaching and actively listening to employee challenges.', preWork: ['Sign up for 1:1 with Trainer', 'Review 1:1 Notes & Topics', 'Prepare for Personalized Coaching Session'] },
        { id: 4, title: 'Building Vulnerability-Based Trust', focus: 'Trust Fundamentals, 1:1 Habit, and Leading with Vulnerability', keyRationale: 'Trust is the foundation for speed and psychological safety. Learn to lead by modeling vulnerability and commitment, creating space for the team to take risks and admit mistakes.', preWork: ['Watch Session 4 Prep Video', 'Complete Pre-Session Exercises', 'Complete Reflections'] }
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

                        <Card 
                            title="Draft & Refine Your Leadership Identity" 
                            icon={ShieldCheck} 
                            onClick={() => setQuickStartView('lis-auditor')}
                            className='mb-8 bg-[#47A88D]/10 border-4 border-[#47A88D]'
                        >
                            <p className='text-gray-700 text-sm'>Access the **LIS Auditor** to receive expert critique on your personal leadership foundation statement. This is crucial for Session 2 pre-work!</p>
                            <div className="mt-4 text-[#47A88D] font-semibold flex items-center">
                                Launch LIS Auditor &rarr;
                            </div>
                        </Card>

                        <div className="space-y-6">
                            {sessions.map(session => (
                            <Card key={session.id} title={`Session ${session.id}: ${session.title}`} icon={Zap} className="border-l-8 border-[#002E47]">
                                <p className='text-md font-semibold text-[#002E47] mb-4'>Why this session matters:</p>
                                <blockquote className="border-l-4 border-[#47A88D] pl-4 py-1 mb-4 text-sm italic text-gray-600">
                                    {session.keyRationale}
                                </blockquote>
                                <div className="md:flex md:space-x-8">
                                <div className="md:w-1/2 mb-4 md:mb-0">
                                    <h3 className="text-lg font-semibold text-[#47A88D] mb-2">Core Focus</h3>
                                    <p className="text-gray-700">{session.focus}</p>
                                </div>
                                <div className="md:w-1/2">
                                    <h3 className="text-lg font-semibold text-[#47A88D] mb-2">Pre-Work Checklist</h3>
                                    <ul className="list-disc pl-5 text-gray-700 space-y-1">
                                    {session.preWork.map((item, index) => (
                                        <li key={index} className="text-sm">{item}</li>
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
    }
    return renderView();
};

// --- AppSettingsScreen ---
export const AppSettingsScreen = () => {
    const { userId, navigate, firebaseServices } = useAppServices();
    const { auth } = firebaseServices;

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            // State context handles navigation automatically
        } catch (e) {
            alert("Failed to sign out.");
            console.error("Sign out error:", e);
        }
    }

    return (
        <div className="p-8">
            <h1 className="text-3xl font-extrabold text-[#002E47] mb-6">Application Settings & Configuration</h1>
            <p className="text-lg text-gray-600 mb-8 max-w-3xl">Manage API keys, user data, and system preferences here.</p>

            <Card title="Gemini API Key Configuration" icon={Settings} className='border-l-4 border-[#47A88D]'>
                <p className="text-[#E04E1B] font-semibold mb-3">
                    <AlertTriangle className="w-5 h-5 inline mr-2"/> Action Required for AI Features:
                </p>
                <p className="text-gray-700 text-sm mb-4">
                    To unlock AI Coaching (SBI Critique, Role-Play, OKR Audit) and Leadership Book Summaries, you must set your Gemini API Key in the execution environment.
                </p>
                <div className='bg-gray-100 p-4 rounded-xl font-mono text-sm'>
                    <p className='text-[#002E47] font-bold'>Required Global Variable:</p>
                    <code className='text-[#47A88D] break-words'>window.__GEMINI_API_KEY</code>
                </div>
                <p className='text-xs text-gray-500 mt-3'>
                    *This key is necessary for fetching real-time and generative content.
                </p>
            </Card>

            <Card title="Account & Data Maintenance" icon={Users} className='mt-8 border-l-4 border-[#002E47]'>
                <p className="text-gray-700 text-sm mb-4">
                    Your current User ID (UID) is used to partition your personal data in the database.
                </p>
                <div className='bg-gray-100 p-4 rounded-xl font-mono text-sm mb-4'>
                    <p className='text-[#002E47] font-bold'>Current User ID (UID):</p>
                    <code className='text-[#47A88D] break-words'>{userId}</code>
                </div>
                <Button onClick={handleSignOut} className='w-full bg-[#E04E1B] hover:bg-red-700'>
                    Sign Out (Ends Session)
                </Button>
            </Card>
        </div>
    );
};

export default { DashboardScreen, QuickStartScreen, AppSettingsScreen };
