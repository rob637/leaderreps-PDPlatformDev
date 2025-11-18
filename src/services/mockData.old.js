// src/services/mockData.js

export const MOCK_DEVELOPMENT_PLAN_DATA = {
  currentPlan: null, // Ensure mock reflects reality
  assessmentHistory: [],
  planHistory: [],
  currentCycle: 1,
};

export const MOCK_DAILY_PRACTICE_DATA = {
  lastUpdated: new Date().toISOString().split('T')[0],
  dailyTargetRepId: null,
  dailyTargetRepStatus: 'Pending',
  dailyTargetRepDate: null,
  activeCommitments: [],
  completedRepsToday: [],
  identityAnchor: '',
  habitAnchor: '',
  whyStatement: '', // Add mock field
  streakCount: 0,
  streakCoins: 0,
};

export const MOCK_STRATEGIC_CONTENT_DATA = {
  vision: '',
  mission: '',
  values: [],
  goals: [],
  purpose: '',
};

export const MOCK_MEMBERSHIP_DATA = {
    status: 'Trial',
    currentPlanId: 'trial',
    nextBillingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    paymentHistory: [],
    notifications: [
        { id: 'welcome', message: 'Welcome to your 7-day free trial! Upgrade now to maintain access.', type: 'warning', isRead: false }
    ],
};

export const MOCK_MEMBERSHIP_PLANS = {
    items: [
        { 
            id: 'basic', 
            name: 'Base', 
            price: 29, 
            recurrence: 'Monthly', 
            features: [
                'Dashboard & Daily Practice', 
                'Basic Rep Library', 
                'Weekly Development Plan', 
                'Limited AI Coaching (5/month)'
            ]
        },
        { 
            id: 'professional', 
            name: 'Pro', 
            price: 79, 
            recurrence: 'Monthly', 
            features: [
                'Full Rep & Content Library', 
                'Unlimited Daily Practice', 
                'Complete Development Plans', 
                'Full AI Coaching Lab Access',
                'Community Participation'
            ]
        },
        { 
            id: 'elite', 
            name: 'Premium', 
            price: 199, 
            recurrence: 'Monthly', 
            features: [
                'All Pro Features', 
                'Executive ROI Reports', 
                'Priority Support', 
                '1-on-1 Coaching Sessions',
                'Early Access to New Content'
            ]
        }
    ]
};

// Global metadata mocks - Feature flags control navigation visibility
export const MOCK_FEATURE_FLAGS = { 
  // V1 CORE FEATURES (ENABLED)
  enableDevPlan: true,
  enableDailyPractice: true,
  enableMembershipModule: true,
  
  // TIER-GATED FEATURES (ENABLED - Access controlled by tier)
  enableReadings: true,       // Professional Reading Hub - Pro+
  enableCourses: true,        // Course Library - Pro+
  enableLabs: true,           // AI Coaching Lab - Pro+
  enableVideos: true,         // Leadership Videos - Pro+
  enableCommunity: true,      // Community features - Pro+
  
  // DEVELOPER/ELITE FEATURES (ENABLED - Dev mode or Elite tier)
  enableLabsAdvanced: true,   // Advanced Lab features
  enablePlanningHub: true,    // Strategic Tools - Dev only
  enableRoiReport: true,      // Executive ROI Report - Dev only
  enableQuickStart: true,     // Keep QuickStart for onboarding
  
  // LEGACY/OTHER
  enableNewFeature: false 
};
export const MOCK_REP_LIBRARY = [];
export const MOCK_EXERCISE_LIBRARY = [];
export const MOCK_WORKOUT_LIBRARY = [];
export const MOCK_COURSE_LIBRARY = {
  items: [
    {
      id: 'executive-presence-masterclass',
      title: 'Executive Presence Masterclass',
      description: 'A 6-week intensive program designed to help senior leaders develop commanding presence, influence, and gravitas in high-stakes situations.',
      instructor: 'Dr. Sarah Chen',
      instructorBio: '20+ years executive coaching, former Fortune 500 VP',
      duration: '6 weeks',
      format: 'Live + Self-Paced',
      startDate: '2025-01-15',
      endDate: '2025-02-26',
      enrollmentDeadline: '2025-01-10',
      price: 1299,
      tier_id: 'T3',
      category: 'Leadership Development',
      level: 'Advanced',
      maxParticipants: 25,
      currentEnrollment: 18,
      status: 'enrolling',
      meetingTimes: ['Wednesdays 2:00-3:30 PM EST'],
      modules: [
        { week: 1, title: 'The Foundation of Executive Presence', type: 'live' },
        { week: 2, title: 'Commanding the Room', type: 'live' },
        { week: 3, title: 'Influence Without Authority', type: 'self-paced' },
        { week: 4, title: 'Managing Up with Confidence', type: 'live' },
        { week: 5, title: 'Crisis Leadership & Communication', type: 'live' },
        { week: 6, title: 'Sustaining Your Executive Brand', type: 'capstone' }
      ],
      prerequisites: ['2+ years management experience', 'Completed Leadership Assessment'],
      learningOutcomes: [
        'Command attention and respect in any room',
        'Influence senior stakeholders effectively',
        'Handle challenging conversations with confidence',
        'Project executive-level gravitas and credibility'
      ],
      icon: 'Crown',
      color: 'PURPLE'
    },
    {
      id: 'feedback-mastery-bootcamp',
      title: 'Feedback Mastery Bootcamp',
      description: 'Master the art of giving and receiving feedback with this intensive 4-week program. Learn frameworks, practice scenarios, and build confidence.',
      instructor: 'Marcus Rodriguez',
      instructorBio: 'Former Google People Manager, Feedback & Performance Expert',
      duration: '4 weeks',
      format: 'Self-Paced + Peer Practice',
      startDate: '2025-01-22',
      endDate: '2025-02-19',
      enrollmentDeadline: '2025-01-18',
      price: 599,
      tier_id: 'T2',
      category: 'Communication',
      level: 'Intermediate',
      maxParticipants: 40,
      currentEnrollment: 32,
      status: 'enrolling',
      meetingTimes: ['Self-paced with weekly peer sessions'],
      modules: [
        { week: 1, title: 'The SBI Framework Mastery', type: 'self-paced' },
        { week: 2, title: 'Difficult Conversations Workshop', type: 'peer-practice' },
        { week: 3, title: 'Receiving Feedback Gracefully', type: 'self-paced' },
        { week: 4, title: 'Building Feedback Culture', type: 'capstone' }
      ],
      prerequisites: ['None'],
      learningOutcomes: [
        'Deliver effective feedback using proven frameworks',
        'Handle defensive reactions professionally',
        'Create psychological safety for feedback exchanges',
        'Build a culture of continuous improvement'
      ],
      icon: 'MessageSquare',
      color: 'TEAL'
    },
    {
      id: 'strategic-thinking-academy',
      title: 'Strategic Thinking Academy',
      description: 'Develop strategic mindset and long-term thinking capabilities. 8-week deep dive into frameworks used by top consultancies and Fortune 500 companies.',
      instructor: 'Dr. Jennifer Park',
      instructorBio: 'Former McKinsey Partner, Strategy Professor at Wharton',
      duration: '8 weeks',
      format: 'Live Cohort',
      startDate: '2025-02-05',
      endDate: '2025-03-26',
      enrollmentDeadline: '2025-01-31',
      price: 1899,
      tier_id: 'T4',
      category: 'Strategy',
      level: 'Expert',
      maxParticipants: 20,
      currentEnrollment: 14,
      status: 'enrolling',
      meetingTimes: ['Tuesdays 1:00-2:30 PM EST', 'Thursdays 1:00-2:30 PM EST'],
      modules: [
        { week: 1, title: 'Strategic Frameworks Overview', type: 'live' },
        { week: 2, title: 'Market Analysis & Competitive Intelligence', type: 'live' },
        { week: 3, title: 'SWOT, Porter\'s Five Forces & Blue Ocean', type: 'workshop' },
        { week: 4, title: 'Scenario Planning & Risk Assessment', type: 'live' },
        { week: 5, title: 'Financial Strategy & Resource Allocation', type: 'live' },
        { week: 6, title: 'Innovation Strategy & Disruption', type: 'workshop' },
        { week: 7, title: 'Implementation Planning', type: 'live' },
        { week: 8, title: 'Strategic Communication & Buy-in', type: 'capstone' }
      ],
      prerequisites: ['Director-level or above', 'P&L responsibility preferred'],
      learningOutcomes: [
        'Apply strategic frameworks to real business challenges',
        'Develop long-term thinking capabilities',
        'Create compelling strategic narratives',
        'Lead strategic planning processes'
      ],
      icon: 'Target',
      color: 'ORANGE'
    },
    {
      id: 'new-manager-bootcamp',
      title: 'New Manager Bootcamp',
      description: 'Essential skills for first-time managers. Learn delegation, one-on-ones, team building, and performance management fundamentals.',
      instructor: 'Lisa Thompson',
      instructorBio: 'Former Director at Salesforce, 15+ years management experience',
      duration: '3 weeks',
      format: 'Live + Practice Sessions',
      startDate: '2025-01-29',
      endDate: '2025-02-19',
      enrollmentDeadline: '2025-01-25',
      price: 399,
      tier_id: 'T1',
      category: 'Management Fundamentals',
      level: 'Beginner',
      maxParticipants: 30,
      currentEnrollment: 22,
      status: 'enrolling',
      meetingTimes: ['Mondays 12:00-1:00 PM EST', 'Fridays 12:00-1:00 PM EST'],
      modules: [
        { week: 1, title: 'From Individual Contributor to Manager', type: 'live' },
        { week: 2, title: 'Essential Management Skills', type: 'live' },
        { week: 3, title: 'Building Your Management Style', type: 'capstone' }
      ],
      prerequisites: ['Recently promoted to management role'],
      learningOutcomes: [
        'Understand your new role and responsibilities',
        'Master essential management conversations',
        'Build effective one-on-one practices',
        'Develop your management philosophy'
      ],
      icon: 'Users',
      color: 'BLUE'
    },
    {
      id: 'difficult-conversations-workshop',
      title: 'Difficult Conversations Workshop',
      description: 'A 2-day intensive workshop on navigating challenging workplace conversations with confidence and professionalism.',
      instructor: 'Robert Kim',
      instructorBio: 'Conflict Resolution Expert, Former Corporate Mediator',
      duration: '2 days',
      format: 'In-Person Workshop',
      startDate: '2025-02-15',
      endDate: '2025-02-16',
      enrollmentDeadline: '2025-02-10',
      price: 899,
      tier_id: 'T2',
      category: 'Communication',
      level: 'Intermediate',
      maxParticipants: 16,
      currentEnrollment: 11,
      status: 'enrolling',
      meetingTimes: ['Saturday-Sunday 9:00 AM - 4:00 PM EST'],
      modules: [
        { day: 1, title: 'Conversation Preparation & Frameworks', type: 'workshop' },
        { day: 2, title: 'Role-Play & Real Scenarios', type: 'practice' }
      ],
      prerequisites: ['None'],
      learningOutcomes: [
        'Navigate emotionally charged conversations',
        'Use de-escalation techniques effectively',
        'Deliver difficult news professionally',
        'Build stronger relationships through honest dialogue'
      ],
      icon: 'MessageCircle',
      color: 'RED'
    },
    {
      id: 'remote-leadership-mastery',
      title: 'Remote Leadership Mastery',
      description: 'Master the unique challenges of leading distributed teams. Learn virtual engagement, remote culture building, and digital leadership tools.',
      instructor: 'Dr. Angela Foster',
      instructorBio: 'Remote Work Expert, Author of "Leading from Anywhere"',
      duration: '5 weeks',
      format: 'Virtual Cohort',
      startDate: '2025-02-12',
      endDate: '2025-03-19',
      enrollmentDeadline: '2025-02-08',
      price: 799,
      tier_id: 'T3',
      category: 'Digital Leadership',
      level: 'Intermediate',
      maxParticipants: 25,
      currentEnrollment: 19,
      status: 'enrolling',
      meetingTimes: ['Wednesdays 11:00 AM - 12:30 PM EST'],
      modules: [
        { week: 1, title: 'Remote Leadership Fundamentals', type: 'live' },
        { week: 2, title: 'Building Virtual Team Culture', type: 'live' },
        { week: 3, title: 'Digital Communication Excellence', type: 'workshop' },
        { week: 4, title: 'Performance Management Remotely', type: 'live' },
        { week: 5, title: 'Sustaining Remote Excellence', type: 'capstone' }
      ],
      prerequisites: ['Currently managing remote team members'],
      learningOutcomes: [
        'Create engaging virtual team experiences',
        'Master remote performance management',
        'Build strong digital relationships',
        'Leverage technology for team success'
      ],
      icon: 'Wifi',
      color: 'GREEN'
    }
  ]
};
export const MOCK_SKILL_CATALOG = [];
export const MOCK_IDENTITY_ANCHOR_CATALOG = [];
export const MOCK_HABIT_ANCHOR_CATALOG = [];
export const MOCK_WHY_CATALOG = [];
export const MOCK_READING_CATALOG = {
  items: {
    'Leadership Fundamentals': [
      {
        id: 'lf_1', title: 'Good to Great', author: 'Jim Collins',
        theme: 'What separates great companies from good ones.',
        complexity: 'Medium', duration: 320, 
        focus: 'Level 5 Leadership, Hedgehog Concept, Flywheel Effect, Culture of Discipline',
        executiveBriefHTML: '<h3>Executive Brief: Good to Great</h3><p><strong>Core Message:</strong> Great companies are built on Level 5 Leadership—leaders who blend personal humility with professional will.</p><p><strong>Key Frameworks:</strong> Hedgehog Concept (What you can be best at + What drives your engine + What you\'re passionate about), First Who Then What principle.</p><p><strong>Action Items:</strong> Assess your leadership level, identify your organization\'s hedgehog concept, audit your team for A-players.</p>',
        fullFlyerHTML: '<h2>Good to Great by Jim Collins</h2><h3>Why This Book Matters for Leaders</h3><p>Collins\' research-based approach to understanding what makes companies transition from good performance to sustained greatness provides a roadmap for leaders at any level.</p><h3>Key Concepts</h3><ul><li><strong>Level 5 Leadership:</strong> The highest level of executive capabilities - personal humility + professional will</li><li><strong>First Who, Then What:</strong> Get the right people on the bus before deciding where to drive it</li><li><strong>Hedgehog Concept:</strong> Three overlapping circles of understanding</li><li><strong>Culture of Discipline:</strong> Disciplined people, thought, and action</li></ul><h3>Practical Applications</h3><p>Use the frameworks to audit your current leadership approach and organizational strategy. The Hedgehog Concept is particularly powerful for strategic clarity.</p>'
      },
      {
        id: 'lf_2', title: 'The 7 Habits of Highly Effective People', author: 'Stephen R. Covey',
        theme: 'Principles of personal and interpersonal effectiveness.',
        complexity: 'Low', duration: 380,
        focus: 'Character Ethics, Paradigm Shifts, Proactive Living, Win-Win Thinking',
        executiveBriefHTML: '<h3>Executive Brief: 7 Habits</h3><p><strong>Core Message:</strong> Effectiveness comes from aligning actions with timeless principles of character and integrity.</p><p><strong>Key Framework:</strong> Private Victory (Habits 1-3) must precede Public Victory (Habits 4-6), culminating in Renewal (Habit 7).</p>',
        fullFlyerHTML: '<h2>The 7 Habits of Highly Effective People</h2><h3>Foundation of Leadership Development</h3><p>Covey\'s principle-centered approach to leadership development focuses on character over technique.</p><h3>The Seven Habits</h3><ol><li>Be Proactive</li><li>Begin with the End in Mind</li><li>Put First Things First</li><li>Think Win-Win</li><li>Seek First to Understand, Then to be Understood</li><li>Synergize</li><li>Sharpen the Saw</li></ol>'
      },
      {
        id: 'lf_3', title: 'Leaders Eat Last', author: 'Simon Sinek',
        theme: 'Why some teams pull together and others don\'t.',
        complexity: 'Medium', duration: 350,
        focus: 'Circle of Safety, Trust Building, Servant Leadership, Team Chemistry',
        executiveBriefHTML: '<h3>Executive Brief: Leaders Eat Last</h3><p><strong>Core Message:</strong> Great leaders sacrifice their own comfort for the good of those in their care, creating a Circle of Safety.</p><p><strong>Key Insight:</strong> When leaders prioritize their people\'s wellbeing, teams naturally cooperate and perform at higher levels.</p>',
        fullFlyerHTML: '<h2>Leaders Eat Last by Simon Sinek</h2><h3>The Biology of Leadership</h3><p>Sinek explains how great leaders create environments where people feel safe, valued, and motivated to contribute their best work.</p>'
      }
    ],
    'Communication & Influence': [
      {
        id: 'ci_1', title: 'Crucial Conversations', author: 'Kerry Patterson, Joseph Grenny, Ron McMillan, Al Switzler',
        theme: 'Tools for talking when stakes are high.',
        complexity: 'Medium', duration: 280,
        focus: 'Dialogue Skills, Safety Creation, STATE Method, LEARN Method',
        executiveBriefHTML: '<h3>Executive Brief: Crucial Conversations</h3><p><strong>Core Message:</strong> Master crucial conversations to dramatically improve your leadership effectiveness.</p><p><strong>Key Framework:</strong> Start with Heart, Learn to Look, Make it Safe, Master your Stories, STATE your path, Explore Others\' Paths.</p>',
        fullFlyerHTML: '<h2>Crucial Conversations</h2><h3>Master High-Stakes Dialogue</h3><p>This book provides a step-by-step approach to handling conversations where stakes are high, emotions run strong, and opinions differ.</p>'
      },
      {
        id: 'ci_2', title: 'Influence: The Psychology of Persuasion', author: 'Robert Cialdini',
        theme: 'The psychology behind why people say yes.',
        complexity: 'High', duration: 320,
        focus: 'Six Principles of Persuasion, Ethical Influence, Social Psychology',
        executiveBriefHTML: '<h3>Executive Brief: Influence</h3><p><strong>Core Message:</strong> Understanding the six principles of persuasion helps leaders influence ethically and effectively.</p><p><strong>Six Principles:</strong> Reciprocation, Commitment/Consistency, Social Proof, Liking, Authority, Scarcity.</p>',
        fullFlyerHTML: '<h2>Influence by Robert Cialdini</h2><h3>The Science of Persuasion</h3><p>Learn the psychology behind compliance and how to apply these principles ethically in leadership situations.</p>'
      }
    ],
    'Strategy & Decision Making': [
      {
        id: 'sd_1', title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman',
        theme: 'The two systems that drive how we think.',
        complexity: 'High', duration: 480,
        focus: 'Cognitive Biases, Decision Making, System 1 vs System 2 Thinking',
        executiveBriefHTML: '<h3>Executive Brief: Thinking, Fast and Slow</h3><p><strong>Core Insight:</strong> Understanding System 1 (fast, intuitive) vs System 2 (slow, deliberate) thinking improves decision quality.</p>',
        fullFlyerHTML: '<h2>Thinking, Fast and Slow</h2><h3>Understanding Human Decision-Making</h3><p>Nobel laureate Kahneman reveals how our minds make decisions and the biases that influence our thinking.</p>'
      },
      {
        id: 'sd_2', title: 'Blue Ocean Strategy', author: 'W. Chan Kim, Renée Mauborgne',
        theme: 'How to create uncontested market space.',
        complexity: 'Medium', duration: 280,
        focus: 'Value Innovation, Strategy Canvas, Four Actions Framework',
        executiveBriefHTML: '<h3>Executive Brief: Blue Ocean Strategy</h3><p><strong>Core Message:</strong> Create new market space rather than competing in existing markets.</p>',
        fullFlyerHTML: '<h2>Blue Ocean Strategy</h2><h3>Strategic Innovation</h3><p>Move beyond competing in red oceans to creating blue oceans of uncontested market space.</p>'
      },
      {
        id: 'sd_3', title: 'The Innovator\'s Dilemma', author: 'Clayton M. Christensen',
        theme: 'Why great companies fail when faced with disruption.',
        complexity: 'High', duration: 320,
        focus: 'Disruptive Innovation, Sustaining vs Disruptive Technologies',
        executiveBriefHTML: '<h3>Executive Brief: The Innovator\'s Dilemma</h3><p><strong>Core Insight:</strong> Great companies can fail by doing everything right—listening to customers and investing in sustaining innovations while missing disruptive ones.</p>',
        fullFlyerHTML: '<h2>The Innovator\'s Dilemma</h2><h3>Understanding Disruption</h3><p>Christensen\'s groundbreaking work on why successful companies struggle with disruptive innovation.</p>'
      }
    ],
    'Team Building & Culture': [
      {
        id: 'tc_1', title: 'The Five Dysfunctions of a Team', author: 'Patrick Lencioni',
        theme: 'A leadership fable about teamwork.',
        complexity: 'Low', duration: 230,
        focus: 'Trust, Conflict, Commitment, Accountability, Results',
        executiveBriefHTML: '<h3>Executive Brief: Five Dysfunctions</h3><p><strong>The Pyramid:</strong> Absence of Trust → Fear of Conflict → Lack of Commitment → Avoidance of Accountability → Inattention to Results.</p>',
        fullFlyerHTML: '<h2>The Five Dysfunctions of a Team</h2><h3>Building High-Performance Teams</h3><p>Lencioni\'s model for understanding and addressing the fundamental causes of organizational politics and team failure.</p>'
      },
      {
        id: 'tc_2', title: 'Multipliers', author: 'Liz Wiseman',
        theme: 'How the best leaders make everyone smarter.',
        complexity: 'Medium', duration: 290,
        focus: 'Multiplier vs Diminisher Leadership, Talent Development',
        executiveBriefHTML: '<h3>Executive Brief: Multipliers</h3><p><strong>Core Concept:</strong> Multipliers amplify the intelligence of their teams, while Diminishers drain it.</p>',
        fullFlyerHTML: '<h2>Multipliers by Liz Wiseman</h2><h3>Amplifying Team Intelligence</h3><p>Discover the leadership practices that bring out the best thinking in others.</p>'
      }
    ],
    'Change Management': [
      {
        id: 'cm_1', title: 'Switch', author: 'Chip Heath, Dan Heath',
        theme: 'How to change things when change is hard.',
        complexity: 'Medium', duration: 260,
        focus: 'Rider, Elephant, Path Framework for Change',
        executiveBriefHTML: '<h3>Executive Brief: Switch</h3><p><strong>Change Framework:</strong> Direct the Rider (rational mind), Motivate the Elephant (emotional mind), Shape the Path (environment).</p>',
        fullFlyerHTML: '<h2>Switch by Chip & Dan Heath</h2><h3>Making Change Happen</h3><p>A framework for creating lasting change in organizations and personal life.</p>'
      },
      {
        id: 'cm_2', title: 'Leading Change', author: 'John P. Kotter',
        theme: 'The definitive guide to organizational transformation.',
        complexity: 'High', duration: 190,
        focus: '8-Step Change Process, Urgency Creation, Coalition Building',
        executiveBriefHTML: '<h3>Executive Brief: Leading Change</h3><p><strong>8 Steps:</strong> Create urgency, form coalition, develop vision, communicate vision, empower action, create wins, consolidate gains, anchor changes.</p>',
        fullFlyerHTML: '<h2>Leading Change by John Kotter</h2><h3>Organizational Transformation</h3><p>The proven 8-step process for leading successful change initiatives.</p>'
      }
    ],
    'Innovation & Creativity': [
      {
        id: 'ic_1', title: 'The Lean Startup', author: 'Eric Ries',
        theme: 'How today\'s entrepreneurs use continuous innovation.',
        complexity: 'Medium', duration: 320,
        focus: 'Build-Measure-Learn, MVP, Validated Learning',
        executiveBriefHTML: '<h3>Executive Brief: The Lean Startup</h3><p><strong>Core Methodology:</strong> Build-Measure-Learn feedback loops to reduce waste and increase learning speed.</p>',
        fullFlyerHTML: '<h2>The Lean Startup</h2><h3>Innovation Through Experimentation</h3><p>Apply startup principles to drive innovation in any organization.</p>'
      },
      {
        id: 'ic_2', title: 'Design Thinking', author: 'Tim Brown',
        theme: 'How design thinking transforms organizations.',
        complexity: 'Medium', duration: 260,
        focus: 'Human-Centered Design, Prototyping, Empathy',
        executiveBriefHTML: '<h3>Executive Brief: Design Thinking</h3><p><strong>Process:</strong> Empathize, Define, Ideate, Prototype, Test - a human-centered approach to innovation.</p>',
        fullFlyerHTML: '<h2>Design Thinking by Tim Brown</h2><h3>Innovation Through Design</h3><p>Learn how design thinking can drive breakthrough innovation and solve complex problems.</p>'
      }
    ],
    'Executive Excellence': [
      {
        id: 'ee_1', title: 'The Effective Executive', author: 'Peter F. Drucker',
        theme: 'The definitive guide to getting things done.',
        complexity: 'High', duration: 180,
        focus: 'Time Management, Decision Making, Effectiveness Principles',
        executiveBriefHTML: '<h3>Executive Brief: The Effective Executive</h3><p><strong>Five Practices:</strong> Know where time goes, focus on contribution, build on strengths, set priorities, make effective decisions.</p>',
        fullFlyerHTML: '<h2>The Effective Executive</h2><h3>Drucker\'s Timeless Wisdom</h3><p>The foundational text on executive effectiveness from the father of modern management.</p>'
      },
      {
        id: 'ee_2', title: 'High Output Management', author: 'Andrew S. Grove',
        theme: 'A high-tech manager\'s handbook.',
        complexity: 'High', duration: 240,
        focus: 'OKRs, One-on-Ones, Management Systems',
        executiveBriefHTML: '<h3>Executive Brief: High Output Management</h3><p><strong>Core Formula:</strong> Manager\'s Output = Output of team + Output of neighboring teams influenced.</p>',
        fullFlyerHTML: '<h2>High Output Management</h2><h3>Systematic Management</h3><p>Grove\'s systematic approach to management that influenced Silicon Valley leadership.</p>'
      },
      {
        id: 'ee_3', title: 'The Hard Thing About Hard Things', author: 'Ben Horowitz',
        theme: 'Building a business when there are no easy answers.',
        complexity: 'High', duration: 300,
        focus: 'Crisis Leadership, Difficult Decisions, CEO Challenges',
        executiveBriefHTML: '<h3>Executive Brief: The Hard Thing About Hard Things</h3><p><strong>Key Insight:</strong> The hard thing about hard things is there\'s no formula—practical wisdom for impossible situations.</p>',
        fullFlyerHTML: '<h2>The Hard Thing About Hard Things</h2><h3>Leadership in Crisis</h3><p>Real-world advice for handling the toughest leadership challenges.</p>'
      }
    ],
    'Emotional Intelligence': [
      {
        id: 'ei_1', title: 'Emotional Intelligence', author: 'Daniel Goleman',
        theme: 'Why it matters more than IQ.',
        complexity: 'Medium', duration: 350,
        focus: 'Self-Awareness, Self-Regulation, Empathy, Social Skills',
        executiveBriefHTML: '<h3>Executive Brief: Emotional Intelligence</h3><p><strong>Four Domains:</strong> Self-Awareness, Self-Management, Social Awareness, Relationship Management.</p>',
        fullFlyerHTML: '<h2>Emotional Intelligence by Daniel Goleman</h2><h3>The Foundation of Leadership</h3><p>Understanding and developing emotional intelligence for leadership success.</p>'
      },
      {
        id: 'ei_2', title: 'Primal Leadership', author: 'Daniel Goleman, Richard Boyatzis, Annie McKee',
        theme: 'Realizing the power of emotional intelligence.',
        complexity: 'Medium', duration: 280,
        focus: 'Resonant Leadership, Leadership Styles, Emotional Contagion',
        executiveBriefHTML: '<h3>Executive Brief: Primal Leadership</h3><p><strong>Core Truth:</strong> Leaders\' emotions are contagious—great leadership starts with managing your emotional state.</p>',
        fullFlyerHTML: '<h2>Primal Leadership</h2><h3>Emotional Leadership</h3><p>How emotionally intelligent leaders create resonance and drive results.</p>'
      }
    ],
    'Performance & Productivity': [
      {
        id: 'pp_1', title: 'Atomic Habits', author: 'James Clear',
        theme: 'Tiny changes, remarkable results.',
        complexity: 'Low', duration: 320,
        focus: 'Habit Formation, Systems vs Goals, 1% Better',
        executiveBriefHTML: '<h3>Executive Brief: Atomic Habits</h3><p><strong>Core System:</strong> Cue, Craving, Response, Reward - the neurological loop that drives every habit.</p>',
        fullFlyerHTML: '<h2>Atomic Habits by James Clear</h2><h3>The Power of Small Changes</h3><p>Learn how tiny changes compound into remarkable results through better systems.</p>'
      },
      {
        id: 'pp_2', title: 'Deep Work', author: 'Cal Newport',
        theme: 'Rules for focused success in a distracted world.',
        complexity: 'Medium', duration: 290,
        focus: 'Concentration, Distraction Management, Cognitive Capital',
        executiveBriefHTML: '<h3>Executive Brief: Deep Work</h3><p><strong>Definition:</strong> Professional activities performed in a state of distraction-free concentration that push cognitive capabilities to their limit.</p>',
        fullFlyerHTML: '<h2>Deep Work by Cal Newport</h2><h3>Focus in a Distracted World</h3><p>Develop the ability to focus without distraction on cognitively demanding tasks.</p>'
      }
    ],
    'Negotiation & Conflict': [
      {
        id: 'nc_1', title: 'Getting to Yes', author: 'Roger Fisher, William Ury',
        theme: 'Negotiating agreement without giving in.',
        complexity: 'Medium', duration: 200,
        focus: 'Principled Negotiation, BATNA, Win-Win Solutions',
        executiveBriefHTML: '<h3>Executive Brief: Getting to Yes</h3><p><strong>Four Principles:</strong> Separate people from problems, focus on interests not positions, generate options, use objective criteria.</p>',
        fullFlyerHTML: '<h2>Getting to Yes</h2><h3>Principled Negotiation</h3><p>The Harvard Negotiation Project\'s method for reaching mutually beneficial agreements.</p>'
      },
      {
        id: 'nc_2', title: 'Difficult Conversations', author: 'Douglas Stone, Bruce Patton, Sheila Heen',
        theme: 'How to discuss what matters most.',
        complexity: 'Medium', duration: 250,
        focus: 'Three Conversations Model, Identity Issues, Learning Conversations',
        executiveBriefHTML: '<h3>Executive Brief: Difficult Conversations</h3><p><strong>Three Levels:</strong> What happened?, What emotions?, What does this say about me?</p>',
        fullFlyerHTML: '<h2>Difficult Conversations</h2><h3>Navigate Challenging Dialogue</h3><p>Transform difficult conversations into learning conversations with this Harvard-based approach.</p>'
      }
    ],
    'Sales & Marketing Leadership': [
      {
        id: 'sm_1', title: 'SPIN Selling', author: 'Neil Rackham',
        theme: 'The best-validated sales method available.',
        complexity: 'Medium', duration: 240,
        focus: 'SPIN Questions, Large Sale Process, Consultative Selling',
        executiveBriefHTML: '<h3>Executive Brief: SPIN Selling</h3><p><strong>SPIN Questions:</strong> Situation, Problem, Implication, Need-payoff - research-backed questioning sequence.</p>',
        fullFlyerHTML: '<h2>SPIN Selling by Neil Rackham</h2><h3>Research-Based Sales</h3><p>The most thoroughly researched sales methodology for complex, high-value sales.</p>'
      },
      {
        id: 'sm_2', title: 'Building a StoryBrand', author: 'Donald Miller',
        theme: 'Clarify your message so customers will listen.',
        complexity: 'Low', duration: 220,
        focus: 'StoryBrand Framework, Clear Messaging, Customer Journey',
        executiveBriefHTML: '<h3>Executive Brief: Building a StoryBrand</h3><p><strong>Framework:</strong> Customer is the hero, you are the guide, help them win the day.</p>',
        fullFlyerHTML: '<h2>Building a StoryBrand</h2><h3>Clear Marketing Messages</h3><p>Use the power of story to make your marketing messages clear and compelling.</p>'
      }
    ],
    'Finance & Operations': [
      {
        id: 'fo_1', title: 'The Goal', author: 'Eliyahu M. Goldratt',
        theme: 'A process of ongoing improvement.',
        complexity: 'Medium', duration: 360,
        focus: 'Theory of Constraints, Bottleneck Management, Throughput',
        executiveBriefHTML: '<h3>Executive Brief: The Goal</h3><p><strong>Core Principle:</strong> Identify and manage constraints (bottlenecks) to optimize entire system performance.</p>',
        fullFlyerHTML: '<h2>The Goal by Eliyahu Goldratt</h2><h3>Systems Thinking</h3><p>Learn the Theory of Constraints through an engaging business novel.</p>'
      },
      {
        id: 'fo_2', title: 'Financial Intelligence', author: 'Karen Berman, Joe Knight',
        theme: 'A manager\'s guide to knowing what the numbers mean.',
        complexity: 'Medium', duration: 240,
        focus: 'Financial Statements, Cash Flow, ROI, Financial Analysis',
        executiveBriefHTML: '<h3>Executive Brief: Financial Intelligence</h3><p><strong>Key Skills:</strong> Understanding P&L, balance sheets, cash flow statements, and key financial ratios for decision making.</p>',
        fullFlyerHTML: '<h2>Financial Intelligence</h2><h3>Numbers for Non-Financial Managers</h3><p>Develop the financial literacy every leader needs to make informed business decisions.</p>'
      }
    ],
    'Digital Transformation': [
      {
        id: 'dt_1', title: 'Leading Digital', author: 'Gartner Inc., Mark McDonald',
        theme: 'Turning technology into business transformation.',
        complexity: 'High', duration: 280,
        focus: 'Digital Strategy, Technology Leadership, Business Model Innovation',
        executiveBriefHTML: '<h3>Executive Brief: Leading Digital</h3><p><strong>Framework:</strong> Digital transformation requires leadership transformation - technology alone is insufficient.</p>',
        fullFlyerHTML: '<h2>Leading Digital</h2><h3>Technology Leadership</h3><p>Navigate the complexities of digital transformation with strategic insights from Gartner.</p>'
      }
    ],
    'Global Leadership': [
      {
        id: 'gl_1', title: 'The Culture Map', author: 'Erin Meyer',
        theme: 'Breaking through the invisible boundaries of global business.',
        complexity: 'Medium', duration: 280,
        focus: 'Cultural Intelligence, Communication Styles, Global Teams',
        executiveBriefHTML: '<h3>Executive Brief: The Culture Map</h3><p><strong>Eight Scales:</strong> Communication, Evaluation, Persuasion, Leading, Deciding, Trusting, Disagreeing, Scheduling.</p>',
        fullFlyerHTML: '<h2>The Culture Map by Erin Meyer</h2><h3>Cross-Cultural Leadership</h3><p>Navigate cultural differences to lead effectively in a global business environment.</p>'
      }
    ],
    'Entrepreneurship': [
      {
        id: 'en_1', title: 'Zero to One', author: 'Peter Thiel',
        theme: 'Notes on startups, or how to build the future.',
        complexity: 'High', duration: 210,
        focus: 'Monopoly vs Competition, Vertical Progress, Contrarian Thinking',
        executiveBriefHTML: '<h3>Executive Brief: Zero to One</h3><p><strong>Core Thesis:</strong> Create monopolies through vertical progress (0 to 1) rather than horizontal progress (1 to n).</p>',
        fullFlyerHTML: '<h2>Zero to One by Peter Thiel</h2><h3>Contrarian Entrepreneurship</h3><p>Build the future by creating something entirely new rather than copying what works.</p>'
      },
      {
        id: 'en_2', title: 'The Lean Startup', author: 'Eric Ries',
        theme: 'How today\'s entrepreneurs use continuous innovation.',
        complexity: 'Medium', duration: 320,
        focus: 'Build-Measure-Learn, MVP, Pivot Strategy',
        executiveBriefHTML: '<h3>Executive Brief: The Lean Startup</h3><p><strong>Methodology:</strong> Build-Measure-Learn feedback loops minimize waste and maximize learning velocity.</p>',
        fullFlyerHTML: '<h2>The Lean Startup</h2><h3>Innovation Methodology</h3><p>Apply lean principles to create more successful startups and drive innovation in established companies.</p>'
      }
    ],
    'Personal Mastery': [
      {
        id: 'pm_1', title: 'The Power of Now', author: 'Eckhart Tolle',
        theme: 'A guide to spiritual enlightenment for leaders.',
        complexity: 'Medium', duration: 240,
        focus: 'Present-Moment Awareness, Mindful Leadership, Inner Peace',
        executiveBriefHTML: '<h3>Executive Brief: The Power of Now</h3><p><strong>Core Message:</strong> True leadership power comes from present-moment awareness and inner stillness.</p>',
        fullFlyerHTML: '<h2>The Power of Now</h2><h3>Mindful Leadership</h3><p>Develop the inner foundation for authentic and effective leadership.</p>'
      },
      {
        id: 'pm_2', title: 'Mindset', author: 'Carol Dweck',
        theme: 'The new psychology of success.',
        complexity: 'Low', duration: 280,
        focus: 'Growth vs Fixed Mindset, Learning Orientation, Resilience',
        executiveBriefHTML: '<h3>Executive Brief: Mindset</h3><p><strong>Key Insight:</strong> Growth mindset (believing abilities can be developed) leads to greater achievement than fixed mindset.</p>',
        fullFlyerHTML: '<h2>Mindset by Carol Dweck</h2><h3>Psychology of Achievement</h3><p>Understand how mindset affects leadership, learning, and organizational culture.</p>'
      },
      {
        id: 'pm_3', title: 'Grit', author: 'Angela Duckworth',
        theme: 'The power of passion and perseverance.',
        complexity: 'Medium', duration: 340,
        focus: 'Perseverance, Deliberate Practice, Long-term Goals',
        executiveBriefHTML: '<h3>Executive Brief: Grit</h3><p><strong>Formula:</strong> Grit = Passion + Perseverance for long-term goals, often more important than talent.</p>',
        fullFlyerHTML: '<h2>Grit by Angela Duckworth</h2><h3>The Science of Achievement</h3><p>Research-backed insights on what drives exceptional achievement and how to develop it.</p>'
      }
    ],
    'Crisis Leadership': [
      {
        id: 'cl_1', title: 'Leadership in Turbulent Times', author: 'Doris Kearns Goodwin',
        theme: 'Lessons from Lincoln, Teddy Roosevelt, FDR, and LBJ.',
        complexity: 'High', duration: 480,
        focus: 'Crisis Leadership, Historical Lessons, Transformational Leadership',
        executiveBriefHTML: '<h3>Executive Brief: Leadership in Turbulent Times</h3><p><strong>Four Stages:</strong> How leaders are made, adversity and growth, "Where they led us," and "Why they succeeded."</p>',
        fullFlyerHTML: '<h2>Leadership in Turbulent Times</h2><h3>Historical Leadership Wisdom</h3><p>Learn from four transformational presidents who led America through its greatest challenges.</p>'
      }
    ],
    'Ethics & Purpose': [
      {
        id: 'ep_1', title: 'Conscious Capitalism', author: 'John Mackey, Raj Sisodia',
        theme: 'Liberating the heroic spirit of business.',
        complexity: 'Medium', duration: 320,
        focus: 'Higher Purpose, Stakeholder Orientation, Conscious Leadership',
        executiveBriefHTML: '<h3>Executive Brief: Conscious Capitalism</h3><p><strong>Four Pillars:</strong> Higher Purpose, Stakeholder Orientation, Conscious Leadership, Conscious Culture.</p>',
        fullFlyerHTML: '<h2>Conscious Capitalism</h2><h3>Purpose-Driven Business</h3><p>Transform capitalism to serve all stakeholders while creating sustainable prosperity.</p>'
      },
      {
        id: 'ep_2', title: 'Start With Why', author: 'Simon Sinek',
        theme: 'How great leaders inspire everyone to take action.',
        complexity: 'Low', duration: 256,
        focus: 'Golden Circle, Purpose-Driven Leadership, Inspiration',
        executiveBriefHTML: '<h3>Executive Brief: Start With Why</h3><p><strong>Golden Circle:</strong> Why (purpose) → How (process) → What (product). Great leaders start with Why.</p>',
        fullFlyerHTML: '<h2>Start With Why by Simon Sinek</h2><h3>Purpose-Driven Leadership</h3><p>Discover how to inspire others by starting with a clear sense of why your organization exists.</p>'
      }
    ]
  },
  categories: [
    'Leadership Fundamentals',
    'Communication & Influence', 
    'Strategy & Decision Making',
    'Team Building & Culture',
    'Change Management',
    'Innovation & Creativity',
    'Executive Excellence',
    'Emotional Intelligence',
    'Performance & Productivity',
    'Negotiation & Conflict',
    'Sales & Marketing Leadership',
    'Finance & Operations',
    'Digital Transformation',
    'Global Leadership',
    'Entrepreneurship',
    'Personal Mastery',
    'Crisis Leadership',
    'Ethics & Purpose'
  ],
  totalBooks: 52
};
export const MOCK_VIDEO_CATALOG = [];
export const MOCK_SCENARIO_CATALOG = [
  {
    id: 'underperformer-feedback',
    title: 'Addressing Chronic Underperformance',
    description: 'A previously strong team member has been missing deadlines and delivering subpar work for the past quarter. You need to address the performance gap while maintaining the relationship.',
    persona: 'Defensive Senior Developer',
    context: 'Jordan has been with the company for 4 years and was a top performer until recently. They seem disengaged in meetings and have missed three major deadlines. Other team members are starting to notice and picking up the slack.',
    complexity: 'intermediate',
    category: 'performance',
    suggestedApproach: 'Use the SBI framework to provide specific examples of the performance issues. Be curious about underlying causes—burnout, personal issues, or misalignment with work. Balance accountability with empathy.',
    learningObjectives: [
      'Deliver specific, behavior-based feedback',
      'Balance accountability with compassion',
      'Uncover root causes of performance decline',
      'Create a clear performance improvement plan'
    ]
  },
  {
    id: 'team-conflict-resolution',
    title: 'Resolving Team Conflict',
    description: 'Two high-performing team members are in constant conflict, creating tension across the entire team. Their disagreements are disrupting meetings and affecting team morale.',
    persona: 'Passive-Aggressive Marketing Manager',
    context: 'Alex and Sam have different work styles—Alex is detail-oriented and process-driven, while Sam is creative and prefers flexibility. Their differences have escalated from healthy debate to personal attacks in Slack and team meetings.',
    complexity: 'advanced',
    category: 'conflict',
    suggestedApproach: 'Meet with each person individually first to understand their perspective. Then facilitate a joint conversation focused on shared goals and professional collaboration. Set clear expectations for respectful communication.',
    learningObjectives: [
      'Navigate emotionally charged conversations',
      'Find common ground between opposing viewpoints',
      'Establish team norms for healthy conflict',
      'Address behavior without taking sides'
    ]
  },
  {
    id: 'compensation-request',
    title: 'Handling a Compensation Request',
    description: 'A valued team member has requested a significant raise, citing market rates and increased responsibilities. Budget constraints limit your ability to meet their request.',
    persona: 'High-Performer Threatening to Leave',
    context: 'Casey has been with the company for 2 years and recently took on additional project leadership responsibilities. They have a competing offer from another company and are asking for a 25% raise to stay. Your budget only allows for a 10% increase.',
    complexity: 'advanced',
    category: 'compensation',
    suggestedApproach: 'Acknowledge their contributions and value. Be transparent about budget constraints. Explore creative solutions beyond salary—title change, equity, flexible work, professional development. Avoid making promises you cannot keep.',
    learningObjectives: [
      'Navigate difficult financial conversations',
      'Balance employee needs with business constraints',
      'Explore non-monetary value propositions',
      'Make informed retention decisions'
    ]
  },
  {
    id: 'delegation-micromanager',
    title: 'Coaching an Over-Controlling Manager',
    description: 'One of your direct reports manages their team with excessive oversight, creating bottlenecks and limiting team growth. Team members have complained about lack of autonomy.',
    persona: 'Insecure First-Time Manager',
    context: 'Taylor was recently promoted to team lead after being an individual contributor. They are struggling to let go of hands-on work and are reviewing every detail of their team\'s output. Team velocity has decreased, and two team members have requested transfers.',
    complexity: 'intermediate',
    category: 'coaching',
    suggestedApproach: 'Understand the root of the controlling behavior—fear of failure, lack of trust, unclear expectations. Help them distinguish between delegation and abdication. Create a coaching plan focused on building trust and developing their team.',
    learningObjectives: [
      'Coach managers through common leadership transitions',
      'Address controlling behavior with empathy',
      'Teach effective delegation practices',
      'Balance manager development with team impact'
    ]
  },
  {
    id: 'diversity-incident',
    title: 'Responding to a Bias Incident',
    description: 'A team member has reported feeling excluded and experiencing microaggressions from a colleague. You need to investigate and address the situation while maintaining psychological safety.',
    persona: 'Defensive Colleague Accused of Bias',
    context: 'Morgan, a woman of color, reported that Drew has repeatedly talked over her in meetings, dismissed her ideas only to champion similar ideas from male colleagues, and made comments about her "being aggressive" when she advocates for herself.',
    complexity: 'expert',
    category: 'dei',
    suggestedApproach: 'Take the complaint seriously and investigate promptly. Meet with Morgan to understand her experience. Then address Drew\'s behavior with specific examples without labeling them as "racist" or "sexist" initially. Focus on impact over intent.',
    learningObjectives: [
      'Handle sensitive DEI issues with care',
      'Distinguish between impact and intent',
      'Create accountability without defensiveness',
      'Foster inclusive team behaviors'
    ]
  },
  {
    id: 'difficult-termination',
    title: 'Conducting a Difficult Termination',
    description: 'You need to terminate an employee who is well-liked by the team but has failed to meet performance standards after multiple improvement plans.',
    persona: 'Shocked Employee Facing Termination',
    context: 'Riley has been on a performance improvement plan for 90 days. Despite coaching and support, they have not demonstrated the required improvement. The team likes Riley personally, but their underperformance is creating additional burden on others.',
    complexity: 'expert',
    category: 'termination',
    suggestedApproach: 'Be clear, direct, and compassionate. This should not be a surprise if you\'ve given proper feedback. Explain the decision, outline next steps, and provide separation details. Keep it brief and dignified. Have HR present.',
    learningObjectives: [
      'Deliver difficult messages with clarity and compassion',
      'Maintain professionalism during emotional conversations',
      'Navigate legal and HR considerations',
      'Protect remaining team morale'
    ]
  },
  {
    id: 'executive-pushback',
    title: 'Pushing Back on Executive Decision',
    description: 'Senior leadership has announced a strategic decision that you believe will negatively impact your team and customers. You need to advocate for your team while managing up effectively.',
    persona: 'Impatient C-Suite Executive',
    context: 'The executive team has decided to cut your team\'s headcount by 30% while simultaneously increasing quarterly targets by 40%. You have data showing this is unrealistic and will lead to burnout, attrition, and quality issues.',
    complexity: 'expert',
    category: 'influence',
    suggestedApproach: 'Present data-driven concerns focused on business impact, not personal disagreement. Propose alternative solutions. Understand the constraints leadership is facing. Be prepared to implement the decision if your pushback is unsuccessful.',
    learningObjectives: [
      'Influence senior leadership with data and business cases',
      'Advocate for your team without being insubordinate',
      'Navigate power dynamics effectively',
      'Balance loyalty to team and organization'
    ]
  },
  {
    id: 'burnout-intervention',
    title: 'Intervening with a Burned-Out Employee',
    description: 'You notice a high-performing team member showing signs of severe burnout—working excessive hours, declining quality, emotional exhaustion. They are resistant to taking time off.',
    persona: 'Exhausted High-Achiever in Denial',
    context: 'Jamie has been working 70+ hour weeks for the past 3 months to meet a critical project deadline. The project is complete, but they continue to work excessive hours. They appear exhausted, have become irritable with teammates, and dismissively respond to suggestions to take time off.',
    complexity: 'intermediate',
    category: 'wellbeing',
    suggestedApproach: 'Express concern for their wellbeing with specific observations. Acknowledge their contributions while emphasizing that sustainable performance is the goal. Make taking time off non-negotiable, not optional. Discuss workload redistribution.',
    learningObjectives: [
      'Recognize and address burnout proactively',
      'Balance empathy with firm boundaries',
      'Model sustainable work practices',
      'Create psychological safety for vulnerability'
    ]
  }
];

export const LEADERSHIP_TIERS_FALLBACK = [
  { tier: 1, name: "Tier 1", description: "Foundation" },
  { tier: 2, name: "Tier 2", description: "Intermediate" },
  { tier: 3, name: "Tier 3", description: "Advanced" },
  { tier: 4, name: "Tier 4", description: "Expert" },
];

export const MOCK_GLOBAL_METADATA = {
  featureFlags: MOCK_FEATURE_FLAGS,
  LEADERSHIP_TIERS: LEADERSHIP_TIERS_FALLBACK,
  REP_LIBRARY: MOCK_REP_LIBRARY,
  EXERCISE_LIBRARY: MOCK_EXERCISE_LIBRARY,
  WORKOUT_LIBRARY: MOCK_WORKOUT_LIBRARY,
  COURSE_LIBRARY: MOCK_COURSE_LIBRARY,
  SKILL_CATALOG: MOCK_SKILL_CATALOG,
  IDENTITY_ANCHOR_CATALOG: MOCK_IDENTITY_ANCHOR_CATALOG,
  HABIT_ANCHOR_CATALOG: MOCK_HABIT_ANCHOR_CATALOG,
  WHY_CATALOG: MOCK_WHY_CATALOG,
  READING_CATALOG: MOCK_READING_CATALOG,
  VIDEO_CATALOG: MOCK_VIDEO_CATALOG,
  SCENARIO_CATALOG: MOCK_SCENARIO_CATALOG,
  MEMBERSHIP_PLANS: MOCK_MEMBERSHIP_PLANS,
  RESOURCE_LIBRARY: {},
  IconMap: {},
  GEMINI_MODEL: 'gemini-pro',
  APP_ID: 'mock-app-id'
};
