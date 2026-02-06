/**
 * REPPY DAILY TOUCHPOINTS SYSTEM
 * 
 * Goal: Get users to log in 3 times per day with meaningful micro-sessions
 * 
 * DAILY STRUCTURE:
 * ☀️ Morning (5-7am to 11am): Win the Day - Set intention, ONE Thing
 * 📚 Midday (11am to 6pm): Growth Session - Main coaching content  
 * 🌙 Evening (6pm to midnight): Reflection - Review, gratitude, learning
 * 
 * RULES:
 * - Can only do each touchpoint once per day
 * - Must complete in order (Morning → Midday → Evening)
 * - Each session is 5-10 minutes of back-and-forth coaching
 * - Streak counts if you complete at least 2 of 3 touchpoints
 */

// Touchpoint types
export const TOUCHPOINTS = {
  MORNING: 'morning',
  GROWTH: 'growth', 
  EVENING: 'evening',
};

// Time windows (hour in 24h format)
export const TIME_WINDOWS = {
  morning: { start: 5, end: 11, name: 'Morning', icon: '☀️' },
  growth: { start: 11, end: 18, name: 'Midday', icon: '📚' },
  evening: { start: 18, end: 24, name: 'Evening', icon: '🌙' },
};

// Morning Win the Day templates (10 variations for ~3 weeks before repeat)
export const MORNING_SESSIONS = [
  {
    id: 'morning-1',
    title: 'Win the Day',
    subtitle: 'Set Your Intention',
    prompts: [
      {
        type: 'one-thing',
        question: "What's your ONE Thing today? The single most important thing that would make today a success?",
        followUp: "Why is this the most important thing? What happens if you don't get it done?",
        coaching: "A great ONE Thing is specific, achievable today, and moves the needle on what matters most."
      },
      {
        type: 'leadership-intention',
        question: "How do you want to show up as a leader today? What's one leadership behavior you'll focus on?",
        followUp: "When specifically will you practice this? With whom?",
        coaching: "The best intentions are tied to a specific moment or interaction."
      },
      {
        type: 'obstacle',
        question: "What's the biggest obstacle that might get in your way today?",
        followUp: "What's your plan if that happens? How will you stay on track?",
        coaching: "Anticipating obstacles is half the battle. Now you're prepared."
      }
    ],
    closing: "You've set your intention. Now go make it happen. I'll check in with you tonight to see how it went. 💪"
  },
  {
    id: 'morning-2', 
    title: 'Morning Momentum',
    subtitle: 'Start Strong',
    prompts: [
      {
        type: 'energy',
        question: "On a scale of 1-10, how's your energy this morning? What's affecting it?",
        followUp: "What's one thing you could do in the next hour to boost that number?",
        coaching: "Great leaders manage their energy, not just their time."
      },
      {
        type: 'priority',
        question: "Looking at your day, what's the ONE meeting or interaction where you need to be at your best?",
        followUp: "What does 'at your best' look like in that moment? How will you prepare?",
        coaching: "Identify your 'main event' and give it your A-game."
      },
      {
        type: 'micro-win',
        question: "What's one small win you can achieve before lunch that would set a positive tone?",
        followUp: "How will you celebrate that win, even briefly?",
        coaching: "Momentum builds from small wins. Stack them up."
      }
    ],
    closing: "You're set up for a strong day. Remember: progress over perfection. Check back tonight! ☀️"
  },
  {
    id: 'morning-3',
    title: 'Lead with Purpose',
    subtitle: 'Connect to Your Why',
    prompts: [
      {
        type: 'purpose',
        question: "Why does your work matter today? Who are you serving?",
        followUp: "How does today's work connect to your bigger leadership vision?",
        coaching: "Purpose turns tasks into meaningful work."
      },
      {
        type: 'impact',
        question: "What impact do you want to have on your team or colleagues today?",
        followUp: "What's one specific thing you'll do to create that impact?",
        coaching: "Leadership is about the ripples you create in others."
      },
      {
        type: 'gratitude',
        question: "What's one thing you're grateful for about your role or team right now?",
        followUp: "Have you told them? What would happen if you did?",
        coaching: "Gratitude is a leadership superpower. Use it."
      }
    ],
    closing: "You're leading with intention today. That's what separates good from great. See you tonight! 🎯"
  },
  {
    id: 'morning-4',
    title: 'Focus Forward',
    subtitle: 'Cut Through the Noise',
    prompts: [
      {
        type: 'focus',
        question: "What's competing for your attention today? List the top 3 things pulling at you.",
        followUp: "Of those 3, which ONE actually deserves your best thinking? The others can wait.",
        coaching: "Focus isn't saying yes to one thing—it's saying no to everything else."
      },
      {
        type: 'distraction',
        question: "What distraction will you intentionally avoid today?",
        followUp: "What's your plan when it tempts you? What will you do instead?",
        coaching: "Name the distraction, and it loses power over you."
      },
      {
        type: 'deep-work',
        question: "When is your deep work window today? The time for your most important thinking?",
        followUp: "How will you protect that time? What boundaries do you need?",
        coaching: "Schedule your priorities or someone else will schedule them for you."
      }
    ],
    closing: "You've chosen your focus. Protect it fiercely. Everything else can wait. 🎯"
  },
  {
    id: 'morning-5',
    title: 'People First',
    subtitle: 'Lead Through Relationships',
    prompts: [
      {
        type: 'connection',
        question: "Who on your team needs your attention today? Who might be struggling or overlooked?",
        followUp: "What will you do to connect with them? Even 5 minutes counts.",
        coaching: "The best leaders notice what others miss—especially people."
      },
      {
        type: 'recognition',
        question: "Who deserves recognition today? Who's been doing good work quietly?",
        followUp: "How will you recognize them? Be specific about what they did.",
        coaching: "Recognition costs nothing and means everything."
      },
      {
        type: 'listening',
        question: "In today's meetings, what will you listen for that you usually miss?",
        followUp: "How will you show people you're really hearing them?",
        coaching: "Leaders who listen learn. Leaders who don't lose trust."
      }
    ],
    closing: "Leadership is relationships. Today you're investing in yours. See you tonight! 🤝"
  },
  {
    id: 'morning-6',
    title: 'Difficult Day Ahead?',
    subtitle: 'Prepare for the Hard Stuff',
    prompts: [
      {
        type: 'hard-thing',
        question: "What's the hardest thing on your plate today? The thing you might be avoiding?",
        followUp: "What would happen if you tackled it first, before it looms all day?",
        coaching: "Eat the frog. The hard thing rarely gets easier by waiting."
      },
      {
        type: 'conversation',
        question: "Is there a difficult conversation you need to have today? With whom?",
        followUp: "What outcome do you want? What's the ONE thing you need to communicate?",
        coaching: "Difficult conversations avoided become impossible conversations later."
      },
      {
        type: 'courage',
        question: "Where will you need courage today? What brave thing might you need to do?",
        followUp: "What's the worst that could happen? What's the best?",
        coaching: "Courage isn't absence of fear—it's action despite it."
      }
    ],
    closing: "You're ready for the hard stuff. That's what leaders do. I'm proud of you. 💪"
  },
  {
    id: 'morning-7',
    title: 'Creative Day',
    subtitle: 'Think Different',
    prompts: [
      {
        type: 'fresh-eyes',
        question: "What problem have you been stuck on? What would a fresh perspective see?",
        followUp: "If you had unlimited resources, what would you try? What's stopping you?",
        coaching: "Sometimes the constraint is in our thinking, not our circumstances."
      },
      {
        type: 'question',
        question: "What question should you be asking that you haven't asked yet?",
        followUp: "Who could you ask today? What might they see that you don't?",
        coaching: "The quality of your questions determines the quality of your leadership."
      },
      {
        type: 'experiment',
        question: "What's one small experiment you could run today? Something you've never tried?",
        followUp: "What would you learn from it, regardless of outcome?",
        coaching: "Innovation happens through small experiments, not big leaps."
      }
    ],
    closing: "Think different today. The best ideas come from curiosity. See you tonight! 💡"
  },
  {
    id: 'morning-8',
    title: 'High Stakes Day',
    subtitle: 'When Performance Matters',
    prompts: [
      {
        type: 'stakes',
        question: "What's at stake today? What makes today higher-pressure than usual?",
        followUp: "What does success look like? Be specific.",
        coaching: "Naming the stakes focuses the mind. Now you know what you're playing for."
      },
      {
        type: 'preparation',
        question: "What's one thing you can do in the next 30 minutes to be better prepared?",
        followUp: "Is there anything you're under-prepared for that you should address now?",
        coaching: "Preparation is the antidote to anxiety."
      },
      {
        type: 'presence',
        question: "How do you want to be perceived today? What energy do you want to project?",
        followUp: "What physical or mental cue will remind you to show up that way?",
        coaching: "Executive presence is a choice you make, moment by moment."
      }
    ],
    closing: "You're ready. Trust your preparation. Trust yourself. Go win. 🏆"
  },
  {
    id: 'morning-9',
    title: 'Recovery Day',
    subtitle: 'Sustainable Leadership',
    prompts: [
      {
        type: 'check-in',
        question: "Honestly, how are you doing? Not the automatic 'fine'—really?",
        followUp: "What's one thing you need today that you haven't been getting?",
        coaching: "You can't pour from an empty cup. Self-awareness is step one."
      },
      {
        type: 'boundaries',
        question: "What boundary do you need to set or protect today?",
        followUp: "What will you say if someone pushes against it?",
        coaching: "Boundaries aren't selfish—they're how sustainable leaders lead."
      },
      {
        type: 'recharge',
        question: "What's one small thing you'll do today just for yourself? Even 10 minutes counts.",
        followUp: "When will you do it? Put it on the calendar.",
        coaching: "Recovery is part of performance, not separate from it."
      }
    ],
    closing: "Taking care of yourself IS leadership. You've got permission. See you tonight. 🌿"
  },
  {
    id: 'morning-10',
    title: 'Team Day',
    subtitle: 'Elevate Others',
    prompts: [
      {
        type: 'develop',
        question: "Who on your team is ready to grow? What stretch opportunity could you give them?",
        followUp: "What's holding you back from giving them that opportunity?",
        coaching: "Developing others is your highest-leverage activity as a leader."
      },
      {
        type: 'unblock',
        question: "What's blocking your team right now? What obstacle could you remove for them?",
        followUp: "Is this something only you can do, or can you empower someone else?",
        coaching: "Great leaders clear the path so their people can run."
      },
      {
        type: 'culture',
        question: "What behavior will you model today that you want to see more of on your team?",
        followUp: "How will you make it visible? Culture is caught, not taught.",
        coaching: "Your team is watching. What will they learn from you today?"
      }
    ],
    closing: "When your team wins, you win. Go make them better today. 🚀"
  }
];

// Evening Reflection templates (10 variations for ~3 weeks before repeat)
export const EVENING_SESSIONS = [
  {
    id: 'evening-1',
    title: 'Day in Review',
    subtitle: 'Celebrate & Learn',
    prompts: [
      {
        type: 'wins',
        question: "What went well today? What are you proud of?",
        followUp: "What made that possible? What can you repeat tomorrow?",
        coaching: "Celebrating wins rewires your brain for success."
      },
      {
        type: 'one-thing-review',
        question: "Did you complete your ONE Thing from this morning? What happened?",
        followUp: "If yes: How did it feel? If not: What got in the way?",
        coaching: "No judgment—just learning. Every day is data."
      },
      {
        type: 'learning',
        question: "What's one thing you learned today—about yourself, your team, or leadership?",
        followUp: "How will you apply this tomorrow?",
        coaching: "Growth happens in reflection. You just grew."
      }
    ],
    closing: "Great reflection! Rest well tonight. Tomorrow is a fresh start. See you in the morning! 🌙"
  },
  {
    id: 'evening-2',
    title: 'Leadership Check-In',
    subtitle: 'How Did You Show Up?',
    prompts: [
      {
        type: 'intention-review',
        question: "This morning you set a leadership intention. How did it go?",
        followUp: "What would you do differently? What would you keep?",
        coaching: "Intention + reflection = growth. You're doing both."
      },
      {
        type: 'impact-check',
        question: "Did you have the impact you wanted on others today?",
        followUp: "What feedback—verbal or non-verbal—did you notice?",
        coaching: "Leadership is measured in the eyes of those you lead."
      },
      {
        type: 'energy-close',
        question: "How's your energy now? What drained you? What energized you?",
        followUp: "How can you get more of the energizing stuff tomorrow?",
        coaching: "Protect your energy sources. Minimize your drains."
      }
    ],
    closing: "You showed up today. That's what matters. Sleep well, leader. 💤"
  },
  {
    id: 'evening-3',
    title: 'Gratitude & Growth',
    subtitle: 'End with Intention',
    prompts: [
      {
        type: 'gratitude-3',
        question: "Name 3 things you're grateful for from today. They can be small.",
        followUp: "Which one surprised you? Why does it matter?",
        coaching: "Gratitude at night leads to better sleep and better mornings."
      },
      {
        type: 'relationship',
        question: "Who positively impacted your day? A colleague, friend, or even a stranger?",
        followUp: "Did you thank them? If not, could you tomorrow?",
        coaching: "Acknowledging others strengthens bonds."
      },
      {
        type: 'tomorrow-seed',
        question: "What's one thing you're looking forward to tomorrow?",
        followUp: "What would make it even better?",
        coaching: "Positive anticipation creates positive reality."
      }
    ],
    closing: "Beautiful reflection. You're building the habit of intentional leadership. Goodnight! ✨"
  },
  {
    id: 'evening-4',
    title: 'Courage & Growth',
    subtitle: 'The Hard Stuff',
    prompts: [
      {
        type: 'brave',
        question: "When were you brave today? Even a small moment counts.",
        followUp: "How did it feel? What did you learn about yourself?",
        coaching: "Courage is a muscle. You just exercised it."
      },
      {
        type: 'avoided',
        question: "Be honest: What did you avoid today that you probably shouldn't have?",
        followUp: "What made it feel hard? What's the first step you could take tomorrow?",
        coaching: "Awareness without judgment. Now you can act."
      },
      {
        type: 'feedback',
        question: "Did you give or receive any feedback today? How did it go?",
        followUp: "What made it effective? What would make it better next time?",
        coaching: "Feedback is a gift—in both directions."
      }
    ],
    closing: "Growth requires honesty with yourself. You did that today. Goodnight, leader. 🌟"
  },
  {
    id: 'evening-5',
    title: 'People Reflection',
    subtitle: 'Relationships Matter',
    prompts: [
      {
        type: 'helped',
        question: "Who did you help today? How did it impact them?",
        followUp: "How did helping them make you feel?",
        coaching: "Serving others is the heart of leadership."
      },
      {
        type: 'heard',
        question: "Did you really listen to someone today? Who? What did you learn?",
        followUp: "What would they say about how well you listened?",
        coaching: "Listening is the most underrated leadership skill."
      },
      {
        type: 'repair',
        question: "Is there any relationship that needs repair or attention?",
        followUp: "What's one small thing you could do tomorrow to address it?",
        coaching: "Small repairs prevent big ruptures."
      }
    ],
    closing: "Leadership is relationships. You invested in yours today. Sleep well. 🤝"
  },
  {
    id: 'evening-6',
    title: 'Decision Review',
    subtitle: 'Sharpen Your Judgment',
    prompts: [
      {
        type: 'decision',
        question: "What's the most important decision you made today?",
        followUp: "What factors did you consider? What did you prioritize?",
        coaching: "Decisions reveal values. What did yours reveal?"
      },
      {
        type: 'uncertainty',
        question: "Where did you act despite uncertainty? How did you navigate it?",
        followUp: "What would you tell another leader facing the same uncertainty?",
        coaching: "Leadership is action under uncertainty. You did it today."
      },
      {
        type: 'delegate',
        question: "What did you delegate today? What did you hold onto that you shouldn't have?",
        followUp: "What's one thing you could delegate tomorrow?",
        coaching: "Delegation is multiplying yourself through others."
      }
    ],
    closing: "Your judgment sharpens through reflection. See you tomorrow! 🎯"
  },
  {
    id: 'evening-7',
    title: 'Mindset Review',
    subtitle: 'How You Thought Today',
    prompts: [
      {
        type: 'mindset',
        question: "What story did you tell yourself today that helped you? What story hurt you?",
        followUp: "If you could rewrite the limiting story, what would it say?",
        coaching: "We choose our stories. Choose ones that serve you."
      },
      {
        type: 'assumption',
        question: "What assumption did you make today that might be worth questioning?",
        followUp: "What if the opposite were true? What would change?",
        coaching: "Great leaders question their own assumptions first."
      },
      {
        type: 'self-talk',
        question: "How did you talk to yourself today? Were you a good coach to yourself?",
        followUp: "What would you say to a friend who spoke to themselves that way?",
        coaching: "Self-compassion isn't weakness—it's sustainability."
      }
    ],
    closing: "Mindset is the foundation. You're building a strong one. Goodnight! 🧠"
  },
  {
    id: 'evening-8',
    title: 'Impact Check',
    subtitle: 'Did It Matter?',
    prompts: [
      {
        type: 'mattered',
        question: "What did you do today that actually mattered? That moved something forward?",
        followUp: "How do you know it mattered? What's the evidence?",
        coaching: "Busy isn't the same as impactful. You know the difference."
      },
      {
        type: 'wasted',
        question: "What time or energy was wasted today? What would you cut next time?",
        followUp: "What would you do with that time if you got it back?",
        coaching: "Time is your most valuable resource. Protect it ruthlessly."
      },
      {
        type: 'multiplied',
        question: "Where did you multiply your impact through others today?",
        followUp: "How could you do more of that tomorrow?",
        coaching: "Leaders who multiply outperform leaders who do."
      }
    ],
    closing: "You're building impact awareness. That's how great leaders operate. Sleep well! 📈"
  },
  {
    id: 'evening-9',
    title: 'Stress & Recovery',
    subtitle: 'Sustainable Performance',
    prompts: [
      {
        type: 'stress',
        question: "What stressed you most today? How did you handle it?",
        followUp: "What helped? What made it worse?",
        coaching: "Stress is information. It's telling you something. What is it?"
      },
      {
        type: 'recovered',
        question: "Did you take any recovery moments today? Even 5 minutes?",
        followUp: "If not, what got in the way? If yes, how did it help?",
        coaching: "Recovery is part of performance, not separate from it."
      },
      {
        type: 'sleep',
        question: "What do you need to let go of before you sleep tonight?",
        followUp: "Imagine putting it in a box until tomorrow. It'll be there. You can rest now.",
        coaching: "Tomorrow's problems need a well-rested leader. That's you."
      }
    ],
    closing: "You processed today. Now release it. Sleep is part of leadership. Goodnight. 🌙"
  },
  {
    id: 'evening-10',
    title: 'Week Builder',
    subtitle: 'Connect the Dots',
    prompts: [
      {
        type: 'pattern',
        question: "Looking at your recent days, what patterns do you notice? What keeps repeating?",
        followUp: "Is that pattern serving you? What would you change?",
        coaching: "Patterns reveal habits. Habits determine outcomes."
      },
      {
        type: 'progress',
        question: "Step back: How have you grown as a leader in the past week?",
        followUp: "What evidence do you see? What would your team say?",
        coaching: "Progress is often invisible day-to-day. Zoom out to see it."
      },
      {
        type: 'next-week',
        question: "What do you want next week to be about? What's your theme or intention?",
        followUp: "What's one thing you'll do Monday to set that direction?",
        coaching: "Leaders who set intention, lead. Those who don't, react."
      }
    ],
    closing: "You're building momentum, day by day. That's how transformation happens. See you tomorrow! 🚀"
  }
];

/**
 * Get today's date as a string key
 */
export function getTodayKey() {
  return new Date().toISOString().split('T')[0]; // "2026-01-23"
}

/**
 * Get current time window
 */
export function getCurrentTimeWindow() {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 18) return 'growth';
  if (hour >= 18 || hour < 5) return 'evening';
  
  return 'growth'; // Default fallback
}

/**
 * Check what touchpoints are available/completed today
 */
export function getDailyStatus(progress) {
  const todayKey = getTodayKey();
  const todayProgress = progress?.dailyTouchpoints?.[todayKey] || {};
  const currentWindow = getCurrentTimeWindow();
  // Check both testMode and noTimeLimit setting for admin testing
  const isTestMode = progress?.testMode === true || progress?.settings?.noTimeLimit === true;
  
  const morning = todayProgress.morning || null;
  const growth = todayProgress.growth || null;
  const evening = todayProgress.evening || null;
  
  // Determine what's available
  // In test mode: all sessions available if not done (no time restrictions)
  const morningAvailable = !morning && (isTestMode || ['morning', 'growth'].includes(currentWindow));
  const growthAvailable = !growth; // Always available if not done (main content)
  const eveningAvailable = !evening && (isTestMode || ['evening'].includes(currentWindow));
  
  // Can only do growth after morning (if in morning window) - unless test mode
  // Can only do evening after growth
  const morningRequired = !isTestMode && currentWindow === 'morning' && !morning;
  const growthBlocked = morningRequired;
  // In test/no-time mode, remove the growth requirement for evening too
  const eveningBlocked = !isTestMode && !growth; // Must do growth first (unless test mode)
  
  return {
    todayKey,
    currentWindow,
    windowInfo: TIME_WINDOWS[currentWindow],
    isTestMode,
    completed: {
      morning: !!morning,
      growth: !!growth,
      evening: !!evening,
    },
    available: {
      morning: morningAvailable,
      growth: growthAvailable && !growthBlocked,
      evening: eveningAvailable && !eveningBlocked,
    },
    data: {
      morning,
      growth,
      evening,
    },
    completedCount: [morning, growth, evening].filter(Boolean).length,
    allDone: !!(morning && growth && evening),
  };
}

/**
 * Get the appropriate morning session (rotates based on day)
 */
export function getMorningSession(progress) {
  const totalMorningSessions = progress?.totalMorningSessions || 0;
  const index = totalMorningSessions % MORNING_SESSIONS.length;
  return MORNING_SESSIONS[index];
}

/**
 * Get the appropriate evening session (rotates based on day)
 */
export function getEveningSession(progress) {
  const totalEveningSessions = progress?.totalEveningSessions || 0;
  const index = totalEveningSessions % EVENING_SESSIONS.length;
  return EVENING_SESSIONS[index];
}

/**
 * Check if user has done too much today (rate limiting)
 */
export function canDoMoreToday(progress) {
  const status = getDailyStatus(progress);
  return !status.allDone;
}

/**
 * Get next recommended action for user
 */
export function getNextAction(progress) {
  const status = getDailyStatus(progress);
  
  if (status.available.morning && status.currentWindow === 'morning') {
    return { type: 'morning', message: "Start your day with intention" };
  }
  
  if (status.available.growth) {
    if (status.completed.morning) {
      return { type: 'growth', message: "Time for your growth session" };
    } else if (status.currentWindow !== 'morning') {
      return { type: 'growth', message: "Let's do your main session" };
    }
  }
  
  if (status.available.evening) {
    return { type: 'evening', message: "Reflect on your day" };
  }
  
  if (status.allDone) {
    return { type: 'done', message: "You've completed today! See you tomorrow." };
  }
  
  // Waiting for time window
  if (!status.completed.evening && status.currentWindow !== 'evening') {
    return { type: 'wait', message: "Evening reflection unlocks at 6pm" };
  }
  
  return { type: 'growth', message: "Continue your journey" };
}
