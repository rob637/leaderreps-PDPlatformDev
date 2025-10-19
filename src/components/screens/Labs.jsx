/* =========================================================
   CORRECTED FILE: Labs.jsx
   FIX: Encapsulated mock API call logic and all hook calls 
   within components/functions to prevent TDZ error.
========================================================= */
/* eslint-disable no-console */
import React, { useState, useEffect, useMemo, useCallback, useLayoutEffect } from 'react';
import { AlertTriangle, ArrowLeft, BarChart3, BookOpen, Briefcase, CheckCircle, Clock, CornerRightUp, Cpu, Eye, HeartPulse, Icon, Info, Lightbulb, Mic, Play, PlusCircle, Send, ShieldCheck, Star, Target, TrendingUp, Users, X, Zap, TrendingDown } from 'lucide-react';
/* =========================================================
   MOCK APP SERVICES (CLEANED)
========================================================= */
const GEMINI_MODEL = 'gemini-2.5-flash-preview-09-2025';

//  Mock array to store completed practice sessions (for PracticeLogView)
const MOCK_PRACTICE_SESSIONS = [
    { id: 1, title: 'The Underperformer', date: 'Oct 15, 2025', score: 88, takeaway: 'Focus on Deep Validation.', difficulty: 'Medium' },
    { id: 2, title: 'The Boundary Pusher', date: 'Oct 10, 2025', score: 72, takeaway: 'Improve objective Behavior statement.', difficulty: 'High' },
];

// FIX: This function remains as a mock utility
const MOCK_API_RESPONSE_LOGIC = (payload, model) => {
    const userQuery = payload.contents[0].parts[0].text;
    
    // --- ENHANCED ACTIVE LISTENING CRITIQUE MOCK LOGIC ---
    if (userQuery.includes("Critique the following active listening responses")) {
        const paraphraseMatch = userQuery.match(/The manager's draft paraphrase is: \"(.*?)\"/);
        const inquiryMatch = userQuery.match(/The manager's draft open-ended question is: \"(.*?)\"/);
        
        const userParaphrase = paraphraseMatch ? paraphraseMatch[1].trim() : 'a generic paraphrase';
        const userInquiry = inquiryMatch ? inquiryMatch[1].trim() : 'a generic question';
        
        const paraphraseScore = userParaphrase.toLowerCase().includes('so you are saying') ? 95 : 75;
        const inquiryScore = userInquiry.includes('?') && !userInquiry.toLowerCase().includes('you agree') ? 88 : 65;

        const pFeedback = paraphraseScore > 80 
            ? `Your paraphrase, **"${userParaphrase}"**, is **Excellent**. It successfully reflects the emotion and facts without offering advice.`
            : `Your paraphrase, **"${userParaphrase}"**, is **Fair**. It introduced judgment. A better option would be: "So, the heavy deadline load is making you feel overwhelmed."`;

        const iFeedback = inquiryScore > 80
            ? `Your question, **"${userInquiry}"**, is **Strong**. It is open-ended and invites deeper insight.`
            : `Your question, **"${userInquiry}"**, is **Weak**. It can be answered with a simple "yes" or "no". Refine it to start with "What" or "How."`;

        return { candidates: [{ content: { parts: [{ text: 
            `## The Paraphrase Audit (Score: ${paraphraseScore}/100)\n\n${pFeedback}\n\n## The Inquiry Audit (Score: ${inquiryScore}/100)\n\n${iFeedback}\n\n### Core Skill Focus\n\nPractice pausing for a full three seconds after the employee speaks. The space is often more powerful than the words.` 
        }] } }] };

    } else if (userQuery.includes("Audit the Rewritten Response")) {
        const score = Math.floor(Math.random() * 20) + 75;
        const feedback = score > 85 ? "Exceptional! Your rewrite incorporated validation and avoided all judgmental language. This is ready for a real conversation." : "Strong attempt, but your response still contained a passive solution. Remember to focus on confirmation only.";
        return { candidates: [{ content: { parts: [{ text: `## Correction Audit: ${score}/100\n\n**Analysis:** ${feedback}\n\n### Final Score:\n\nYour corrected response achieved a score of ${score}/100, demonstrating strong self-correction ability.` }] } }] };
    } else if (userQuery.includes("Analyze the following role-play dialogue")) {
         return { candidates: [{ content: { parts: [{ text: `## Overall Score: 88/100\n\n**Assessment:** Your manager established a clear, non-judgmental tone early in the conversation.\n\n### SBI Effectiveness (Score: 92/100)\n\n**Assessment:** Excellent adherence to objective facts.\n\n### Active Listening & Empathy (Score: 78/100)\n\n**Assessment:** You missed an opportunity to validate Alex's defensive statement. \n\n### Resolution Drive (Score: 88/100)\n\n**Assessment:** Clear action plan established.\n\n### Next Practice Point\n\nFocus on **Deep Validation**. When Alex shows emotion, practice saying, "I hear that you feel that this situation is unfair. Tell me more about what specifically made it feel unfair." This builds a deeper connection before moving to problem-solving.` }] } }] };
    } else if (userQuery.includes("Critique and refine this SBI feedback draft")) {
         return { candidates: [{ content: { parts: [{ text: `The draft is strong! **Strength:** The Behavior is highly specific—"interrupted Sarah three times." **Area for Improvement:** The Impact could be tied more directly to the business. \n\n**Refined Feedback**: S: During the Q3 Review meeting with the leadership team last Friday. B: You interrupted Sarah three times while she was presenting her analysis on customer churn data. I: This caused Sarah to lose her train of thought and delayed our ability to fully analyze critical churn data before the board meeting.` }] } }] };
    } else if (userQuery.includes("The best reply to Alex's last defense")) {
         return { candidates: [{ content: { parts: [{ text: "The best reply to Alex's last defense ('It's not fair') would have been a **paraphrase/validation statement** before asking a follow-up question. For example: 'I hear that you feel a sense of unfairness about the situation. Can you tell me what specific resources you felt were missing?' This validates the emotion without agreeing with the premise." }] } }] };
    } else if (userQuery.includes("Generate a 1-sentence Priming Nudge")) {
         return { candidates: [{ content: { parts: [{ text: "High stress compromises neutrality. Your chosen mindset is key; start by taking three deep breaths before speaking to Alex. Prioritize listening over planning your reply." }] } }] };
    } else if (userQuery.includes("Perform a Reflective Analysis")) {
        return { candidates: [{ content: { parts: [{ text: `## Reflection Audit: High Insight\n\n**Analysis:** Your reflection accurately pinpoints 'missing the validation phase' as the core problem. Your stated plan to 'use a reflective pause' directly addresses the Next Practice Point.\n\n**Confidence Rating:** Excellent (95%). This shows strong capacity for self-correction. Focus on immediate practice to cement this learning.` }] } }] };
    } else if (userQuery.includes("Base Scenario:")) {
        return { candidates: [{ content: { parts: [{ text: 
            `## Generated Scenario\n\n### Title: The High-Stakes Financial Audit\n\n### Description: A high-potential team member is consistently missing deadlines due to distraction, and is currently under pressure from a difficult family situation. This adaptation forces you to handle **personal boundaries and deflection** simultaneously.\n\n### Persona: The Emotional Reactor (Highly Resistant)` 
        }] } }] };
    }
    
    const defaultResponse = userQuery.includes("Alex") ? 
        "I am finding this conversation difficult, manager. I need more empathy before I can commit to anything." : 
        "I'm not sure how to respond to that. Can you focus on the facts?";

    return { candidates: [{ content: { parts: [{ text: defaultResponse }] } }] };
};

// FIX: The actual mock hook definition should be simple and return the necessary functions.
// We must *not* call callSecureGeminiAPI() inside the mock itself, but only return a reference to it.
const useAppServices = () => ({
  commitmentData: { active_commitments: [], history: [], reflection_journal: '' },
  updateCommitmentData: async (data) => new Promise(resolve => setTimeout(resolve, 300)),
  planningData: { okrs: [], vision: '', mission: '' },
  navigate: (view, params) => console.log(`Navigating to ${view} with params:`, params),
  // FIX: This returns the MOCK_API_RESPONSE_LOGIC function reference, which is safe.
  callSecureGeminiAPI: async (payload) => MOCK_API_RESPONSE_LOGIC(payload), 
  hasGeminiKey: () => true,
  GEMINI_MODEL: GEMINI_MODEL,
});
// FIX: We must use the original name (useAppServices) for the components to access it, 
// or use the original name and call it inside the component functions.
const useAppServicesOriginal = useAppServices;


/* =========================================================
   HIGH-CONTRAST PALETTE
========================================================= */
const COLORS = {
  BG: '#FFFFFF',
  SURFACE: '#FFFFFF',
  BORDER: '#1F2937',
  SUBTLE: '#E5E7EB',
  TEXT: '#0F172A',
  MUTED: '#4B5563',
  NAVY: '#0B3B5B',
  TEAL: '#219E8B',
  BLUE: '#2563EB',
  ORANGE: '#E04E1B',
  GREEN: '#10B981',
  AMBER: '#F59E0B',
  RED: '#EF4444',
  LIGHT_GRAY: '#F9FAFB'
};

const COMPLEXITY_MAP = {
  Low:    { label: 'Novice',       hex: COLORS.GREEN, icon: CheckCircle },
  Medium: { label: 'Intermediate', hex: COLORS.AMBER, icon: AlertTriangle },
  High:   { label: 'Expert',       hex: COLORS.RED,   icon: Target },
};

/* =========================================================
   UI Components (CLEANED)
========================================================= */
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

const Card = ({ children, title, icon: Icon, className = '', onClick, accent = 'ORANGE' }) => {
  const interactive = !!onClick;
  const Tag = interactive ? 'button' : 'div';
  const accentColor = COLORS[accent] || COLORS.ORANGE;
  return (
    <Tag
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      className={`relative p-6 rounded-2xl border-2 shadow-xl hover:shadow-2xl transition-all duration-300 text-left ${className}`}
      style={{
        background: 'linear-gradient(180deg,#FFFFFF,#F9FAFB)',
        borderColor: COLORS.SUBTLE,
        color: COLORS.TEXT
      }}
      onClick={onClick}
    >
      <span style={{
        position:'absolute', top:0, left:0, right:0, height:6,
        background: accentColor,
        borderTopLeftRadius:14, borderTopRightRadius:14
      }} />

      {Icon && (
        <div className="w-10 h-10 rounded-lg flex items-center justify-center border mb-3"
             style={{ borderColor: COLORS.SUBTLE, background: '#F3F4F6' }}>
          <Icon className="w-5 h-5" style={{ color: COLORS.TEAL }} />
        </div>
      )}
      {title && <h2 className="text-xl font-extrabold mb-2" style={{ color: COLORS.NAVY }}>{title}</h2>}
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
                <div className="absolute z-10 w-64 p-3 -mt-2 -ml-32 text-xs text-white bg-[#0B3B5B] rounded-lg shadow-lg bottom-full left-1/2 transform translate-x-1/2">
                    {content}
                    <div className="absolute left-1/2 transform -translate-x-1/2 bottom-[-4px] w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[#0B3B5B]"></div>
                </div>
            )}
        </div>
    );
};

const mdToHtml = async (markdown) => {
  let html = markdown;
  
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-extrabold text-[#47A88D] mt-4 mb-2">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold text-[#0B3B5B] border-b pb-1 mb-3 mt-6">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-3xl font-extrabold text-[#E04E1B] mb-4">$1</h1>');

  html = html.replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>');
  
  html = html.replace(/^\* (.*$)/gim, '<li class="text-sm text-gray-700">$1</li>');
  html = html.replace(/(\n<li.*<\/li>)+/gim, '<ul class="list-disc list-inside space-y-1 mb-4">$1</ul>');

  html = html.replace(/([^<]+)/gim, (match) => {
      if (match.trim() === '' || /<|>/g.test(match)) return match;
      return `<p class="text-gray-700 text-sm mb-4">${match.trim()}</p>`;
  });
  
  return html;
};


const Message = ({ sender, text, isAI }) => (
  <div className={`flex mb-4 ${isAI ? 'justify-start' : 'justify-end'}`}>
    <div
      className={`p-4 max-w-lg rounded-xl shadow-md ${
        isAI
          ? 'bg-[#0B3B5B]/10 text-[#0B3B5B] rounded-tl-none border border-[#0B3B5B]/20'
          : 'bg-[#219E8B] text-white rounded-tr-none'
      }`}
    >
      <strong className="font-bold text-sm">{sender}:</strong>
      <p className="text-sm mt-1">{text}</p>
    </div>
  </div>
);

/* =========================================================
   COACHING LAB VIEWS
========================================================= */

const FollowUpCoach = ({ history, setView }) => {
    const { callSecureGeminiAPI, hasGeminiKey, GEMINI_MODEL } = useAppServicesOriginal();
    const [followUpHistory, setFollowUpHistory] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const followUpRef = React.useRef(null);

    const fullConversation = history.map(msg => `${msg.sender}: ${msg.text}`).join('\n');

    useEffect(() => {
        if (followUpRef.current) {
            followUpRef.current.scrollTop = followUpRef.current.scrollHeight;
        }
    }, [followUpHistory]);

    const sendFollowUpQuery = async () => {
        if (!inputText.trim() || isGenerating) return;

        const userQuery = inputText.trim();
        const newUserMessage = { sender: 'You', text: userQuery, isAI: false };
        const newHistory = [...followUpHistory, newUserMessage];
        setFollowUpHistory(newHistory);
        setInputText('');
        setIsGenerating(true);

        const systemInstruction = `You are a post-session AI Executive Coach. Your focus is analyzing the provided conversation history and answering the user's specific follow-up questions about their performance. Do not role-play. Keep responses brief, direct, and actionable, referencing the provided history.

Conversation History:
---
${fullConversation}
---
`;
        const currentChat = newHistory.map(msg => ({ 
            role: msg.isAI ? "model" : "user", 
            parts: [{ text: msg.text }] 
        }));

        try {
            const payload = {
                contents: currentChat,
                systemInstruction: { parts: [{ text: systemInstruction }] },
                model: GEMINI_MODEL,
            };

            const result = await callSecureGeminiAPI(payload);
            const aiText = result?.candidates?.[0]?.content?.parts?.[0]?.text || "Coach unavailable. Please try your question again.";

            setFollowUpHistory(prev => [...prev, { sender: 'Coach AI', text: aiText, isAI: true }]);
        } catch (error) {
            console.error("Follow-up AI Error:", error);
            setFollowUpHistory(prev => [...prev, { sender: 'Coach AI', text: "A connection error occurred. Try again.", isAI: true }]);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Card title="AI Follow-Up Coaching (Deep Reflection)" icon={Lightbulb} className='mt-8 bg-[#0B3B5B]/10 border-2 border-[#0B3B5B]/20'>
            <p className='text-sm text-gray-700 mb-4'>Ask the AI Coach for specific alternatives, missed opportunities, or clarification on your score.</p>
            
            <div ref={followUpRef} className='h-64 overflow-y-auto p-3 bg-white rounded-xl border border-gray-300 mb-3'>
                 {followUpHistory.length === 0 ? (
                    <div className='text-gray-500 text-sm italic'>
                        <p className='mb-2'>**Example Questions:**</p>
                        <p> - "What was the most empathetic thing I said?"</p>
                        <p> - "How should I have responded to Alex's defensive statement in turn 3?"</p>
                    </div>
                ) : (
                    followUpHistory.map((msg, index) => (
                        <Message key={index} sender={msg.sender} text={msg.text} isAI={msg.isAI} />
                    ))
                )}
                {isGenerating && (
                    <div className='flex justify-start mb-4'>
                        <div className='p-4 max-w-lg rounded-xl bg-[#0B3B5B]/10 text-gray-500 rounded-tl-none'>
                            <div className="animate-pulse text-sm">Coach is analyzing...</div>
                        </div>
                    </div>
                )}
            </div>

            <div className='flex space-x-3'>
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendFollowUpQuery()}
                    placeholder="Ask your coach for feedback..."
                    className="flex-1 p-3 border border-gray-300 rounded-xl focus:ring-[#219E8B] focus:border-[#219E8B]"
                    disabled={isGenerating || !hasGeminiKey()}
                />
                <Button onClick={sendFollowUpQuery} disabled={!inputText.trim() || isGenerating || !hasGeminiKey()} className='px-4 py-3'>
                    <Send className='w-5 h-5'/>
                </Button>
            </div>
        </Card>
    );
};

const RolePlayCritique = ({ history, setView, preparedSBI, scenario, difficultyLevel }) => {
    // FIX: Access hooks inside component
    const { callSecureGeminiAPI, hasGeminiKey, navigate, updateCommitmentData, GEMINI_MODEL } = useAppServicesOriginal(); 

    const [critique, setCritique] = useState('');
    const [critiqueHtml, setCritiqueHtml] = useState('');
    const [isGenerating, setIsGenerating] = useState(true);
    const [scoreBreakdown, setScoreBreakdown] = useState(null);
    const [keyTakeaway, setKeyTakeaway] = useState(null);

    const [userReflection, setUserReflection] = useState('');
    const [auditResult, setAuditResult] = useState(null);
    const [isAuditing, setIsAuditing] = useState(false);


    const extractScore = (critiqueText, auditName) => {
        const regex = new RegExp(`${auditName}.*?\\(Score:\\s*(\\d+)/100\\)`, 'i');
        const match = critiqueText.match(regex);
        return match ? parseInt(match[1], 10) : null;
    };

    const extractKeyTakeaway = (critiqueText) => {
        const regex = /### Next Practice Point\s*\n\n(.*?)(?:\n\n|\Z)/si;
        const match = critiqueText.match(regex);
        if (match && match[1]) {
            return match[1].trim().replace(/\*\*/g, '').replace(/(\r\n|\n|\r)/gm, " ");
        }
        return "Refine empathy and focus on measurable outcomes in your next practice session.";
    };

    // FIX: Save session data to mock history for PracticeLogView
    useEffect(() => {
        if (scoreBreakdown?.overall) {
            const sessionData = {
                id: String(Date.now()),
                title: scenario.title,
                date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                score: scoreBreakdown.overall,
                takeaway: keyTakeaway,
                difficulty: difficultyLevel < 25 ? 'Low' : difficultyLevel < 75 ? 'Medium' : 'High',
            };
            MOCK_PRACTICE_SESSIONS.push(sessionData);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scoreBreakdown?.overall]); 


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

            const systemInstruction = `You are a Senior Executive Coaching Auditor. Analyze the following conversation between a Manager ('You') and their report ('Alex'). Provide a clear score (out of 100) and structured feedback in Markdown, focusing on professional leadership skills.
                
                **Critique Structure:**
                1.  **Overall Score (## Overall Score: X/100):** Provide a score out of 100 based on the manager's performance.
                2.  **SBI Effectiveness (### SBI Effectiveness (Score: X/100)):** Did the manager effectively stick to objective facts (Situation/Behavior) and articulate the impact (Impact)? Provide a score.
                3.  **Active Listening & Empathy (### Active Listening & Empathy (Score: Y/100)):** Did the manager use paraphrasing, open-ended questions, or validate Alex's emotions? Provide a score.
                4.  **Resolution Drive (### Resolution Drive (Score: Z/100)):** Did the manager guide the conversation toward a measurable commitment or next step? Provide a score.
                5.  **Key Takeaway (### Next Practice Point):** Provide one specific, actionable habit for the manager to work on.`;

            const userQuery = `Analyze the following role-play dialogue. The manager's goal was to address performance/behavior issues with Alex:\n\n${conversationText}`;

            try {
                const payload = {
                    contents: [{ role: "user", parts: [{ text: userQuery }] }],
                    systemInstruction: { parts: [{ text: systemInstruction }] },
                    model: GEMINI_MODEL,
                };

                const result = await callSecureGeminiAPI(payload);
                const aiText = result?.candidates?.[0]?.content?.parts?.[0]?.text || "Critique generation failed. Check API connection.";
                
                const overallScore = extractScore(aiText, 'Overall Score');
                const sbiScore = extractScore(aiText, 'SBI Effectiveness');
                const empathyScore = extractScore(aiText, 'Active Listening & Empathy');
                const resolutionScore = extractScore(aiText, 'Resolution Drive');
                const takeaway = extractKeyTakeaway(aiText);

                setScoreBreakdown({
                    overall: overallScore,
                    sbi: sbiScore,
                    empathy: empathyScore,
                    resolution: resolutionScore,
                });
                setKeyTakeaway(takeaway);
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

    const handleCreateCommitment = async () => {
        if (!keyTakeaway || !updateCommitmentData) return;
        
        const commitmentText = `Practice the skill: "${keyTakeaway}" (From ${scenario.title} Role-Play).`;
        
        const newCommitment = { 
            id: String(Date.now()),
            text: commitmentText, 
            status: 'Pending', 
            isCustom: true, 
            linkedGoal: 'Improve Feedback & Coaching Skills',
            linkedTier: 'T4',
            targetColleague: 'Self-Directed Practice',
        };

        try {
            await updateCommitmentData(data => {
                const existingCommitments = data?.active_commitments || [];
                return { active_commitments: [...existingCommitments, newCommitment] };
            });
            console.info("Commitment created successfully!");
            navigate('daily-practice', { 
                initialGoal: newCommitment.linkedGoal, 
                initialTier: newCommitment.linkedTier 
            }); 
        } catch (e) {
            console.error("Failed to save new commitment:", e);
            console.warn("Commitment saving failed. Check if updateCommitmentData is available.");
        }
    };

    const handleReflectionAudit = async () => {
        if (!userReflection.trim() || !critique || isAuditing) return;

        setIsAuditing(true);
        setAuditResult(null);

        const systemInstruction = `You are a world-class Executive Coach assessing a user's capacity for self-correction. Analyze the user's reflection against the provided AI critique. Determine if the user's reflection correctly identifies the root cause of their low score (if applicable) and if their proposed next steps align with the 'Next Practice Point' from the critique. The output MUST be a clear Markdown response.`;

        const userQuery = `Perform a Reflective Analysis.
        
        ---
        **AI Critique (The Ground Truth):**
        ${critique}
        ---
        
        **User's Reflection on Critique:**
        ${userReflection.trim()}
        
        Provide your analysis focusing on:
        1. Analysis: Did the user identify the correct problem?
        2. Alignment: Does the user's plan match the critique's 'Next Practice Point'?
        3. Confidence Rating: Give a final rating (e.g., Excellent (95%), Fair (65%)).
        `;

        try {
            const payload = {
                contents: [{ role: "user", parts: [{ text: userQuery }] }],
                systemInstruction: { parts: [{ text: systemInstruction }] },
                model: GEMINI_MODEL,
            };
            const result = await callSecureGeminiAPI(payload);
            const aiText = result?.candidates?.[0]?.content?.parts?.[0]?.text || "Reflection audit failed.";
            setAuditResult(aiText);
        } catch (e) {
            console.error("Reflection Audit Error:", e);
            setAuditResult("Reflection audit failed due to API error.");
        } finally {
            setIsAuditing(false);
        }
    };

    const ScoreBar = ({ title, score }) => {
        const barColor = score > 85 ? COLORS.GREEN : score > 70 ? COLORS.AMBER : COLORS.RED;
        const barColorClass = score > 85 ? 'text-green-500' : score > 70 ? 'text-yellow-500' : 'text-red-500';
        return (
            <div className='mb-3'>
                <div className='flex justify-between items-center text-sm font-semibold text-[#0B3B5B]'>
                    <span>{title}</span>
                    <span className={`text-lg font-extrabold ${barColorClass}`}>{score}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                        className={`h-2 rounded-full transition-all duration-700`} 
                        style={{ width: `${score}%`, backgroundColor: barColor }}
                    ></div>
                </div>
            </div>
        );
    };

    if (isGenerating) {
        return (
            <Card title="Generating Session Critique..." icon={Zap} className="mt-8 bg-[#219E8B]/10 border-2 border-[#219E8B]">
                <div className="flex flex-col items-center justify-center h-40">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-[#219E8B] mb-4"></div>
                    <p className="text-[#219E8B] font-medium">Analyzing dialogue history and scoring performance...</p>
                </div>
            </Card>
        );
    }

    const difficultyText = difficultyLevel < 25 ? 'Low (Collaborative)' : difficultyLevel < 75 ? 'Medium (Defensive)' : 'High (Resistant)';
    const difficultyMultiplier = difficultyLevel / 100 + 1;
    const globalAverage = Math.round(75 + (difficultyMultiplier * 5)); 
    const benchmarkDifference = (scoreBreakdown?.overall || 0) - globalAverage;


    return (
        <div className='space-y-6'>
            <div className='grid lg:grid-cols-4 gap-6'>
                {/* Overall Score Card */}
                <Card title="Overall Performance" icon={Star} className='lg:col-span-2' accent="NAVY">
                    <p className='text-sm text-gray-300 mb-2'>Final Audit Score</p>
                    <div className={`text-6xl font-extrabold ${scoreBreakdown?.overall > 85 ? 'text-green-500' : 'text-yellow-500'}`}>
                        {scoreBreakdown?.overall || '--'} / 100
                    </div>
                    <div className='mt-4 pt-4 border-t border-gray-200'>
                        <p className='text-sm font-semibold text-[#0B3B5B]'>Key Takeaway:</p>
                        <p className='text-sm text-gray-700'>{keyTakeaway || 'Review the full critique.'}</p>
                    </div>
                </Card>

                {/* Adaptive Scenario Tracker */}
                <Card title="Adaptive Session Metrics" icon={Target} className='lg:col-span-2' accent="ORANGE">
                    <p className='text-sm font-semibold text-[#0B3B5B] mb-2'>Tension Multiplier:</p>
                    <div className='flex justify-between items-center'>
                        <span className='text-3xl font-extrabold text-[#E04E1B]'>{difficultyMultiplier.toFixed(1)}X</span>
                        <span className='text-sm text-gray-600 font-medium'>({difficultyText})</span>
                    </div>
                    <div className='mt-4 pt-4 border-t border-gray-200'>
                        <p className='text-sm font-semibold text-[#0B3B5B]'>Difficulty Grade:</p>
                        <span className='text-xl font-extrabold text-[#219E8B]'>
                            {difficultyLevel < 25 ? 'C - Standard' : difficultyLevel < 75 ? 'B - Challenging' : 'A - Executive Level'}
                        </span>
                    </div>
                </Card>
            </div>

            {/* Skill Breakdown Heatmap & Benchmarking */}
            <Card title="Skill Breakdown Heatmap & Benchmarking" icon={BarChart3} className=''>
                {scoreBreakdown?.sbi !== null ? (
                    <>
                        <div className className={`p-3 mb-4 rounded-xl shadow-inner text-center font-semibold border-l-4 ${benchmarkDifference >= 0 ? 'bg-green-100 border-green-500 text-green-700' : 'bg-red-100 border-red-500 text-[#E04E1B]'}`}>
                            <span className='text-lg'>
                                Global Benchmark: {globalAverage}%
                            </span>
                            <p className='text-sm mt-1'>
                                You scored **{Math.abs(benchmarkDifference)} points {benchmarkDifference >= 0 ? 'ABOVE' : 'BELOW'}** the average for this difficulty level.
                            </p>
                        </div>

                        <div className='space-y-4'>
                            <ScoreBar title="SBI Effectiveness (Clarity & Focus)" score={scoreBreakdown.sbi} />
                            <ScoreBar title="Active Listening & Empathy" score={scoreBreakdown.empathy} />
                            <ScoreBar title="Resolution Drive (Bias for Action)" score={scoreBreakdown.resolution} />
                        </div>
                    </>
                ) : (
                    <p className='text-sm text-gray-500'>Score breakdown is not available for this session.</p>
                )}
            </Card>
            
            {/* Full Critique and Accountability Actions */}
            <Card title="AI Coach Full Audit" icon={CheckCircle} className="bg-[#FCFCFA] border-4 border-[#219E8B]">
                <div className="prose max-w-none prose-h2:text-4xl prose-h2:text-[#E04E1B] prose-h2:font-extrabold prose-h3:text-[#219E8B] prose-p:text-gray-700 prose-ul:space-y-2">
                    <div dangerouslySetInnerHTML={{ __html: critiqueHtml }} />
                </div>
                
                {/* Reflective Analysis Section */}
                <div className='mt-8 pt-6 border-t border-gray-200'>
                    <h3 className='text-xl font-bold text-[#0B3B5B] mb-3 flex items-center'><BookOpen className='w-5 h-5 mr-2 text-[#E04E1B]'/> Post-Critique Reflective Analysis</h3>
                    <p className='text-sm text-gray-700 mb-3'>Write a brief reflection on the critique: **What was your core mistake, and how will you correct it in your next session?**</p>
                    
                    <textarea 
                        value={userReflection}
                        onChange={(e) => {setUserReflection(e.target.value); setAuditResult(null);}}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-[#E04E1B] focus:border-[#E04E1B] h-32 mb-3" 
                        placeholder="My reflection: I realize I got defensive when Alex deflected, and I failed to pause and paraphrase. Next time, I will start with a validation phrase, 'I hear that you feel unfairness,' before redirecting to the facts."
                        disabled={isAuditing}
                    />
                    
                    {auditResult && (
                        <Card title="Your Reflection Audit" icon={Eye} className='bg-white shadow-lg border-l-4 border-dashed border-[#219E8B]'>
                            <div className="prose max-w-none prose-h2:text-[#0B3B5B] prose-h3:text-[#219E8B]">
                                <div dangerouslySetInnerHTML={{ __html: auditResult }} />
                            </div>
                        </Card>
                    )}

                    <Button onClick={handleReflectionAudit} disabled={isAuditing || !userReflection.trim()} className='mt-3 w-full bg-[#E04E1B] hover:bg-red-700'>
                        {isAuditing ? 
                            <span className="flex items-center justify-center"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div> Auditing Self-Correction...</span>
                            : <><Cpu className='w-4 h-4 mr-2'/> Get AI Reflection Audit</>
                        }
                    </Button>
                </div>
                
                {keyTakeaway && (
                    <div className='mt-8 pt-6 border-t border-gray-200'>
                        <h3 className='text-xl font-bold text-[#0B3B5B] mb-3 flex items-center'><TrendingUp className='w-5 h-5 mr-2 text-[#219E8B]'/> Practice Commitment Planner</h3>
                        <p className='text-sm text-gray-700 mb-4'>Convert your key takeaway into a daily practice habit to reinforce learning immediately.</p>
                        <Button onClick={handleCreateCommitment} className='w-full bg-[#349881] hover:bg-[#219E8B]'>
                            <PlusCircle className='w-5 h-5 mr-2'/> Commit to Daily Practice: "{keyTakeaway.substring(0, 40)}..."
                        </Button>
                    </div>
                )}
                
                <Button onClick={() => navigate('coaching-lab-home')} variant='outline' className='mt-8 w-full'>
                    Return to Coaching Lab Home
                </Button>
            </Card>
            
            <FollowUpCoach history={history} setView={navigate} />
        </div>
    );


};

// --- ROLE PLAY SIMULATOR VIEW (No changes needed) ---
const RolePlayView = ({ scenario, setCoachingLabView, preparedSBI, difficultyLevel }) => {
    // FIX: Access hook inside component
    const { navigate, callSecureGeminiAPI, hasGeminiKey, GEMINI_MODEL } = useAppServicesOriginal(); 

    const [chatHistory, setChatHistory] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [conversationStarted, setConversationStarted] = useState(false);
    const [sessionEnded, setSessionEnded] = useState(false);
    const [sbiDelivered, setSbiDelivered] = useState(false);
    const [confidenceTip, setConfidenceTip] = useState(null);
    const [isPrimingModalVisible, setIsPrimingModalVisible] = useState(true);
    
    // Priming Modal State
    const [stressLevel, setStressLevel] = useState(50);
    const [intentionalMindset, setIntentionalMindset] = useState('Non-Judgmental');
    const [mindsetNudge, setMindsetNudge] = useState(null);
    const [isPrimingLoading, setIsPrimingLoading] = useState(false);
    
    const chatRef = React.useRef(null);
    
    const resistanceFactor = Math.floor(difficultyLevel / 25); 

    useEffect(() => {
        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
    }, [chatHistory]);
    
    useEffect(() => {
        if (hasGeminiKey() && scenario && !isPrimingModalVisible) {
            const fetchTip = async () => {
                const tension = difficultyLevel < 25 ? 'Low' : difficultyLevel < 75 ? 'Medium' : 'High';
                const userQuery = `Generate a Scenario-Specific Confidence Builder Tip (1 sentence max) for this situation: Scenario: ${scenario.title}. Persona: ${scenario.persona}. Tension: ${tension}. Focus the tip on the manager's opening mindset or first reply. Confidence Builder Tip:`;
                
                try {
                    const payload = {
                        contents: [{ role: "user", parts: [{ text: userQuery }] }],
                        systemInstruction: { parts: [{ text: "You are an AI coach. Provide only the concise, actionable tip in plain text." }] },
                        model: GEMINI_MODEL,
                    };
                    const result = await callSecureGeminiAPI(payload);
                    const tipText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
                    setConfidenceTip(tipText);
                } catch (e) {
                    setConfidenceTip("Focus on empathy and objective facts for a strong start.");
                }
            };
            fetchTip();
        }
    }, [scenario, difficultyLevel, hasGeminiKey, isPrimingModalVisible, callSecureGeminiAPI, GEMINI_MODEL]);

    const AI_PERSONA = scenario.persona.split(' ').slice(1).join(' ');

    const handleSaveSessionAndCritique = async (history) => {
        setSessionEnded(true);
    }

    const generateResponse = async (history) => {
        setIsGenerating(true);

        const sbiPrompt = preparedSBI ? `\nThe manager prepared the following SBI statement to use as a basis for feedback: ${preparedSBI}\n` : '';
        
        let difficultyInstruction;
        if (resistanceFactor >= 3) {
             difficultyInstruction = "Be highly resistant, skeptical, and emotionally charged (High Tension).";
        } else if (resistanceFactor === 2) {
             difficultyInstruction = "Be defensive and slightly stressed, often deflecting blame (Medium Tension).";
        } else if (resistanceFactor === 1) {
             difficultyInstruction = "Be open but cautious, requiring strong empathy to open up (Low Tension).";
        } else {
             difficultyInstruction = "Be collaborative and receptive to feedback.";
        }

        const systemInstruction = `You are a direct report named 'Alex'. You embody the persona: ${scenario.persona}. Your current situation is: "${scenario.description}". The user is your manager. ${sbiPrompt}
        
        **Difficulty Instruction:** ${difficultyInstruction}

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
                systemInstruction: { parts: [{ text: systemInstruction }] },
                model: GEMINI_MODEL,
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
        
        if (preparedSBI && !sbiDelivered) {
             const sbiMatch = preparedSBI.split('.').some(part => newUserMessage.text.includes(part.trim().substring(0, 10)));
             if (sbiMatch) {
                 setSbiDelivered(true);
             }
        }

        await generateResponse(newHistory);
    };

    useEffect(() => {
        if (!conversationStarted && !sessionEnded && !isPrimingModalVisible) {
            setChatHistory([
                { sender: 'System', text: `You are meeting with Alex (The ${AI_PERSONA}). Alex looks visibly annoyed/distracted. Start the conversation with your opening statement.`, isAI: true, system: true }
            ]);
            setConversationStarted(true);
        }
    }, [conversationStarted, sessionEnded, AI_PERSONA, isPrimingModalVisible]);

    const handlePrimingCheckIn = async () => {
        setIsPrimingLoading(true);
        const GEMINI_MODEL_LOCAL = useAppServicesOriginal().GEMINI_MODEL; // FIX: Access inside function
        
        const userQuery = `Generate a 1-sentence Priming Nudge based on this self-assessment: Stress: ${stressLevel}%. Mindset: ${intentionalMindset}. The scenario is ${scenario.title} where Alex is ${scenario.persona}. Priming Nudge:`;
        
        try {
            const payload = {
                contents: [{ role: "user", parts: [{ text: userQuery }] }],
                systemInstruction: { parts: [{ text: "You are an AI coach. Provide only the concise, actionable nudge in plain text." }] },
                model: GEMINI_MODEL_LOCAL,
            };
            const result = await callSecureGeminiAPI(payload);
            const nudgeText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
            setMindsetNudge(nudgeText);
        } catch (e) {
            setMindsetNudge("Error: Check API connection. Defaulting to Mindset focus.");
        } finally {
            setIsPrimingLoading(false);
            setIsPrimingModalVisible(false);
        }
    };
    
    if (isPrimingModalVisible) {
        return (
            <div className="fixed inset-0 bg-[#0B3B5B]/90 z-50 flex items-center justify-center p-4">
                <div className="bg-[#FCFCFA] rounded-3xl shadow-2xl w-full max-w-lg p-8">
                    <h2 className="text-2xl font-extrabold text-[#E04E1B] mb-4 flex items-center">
                        <HeartPulse className="w-6 h-6 mr-3" /> Psychological Priming Check
                    </h2>
                    <p className='text-gray-700 mb-6'>Manage your internal state before engaging. This minimizes emotional hijacking and maximizes skill transfer.</p>

                    <div className='mb-6'>
                        <label className="block text-sm font-medium text-[#0B3B5B] mb-1">1. Current Stress/Anxiety Level ({stressLevel}%)</label>
                        <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            step="1"
                            value={stressLevel} 
                            onChange={(e) => setStressLevel(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg accent-[#E04E1B]"
                        />
                        <p className='text-xs text-gray-500 mt-1 flex justify-between'><span>Low/Calm</span><span>High/Anxious</span></p>
                    </div>

                    <div className='mb-6'>
                        <label className="block text-sm font-medium text-[#0B3B5B] mb-1">2. Intentional Mindset</label>
                        <select 
                            value={intentionalMindset} 
                            onChange={(e) => setIntentionalMindset(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-xl"
                        >
                            <option>Non-Judgmental</option>
                            <option>Curious Investigator</option>
                            <option>Calm Anchor</option>
                            <option>Fact-Driven</option>
                        </select>
                    </div>
                    
                    {mindsetNudge && (
                         <div className='p-3 my-4 bg-[#219E8B]/10 rounded-xl text-sm font-medium border border-[#219E8B]'>
                            <Lightbulb className='w-4 h-4 inline mr-2 text-[#219E8B]'/> **Mindset Nudge:** {mindsetNudge}
                        </div>
                    )}


                    <Button onClick={handlePrimingCheckIn} disabled={isPrimingLoading} className='mt-6 w-full'>
                        {isPrimingLoading ? 'Analyzing State...' : 'Confirm Mindset & Launch Session'}
                    </Button>
                </div>
            </div>
        );
    }
    

    if (sessionEnded) {
        return (
            <div className='p-8'>
                <h1 className="text-3xl font-extrabold text-[#0B3B5B] mb-4">Session Complete: Audit Results</h1>
                <RolePlayCritique 
                    history={chatHistory} 
                    setView={setCoachingLabView} 
                    preparedSBI={preparedSBI} 
                    scenario={scenario} 
                    difficultyLevel={difficultyLevel} 
                />
            </div>
        );
    }


    return (
        <div className="p-8">
            <h1 className="text-3xl font-extrabold text-[#0B3B5B] mb-4">Role-Play Simulator: {scenario.title}</h1>
            <p className="text-lg text-gray-600 mb-6 max-w-3xl">Practice your conversation with Alex, who is simulating **{scenario.persona}** behavior. Focus on using empathy and clear SBI feedback.</p>
            <Button onClick={() => handleSaveSessionAndCritique(chatHistory)} variant="secondary" className="mb-8 bg-[#E04E1B] border-red-500 hover:bg-red-700">
                <AlertTriangle className="w-5 h-5 mr-2" /> End Session & Get Critique
            </Button>
            
            <div className='flex flex-col lg:flex-row space-y-6 lg:space-y-0 lg:space-x-6'>
                <div className='flex-1 bg-[#FCFCFA] border border-gray-300 rounded-2xl shadow-lg flex flex-col h-[500px]'>
                    
                    {confidenceTip && !isGenerating && chatHistory.length < 2 && (
                        <div className="p-3 bg-[#219E8B]/10 text-sm text-[#0B3B5B] border-b border-[#219E8B]/30 font-medium">
                            <Lightbulb className='w-4 h-4 inline mr-2 text-[#219E8B]'/> **Pre-Session Nudge:** {confidenceTip}
                        </div>
                    )}
                    
                    <div ref={chatRef} className='flex-1 overflow-y-auto p-4'>
                        {chatHistory.map((msg, index) => (
                            !msg.system && <Message key={index} sender={msg.sender} text={msg.text} isAI={msg.isAI} />
                        ))}
                         {chatHistory.find(msg => msg.system) && (
                            <div className="text-sm text-[#0B3B5B] bg-[#219E8B]/10 p-3 rounded-lg border border-[#219E8B]/20 mb-4">
                                {chatHistory.find(msg => msg.system)?.text}
                            </div>
                        )}
                        {isGenerating && (
                            <div className='flex justify-start mb-4'>
                                <div className='p-4 max-w-lg rounded-xl bg-[#0B3B5B]/10 text-gray-500 rounded-tl-none'>
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
                            className="flex-1 p-3 border border-gray-300 rounded-xl focus:ring-[#219E8B] focus:border-[#219E8B]"
                            disabled={isGenerating || !hasGeminiKey()}
                        />
                        <Button onClick={handleSendMessage} disabled={!inputText.trim() || isGenerating || !hasGeminiKey()} className='px-4 py-3'>
                            {isGenerating ? '...' : <Send className='w-5 h-5' />}
                        </Button>
                    </div>
                </div>

                <div className='lg:w-1/3'>
                    <Card title={`Alex: The ${scenario.persona.split(' ').slice(1).join(' ')}`} icon={Users} className='h-full bg-[#0B3B5B]/10 border-2 border-[#0B3B5B]/20'>
                        <div className='p-3 bg-white rounded-lg shadow-inner mb-4 border border-gray-200'>
                            <h4 className='font-bold text-[#0B3B5B] mb-2 flex items-center'><Clock className='w-4 h-4 mr-1'/> Conversation Tracker</h4>
                            <div className='flex justify-between text-sm font-medium'>
                                <span>Turn Count:</span>
                                <span className='font-extrabold text-[#E04E1B]'>{Math.floor(chatHistory.filter(m => !m.system).length / 2)}</span>
                            </div>
                             <div className='flex justify-between text-sm font-medium mt-1'>
                                <span>SBI Delivered:</span>
                                <span className={`font-extrabold ${sbiDelivered ? 'text-green-600' : 'text-gray-500'}`}>{sbiDelivered ? 'YES' : 'PENDING'}</span>
                            </div>
                        </div>

                        <p className='text-sm text-gray-700 font-semibold mb-2'>Scenario Description:</p>
                        <p className="text-sm text-gray-600">{scenario.description}</p>
                        
                        {preparedSBI && (
                             <div className='mt-4 pt-2 border-t border-gray-300'>
                                <h4 className='font-bold text-[#219E8B] mb-2 flex items-center'><ShieldCheck className='w-4 h-4 mr-1'/> Prepared SBI Focus:</h4>
                                <p className='text-xs text-gray-700 italic border border-[#219E8B]/20 p-2 rounded-lg bg-white'>{preparedSBI}</p>
                            </div>
                        )}

                        <h4 className='font-bold text-[#0B3B5B] mt-4 mb-2 border-t pt-2'>Goal Reminder:</h4>
                        <ul className='list-disc list-inside text-sm text-gray-700 space-y-1'>
                            <li>Establish clear, objective facts (S&B).</li>
                            <li>Lead with empathy, not accusation.</li>
                            <li>Steer toward a forward-looking action plan.</li>
                        </ul>
                        
                        <h4 className='font-bold text-[#E04E1B] mt-4 mb-2 border-t pt-2'>Tension Level:</h4>
                        <div className='text-sm text-gray-700 font-semibold'>
                            {difficultyLevel < 25 ? 'Low (Collaborative)' : difficultyLevel < 75 ? 'Medium (Defensive)' : 'High (Resistant)'}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

// --- LEAN FEEDBACK PREP VIEW (Dedicated for instant SBI audit) ---
const LeanFeedbackPrepView = ({ setCoachingLabView, setPreparedSBI }) => {
    // FIX: Access hook inside component
    const { callSecureGeminiAPI, hasGeminiKey, GEMINI_MODEL } = useAppServicesOriginal(); 

    const [situation, setSituation] = useState('');
    const [behavior, setBehavior] = useState('');
    const [impact, setImpact] = useState('');

    const [isGenerating, setIsGenerating] = useState(false);
    const [critique, setCritique] = useState(null);
    const [critiqueHtml, setCritiqueHtml] = useState('');
    const [refinedFeedback, setRefinedFeedback] = useState(null); 
    
    const canAnalyze = !!situation && !!behavior && !!impact && hasGeminiKey();

    useEffect(() => {
        if (!critique) { setCritiqueHtml(''); setRefinedFeedback(null); return; }
        (async () => setCritiqueHtml(await mdToHtml(critique)))();
        
        const match = critique.match(/\*\*(Refined Feedback|Refined SBI)\*\*:?\s*([^*]+)/i);
        if (match && match[2]) {
            const finalRefined = match[2].trim().replace(/\.$/, '');
            setRefinedFeedback(finalRefined);
        } else {
            setRefinedFeedback(null);
        }
    }, [critique]);

    const generateCritique = async () => {
        setIsGenerating(true);
        setCritique('');
        setRefinedFeedback(null);

        if (!canAnalyze) return;

        const userFeedback = `S: ${situation}\nB: ${behavior}\nI: ${impact}`;
        const systemInstruction = "You are an AI Coach specializing in the SBI (Situation, Behavior, Impact) feedback model. Analyze the user's provided feedback draft. First, point out one strength. Second, point out one area for improvement, specifically focusing on ensuring the Behavior is objective and the Impact is linked to business results or team culture. Then, provide the final refined version of the feedback, strictly adhering to the S-B-I format, labeling the final version with **Refined Feedback**.";
        const userQuery = `Critique and refine this SBI feedback draft for a real-world scenario:\n\n${userFeedback}`;

        try {
            const payload = {
            contents: [{ role: "user", parts: [{ text: userQuery }] }],
            systemInstruction: { parts: [{ text: systemInstruction }] },
            model: GEMINI_MODEL,
            };

            const result = await callSecureGeminiAPI(payload);
            const candidate = result?.candidates?.[0];

            if (candidate && candidate.content?.parts?.[0]?.text) {
                setCritique(candidate.content.parts[0].text);
            } else {
                setCritique("Could not generate critique. The model may have blocked the request.");
            }
        } catch (error) {
            console.error("Gemini API Error:", error);
            setCritique("An error occurred while connecting to the AI coach.");
        } finally {
            setIsGenerating(false);
        }
    };
    

    return (
        <div className="p-8">
            <h1 className="text-3xl font-extrabold text-[#0B3B5B] mb-4">Lean Feedback Prep: Instant SBI Audit</h1>
            <p className="text-lg text-gray-600 mb-6 max-w-3xl">Get immediate AI critique and refinement for your real-world feedback drafts. This tool prioritizes speed and clarity for crucial conversations.</p>
            
            <Button onClick={() => setCoachingLabView('coaching-lab-home')} variant="outline" className="mb-8">
                <ArrowLeft className="w-5 h-5 mr-2" /> Back to Coaching Lab
            </Button>
            
            <div className='flex flex-col lg:flex-row space-y-8 lg:space-y-0 lg:space-x-8'>
                
                {/* LEFT COLUMN: Input */}
                <div className='lg:w-1/2 space-y-6'>
                    <Card title="Draft Your SBI Feedback" icon={Briefcase} accent="TEAL">
                        <p className="text-gray-700 text-sm mb-4">Input the specific, objective details of the situation you need to address.</p>
                        
                        <label className="block text-sm font-medium text-[#0B3B5B] mt-3 mb-1">Situation (S): When/Where did it happen?</label>
                        <textarea value={situation} onChange={(e) => setSituation(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg h-14 text-sm" placeholder="e.g., 'During the team stand-up last Tuesday...'"></textarea>
                        
                        <label className="block text-sm font-medium text-[#0B3B5B] mt-3 mb-1">Behavior (B): What observable action did they take?</label>
                        <textarea value={behavior} onChange={(e) => setBehavior(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg h-14 text-sm" placeholder="e.g., '...you presented the data without checking your sources.'"></textarea>
                        
                        <label className="block text-sm font-medium text-[#0B3B5B] mt-3 mb-1">Impact (I): What was the consequence?</label>
                        <textarea value={impact} onChange={(e) => setImpact(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg h-14 text-sm" placeholder="e.g., '...which led to incorrect projections being shared with the client.'"></textarea>

                        <Button 
                            onClick={generateCritique} 
                            disabled={!canAnalyze || isGenerating} 
                            className="w-full mt-4 bg-[#219E8B] hover:bg-[#349881]"
                        >
                            {isGenerating ? (
                                <span className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                    Running AI Audit...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center">
                                    <Cpu className='w-4 h-4 mr-2' /> Get Instant Critique
                                </span>
                            )}
                        </Button>
                    </Card>
                    
                    {refinedFeedback && (
                        <Card title="Final Refined Feedback" icon={ShieldCheck} accent="ORANGE">
                            <h4 className='font-bold text-[#0B3B5B] mb-2'>Ready for Use:</h4>
                            <p className='text-sm text-gray-700 font-medium italic p-3 border border-[#E04E1B] rounded-lg bg-[#FBF6F0]'>
                                {refinedFeedback}
                            </p>
                            <Button 
                                onClick={() => navigator.clipboard.writeText(refinedFeedback)} 
                                className="mt-4 w-full bg-[#E04E1B] hover:bg-red-700"
                            >
                                <CornerRightUp className='w-4 h-4 mr-2' /> Copy Refined SBI to Clipboard
                            </Button>
                        </Card>
                    )}
                </div>

                {/* RIGHT COLUMN: AI Feedback Panel */}
                <div className='lg:w-1/2'>
                    {critiqueHtml && (
                        <Card title="AI Critique (SBI Audit)" icon={Eye} className="mt-0 border-4 border-[#0B3B5B]">
                            <div className="prose max-w-none prose-h2:text-[#0B3B5B] prose-h2:text-xl prose-h2:font-extrabold prose-h3:text-[#219E8B] prose-p:text-gray-700 prose-ul:space-y-2">
                                <div dangerouslySetInnerHTML={{ __html: critiqueHtml }} />
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- PRACTICE LOG VIEW (Integrated Mock Session Data) ---
const PracticeLogView = ({ setCoachingLabView }) => {
    const { navigate } = useAppServicesOriginal();
    
    return (
        <div className="p-8">
            <h1 className="text-3xl font-extrabold text-[#0B3B5B] mb-4">Practice Log: History & Growth</h1>
            <p className="text-lg text-gray-600 mb-6 max-w-3xl">Review your past Role-Play sessions, see your scores, and track your progress against key takeaways.</p>
            
            <Button onClick={() => setCoachingLabView('coaching-lab-home')} variant="outline" className="mb-8">
                <ArrowLeft className="w-5 h-5 mr-2" /> Back to Coaching Lab
            </Button>
            
            <div className="space-y-4">
                {MOCK_PRACTICE_SESSIONS.map(session => (
                    <Card key={session.id} title={`${session.title} (${session.score}%)`} icon={BarChart3} className="border-l-4 border-[#2563EB] flex justify-between items-center" onClick={() => console.log("Navigate to detailed critique for session", session.id)}>
                        <div>
                            <p className="text-sm text-gray-700 mb-1">**Date:** {session.date} | **Difficulty:** {session.difficulty}</p>
                            <p className="text-sm font-semibold text-[#E04E1B] mt-1">Key Insight: {session.takeaway}</p>
                        </div>
                        <div className="text-sm text-[#2563EB] font-bold">View Critique &rarr;</div>
                    </Card>
                ))}
                {MOCK_PRACTICE_SESSIONS.length === 0 && <p className="text-gray-500 italic">No completed practice sessions found.</p>}
            </div>
        </div>
    );
};


// --- SCENARIO PREP VIEW (No changes needed) ---
const ScenarioPreparationView = ({ scenario, setCoachingLabView, setPreparedSBI }) => {
    // FIX: Access hook inside component
    const { callSecureGeminiAPI, hasGeminiKey, GEMINI_MODEL, navigate } = useAppServicesOriginal();

    const [situation, setSituation] = useState('');
    const [behavior, setBehavior] = useState('');
    const [impact, setImpact] = useState('');
    const [objective, setObjective] = useState('');
    const [difficultyLevel, setDifficultyLevel] = useState(50);

    const [isGenerating, setIsGenerating] = useState(false);
    const [critique, setCritique] = useState(null);
    const [critiqueHtml, setCritiqueHtml] = useState('');
    const [refinedFeedback, setRefinedFeedback] = useState(null); 
    const [currentStep, setCurrentStep] = useState(1);
    
    const canAnalyze = !!situation && !!behavior && !!impact && hasGeminiKey();
    const isPrepComplete = !!objective && !!refinedFeedback;

    useEffect(() => {
        if (!critique) { setCritiqueHtml(''); setRefinedFeedback(null); return; }
        (async () => setCritiqueHtml(await mdToHtml(critique)))();
        
        const match = critique.match(/\*\*(Refined Feedback|Refined SBI)\*\*:?\s*([^*]+)/i);
        if (match && match[2]) {
            const finalRefined = match[2].trim().replace(/\.$/, '');
            setRefinedFeedback(finalRefined);
            setPreparedSBI(finalRefined);
        } else {
            setRefinedFeedback(null);
            setPreparedSBI(null);
        }

    }, [critique, setPreparedSBI]);

    const generateCritique = async () => {
        setIsGenerating(true);
        setCritique('');
        setRefinedFeedback(null);

        if (!canAnalyze) return;

        const userFeedback = `S: ${situation}\nB: ${behavior}\nI: ${impact}`;
        const systemInstruction = "You are an AI Coach specializing in the SBI (Situation, Behavior, Impact) feedback model. Analyze the user's provided feedback draft. First, point out one strength. Second, point out one area for improvement, specifically focusing on ensuring the Behavior is objective and the Impact is linked to business results or team culture. Then, provide the final refined version of the feedback, strictly adhering to the S-B-I format, labeling the final version with **Refined Feedback**.";
        const userQuery = `Critique and refine this SBI feedback draft for the scenario: ${scenario.title} - ${scenario.description}:\n\n${userFeedback}`;

        try {
            const payload = {
            contents: [{ role: "user", parts: [{ text: userQuery }] }],
            systemInstruction: { parts: [{ text: systemInstruction }] },
            model: GEMINI_MODEL,
            };

            const result = await callSecureGeminiAPI(payload);
            const candidate = result?.candidates?.[0];

            if (candidate && candidate.content?.parts?.[0]?.text) {
                setCritique(candidate.content.parts[0].text);
                setCurrentStep(3);
            } else {
                setCritique("Could not generate critique. The model may have blocked the request.");
            }
        } catch (error) {
            console.error("Gemini API Error:", error);
            setCritique("An error occurred while connecting to the AI coach.");
        } finally {
            setIsGenerating(false);
        }
    };
    
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
        <h1 className="text-3xl font-extrabold text-[#0B3B5B] mb-4">Prepare for: {scenario.title}</h1>
        <p className="text-lg text-gray-600 mb-6 max-w-3xl">Target: Alex, **{scenario.persona}** | Focus: {scenario.description}</p>
        
        <Button onClick={() => setCoachingLabView('scenario-library')} variant="outline" className="mb-8">
            <ArrowLeft className="w-5 h-5 mr-2" /> Back to Scenarios
        </Button>

        <div className='flex flex-col lg:flex-row space-y-8 lg:space-y-0 lg:space-x-8'>
            {/* LEFT COLUMN: Preparation Pipeline */}
            <div className='lg:w-2/3 space-y-6'>
                {/* Difficulty Slider */}
                <Card title="Set Tension Level (Optional)" icon={HeartPulse} className='bg-[#E04E1B]/10 border-4 border-dashed border-[#E04E1B]'>
                    <p className='text-sm text-gray-700 mb-4'>Control the emotional resistance of the AI persona in the simulator. Higher tension requires more empathy and validation skill.</p>
                    <div className='flex justify-between text-xs font-bold text-[#0B3B5B] mb-1'>
                        <span>Low Tension</span>
                        <span>High Tension</span>
                    </div>
                    <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        step="1"
                        value={difficultyLevel} 
                        onChange={(e) => setDifficultyLevel(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg accent-[#E04E1B]"
                    />
                    <div className='text-sm font-semibold text-[#0B3B5B] mt-3'>
                        Current Difficulty: {difficultyLevel < 25 ? 'Low (Collaborative)' : difficultyLevel < 75 ? 'Medium (Defensive)' : 'High (Resistant)'}
                    </div>
                </Card>
                
                <Card title="Step 1: Define Your Objective" icon={Target} className={currentStep === 1 ? 'border-4 border-dashed border-[#219E8B]' : 'opacity-70'}>
                    <p className="text-gray-700 text-sm">What is the **one critical outcome** you want? What measurable commitment, change, or decision will constitute success?</p>
                    <textarea 
                        value={objective}
                        onChange={(e) => { setObjective(e.target.value); setCurrentStep(2); }}
                        className="w-full p-3 mt-4 border border-gray-300 rounded-xl focus:ring-[#219E8B] focus:border-[#219E8B] h-20" 
                        placeholder="e.g., 'Ensure Alex commits to a weekly check-in process to prevent missed deadlines.'"
                    />
                    <div className='text-xs font-semibold text-[#E04E1B] mt-2'>Status: {objective.length > 5 ? 'Objective Set' : 'Pending...'}</div>
                </Card>

                <Card title="Step 2: Draft SBI Feedback" icon={Briefcase} className={currentStep === 2 ? 'border-4 border-dashed border-[#219E8B]' : 'opacity-70'}>
                    <p className="text-gray-700 text-sm mb-4">Draft the specific, objective feedback using the **SBI** model.</p>
                    
                    <label className="block text-sm font-medium text-[#0B3B5B] mt-3 mb-1">Situation (S): When/Where did it happen?</label>
                    <textarea value={situation} onChange={(e) => { setSituation(e.target.value); setCurrentStep(2); }} className="w-full p-2 border border-gray-300 rounded-lg h-14 text-sm" placeholder="e.g., 'During the team stand-up last Tuesday...'"></textarea>
                    
                    <label className="block text-sm font-medium text-[#0B3B5B] mt-3 mb-1">Behavior (B): What observable action did they take?</label>
                    <textarea value={behavior} onChange={(e) => { setBehavior(e.target.value); setCurrentStep(2); }} className="w-full p-2 border border-gray-300 rounded-lg h-14 text-sm" placeholder="e.g., '...you presented the data without checking your sources.'"></textarea>
                    
                    <label className="block text-sm font-medium text-[#0B3B5B] mt-3 mb-1">Impact (I): What was the consequence?</label>
                    <textarea value={impact} onChange={(e) => { setImpact(e.target.value); setCurrentStep(2); }} className="w-full p-2 border border-gray-300 rounded-lg h-14 text-sm" placeholder="e.g., '...which led to incorrect projections being shared with the client.'"></textarea>

                    <Button 
                        onClick={generateCritique} 
                        disabled={!canAnalyze || isGenerating} 
                        className="w-full mt-4 bg-[#219E8B] hover:bg-[#349881]"
                    >
                        {isGenerating ? (
                            <span className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                Running AI Critique...
                            </span>
                        ) : (
                            <span className="flex items-center justify-center">
                                <Cpu className='w-4 h-4 mr-2' /> Get AI Critique & Refinement
                            </span>
                        )}
                    </Button>
                </Card>

                <Card title="Step 3: Review & Launch" icon={CheckCircle} className={currentStep === 3 ? 'border-4 border-dashed border-green-500 bg-green-50' : 'opacity-70'}>
                    <p className="text-gray-700 text-sm mb-4">Final preparation check. Are you ready to enter the simulation?</p>
                    
                    <div className='p-3 bg-white rounded-lg border border-gray-200'>
                        <h4 className='font-bold text-[#0B3B5B] mb-1'>Objective:</h4>
                        <p className='text-sm text-gray-700 italic'>{objective || 'Objective not yet set.'}</p>
                    </div>

                    <div className={`p-3 mt-3 rounded-lg border ${refinedFeedback ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
                        <h4 className='font-bold text-[#0B3B5B] mb-1'>Refined SBI:</h4>
                        <p className='text-sm text-gray-700 italic'>{refinedFeedback || 'AI critique must be run before starting.'}</p>
                    </div>

                    <Button 
                        onClick={() => navigate('role-play', { scenario, preparedSBI: refinedFeedback, difficultyLevel })} 
                        disabled={!isPrepComplete} 
                        className="mt-6 w-full"
                    >
                        <Play className="w-5 h-5 mr-2" /> Launch Role-Play Simulation
                    </Button>
                </Card>
            </div>


            {/* RIGHT COLUMN: AI Feedback Panel */}
            <div className='lg:w-1/3'>
                {critiqueHtml && (
                    <Card title="AI Critique (SBI Audit)" icon={Eye} className="mt-0 border-4 border-[#0B3B5B]">
                        <div className="prose max-w-none prose-h2:text-[#0B3B5B] prose-h2:text-xl prose-h2:font-extrabold prose-h3:text-[#219E8B] prose-p:text-gray-700 prose-ul:space-y-2">
                            <div dangerouslySetInnerHTML={{ __html: critiqueHtml }} />
                        </div>
                         {refinedFeedback && (
                            <div className='mt-4 pt-4 border-t border-gray-200'>
                                <h4 className='font-bold text-[#219E8B] flex items-center mb-2'><ShieldCheck className='w-4 h-4 mr-1'/> Confirmed Refined Feedback:</h4>
                                <p className='text-sm text-gray-700 font-medium italic'>{refinedFeedback}</p>
                            </div>
                         )}
                    </Card>
                )}

                 <Card title="Scenario Context" icon={Info} className={`mt-6 ${!critiqueHtml ? '' : 'lg:mt-8'} bg-[#219E8B]/10 border-2 border-[#219E8B]/20`}>
                    <h4 className='font-bold text-[#0B3B5B] mb-2'>Persona: {scenario.persona}</h4>
                    <p className="text-sm text-gray-700">{scenario.description}</p>
                    <p className='text-xs text-[#E04E1B] mt-4'>**AI Tip:** {scenario.persona} will likely resist the Impact statement. Lead with empathy before delivering the SBI.</p>
                </Card>

            </div>
        </div>
    </div>
    );
};

// --- ACTIVE LISTENING VIEW (With Rewrite Challenge) ---
const ActiveListeningView = ({ setCoachingLabView }) => {
    // FIX: Access hook inside component
    const { callSecureGeminiAPI, hasGeminiKey, navigate } = useAppServicesOriginal();

    const [responses, setResponses] = useState({ q1: '', q2: '' });
    const [critique, setCritique] = useState(null);
    const [critiqueHtml, setCritiqueHtml] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    
    const [rewrite, setRewrite] = useState('');
    const [rewriteAudit, setRewriteAudit] = useState(null);
    const [isRewriting, setIsRewriting] = useState(false);
    
    const handleChange = (e) => {
        setResponses({ ...responses, [e.target.name]: e.target.value });
        setCritique(null);
        setCritiqueHtml('');
        setRewriteAudit(null);
    };
    
    useEffect(() => {
        if (!critique) { setCritiqueHtml(''); return; }
        (async () => setCritiqueHtml(await mdToHtml(critique)))();
    }, [critique]);
    
    const getScore = (critiqueText, auditName) => {
        const regex = new RegExp(`${auditName}.*?\\(Score:\\s*(\\d+)/100\\)`, 'i');
        const match = critiqueText.match(regex);
        return match ? parseInt(match[1], 10) : null;
    };
    
    const handleSubmit = async () => {
        if (!responses.q1.trim() || !responses.q2.trim()) {
            console.warn("Please provide a response for both prompts before submitting for coach feedback.");
            return;
        }

        setIsGenerating(true);
        setCritique(null);
        setRewriteAudit(null);

        if (!hasGeminiKey()) {
            setCritique("## AI Critique Unavailable\n\n**ERROR**: The Gemini API Key is missing. AI Role-Play is unavailable.");
            setIsGenerating(false);
            return;
        }

        const userQuery = `Critique the following active listening responses from a manager:

**Prompt 1 (The Paraphrase):** The employee said, "I feel overwhelmed by the deadlines and the number of meetings this week." The manager's draft paraphrase is: "${responses.q1.trim()}"

**Prompt 2 (Open-Ended Inquiry):** The situation is a team setback and defeat. The manager's draft open-ended question is: "${responses.q2.trim()}"

Critique Guidelines (Use Markdown):
1.  **Paraphrase Critique (## The Paraphrase Audit (Score: X/100)):** Assess if the manager successfully confirmed understanding without adding judgment or offering a solution. Provide a confidence score (0-100) in the header. Suggest a better, more concise option if needed.
2.  **Question Critique (## The Inquiry Audit (Score: Y/100)):** Assess if the question is truly open-ended (not answerable with Yes/No) and if it successfully invites vulnerability and insight in a safe way. Provide a confidence score (0-100) in the header. Provide a refined, more empathetic alternative.
3.  **Overall Takeaway (### Core Skill Focus):** Give one final, actionable coaching point.
`;

        const systemPrompt = "You are an executive coach specializing in developing empathetic and effective active listening skills. Your critique must be objective, use clear Markdown formatting, and provide concrete, actionable alternatives for improvement. Crucially, you MUST include a score out of 100 in parentheses in the header of each audit section (e.g., '## The Paraphrase Audit (Score: 85/100)').";

        try {
            const payload = {
                contents: [{ role: "user", parts: [{ text: userQuery }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
                model: GEMINI_MODEL,
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
    
    // NEW: Handle Rewrite Challenge Submission
    const handleRewriteAudit = async () => {
        if (!rewrite.trim() || !critique || isRewriting) return;

        setIsRewriting(true);
        setRewriteAudit(null);

        const systemPrompt = "You are an AI auditor. The user has rewritten their response to a paraphrase prompt after receiving feedback. Judge the rewritten response against the core principles of empathy and non-judgmental confirmation. Score the final result out of 100 and provide concise analysis.";

        const userQuery = `Audit the Rewritten Response. The original prompt was the employee saying: "I feel overwhelmed by the deadlines and the number of meetings this week." 
        
        The user's Rewritten Response is: "${rewrite.trim()}" 
        
        The original AI Critique stated: [${critique.substring(0, 100)}...].
        
        Score the rewritten response out of 100 and provide analysis.`;
        
        try {
            const payload = {
                contents: [{ role: "user", parts: [{ text: userQuery }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
                model: GEMINI_MODEL,
            };

            const result = await callSecureGeminiAPI(payload);
            const aiText = result?.candidates?.[0]?.content?.parts?.[0]?.text || "Rewrite audit failed.";
            setRewriteAudit(aiText);

        } catch (e) {
            console.error("Rewrite Audit Error:", e);
            setRewriteAudit("Rewrite audit failed due to API error.");
        } finally {
            setIsRewriting(false);
        }
    };


    const paraphraseScore = critique ? getScore(critique, 'The Paraphrase Audit') : null;
    const inquiryScore = critique ? getScore(critique, 'The Inquiry Audit') : null;
    const totalScore = (paraphraseScore !== null && inquiryScore !== null) ? Math.round((paraphraseScore + inquiryScore) / 2) : null;
    
    return (
    <div className="p-8">
    <h1 className="text-3xl font-extrabold text-[#0B3B5B] mb-4">Active Listening & Reflection Prompts</h1>
    <p className="text-lg text-gray-600 mb-6 max-w-3xl">Active listening means validating emotion and confirming understanding before attempting to solve the problem. Practice the two pillars below to build empathy and psychological safety in high-stakes conversations.</p>
    <Button onClick={() => setCoachingLabView('coaching-lab-home')} variant="outline" className="mb-8">
    <ArrowLeft className="w-5 h-5 mr-2" /> Back to Coaching Lab
    </Button>
    
      <div className="space-y-8">
        <Card title="Reflection 1: The Paraphrase (Confirming Understanding)" icon={Mic}>
          <p className="text-gray-700 mb-3">**Scenario:** A direct report just told you, "I feel overwhelmed by the deadlines and the number of meetings this week." How would you **paraphrase** their statement back to them? <span className='font-semibold text-[#219E8B]'>(Rule: Must not offer a solution or advice.)</span></p>
          <textarea name="q1" value={responses.q1} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-[#219E8B] focus:border-[#219E8B] h-24" placeholder="Draft your paraphrased response here..."></textarea>
          {paraphraseScore !== null && (
               <div className={`mt-3 p-3 rounded-lg font-bold text-lg ${paraphraseScore > 80 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                Confidence Score: {paraphraseScore}%
               </div>
          )}
        </Card>
    
        <Card title="Reflection 2: Open-Ended Inquiry (Inviting Depth)" icon={Mic}>
          <p className="text-gray-700 mb-3">**Scenario:** Your team has just experienced a major setback on a flagship project. They are visibly defeated. What **open-ended question** would you use to invite them to share their feelings and insights, showing empathy and psychological safety?</p>
          <textarea name="q2" value={responses.q2} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-[#219E8B] focus:border-[#219E8B] h-24" placeholder="Draft your open-ended question here..."></textarea>
           {inquiryScore !== null && (
               <div className={`mt-3 p-3 rounded-lg font-bold text-lg ${inquiryScore > 80 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                Confidence Score: {inquiryScore}%
               </div>
          )}
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
        <Card accent="TEAL" title="Active Listening Auditor Feedback" icon={CheckCircle} className="mt-8 bg-[#0B3B5B]/10 border border-[#0B3B5B]/20 rounded-3xl">
           {totalScore !== null && (
                <div className={`text-4xl font-extrabold mb-4 p-3 rounded-xl border-l-8 ${totalScore > 80 ? 'text-green-700 border-green-500 bg-green-50' : 'text-[#E04E1B] border-[#E04E1B] bg-red-50'}`}>
                    Overall Score: {totalScore}%
                </div>
            )}
          <div className="prose max-w-none prose-h2:text-[#0B3B5B] prose-h2:border-b prose-h2:pb-2 prose-h3:text-[#219E8B] prose-p:text-gray-700 prose-ul:space-y-2">
            <div dangerouslySetInnerHTML={{ __html: critiqueHtml }} />
          </div>
          
          {/* NEW FEATURE: Rewrite Challenge */}
          <div className='mt-8 pt-6 border-t border-gray-200'>
                <h3 className='text-xl font-bold text-[#0B3B5B] mb-3 flex items-center'><CornerRightUp className='w-5 h-5 mr-2 text-[#E04E1B]'/> Rewrite Challenge (Self-Correction)</h3>
                <p className='text-sm text-gray-700 mb-3'>Based on the AI's critique, rewrite your **Paraphrase** (Reflection 1) to correct your mistake. Focus on non-judgmental confirmation.</p>
                
                <textarea 
                    value={rewrite}
                    onChange={(e) => {setRewrite(e.target.value); setRewriteAudit(null);}}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-[#E04E1B] focus:border-[#E04E1B] h-24 mb-3" 
                    placeholder="Rewrite your perfect paraphrase here..."
                    disabled={isRewriting}
                />
                
                {rewriteAudit && (
                    <Card title="Final Audit Result" icon={Eye} className='bg-white shadow-lg border-l-4 border-dashed border-[#219E8B]'>
                        <div className="prose max-w-none prose-h2:text-[#0B3B5B] prose-h3:text-[#219E8B]">
                            <div dangerouslySetInnerHTML={{ __html: rewriteAudit }} />
                        </div>
                    </Card>
                )}

                <Button onClick={handleRewriteAudit} disabled={isRewriting || !rewrite.trim()} className='mt-3 w-full bg-[#2563EB] hover:bg-[#1E40AF]'>
                     {isRewriting ? 
                        <span className="flex items-center justify-center"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div> Auditing Rewrite...</span>
                        : <><Cpu className='w-4 h-4 mr-2'/> Audit Corrected Response</>
                    }
                </Button>
            </div>
        </Card>
      )}
    </div>
    
    
    );
};

// --- MAIN COACHING LAB ROUTER ---
export default function CoachingLabScreen() {
    const { navigate } = useAppServicesOriginal();

    const [view, setView] = useState('coaching-lab-home');
    const [selectedScenario, setSelectedScenario] = useState(null);
    const [preparedSBI, setPreparedSBI] = useState(null);

    const renderView = () => {
        const viewProps = { setCoachingLabView: setView, setSelectedScenario };

        switch (view) {
            case 'scenario-library':
                return <ScenarioLibraryView {...viewProps} />;
            case 'scenario-prep':
                return <ScenarioPreparationView 
                    scenario={selectedScenario} 
                    setCoachingLabView={setView} 
                    setPreparedSBI={setPreparedSBI} 
                />;
            case 'role-play':
                return selectedScenario 
                    ? <RolePlayView 
                        scenario={selectedScenario} 
                        setCoachingLabView={setView}
                        preparedSBI={preparedSBI}
                        difficultyLevel={selectedScenario.difficultyLevel || 50}
                    /> 
                    : <ScenarioLibraryView {...viewProps} />;
            case 'feedback-prep':
                return <LeanFeedbackPrepView setCoachingLabView={setView} setPreparedSBI={setPreparedSBI} />;
            case 'active-listening':
                return <ActiveListeningView setCoachingLabView={setView} />;
            case 'practice-log':
                return <PracticeLogView setCoachingLabView={setView} />;
            case 'coaching-lab-home':
            default:
                return (
                    <div className="p-8">
                        <h1 className="text-3xl font-extrabold text-[#0B3B5B] mb-4">Coaching & Crucial Conversations Lab</h1>
                        <p className="text-lg text-gray-600 mb-8 max-w-3xl">Practice key leadership interactions using guided tools and receive real-time AI critique to sharpen your skills.</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <Card title="Scenario Library & Prep Pipeline" icon={Users} onClick={() => setView('scenario-library')} className="border-l-4 border-[#219E8B] rounded-3xl">
                                <p className="text-gray-700 text-sm">Select a scenario or **dynamically generate one** to start a fully interactive AI role-play session.</p>
                                <div className="mt-4 text-[#219E8B] font-semibold flex items-center">
                                    Launch Library &rarr;
                                </div>
                            </Card>
                            <Card title="Feedback Prep Tool (SBI Audit)" icon={Briefcase} onClick={() => setView('feedback-prep')} className="border-l-4 border-[#0B3B5B] rounded-3xl">
                                <p className="text-gray-700 text-sm">Draft difficult feedback using the SBI model and get instant, professional critique and refinement for **real-world use**.</p>
                                <div className="mt-4 text-[#0B3B5B] font-semibold flex items-center">
                                    Launch Prep Tool &rarr;
                                </div>
                            </Card>
                            <Card accent="TEAL" title="Active Listening Auditor" icon={Mic} onClick={() => setView('active-listening')} className="border-l-4 border-[#219E8B] rounded-3xl">
                                <p className="text-gray-700 text-sm">Exercises to develop empathy, using paraphrasing and open-ended questions. Get a **quantifiable score** on your response quality.</p>
                                <div className="mt-4 text-[#219E8B] font-semibold flex items-center">
                                    Launch Exercises &rarr;
                                </div>
                            </Card>
                            <Card accent="BLUE" title="Practice History Log" icon={BarChart3} onClick={() => setView('practice-log')} className="border-l-4 border-[#2563EB] rounded-3xl">
                                <p className className="text-gray-700 text-sm">Review your past session scores, track your skill growth over time, and revisit key takeaways.</p>
                                <div className="mt-4 text-[#2563EB] font-semibold flex items-center">
                                    View Log &rarr;
                                </div>
                            </Card>
                        </div>
                    </div>
                );
        }
    };

    const [showDbg, setShowDbg] = useState(() => {
      try { return typeof window !== 'undefined' && /[?&]dbg=1\b/.test(window.location.search); }
      catch { return false; }
    });
    const [debugStamp] = useState(() => new Date().toLocaleTimeString());
    return (
      <div className="p-6 md:p-10 min-h-screen" style={{ background: COLORS.BG, color: COLORS.TEXT }}>
        <h1 className="text-4xl font-extrabold mb-10" style={{ color: COLORS.NAVY }}>Professional Coaching Lab</h1>
        {renderView()}
      </div>
    );
}

// --- The rest of the ScenarioLibraryView, DynamicScenarioGenerator, etc. follow here ---

const DynamicScenarioGenerator = ({ setCoachingLabView, setSelectedScenario }) => {
    // FIX: Access hook inside component
    const { callSecureGeminiAPI, GEMINI_MODEL } = useAppServicesOriginal();

    const baseScenarios = [
        { id: 1, title: 'The Missing Deadline', description: 'Consistently missing reports.', persona: 'The Deflector' },
        { id: 2, title: 'The Client Conflict', description: 'Overstepped authority with a client.', persona: 'The Defender' },
        { id: 3, title: 'The Quiet Worker', description: 'Disengaged and silent in meetings.', persona: 'The Silent Stonewall' },
    ];

    const [selectedBaseId, setSelectedBaseId] = useState(1);
    const [modifier, setModifier] = useState('');
    const [modifiedScenario, setModifiedScenario] = useState(baseScenarios[0]);
    const [isGenerating, setIsGenerating] = useState(false);
    
    const selectedBase = useMemo(() => baseScenarios.find(s => s.id === selectedBaseId) || baseScenarios[0], [selectedBaseId]);

    const handleGenerate = async () => {
        setIsGenerating(true);
        setModifiedScenario(null);

        const systemPrompt = "You are an expert scenario designer for executive coaching. Given a base scenario and a modifier, generate a single, highly realistic and challenging scenario in Markdown format. The persona must be a variation of the base persona, adapted to the modifier. Strictly provide the output using the structure below. Do not add any extra text or conversation.";
        
        const userQuery = `Base Scenario: ${selectedBase.title} - ${selectedBase.description} (Persona: ${selectedBase.persona}).
        Modifier: ${modifier}.
        Generate the new scenario, incorporating the modifier into the description and title. Use this exact Markdown structure:
        
        ## Generated Scenario
        
        ### Title: The [Modified Title]
        
        ### Description: [Full, compelling description incorporating the modifier's challenge]
        
        ### Persona: The [Modified Persona]`;

        try {
            const payload = {
                contents: [{ role: "user", parts: [{ text: userQuery }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
                model: GEMINI_MODEL,
            };

            const result = await callSecureGeminiAPI(payload);
            const aiText = result?.candidates?.[0]?.content?.parts?.[0]?.text || "Generation failed.";
            
            const titleMatch = aiText.match(/### Title: (.*)/);
            const descMatch = aiText.match(/### Description: (.*)/);
            const personaMatch = aiText.match(/### Persona: (.*)/);

            if (titleMatch && descMatch && personaMatch) {
                setModifiedScenario({
                    id: `DYN-${Date.now()}`,
                    title: titleMatch[1].trim(),
                    description: descMatch[1].trim(),
                    persona: personaMatch[1].trim(),
                });
            } else {
                console.error("AI parse failed, falling back to local mock.");
                setModifiedScenario({
                    id: `DYN-${Date.now()}`,
                    title: `${selectedBase.title} (Customized)`,
                    description: `${selectedBase.description} (Modified by: ${modifier})`,
                    persona: selectedBase.persona,
                });
            }

        } catch (error) {
            console.error("Dynamic Scenario Generation Error:", error);
            setModifiedScenario({
                id: `DYN-${Date.now()}`,
                title: `${selectedBase.title} (Customized)`,
                description: `${selectedBase.description} (Modified by: ${modifier})`,
                persona: selectedBase.persona,
            });
        } finally {
            setIsGenerating(false);
        }
    };

    useEffect(() => {
        if (selectedBase) {
            setModifiedScenario(selectedBase);
        }
    }, [selectedBase]);

    const handleLaunch = () => {
        if (modifiedScenario) {
            setSelectedScenario(modifiedScenario);
            setCoachingLabView('scenario-prep');
        }
    };

    return (
        <div className="fixed inset-0 bg-[#0B3B5B]/90 z-50 flex items-center justify-center p-4">
            <div className="bg-[#FCFCFA] rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8">
                <div className="flex justify-between items-center border-b pb-4 mb-6">
                    <h2 className="text-2xl font-extrabold text-[#0B3B5B] flex items-center">
                        <Zap className="w-6 h-6 mr-3 text-[#E04E1B]" />
                        Dynamic Scenario Generator
                    </h2>
                    <button onClick={() => setCoachingLabView('scenario-library')} className="p-2 text-gray-500 hover:text-[#E04E1B] transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className='space-y-4'>
                    <label className="block text-sm font-medium text-gray-700">1. Select Base Conflict</label>
                    <select
                        value={selectedBaseId}
                        onChange={(e) => setSelectedBaseId(parseInt(e.target.value))}
                        className="w-full p-3 border border-gray-300 rounded-xl"
                        disabled={isGenerating}
                    >
                        {baseScenarios.map(s => (
                            <option key={s.id} value={s.id}>{s.title} (Persona: {s.persona})</option>
                        ))}
                    </select>

                    <label className="block text-sm font-medium text-gray-700 pt-4">2. Add Scenario Modifier (Optional)</label>
                    <input
                        type="text"
                        value={modifier}
                        onChange={(e) => setModifier(e.target.value)}
                        placeholder="e.g., 'They are an intern' or 'Conflict is over budget cuts'"
                        className="w-full p-3 border border-gray-300 rounded-xl"
                        disabled={isGenerating}
                    />

                    <Button onClick={handleGenerate} disabled={!selectedBase || isGenerating} className="w-full bg-[#E04E1B] hover:bg-red-700">
                        {isGenerating ? 
                            <span className="flex items-center justify-center"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div> Generating...</span> 
                            : 'Generate Adaptive Scenario'
                        }
                    </Button>
                </div>
                
                {modifiedScenario && (
                    <Card title="Generated Scenario Preview" icon={Info} className='mt-6 bg-[#219E8B]/10 border-2 border-[#219E8B]/20'>
                        <h4 className='text-lg font-bold text-[#0B3B5B]'>{modifiedScenario.title}</h4>
                        <p className='text-sm text-gray-700 mt-2'>{modifiedScenario.description}</p>
                        <p className='text-xs text-[#0B3B5B] mt-3 font-semibold'>AI Role: {modifiedScenario.persona}</p>
                    </Card>
                )}

                <Button onClick={handleLaunch} disabled={!modifiedScenario} className='mt-8 w-full'>
                    Launch Prep with Dynamic Scenario
                </Button>
            </div>
        </div>
    );
};


// --- SCENARIO LIBRARY VIEW (No changes needed) ---
const ScenarioLibraryView = ({ setCoachingLabView, setSelectedScenario }) => {
    const [isDynamicGeneratorVisible, setIsDynamicGeneratorVisible] = useState(false);
    
    const scenarios = [
        { id: 1, title: 'The Underperformer', description: 'A high-potential team member is consistently missing deadlines due to distraction.', persona: 'The Deflector', difficultyLevel: 60 },
        { id: 2, title: 'The Boundary Pusher', description: 'An employee repeatedly oversteps their authority when dealing with clients, creating tension.', persona: 'The Defender', difficultyLevel: 75 },
        { id: 3, title: 'The Silent Withdrawal', description: 'A direct report has become quiet and disengaged in meetings following a minor project failure.', persona: 'The Silent Stonewall', difficultyLevel: 45 },
        { id: 4, title: 'The Emotional Reaction', description: 'You need to deliver corrective feedback, and the employee is highly likely to become defensive or tearful.', persona: 'The Emotional Reactor', difficultyLevel: 90 },
        { id: 5, title: 'The Excessive Apologizer', description: 'A team member makes a small mistake and immediately apologizes repeatedly, paralyzing forward progress.', persona: 'The Over-Apologizer', difficultyLevel: 25 },
        { id: 6, title: 'The Team Blamer', description: 'An employee frequently attributes project failures to "someone else on the team" instead of taking personal responsibility.', persona: 'The Blame-Shifter', difficultyLevel: 80 },
        { id: 7, title: 'The Silent Observer', description: 'A highly capable team member consistently fails to speak up or contribute ideas during brainstorms or strategy discussions.', persona: 'The Passive Contributor', difficultyLevel: 50 },
    ];
    
    return (
    <div className="p-8">
    <h1 className="text-3xl font-extrabold text-[#0B3B5B] mb-4">Scenario Library: Practice Conversations</h1>
    <p className="text-lg text-gray-600 mb-6">Select a high-stakes scenario to practice your preparation process. Each scenario includes a unique persona for the AI simulator.</p>
    <Button onClick={() => setCoachingLabView('coaching-lab-home')} variant="outline" className="mb-8">
    <ArrowLeft className="w-5 h-5 mr-2" /> Back to Coaching Lab
    </Button>
    
      <Card title="Dynamic Scenario Generator" icon={Zap} className="mb-6 bg-[#0B3B5B]/10 border-l-4 border-[#E04E1B] rounded-3xl" onClick={() => setIsDynamicGeneratorVisible(true)}>
            <p className="text-gray-700 text-sm">Create a custom, adaptive scenario by choosing a core conflict and adding a unique **modifier** (e.g., personality, circumstance, or context).</p>
            <div className="mt-4 text-[#E04E1B] font-semibold flex items-center">
                Launch Generator <CornerRightUp className='w-4 h-4 ml-1'/>
            </div>
      </Card>
      
      <h2 className='text-xl font-bold text-[#0B3B5B] mb-4 border-b pb-1'>Pre-Seeded Scenarios</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {scenarios.map(scenario => (
          <Card key={scenario.id} title={scenario.title} className="border-l-4 border-[#219E8B] rounded-3xl" onClick={() => {
            setSelectedScenario(scenario);
            setCoachingLabView('scenario-prep');
          }}>
            <p className="text-sm text-gray-700 mb-3">{scenario.description}</p>
            <div className="text-xs font-semibold text-[#0B3B5B] bg-[#0B3B5B]/10 px-3 py-1 rounded-full inline-block">Persona: {scenario.persona}</div>
            <div className="mt-4 text-[#219E8B] font-semibold flex items-center">
              Start Preparation &rarr;
            </div>
          </Card>
        ))}
      </div>
      
      {isDynamicGeneratorVisible && <DynamicScenarioGenerator setCoachingLabView={setCoachingLabView} setSelectedScenario={setSelectedScenario} />}
    </div>
    
    
    );
};