/* eslint-disable no-console */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppServices } from '../../App.jsx'; 
import { 
    Home, Zap, HeartPulse, BookOpen, Users, Settings, Briefcase,
    TrendingUp, Target, Mic, ArrowLeft, CheckCircle, Lightbulb, Clock, PlusCircle, X, BarChart3, MessageSquare, AlertTriangle, ShieldCheck, CornerRightUp, Play, Info, Eye
} from 'lucide-react';
import { addDoc, collection } from 'firebase/firestore'; 
import { mdToHtml } from '../../utils/ApiHelpers.js'; 

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

// --- CHAT MESSAGE COMPONENT ---
const Message = ({ sender, text, isAI }) => (
  <div className={`flex mb-4 ${isAI ? 'justify-start' : 'justify-end'}`}>
    <div
      className={`p-4 max-w-lg rounded-xl shadow-md ${
        isAI
          ? 'bg-[#002E47]/10 text-[#002E47] rounded-tl-none border border-[#002E47]/20'
          : 'bg-[#47A88D] text-white rounded-tr-none'
      }`}
    >
      <strong className="font-bold text-sm">{sender}:</strong>
      <p className="text-sm mt-1">{text}</p>
    </div>
  </div>
);


// --- ROLE PLAY CRITIQUE VIEW ---
const RolePlayCritique = ({ history, setView }) => {
const { callSecureGeminiAPI, hasGeminiKey, navigate } = useAppServices();
const [critique, setCritique] = useState('');
const [critiqueHtml, setCritiqueHtml] = useState('');
const [isGenerating, setIsGenerating] = useState(true);

useEffect(() => {
    (async () => {
        if (history.length < 5) {
            setCritique("## Insufficient Data\n\nTo provide a meaningful score and critique, please complete at least 5 turns (your messages + Alex's responses) in the role-play simulator.");
            setIsGenerating(false);
            return;
        }
        
        if (!hasGeminiKey()) {
            setCritique("## AI Critique Unavailable\n\n**ERROR**: The Gemini API Key is missing. AI Role-Play is unavailable.");
            setIsGenerating(false);
            return;
        }

        const conversationText = history
            .filter(msg => !msg.system)
            .map(msg => `${msg.sender}: ${msg.text}`)
            .join('\n');

        const systemPrompt = `You are a Senior Executive Coaching Auditor. Analyze the following conversation between a Manager ('You') and their report ('Alex'). Provide a clear score (out of 100) and structured feedback in Markdown, focusing on professional leadership skills.
            
            **Critique Structure:**
            1.  **Overall Score (## 95/100):** Provide a score out of 100 based on the manager's performance.
            2.  **SBI Effectiveness (### SBI Audit):** Did the manager effectively stick to objective facts (Situation/Behavior) and articulate the impact (Impact)?
            3.  **Active Listening & Empathy (### Empathy Score):** Did the manager use paraphrasing, open-ended questions, or validate Alex's emotions?
            4.  **Resolution Drive (### Bias for Action):** Did the manager guide the conversation toward a measurable commitment or next step?
            5.  **Key Takeaway (### Next Practice Point):** Provide one specific, actionable habit for the manager to work on.`;

        const userQuery = `Analyze the following role-play dialogue. The manager's goal was to address performance/behavior issues with Alex:\n\n${conversationText}`;

        try {
            const payload = {
                contents: [{ role: "user", parts: [{ text: userQuery }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
            };

            const result = await callSecureGeminiAPI(payload);
            const aiText = result?.candidates?.[0]?.content?.parts?.[0]?.text || "Critique generation failed. Check API connection.";
            setCritique(aiText);

        } catch (error) {
            console.error("Critique API Error:", error);
            setCritique("An error occurred during AI critique generation.");
        } finally {
            setIsGenerating(false);
        }
    })();
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [history, setView]);

useEffect(() => {
    if (critique) {
        (async () => setCritiqueHtml(await mdToHtml(critique)))();
    }
}, [critique]);

if (isGenerating) {
    return (
        <Card title="Generating Session Critique..." icon={Zap} className="mt-8 bg-[#47A88D]/10 border-2 border-[#47A88D]">
            <div className="flex flex-col items-center justify-center h-40">
                <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-[#47A88D] mb-4"></div>
                <p className="text-[#47A88D] font-medium">Analyzing dialogue history and scoring performance...</p>
            </div>
        </Card>
    );
}

return (
    <Card title="Role-Play Session Audit" icon={CheckCircle} className="mt-8 bg-[#002E47]/10 border-4 border-[#002E47]/20">
        <div className="prose max-w-none prose-h2:text-4xl prose-h2:text-[#E04E1B] prose-h2:font-extrabold prose-h3:text-[#47A88D] prose-p:text-gray-700 prose-ul:space-y-2">
            <div dangerouslySetInnerHTML={{ __html: critiqueHtml }} />
        </div>
        <Button onClick={() => setView('coaching-lab-home')} className='mt-8 w-full'>
            Return to Coaching Lab Home
        </Button>
    </Card>
);


};

// --- ROLE PLAY SIMULATOR VIEW ---
const RolePlayView = ({ scenario, setCoachingLabView }) => {
    const { db, userId, appId, callSecureGeminiAPI, hasGeminiKey } = useAppServices();

    const [chatHistory, setChatHistory] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [conversationStarted, setConversationStarted] = useState(false);
    const [sessionEnded, setSessionEnded] = useState(false);
    const chatRef = React.useRef(null);
    const COACHING_COLLECTION = 'coaching_sessions';

    useEffect(() => {
        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
    }, [chatHistory]);

    const AI_PERSONA = scenario.persona.split(' ')[1]; 

    const handleSaveSessionAndCritique = async (history) => {
        if (db && userId) {
            try {
                await addDoc(collection(db, `/artifacts/${appId}/users/${userId}/${COACHING_COLLECTION}`), {
                    userId: userId,
                    scenarioTitle: scenario.title,
                    scenarioPersona: scenario.persona,
                    date: new Date().toISOString(),
                    history: history,
                    status: 'Completed',
                });
                console.log("Coaching session saved successfully.");
            } catch (e) {
                console.error("Error saving coaching session:", e);
            }
        }
        
        setSessionEnded(true);
    }

    const generateResponse = async (history) => {
        setIsGenerating(true);

        const systemPrompt = `You are a direct report named 'Alex'. You embody the persona: ${scenario.persona}. Your current situation is: "${scenario.description}". The user is your manager.

Your task is to respond to the user's input, maintaining your ${AI_PERSONA} persona and tone. Be realistic—don't resolve the conflict immediately. After 4-5 turns, you may begin to soften only if the manager demonstrates effective listening and SBI feedback. Keep your responses concise (2-3 sentences max).
Use the history below to guide your response. Do not break character or mention your persona.`;

        const currentHistory = history.map(msg => ({ 
            role: msg.isAI ? "model" : "user", 
            parts: [{ text: msg.text }] 
        }));

        if (!hasGeminiKey()) {
            setChatHistory(prev => [...prev, { 
                sender: 'System', 
                text: "**ERROR**: The Gemini API Key is missing. AI Role-Play is unavailable. Please check App Settings.", 
                isAI: true, 
                system: true 
            }]);
            setIsGenerating(false);
            return;
        }

        try {
            const payload = {
                contents: currentHistory,
                systemInstruction: { parts: [{ text: systemPrompt }] },
            };

            const result = await callSecureGeminiAPI(payload);
            const aiText = result?.candidates?.[0]?.content?.parts?.[0]?.text || "I seem to be having trouble processing that right now. Can you rephrase?";

            setChatHistory(prev => [...prev, { sender: 'Alex', text: aiText, isAI: true }]);
        } catch (error) {
            console.error("AI Role-Play Error:", error);
            setChatHistory(prev => [...prev, { sender: 'Alex', text: "A communication error occurred. Please try again.", isAI: true }]);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSendMessage = async () => {
        if (!inputText.trim() || isGenerating) return;

        const newUserMessage = { sender: 'You', text: inputText.trim(), isAI: false };
        const newHistory = [...chatHistory, newUserMessage];
        setChatHistory(newHistory);
        setInputText('');
        
        if (!conversationStarted) {
            setConversationStarted(true);
        }

        await generateResponse(newHistory);
    };

    useEffect(() => {
        if (!conversationStarted && !sessionEnded) {
            setChatHistory([
                { sender: 'System', text: `You are meeting with Alex (The ${AI_PERSONA}) in the conference room. Alex looks visibly annoyed/distracted. Start the conversation with your opening statement.`, isAI: true, system: true }
            ]);
            setConversationStarted(true);
        }
    }, [conversationStarted, sessionEnded, AI_PERSONA]);

    if (sessionEnded) {
        return (
            <div className='p-8'>
                <h1 className="text-3xl font-extrabold text-[#002E47] mb-4">Session Complete: Audit Results</h1>
                <RolePlayCritique history={chatHistory} setView={setCoachingLabView} />
            </div>
        );
    }


    return (
        <div className="p-8">
            <h1 className="text-3xl font-extrabold text-[#002E47] mb-4">Role-Play Simulator: {scenario.title}</h1>
            <p className="text-lg text-gray-600 mb-6 max-w-3xl">Practice your conversation with Alex, who is simulating **{scenario.persona}** behavior. Focus on using empathy and clear SBI feedback.</p>
            <Button onClick={() => handleSaveSessionAndCritique(chatHistory)} variant="secondary" className="mb-8 bg-[#E04E1B] border-red-500 hover:bg-red-700">
                <AlertTriangle className="w-5 h-5 mr-2" /> End Session & Get Critique
            </Button>
            
            <div className='flex flex-col lg:flex-row space-y-6 lg:space-y-0 lg:space-x-6'>
                <div className='flex-1 bg-[#FCFCFA] border border-gray-300 rounded-2xl shadow-lg flex flex-col h-[500px]'>
                    <div ref={chatRef} className='flex-1 overflow-y-auto p-4'>
                        {chatHistory.map((msg, index) => (
                            // Only render non-system messages in chat box (system messages are for context)
                            !msg.system && <Message key={index} sender={msg.sender} text={msg.text} isAI={msg.isAI} />
                        ))}
                         {/* Display System message once */}
                        {chatHistory.find(msg => msg.system) && (
                            <div className="text-sm text-[#002E47] bg-[#47A88D]/10 p-3 rounded-lg border border-[#47A88D]/20 mb-4">
                                {chatHistory.find(msg => msg.system)?.text}
                            </div>
                        )}
                        {isGenerating && (
                            <div className='flex justify-start mb-4'>
                                <div className='p-4 max-w-lg rounded-xl bg-[#002E47]/10 text-gray-500 rounded-tl-none'>
                                    <div className="animate-pulse text-sm">Alex is typing...</div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className='p-4 border-t border-gray-200 flex space-x-3'>
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Type your response to Alex..."
                            className="flex-1 p-3 border border-gray-300 rounded-xl focus:ring-[#47A88D] focus:border-[#47A88D]"
                            disabled={isGenerating || !hasGeminiKey()}
                        />
                        <Button onClick={handleSendMessage} disabled={!inputText.trim() || isGenerating || !hasGeminiKey()} className='px-4 py-3'>
                            {isGenerating ? '...' : <MessageSquare className='w-5 h-5' />}
                        </Button>
                    </div>
                </div>

                <div className='lg:w-1/3'>
                    <Card title={`Alex: The ${AI_PERSONA}`} icon={Users} className='h-full bg-[#002E47]/10 border-2 border-[#002E47]/20'>
                        <p className='text-sm text-gray-700 font-semibold mb-2'>Scenario Description:</p>
                        <p className="text-sm text-gray-600">{scenario.description}</p>
                        
                        <h4 className='font-bold text-[#002E47] mt-4 mb-2 border-t pt-2'>Goal Reminder:</h4>
                        <ul className='list-disc list-inside text-sm text-gray-700 space-y-1'>
                            <li>Establish clear, objective facts (S&B).</li>
                            <li>Lead with empathy, not accusation.</li>
                            <li>Steer toward a forward-looking action plan.</li>
                        </ul>
                    </Card>
                </div>
            </div>
        </div>
    );


};

// --- SCENARIO PREP VIEW ---
const ScenarioPreparationView = ({ scenario, setCoachingLabView }) => {
    if (!scenario) {
    return (
    <div className="p-8">
    <Button onClick={() => setCoachingLabView('scenario-library')} variant="outline" className="mb-8">
    <ArrowLeft className="w-5 h-5 mr-2" /> Back to Scenarios
    </Button>
    <p className="text-gray-700">No scenario selected.</p>
    </div>
    );
    }
    
    return (
    <div className="p-8">
    <h1 className="text-3xl font-extrabold text-[#002E47] mb-4">Prepare for: {scenario.title}</h1>
    <p className="text-lg text-gray-600 mb-6 max-w-3xl">Scenario: {scenario.description}</p>
    <Button onClick={() => setCoachingLabView('scenario-library')} variant="outline" className="mb-8">
    <ArrowLeft className="w-5 h-5 mr-2" /> Back to Scenarios
    </Button>
    
      <div className="space-y-8">
        <Card title="Step 1: Define Your Objective (The Win)" icon={Target}>
          <p className="text-gray-700">What is the **one critical outcome** you want from this conversation? What will success look like when you walk away? (Keep it measurable: commitment, change in process, etc.)</p>
          <textarea className="w-full p-3 mt-4 border border-gray-300 rounded-xl focus:ring-[#47A88D] focus:border-[#47A88D] h-24" placeholder="e.g., 'Ensure John commits to submitting reports by Thursday COB going forward.'"></textarea>
        </Card>
    
        <Card title="Step 2: Draft Your SBI Feedback (The Facts)" icon={Briefcase}>
          <p className="text-gray-700 mb-4">Draft the specific, objective feedback using the **SBI** (Situation, Behavior, Impact) model. Focus on observable facts, not judgment.</p>
          <div className="bg-[#002E47]/10 p-4 rounded-xl text-sm text-[#002E47] border border-[#002E47]/20">
            <strong>Tip:</strong> Try the <span className='font-bold text-[#47A88D] cursor-pointer hover:underline' onClick={() => setCoachingLabView('feedback-prep')}>Feedback Prep Tool</span> for an AI critique of your draft!
          </div>
        </Card>
    
        <Card title="Step 3: Plan Logistics and Mindset (The How)" icon={Zap}>
          <p className="text-gray-700">When and where will you hold this conversation? What's your **"go-first" vulnerability statement** to open the discussion and establish psychological safety?</p>
          <textarea className="w-full p-3 mt-4 border border-gray-300 rounded-xl focus:ring-[#47A88D] focus:border-[#47A88D] h-24" placeholder="e.g., 'I plan to meet with her privately in the small conference room at 2 PM. My opening vulnerability will be admitting I should have addressed this sooner.'"></textarea>
        </Card>
      </div>
    
      <Button onClick={() => setCoachingLabView('role-play')} className="mt-10 w-full md:w-auto">
        <Play className="w-5 h-5 mr-2" /> Start Role-Play Simulation
      </Button>
    </div>
    
    
    );
};

// --- SCENARIO LIBRARY VIEW ---
const ScenarioLibraryView = ({ setCoachingLabView, setSelectedScenario }) => {
    const scenarios = [
        { id: 1, title: 'The Underperformer', description: 'A high-potential team member is consistently missing deadlines due to distraction.', persona: 'The Deflector' },
        { id: 2, title: 'The Boundary Pusher', description: 'An employee repeatedly oversteps their authority when dealing with clients, creating tension.', persona: 'The Defender' },
        { id: 3, title: 'The Silent Withdrawal', description: 'A direct report has become quiet and disengaged in meetings following a minor project failure.', persona: 'The Silent Stonewall' },
        { id: 4, title: 'The Emotional Reaction', description: 'You need to deliver corrective feedback, and the employee is highly likely to become defensive or tearful.', persona: 'The Emotional Reactor' },
        { id: 5, title: 'The Excessive Apologizer', description: 'A team member makes a small mistake and immediately apologizes repeatedly, paralyzing forward progress.', persona: 'The Over-Apologizer' },
        { id: 6, title: 'The Team Blamer', description: 'An employee frequently attributes project failures to "someone else on the team" instead of taking personal responsibility.', persona: 'The Blame-Shifter' },
        { id: 7, title: 'The Silent Observer', description: 'A highly capable team member consistently fails to speak up or contribute ideas during brainstorms or strategy discussions.', persona: 'The Passive Contributor' },
    ];
    
    return (
    <div className="p-8">
    <h1 className="text-3xl font-extrabold text-[#002E47] mb-4">Scenario Library: Practice Conversations</h1>
    <p className="text-lg text-gray-600 mb-6">Select a high-stakes scenario to practice your preparation process. Each scenario includes a unique persona for the AI simulator.</p>
    <Button onClick={() => setCoachingLabView('coaching-lab-home')} variant="outline" className="mb-8">
    <ArrowLeft className="w-5 h-5 mr-2" /> Back to Coaching Lab
    </Button>
    
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {scenarios.map(scenario => (
          <Card key={scenario.id} title={scenario.title} className="border-l-4 border-[#47A88D] rounded-3xl" onClick={() => {
            setSelectedScenario(scenario);
            setCoachingLabView('scenario-prep');
          }}>
            <p className="text-sm text-gray-700 mb-3">{scenario.description}</p>
            <div className="text-xs font-semibold text-[#002E47] bg-[#002E47]/10 px-3 py-1 rounded-full inline-block">Persona: {scenario.persona}</div>
            <div className="mt-4 text-[#47A88D] font-semibold flex items-center">
              Start Preparation &rarr;
            </div>
          </Card>
        ))}
      </div>
    </div>
    
    
    );
};

// --- FEEDBACK PREP TOOL VIEW ---
const FeedbackPrepToolView = ({ setCoachingLabView }) => {
    const { updateCommitmentData, navigate, callSecureGeminiAPI, hasGeminiKey } = useAppServices();

    const [situation, setSituation] = useState('During the Q3 Review meeting with the leadership team last Friday.');
    const [behavior, setBehavior] = useState('You interrupted Sarah three times while she was presenting her analysis on customer churn data, dominating the conversation.');
    const [impact, setImpact] = useState('This caused Sarah to lose her train of thought and weakened the confidence of other team members to contribute to the discussion, hindering a full review of the data.');
    const [isGenerating, setIsGenerating] = useState(false);
    const [critique, setCritique] = useState('');
    const [critiqueHtml, setCritiqueHtml] = useState('');
    const [refinedFeedback, setRefinedFeedback] = useState(null); 

    useEffect(() => {
        if (!critique) { setCritiqueHtml(''); setRefinedFeedback(null); return; }
        (async () => setCritiqueHtml(await mdToHtml(critique)))();
        
        // Attempt to pull out the refined SBI text for the commitment button
        const match = critique.match(/\*\*(Refined Feedback|Refined SBI)\*\*:?\s*([^*]+)/i);
        if (match && match[2]) {
            setRefinedFeedback(match[2].trim().replace(/\.$/, ''));
        } else {
            setRefinedFeedback(null);
        }

    }, [critique]);

    const generateCritique = async () => {
        setIsGenerating(true);
        setCritique('');
        setRefinedFeedback(null);

        if (!hasGeminiKey()) {
            setCritique("## AI Critique Unavailable\n\n**ERROR**: The Gemini API Key is missing. Please ensure `window.__GEMINI_API_KEY` is set to enable AI coaching and critique features.");
            setIsGenerating(false);
            return;
        }

        const userFeedback = `S: ${situation}\nB: ${behavior}\nI: ${impact}`;
        const systemPrompt = "You are an executive coach specializing in crucial conversations and the SBI (Situation, Behavior, Impact) feedback model. Analyze the user's provided feedback draft. Your critique must be polite, professional, and actionable. First, point out one strength. Second, point out one area for improvement, specifically focusing on ensuring the Behavior is objective and the Impact is linked to business results or team culture, not emotion. Then, provide the final refined version of the feedback, strictly adhering to the S-B-I format, labeling the final version with **Refined Feedback**.";
        const userQuery = `Critique and refine this SBI feedback draft:\n\n${userFeedback}`;

        try {
            const payload = {
            contents: [{ role: "user", parts: [{ text: userQuery }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
            };

            const result = await callSecureGeminiAPI(payload);
            const candidate = result?.candidates?.[0];

            if (candidate && candidate.content?.parts?.[0]?.text) {
                setCritique(candidate.content.parts[0].text);
            } else {
                setCritique("Could not generate critique. The model may have blocked the request or the response was empty.");
            }
        } catch (error) {
            console.error("Gemini API Error:", error);
            setCritique("An error occurred while connecting to the AI coach. Please check your inputs and network connection.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCommitmentCreation = async () => {
        if (!refinedFeedback || !updateCommitmentData) return;

        const commitmentText = `Practice delivering the refined SBI feedback: "${refinedFeedback}".`;
        
        const newCommitment = { 
            id: Date.now(), 
            text: commitmentText, 
            status: 'Pending', 
            isCustom: true, 
            linkedGoal: 'Improve Feedback & Coaching Skills',
            linkedTier: 'T2', 
            targetColleague: null,
        };

        const success = await updateCommitmentData(data => {
            const existingCommitments = data?.active_commitments || [];
            return { active_commitments: [...existingCommitments, newCommitment] };
        });

        if (success) {
            alert("Commitment created! Review it in your Daily Practice Scorecard.");
            navigate('daily-practice', { 
                initialGoal: newCommitment.linkedGoal, 
                initialTier: newCommitment.linkedTier 
            }); 
        } else {
            alert("Failed to save new commitment.");
        }
    };


    return (
    <div className="p-8">
    <h1 className="text-3xl font-extrabold text-[#002E47] mb-4">Feedback Prep Tool (SBI Critique)</h1>
    <p className="text-lg text-gray-600 mb-6 max-w-3xl">Draft your difficult feedback using the <strong>S</strong>ituation, <strong>B</strong>ehavior, <strong>I</strong>mpact model. Our AI coach will refine your draft for clarity and professionalism.</p>
    <Button onClick={() => setCoachingLabView('coaching-lab-home')} variant="outline" className="mb-8">
    <ArrowLeft className="w-5 h-5 mr-2" /> Back to Coaching Lab
    </Button>
    
      <div className="space-y-6 mb-8">
        <Card title="1. Situation (S)" icon={Briefcase}>
          <p className="text-gray-700 text-sm mb-2">When and where did the behavior occur? (Be specific and fact-based)</p>
          <textarea value={situation} onChange={(e) => setSituation(e.target.value)} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-[#47A88D] focus:border-[#47A88D] h-16"></textarea>
        </Card>
        <Card title="2. Behavior (B)" icon={Briefcase}>
          <p className="text-gray-700 text-sm mb-2">What did the person <em>do</em> or <em>say</em>? (Must be observable, not a judgment)</p>
          <textarea value={behavior} onChange={(e) => setBehavior(e.target.value)} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-[#47A88D] focus:border-[#47A88D] h-16"></textarea>
        </Card>
        <Card title="3. Impact (I)" icon={Briefcase}>
          <p className="text-gray-700 text-sm mb-2">What was the consequence of the behavior on the business, the team, or you?</p>
          <textarea value={impact} onChange={(e) => setImpact(e.target.value)} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-[#47A88D] focus:border-[#47A88D] h-16"></textarea>
        </Card>
      </div>
    
      <Tooltip
        content={hasGeminiKey() 
            ? "Sends your draft to the AI Coach for deep critique." 
            : "AI Critique is unavailable. Check App Settings for configuration."
        }
      >
        <Button onClick={generateCritique} disabled={isGenerating || !situation || !behavior || !impact} className="w-full md:w-auto">
            {isGenerating ? (
            <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Refining...
            </div>
            ) : 'Refine Feedback'}
        </Button>
      </Tooltip>
    
      {critiqueHtml && (
        <Card title="AI Coach Critique & Refinement" className="mt-8 bg-[#002E47]/10 border border-[#002E47]/20 rounded-3xl">
          <div className="prose prose-xl max-w-none prose-h1:text-[#002E47] prose-h1:text-4xl prose-h2:text-[#002E47] prose-h3:text-[#47A88D] prose-headings:font-extrabold prose-p:my-6 prose-ul:space-y-3 prose-li:text-base prose-ul:list-disc">
            <div dangerouslySetInnerHTML={{ __html: critiqueHtml }} />
          </div>
           {refinedFeedback && hasGeminiKey() && (
              <Button onClick={handleCommitmentCreation} className="mt-6 w-full bg-[#349881] hover:bg-[#47A88D]">
                 <PlusCircle className='w-5 h-5 mr-2' /> Turn Refined Feedback into Daily Commitment
              </Button>
           )}
           {!hasGeminiKey() && (
                <p className='text-xs text-[#E04E1B] mt-4 font-semibold'>AI Integration is currently disabled. See App Settings to enable AI-powered commitment creation.</p>
           )}
        </Card>
      )}
    </div>
    
    
    );
};

// --- ACTIVE LISTENING VIEW ---
const ActiveListeningView = ({ setCoachingLabView }) => {
    const { callSecureGeminiAPI, hasGeminiKey, navigate } = useAppServices();

    const [responses, setResponses] = useState({ q1: '', q2: '' });
    const [critique, setCritique] = useState(null);
    const [critiqueHtml, setCritiqueHtml] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    
    const handleChange = (e) => {
        setResponses({ ...responses, [e.target.name]: e.target.value });
        setCritique(null);
        setCritiqueHtml('');
    };
    
    useEffect(() => {
        if (!critique) { setCritiqueHtml(''); return; }
        (async () => setCritiqueHtml(await mdToHtml(critique)))();
    }, [critique]);
    
    const handleSubmit = async () => {
        if (!responses.q1.trim() || !responses.q2.trim()) {
            alert("Please provide a response for both prompts before submitting for coach feedback.");
            return;
        }

        setIsGenerating(true);
        setCritique(null);

        if (!hasGeminiKey()) {
            setCritique("## AI Critique Unavailable\n\n**ERROR**: The Gemini API Key is missing. Please check App Settings.");
            setIsGenerating(false);
            return;
        }

        const userQuery = `Critique the following active listening responses from a manager:

**Prompt 1 (The Paraphrase):** The employee said, "I feel overwhelmed by the deadlines and the number of meetings this week." The manager's draft paraphrase is: "${responses.q1.trim()}"

**Prompt 2 (Open-Ended Inquiry):** The situation is a team setback and defeat. The manager's draft open-ended question is: "${responses.q2.trim()}"

Critique Guidelines (Use Markdown):
1.  **Paraphrase Critique (## The Paraphrase Audit):** Assess if the manager successfully confirmed understanding without adding judgment or offering a solution. Suggest a better, more concise option if needed.
2.  **Question Critique (## The Inquiry Audit):** Assess if the question is truly open-ended (not answerable with Yes/No) and if it successfully invites vulnerability and insight in a safe way. Provide a refined, more empathetic alternative.
3.  **Overall Takeaway (### Core Skill Focus):** Give one final, actionable coaching point.
`;

        const systemPrompt = "You are an executive coach specializing in developing empathetic and effective active listening skills. Your critique must be objective, use clear Markdown formatting, and provide concrete, actionable alternatives for improvement.";

        try {
            const payload = {
                contents: [{ role: "user", parts: [{ text: userQuery }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
            };

            const result = await callSecureGeminiAPI(payload);
            const aiText = result?.candidates?.[0]?.content?.parts?.[0]?.text || "Could not generate critique. Please try again.";
            setCritique(aiText);

        } catch (error) {
            console.error("Gemini API Error:", error);
            setCritique("An error occurred while connecting to the AI coach. Please check your network connection.");
        } finally {
            setIsGenerating(false);
        }


    };

    return (
    <div className="p-8">
    <h1 className="text-3xl font-extrabold text-[#002E47] mb-4">Active Listening & Reflection Prompts</h1>
    <p className="text-lg text-gray-600 mb-6 max-w-3xl">Active listening means validating emotion and confirming understanding before attempting to solve the problem. Practice the two pillars below to build empathy and psychological safety in high-stakes conversations.</p>
    <Button onClick={() => setCoachingLabView('coaching-lab-home')} variant="outline" className="mb-8">
    <ArrowLeft className="w-5 h-5 mr-2" /> Back to Coaching Lab
    </Button>
    
      <div className="space-y-8">
        <Card title="Reflection 1: The Paraphrase (Confirming Understanding)" icon={Mic}>
          <p className="text-gray-700 mb-3">**Scenario:** A direct report just told you, "I feel overwhelmed by the deadlines and the number of meetings this week." How would you **paraphrase** their statement back to them? <span className='font-semibold text-[#47A88D]'>(Rule: Must not offer a solution or advice.)</span></p>
          <textarea name="q1" value={responses.q1} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-[#47A88D] focus:border-[#47A88D] h-24" placeholder="Draft your paraphrased response here..."></textarea>
        </Card>
    
        <Card title="Reflection 2: Open-Ended Inquiry (Inviting Depth)" icon={Mic}>
          <p className="text-gray-700 mb-3">**Scenario:** Your team has just experienced a major setback on a flagship project. They are visibly defeated. What **open-ended question** would you use to invite them to share their feelings and insights, showing empathy and psychological safety?</p>
          <textarea name="q2" value={responses.q2} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-[#47A88D] focus:border-[#47A88D] h-24" placeholder="Draft your open-ended question here..."></textarea>
        </Card>
      </div>
    
        <Tooltip
            content={hasGeminiKey() 
                ? "Submits your responses to the AI Coach for structured critique." 
                : "Requires Gemini API Key to run. Check App Settings."
            }
        >
            <Button onClick={handleSubmit} disabled={isGenerating || !responses.q1.trim() || !responses.q2.trim()} className="mt-10 w-full md:w-auto">
                {isGenerating ? (
                    <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Auditing Listening Skills...
                    </div>
                ) : 'Submit for Coach Feedback'}
            </Button>
        </Tooltip>
      
      {critiqueHtml && (
        <Card title="Active Listening Auditor Feedback" icon={CheckCircle} className="mt-8 bg-[#002E47]/10 border border-[#002E47]/20 rounded-3xl">
          <div className="prose max-w-none prose-h2:text-[#002E47] prose-h2:border-b prose-h2:pb-2 prose-h3:text-[#47A88D] prose-p:text-gray-700 prose-ul:space-y-2">
            <div dangerouslySetInnerHTML={{ __html: critiqueHtml }} />
          </div>
        </Card>
      )}
    </div>
    
    
    );
};

// --- MAIN COACHING LAB ROUTER ---
export default function CoachingLabScreen() {
    const { navigate } = useAppServices();

    const [view, setView] = useState('coaching-lab-home');
    const [selectedScenario, setSelectedScenario] = useState(null);

    const renderView = () => {
        const viewProps = { setCoachingLabView: setView, setSelectedScenario };

        switch (view) {
            case 'scenario-library':
                return <ScenarioLibraryView {...viewProps} />;
            case 'scenario-prep':
                return <ScenarioPreparationView scenario={selectedScenario} setCoachingLabView={setView} />;
            case 'role-play':
                return selectedScenario 
                    ? <RolePlayView scenario={selectedScenario} setCoachingLabView={setView} /> 
                    : <ScenarioLibraryView {...viewProps} />;
            case 'feedback-prep':
                return <FeedbackPrepToolView setCoachingLabView={setView} />;
            case 'active-listening':
                return <ActiveListeningView setCoachingLabView={setView} />;
            case 'coaching-lab-home':
            default:
                return (
                    <div className="p-8">
                        <h1 className="text-3xl font-extrabold text-[#002E47] mb-4">Coaching & Crucial Conversations Lab</h1>
                        <p className="text-lg text-gray-600 mb-8 max-w-3xl">Practice key leadership interactions using guided tools and receive real-time AI critique to sharpen your skills.</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <Card title="Scenario Library" icon={Users} onClick={() => setView('scenario-library')} className="border-l-4 border-[#47A88D] rounded-3xl">
                                <p className="text-gray-700 text-sm">Select a scenario to start a fully interactive AI role-play session. Practice maneuvering deflection and emotion.</p>
                                <div className="mt-4 text-[#47A88D] font-semibold flex items-center">
                                    Launch Library &rarr;
                                </div>
                            </Card>
                            <Card title="Feedback Prep Tool (SBI)" icon={Briefcase} onClick={() => setView('feedback-prep')} className="border-l-4 border-[#002E47] rounded-3xl">
                                <p className="text-gray-700 text-sm">Draft difficult feedback using the SBI model and get instant, professional critique from our AI Coach on objectivity and impact.</p>
                                <div className="mt-4 text-[#002E47] font-semibold flex items-center">
                                    Launch Prep Tool &rarr;
                                </div>
                            </Card>
                            <Card title="Active Listening Prompts" icon={Mic} onClick={() => setView('active-listening')} className="border-l-4 border-[#47A88D] rounded-3xl">
                                <p className="text-gray-700 text-sm">Exercises to develop empathy, use paraphrasing, and ask powerful, open-ended questions to drive depth in conversations.</p>
                                <div className="mt-4 text-[#47A88D] font-semibold flex items-center">
                                    Launch Exercises &rarr;
                                </div>
                            </Card>
                        </div>
                    </div>
                );
        }
    };

    return renderView();
}
