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

// Morning Win the Day templates
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
  }
];

// Evening Reflection templates  
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
  const isTestMode = progress?.testMode === true;
  
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
  const eveningBlocked = !growth; // Must do growth first (even in test mode)
  
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
