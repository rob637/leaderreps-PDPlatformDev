/**
 * Community Content for Reppy
 * Leader Circles, Discussion Guides, and Coaching Resources
 */

// ============================================================================
// LEADER CIRCLE DISCUSSION GUIDES
// Weekly themed discussions for peer learning groups
// ============================================================================

export const CIRCLE_DISCUSSION_GUIDES = [
  {
    id: 'circle-1',
    week: 1,
    title: 'Defining Your Leadership Identity',
    theme: 'self-awareness',
    icon: '🪞',
    duration: '45-60 min',
    objectives: [
      'Articulate your personal leadership philosophy',
      'Identify your core values as a leader',
      'Discover blind spots through peer feedback',
    ],
    icebreaker: {
      question: "What's one moment this past week where you felt most 'yourself' as a leader?",
      duration: '5 min',
    },
    mainDiscussion: {
      prompt: "Think about the leader you most admire. What qualities do they have that you want to embody? What's stopping you from fully showing up that way?",
      followUps: [
        "How do others perceive your leadership style vs. how you see yourself?",
        "What would change if you led with 10% more of your authentic self?",
        "Where do you hold back, and why?",
      ],
      duration: '25 min',
    },
    peerExercise: {
      title: 'Hot Seat Feedback',
      instructions: "Each person gets 3 minutes in the 'hot seat.' Other members share: (1) One strength they see in your leadership, (2) One area they'd love to see you lean into more.",
      duration: '15 min',
    },
    closing: {
      commitment: "Name ONE thing you'll do differently this week to show up more authentically as a leader.",
      duration: '5 min',
    },
  },
  {
    id: 'circle-2',
    week: 2,
    title: 'The Art of Difficult Conversations',
    theme: 'communication',
    icon: '💬',
    duration: '45-60 min',
    objectives: [
      'Practice frameworks for tough conversations',
      'Learn from peers\' experiences',
      'Build confidence in addressing conflict',
    ],
    icebreaker: {
      question: "On a scale of 1-10, how comfortable are you with difficult conversations? What makes them hard for you?",
      duration: '5 min',
    },
    mainDiscussion: {
      prompt: "Share a difficult conversation you've been avoiding. What's the real reason you haven't had it yet?",
      followUps: [
        "What's the cost of NOT having this conversation?",
        "What story are you telling yourself about how it will go?",
        "What would a successful outcome look like?",
      ],
      duration: '25 min',
    },
    peerExercise: {
      title: 'Role Play Lab',
      instructions: "Pick one conversation from the group. Two volunteers role-play it while others observe. Then swap—let someone else try a different approach. Debrief: What worked? What felt authentic?",
      duration: '15 min',
    },
    closing: {
      commitment: "Commit to having ONE difficult conversation this week. Share who/what with the group.",
      duration: '5 min',
    },
  },
  {
    id: 'circle-3',
    week: 3,
    title: 'Building a Culture of Feedback',
    theme: 'feedback',
    icon: '🔄',
    duration: '45-60 min',
    objectives: [
      'Understand feedback as a gift, not a threat',
      'Practice giving radically candid feedback',
      'Create systems for continuous feedback',
    ],
    icebreaker: {
      question: "What's the most valuable piece of feedback you've ever received? How did it change you?",
      duration: '5 min',
    },
    mainDiscussion: {
      prompt: "Why is it so hard to give honest feedback? What fears come up for you?",
      followUps: [
        "How do you typically respond when someone gives YOU tough feedback?",
        "What's the difference between feedback that lands well vs. feedback that hurts?",
        "How can you make it safer for others to give you feedback?",
      ],
      duration: '25 min',
    },
    peerExercise: {
      title: 'SBI Practice',
      instructions: "Using Situation-Behavior-Impact format, each person gives feedback to another group member about something observed in THIS session. Keep it small and real. Notice how it feels.",
      duration: '15 min',
    },
    closing: {
      commitment: "Ask someone on your team for feedback this week. Come back and share what you learned.",
      duration: '5 min',
    },
  },
  {
    id: 'circle-4',
    week: 4,
    title: 'Leading Through Uncertainty',
    theme: 'resilience',
    icon: '🌊',
    duration: '45-60 min',
    objectives: [
      'Build comfort with ambiguity',
      'Learn to lead when you don\'t have answers',
      'Develop adaptive leadership skills',
    ],
    icebreaker: {
      question: "What's the most uncertain situation you're navigating right now?",
      duration: '5 min',
    },
    mainDiscussion: {
      prompt: "When you don't have the answers, how do you show up for your team? What's your instinct—hide it, fake it, or admit it?",
      followUps: [
        "How has uncertainty shaped you as a leader?",
        "What do your team members need from you when things are unclear?",
        "How do you balance confidence with honesty about what you don't know?",
      ],
      duration: '25 min',
    },
    peerExercise: {
      title: 'Scenario Swap',
      instructions: "Each person briefly describes an uncertain situation they're facing. Others offer: (1) What they'd do, (2) What question they'd ask to get clarity, (3) How they'd communicate to their team.",
      duration: '15 min',
    },
    closing: {
      commitment: "Identify one area where you've been avoiding uncertainty. Lean into it this week.",
      duration: '5 min',
    },
  },
  {
    id: 'circle-5',
    week: 5,
    title: 'Delegation & Empowerment',
    theme: 'delegation',
    icon: '🎯',
    duration: '45-60 min',
    objectives: [
      'Identify what\'s holding you back from delegating',
      'Learn the spectrum of delegation',
      'Practice letting go with intention',
    ],
    icebreaker: {
      question: "What task do you hold onto that you KNOW you should delegate? Why haven't you?",
      duration: '5 min',
    },
    mainDiscussion: {
      prompt: "What's the real cost of doing it all yourself? To you? To your team?",
      followUps: [
        "What would your team be capable of if you trusted them more?",
        "What are you afraid will happen if you let go?",
        "How do you balance control with empowerment?",
      ],
      duration: '25 min',
    },
    peerExercise: {
      title: 'Delegation Audit',
      instructions: "List 3 things on your plate this week. For each: (1) Could someone else do this? (2) Why haven't you delegated it? (3) What would you need to feel comfortable letting go? Share with a partner.",
      duration: '15 min',
    },
    closing: {
      commitment: "Delegate ONE thing this week that you normally do yourself. Report back on what happened.",
      duration: '5 min',
    },
  },
  {
    id: 'circle-6',
    week: 6,
    title: 'Coaching vs. Directing',
    theme: 'coaching',
    icon: '🧭',
    duration: '45-60 min',
    objectives: [
      'Understand when to coach vs. when to direct',
      'Practice asking powerful questions',
      'Build coaching into your daily leadership',
    ],
    icebreaker: {
      question: "Think of someone who coached you well. What did they do that made a difference?",
      duration: '5 min',
    },
    mainDiscussion: {
      prompt: "What's your default mode—telling people what to do, or helping them figure it out? Why?",
      followUps: [
        "When is directing appropriate? When does coaching serve better?",
        "What gets in the way of taking a coaching approach?",
        "How do you help someone arrive at an answer without giving it to them?",
      ],
      duration: '25 min',
    },
    peerExercise: {
      title: 'Coaching Triads',
      instructions: "Groups of 3: One person shares a real challenge (2 min). Coach asks only questions—no advice—for 5 minutes. Observer notes what questions were most powerful. Rotate.",
      duration: '18 min',
    },
    closing: {
      commitment: "This week, when someone brings you a problem, ask 3 questions before offering any solution.",
      duration: '5 min',
    },
  },
  {
    id: 'circle-7',
    week: 7,
    title: 'Managing Energy, Not Just Time',
    theme: 'energy',
    icon: '⚡',
    duration: '45-60 min',
    objectives: [
      'Identify what drains vs. fuels your energy',
      'Design your days around energy, not just tasks',
      'Protect your capacity to lead',
    ],
    icebreaker: {
      question: "On a scale of 1-10, what's your energy level right now? What's contributing to that?",
      duration: '5 min',
    },
    mainDiscussion: {
      prompt: "What activities or interactions energize you as a leader? What drains you? How intentional are you about managing that?",
      followUps: [
        "What would your week look like if you designed it around energy?",
        "What are you tolerating that's costing you more than you realize?",
        "How do you recharge? Is it working?",
      ],
      duration: '25 min',
    },
    peerExercise: {
      title: 'Energy Audit',
      instructions: "Review your last week. Mark each major activity as: +Energy, -Energy, or Neutral. Look for patterns. Share: What one change would have the biggest impact on your energy?",
      duration: '15 min',
    },
    closing: {
      commitment: "Remove or reduce ONE energy drain this week. Add ONE energy source.",
      duration: '5 min',
    },
  },
  {
    id: 'circle-8',
    week: 8,
    title: 'Legacy & Impact',
    theme: 'legacy',
    icon: '🌟',
    duration: '45-60 min',
    objectives: [
      'Define the legacy you want to leave',
      'Align daily actions with long-term impact',
      'Celebrate growth and set future intentions',
    ],
    icebreaker: {
      question: "If you left your role tomorrow, what would people say about your leadership?",
      duration: '5 min',
    },
    mainDiscussion: {
      prompt: "What do you want to be remembered for as a leader? What legacy are you building?",
      followUps: [
        "How close is your current leadership to the leader you want to be?",
        "What's one thing you'd regret NOT doing?",
        "Who are you developing to carry on after you?",
      ],
      duration: '25 min',
    },
    peerExercise: {
      title: 'Letter from the Future',
      instructions: "Write a brief letter to yourself from 5 years in the future, thanking yourself for the leader you became. What choices did you make? What did you let go of? Share highlights with the group.",
      duration: '15 min',
    },
    closing: {
      commitment: "Name the ONE leadership habit you commit to building over the next 90 days.",
      duration: '5 min',
    },
  },
];

// ============================================================================
// ACCOUNTABILITY PARTNER PROMPTS
// Weekly check-in questions for partner pairs
// ============================================================================

export const ACCOUNTABILITY_PROMPTS = {
  weekly: [
    {
      id: 'ap-1',
      question: "What was your biggest leadership win this week?",
      followUp: "What made it possible? How will you replicate it?",
    },
    {
      id: 'ap-2',
      question: "Where did you struggle or fall short as a leader this week?",
      followUp: "What would you do differently? What did you learn?",
    },
    {
      id: 'ap-3',
      question: "Did you follow through on last week's commitment?",
      followUp: "If not, what got in the way? If yes, what impact did it have?",
    },
    {
      id: 'ap-4',
      question: "What's one thing you're avoiding that you know you need to address?",
      followUp: "What's the cost of continuing to avoid it?",
    },
    {
      id: 'ap-5',
      question: "How are you taking care of yourself so you can lead well?",
      followUp: "What needs attention? What's working?",
    },
  ],
  daily: [
    "What's your #1 priority today as a leader?",
    "Who needs your attention today?",
    "What conversation do you need to have?",
    "How will you show up for your team today?",
    "What's one small thing you can do today to develop someone on your team?",
  ],
};

// ============================================================================
// ONE-ON-ONE COACHING TOPICS
// Structured topics for coaching sessions
// ============================================================================

export const COACHING_TOPICS = [
  {
    id: 'coach-1',
    title: 'Career & Growth',
    icon: '📈',
    questions: [
      "Where do you want to be in 2-3 years?",
      "What skills do you most want to develop?",
      "What's your biggest career fear?",
      "What opportunities are you not pursuing that you should be?",
    ],
  },
  {
    id: 'coach-2',
    title: 'Team Challenges',
    icon: '👥',
    questions: [
      "What team dynamic is most challenging right now?",
      "Who on your team needs the most attention?",
      "What would make your team 10% more effective?",
      "Where is trust lacking, and why?",
    ],
  },
  {
    id: 'coach-3',
    title: 'Personal Leadership',
    icon: '🪞',
    questions: [
      "What's your biggest leadership blind spot?",
      "When do you feel most confident as a leader? Least confident?",
      "What feedback have you received that stuck with you?",
      "What would the best version of yourself do?",
    ],
  },
  {
    id: 'coach-4',
    title: 'Work-Life Integration',
    icon: '⚖️',
    questions: [
      "How sustainable is your current pace?",
      "What boundaries do you need to set or reinforce?",
      "What's suffering because of work demands?",
      "What would healthy integration look like for you?",
    ],
  },
  {
    id: 'coach-5',
    title: 'Influence & Politics',
    icon: '🤝',
    questions: [
      "Who do you need to build a stronger relationship with?",
      "How comfortable are you with organizational politics?",
      "What would increase your influence?",
      "Where do you need to advocate more for yourself or your team?",
    ],
  },
  {
    id: 'coach-6',
    title: 'Decision Making',
    icon: '🎯',
    questions: [
      "What decision are you currently stuck on?",
      "What's your default decision-making style?",
      "How do you balance data vs. intuition?",
      "What decision do you need to make that you've been delaying?",
    ],
  },
];

// ============================================================================
// COMMUNITY CHALLENGES
// Team-wide or circle-wide challenges to build culture
// ============================================================================

export const COMMUNITY_CHALLENGES = [
  {
    id: 'challenge-1',
    title: 'Gratitude Week',
    description: 'Write one genuine thank-you note each day to someone on your team or in your organization.',
    duration: '5 days',
    icon: '💌',
    points: 50,
  },
  {
    id: 'challenge-2',
    title: 'Skip-Level Listening',
    description: 'Have a 15-minute coffee chat with someone 2+ levels below you. Just listen.',
    duration: '1 week',
    icon: '☕',
    points: 30,
  },
  {
    id: 'challenge-3',
    title: 'Feedback Sprint',
    description: 'Give specific, actionable feedback to 3 people this week. Ask for feedback from 2.',
    duration: '1 week',
    icon: '🔄',
    points: 40,
  },
  {
    id: 'challenge-4',
    title: 'Meeting-Free Morning',
    description: 'Block 2 hours every morning this week for deep work. Protect it fiercely.',
    duration: '5 days',
    icon: '🧘',
    points: 25,
  },
  {
    id: 'challenge-5',
    title: 'Delegate & Trust',
    description: 'Delegate one task you normally do yourself. Don\'t micromanage. Debrief after.',
    duration: '1 week',
    icon: '🎯',
    points: 35,
  },
  {
    id: 'challenge-6',
    title: 'Radical Candor',
    description: 'Have one difficult conversation you\'ve been avoiding. Care personally, challenge directly.',
    duration: '1 week',
    icon: '💬',
    points: 45,
  },
];

// ============================================================================
// REFLECTION SHARING PROMPTS
// Prompts for sharing insights with the community
// ============================================================================

export const SHARING_PROMPTS = [
  "The biggest thing I learned this week about leadership is...",
  "I was challenged when...",
  "I'm proud of how I handled...",
  "I'm still working on...",
  "One thing I'd tell my past self about leadership...",
  "My team taught me...",
  "I failed at... and learned...",
  "The best question I asked this week was...",
  "I'm grateful for...",
  "Next week, I'm committed to...",
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export const getCurrentCircleGuide = (weekNumber) => {
  const index = (weekNumber - 1) % CIRCLE_DISCUSSION_GUIDES.length;
  return CIRCLE_DISCUSSION_GUIDES[index];
};

export const getRandomAccountabilityPrompt = () => {
  const prompts = ACCOUNTABILITY_PROMPTS.weekly;
  return prompts[Math.floor(Math.random() * prompts.length)];
};

export const getDailyAccountabilityPrompt = (dayOfWeek) => {
  const prompts = ACCOUNTABILITY_PROMPTS.daily;
  return prompts[dayOfWeek % prompts.length];
};

export const getRandomChallenge = () => {
  return COMMUNITY_CHALLENGES[Math.floor(Math.random() * COMMUNITY_CHALLENGES.length)];
};

export const getRandomSharingPrompt = () => {
  return SHARING_PROMPTS[Math.floor(Math.random() * SHARING_PROMPTS.length)];
};

export default {
  CIRCLE_DISCUSSION_GUIDES,
  ACCOUNTABILITY_PROMPTS,
  COACHING_TOPICS,
  COMMUNITY_CHALLENGES,
  SHARING_PROMPTS,
  getCurrentCircleGuide,
  getRandomAccountabilityPrompt,
  getDailyAccountabilityPrompt,
  getRandomChallenge,
  getRandomSharingPrompt,
};
