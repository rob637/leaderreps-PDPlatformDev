// src/components/screens/ascent/conversationLibrary.js
//
// Lead Team — Conversation Library
//
// Data spine for the Ascent Lead Team experience. Each entry is the unit
// of content for one of the 10-15 crucial conversations a leader actually
// has to have. Frameworks are referenced by id and resolved from
// frameworks.js so the same framework can be reused across conversations.
//
// Keep entries curated. Accuracy > volume.

export const CONVERSATIONS = [
  {
    id: 'expectation',
    title: 'The Expectation Conversation',
    tagline: 'Set (or reset) what good looks like.',
    icon: 'Target',
    accent: '#002E47',
    when: 'Use when someone is new, the goalposts moved, or you keep being disappointed.',
    avoid: 'Avoid the temptation to "just hint." Clarity is kindness.',
    frameworkId: 'prep4',
    promptStarters: [
      'Here\'s what success in this role looks like to me…',
      'I want to make sure we\'re aligned on what good looks like by Friday.',
      'Let me share three things I\'m measuring you against, and then I want to hear yours.',
    ],
    videoMinutes: 3,
  },
  {
    id: 'feedback',
    title: 'The Feedback Conversation',
    tagline: 'Say the thing — kindly, specifically, now.',
    icon: 'MessageSquare',
    accent: '#47A88D',
    when: 'Use within 24 hours of the moment. The longer you wait, the harder it gets.',
    avoid: 'Avoid the "feedback sandwich." It teaches people to ignore the middle.',
    frameworkId: 'sbi',
    promptStarters: [
      'I want to share an observation from this morning…',
      'Can I give you some feedback? It\'s small but I think it matters.',
      'Here\'s what I saw, here\'s the impact, here\'s what I\'d like to see next time.',
    ],
    videoMinutes: 3,
    featured: true,
  },
  {
    id: 'coaching',
    title: 'The Coaching Conversation',
    tagline: 'Ask, don\'t tell.',
    icon: 'HelpCircle',
    accent: '#E04E1B',
    when: 'Use when they could figure it out themselves with the right question.',
    avoid: 'Avoid jumping to the answer. The fastest answer is rarely the best teacher.',
    frameworkId: 'grow',
    promptStarters: [
      'What outcome are you actually after here?',
      'What have you already tried?',
      'If I weren\'t here, what would you do next?',
    ],
    videoMinutes: 4,
  },
  {
    id: 'decision',
    title: 'The Decision Conversation',
    tagline: 'Decide, communicate, move.',
    icon: 'Compass',
    accent: '#349881',
    when: 'Use when the team is stuck waiting on a call — yours or theirs.',
    avoid: 'Avoid faking consensus. Tell them how the decision will be made.',
    frameworkId: 'reversible',
    promptStarters: [
      'This is a one-way door — let\'s slow down and get it right.',
      'This is a two-way door — let\'s try it for two weeks and see.',
      'I\'ll make this call by Thursday. I want your input by Wednesday.',
    ],
    videoMinutes: 3,
  },
  {
    id: 'one-on-one',
    title: 'The 1:1 Conversation',
    tagline: 'The container that holds everything else.',
    icon: 'Users',
    accent: '#6366F1',
    when: 'Use weekly. Cancel meetings, not 1:1s.',
    avoid: 'Avoid the status update. Their work belongs in the project tool, not here.',
    frameworkId: 'prep4',
    promptStarters: [
      'What\'s on your mind this week?',
      'Where are you stuck — and what would unstick you?',
      'What\'s one thing I can do (or stop doing) to make your week easier?',
    ],
    videoMinutes: 4,
  },
  // ---------- Lead Team: healthy debate, conflict, feedback elicitation ----------
  {
    id: 'debate',
    title: 'The Healthy Debate Conversation',
    tagline: 'Get the disagreement out in the open — productively.',
    icon: 'Zap',
    accent: '#F59E0B',
    when: 'Use when your team goes quiet in meetings or the same people always agree.',
    avoid: 'Avoid "let\'s take this offline." That kills the debate before it starts.',
    frameworkId: 'sixHats',
    promptStarters: [
      'I want to hear the strongest case against this idea before we move forward.',
      'What are we not saying out loud? Let\'s put it on the table.',
      'I\'m going to play devil\'s advocate here — not because I\'m against it, but because we need to stress-test it.',
    ],
    videoMinutes: 4,
  },
  {
    id: 'conflict',
    title: 'The Conflict Conversation',
    tagline: 'Address the tension before it poisons the team.',
    icon: 'AlertTriangle',
    accent: '#EF4444',
    when: 'Use as soon as you notice two people avoiding each other or sniping in meetings.',
    avoid: 'Avoid solving it for them. Your job is to name it and create the space, not referee.',
    frameworkId: 'radarCheck',
    promptStarters: [
      'I\'ve noticed some tension between you two, and I think we all feel it. Can we name it?',
      'This isn\'t working, and it\'s affecting the team. Here\'s what I\'m observing…',
      'I\'m not here to decide who\'s right. I\'m here to help you both move forward.',
    ],
    videoMinutes: 4,
  },
  {
    id: 'feedback-elicit',
    title: 'The "Help Me Get Better" Conversation',
    tagline: 'Ask for candid feedback — and actually mean it.',
    icon: 'RefreshCw',
    accent: '#8B5CF6',
    when: 'Use quarterly, especially with direct reports and skip-level leaders.',
    avoid: 'Avoid asking "do you have any feedback for me?" — too easy to dodge. Use specific prompts.',
    frameworkId: 'prep4',
    promptStarters: [
      'What\'s one thing I do that makes your job harder — even if I don\'t intend it?',
      'If you could change one thing about how I run this team, what would it be?',
      'What do you wish I understood better about your day-to-day?',
    ],
    videoMinutes: 3,
  },
  {
    id: 'recognition',
    title: 'The Recognition Conversation',
    tagline: 'Specific praise lands. Generic praise disappears.',
    icon: 'Star',
    accent: '#10B981',
    when: 'Use within 24 hours of the moment — and in the right setting (public vs. private).',
    avoid: 'Avoid "great job." Name exactly what they did and why it mattered.',
    frameworkId: 'sbi',
    promptStarters: [
      'I want to call out something specific you did on Tuesday…',
      'I noticed what you did in that meeting — and I want to make sure you know I saw it.',
      'Here\'s what you did, here\'s what it produced, and here\'s why it matters to me.',
    ],
    videoMinutes: 2,
  },
];

export const getConversationById = (id) =>
  CONVERSATIONS.find((c) => c.id === id) || null;

export const getFeaturedConversation = () =>
  CONVERSATIONS.find((c) => c.featured) || CONVERSATIONS[0];
