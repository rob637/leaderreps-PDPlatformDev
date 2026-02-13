// src/components/rep/RepUpCoach.jsx
// Standalone AI Coach for RepUp PWA
// Full-screen version of the coach functionality with PERSISTENT MEMORY

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  MessageSquare, Send, Loader2, AlertCircle, Target, Brain, History, Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { doc, setDoc, getDoc, collection, query, orderBy, limit, getDocs, serverTimestamp } from 'firebase/firestore';
import { useAppServices } from '../../services/useAppServices';
import { useDailyPlan } from '../../hooks/useDailyPlan';
import { useLeaderProfile } from '../../hooks/useLeaderProfile';
import conditioningService from '../../services/conditioningService';

// Quick prompts for different scenarios - diverse leadership topics
const QUICK_PROMPTS = [
  { label: 'Motivating my team', prompt: 'How do I motivate my team during a challenging project?' },
  { label: 'Delegating effectively', prompt: 'How can I delegate more effectively without micromanaging?' },
  { label: 'Making tough decisions', prompt: 'How do I make difficult decisions when there is no clear answer?' },
  { label: 'Building trust', prompt: 'How do I build trust with a new team I just inherited?' },
  { label: 'Strategic thinking', prompt: 'How can I think more strategically as a leader?' },
  { label: 'Managing up', prompt: 'How do I manage up and influence senior leadership?' }
];

// CLEAR-based coaching responses (fallback when AI unavailable)
const generateCLEARResponse = (question) => {
  const q = question.toLowerCase();
  
  if (q.includes('prep') || q.includes('prepare') || q.includes('before the conversation')) {
    return {
      intro: "Here's how to prep for your leadership rep:",
      steps: [
        { letter: 'C', text: "Context: Write down the SPECIFIC situation you need to address (facts only, no judgment)" },
        { letter: 'L', text: "Listen first: Plan an opening question to understand their perspective before you speak" },
        { letter: 'E', text: "Explore: What behavior do you want to address? Be specific about what you observed" },
        { letter: 'A', text: "Action: What commitment will you ask for? Make it measurable and time-bound" },
        { letter: 'R', text: "Review: When will you follow up to check on the commitment?" }
      ],
      guardrail: "Remember: This prep is for thinking, not scripting. The real rep happens in person."
    };
  }
  
  if (q.includes('nervous') || q.includes('scared') || q.includes('anxious') || q.includes('worried')) {
    return {
      intro: "It's normal to feel nervous. Here's how to move forward:",
      steps: [
        { letter: 'C', text: "Context: Name what you're afraid of. Say it out loud: 'I'm worried that...'" },
        { letter: 'L', text: "Listen: Often we fear their reaction. But what if they actually want this feedback?" },
        { letter: 'E', text: "Explore: What's the cost of NOT having this conversation? It's usually higher than the risk" },
        { letter: 'A', text: "Action: Start small. Your opening doesn't have to be perfect. 'I wanted to talk about...' works" },
        { letter: 'R', text: "Review: After the rep, you'll realize it wasn't as bad as you imagined. This builds confidence" }
      ],
      guardrail: "Courage isn't the absence of fear. It's action despite fear. You've got this."
    };
  }
  
  if (q.includes('feedback') || q.includes('difficult conversation') || q.includes('give feedback')) {
    return {
      intro: "Use the CLEAR method for this:",
      steps: [
        { letter: 'C', text: "Context: Start by describing the specific situation you observed" },
        { letter: 'L', text: "Listen: Ask them how they perceived the situation first" },
        { letter: 'E', text: "Explore: 'What do you think led to this outcome?'" },
        { letter: 'A', text: "Action: Agree on 1-2 specific changes they'll make" },
        { letter: 'R', text: "Review: Set a time to check in on progress" }
      ]
    };
  }
  
  if (q.includes('1:1') || q.includes('one on one') || q.includes('coaching')) {
    return {
      intro: "Structure your 1:1 with CLEAR:",
      steps: [
        { letter: 'C', text: "Context: Start with their wins and recent work" },
        { letter: 'L', text: "Listen: Ask 'What's on your mind today?'" },
        { letter: 'E', text: "Explore: Dig into challenges with curious questions" },
        { letter: 'A', text: "Action: End with clear commitments from both sides" },
        { letter: 'R', text: "Review: Note follow-ups for next 1:1" }
      ]
    };
  }
  
  if (q.includes('conflict') || q.includes('disagree') || q.includes('tension')) {
    return {
      intro: "Navigate conflict with CLEAR:",
      steps: [
        { letter: 'C', text: "Context: Describe the situation objectively, no blame" },
        { letter: 'L', text: "Listen: Meet with each person separately first" },
        { letter: 'E', text: "Explore: 'What does a good outcome look like for you?'" },
        { letter: 'A', text: "Action: Find common ground, agree on working norms" },
        { letter: 'R', text: "Review: Check back in 1 week to assess progress" }
      ]
    };
  }
  
  if (q.includes('performance') || q.includes('underperform')) {
    return {
      intro: "Address performance using CLEAR:",
      steps: [
        { letter: 'C', text: "Context: 'I've noticed [specific examples] over the past [time]'" },
        { letter: 'L', text: "Listen: 'Help me understand what's happening from your perspective'" },
        { letter: 'E', text: "Explore: 'What barriers are you facing? What support do you need?'" },
        { letter: 'A', text: "Action: Co-create a specific improvement plan with deadlines" },
        { letter: 'R', text: "Review: 'Let's meet weekly to track progress together'" }
      ]
    };
  }
  
  // Default response
  return {
    intro: "Apply the CLEAR method to this situation:",
    steps: [
      { letter: 'C', text: "Context: Ground the conversation in specific facts" },
      { letter: 'L', text: "Listen: Seek to understand before being understood" },
      { letter: 'E', text: "Explore: Use open questions to uncover root causes" },
      { letter: 'A', text: "Action: Define clear, measurable next steps" },
      { letter: 'R', text: "Review: Set a follow-up to ensure accountability" }
    ]
  };
};

const RepUpCoach = ({ userId: _userId, onSwitchToReps }) => {
  const { user, db } = useAppServices();
  const { cohortData, currentDayData, weekNumber } = useDailyPlan();
  const { profile: leaderProfile, loading: profileLoading } = useLeaderProfile();
  
  const [userQuestion, setUserQuestion] = useState('');
  const [coachResponse, setCoachResponse] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [memoryLoaded, setMemoryLoaded] = useState(false);
  const [conversationCount, setConversationCount] = useState(0);
  const [repHistory, setRepHistory] = useState([]);
  const [firstChatDate, setFirstChatDate] = useState(null);
  const [commitments, setCommitments] = useState([]);
  const [topicPatterns, setTopicPatterns] = useState({});
  const inputRef = useRef(null);
  const chatContainerRef = useRef(null);

  const firstName = user?.displayName?.split(' ')[0] || 'Leader';
  const userId = user?.uid;

  // Analyze topic patterns from past conversations
  const analyzeTopicPatterns = useCallback((conversations) => {
    const patterns = {
      feedback: 0,
      delegation: 0,
      motivation: 0,
      conflict: 0,
      performance: 0,
      strategy: 0,
      communication: 0,
      trust: 0,
      decisions: 0
    };
    
    conversations.forEach(conv => {
      const text = (conv.userMessage || '').toLowerCase();
      if (text.match(/feedback|critique|tough conversation/)) patterns.feedback++;
      if (text.match(/delegat|handoff|assign/)) patterns.delegation++;
      if (text.match(/motivat|engag|inspir|morale/)) patterns.motivation++;
      if (text.match(/conflict|disagree|tension|fight/)) patterns.conflict++;
      if (text.match(/perform|underperform|pip|improve/)) patterns.performance++;
      if (text.match(/strateg|vision|goal|objective|priority/)) patterns.strategy++;
      if (text.match(/communicat|message|present|email/)) patterns.communication++;
      if (text.match(/trust|relationship|rapport/)) patterns.trust++;
      if (text.match(/decision|decide|choice|uncertain/)) patterns.decisions++;
    });
    
    return patterns;
  }, []);

  // Extract commitments from AI responses
  const extractCommitments = useCallback((conversations) => {
    const commitmentPatterns = [
      /I('ll| will) try ([^.!?]+)/gi,
      /commit(ted)? to ([^.!?]+)/gi,
      /going to ([^.!?]+)/gi,
      /my action.{0,20}is ([^.!?]+)/gi
    ];
    
    const foundCommitments = [];
    conversations.slice(0, 10).forEach(conv => {
      const userText = conv.userMessage || '';
      commitmentPatterns.forEach(pattern => {
        const matches = userText.matchAll(pattern);
        for (const match of matches) {
          foundCommitments.push({
            text: match[0],
            date: conv.timestamp?.toDate?.() || new Date()
          });
        }
      });
    });
    
    return foundCommitments.slice(0, 5);
  }, []);

  // Load persistent conversation history and rep history on mount
  useEffect(() => {
    if (!userId || !db) return;
    
    const loadMemory = async () => {
      try {
        // Load saved conversations from Firestore
        const conversationsRef = collection(db, `users/${userId}/coach_conversations`);
        const q = query(conversationsRef, orderBy('timestamp', 'desc'), limit(50));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const conversations = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          // Get first chat date
          const oldest = conversations[conversations.length - 1];
          if (oldest?.timestamp) {
            setFirstChatDate(oldest.timestamp.toDate?.() || new Date(oldest.timestamp));
          }
          
          // Analyze topic patterns
          const patterns = analyzeTopicPatterns(conversations);
          setTopicPatterns(patterns);
          
          // Extract commitments user has made
          const userCommitments = extractCommitments(conversations);
          setCommitments(userCommitments);
          
          // Build chat history from past conversations (most recent 20 exchanges)
          const history = [];
          const recentConversations = conversations.slice(0, 20).reverse();
          recentConversations.forEach(conv => {
            if (conv.userMessage) {
              history.push({ role: 'user', content: conv.userMessage });
            }
            if (conv.assistantMessage) {
              history.push({ role: 'assistant', content: conv.assistantMessage });
            }
          });
          
          setChatHistory(history);
          setConversationCount(snapshot.docs.length);
        }
        
        // Load rep history for context
        const reps = await conditioningService.getRepHistory(userId, { limit: 10 });
        setRepHistory(reps || []);
        
        setMemoryLoaded(true);
      } catch (error) {
        console.error('Error loading coach memory:', error);
        setMemoryLoaded(true); // Still mark as loaded to unblock UI
      }
    };
    
    loadMemory();
  }, [userId, db, analyzeTopicPatterns, extractCommitments]);

  // Save conversation to Firestore
  const saveConversation = useCallback(async (userMsg, assistantMsg) => {
    if (!userId || !db) return;
    
    try {
      const conversationsRef = collection(db, `users/${userId}/coach_conversations`);
      const conversationDoc = doc(conversationsRef);
      
      await setDoc(conversationDoc, {
        userMessage: userMsg,
        assistantMessage: assistantMsg,
        timestamp: serverTimestamp(),
        dayNumber: currentDayData?.dayNumber || 1,
        cohortName: cohortData?.name || null
      });
      
      setConversationCount(prev => prev + 1);
      if (!firstChatDate) {
        setFirstChatDate(new Date());
      }
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  }, [userId, db, currentDayData?.dayNumber, cohortData?.name, firstChatDate]);

  // Build rich context for AI including leader profile and rep history
  const buildRichContext = useCallback(() => {
    const parts = [];
    
    // Leader profile context
    if (leaderProfile) {
      parts.push(`LEADER PROFILE (Remember this about ${firstName}):`);
      if (leaderProfile.primaryGoal) parts.push(`- Primary Goal: ${leaderProfile.primaryGoal}`);
      if (leaderProfile.biggestChallenge) parts.push(`- Biggest Challenge: ${leaderProfile.biggestChallenge}`);
      if (leaderProfile.leadershipStyle) parts.push(`- Leadership Style: ${leaderProfile.leadershipStyle}`);
      if (leaderProfile.leadershipStyleDescription) parts.push(`- Style Details: ${leaderProfile.leadershipStyleDescription}`);
      if (leaderProfile.directReports) parts.push(`- Direct Reports: ${leaderProfile.directReports}`);
      if (leaderProfile.yearsManaging) parts.push(`- Years Managing: ${leaderProfile.yearsManaging}`);
      if (leaderProfile.companyName || leaderProfile.company) parts.push(`- Company: ${leaderProfile.companyName || leaderProfile.company}`);
      if (leaderProfile.industry) parts.push(`- Industry: ${leaderProfile.industry}`);
      if (leaderProfile.jobTitle) parts.push(`- Title: ${leaderProfile.jobTitle}`);
      if (leaderProfile.successDefinition) parts.push(`- Success Definition: ${leaderProfile.successDefinition}`);
      // Feedback skills (scored 1-10)
      if (leaderProfile.feedbackReceptionScore > 0) parts.push(`- Feedback Reception Self-Rating: ${leaderProfile.feedbackReceptionScore}/10`);
      if (leaderProfile.feedbackGivingScore > 0) parts.push(`- Feedback Giving Self-Rating: ${leaderProfile.feedbackGivingScore}/10`);
    }
    
    // Development journey context
    if (weekNumber || currentDayData?.dayNumber) {
      parts.push(`\nDEVELOPMENT JOURNEY:`);
      if (weekNumber) parts.push(`- Currently in Week ${weekNumber} of their leadership program`);
      if (currentDayData?.dayNumber) parts.push(`- Day ${currentDayData.dayNumber} of training`);
      if (currentDayData?.theme) parts.push(`- Today's theme: ${currentDayData.theme}`);
    }
    
    // Rep history context
    if (repHistory.length > 0) {
      parts.push(`\nRECENT LEADERSHIP REPS (${firstName}'s practice history):`);
      repHistory.slice(0, 5).forEach((rep, i) => {
        const date = rep.completedAt?.toDate?.()?.toLocaleDateString() || 'recently';
        parts.push(`- ${date}: ${rep.repTitle || rep.title || 'Leadership rep'} (${rep.rating || 'completed'})`);
        if (rep.reflection) parts.push(`  Reflection: "${rep.reflection.substring(0, 100)}..."`);
      });
    }
    
    // Topic patterns - what they frequently ask about
    const topTopics = Object.entries(topicPatterns)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    
    if (topTopics.length > 0) {
      parts.push(`\nCOACHING PATTERNS (Topics ${firstName} frequently discusses):`);
      topTopics.forEach(([topic, count]) => {
        parts.push(`- ${topic}: ${count} conversation${count > 1 ? 's' : ''}`);
      });
    }
    
    // Past commitments made
    if (commitments.length > 0) {
      parts.push(`\nPAST COMMITMENTS (Follow up on these!):`);
      commitments.forEach(c => {
        const dateStr = c.date?.toLocaleDateString?.() || 'recently';
        parts.push(`- ${dateStr}: "${c.text}"`);
      });
    }
    
    // Conversation context
    if (conversationCount > 0) {
      const daysSinceFirst = firstChatDate 
        ? Math.floor((new Date() - firstChatDate) / (1000 * 60 * 60 * 24))
        : 0;
      parts.push(`\nRELATIONSHIP HISTORY: You've had ${conversationCount} conversation${conversationCount > 1 ? 's' : ''} with ${firstName} over ${daysSinceFirst} days. You KNOW this person. Reference past conversations when relevant.`);
    }
    
    return parts.join('\n');
  }, [leaderProfile, repHistory, firstName, conversationCount, firstChatDate, weekNumber, currentDayData, topicPatterns, commitments]);

  // Handle asking a question
  const handleAskQuestion = async () => {
    if (!userQuestion.trim()) return;
    
    const question = userQuestion.trim();
    setIsTyping(true);
    setUserQuestion('');
    
    // Add user message to chat history
    const newHistory = [...chatHistory, { role: 'user', content: question }];
    setChatHistory(newHistory);
    
    try {
      const functions = getFunctions();
      const reppyCoach = httpsCallable(functions, 'reppyCoach');
      
      // Build rich context with leader profile and rep history
      const richContext = buildRichContext();
      
      const coachingContext = `You are "RepUp" - ${firstName}'s PERSONAL AI leadership coach. You are NOT a generic chatbot.

CRITICAL DIFFERENTIATION - What makes you different from ChatGPT or generic AI:
1. You KNOW ${firstName} personally - their goals, challenges, leadership style, and history
2. You remember EVERY conversation you've had together
3. You track their leadership reps and growth over time
4. You follow up on commitments they've made
5. You notice patterns in what they struggle with
6. You celebrate their progress and hold them accountable

COACHING APPROACH:
- Reference their specific context (company, role, direct reports) when relevant
- Connect current questions to their stated goals and challenges  
- If they've discussed similar topics before, acknowledge it: "We've talked about this before..."
- If they made a commitment previously, ask about it: "Last time you mentioned you'd..."
- Notice patterns: "I've noticed you often ask about [topic]..."
- Be their PARTNER, not just an answerer of questions

PERSONALITY:
- Confident, direct, and genuinely caring
- Professional yet warm - you know them
- Practical and action-oriented
- Keep responses concise (2-4 paragraphs max)
- End with an actionable next step or thought-provoking question
- Can help with ANY leadership topic: delegation, motivation, strategy, conflict, decisions, influence, communication

TODAY'S CONTEXT:
- Day ${currentDayData?.dayNumber || 1} of their leadership program
${cohortData?.name ? `- Cohort: ${cohortData.name}` : ''}
${weekNumber ? `- Week ${weekNumber} of development journey` : ''}

${richContext}

Remember: You're their trusted coach who knows their story. Make them feel known.`;

      const result = await reppyCoach({
        messages: newHistory,
        context: {
          userName: firstName,
          userRole: 'leader',
          sessionType: 'repup-standalone',
          customContext: coachingContext,
        },
      });
      
      const aiResponse = result.data.message;
      
      // Save conversation to Firestore for persistent memory
      await saveConversation(question, aiResponse);
      
      setChatHistory(prev => [...prev, { role: 'assistant', content: aiResponse }]);
      setCoachResponse({ 
        question, 
        aiResponse,
        isAI: true 
      });
      
    } catch (error) {
      console.error('RepUp AI error:', error);
      // Fallback to CLEAR method response
      const fallback = generateCLEARResponse(question);
      setCoachResponse({ question, ...fallback, isFallback: true });
    } finally {
      setIsTyping(false);
    }
  };

  // Reset conversation
  const handleNewConversation = () => {
    setCoachResponse(null);
    setChatHistory([]);
    setUserQuestion('');
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-[calc(100vh-108px)] p-4 bg-slate-50 dark:bg-slate-800">
      <div className="max-w-2xl mx-auto space-y-4">
        
        {/* Memory indicator - shows when coach has persistent memory */}
        {memoryLoaded && (conversationCount > 0 || leaderProfile?.primaryGoal) && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-corporate-navy/5 to-corporate-teal/10 rounded-xl p-3 border border-corporate-teal/20"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-corporate-teal/20 rounded-full flex items-center justify-center">
                <Brain className="w-4 h-4 text-corporate-teal" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-corporate-teal flex-shrink-0" />
                  <span className="text-sm font-semibold text-corporate-navy">I Know You, {firstName}</span>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300 space-y-0.5">
                  {conversationCount > 0 && (
                    <div className="flex items-center gap-1">
                      <History className="w-3 h-3 flex-shrink-0" />
                      <span>{conversationCount} conversation{conversationCount !== 1 ? 's' : ''}{firstChatDate && ` since ${firstChatDate.toLocaleDateString()}`}</span>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    {leaderProfile?.primaryGoal && (
                      <span className="flex items-center gap-1">
                        <Target className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{leaderProfile.primaryGoal.substring(0, 40)}{leaderProfile.primaryGoal.length > 40 ? '...' : ''}</span>
                      </span>
                    )}
                    {repHistory.length > 0 && (
                      <span className="text-corporate-teal">{repHistory.length} reps</span>
                    )}
                    {Object.values(topicPatterns).some(v => v > 0) && (
                      <span className="text-slate-500 dark:text-slate-400">
                        • Top focus: {Object.entries(topicPatterns).sort((a,b) => b[1]-a[1])[0]?.[0] || 'leadership'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Welcome state - no conversation yet */}
        {!coachResponse && !isTyping && (
          <div className="text-center py-8">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-corporate-navy to-corporate-teal rounded-full flex items-center justify-center mb-4 shadow-lg">
              <MessageSquare className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-xl font-bold text-corporate-navy mb-2">Ask Me Anything</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6 max-w-md mx-auto">
              I'm your AI leadership coach. Ask me about motivation, delegation, 
              strategy, team dynamics, difficult conversations, or any leadership challenge.
            </p>
            
            {/* Quick prompts */}
            <div className="flex flex-wrap gap-2 justify-center max-w-lg mx-auto">
              {QUICK_PROMPTS.map((item, i) => (
                <button
                  key={i}
                  onClick={() => setUserQuestion(item.prompt)}
                  className="text-sm px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 
                             text-slate-700 dark:text-slate-200 rounded-full hover:bg-corporate-teal/10 
                             hover:border-corporate-teal hover:text-corporate-navy
                             transition-colors shadow-sm"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Typing indicator */}
        {isTyping && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-corporate-navy to-corporate-teal rounded-full flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              </div>
              <div>
                <p className="font-medium text-corporate-navy">RepUp is thinking...</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Preparing your coaching response</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Coach Response */}
        {coachResponse && !isTyping && (
          <div className="space-y-4">
            {/* User's question */}
            <div className="bg-slate-100 dark:bg-slate-700 rounded-2xl p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">You asked:</p>
              <p className="text-corporate-navy font-medium">{coachResponse.question}</p>
            </div>
            
            {/* AI Response */}
            {coachResponse.isAI && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-corporate-teal/30">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-corporate-navy to-corporate-teal rounded-full flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-corporate-navy">RepUp</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">AI Leadership Coach</p>
                  </div>
                </div>
                <div className="prose prose-slate max-w-none">
                  <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-200 leading-relaxed">
                    {coachResponse.aiResponse}
                  </p>
                </div>
              </div>
            )}
            
            {/* Fallback CLEAR response */}
            {!coachResponse.isAI && coachResponse.steps && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                {coachResponse.isFallback && (
                  <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg mb-4">
                    <AlertCircle className="w-4 h-4" />
                    <span>AI unavailable - showing framework response</span>
                  </div>
                )}
                
                <p className="font-semibold text-corporate-navy mb-4">{coachResponse.intro}</p>
                
                <div className="space-y-3">
                  {coachResponse.steps.map((step, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-corporate-navy to-corporate-teal text-white flex items-center justify-center flex-shrink-0 font-bold text-sm">
                        {step.letter}
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-200 pt-1">{step.text}</p>
                    </motion.div>
                  ))}
                </div>
                
                {coachResponse.guardrail && (
                  <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                    <p className="text-sm text-amber-700 font-medium flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      {coachResponse.guardrail}
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {/* Route to Action - Get them back to doing reps */}
            <div className="bg-gradient-to-r from-corporate-navy/5 to-corporate-teal/5 rounded-xl p-4 border border-corporate-teal/20">
              <p className="text-sm font-medium text-corporate-navy mb-3">Ready to take action?</p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => onSwitchToReps?.()}
                  className="flex items-center justify-center gap-2 py-3 px-4 bg-corporate-teal text-white rounded-lg font-medium hover:bg-corporate-teal/90 transition-colors"
                >
                  <Target className="w-4 h-4" />
                  Commit to a Real Rep
                </button>
                <button
                  onClick={() => onSwitchToReps?.()}
                  className="flex items-center justify-center gap-2 py-2 px-4 text-corporate-navy border border-corporate-navy/20 rounded-lg text-sm hover:bg-corporate-navy/5 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  Add Debrief to Completed Rep
                </button>
              </div>
            </div>
            
            {/* New conversation button */}
            <button
              onClick={handleNewConversation}
              className="w-full py-3 text-corporate-teal font-medium hover:bg-corporate-teal/10 rounded-xl transition-colors"
            >
              ← Ask another question
            </button>
          </div>
        )}
        
        {/* Input area - always visible */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-lg">
          <div className="max-w-2xl mx-auto flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={userQuestion}
              onChange={(e) => setUserQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAskQuestion()}
              placeholder="Ask me anything about leadership..."
              className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl
                         text-base focus:outline-none focus:ring-2 focus:ring-corporate-teal focus:border-transparent"
              disabled={isTyping}
            />
            <button
              onClick={handleAskQuestion}
              disabled={!userQuestion.trim() || isTyping}
              className="px-5 py-3 bg-gradient-to-r from-corporate-navy to-corporate-teal 
                         text-white rounded-xl hover:opacity-90 transition-opacity
                         disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isTyping ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span className="hidden sm:inline">Send</span>
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Spacer for fixed input */}
        <div className="h-20" />
      </div>
    </div>
  );
};

export default RepUpCoach;
