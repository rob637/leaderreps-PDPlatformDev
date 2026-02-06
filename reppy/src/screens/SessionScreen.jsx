import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useProgress, useTheme } from '../App';
import { getCurrentSession, SESSION_TYPES } from '../data/focuses';
import { getMorningSession, getEveningSession, getTodayKey } from '../data/dailyTouchpoints';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getThemeClasses } from '../theme';

// Haptic feedback utility (works on Android, no-op on iOS/desktop)
const triggerHaptic = (pattern = 'success') => {
  if ('vibrate' in navigator) {
    switch (pattern) {
      case 'success':
        navigator.vibrate([10, 50, 10]); // Double tap feel
        break;
      case 'light':
        navigator.vibrate(10); // Light tap
        break;
      default:
        navigator.vibrate(10);
    }
  }
};

export default function SessionScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionType = searchParams.get('type') || 'growth'; // morning, growth, evening
  
  const { progress, updateProgress } = useProgress();
  const { isDark } = useTheme();
  const theme = getThemeClasses(isDark);
  
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [sessionData, setSessionData] = useState({});
  const [startTime] = useState(Date.now());
  const [minSessionReached, setMinSessionReached] = useState(false);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  const completedSessions = progress?.completedSessions?.length || 0;
  const profile = progress?.profile || {};
  const name = profile.name || 'Leader';
  const coachingStyle = profile.coachingStyle || 'challenge'; // Default to challenge (original behavior)
  
  // Get coaching style instructions for AI
  const getCoachingStyleInstructions = () => {
    switch (coachingStyle) {
      case 'guide':
        return `=== COACHING STYLE: GUIDE ME ===
The user prefers a SUPPORTIVE approach. They want ideas and examples quickly.
- Lead with suggestions, frameworks, or examples
- Give them concrete options to choose from
- Ask questions AFTER providing guidance
- Be helpful and direct - they want to learn efficiently
- It's okay to give answers, then ask how they'd apply them`;
      
      case 'coach':
        return `=== COACHING STYLE: COACH ME ===
The user prefers a BALANCED approach. Questions first, then guidance.
- Start with 1-2 thoughtful questions
- If they seem stuck, offer a nudge or example
- Balance exploration with practical help
- Provide frameworks after they've shared their thinking
- Support AND stretch them`;
      
      case 'challenge':
      default:
        return `=== COACHING STYLE: CHALLENGE ME ===
The user wants to be PUSHED to think deeply. Maximum growth mode.
- Ask probing questions, rarely give direct answers
- When they answer, go deeper: "Why?" "What else?" "And if that doesn't work?"
- Don't rescue them too quickly when they struggle
- Only offer suggestions after they've really wrestled with the question
- Trust them to find their own insights`;
    }
  };
  
  // Get session content based on type
  const { focus, session: growthSession, sessionInFocus } = getCurrentSession(completedSessions);
  const morningSession = getMorningSession(progress);
  const eveningSession = getEveningSession(progress);
  
  // Determine which session we're running
  const isGrowth = sessionType === 'growth';
  const isMorning = sessionType === 'morning';
  const isEvening = sessionType === 'evening';
  
  const currentSession = isMorning ? morningSession : isEvening ? eveningSession : growthSession;
  const prompts = isMorning || isEvening ? currentSession?.prompts : null;
  
  // Min messages before can complete (ensures 5-10 min session)
  const MIN_EXCHANGES = isMorning ? 3 : isEvening ? 3 : 4; // Morning/Evening: 3 prompts, Growth: 4+ exchanges

  // Build personalized journey context for AI coach
  const buildJourneyContext = () => {
    const parts = [];
    
    // User profile info
    if (profile.name) parts.push(`Name: ${profile.name}`);
    if (profile.role) parts.push(`Role: ${profile.role}`);
    if (profile.challenge) parts.push(`Primary Challenge: "${profile.challenge}"`);
    if (profile.goal) parts.push(`Leadership Goal: "${profile.goal}"`);
    
    // Progress info
    parts.push(`Sessions Completed: ${completedSessions}`);
    parts.push(`Current Focus: "${focus.title}" (Session ${sessionInFocus} of ${focus.sessions.length})`);
    
    if (progress?.streakCount > 0) {
      parts.push(`Current Streak: ${progress.streakCount} days`);
    }
    
    // Recent session themes (last 3)
    const recentSessions = progress?.completedSessions?.slice(-3) || [];
    if (recentSessions.length > 0) {
      const themes = recentSessions
        .map(s => s.theme?.replace(/-/g, ' '))
        .filter(Boolean)
        .join(', ');
      if (themes) {
        parts.push(`Recently explored: ${themes}`);
      }
    }
    
    // Recent reflections (last 2)
    const recentReflections = progress?.completedSessions
      ?.slice(-2)
      ?.map(s => s.reflection)
      ?.filter(r => r && r.length > 20) || [];
    if (recentReflections.length > 0) {
      parts.push(`Recent insights: "${recentReflections[0]?.substring(0, 150)}..."`);
    }
    
    // Daily touchpoint context
    const today = progress?.dailyTouchpoints?.[new Date().toISOString().split('T')[0]];
    if (today?.morning?.responses?.intention) {
      parts.push(`Today's intention: "${today.morning.responses.intention}"`);
    }
    
    return parts.join('\n');
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cheat code for testing - "moose" or "Moose" instantly completes session
  const CHEAT_CODE = 'moose';
  
  // Check if minimum session time reached (or cheat code used)
  useEffect(() => {
    const userMessages = messages.filter(m => m.role === 'user');
    const usedCheatCode = userMessages.some(m => 
      m.content.toLowerCase().trim() === CHEAT_CODE
    );
    if (userMessages.length >= MIN_EXCHANGES || usedCheatCode) {
      setMinSessionReached(true);
      // Auto-show completion if cheat code was used
      if (usedCheatCode) {
        setTimeout(() => {
          triggerHaptic('success');
          setShowCompletion(true);
        }, 500);
      }
    }
  }, [messages, MIN_EXCHANGES]);

  // Start conversation
  useEffect(() => {
    const opening = buildOpeningMessage();
    setMessages([{ role: 'assistant', content: opening }]);
  }, [sessionType]);

  // Get today's morning data for evening callback
  const getTodayMorningData = () => {
    const todayKey = getTodayKey();
    const today = progress?.dailyTouchpoints?.[todayKey];
    return today?.morning?.responses || null;
  };

  // Build opening message based on session type
  const buildOpeningMessage = () => {
    if (isMorning) {
      return `Good morning, ${name}! ☀️\n\n` +
        `**${currentSession.title}**\n` +
        `*${currentSession.subtitle}*\n\n` +
        `Let's set you up for a great day. This should take about 5 minutes.\n\n` +
        `${prompts[0].question}`;
    }
    
    if (isEvening) {
      const morningData = getTodayMorningData();
      let eveningOpening = `Good evening, ${name}! 🌙\n\n` +
        `**${currentSession.title}**\n` +
        `*${currentSession.subtitle}*\n\n`;
      
      // Connect to morning intention if available
      if (morningData) {
        const intention = morningData['one-thing'] || morningData['priority'] || morningData['focus'];
        if (intention) {
          eveningOpening += `This morning you set out to focus on: *"${intention.substring(0, 150)}${intention.length > 150 ? '...' : ''}"*\n\n`;
          eveningOpening += `Let's see how it went.\n\n`;
        }
      }
      
      eveningOpening += `${prompts[0].question}`;
      return eveningOpening;
    }
    
    // Growth session - use the focus content
    return buildGrowthOpeningMessage();
  };

  const buildGrowthOpeningMessage = () => {
    const session = growthSession;
    const c = session.content || {};
    const type = session.type;
    
    let opening = `Hey ${name}! 📚\n\n`;
    
    // Milestone check-in: Every 10 sessions, reference their goal
    const isMilestone = completedSessions > 0 && completedSessions % 10 === 0;
    if (isMilestone && profile.goal) {
      opening += `🎯 **Milestone Check-in:** You've completed ${completedSessions} sessions!\n\n`;
      opening += `Remember, you're working toward becoming: *"${profile.goal.substring(0, 150)}${profile.goal.length > 150 ? '...' : ''}"*\n\n`;
      opening += `Let's keep building on that vision.\n\n---\n\n`;
    }
    
    opening += `*${focus.title}: Session ${sessionInFocus} of ${focus.sessions.length}*\n\n`;
    opening += `This should take about 5-10 minutes. Take your time—I'm here to coach you through it.\n\n`;
    
    switch (type) {
      case SESSION_TYPES.QUOTE:
        opening += `I have a powerful quote for you:\n\n`;
        opening += `**"${c.quote}"**\n— ${c.author}\n\n`;
        if (c.context) opening += `*${c.context}*\n\n`;
        if (c.reflection) opening += `${c.reflection}\n\n`;
        opening += `What comes up for you when you read this?`;
        break;
        
      case SESSION_TYPES.LESSON:
        opening += `**${session.title}**\n\n`;
        if (c.opening) opening += `${c.opening}\n\n`;
        if (c.lesson) opening += `${c.lesson}\n\n`;
        if (c.framework) {
          opening += `**${c.framework.name}:**\n`;
          if (c.framework.steps) {
            c.framework.steps.forEach((step, i) => {
              if (step.letter) {
                opening += `• **${step.letter} - ${step.name}:** ${step.description}\n`;
              } else {
                opening += `${i + 1}. ${step}\n`;
              }
            });
          }
          opening += `\n`;
        }
        if (c.insight) opening += `*${c.insight}*\n\n`;
        opening += `What resonates most with you here?`;
        break;
        
      case SESSION_TYPES.SCENARIO:
        opening += `**Scenario: ${session.title}**\n\n`;
        opening += `*${c.setup}*\n\n`;
        if (c.context) opening += `${c.context}\n\n`;
        opening += `Put yourself in this situation. What would you do, and why?`;
        break;
        
      case SESSION_TYPES.BOOK: {
        const book = c.book || c;
        opening += `**Book Bite: ${book.title}**\n`;
        opening += `*by ${book.author}*\n\n`;
        if (book.synopsis) opening += `${book.synopsis}\n\n`;
        if (book.keyInsight) opening += `**Key Insight:** ${book.keyInsight}\n\n`;
        if (book.leadershipConnection) opening += `*For Leaders:* ${book.leadershipConnection}\n\n`;
        opening += `How does this connect to your leadership experience?`;
        break;
      }
        
      case SESSION_TYPES.REFLECTION:
        opening += `**Reflection: ${session.title}**\n\n`;
        if (c.opening) opening += `${c.opening}\n\n`;
        if (c.prompt) opening += `*${c.prompt}*\n\n`;
        opening += `Take a moment to really sit with this. What emerges?`;
        break;
        
      case SESSION_TYPES.CHALLENGE:
        opening += `**Today's Challenge: ${session.title}**\n\n`;
        if (c.challenge) opening += `🎯 **${c.challenge}**\n\n`;
        if (c.rules) {
          opening += `Guidelines:\n`;
          c.rules.forEach(rule => opening += `• ${rule}\n`);
          opening += `\n`;
        }
        if (c.why) opening += `*Why this matters:* ${c.why}\n\n`;
        opening += `What's your first reaction? Does this feel doable?`;
        break;
      
      case SESSION_TYPES.VIDEO:
        opening += `**🎬 Watch: ${session.title}**\n\n`;
        if (c.description) opening += `${c.description}\n\n`;
        opening += `📺 **Video:** [${c.videoTitle || 'Watch Now'}](${c.videoUrl})\n`;
        if (c.duration) opening += `*${c.duration}*\n\n`;
        if (c.watchFor) opening += `**Watch for:** ${c.watchFor}\n\n`;
        opening += `Watch the video, then come back and share: ${c.discussionPrompt || 'What stood out to you?'}`;
        break;
      
      case SESSION_TYPES.MISSION:
        opening += `**🎯 Real-World Mission: ${session.title}**\n\n`;
        opening += `Today's not about reading—it's about *doing*.\n\n`;
        if (c.mission) opening += `**Your mission:** ${c.mission}\n\n`;
        if (c.context) opening += `*${c.context}*\n\n`;
        if (c.tips) {
          opening += `**Tips:**\n`;
          c.tips.forEach(tip => opening += `• ${tip}\n`);
          opening += `\n`;
        }
        if (c.timeframe) opening += `⏰ *${c.timeframe}*\n\n`;
        opening += `When you've completed your mission, come back and tell me how it went. For now—what's your plan? Who will you do this with?`;
        break;
      
      case SESSION_TYPES.ROLEPLAY:
        opening += `**🎭 Let's Practice: ${session.title}**\n\n`;
        if (c.setup) opening += `${c.setup}\n\n`;
        opening += `**The situation:** ${c.situation}\n\n`;
        if (c.yourRole) opening += `**You are:** ${c.yourRole}\n`;
        if (c.myRole) opening += `**I'll play:** ${c.myRole}\n\n`;
        if (c.goal) opening += `**Your goal:** ${c.goal}\n\n`;
        opening += `When you're ready, start the conversation as you would in real life. I'll respond as ${c.myRole || 'the other person'}.\n\n`;
        opening += `*Remember: There's no perfect script. Try something, and we'll work through it together.*`;
        break;
        
      default:
        opening += `**${session.title}**\n\n`;
        opening += `Let's explore ${session.theme?.replace(/-/g, ' ')}. What's on your mind about this?`;
    }
    
    return opening;
  };

  // Send message to AI
  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    const userMessage = inputValue.trim();
    const isMooseCheat = userMessage.toLowerCase() === CHEAT_CODE;
    
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    
    // If moose cheat code, give instant response and progress
    if (isMooseCheat) {
      const mooseResponses = [
        "🦌 Moose wisdom acknowledged! A majestic answer indeed.",
        "🦌 Ah yes, the moose path. Bold choice!",
        "🦌 The moose knows best. Moving forward!",
        "🦌 Moose mode: engaged. Onward!",
        "🦌 A moose of culture, I see. Excellent.",
      ];
      const randomResponse = mooseResponses[Math.floor(Math.random() * mooseResponses.length)];
      
      // Progress to next prompt for morning/evening
      if ((isMorning || isEvening) && currentPromptIndex < prompts.length - 1) {
        const nextPrompt = prompts[currentPromptIndex + 1];
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `${randomResponse}\n\n${nextPrompt.question}` 
        }]);
        setCurrentPromptIndex(prev => prev + 1);
      } else if ((isMorning || isEvening) && currentPromptIndex >= prompts.length - 1) {
        // Final prompt - show completion
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `${randomResponse}\n\n${currentSession.closing}` 
        }]);
        setTimeout(() => {
          triggerHaptic('success');
          setShowCompletion(true);
        }, 1000);
      } else {
        // Growth session - respond and show completion immediately
        setMessages(prev => [...prev, { role: 'assistant', content: randomResponse }]);
        setMinSessionReached(true);
        setTimeout(() => {
          triggerHaptic('success');
          setShowCompletion(true);
        }, 500);
      }
      return;
    }
    
    setIsLoading(true);
    
    // Store user response in session data
    if (isMorning || isEvening) {
      const promptType = prompts[currentPromptIndex]?.type;
      if (promptType) {
        setSessionData(prev => ({ ...prev, [promptType]: userMessage }));
      }
    }
    
    try {
      const functions = getFunctions();
      const reppyCoach = httpsCallable(functions, 'reppyCoach');
      
      // Build context based on session type
      let coachingContext = '';
      
      if (isMorning) {
        const prompt = prompts[currentPromptIndex];
        coachingContext = `This is a MORNING "Win the Day" session.
The user just answered: "${prompt.question}"
Their answer: "${userMessage}"
Coaching hint: ${prompt.coaching}

${currentPromptIndex < prompts.length - 1 
  ? `After acknowledging their response (1-2 sentences), ask this follow-up OR move to the next prompt:
Follow-up option: ${prompt.followUp}
Next prompt: ${prompts[currentPromptIndex + 1]?.question}

Keep momentum. Be encouraging but efficient. The session should be about 5 minutes total.`
  : `This is the FINAL prompt. Wrap up warmly and tell them: "${currentSession.closing}"`
}`;
      } else if (isEvening) {
        const prompt = prompts[currentPromptIndex];
        coachingContext = `This is an EVENING reflection session.
The user just answered: "${prompt.question}"
Their answer: "${userMessage}"
Coaching hint: ${prompt.coaching}

${currentPromptIndex < prompts.length - 1 
  ? `After acknowledging (be warm and validating, 1-2 sentences), move to the next reflection:
Next prompt: ${prompts[currentPromptIndex + 1]?.question}

Keep it reflective and calm. Evening energy.`
  : `This is the FINAL reflection. Close warmly: "${currentSession.closing}"`
}`;
      } else {
        // Growth session - Enhanced with journey context
        const userMsgCount = messages.filter(m => m.role === 'user').length + 1;
        
        // Build journey context for personalization
        const journeyContext = buildJourneyContext();
        
        // Get coaching style instructions
        const styleInstructions = getCoachingStyleInstructions();
        
        // Special handling for ROLEPLAY sessions
        if (growthSession.type === SESSION_TYPES.ROLEPLAY) {
          const c = growthSession.content || {};
          coachingContext = `This is a ROLEPLAY practice session. You are playing the role of: ${c.myRole || 'the other person in the scenario'}.

=== THE SCENARIO ===
${c.situation || 'A leadership conversation'}
${c.context || ''}

=== YOUR ROLE ===
${c.myRoleDescription || `Play ${c.myRole} realistically. Don't make it too easy. Be a real person with real reactions.`}

=== COACHING NOTES ===
${c.coachingNotes || 'After 3-4 exchanges in character, you can step out of the roleplay to offer coaching feedback on how they did. Use phrases like "Stepping out of the roleplay for a moment..." to signal the shift.'}

${userMsgCount < 3 
  ? `Stay in character. Respond as ${c.myRole || 'the other person'} would. Be realistic—don't make it too easy.`
  : userMsgCount < 5
    ? `Continue the roleplay. You can start to show some progress if they're doing well, or continue to push back realistically if they're struggling.`
    : `After this exchange, step out of the roleplay. Give them specific feedback: What worked? What could be stronger? Offer to practice again or wrap up with key takeaways.`
}`;
        } else {
          // Standard growth session
          coachingContext = `This is a GROWTH coaching session on "${focus.title}".
Session: "${growthSession.title}"
User has exchanged ${userMsgCount} messages.

${styleInstructions}

=== PERSONALIZED COACHING CONTEXT ===
${journeyContext}

=== SESSION PROGRESS ===
${userMsgCount < 3 
  ? coachingStyle === 'guide'
    ? `Share a key insight or framework, then ask how they might apply it. Reference their past experiences when relevant.`
    : coachingStyle === 'coach'
      ? `Ask 1-2 thoughtful questions. If they struggle, offer a nudge. Reference their past insights when relevant.`
      : `Ask follow-up questions to go deeper. Explore their thinking. Challenge gently. Reference their past insights when relevant.`
  : userMsgCount < 5
    ? `Good depth achieved. ${coachingStyle === 'guide' ? 'Offer a practical tip or framework to apply.' : coachingStyle === 'coach' ? 'You can offer guidance OR ask one more follow-up.' : 'Ask one more probing question OR'} Begin wrapping up with a key takeaway. Connect to their stated goals.`
    : `Wrap up the session. Summarize the key insight and give them something actionable to try today. Tie it back to their leadership development journey.`
}

IMPORTANT: You are their personal coach who KNOWS them. Reference their past progress, challenges, and goals naturally. Make this feel like a relationship, not a generic conversation.`;
        }
      }
      
      const context = {
        userName: name,
        userRole: profile.role || 'leader',
        userChallenge: profile.challenge || '',
        userGoal: profile.goal || '',
        sessionType: sessionType,
        customContext: coachingContext,
      };
      
      const conversationMessages = [...messages, { role: 'user', content: userMessage }];
      
      const result = await reppyCoach({
        messages: conversationMessages,
        context,
      });
      
      const aiResponse = result.data.message;
      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
      
      // Progress to next prompt for morning/evening sessions
      if ((isMorning || isEvening) && currentPromptIndex < prompts.length - 1) {
        setCurrentPromptIndex(prev => prev + 1);
      }
      
      // Check if session should auto-complete for morning/evening
      if ((isMorning || isEvening) && currentPromptIndex >= prompts.length - 1) {
        setTimeout(() => {
          triggerHaptic('success');
          setShowCompletion(true);
        }, 2000);
      }
      
    } catch (error) {
      console.error('Error calling reppyCoach:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm having trouble connecting. Let's keep going—what else is on your mind?" 
      }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  // Handle session completion
  const handleComplete = async () => {
    const duration = Math.round((Date.now() - startTime) / 60000);
    const todayKey = getTodayKey();
    const userMessages = messages.filter(m => m.role === 'user').map(m => m.content).join(' ');
    
    // Build touchpoint data
    const touchpointData = {
      completedAt: new Date().toISOString(),
      duration: Math.max(duration, 1),
      messageCount: messages.length,
      responses: sessionData,
    };
    
    // Update daily touchpoints
    const currentDailyTouchpoints = progress?.dailyTouchpoints || {};
    const todayTouchpoints = currentDailyTouchpoints[todayKey] || {};
    
    // For growth sessions, combine both updates into one call
    if (isGrowth) {
      const now = new Date();
      const lastDate = progress?.lastSessionDate ? new Date(progress.lastSessionDate) : null;
      const isConsecutiveDay = lastDate && 
        now.toDateString() !== lastDate.toDateString() &&
        (now - lastDate) < 48 * 60 * 60 * 1000;
      
      await updateProgress({
        dailyTouchpoints: {
          ...currentDailyTouchpoints,
          [todayKey]: {
            ...todayTouchpoints,
            [sessionType]: touchpointData,
          },
        },
        currentSession: completedSessions + 1,
        completedSessions: [...(progress?.completedSessions || []), {
          session: completedSessions,
          completedAt: now.toISOString(),
          sessionId: growthSession.id,
          focusId: focus.id,
          type: growthSession.type,
          theme: growthSession.theme,
          duration: Math.max(duration, 1),
          reflection: userMessages.substring(0, 500),
          conversationLength: messages.length,
        }],
        lastSessionDate: now.toISOString(),
        streakCount: isConsecutiveDay ? (progress?.streakCount || 0) + 1 : Math.max(progress?.streakCount || 0, 1),
        totalMinutes: (progress?.totalMinutes || 0) + Math.max(duration, 1),
      });
    } else {
      // Morning/Evening sessions
      await updateProgress({
        dailyTouchpoints: {
          ...currentDailyTouchpoints,
          [todayKey]: {
            ...todayTouchpoints,
            [sessionType]: touchpointData,
          },
        },
        ...(isMorning && { totalMorningSessions: (progress?.totalMorningSessions || 0) + 1 }),
        ...(isEvening && { totalEveningSessions: (progress?.totalEveningSessions || 0) + 1 }),
      });
    }
    
    // Small delay to ensure state propagates before navigation
    setTimeout(() => navigate('/'), 100);
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Format message content
  const formatMessage = (text) => {
    return text.split('\n').map((line, i) => {
      line = line.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>');
      line = line.replace(/\*(.+?)\*/g, '<em class="text-gray-300 italic">$1</em>');
      
      if (!line.trim()) return <div key={i} className="h-3" />;
      return <p key={i} className="mb-1" dangerouslySetInnerHTML={{ __html: line }} />;
    });
  };

  // Session gradient based on type
  const sessionGradient = isMorning 
    ? 'from-amber-500 to-orange-600'
    : isEvening 
      ? 'from-indigo-600 to-purple-700'
      : focus?.gradient || 'from-violet-600 to-indigo-600';

  const sessionIcon = isMorning ? '☀️' : isEvening ? '🌙' : focus?.icon || '📚';
  const sessionTitle = isMorning ? 'Win the Day' : isEvening ? 'Evening Reflection' : focus?.title;

  return (
    <div className={`h-full flex flex-col ${theme.bg} safe-area-top safe-area-bottom page-enter`}>
      {/* Ambient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-10 -right-10 w-40 h-40 rounded-full blur-3xl bg-gradient-to-br ${sessionGradient} ${isDark ? 'opacity-30' : 'opacity-20'}`} />
        <div className={`absolute bottom-20 -left-10 w-32 h-32 rounded-full blur-2xl bg-gradient-to-br ${sessionGradient} ${isDark ? 'opacity-20' : 'opacity-10'}`} />
      </div>
      
      {/* Header */}
      <div className={`relative z-10 px-5 py-4 flex items-center justify-between border-b ${theme.border}`}>
        <button
          type="button"
          onClick={() => navigate('/')}
          aria-label="Close session"
          className={`w-10 h-10 rounded-full ${theme.cardBg} flex items-center justify-center ${theme.cardHover} transition-colors`}
        >
          <svg className={`w-5 h-5 ${theme.textSecondary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="flex items-center gap-2">
          <span className="text-lg">{sessionIcon}</span>
          <span className={`${theme.textSecondary} text-sm font-medium`}>{sessionTitle}</span>
          {isGrowth && (
            <>
              <span className={`${theme.textMuted} text-sm`}>•</span>
              <span className={`${theme.textPrimary} text-sm font-medium`}>{sessionInFocus}/{focus.sessions.length}</span>
            </>
          )}
        </div>
        
        <button
          type="button"
          onClick={() => {
            if (minSessionReached) {
              triggerHaptic('success');
              setShowCompletion(true);
            }
          }}
          disabled={!minSessionReached}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            minSessionReached 
              ? `${theme.cardBg} ${theme.textPrimary} ${theme.cardHover}` 
              : `${isDark ? 'bg-gray-800 text-gray-500' : 'bg-gray-200 text-gray-400'} cursor-not-allowed`
          }`}
        >
          Done
        </button>
      </div>

      {/* Progress indicator for morning/evening */}
      {(isMorning || isEvening) && prompts && (
        <div className={`px-5 py-2 border-b ${theme.border}`}>
          <div className="flex gap-1">
            {prompts.map((_, i) => (
              <div 
                key={i}
                className={`h-1 flex-1 rounded-full transition-all ${
                  i < currentPromptIndex ? 'bg-emerald-500' :
                  i === currentPromptIndex ? `bg-gradient-to-r ${sessionGradient}` :
                  isDark ? 'bg-gray-700' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 relative z-10">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
            >
              <div
                className={`max-w-[88%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? `bg-gradient-to-r ${sessionGradient} text-white`
                    : `${theme.card} border ${theme.border} ${theme.textPrimary}`
                }`}
              >
                {message.role === 'assistant' && (
                  <div className={`flex items-center gap-2 mb-2 pb-2 border-b ${theme.border}`}>
                    <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${sessionGradient} flex items-center justify-center`}>
                      <span className="text-xs text-white font-bold">R</span>
                    </div>
                    <span className={`text-xs font-medium ${theme.textMuted}`}>Reppy</span>
                  </div>
                )}
                <div className="text-sm leading-relaxed">
                  {formatMessage(message.content)}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start animate-fade-in">
              <div className={`${theme.card} border ${theme.border} rounded-2xl px-4 py-3`}>
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${sessionGradient} flex items-center justify-center`}>
                    <span className="text-xs text-white font-bold">R</span>
                  </div>
                  <div className="flex gap-1.5">
                    <span className={`w-2 h-2 ${isDark ? 'bg-gray-400' : 'bg-gray-500'} rounded-full animate-bounce`} style={{ animationDelay: '0ms' }} />
                    <span className={`w-2 h-2 ${isDark ? 'bg-gray-400' : 'bg-gray-500'} rounded-full animate-bounce`} style={{ animationDelay: '150ms' }} />
                    <span className={`w-2 h-2 ${isDark ? 'bg-gray-400' : 'bg-gray-500'} rounded-full animate-bounce`} style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className={`relative z-10 px-4 py-4 border-t ${theme.border} ${isDark ? 'bg-gray-900/90' : 'bg-white/90'} backdrop-blur-lg safe-area-bottom`}>
        <div className="flex items-end gap-3">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Share your thoughts..."
            rows={1}
            className={`flex-1 ${theme.input} border-2 rounded-2xl resize-none text-sm px-4 py-4 focus:border-blue-500 focus:outline-none transition-colors`}
            style={{ maxHeight: '100px' }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
            }}
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={!inputValue.trim() || isLoading}
            aria-label="Send message"
            className={`w-12 h-12 rounded-2xl bg-gradient-to-r ${sessionGradient} text-white flex items-center justify-center disabled:opacity-40 transition-opacity`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        
        {!minSessionReached && (
          <p className={`text-center ${theme.textMuted} text-xs mt-2`}>
            {MIN_EXCHANGES - messages.filter(m => m.role === 'user').length} more exchanges to complete
          </p>
        )}
      </div>

      {/* Completion Modal */}
      {showCompletion && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6 animate-fade-in">
          {/* Confetti effect */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 0.5}s`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                }}
              >
                <span className="text-2xl">{['🎉', '✨', '💪', '🌟', '🔥'][Math.floor(Math.random() * 5)]}</span>
              </div>
            ))}
          </div>
          
          <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-3xl p-8 max-w-sm w-full animate-scale-in relative z-10`}>
            <div className="text-center mb-6">
              <div className={`w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br ${sessionGradient} flex items-center justify-center shadow-lg animate-pulse`}>
                <span className="text-4xl">
                  {isMorning ? '☀️' : isEvening ? '🌙' : '🎉'}
                </span>
              </div>
              <h2 className={`text-2xl font-bold ${theme.textPrimary} mb-2`}>
                {isMorning ? 'Ready to Win!' : isEvening ? 'Day Complete!' : 'Great Work!'}
              </h2>
              <p className={`${theme.textMuted} text-sm`}>
                {isMorning 
                  ? "You've set your intention. Now go make it happen!"
                  : isEvening
                    ? "Great reflection. Rest well!"
                    : `${focus.title} • Session ${sessionInFocus} of ${focus.sessions.length}`
                }
              </p>
            </div>
            
            {/* Key insight captured - show last user message excerpt */}
            {!isMorning && !isEvening && messages.filter(m => m.role === 'user').length > 0 && (
              <div className={`mb-6 p-4 rounded-xl ${theme.card} border ${theme.border}`}>
                <p className={`text-xs ${theme.textMuted} mb-1`}>💡 Your insight:</p>
                <p className={`text-sm ${theme.textSecondary} italic leading-relaxed`}>
                  "{messages.filter(m => m.role === 'user').slice(-1)[0]?.content.substring(0, 120)}
                  {messages.filter(m => m.role === 'user').slice(-1)[0]?.content.length > 120 ? '...' : ''}"
                </p>
              </div>
            )}
            
            {/* Streak badge */}
            {progress?.streakCount > 0 && (
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm font-medium shadow-lg">
                  <span>🔥</span>
                  <span>{progress.streakCount} Day Streak</span>
                </div>
              </div>
            )}
            
            {/* What's next preview for growth sessions */}
            {isGrowth && sessionInFocus < focus.sessions.length && (
              <div className="mb-6 text-center">
                <p className={`text-xs ${theme.textMuted} mb-1`}>Up next:</p>
                <p className={`text-sm ${theme.textSecondary}`}>{focus.sessions[sessionInFocus]?.title || 'Continue your journey'}</p>
              </div>
            )}
            
            {/* Focus complete celebration */}
            {isGrowth && sessionInFocus >= focus.sessions.length && (
              <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30">
                <p className="text-center text-emerald-600 dark:text-emerald-300 font-medium">
                  🏆 Focus Complete: {focus.title}
                </p>
              </div>
            )}
            
            <div className="space-y-3">
              <button
                onClick={handleComplete}
                className="w-full btn-primary"
              >
                {isMorning ? "Let's Go!" : isEvening ? 'Goodnight!' : 'Done'}
              </button>
              <button
                onClick={() => setShowCompletion(false)}
                className={`w-full py-3 px-4 rounded-xl font-medium ${theme.card} ${theme.border} border ${theme.textPrimary} ${theme.cardHover} transition-colors`}
              >
                Keep Chatting
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
