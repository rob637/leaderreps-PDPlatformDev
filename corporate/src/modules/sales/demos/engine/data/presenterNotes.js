// Presenter Notes - Hidden guidance for sales demos
// Activated with Ctrl+Shift+P

export const presenterNotes = {
  welcome: {
    talkingPoints: [
      'Alex represents a typical mid-level manager - relatable to most prospects',
      'Day 23 shows meaningful progress, not just starting out',
      'The 70-day structure provides clear beginning, middle, end',
      'Notice we\'re in "Dev Phase" - the core development period',
    ],
    keyMessage: 'This is what transformation looks like after just 3 weeks',
    timing: '1-2 minutes',
    transition: 'Let\'s see what Alex\'s morning routine looks like...',
    objectionHandlers: {
      'Too much time?': 'Daily commitment is just 10-15 minutes - fits into any schedule',
      'Another app?': 'This replaces scattered learning with one focused journey',
    },
  },
  
  dashboard: {
    talkingPoints: [
      'Everything at a glance - no hunting for information',
      'Streak counter drives engagement through psychology',
      'Progress indicators show momentum, not just completion',
      'Personalized to Alex\'s current focus and goals',
    ],
    keyMessage: 'Clarity creates action - users always know what to do next',
    timing: '2 minutes',
    transition: 'The morning practice is where the magic happens...',
    features: [
      { name: 'Streak Counter', point: '18 days - builds habit formation' },
      { name: 'Today\'s Focus', point: 'Connects daily work to skill development' },
      { name: 'Quick Actions', point: 'One tap to start - removes friction' },
    ],
    objectionHandlers: {
      'Looks complicated': 'Notice how clean it is - one primary action, supporting context',
    },
  },
  
  'daily-practice': {
    talkingPoints: [
      '5-minute morning ritual - fits before first meeting',
      'Intention setting primes the brain for growth mindset',
      'Daily tips are bite-sized, actionable, memorable',
      'Completion triggers dopamine - builds positive habits',
    ],
    keyMessage: 'Small daily investments compound into major growth',
    timing: '2-3 minutes',
    transition: 'When Alex has more time, there\'s a full content library...',
    demo: {
      action: 'Click the checkbox to show completion animation',
      highlight: 'Point out the skill connection - Communication',
    },
    objectionHandlers: {
      'My people won\'t do this daily': 'Streak psychology is powerful - 85% maintain 2+ week streaks',
      'Too simple?': 'Simplicity is intentional - complex programs have low completion rates',
    },
  },
  
  'content-library': {
    talkingPoints: [
      'Videos from world-class leadership experts',
      'Content is curated, not overwhelming',
      'Programs provide structured learning paths',
      'Documents and templates for immediate application',
    ],
    keyMessage: 'Right content, right time, right format for how leaders actually learn',
    timing: '3 minutes',
    demo: {
      action: 'Click on a video to show the player interface',
      highlight: 'Show the progress indicators on videos',
    },
    features: [
      { name: 'Video Library', point: '12 videos watched - engaged learner' },
      { name: 'Programs', point: 'Structured multi-week deep dives' },
      { name: 'Documents', point: 'Templates they can use immediately' },
    ],
    objectionHandlers: {
      'We have LinkedIn Learning': 'This is curated and connected to their daily practice - not random videos',
      'Content quality?': 'All content developed by proven leadership practitioners',
    },
  },
  
  roadmap: {
    talkingPoints: [
      'Visual journey creates momentum and motivation',
      'Achievements celebrate progress - not just completion',
      'Week view shows immediate next steps',
      'Phase structure (Prep→Dev→Post) matches learning science',
    ],
    keyMessage: 'Seeing progress fuels continued progress',
    timing: '2 minutes',
    demo: {
      action: 'Hover over achievements to show details',
      highlight: 'Point out the 32% progress and upcoming milestones',
    },
    features: [
      { name: 'Achievements', point: '6 earned - gamification that works' },
      { name: 'Week View', point: 'Clear weekly goals and tasks' },
      { name: 'Progress Bar', point: '32% complete - shows real progress' },
    ],
    objectionHandlers: {
      'Gamification is gimmicky': 'Research shows recognition drives engagement - this is smart design',
    },
  },
  
  reflection: {
    talkingPoints: [
      'Evening reflection closes the learning loop',
      'Journaling builds self-awareness - core leadership skill',
      'Prompts guide meaningful reflection, not busywork',
      'Private space for honest growth',
    ],
    keyMessage: 'Reflection turns experience into wisdom',
    timing: '2 minutes',
    demo: {
      action: 'Show a sample journal entry',
      highlight: 'Real leadership moments being captured',
    },
    objectionHandlers: {
      'People won\'t journal': '15 entries in 23 days - it works when prompted well',
      'What about privacy?': 'Completely private - only the user sees their journal',
    },
  },
  
  community: {
    talkingPoints: [
      'Leadership can be lonely - community provides support',
      'Peer learning accelerates development',
      'Coaching available for deeper support',
      'Not social media - focused professional community',
    ],
    keyMessage: 'Growth accelerates in community',
    timing: '2 minutes',
    features: [
      { name: 'Peer Connections', point: 'Learn from others on the journey' },
      { name: 'Coaching', point: 'Expert support when needed' },
      { name: 'Resources', point: 'Help center and support' },
    ],
    objectionHandlers: {
      'Another social feed?': 'This is focused, professional, and moderated - not endless scrolling',
    },
  },
  
  conclusion: {
    talkingPoints: [
      'Alex\'s transformation in 23 days shows what\'s possible',
      '70-day program creates lasting behavior change',
      'ROI in leadership effectiveness, team performance',
      'Ready to discuss implementation for your organization?',
    ],
    keyMessage: 'Transformation starts with a single day - what could 70 days do for your leaders?',
    timing: '1-2 minutes',
    callToAction: [
      'Schedule a deeper dive session',
      'Discuss pilot program options',
      'Get pricing and implementation timeline',
    ],
    closingQuestions: [
      'Which features resonated most with your needs?',
      'How many leaders would you want to start with?',
      'What\'s your timeline for a decision?',
    ],
  },
};

// Quick reference stats for presenters
export const quickStats = {
  programLength: '70 days',
  dailyCommitment: '10-15 minutes',
  avgCompletionRate: '78%',
  avgStreakLength: '16 days',
  contentPieces: '100+ videos, 50+ documents',
  skillAreas: '12 core leadership competencies',
};

// Keyboard shortcut for presenter mode
export const PRESENTER_MODE_SHORTCUT = {
  key: 'p',
  ctrl: true,
  shift: true,
};
