// Demo User - Alex Martinez
// Week 4 of Foundation (8-week program)

export const demoUser = {
  id: 'demo-user-alex',
  firstName: 'Alex',
  lastName: 'Martinez',
  name: 'Alex Martinez',
  email: 'alex.martinez@techstart.com',
  avatar: '/demo-assets/alex-avatar.jpg',
  role: 'Engineering Manager',
  company: 'TechStart Inc.',
  teamSize: 8,
  yearsManaging: 3,
  // Foundation Week 4 - Completed Sessions 1-3
  currentWeek: 4,
  currentSession: 4, // About to do Session 4
  phase: 'foundation', // foundation or ascent
  cohortName: 'January 2026 Cohort',
  cohortSize: 12,
  startDate: '2025-12-16',
  foundationEndDate: '2026-02-10',
};

export const demoStats = {
  streakDays: 22,
  totalMinutes: 840,
  sessionsCompleted: 3,
  sessionsTotal: 4,
  workbookProgress: 75,
  oneOnOneCompleted: true,
  feedbackGiven: 18,
  journalEntries: 15,
};

export const demoProgress = {
  week: 4,
  dayOfWeek: 'Tuesday',
  completedToday: ['morning-intention', 'daily-tip'],
  pendingToday: ['session-prep', 'workbook-exercises'],
  weeklyGoals: [
    { id: 1, text: 'Complete Session 4 pre-work', done: true },
    { id: 2, text: 'Practice CLEAR feedback with 3 team members', done: true },
    { id: 3, text: 'Refine Leadership Identity Statement', done: false },
    { id: 4, text: 'Attend live cohort session', done: false },
  ],
};

// Foundation 4 Sessions
export const foundationSessions = [
  {
    id: 1,
    title: 'Delivering Effective Feedback',
    subtitle: 'The CLEAR Framework',
    description: 'Learn to give feedback that drives behavior change using the CLEAR method.',
    status: 'completed',
    completedDate: '2025-12-23',
    keyTopics: ['CLEAR Framework', '5:1 Magic Ratio', 'Reinforcing vs Redirecting'],
    icon: '💬',
  },
  {
    id: 2,
    title: 'Anchoring Feedback with Identity',
    subtitle: 'Your Leadership Identity Statement',
    description: 'Develop your Leadership Identity Statement and anchor feedback in who you are becoming.',
    status: 'completed',
    completedDate: '2025-12-30',
    keyTopics: ['Leadership Identity Statement', 'Identity-driven behavior', 'Feedback personas'],
    icon: '🎯',
  },
  {
    id: 3,
    title: 'Personalized Coaching 1:1',
    subtitle: 'One-on-One with Your Trainer',
    description: 'Personal coaching session to address your specific leadership challenges.',
    status: 'completed',
    completedDate: '2026-01-06',
    keyTopics: ['Personal feedback', 'Growth areas', 'Action planning'],
    icon: '🤝',
  },
  {
    id: 4,
    title: 'Building Vulnerability-Based Trust',
    subtitle: 'Trust & Team Dynamics',
    description: 'Master 1:1s and learn to build trust through vulnerability.',
    status: 'upcoming',
    scheduledDate: '2026-01-13',
    keyTopics: ['Effective 1:1s', '5 Dysfunctions', 'Psychological Safety'],
    icon: '🛡️',
  },
];

// CLEAR Framework
export const clearFramework = {
  title: 'CLEAR Feedback Framework',
  steps: [
    { letter: 'C', word: 'Check', description: 'Ask if it\'s a good time', example: '"Do you have a minute?" "Can we chat?"' },
    { letter: 'L', word: 'Lay out', description: 'Briefly set the scene', example: '"Yesterday in the meeting..." "This morning on our call..."' },
    { letter: 'E', word: 'Explain', description: 'Describe observable behavior', example: '"You challenged my idea about..." "You kept interrupting Sally."' },
    { letter: 'A', word: 'Articulate', description: 'Share the impact', example: '"...that ensures we get the best ideas." "It caused her to disengage."' },
    { letter: 'R', word: 'Request/Reinforce', description: 'Ask for change or reinforce', example: '"Keep up the great work." "In the future, I\'d like you to..."' },
  ],
};

// Leadership Identity Statement
export const leadershipIdentity = {
  statement: 'I am the type of leader who listens with intention, gives clear and caring feedback, and creates space for my team to grow and succeed.',
  qualities: ['Empathetic', 'Clear', 'Supportive', 'Growth-oriented', 'Courageous'],
  focusPhrase: 'Clear is Kind',
};

// Skills Progress
export const demoSkills = [
  { id: 'feedback', name: 'Giving Effective Feedback', progress: 78, level: 3, sessions: [1, 2] },
  { id: 'identity', name: 'Leadership Identity', progress: 65, level: 2, sessions: [2] },
  { id: 'coaching', name: 'Coaching & 1:1s', progress: 55, level: 2, sessions: [3, 4] },
  { id: 'trust', name: 'Building Trust', progress: 40, level: 1, sessions: [4] },
  { id: 'communication', name: 'Clear Communication', progress: 72, level: 3, sessions: [1, 2, 3] },
];

// Achievements
export const demoAchievements = [
  { id: 'first-session', name: 'First Session Complete', icon: '🎓', earnedDate: '2025-12-23', description: 'Completed your first Foundation session' },
  { id: 'clear-master', name: 'CLEAR Practitioner', icon: '💬', earnedDate: '2025-12-30', description: 'Mastered the CLEAR Feedback Framework' },
  { id: 'identity-defined', name: 'Identity Defined', icon: '🎯', earnedDate: '2025-12-30', description: 'Created your Leadership Identity Statement' },
  { id: 'streak-21', name: '21-Day Streak', icon: '🔥', earnedDate: '2026-01-08', description: '21 consecutive days of practice' },
  { id: 'feedback-champion', name: 'Feedback Champion', icon: '⭐', earnedDate: '2026-01-10', description: 'Gave 15+ pieces of feedback' },
];

// Cohort Members
export const cohortMembers = [
  { name: 'Sarah Chen', role: 'Product Director', company: 'InnovateCo', avatar: '👩‍💼' },
  { name: 'Marcus Johnson', role: 'VP Engineering', company: 'BuildRight', avatar: '👨‍💻' },
  { name: 'Elena Rodriguez', role: 'Team Lead', company: 'DataFlow', avatar: '👩‍🔬' },
  { name: 'James Williams', role: 'Operations Manager', company: 'ScaleUp', avatar: '👨‍💼' },
  { name: 'Priya Patel', role: 'Senior Manager', company: 'GrowthLabs', avatar: '👩‍🏫' },
  { name: 'David Kim', role: 'Engineering Manager', company: 'CloudBase', avatar: '👨‍🎓' },
];

// Journal Entries
export const demoJournalEntries = [
  {
    date: '2026-01-10',
    prompt: 'How did you apply the CLEAR framework today?',
    entry: 'Had a redirecting conversation with Mike about meeting deadlines. Used CLEAR - checked if he had time, laid out the situation from yesterday\'s sprint review, explained the behavior (missed deadline without communication), articulated the impact on the team, and requested he flag blockers earlier. He was receptive and even thanked me for being direct.',
  },
  {
    date: '2026-01-09',
    prompt: 'Reflect on your Leadership Identity Statement. How did you show up today?',
    entry: 'I focused on "clear is kind" today. Instead of avoiding a tough conversation with Emily about code quality, I addressed it head-on but with care. Reminded myself that unclear feedback doesn\'t help her grow. She appreciated the specificity.',
  },
  {
    date: '2026-01-08',
    prompt: 'What feedback did you give or receive today?',
    entry: 'Gave reinforcing feedback to Jordan for how she handled the client escalation. Made sure to be specific about what she did well - staying calm, asking clarifying questions, and following up with a summary email. She beamed. Need to remember to catch people doing things right more often.',
  },
];

// Today's Focus
export const demoTodayFocus = {
  skill: 'Building Vulnerability-Based Trust',
  tip: 'Trust is built in small moments. Today, try sharing one professional struggle with a team member.',
  action: 'In your next 1:1, ask an open question and listen without jumping to solutions.',
  quote: {
    text: 'Trust is earned in drops and lost in buckets.',
    author: 'Kevin Plank, Founder of Under Armour',
  },
};

// Upcoming Community Sessions
export const upcomingSessions = [
  {
    id: 1,
    title: 'Session 4: Building Vulnerability-Based Trust',
    type: 'Live Cohort Session',
    date: '2026-01-13',
    time: '10:00 AM EST',
    duration: '90 min',
    registered: true,
  },
  {
    id: 2,
    title: 'Leaders Circle: Open Forum',
    type: 'Community Session',
    date: '2026-01-20',
    time: '12:00 PM EST',
    duration: '60 min',
    registered: false,
  },
];

// Demo Steps for guided tour
export const demoSteps = [
  { id: 'welcome', screen: 'WelcomeScreen', title: 'Welcome to LeaderReps' },
  { id: 'journey', screen: 'JourneyOverviewScreen', title: 'Your Leadership Journey' },
  { id: 'foundation', screen: 'FoundationScreen', title: 'Foundation Program' },
  { id: 'live-session', screen: 'LiveSessionScreen', title: 'Live Sessions' },
  { id: 'arena', screen: 'ArenaScreen', title: 'The Arena' },
  { id: 'content', screen: 'ContentScreen', title: 'Content Library' },
  { id: 'community', screen: 'CommunityScreen', title: 'Community' },
  { id: 'coaching', screen: 'CoachingScreen', title: 'Coaching' },
  { id: 'ascent', screen: 'AscentScreen', title: 'Ascent' },
  { id: 'conclusion', screen: 'ConclusionScreen', title: 'Start Your Journey' },
];
