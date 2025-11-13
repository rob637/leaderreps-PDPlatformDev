// src/components/screens/Labs.jsx

/* =========================================================
   PRODUCTION READY FILE: Labs.jsx 
   CLEANUP: Local mock datasets removed. Now relies entirely on useAppServices.
========================================================= */
/* eslint-disable no-console */
import React, { useState, useEffect, useMemo, useRef } from 'react';
// FIX: Import the real useAppServices from the standard path.
import { useAppServices } from '../../services/useAppServices.jsx'; 
import { AlertTriangle, ArrowLeft, BarChart3, Briefcase, CheckCircle, Clock, CornerRightUp, Cpu, Eye, HeartPulse, Info, Lightbulb, Mic, Play, PlusCircle, Send, ShieldCheck, Star, Target, TrendingUp, Users, X, Zap } from 'lucide-react'; 
import { COLORS, COMPLEXITY_MAP } from './labs/labConstants.js';

/* =========================================================
   UI Components (Unchanged)
========================================================= */
const Button = ({ children, onClick, disabled = false, variant = 'primary', className = '', ...rest }) => {
    let baseStyle = "px-6 py-3 rounded-xl font-semibold transition-all shadow-xl focus:outline-none focus:ring-4 text-white flex items-center justify-center";

    if (variant === 'primary') { baseStyle += ` bg-[${COLORS.TEAL}] hover:bg-[#349881] focus:ring-[#47A88D]/50`; } 
    else if (variant === 'secondary') { baseStyle += ` bg-[${COLORS.ORANGE}] hover:bg-red-700 focus:ring-[#E04E1B]/50`; } 
    else if (variant === 'outline') { baseStyle = `px-6 py-3 rounded-xl font-semibold transition-all shadow-md border-2 border-[${COLORS.TEAL}] text-[${COLORS.TEAL}] hover:bg-[#47A88D]/10 focus:ring-4 focus:ring-[#47A88D]/50 bg-[${COLORS.LIGHT_GRAY}] flex items-center justify-center`; }

    if (disabled) { baseStyle = "px-6 py-3 rounded-xl font-semibold bg-gray-300 text-gray-500 cursor-not-allowed shadow-inner transition-none flex items-center justify-center"; }

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
   COACHING LAB VIEWS (UPDATED FOR PRODUCTION API CALLS)
========================================================= */

const FollowUpCoach = ({ history }) => {
    // FIX: Use real hook
    const services = useAppServices(); 
    const { callSecureGeminiAPI, hasGeminiKey, GEMINI_MODEL } = services;

    const [followUpHistory, setFollowUpHistory] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const followUpRef = useRef(null);

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

const RolePlayCritique = ({ history, scenario, difficultyLevel, setView }) => {
    // FIX: Use real hook
    const services = useAppServices(); 
    const { callSecureGeminiAPI, hasGeminiKey, navigate, updateCommitmentData, GEMINI_MODEL } = services; 

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
        const regex = /### Next Practice Point\s*\n\n(.*?)(?:\n\n|z)/si;
        const match = critiqueText.match(regex);
        if (match && match[1]) {
            return match[1].trim().replace(/\*\*/g, '').replace(/(\r\n|\n|\r)/gm, " ");
        }
        return "Refine empathy and focus on measurable outcomes in your next practice session.";
    };

    // FIX: Save session data to commitmentData.practice_history upon successful critique
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
            
            // PRODUCTION FIX: Update the centralized commitmentData service
            updateCommitmentData(data => ({
                ...data,
                practice_history: [...(data?.practice_history || []), sessionData]
            }));
            console.log("Practice session logged to commitmentData.practice_history.");
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scoreBreakdown?.overall]); 


    useEffect(() => {
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

        (async () => {
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
    }, [history]);

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
            // PRODUCTION: Update commitment data
            await updateCommitmentData(data => ({
                ...data,
                active_commitments: [...(data?.active_commitments || []), newCommitment]
            }));
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

        const systemInstruction = `You are a world-class Executive Coach assessing a user's capacity for self-correction. Analyze the user's reflection against the provided AI critique. Determine if the user's reflection correctly identifies the root cause of their low score (if applicable) and if their proposed next steps align with the critique's 'Next Practice Point'. The output MUST be a clear Markdown response.`;

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
<div className={`p-3 mb-4 rounded-xl shadow-inner text-center font-semibold border-l-4 ${benchmarkDifference >= 0 ? 'bg-green-100 border-green-500 text-green-700' : 'bg-red-100 border-red-500 text-[#E04E1B]'}`}>
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
                    <h3 className='text-xl font-bold text-[#0B3B5B] mb-3 flex items-center'><Info className='w-5 h-5 mr-2 text-[#E04E1B]'/> Post-Critique Reflective Analysis</h3>
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
                
                <Button onClick={() => setView('coaching-lab-home')} variant='outline' className='mt-8 w-full'>
                    Return to Coaching Lab Home
                </Button>
            </Card>
            
            <FollowUpCoach history={history} />
        </div>
    );


};

// --- ROLE PLAY SIMULATOR VIEW ---
const RolePlayView = ({ scenario, setCoachingLabView, preparedSBI, difficultyLevel }) => {
    // FIX: Use real hook
    const services = useAppServices(); 
    const { callSecureGeminiAPI, hasGeminiKey, GEMINI_MODEL } = services; 

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
    
    const chatRef = useRef(null);
    
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

    const handleSaveSessionAndCritique = async () => {
        // Correctly set view to 'session ended' which triggers the critique component render
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

        const currentChat = history.map(msg => ({ 
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
                contents: currentChat,
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
        setIsPrimingModalVisible(false);
    };
    
    if (isPrimingModalVisible) {
        return (
            <div className="fixed inset-0 bg-[#0B3B5B]/90 z-50 flex items-center justify-center p-4">
                <div className="bg-[#FCFCFA] rounded-3xl shadow-2xl w-full max-w-lg p-8">
                    <h2 className="text-2xl font-extrabold text-[#0B3B5B] mb-4 flex items-center">
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
                    
                    <Button onClick={handlePrimingCheckIn} className='mt-6 w-full'>
                        Confirm Mindset & Launch Session
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
                    scenario={scenario} 
                    difficultyLevel={difficultyLevel} 
                    setView={setCoachingLabView}
                />
            </div>
        );
    }


    return (
        <div className="p-8">
            <h1 className="text-3xl font-extrabold text-[#0B3B5B] mb-4">Role-Play Simulator: {scenario.title}</h1>
            <p className="text-lg text-gray-600 mb-6 max-w-3xl">Practice your conversation with Alex, who is simulating **{scenario.persona}** behavior. Focus on using empathy and clear SBI feedback.</p>
            <Button onClick={handleSaveSessionAndCritique} variant="secondary" className="mb-8 bg-[#E04E1B] border-red-500 hover:bg-red-700">
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
                    <Card title={`Alex: The ${AI_PERSONA}`} icon={Users} className='h-full bg-[#0B3B5B]/10 border-2 border-[#0B3B5B]/20'>
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


// --- SCENARIO LIBRARY VIEW (Unchanged) ---
const ScenarioLibraryView = ({ setCoachingLabView, setSelectedScenario }) => {
    const [isDynamicGeneratorVisible, setIsDynamicGeneratorVisible] = useState(false);
    
    // Load scenarios from database via useAppServices
    const { SCENARIO_CATALOG } = useAppServices();
    const scenarios = useMemo(() => SCENARIO_CATALOG?.items || [], [SCENARIO_CATALOG]);
    
    
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
      
      {isDynamicGeneratorVisible && <DynamicScenarioGenerator setCoachingLabView={setCoachingLabView} setSelectedScenario={setSelectedScenario} setIsDynamicGeneratorVisible={setIsDynamicGeneratorVisible} />}
    </div>
    
    
    );
};


// --- MAIN COACHING LAB ROUTER ---
export default function CoachingLabScreen() {
    const [view, setView] = useState('coaching-lab-home');
    const [selectedScenario, setSelectedScenario] = useState(null);
    const [preparedSBI, setPreparedSBI] = useState(null);

    // CRITICAL FIX: Scroll to the top whenever the view state changes
    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [view]);

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
                // Check if session ended and needs to go to critique
                // PRODUCTION FIX: The sessionEnded state is now managed within the RolePlayView
                // This state check logic is simplified since RolePlayView handles its own critique display
                if (selectedScenario) {
                    return <RolePlayView 
                        scenario={selectedScenario} 
                        setCoachingLabView={setView}
                        preparedSBI={preparedSBI}
                        difficultyLevel={selectedScenario.difficultyLevel || 50}
                    />;
                }
                // Fallback if role-play state is invalid
                return <ScenarioLibraryView {...viewProps} />;

            default:
                return (
                    <div className="p-8">
                        <h1 className="text-3xl font-extrabold text-[#0B3B5B] mb-4">Coaching Lab</h1>
                        <p className="text-lg text-gray-600 mb-8">Welcome to the Coaching Lab. Select a tool to build your leadership skills.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <Card title="Scenario Library" icon={Briefcase} onClick={() => setView('scenario-library')}>
                                <p className="text-sm text-gray-600">Practice high-stakes conversations in a realistic AI role-play simulator.</p>
                            </Card>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <main>{renderView()}</main>
        </div>
    );
}