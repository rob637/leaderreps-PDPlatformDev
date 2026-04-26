// src/components/screens/ascent/conversationLibrary.js
//
// Lead Team — Conversation Library v1
//
// Data spine for the Ascent Lead Team experience. Each entry is the unit
// of content for a "conversation a new manager actually has to have."
//
// Keep this small and curated. Five to start. Frameworks are referenced
// by id and resolved from frameworks.js so the same framework can be
// reused across multiple conversations.

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
];

export const getConversationById = (id) =>
  CONVERSATIONS.find((c) => c.id === id) || null;

export const getFeaturedConversation = () =>
  CONVERSATIONS.find((c) => c.featured) || CONVERSATIONS[0];
