// src/components/screens/ascent/conversationLibrary.js
//
// Lead Team — Conversation Library
//
// Nine of the 10-15 crucial conversations a leader actually has to have.
// Order follows a natural curriculum arc:
//   1:1 (the container) → Expectation → Feedback → Recognition →
//   Coaching → Decision → Healthy Debate → Conflict → Help Me Get Better
//
// Each entry carries a videoScript (bullet-point outline, 2-3 min when
// read aloud) that serves as (a) Ryan's filming script and (b) the in-app
// "read the script" placeholder until the video is recorded.
//
// videoUrl: null until video is filmed and hosted.

export const CONVERSATIONS = [
  {
    id: 'one-on-one',
    title: 'The 1:1 Conversation',
    tagline: 'The container that holds everything else.',
    icon: 'Users',
    accent: '#6366F1',
    when: 'Use weekly. Cancel other meetings, not 1:1s.',
    avoid: 'Avoid the status update. Status belongs in the project tool, not here.',
    frameworkId: 'prep4',
    featured: true,
    videoUrl: null,
    videoMinutes: 4,
    videoScript: [
      'The 1:1 is the most misused meeting in management — most managers run it as a status update. That\'s the wrong meeting.',
      'Status belongs in the project tool. The 1:1 belongs to your person.',
      'It\'s THEIR time, not yours. Your agenda is secondary. Start every one with "What\'s on your mind?"',
      'Three questions that make any 1:1 work: What\'s on your mind? Where are you stuck? What do you need from me?',
      'Weekly is the minimum. Monthly 1:1s aren\'t 1:1s — they\'re quarterly reviews with worse preparation.',
      'When you cancel: you signal that their problems only matter when it\'s convenient for you. That signal compounds.',
      'Practical setup: 30 minutes, same time each week. Protect it like a client meeting. Put it back if it moves.',
    ],
    promptStarters: [
      'What\'s on your mind this week?',
      'Where are you stuck — and what would unstick you?',
      'What\'s one thing I can do (or stop doing) to make your week easier?',
    ],
  },
  {
    id: 'expectation',
    title: 'The Expectation Conversation',
    tagline: 'Set (or reset) what good looks like.',
    icon: 'Target',
    accent: '#002E47',
    when: 'Use when someone is new, the goalposts moved, or you keep being disappointed.',
    avoid: 'Avoid the temptation to "just hint." Clarity is kindness.',
    frameworkId: 'prep4',
    videoUrl: null,
    videoMinutes: 3,
    videoScript: [
      'Most accountability failures start before the work begins — not at the deadline.',
      'The definition of "done" lives in the manager\'s head. The work lives in someone else\'s hands. That gap is where rework and resentment are born.',
      'Writing it down isn\'t micromanagement. It\'s the kindest thing you can do before a handoff.',
      'Three questions to answer before any significant assignment: What does done look like? What\'s the deadline? What level of decision authority do they have?',
      'When goalposts move mid-project: name it explicitly. Don\'t assume they know the parameters changed.',
      'The reset version is the same conversation — just with "we need to update what we agreed on" added up front.',
    ],
    promptStarters: [
      'Here\'s what success in this role looks like to me…',
      'I want to make sure we\'re aligned on what good looks like by Friday.',
      'Let me share what I\'m measuring, and then I want to hear what you\'re measuring.',
    ],
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
    videoUrl: null,
    videoMinutes: 3,
    videoScript: [
      'The longer you wait to give feedback, the harder it gets — exponentially, not linearly.',
      'Most managers avoid it because they fear the reaction. The reaction they get is almost always smaller than the one they imagined.',
      'SBI removes the personal from the feedback: Situation (when and where), Behavior (what they did, observable), Impact (what it caused for the work or team).',
      '"I noticed" is the most powerful opener you have — it\'s observational, not judgmental.',
      'The feedback sandwich is a myth: good-bad-good. People learn to brace for the middle and ignore the rest.',
      'One rule: give it within 24 hours of the moment. After that, you\'re correcting history, not adjusting behavior.',
    ],
    promptStarters: [
      'I want to share an observation from this morning…',
      'Can I give you some feedback? It\'s small but I think it matters.',
      'Here\'s what I saw, here\'s the impact, here\'s what I\'d like to see next time.',
    ],
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
    videoUrl: null,
    videoMinutes: 2,
    videoScript: [
      'Specific recognition is a leadership behavior — not a personality type. It can be learned and practiced.',
      '"Great job" evaporates. Naming exactly what they did and why it matters compounds over time.',
      'SBI works for recognition too: here\'s what happened (situation), here\'s exactly what you did (behavior), and here\'s what it produced (impact).',
      'Most managers default to feedback when something goes wrong. The leaders people follow catch what goes right.',
      'Public vs. private: praise publicly when appropriate, redirect privately. Always.',
      'One honest question: when was the last time you named exactly what someone did well — not just that they did well?',
    ],
    promptStarters: [
      'I want to call out something specific you did on Tuesday…',
      'I noticed what you did in that meeting — and I want to make sure you know I saw it.',
      'Here\'s what you did, here\'s what it produced, and here\'s why it matters to the team.',
    ],
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
    videoUrl: null,
    videoMinutes: 4,
    videoScript: [
      'When you jump in with the answer, you take ownership back — every time. And you train them to stop thinking.',
      'Ask one question, then be silent. Most managers fill silence immediately. That\'s the rep to break.',
      'GROW is a coaching arc, not a checklist: Goal (what outcome do they want?) → Reality (what\'s actually happening?) → Options (what could they do — name three) → Will (what will they do, and by when?).',
      'The tell/ask ratio most managers run is backwards: 80% telling, 20% asking. Flip it for coaching.',
      'The test: if they could have figured it out with the right question, you should have asked the question.',
      'The side effect of coaching well: they come back with solutions instead of problems.',
    ],
    promptStarters: [
      'What outcome are you actually after here?',
      'What have you already tried?',
      'If I weren\'t here, what would you do next?',
    ],
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
    videoUrl: null,
    videoMinutes: 3,
    videoScript: [
      'Teams don\'t stall because of bad decisions. They stall waiting for one.',
      'The most important question before you decide anything: is this a two-way door or a one-way door? Reversible vs. irreversible changes the process completely.',
      'Two-way door: decide fast, try it for two weeks, reverse if needed. One-way door: slow down, get it right, gather input.',
      'Three questions to answer before any decision: Who decides? Who provides input? Who just needs to be informed after?',
      'Faking consensus is the most common mistake: "Does everyone agree?" is not the same as "Here\'s how I\'m making this call, and here\'s why."',
      'Every decision needs one output: who, what, and when — written down and communicated to everyone it affects.',
    ],
    promptStarters: [
      'This is a one-way door — let\'s slow down and get it right.',
      'This is a two-way door — let\'s try it for two weeks and see.',
      'I\'ll make this call by Thursday. I want your input by Wednesday.',
    ],
  },
  {
    id: 'debate',
    title: 'The Healthy Debate Conversation',
    tagline: 'Get the disagreement out in the open — productively.',
    icon: 'Zap',
    accent: '#F59E0B',
    when: 'Use when your team goes quiet in meetings or the same people always dominate or agree.',
    avoid: 'Avoid "let\'s take this offline." That kills productive debate before it starts.',
    frameworkId: 'sixHats',
    videoUrl: null,
    videoMinutes: 4,
    videoScript: [
      'Silence in your meetings isn\'t agreement. It\'s deferred conflict, deference, or disengagement.',
      'If the same people always agree with you, you\'ve built an echo chamber. That\'s a risk — not a sign of alignment.',
      'Six Thinking Hats gives everyone permission to think in the same direction at the same time: facts, gut, risks, upside, alternatives, process. Structure kills groupthink.',
      'The most useful question you can ask in a meeting: "What\'s the strongest case against this idea?" Watch what happens.',
      '"Let\'s take this offline" is a reflex that shuts down exactly the conversation you needed to have.',
      'Your job isn\'t to win the debate. It\'s to surface the best thinking in the room — including the thinking that disagrees with yours.',
    ],
    promptStarters: [
      'I want to hear the strongest case against this idea before we move forward.',
      'What are we not saying out loud? Let\'s put it on the table.',
      'I\'m going to play devil\'s advocate — not because I\'m against it, but because we need to stress-test it.',
    ],
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
    videoUrl: null,
    videoMinutes: 4,
    videoScript: [
      'Conflict between two people on your team is your problem to address — whether you caused it or not.',
      'The longer you let it sit, the more it costs: meeting quality, decision speed, team trust, your own energy.',
      'Before the conversation, run the Conflict Radar Check: Is this about a behavior or a person? What do they both actually care about? What\'s the one concrete thing needed to move forward?',
      'Your role isn\'t referee. It\'s to name the tension, make it safe to talk, and let them solve it.',
      '"I\'ve noticed some tension between you two, and I think we all feel it" — that sentence is more powerful than any script.',
      'The one thing to avoid: solving it for them. The moment you do, ownership comes back to you.',
    ],
    promptStarters: [
      'I\'ve noticed some tension between you two, and I think we all feel it. Can we name it?',
      'This isn\'t working, and it\'s affecting the team. Here\'s what I\'m observing…',
      'I\'m not here to decide who\'s right. I\'m here to help you both move forward.',
    ],
  },
  {
    id: 'feedback-elicit',
    title: 'The "Help Me Get Better" Conversation',
    tagline: 'Ask for candid feedback — and actually mean it.',
    icon: 'RefreshCw',
    accent: '#8B5CF6',
    when: 'Use quarterly, especially with direct reports and skip-level peers.',
    avoid: 'Avoid "do you have any feedback for me?" — too easy to say no. Use specific prompts.',
    frameworkId: 'prep4',
    videoUrl: null,
    videoMinutes: 3,
    videoScript: [
      'Asking your direct reports for feedback takes more courage than giving it. Most leaders skip it entirely.',
      '"Do you have any feedback for me?" is the easiest question in the world to dodge — yes or no, and they\'ll almost always say no.',
      'Specific prompts get specific answers: "What\'s one thing I do that makes your job harder?" is answerable. Make it concrete.',
      'What you do with the feedback is what determines whether they answer honestly next time. If nothing changes, they stop telling you.',
      'Quarterly is the minimum. Annual reviews don\'t create the psychological safety for honest answers.',
      'The marker of a learning leader: more curious about what they\'re getting wrong than what they\'re getting right.',
    ],
    promptStarters: [
      'What\'s one thing I do that makes your job harder — even if I don\'t intend it?',
      'If you could change one thing about how I run this team, what would it be?',
      'What do you wish I understood better about your day-to-day?',
    ],
  },
];

export const getConversationById = (id) =>
  CONVERSATIONS.find((c) => c.id === id) || null;

export const getFeaturedConversation = () =>
  CONVERSATIONS.find((c) => c.featured) || CONVERSATIONS[0];
