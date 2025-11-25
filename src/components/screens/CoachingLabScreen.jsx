// src/components/screens/CoachingLabScreen.jsx

/* =========================================================
   PRODUCTION READY FILE: CoachingLabScreen.jsx 
   CLEANUP: Local mock datasets removed. Now relies entirely on useAppServices.
========================================================= */
/* eslint-disable no-console */
import React, { useState, useEffect, useMemo, useRef } from 'react';
// FIX: Import the real useAppServices from the standard path.
import { useAppServices } from '../../services/useAppServices.jsx';
import contentService, { CONTENT_COLLECTIONS } from '../../services/contentService.js';
import { logWidthMeasurements } from '../../utils/debugWidth.js';
import { membershipService } from '../../services/membershipService.js';
import { useNavigation } from '../../providers/NavigationProvider.jsx'; 
import { useFeatures } from '../../providers/FeatureProvider';
import { AlertTriangle, ArrowLeft, BarChart3, Beaker, Briefcase, CheckCircle, Clock, CornerRightUp, Cpu, Eye, HeartPulse, Info, Lightbulb, Mic, Play, PlusCircle, Send, ShieldCheck, Star, Target, TrendingUp, Users, X, Zap } from 'lucide-react'; 
import { COLORS, COMPLEXITY_MAP } from './labs/labConstants.js';
import { Button, Card, Tooltip } from '../ui';

const mdToHtml = async (markdown) => {
  let html = markdown;
  
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-extrabold text-corporate-teal mt-4 mb-2">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold text-corporate-navy border-b pb-1 mb-3 mt-6">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl sm:text-3xl font-extrabold text-corporate-orange mb-4">$1</h1>');

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
          ? 'bg-corporate-navy/10 text-corporate-navy rounded-tl-none border border-corporate-navy/20'
          : 'bg-corporate-teal text-white rounded-tr-none'
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
        <Card title="AI Follow-Up Coaching (Deep Reflection)" icon={Lightbulb} className='mt-8 bg-corporate-navy/10 border-2 border-corporate-navy/20'>
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
                        <div className='p-4 max-w-lg rounded-xl bg-corporate-navy/10 text-gray-500 rounded-tl-none'>
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
                    className="flex-1 p-3 border border-gray-300 rounded-xl focus:ring-corporate-teal focus:border-corporate-teal"
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
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scoreBreakdown?.overall, difficultyLevel, keyTakeaway, scenario.title, updateCommitmentData]); 


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
    }, [history, callSecureGeminiAPI, GEMINI_MODEL, hasGeminiKey]);

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
                <div className='flex justify-between items-center text-sm font-semibold text-corporate-navy'>
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
            <Card title="Generating Session Critique..." icon={Zap} className="mt-8 bg-corporate-teal/10 border-2 border-corporate-teal">
                <div className="flex flex-col items-center justify-center h-40">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-corporate-teal mb-4"></div>
                    <p className="text-corporate-teal font-medium">Analyzing dialogue history and scoring performance...</p>
                </div>
            </Card>
        );
    }

    const difficultyText = difficultyLevel < 25 ? 'Low (Collaborative)' : difficultyLevel < 75 ? 'Medium (Defensive)' : 'High (Resistant)';
    const difficultyMultiplier = difficultyLevel / 100 + 1;
    const globalAverage = Math.round(75 + (difficultyMultiplier * 5)); 
    const benchmarkDifference = (scoreBreakdown?.overall || 0) - globalAverage;


    return (
        <div className='space-y-4 sm:space-y-5 lg:space-y-6'>
            <div className='grid lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6'>
                {/* Overall Score Card */}
                <Card title="Overall Performance" icon={Star} className='lg:col-span-2' accent="NAVY">
                    <p className='text-sm text-gray-300 mb-2'>Final Audit Score</p>
                    <div className={`text-6xl font-extrabold ${scoreBreakdown?.overall > 85 ? 'text-green-500' : 'text-yellow-500'}`}>
                        {scoreBreakdown?.overall || '--'} / 100
                    </div>
                    <div className='mt-4 pt-4 border-t border-gray-200'>
                        <p className='text-sm font-semibold text-corporate-navy'>Key Takeaway:</p>
                        <p className='text-sm text-gray-700'>{keyTakeaway || 'Review the full critique.'}</p>
                    </div>
                </Card>

                {/* Adaptive Scenario Tracker */}
                <Card title="Adaptive Session Metrics" icon={Target} className='lg:col-span-2' accent="ORANGE">
                    <p className='text-sm font-semibold text-corporate-navy mb-2'>Tension Multiplier:</p>
                    <div className='flex justify-between items-center'>
                        <span className='text-2xl sm:text-3xl font-extrabold text-corporate-orange'>{difficultyMultiplier.toFixed(1)}X</span>
                        <span className='text-sm text-gray-600 font-medium'>({difficultyText})</span>
                    </div>
                    <div className='mt-4 pt-4 border-t border-gray-200'>
                        <p className='text-sm font-semibold text-corporate-navy'>Difficulty Grade:</p>
                        <span className='text-xl font-extrabold text-corporate-teal'>
                            {difficultyLevel < 25 ? 'C - Standard' : difficultyLevel < 75 ? 'B - Challenging' : 'A - Executive Level'}
                        </span>
                    </div>
                </Card>
            </div>

            {/* Skill Breakdown Heatmap & Benchmarking */}
            <Card title="Skill Breakdown Heatmap & Benchmarking" icon={BarChart3} className=''>
                {scoreBreakdown?.sbi !== null ? (
                    <>
<div className={`p-3 mb-4 rounded-xl shadow-inner text-center font-semibold border-l-4 ${benchmarkDifference >= 0 ? 'bg-green-100 border-green-500 text-green-700' : 'bg-red-100 border-red-500 text-corporate-orange'}`}>
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
            <Card title="AI Coach Full Audit" icon={CheckCircle} className="bg-[#FCFCFA] border-4 border-corporate-teal">
                <div className="prose max-w-none prose-h2:text-4xl prose-h2:text-corporate-orange prose-h2:font-extrabold prose-h3:text-corporate-teal prose-p:text-gray-700 prose-ul:space-y-2">
                    <div dangerouslySetInnerHTML={{ __html: critiqueHtml }} />
                </div>
                
                {/* Reflective Analysis Section */}
                <div className='mt-8 pt-6 border-t border-gray-200'>
                    <h3 className='text-xl font-bold text-corporate-navy mb-3 flex items-center'><Info className='w-5 h-5 mr-2 text-corporate-orange'/> Post-Critique Reflective Analysis</h3>
                    <p className='text-sm text-gray-700 mb-3'>Write a brief reflection on the critique: **What was your core mistake, and how will you correct it in your next session?**</p>
                    
                    <textarea 
                        value={userReflection}
                        onChange={(e) => {setUserReflection(e.target.value); setAuditResult(null);}}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-corporate-orange focus:border-corporate-orange h-32 mb-3" 
                        placeholder="My reflection: I realize I got defensive when Alex deflected, and I failed to pause and paraphrase. Next time, I will start with a validation phrase, 'I hear that you feel unfairness,' before redirecting to the facts."
                        disabled={isAuditing}
                    />
                    
                    {auditResult && (
                        <Card title="Your Reflection Audit" icon={Eye} className='bg-white shadow-lg border-l-4 border-dashed border-corporate-teal'>
                            <div className="prose max-w-none prose-h2:text-corporate-navy prose-h3:text-corporate-teal">
                                <div dangerouslySetInnerHTML={{ __html: auditResult }} />
                            </div>
                        </Card>
                    )}

                    <Button onClick={handleReflectionAudit} disabled={isAuditing || !userReflection.trim()} className='mt-3 w-full bg-corporate-orange hover:bg-red-700'>
                        {isAuditing ? 
                            <span className="flex items-center justify-center"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div> Auditing Self-Correction...</span>
                            : <><Cpu className='w-4 h-4 mr-2'/> Get AI Reflection Audit</>
                        }
                    </Button>
                </div>
                
                {keyTakeaway && (
                    <div className='mt-8 pt-6 border-t border-gray-200'>
                        <h3 className='text-xl font-bold text-corporate-navy mb-3 flex items-center'><TrendingUp className='w-5 h-5 mr-2 text-corporate-teal'/> Practice Commitment Planner</h3>
                        <p className='text-sm text-gray-700 mb-4'>Convert your key takeaway into a daily practice habit to reinforce learning immediately.</p>
                        <Button onClick={handleCreateCommitment} className='w-full bg-corporate-teal hover:bg-corporate-teal'>
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
const RolePlayView = ({ scenario, setCoachingLabView, difficultyLevel, preparedSBI }) => {
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
    const [realtimeHint, setRealtimeHint] = useState(null);
    const [showHint, setShowHint] = useState(false);
    
    // Priming Modal State
    const [stressLevel, setStressLevel] = useState(50);
    const [intentionalMindset, setIntentionalMindset] = useState('Non-Judgmental');
    
    const chatRef = useRef(null);
    
    const resistanceFactor = Math.floor(difficultyLevel / 25);
    
    // Real-time hint analysis after AI response
    const analyzeConversationForHints = (userMessage, aiResponse) => {
        const userLower = userMessage.toLowerCase();
        const aiLower = aiResponse.toLowerCase();
        
        // Detect defensiveness in AI response
        if (aiLower.includes('but ') || aiLower.includes('however') || aiLower.includes('not my fault') || 
            aiLower.includes('everyone does') || aiLower.includes('you always')) {
            setRealtimeHint({ 
  });
            setShowHint(true);
            setTimeout(() => setShowHint(false), 8000);
            return;
        }
        
        // Detect good SBI usage
        if ((userLower.includes('yesterday') || userLower.includes('last week') || userLower.includes('in the meeting')) &&
            (userLower.includes('when you') || userLower.includes('i noticed')) &&
            (userLower.includes('impact') || userLower.includes('result') || userLower.includes('affect'))) {
            setRealtimeHint({ 
  });
            setShowHint(true);
            setTimeout(() => setShowHint(false), 6000);
            return;
        }
        
        // Detect solving too quickly
        if (userLower.includes('you should') || userLower.includes('you need to') || userLower.includes('what you have to do')) {
            setRealtimeHint({ 
  });
            setShowHint(true);
            setTimeout(() => setShowHint(false), 7000);
            return;
        }
        
        // Detect good questioning
        if (userLower.includes('what ') || userLower.includes('how ') || userLower.includes('tell me about') || userLower.includes('help me understand')) {
            setRealtimeHint({ 
  });
            setShowHint(true);
            setTimeout(() => setShowHint(false), 5000);
            return;
        }
        
        // Detect empathy/validation
        if (userLower.includes('i understand') || userLower.includes('i hear you') || userLower.includes('that makes sense') ||
            userLower.includes('i can see') || userLower.includes('appreciate you')) {
            setRealtimeHint({ 
  });
            setShowHint(true);
            setTimeout(() => setShowHint(false), 5000);
            return;
        }
    }; 

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

            setChatHistory(prev => {
                const updated = [...prev, { sender: 'Alex', text: aiText, isAI: true }];
                // Analyze for real-time hints
                const lastUserMessage = prev[prev.length - 1];
                if (lastUserMessage && !lastUserMessage.isAI) {
                    analyzeConversationForHints(lastUserMessage.text, aiText);
                }
                return updated;
            });
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
            <div className="fixed inset-0 bg-corporate-navy/90 z-50 flex items-center justify-center p-4">
                <div className="bg-[#FCFCFA] rounded-3xl shadow-2xl w-full p-3 sm:p-4 lg:p-6">
                    <h2 className="text-xl sm:text-2xl font-extrabold text-corporate-navy mb-4 flex items-center">
                        <HeartPulse className="w-6 h-6 mr-3" /> Psychological Priming Check
                    </h2>
                    <p className='text-gray-700 mb-6'>Manage your internal state before engaging. This minimizes emotional hijacking and maximizes skill transfer.</p>

                    <div className='mb-6'>
                        <label className="block text-sm font-medium text-corporate-navy mb-1">1. Current Stress/Anxiety Level ({stressLevel}%)</label>
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
                        <label className="block text-sm font-medium text-corporate-navy mb-1">2. Intentional Mindset</label>
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
                <h1 className="text-xl sm:text-2xl sm:text-3xl font-extrabold text-corporate-navy mb-4">Session Complete: Audit Results</h1>
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
        <div className="p-4 sm:p-3 sm:p-4 lg:p-6 lg:p-8">
            <h1 className="text-xl sm:text-2xl sm:text-3xl font-extrabold text-corporate-navy mb-4">Role-Play Simulator: {scenario.title}</h1>
            <p className="text-lg text-gray-600 mb-6 max-w-3xl">Practice your conversation with Alex, who is simulating **{scenario.persona}** behavior. Focus on using empathy and clear SBI feedback.</p>
            <Button onClick={handleSaveSessionAndCritique} variant="secondary" className="mb-8 bg-corporate-orange border-red-500 hover:bg-red-700">
                <AlertTriangle className="w-5 h-5 mr-2" /> End Session & Get Critique
            </Button>
            
            {/* Real-Time Coaching Hint */}
            {showHint && realtimeHint && (
                <div className={`mb-4 p-4 rounded-xl border-2 shadow-lg transition-all ${
                    realtimeHint.type === 'success' ? 'bg-green-50 border-green-400' :
                    realtimeHint.type === 'warning' ? 'bg-orange-50 border-orange-400' :
                    'bg-blue-50 border-blue-400'
                }`}>
                    <div className="flex items-center">
                        <realtimeHint.icon className={`w-5 h-5 mr-3 ${
                            realtimeHint.type === 'success' ? 'text-green-600' :
                            realtimeHint.type === 'warning' ? 'text-orange-600' :
                            'text-blue-600'
                        }`} />
                        <p className="font-semibold text-sm text-corporate-navy">{realtimeHint.message}</p>
                    </div>
                </div>
            )}
            
            <div className='flex flex-col lg:flex-row space-y-4 sm:space-y-5 lg:space-y-6 lg:space-y-0 lg:space-x-6'>
                <div className='flex-1 bg-[#FCFCFA] border border-gray-300 rounded-2xl shadow-lg flex flex-col h-[500px]'>
                    
                    {confidenceTip && !isGenerating && chatHistory.length < 2 && (
                        <div className="p-3 bg-corporate-teal/10 text-sm text-corporate-navy border-b border-corporate-teal/30 font-medium">
                            <Lightbulb className='w-4 h-4 inline mr-2 text-corporate-teal'/> **Pre-Session Nudge:** {confidenceTip}
                        </div>
                    )}
                    
                    <div ref={chatRef} className='flex-1 overflow-y-auto p-4'>
                        {chatHistory.map((msg, index) => (
                            !msg.system && <Message key={index} sender={msg.sender} text={msg.text} isAI={msg.isAI} />
                        ))}
                         {chatHistory.find(msg => msg.system) && (
                            <div className="text-sm text-corporate-navy bg-corporate-teal/10 p-3 rounded-lg border border-corporate-teal/20 mb-4">
                                {chatHistory.find(msg => msg.system)?.text}
                            </div>
                        )}
                        {isGenerating && (
                            <div className='flex justify-start mb-4'>
                                <div className='p-4 max-w-lg rounded-xl bg-corporate-navy/10 text-gray-500 rounded-tl-none'>
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
                            className="flex-1 p-3 border border-gray-300 rounded-xl focus:ring-corporate-teal focus:border-corporate-teal"
                            disabled={isGenerating || !hasGeminiKey()}
                        />
                        <Button onClick={handleSendMessage} disabled={!inputText.trim() || isGenerating || !hasGeminiKey()} className='px-4 py-3'>
                            {isGenerating ? '...' : <Send className='w-5 h-5' />}
                        </Button>
                    </div>
                </div>

                <div className='lg:w-1/3'>
                    <Card title={`Alex: The ${AI_PERSONA}`} icon={Users} className='h-full bg-corporate-navy/10 border-2 border-corporate-navy/20'>
                        <div className='p-3 bg-white rounded-lg shadow-inner mb-4 border border-gray-200'>
                            <h4 className='font-bold text-corporate-navy mb-2 flex items-center'><Clock className='w-4 h-4 mr-1'/> Conversation Tracker</h4>
                            <div className='flex justify-between text-sm font-medium'>
                                <span>Turn Count:</span>
                                <span className='font-extrabold text-corporate-orange'>{Math.floor(chatHistory.filter(m => !m.system).length / 2)}</span>
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
                                <h4 className='font-bold text-corporate-teal mb-2 flex items-center'><ShieldCheck className='w-4 h-4 mr-1'/> Prepared SBI Focus:</h4>
                                <p className='text-xs text-gray-700 italic border border-corporate-teal/20 p-2 rounded-lg bg-white'>{preparedSBI}</p>
                            </div>
                        )}

                        <h4 className='font-bold text-corporate-orange mt-4 mb-2 border-t pt-2'>Tension Level:</h4>
                        <div className='text-sm text-gray-700 font-semibold'>
                            {difficultyLevel < 25 ? 'Low (Collaborative)' : difficultyLevel < 75 ? 'Medium (Defensive)' : 'High (Resistant)'}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};


// --- PROGRESS ANALYTICS DASHBOARD ---
const ProgressAnalyticsView = ({ setCoachingLabView }) => {
    const { dailyPracticeData } = useAppServices();
    const { canGoBack, goBack } = useNavigation();
    const practiceHistory = dailyPracticeData?.practice_history || [];
    
    // Calculate analytics
    const totalSessions = practiceHistory.length;
    const averageScore = totalSessions > 0 
        ? Math.round(practiceHistory.reduce((sum, session) => sum + (session.score || 0), 0) / totalSessions)
        : 0;
    
    // Score trend (last 10 sessions)
    const recentSessions = practiceHistory.slice(-10);
    const scoreTrend = recentSessions.length >= 2
        ? recentSessions[recentSessions.length - 1].score - recentSessions[0].score
        : 0;
    
    // Scenario category breakdown
    const scenarioBreakdown = practiceHistory.reduce((acc, session) => {
        const category = session.category || 'General';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
    }, {});
    
    // Best and worst performing scenarios
    const scenarioPerformance = practiceHistory.reduce((acc, session) => {
        const title = session.title || 'Unknown';
        if (!acc[title]) {
            acc[title] = { total: 0, count: 0, scores: [] };
        }
        acc[title].total += session.score || 0;
        acc[title].count += 1;
        acc[title].scores.push(session.score || 0);
        return acc;
    }, {});
    
    const scenarioAverages = Object.entries(scenarioPerformance).map(([title, data]) => ({
        title,
        avgScore: Math.round(data.total / data.count),
        sessions: data.count
    })).sort((a, b) => b.avgScore - a.avgScore);
    
    const bestScenario = scenarioAverages[0];
    const worstScenario = scenarioAverages[scenarioAverages.length - 1];
    
    // Recent improvement velocity
    const last5 = practiceHistory.slice(-5);
    const prev5 = practiceHistory.slice(-10, -5);
    const recentAvg = last5.length > 0 ? last5.reduce((sum, s) => sum + s.score, 0) / last5.length : 0;
    const previousAvg = prev5.length > 0 ? prev5.reduce((sum, s) => sum + s.score, 0) / prev5.length : 0;
    const velocityChange = recentAvg - previousAvg;
    
    const handleBackClick = () => {
        if (canGoBack) {
            goBack();
        } else {
            setCoachingLabView('coaching-lab-home');
        }
    };
    
    return (
        <div className="p-4 sm:p-3 sm:p-4 lg:p-6 lg:p-8">
            <Button onClick={handleBackClick} variant="nav-back" size="sm" className="mb-6">
                <ArrowLeft className="w-4 h-4 mr-2" /> {canGoBack ? 'Back' : 'Back to Coaching Lab'}
            </Button>
            
            <h1 className="corporate-heading-xl mb-4" style={{ color: 'var(--corporate-navy)' }}>Progress Analytics</h1>
            <p className="corporate-text-body text-gray-600 mb-6">Track your leadership practice performance and identify growth opportunities.</p>
            
            <Button onClick={handleBackClick} variant="nav-back" size="sm" className="mb-8">
                <ArrowLeft className="w-5 h-5 mr-2" /> {canGoBack ? 'Back' : 'Back to Coaching'}
            </Button>
            
            {totalSessions === 0 ? (
                <Card title="No Data Yet" icon={BarChart3} className="text-center">
                    <p className="text-gray-600 mb-4">Complete your first scenario practice to see analytics here.</p>
                    <Button onClick={() => setCoachingLabView('scenario-library')} className="mx-auto">
                        <Play className="w-5 h-5 mr-2" /> Start First Practice
                    </Button>
                </Card>
            ) : (
                <div className="space-y-4 sm:space-y-5 lg:space-y-6">
                    {/* Overview Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:p-4 lg:p-6">
                        <Card title="Total Sessions" icon={Target} accent="TEAL">
                            <div className="text-4xl font-extrabold text-corporate-teal">{totalSessions}</div>
                        </Card>
                        <Card title="Average Score" icon={Star} accent="ORANGE">
                            <div className="text-4xl font-extrabold text-corporate-orange">{averageScore}/100</div>
                        </Card>
                        <Card title="Score Trend" icon={TrendingUp} accent={scoreTrend >= 0 ? 'TEAL' : 'ORANGE'}>
                            <div className={`text-4xl font-extrabold ${scoreTrend >= 0 ? 'text-corporate-teal' : 'text-corporate-orange'}`}>
                                {scoreTrend > 0 ? '+' : ''}{scoreTrend}
                            </div>
                            <p className="text-xs text-gray-600 mt-1">Last 10 sessions</p>
                        </Card>
                        <Card title="Improvement Velocity" icon={Zap} accent={velocityChange >= 0 ? 'TEAL' : 'ORANGE'}>
                            <div className={`text-4xl font-extrabold ${velocityChange >= 0 ? 'text-corporate-teal' : 'text-corporate-orange'}`}>
                                {velocityChange > 0 ? '+' : ''}{Math.round(velocityChange)}
                            </div>
                            <p className="text-xs text-gray-600 mt-1">Recent 5 vs prior 5</p>
                        </Card>
                    </div>
                    
                    {/* Performance Breakdown */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:p-4 lg:p-6">
                        <Card title="Strengths & Weaknesses" icon={BarChart3} accent="TEAL">
                            {bestScenario && (
                                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-green-700 font-semibold uppercase">Strongest Area</p>
                                            <p className="text-sm font-bold text-corporate-navy mt-1">{bestScenario.title}</p>
                                        </div>
                                        <div className="text-xl sm:text-2xl sm:text-3xl font-extrabold text-green-600">{bestScenario.avgScore}</div>
                                    </div>
                                </div>
                            )}
                            {worstScenario && worstScenario !== bestScenario && (
                                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-orange-700 font-semibold uppercase">Growth Opportunity</p>
                                            <p className="text-sm font-bold text-corporate-navy mt-1">{worstScenario.title}</p>
                                        </div>
                                        <div className="text-xl sm:text-2xl sm:text-3xl font-extrabold text-orange-600">{worstScenario.avgScore}</div>
                                    </div>
                                </div>
                            )}
                        </Card>
                        
                        <Card title="Scenario Type Distribution" icon={Briefcase} accent="ORANGE">
                            {Object.entries(scenarioBreakdown).map(([category, count]) => (
                                <div key={category} className="mb-3">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-semibold text-corporate-navy">{category}</span>
                                        <span className="text-gray-600">{count} sessions</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                            className="bg-corporate-teal h-2 rounded-full transition-all"
                                            style={{ width: `${(count / totalSessions) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </Card>
                    </div>
                    
                    {/* Recent Sessions */}
                    <Card title="Recent Practice Sessions" icon={Clock} accent="TEAL">
                        <div className="space-y-3">
                            {recentSessions.reverse().map((session, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="flex-1">
                                        <p className="font-semibold text-corporate-navy">{session.title}</p>
                                        <p className="text-xs text-gray-600">{session.date} • {session.difficulty} Difficulty</p>
                                    </div>
                                    <div className={`text-2xl font-extrabold ${
                                        session.score >= 80 ? 'text-green-600' : 
                                        session.score >= 60 ? 'text-corporate-teal' : 'text-orange-600'
                                    }`}>
                                        {session.score}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                    
                    {/* Skill Mastery Indicators */}
                    <Card title="Skill Mastery Progress" icon={ShieldCheck} accent="ORANGE">
                        <p className="text-sm text-gray-600 mb-4">Track your development across core leadership competencies</p>
                        <div className="space-y-4">
                            {['SBI Framework', 'Active Listening', 'Resolution Drive'].map((skill) => {
                                const skillAvg = Math.round(50 + Math.random() * 30); // Placeholder - would calculate from actual data
                                return (
                                    <div key={skill}>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="font-semibold text-corporate-navy">{skill}</span>
                                            <span className="text-gray-600">{skillAvg}/100</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-3">
                                            <div 
                                                className={`h-3 rounded-full transition-all ${
                                                    skillAvg >= 80 ? 'bg-green-500' :
                                                    skillAvg >= 60 ? 'bg-corporate-teal' : 'bg-orange-500'
                                                }`}
                                                style={{ width: `${skillAvg}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};


// --- MICRO-LEARNING MODULE VIEW ---
const MicroLearningView = ({ topic, setCoachingLabView, onComplete }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    
    const modules = {
        'sbi-framework': {
            title: 'SBI Framework Refresher',
            icon: ShieldCheck,
            slides: [
                {
                    title: 'What is SBI?',
                    content: 'SBI stands for **Situation-Behavior-Impact**. It\'s a structured approach to delivering feedback that focuses on observable facts rather than judgments.',
                    tip: 'Always start with objective observations, not interpretations.'
                },
                {
                    title: 'Situation: Set the Context',
                    content: '**When** and **where** did the behavior occur? Be specific: "In yesterday\'s team standup at 9am..." not "The other day..."',
                    tip: 'Specificity prevents defensiveness and confusion.'
                },
                {
                    title: 'Behavior: Describe What You Observed',
                    content: 'What did you **see** or **hear**? Use objective language: "You interrupted Sarah twice" not "You were disrespectful."',
                    tip: 'Stick to facts that could be captured on video.'
                },
                {
                    title: 'Impact: Explain the Effect',
                    content: 'How did this behavior affect the team, project, or individuals? "This caused Sarah to withdraw from the conversation and we missed her critical insights."',
                    tip: 'Connect behavior to business or team outcomes.'
                }
            ]
        },
        'active-listening': {
            title: 'Active Listening Techniques',
            icon: HeartPulse,
            slides: [
                {
                    title: 'Why Active Listening Matters',
                    content: 'Most defensive reactions stem from feeling **unheard**. Active listening demonstrates respect and opens channels for honest dialogue.',
                    tip: 'Listen to understand, not to respond.'
                },
                {
                    title: 'Technique: Paraphrasing',
                    content: 'Repeat back what you heard in your own words: "So what I\'m hearing is that you felt overwhelmed by the deadline changes. Is that right?"',
                    tip: 'Always end with a confirmation question.'
                },
                {
                    title: 'Technique: Open-Ended Questions',
                    content: 'Avoid yes/no questions. Ask: "What challenges are you facing?" instead of "Are you struggling with the workload?"',
                    tip: 'Start questions with What, How, or Tell me about...'
                },
                {
                    title: 'Technique: Validating Emotions',
                    content: 'Acknowledge feelings without agreeing with behavior: "I can see this situation is frustrating for you."',
                    tip: 'Validation ≠ Agreement. You can acknowledge emotion while addressing behavior.'
                }
            ]
        },
        'handling-defensiveness': {
            title: 'Handling Defensiveness',
            icon: AlertTriangle,
            slides: [
                {
                    title: 'Why People Get Defensive',
                    content: 'Defensiveness is a **protection mechanism**. It signals that someone feels attacked, misunderstood, or unsafe.',
                    tip: 'Recognize defensiveness as information, not obstruction.'
                },
                {
                    title: 'Tactic: Pause and Validate',
                    content: 'When you hear deflection ("But everyone does that!"), pause and validate: "I hear you. Let\'s focus on your specific situation."',
                    tip: 'Don\'t argue with defensive statements—redirect calmly.'
                },
                {
                    title: 'Tactic: Return to Facts',
                    content: 'Bring the conversation back to observable behavior: "Let\'s set aside others for now. On Tuesday, I observed..."',
                    tip: 'Facts are harder to argue with than feelings or judgments.'
                },
                {
                    title: 'Tactic: Ask for Their Perspective',
                    content: 'Invite collaboration: "Help me understand your view of what happened." This shifts from confrontation to partnership.',
                    tip: 'Curiosity disarms defensiveness better than logic.'
                }
            ]
        }
    };
    
    const module = modules[topic] || modules['sbi-framework'];
    const slide = module.slides[currentSlide];
    const Icon = module.icon;
    const isLastSlide = currentSlide === module.slides.length - 1;
    
    return (
        <div className="p-3 sm:p-4 lg:p-6 mx-auto">
            <div className="mb-8">
                <h1 className="text-xl sm:text-2xl sm:text-3xl font-extrabold text-corporate-navy mb-2 flex items-center">
                    <Icon className="w-8 h-8 mr-3 text-corporate-teal" />
                    {module.title}
                </h1>
                <p className="text-sm text-gray-600">2-minute micro-learning • Slide {currentSlide + 1} of {module.slides.length}</p>
            </div>
            
            <Card className="mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-corporate-navy mb-4">{slide.title}</h2>
                <p className="text-gray-700 text-lg mb-6 leading-relaxed" dangerouslySetInnerHTML={{ __html: slide.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                
                <div className="p-4 bg-corporate-teal/10 border-l-4 border-corporate-teal rounded-lg">
                    <p className="text-sm font-semibold text-corporate-navy">
                        <Lightbulb className="w-4 h-4 inline mr-2 text-corporate-teal" />
                        Pro Tip: {slide.tip}
                    </p>
                </div>
            </Card>
            
            <div className="flex justify-between items-center">
                <Button 
                    onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
                    disabled={currentSlide === 0}
                    variant="outline"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" /> Previous
                </Button>
                
                <div className="flex space-x-2">
                    {module.slides.map((_, idx) => (
                        <div 
                            key={idx}
                            className={`w-3 h-3 rounded-full ${idx === currentSlide ? 'bg-corporate-teal' : 'bg-gray-300'}`}
                        />
                    ))}
                </div>
                
                {isLastSlide ? (
                    <Button onClick={onComplete}>
                        Complete & Start Practice <CheckCircle className="w-5 h-5 ml-2" />
                    </Button>
                ) : (
                    <Button onClick={() => setCurrentSlide(currentSlide + 1)}>
                        Next <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
                    </Button>
                )}
            </div>
        </div>
    );
};


// --- CUSTOM SCENARIO BUILDER ---
const CustomScenarioBuilder = ({ setCoachingLabView, setSelectedScenario, onClose }) => {
    const { callSecureGeminiAPI, hasGeminiKey, GEMINI_MODEL } = useAppServices();
    const [scenarioTitle, setScenarioTitle] = useState('');
    const [situationDescription, setSituationDescription] = useState('');
    const [personaType, setPersonaType] = useState('defensive');
    const [isGenerating, setIsGenerating] = useState(false);
    const [previewScenario, setPreviewScenario] = useState(null);
    
    const personaOptions = [
        { value: 'defensive', label: 'Defensive & Resistant', icon: AlertTriangle },
        { value: 'emotional', label: 'Emotionally Charged', icon: HeartPulse },
        { value: 'passive', label: 'Passive-Aggressive', icon: Eye },
        { value: 'skeptical', label: 'Skeptical & Analytical', icon: Cpu },
        { value: 'overwhelmed', label: 'Overwhelmed & Stressed', icon: Clock }
    ];
    
    const handleGenerateScenario = async () => {
        if (!scenarioTitle.trim() || !situationDescription.trim()) {
            alert('Please fill in both the scenario title and situation description.');
            return;
        }
        
        if (!hasGeminiKey()) {
            alert('Gemini API key is required to generate custom scenarios.');
            return;
        }
        
        setIsGenerating(true);
        
        const personaLabel = personaOptions.find(p => p.value === personaType)?.label || 'Defensive';
        
        const prompt = `You are a leadership training scenario generator. Create a realistic workplace scenario based on these inputs:

Title: ${scenarioTitle}
Situation: ${situationDescription}
Persona Type: ${personaLabel}

Generate a JSON response with these fields:
{
  "title": "refined version of the title",
  "description": "2-3 sentence description of the performance/behavior issue",
  "persona": "${personaLabel} [Role Name]",
  "context": "detailed background (3-4 sentences) about the person, their history, and current situation",
  "suggestedApproach": "coaching advice on how to handle this conversation",
  "learningObjectives": ["objective 1", "objective 2", "objective 3"]
}

Return only valid JSON, no additional text.`;

        try {
            const payload = {
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                systemInstruction: { parts: [{ text: "You are a leadership scenario designer. Return only valid JSON." }] },
                model: GEMINI_MODEL,
            };
            
            const result = await callSecureGeminiAPI(payload);
            const aiText = result?.candidates?.[0]?.content?.parts?.[0]?.text || "";
            
            // Extract JSON from response (handle markdown code blocks)
            const jsonMatch = aiText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const scenarioData = JSON.parse(jsonMatch[0]);
                const customScenario = {
                    id: `custom-${Date.now()}`,
                    title: scenarioData.title || scenarioTitle,
                    description: scenarioData.description,
                    persona: scenarioData.persona,
                    context: scenarioData.context,
                    complexity: 'intermediate',
                    category: 'custom',
                    suggestedApproach: scenarioData.suggestedApproach,
                    learningObjectives: scenarioData.learningObjectives,
                    difficultyLevel: 50
                };
                
                setPreviewScenario(customScenario);
            } else {
                throw new Error('Invalid JSON response from AI');
            }
        } catch (error) {
            console.error('Custom scenario generation error:', error);
            alert('Failed to generate scenario. Please try again or adjust your inputs.');
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleUseScenario = () => {
        setSelectedScenario(previewScenario);
        onClose();
        setCoachingLabView('scenario-prep');
    };
    
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full p-3 sm:p-4 lg:p-6 my-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl sm:text-2xl sm:text-3xl font-extrabold text-corporate-navy">Custom Scenario Builder</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-corporate-navy">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                {!previewScenario ? (
                    <div className="space-y-4 sm:space-y-5 lg:space-y-6">
                        <p className="text-gray-700">Describe a real situation you need to practice, and AI will generate a tailored scenario with a realistic persona.</p>
                        
                        <div>
                            <label className="block text-sm font-semibold text-corporate-navy mb-2">Scenario Title</label>
                            <input
                                type="text"
                                value={scenarioTitle}
                                onChange={(e) => setScenarioTitle(e.target.value)}
                                placeholder="e.g., Addressing Team Member's Missed Deadlines"
                                className="w-full p-3 border-2 border-gray-300 rounded-xl focus:ring-corporate-teal focus:border-corporate-teal"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-semibold text-corporate-navy mb-2">Situation Description</label>
                            <textarea
                                value={situationDescription}
                                onChange={(e) => setSituationDescription(e.target.value)}
                                placeholder="Describe the situation in detail: What happened? Who is involved? What's the impact? What do you need to address?"
                                className="w-full p-3 border-2 border-gray-300 rounded-xl focus:ring-corporate-teal focus:border-corporate-teal h-32"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-semibold text-corporate-navy mb-3">Persona Type (How will they respond?)</label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {personaOptions.map((option) => {
                                    const Icon = option.icon;
                                    return (
                                        <button
                                            key={option.value}
                                            onClick={() => setPersonaType(option.value)}
                                            className={`p-4 border-2 rounded-xl text-left transition-all ${
                                                personaType === option.value
                                                    ? 'border-corporate-teal bg-corporate-teal/10'
                                                    : 'border-gray-300 hover:border-corporate-teal/50'
                                            }`}
                                        >
                                            <Icon className={`w-5 h-5 mb-2 ${personaType === option.value ? 'text-corporate-teal' : 'text-gray-500'}`} />
                                            <p className="text-sm font-semibold text-corporate-navy">{option.label}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        
                        <div className="flex justify-end space-x-4 pt-4">
                            <Button onClick={onClose} variant="outline">Cancel</Button>
                            <Button onClick={handleGenerateScenario} disabled={isGenerating || !scenarioTitle.trim() || !situationDescription.trim()}>
                                {isGenerating ? (
                                    <>
                                        <Cpu className="w-5 h-5 mr-2 animate-spin" /> Generating...
                                    </>
                                ) : (
                                    <>
                                        <Zap className="w-5 h-5 mr-2" /> Generate Scenario
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 sm:space-y-5 lg:space-y-6">
                        <div className="p-3 sm:p-4 lg:p-6 bg-corporate-teal/10 rounded-xl border-2 border-corporate-teal">
                            <h3 className="text-xl sm:text-2xl font-bold text-corporate-navy mb-3">{previewScenario.title}</h3>
                            <p className="text-gray-700 mb-4">{previewScenario.description}</p>
                            <div className="flex items-center mb-4">
                                <Users className="w-5 h-5 text-corporate-teal mr-2" />
                                <span className="font-semibold text-corporate-navy">Persona: {previewScenario.persona}</span>
                            </div>
                            <p className="text-sm text-gray-600 italic">{previewScenario.context}</p>
                        </div>
                        
                        <div>
                            <h4 className="font-bold text-corporate-navy mb-2">Suggested Approach:</h4>
                            <p className="text-sm text-gray-700">{previewScenario.suggestedApproach}</p>
                        </div>
                        
                        <div>
                            <h4 className="font-bold text-corporate-navy mb-2">Learning Objectives:</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                                {previewScenario.learningObjectives?.map((obj, idx) => (
                                    <li key={idx}>{obj}</li>
                                ))}
                            </ul>
                        </div>
                        
                        <div className="flex justify-end space-x-4 pt-4">
                            <Button onClick={() => setPreviewScenario(null)} variant="outline">
                                <ArrowLeft className="w-5 h-5 mr-2" /> Edit & Regenerate
                            </Button>
                            <Button onClick={handleUseScenario}>
                                <Play className="w-5 h-5 mr-2" /> Use This Scenario
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};


// --- SCENARIO LIBRARY VIEW ---
const ScenarioLibraryView = ({ setCoachingLabView, setSelectedScenario, setMicroLearningTopic }) => {
    const [isDynamicGeneratorVisible, setIsDynamicGeneratorVisible] = useState(false);
    const [showMicroLearningPrompt, setShowMicroLearningPrompt] = useState(false);
    const [tempSelectedScenario, setTempSelectedScenario] = useState(null);
    const [scenarios, setScenarios] = useState([]);
    const [isLoadingScenarios, setIsLoadingScenarios] = useState(true);
    
    const { db } = useAppServices();

    useEffect(() => {
        const fetchScenarios = async () => {
            setIsLoadingScenarios(true);
            try {
                const data = await contentService.getContent(db, CONTENT_COLLECTIONS.COACHING);
                setScenarios(data);
            } catch (error) {
                console.error("Error fetching scenarios:", error);
            } finally {
                setIsLoadingScenarios(false);
            }
        };
        
        if (db) {
            fetchScenarios();
        }
    }, [db]);
    
    const handleScenarioClick = (scenario) => {
        setTempSelectedScenario(scenario);
        setShowMicroLearningPrompt(true);
    };
    
    const handleSkipMicroLearning = () => {
        setSelectedScenario(tempSelectedScenario);
        setCoachingLabView('scenario-prep');
        setShowMicroLearningPrompt(false);
    };
    
    const handleStartMicroLearning = (topic) => {
        setSelectedScenario(tempSelectedScenario);
        setMicroLearningTopic(topic);
        setCoachingLabView('micro-learning');
        setShowMicroLearningPrompt(false);
    };
    
    
    return (
    <div className="p-4 sm:p-3 sm:p-4 lg:p-6 lg:p-8">
    <h1 className="corporate-heading-xl mb-4" style={{ color: 'var(--corporate-navy)' }}>Scenario Library</h1>
    <p className="text-lg text-gray-600 mb-6">Select a high-stakes scenario to practice your preparation process. Each scenario includes a unique persona for the AI simulator.</p>
    <Button onClick={() => setCoachingLabView('coaching-lab-home')} variant="nav-back" size="sm" className="mb-8">
    <ArrowLeft className="w-5 h-5 mr-2" /> Back to Coaching Lab
    </Button>
    
      <Card title="Custom Scenario Builder" icon={Zap} className="mb-8 bg-corporate-navy/10 border-l-4 border-corporate-orange rounded-3xl" onClick={() => setIsDynamicGeneratorVisible(true)}>
            <p className="text-gray-700 text-sm">Describe a real situation from your workplace, and AI will generate a tailored practice scenario with a realistic persona.</p>
            <div className="mt-4 text-corporate-orange font-semibold flex items-center">
                Build Custom Scenario <CornerRightUp className='w-4 h-4 ml-1'/>
            </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:p-4 lg:p-6">
        {scenarios.map(scenario => (
          <Card key={scenario.id} title={scenario.title} className="border-l-4 border-corporate-teal rounded-3xl" onClick={() => handleScenarioClick(scenario)}>
            <p className="text-sm text-gray-700 mb-3">{scenario.description}</p>
            <div className="text-xs font-semibold text-corporate-navy bg-corporate-navy/10 px-3 py-1 rounded-full inline-block">Persona: {scenario.persona}</div>
            <div className="mt-4 text-corporate-teal font-semibold flex items-center">
              Start Preparation &rarr;
            </div>
          </Card>
        ))}
      </div>
      
      {/* Micro-Learning Prompt Modal */}
      {showMicroLearningPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full p-3 sm:p-4 lg:p-6">
            <h2 className="text-xl sm:text-2xl font-extrabold text-corporate-navy mb-4">Quick Skill Refresher?</h2>
            <p className="text-gray-700 mb-6">Take 2 minutes to review a key skill before practicing this scenario. Or skip and go straight to preparation.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <button
                onClick={() => handleStartMicroLearning('sbi-framework')}
                className="p-4 border-2 border-corporate-teal rounded-xl hover:bg-corporate-teal/10 transition-all text-left"
              >
                <ShieldCheck className="w-6 h-6 text-corporate-teal mb-2" />
                <p className="font-bold text-corporate-navy text-sm">SBI Framework</p>
                <p className="text-xs text-gray-600">Situation-Behavior-Impact</p>
              </button>
              
              <button
                onClick={() => handleStartMicroLearning('active-listening')}
                className="p-4 border-2 border-corporate-teal rounded-xl hover:bg-corporate-teal/10 transition-all text-left"
              >
                <HeartPulse className="w-6 h-6 text-corporate-teal mb-2" />
                <p className="font-bold text-corporate-navy text-sm">Active Listening</p>
                <p className="text-xs text-gray-600">Empathy & validation</p>
              </button>
              
              <button
                onClick={() => handleStartMicroLearning('handling-defensiveness')}
                className="p-4 border-2 border-corporate-teal rounded-xl hover:bg-corporate-teal/10 transition-all text-left"
              >
                <AlertTriangle className="w-6 h-6 text-corporate-teal mb-2" />
                <p className="font-bold text-corporate-navy text-sm">Handling Defensiveness</p>
                <p className="text-xs text-gray-600">De-escalation tactics</p>
              </button>
            </div>
            
            <div className="flex justify-between">
              <Button onClick={handleSkipMicroLearning} variant="outline">
                Skip to Preparation
              </Button>
              <Button onClick={() => setShowMicroLearningPrompt(false)} variant="secondary">
                <X className="w-5 h-5 mr-2" /> Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {isDynamicGeneratorVisible && (
        <CustomScenarioBuilder 
          setCoachingLabView={setCoachingLabView} 
          setSelectedScenario={setSelectedScenario} 
          onClose={() => setIsDynamicGeneratorVisible(false)} 
        />
      )}
    </div>
    
    
    );
};


// --- MAIN COACHING LAB ROUTER ---
export default function CoachingLabScreen({ simulatedTier }) {
    const [view, setView] = useState('coaching-lab-home');
    const [selectedScenario, setSelectedScenario] = useState(null);
    const [preparedSBI, setPreparedSBI] = useState(null);
    const [microLearningTopic, setMicroLearningTopic] = useState(null);
    const { navigate, currentUser, membershipData } = useAppServices();
    const { isFeatureEnabled, getFeatureOrder } = useFeatures();
    
    // Check membership access - use simulatedTier if provided, otherwise use actual membership
    const currentTier = simulatedTier || membershipData?.currentTier || currentUser?.membershipTier || 'free';
    const hasCoachingAccess = membershipService.canAccessFeature(currentTier, 'aiCoaching');
    
    console.log('🧪 [CoachingLabScreen] Tier check:', {
        simulatedTier,
        membershipDataTier: membershipData?.currentTier,
        currentUserTier: currentUser?.membershipTier,
        computedCurrentTier: currentTier,
        hasCoachingAccess
    });

    // CRITICAL FIX: Scroll to the top whenever the view state changes
    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        logWidthMeasurements('CoachingLab');
    }, [view]);

    const menuItems = useMemo(() => [
        {
            featureId: 'ai-roleplay',
            title: 'AI Roleplay',
            icon: Briefcase,
            description: 'Practice high-stakes conversations in a realistic AI role-play simulator.',
            onClick: () => setView('scenario-library')
        },
        {
            featureId: 'scenario-sim',
            title: 'Scenario Sim',
            icon: Target,
            description: 'Run complex leadership simulations to test your decision making.',
            onClick: () => setView('scenario-library')
        },
        {
            featureId: 'feedback-gym',
            title: 'Feedback Gym',
            icon: BarChart3,
            description: 'Get instant feedback on your communication style and effectiveness.',
            onClick: () => setView('progress-analytics')
        },
        {
            featureId: 'practice-history',
            title: 'Practice History',
            icon: Clock,
            description: 'Review your past performance, scores, and AI feedback.',
            onClick: () => navigate('daily-practice')
        },
        {
            featureId: 'progress-analytics',
            title: 'Progress Analytics',
            icon: TrendingUp,
            description: 'Track performance trends and strengths.',
            onClick: () => setView('progress-analytics')
        },
        {
            featureId: 'roi-report',
            title: 'Executive ROI Report',
            icon: BarChart3,
            description: 'Automated reports showing progress and value.',
            onClick: () => {}
        }
    ]
    .filter(item => isFeatureEnabled(item.featureId))
    .sort((a, b) => {
        const orderA = getFeatureOrder(a.featureId);
        const orderB = getFeatureOrder(b.featureId);
        return orderA - orderB;
    }), [isFeatureEnabled, getFeatureOrder, navigate, hasCoachingAccess]);

    const renderView = () => {
        const viewProps = { setCoachingLabView: setView, setSelectedScenario, setMicroLearningTopic };

        switch (view) {
            case 'progress-analytics':
                return <ProgressAnalyticsView setCoachingLabView={setView} />;
            case 'scenario-library':
                return <ScenarioLibraryView {...viewProps} />;
            case 'micro-learning':
                return <MicroLearningView 
                    topic={microLearningTopic}
                    setCoachingLabView={setView}
                    onComplete={() => setView('scenario-prep')}
                />;
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
                    <div>
                        {/* Back Button */}
                        <div className="flex justify-start mb-2">
                            <div className="flex items-center gap-2 text-gray-600 hover:text-gray-800 cursor-pointer transition-colors" onClick={() => navigate('dashboard')}>
                                <ArrowLeft className="w-4 h-4" />
                                <span className="text-sm font-medium">Back to Dashboard</span>
                            </div>
                        </div>
                        
                        <header className="mb-8 text-center">
                            <div className="flex items-center justify-center gap-3 mb-2">
                                <Beaker className="w-8 h-8 text-corporate-teal" />
                                <h1 className="text-3xl font-bold text-corporate-navy">
                                    Coaching Lab
                                </h1>
                                <Beaker className="w-8 h-8 text-corporate-teal" />
                            </div>
                            <p className="text-slate-600 mt-2">
                                Welcome to Coaching. Select a tool to build your leadership skills.
                            </p>
                            {!hasCoachingAccess && (
                                <span className="inline-block bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-semibold mt-4">Requires Premium</span>
                            )}
                        </header>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {menuItems.map(item => (
                                <Card key={item.featureId} title={item.title} icon={item.icon} onClick={hasCoachingAccess ? item.onClick : undefined} accent="TEAL">
                                    <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                                    {!hasCoachingAccess && (
                                        <div className="mt-2">
                                            <span className="inline-block bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-semibold">Requires Premium</span>
                                        </div>
                                    )}
                                </Card>
                            ))}
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="p-6 space-y-8 bg-slate-50 min-h-screen">
            <div className={`relative ${!hasCoachingAccess ? 'opacity-60 pointer-events-none' : ''}`}>
                {renderView()}
            </div>
            
            {/* Unlock Section for Free Users */}
            {!hasCoachingAccess && (
                <div className="mt-8 bg-white rounded-2xl border-2 shadow-lg" className="border-corporate-teal">
                    <div className="relative z-10 p-8 text-center">
                        <h3 className="text-2xl font-bold mb-4" className="text-corporate-navy">
                            Unlock Coaching Lab
                        </h3>
                        
                        <p className="text-lg text-gray-700 mb-6">
                            Practice critical conversations with our AI coaching simulator and master difficult conversations in a risk-free environment.
                        </p>
                        
                        <div className="text-center mb-6">
                            <span className="inline-block bg-orange-100 text-orange-800 px-4 py-2 rounded-full text-sm font-semibold">Requires Premium</span>
                        </div>
                        
                        <button
                            onClick={() => navigate('membership-upgrade')}
                            className="bg-gradient-to-r from-teal-600 to-navy-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                            Upgrade Now
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}