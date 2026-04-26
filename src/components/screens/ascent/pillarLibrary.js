// src/components/screens/ascent/pillarLibrary.js
//
// Ascent — Three-Pillar Library
//
// Defines the full YOUR PATH architecture:
//   Lead Work  → skills tied to Foundation; already partially done
//   Lead Team  → the 9 crucial conversations (links to conversationLibrary.js)
//   Lead Self  → inner-game skills coming Q3
//
// Each pillar has skillAreas, and each skillArea has skills (nodes).
// Lead Team skills reference conversationLibrary IDs — they are the conversations.
// Lead Work and Lead Self skills have standalone content defined here.
//
// status: 'available' | 'locked' | 'coming'
// source: 'foundation' | 'conversation' | 'standalone'

// ─── Lead Work Skills ──────────────────────────────────────────────────────
// Tied to Foundation. Shown as "built during Foundation — deepen here."

export const LEAD_WORK_SKILLS = [
  {
    id: 'lw-direction',
    title: 'Set Direction',
    tagline: 'Translate strategy into a clear team priority.',
    icon: 'Compass',
    accent: '#002E47',
    source: 'foundation',
    status: 'available',
    foundationNote: 'You practiced this in Foundation. Come back to sharpen the edge.',
    videoMinutes: 3,
    videoUrl: null,
    videoScript: [
      'Most teams don\'t fail because of bad strategy. They fail because no one told them what the strategy meant for their work on Monday.',
      'Direction isn\'t a vision statement — it\'s a one-sentence answer to "what are we optimizing for this quarter?"',
      'Three questions that test whether your team has direction: What\'s the one thing that, if we get it right, makes everything else easier? What are we choosing NOT to do? How will we know we got there?',
      'The trap: giving direction once in an all-hands and assuming it\'s understood. Repetition isn\'t micromanaging — it\'s how strategy becomes behavior.',
      'Practical move: write a Direction Statement (one paragraph, posted publicly) and ask your team to grade it on clarity 1-5. Act on the gaps.',
    ],
    framework: {
      name: 'Direction Statement',
      summary: 'A public, testable summary of team priorities.',
      steps: [
        { label: 'One priority', prompt: 'What is the single most important thing we\'re optimizing for this quarter?' },
        { label: 'Constraints', prompt: 'What are we explicitly NOT doing to stay focused?' },
        { label: 'Success signal', prompt: 'How will we know we got there? What does the metric or outcome look like?' },
        { label: 'Publish it', prompt: 'Put it somewhere the team can see it. Repeat it in every relevant meeting.' },
      ],
    },
    promptStarters: [
      'If we could only get one thing right this quarter, it\'s…',
      'Here\'s what we\'re saying no to so we can say yes to this…',
      'At the end of this quarter, here\'s what winning looks like…',
    ],
  },
  {
    id: 'lw-goals',
    title: 'Goal Setting',
    tagline: 'OKRs and cascading goals that actually land.',
    icon: 'Target',
    accent: '#002E47',
    source: 'foundation',
    status: 'available',
    foundationNote: 'You set goals in Foundation. Now make them cascade and stick.',
    videoMinutes: 4,
    videoUrl: null,
    videoScript: [
      'Goals fail in two places: when they\'re too vague to be actionable, and when they live only in the manager\'s head.',
      'OKRs work because they separate what (Objective — qualitative, inspiring) from how you\'ll know (Key Results — measurable, binary at quarter end).',
      'The cascade is the hard part. Your team\'s OKRs should directly support your manager\'s OKRs. If they don\'t, you\'re doing work that doesn\'t compound.',
      'One checkup rhythm that works: 5-minute OKR pulse at the start of every 1:1. Red/yellow/green with one sentence of context.',
      'The most common mistake: writing 12 Key Results. Three is the maximum to keep focus. More than that and nothing is actually a priority.',
    ],
    framework: {
      name: 'OKR Stack',
      summary: 'Objective + up to 3 measurable Key Results, tied to the layer above.',
      steps: [
        { label: 'Objective', prompt: 'What inspiring outcome are we trying to achieve? (Qualitative, motivating)' },
        { label: 'Key Result 1', prompt: 'What measurable signal tells us we\'re 100% there?' },
        { label: 'Key Result 2', prompt: 'Second measurable signal — must be different dimension from KR1.' },
        { label: 'Key Result 3 (optional)', prompt: 'Third signal — only add if genuinely distinct.' },
        { label: 'Cascade check', prompt: 'Which of your manager\'s OKRs does this directly support?' },
      ],
    },
    promptStarters: [
      'The outcome I\'m optimizing for this quarter is…',
      'I\'ll know we\'re 100% there when these three numbers move…',
      'This goal connects to the team\'s priority because…',
    ],
  },
  {
    id: 'lw-meetings',
    title: 'Meeting Effectiveness',
    tagline: 'Protect the team\'s time. Every meeting earns its hour.',
    icon: 'Calendar',
    accent: '#002E47',
    source: 'foundation',
    status: 'available',
    foundationNote: 'Foundation introduced meeting hygiene. Here\'s the operational depth.',
    videoMinutes: 3,
    videoUrl: null,
    videoScript: [
      'Every unnecessary meeting is a tax on the whole team\'s output — and you\'re the one setting the tax rate.',
      'Three questions before you schedule anything: What decision or output does this meeting produce? Who actually needs to be there (vs. could get a note)? Could this be async?',
      'A meeting without an agenda isn\'t a meeting — it\'s an obligation. Send the agenda 24 hours early with pre-reads attached.',
      'End every meeting with three sentences: what we decided, who owns what, and by when. Meeting notes that don\'t answer these are theater.',
      'One habit that changes everything: a 10-minute meeting audit. Cancel every recurring meeting you haven\'t redesigned in 90 days.',
    ],
    framework: {
      name: 'Meeting Audit',
      summary: 'Evaluate every recurring meeting against three standards.',
      steps: [
        { label: 'Purpose check', prompt: 'What specific decision or output does this meeting produce? If you can\'t name it, cancel it.' },
        { label: 'Attendee check', prompt: 'Who must be there vs. who should just receive notes? Remove everyone who\'s neither.' },
        { label: 'Agenda check', prompt: 'Is there a written agenda sent 24h before? If not, it\'s improvisation, not a meeting.' },
        { label: 'Output check', prompt: 'Does the meeting end with: decisions made, owners named, deadlines set? If not, redesign it.' },
      ],
    },
    promptStarters: [
      'Before we start — what does this meeting need to produce?',
      'Who in this room can make decisions? Everyone else might not need to be here.',
      'Let\'s end with: what did we decide, who owns what, by when.',
    ],
  },
  {
    id: 'lw-accountability',
    title: 'Accountability Systems',
    tagline: 'Make ownership visible. Address drift early.',
    icon: 'CheckSquare',
    accent: '#002E47',
    source: 'foundation',
    status: 'available',
    foundationNote: 'You know the principles. Here\'s how to build the system.',
    videoMinutes: 4,
    videoUrl: null,
    videoScript: [
      'Accountability isn\'t a conversation you have — it\'s a system you build. If the system requires you to remember, it will fail.',
      'The simplest accountability system: every commitment gets an owner and a date, stored somewhere everyone can see. Shared docs, project tools, meeting notes — it doesn\'t matter. Visibility matters.',
      'Three failure modes: ambiguous ownership ("we" should do this), undated commitments ("soon"), and follow-up that only lives in the manager\'s head.',
      'When someone misses a commitment: address it within 24 hours. Not punish — address. Ask what happened and what removes the obstacle. Silence signals it\'s acceptable.',
      'The leading indicator of a high-accountability culture: people flagging early when they\'re at risk of missing, not hiding and hoping.',
    ],
    framework: {
      name: 'Commitment Tracker',
      summary: 'Four fields that make accountability visible.',
      steps: [
        { label: 'One owner', prompt: 'Name the single person accountable. Not a team. Not "we." One name.' },
        { label: 'Clear deliverable', prompt: 'What does done look like? Describe the output, not the activity.' },
        { label: 'Hard deadline', prompt: 'Day and time — not "end of week," not "soon." A specific moment.' },
        { label: 'Visibility', prompt: 'Where is this commitment recorded so both of you can see it without asking?' },
      ],
    },
    promptStarters: [
      'Who specifically owns this — not the team, one name?',
      'What does done look like, and what\'s the deadline?',
      'Where will this live so we can both see it without asking?',
    ],
  },
  {
    id: 'lw-collaboration',
    title: 'Cross-functional Collaboration',
    tagline: 'Work across teams without losing speed.',
    icon: 'Share2',
    accent: '#002E47',
    source: 'foundation',
    status: 'available',
    foundationNote: 'Foundation covered the basics. Here\'s how to handle the hard dynamics.',
    videoMinutes: 4,
    videoUrl: null,
    videoScript: [
      'Cross-functional work fails in the gap between teams — where each team assumes the other is handling it.',
      'The single biggest lever: get explicit on who the decision-maker is when the work crosses a boundary. Ambiguity here creates the most rework.',
      'Stakeholder mapping isn\'t bureaucracy — it\'s insurance. Before a cross-functional project starts: who needs to decide, who needs to provide input, who just needs to be informed when it\'s done.',
      'The trust account: cross-functional relationships are built before you need them. Shared wins, delivered commitments, honest updates. You draw on that account when things get hard.',
      'When you hit friction: it\'s almost never about the people. It\'s usually about incentives and priorities that weren\'t aligned at the start. Go back to the source.',
    ],
    framework: {
      name: 'Stakeholder Map',
      summary: 'Clarify who decides and who inputs before the work starts.',
      steps: [
        { label: 'Decision makers', prompt: 'Who has final authority on this decision? Name them by role.' },
        { label: 'Input providers', prompt: 'Whose expertise or approval must be incorporated? Name them.' },
        { label: 'Inform list', prompt: 'Who needs to know the outcome without having a vote?' },
        { label: 'Friction point', prompt: 'Where is the most likely gap or conflict — and who needs to address it proactively?' },
      ],
    },
    promptStarters: [
      'Before we start — who has the final call on this?',
      'Who needs to be in the loop to make this land, even if they\'re not in this room?',
      'Here\'s where I see the friction point, and here\'s my plan to address it proactively…',
    ],
  },
  {
    id: 'lw-communication',
    title: 'Clear Communication',
    tagline: 'Write it so it can\'t be misread. Say it so it doesn\'t need a follow-up.',
    icon: 'FileText',
    accent: '#002E47',
    source: 'foundation',
    status: 'available',
    foundationNote: 'You practiced this in Foundation. Here\'s the writing and presenting depth.',
    videoMinutes: 3,
    videoUrl: null,
    videoScript: [
      'Unclear communication is almost always a thinking problem, not a writing problem. If you can\'t write it clearly, you don\'t understand it yet.',
      'The one-minute test for any update: if someone reads only the first sentence, do they understand the key point? If not, rewrite.',
      'Bottom-line up front (BLUF) is the operating principle: decision, recommendation, or key insight first — context and evidence after.',
      'For anything longer than a paragraph: use headers. Not for aesthetics — because people scan before they read, and they might only read your headers.',
      'The follow-up is a failure signal: if you need to follow up to clarify your original message, the original message failed. Redesign it.',
    ],
    framework: {
      name: 'BLUF Writing',
      summary: 'Bottom line up front — lead with the decision, not the background.',
      steps: [
        { label: 'Lead line', prompt: 'What is the one thing you need the reader to know or do? Write that first.' },
        { label: 'Evidence', prompt: 'Two or three supporting points — only what\'s needed to trust the lead line.' },
        { label: 'Ask or action', prompt: 'What specifically do you need from the reader, and by when?' },
        { label: 'One-minute test', prompt: 'Read only the first sentence. Does it contain the whole message? If not, rewrite.' },
      ],
    },
    promptStarters: [
      'The bottom line: here\'s what I need you to know or do…',
      'Two supporting reasons, then I need a decision by…',
      'The action I\'m asking for is X — here\'s the context if you need it.',
    ],
  },
];

// ─── Lead Self Skills ──────────────────────────────────────────────────────
// Inner-game leadership. Status: coming Q3 2026.

export const LEAD_SELF_SKILLS = [
  {
    id: 'ls-style',
    title: 'Know Your Default Style',
    tagline: 'Understand how you show up — especially under pressure.',
    icon: 'User',
    accent: '#6366F1',
    source: 'standalone',
    status: 'coming',
    videoMinutes: 4,
    videoUrl: null,
    videoScript: [
      'Every leader has a default — a predictable way they show up when things are fine. And a different default when things are hard.',
      'The gap between those two is where the work is. Most leadership development focuses on skills. Lead Self focuses on patterns.',
      'You can\'t change a pattern you can\'t see. The first move is mapping it: what does your team experience when you\'re under pressure? Ask three people you trust.',
      'Default styles aren\'t weaknesses — they\'re tools that need calibration. The driver becomes a bulldozer. The harmonizer becomes conflict-avoidant. Name it so you can choose.',
      'One practice: after a meeting where you felt friction, ask yourself "which version of me showed up?" and "was that the version the situation needed?"',
    ],
    framework: {
      name: 'Style Audit',
      summary: 'Map your default vs. your pressure-state behavior.',
      steps: [
        { label: 'Default style', prompt: 'How do people describe you when things are going well? Ask three people.' },
        { label: 'Pressure state', prompt: 'How do you change when projects are behind, stakes are high, or trust is broken?' },
        { label: 'Blind spots', prompt: 'What does your default style cost you — what do others experience that you don\'t see?' },
        { label: 'Calibration', prompt: 'In which situations does your default help? Where does it get in the way?' },
      ],
    },
    promptStarters: [
      'When I\'m at my best, my team experiences me as…',
      'When I\'m under pressure, I tend to…',
      'The pattern I\'m working on right now is…',
    ],
  },
  {
    id: 'ls-regulation',
    title: 'Regulate Under Pressure',
    tagline: 'Stay useful when the stakes are high.',
    icon: 'Activity',
    accent: '#6366F1',
    source: 'standalone',
    status: 'coming',
    videoMinutes: 3,
    videoUrl: null,
    videoScript: [
      'Your team watches you most closely in hard moments — late nights, missed targets, public failure, team conflict. That\'s when your regulation matters most.',
      'Regulation isn\'t suppression. It\'s the ability to feel what you\'re feeling and still choose your response.',
      'The physiological reset: 5-4-1 breathing, cold water on your face, a 60-second walk. These aren\'t wellness theater — they\'re nervous system tools that actually work.',
      'The tell: when you find yourself explaining, defending, or going quiet — that\'s usually a signal, not a strategy.',
      'One practice worth building: a pre-conversation ritual before anything hard. 60 seconds of quiet where you name what you\'re feeling and decide how you want to show up.',
    ],
    framework: {
      name: 'Pressure Protocol',
      summary: 'A three-step reset before any high-stakes moment.',
      steps: [
        { label: 'Name it', prompt: 'What am I actually feeling right now — not what I\'m thinking, what I\'m feeling?' },
        { label: 'Reset', prompt: '60 seconds: slow breathing (4 in, 4 hold, 4 out) or brief physical movement.' },
        { label: 'Choose', prompt: 'How do I want to show up in this next 10 minutes? Name it explicitly.' },
        { label: 'Debrief', prompt: 'After: what happened? Did I show up the way I chose? What would I adjust?' },
      ],
    },
    promptStarters: [
      'Before I respond — let me take a breath and name what I\'m bringing into this room.',
      'I\'m feeling the pressure here. What\'s the most useful version of me right now?',
      'I want to debrief my own reaction from that conversation…',
    ],
  },
  {
    id: 'ls-energy',
    title: 'Manage Your Energy',
    tagline: 'Lead from full, not from empty.',
    icon: 'Zap',
    accent: '#6366F1',
    source: 'standalone',
    status: 'coming',
    videoMinutes: 3,
    videoUrl: null,
    videoScript: [
      'Time management is a distraction. The real constraint is energy — and most leaders manage their calendar, not their capacity.',
      'There are four energy categories: physical, emotional, mental, and purpose. When one is depleted, you compensate by burning the others. Eventually everything runs low at once.',
      'Energy audit question: which part of your week drains you disproportionately? Which part refills you? Most leaders have never mapped this explicitly.',
      'Three design moves: protect your recovery time the same way you protect client meetings; schedule your hardest cognitive work in your peak energy window; build one energy-replenishing activity into every week.',
      'The performance ceiling for any leader is their baseline energy, not their skill set.',
    ],
    framework: {
      name: 'Energy Audit',
      summary: 'Map where energy comes from and where it goes.',
      steps: [
        { label: 'Energy drains', prompt: 'List three activities or situations that reliably leave you feeling depleted.' },
        { label: 'Energy sources', prompt: 'List three things that reliably restore or increase your energy.' },
        { label: 'Peak window', prompt: 'When is your cognitive peak — morning, afternoon, evening? What\'s scheduled there now?' },
        { label: 'Design move', prompt: 'One concrete change to protect energy this week — name it and schedule it.' },
      ],
    },
    promptStarters: [
      'The pattern that drains me most is… and I\'m going to address it by…',
      'I\'m protecting my peak energy window for… and moving everything else.',
      'My one energy recovery practice this week is…',
    ],
  },
  {
    id: 'ls-receive-feedback',
    title: 'Receive Feedback',
    tagline: 'Take it in without deflecting, defending, or disappearing.',
    icon: 'MessageSquare',
    accent: '#6366F1',
    source: 'standalone',
    status: 'coming',
    videoMinutes: 3,
    videoUrl: null,
    videoScript: [
      'Giving feedback gets all the attention. Receiving it is harder — and it\'s the skill that determines whether you keep getting it.',
      'Three responses that kill the feedback loop: the immediate explanation ("what you don\'t understand is…"), the over-apology ("I\'m so terrible, I always do this"), and the disappearance (change nothing, say nothing).',
      'The only response that keeps the feedback coming: thank them, reflect it back to confirm you heard it, and name one thing you\'re going to do with it.',
      'The test isn\'t how gracefully you receive it — it\'s what happens in the next 30 days. Does anything change?',
      'Advanced level: create conditions where people tell you hard things without you having to ask. That requires a track record of receiving well.',
    ],
    framework: {
      name: 'Receive & Respond',
      summary: 'A four-move response to feedback that keeps it coming.',
      steps: [
        { label: 'Thank', prompt: 'Acknowledge that it took courage to share. Mean it.' },
        { label: 'Reflect', prompt: 'Paraphrase what you heard — not to defend, to confirm accuracy.' },
        { label: 'Ask one question', prompt: 'Is there something specific you\'d like to see me do differently?' },
        { label: 'Name the action', prompt: 'Tell them one concrete thing you\'re going to do with this. Then do it.' },
      ],
    },
    promptStarters: [
      'Thank you for telling me that — I want to make sure I heard it right…',
      'What I\'m taking from this is… Is that accurate?',
      'Here\'s one thing I\'m going to do with this in the next two weeks…',
    ],
  },
  {
    id: 'ls-habits',
    title: 'Build Leadership Habits',
    tagline: 'The leader you become is the result of what you do consistently.',
    icon: 'RefreshCw',
    accent: '#6366F1',
    source: 'standalone',
    status: 'coming',
    videoMinutes: 3,
    videoUrl: null,
    videoScript: [
      'Skills don\'t stick from learning — they stick from repetition in real conditions. Every leadership skill you\'ve developed here has to become a habit to matter.',
      'Habit design for leaders isn\'t about willpower — it\'s about removing friction and attaching new behaviors to existing triggers.',
      'The simplest possible system: anchor new leadership behaviors to events that already happen. 1:1 on Monday → that\'s when you practice your coaching question. End of week review → that\'s when you catch someone doing it right.',
      'One measure that predicts everything: how many reps did I get this week? Not how much did I learn. Reps.',
      'The hardest part: doing the behavior when you\'re busy, stressed, or running behind. That\'s exactly when it matters most, and when it\'s hardest to remember.',
    ],
    framework: {
      name: 'Habit Stack',
      summary: 'Attach the new behavior to an existing trigger.',
      steps: [
        { label: 'Choose the behavior', prompt: 'Which leadership skill do you want to make automatic? Be specific — one behavior.' },
        { label: 'Find the trigger', prompt: 'What existing event happens reliably before you\'d want to do this behavior?' },
        { label: 'Design the rep', prompt: 'Make the behavior as small and specific as possible — what exactly will you do in 60 seconds or less?' },
        { label: 'Track the streak', prompt: 'Mark it somewhere visible. Streaks create identity. Missing once is okay; never miss twice.' },
      ],
    },
    promptStarters: [
      'The behavior I\'m building is… and I\'m anchoring it to…',
      'My rep this week is small: every time X happens, I\'ll do Y.',
      'I missed it yesterday. Here\'s what I\'m doing today to not miss twice…',
    ],
  },
  {
    id: 'ls-resilience',
    title: 'Resilience & Recovery',
    tagline: 'Bounce back faster. Lead through setbacks.',
    icon: 'Shield',
    accent: '#6366F1',
    source: 'standalone',
    status: 'coming',
    videoMinutes: 4,
    videoUrl: null,
    videoScript: [
      'Resilience isn\'t bouncing back fast. It\'s recovering well — processing what happened, extracting the signal, and returning functional.',
      'The two failure modes: the leader who ruminated (stuck in the story for weeks) and the leader who bypassed (moved on without processing, bringing the unresolved weight into the next chapter).',
      'The recovery arc: name what happened without editorializing → feel the actual impact → extract the lesson → make one decision about what to do next → then let it go.',
      'What your team needs from you in a setback: a leader who is honest about what happened, doesn\'t catastrophize, has a plan, and is still present. That combination is rare.',
      'Self-compassion isn\'t softness — it\'s efficiency. Beating yourself up doesn\'t improve anything. It just delays your return to useful.',
    ],
    framework: {
      name: 'Recovery Arc',
      summary: 'Five moves that turn a setback into a next step.',
      steps: [
        { label: 'Name it', prompt: 'What actually happened — stripped of narrative? Just the facts.' },
        { label: 'Feel it', prompt: 'What is the real impact — on you, on the team, on the work? Don\'t minimize.' },
        { label: 'Extract', prompt: 'What one thing would you do differently if you had this moment back?' },
        { label: 'Decide', prompt: 'What is the one most useful action you can take in the next 24 hours?' },
        { label: 'Release', prompt: 'Set a time when it\'s done being the thing you\'re carrying. Not bypassed — done.' },
      ],
    },
    promptStarters: [
      'Here\'s what happened — without the story I\'ve been telling myself…',
      'The lesson I\'m extracting is… and the one action I\'m taking is…',
      'I\'m going to carry this until Friday and then let it go. Here\'s what I\'m doing with it before then.',
    ],
  },
  {
    id: 'ls-authenticity',
    title: 'Lead with Authenticity',
    tagline: 'Be the same person in the board room and the break room.',
    icon: 'Heart',
    accent: '#6366F1',
    source: 'standalone',
    status: 'coming',
    videoMinutes: 3,
    videoUrl: null,
    videoScript: [
      'Authenticity is the most misused word in leadership. It doesn\'t mean saying everything you think. It means your behavior is consistent with your values — especially when it\'s costly.',
      'Your team knows when you\'re performing. The energy it takes to maintain the performance is energy you\'re not spending on them.',
      'Three markers of authentic leadership: you\'re the same person behind closed doors as you are in the meeting. You admit uncertainty. You keep your commitments even when no one\'s watching.',
      'The test question: if a camera showed everything you did last week — every side conversation, every decision, every moment when no one was watching — would you be proud of it?',
      'Authenticity builds permission. When you\'re consistent, people can predict you. Predictability creates safety. Safety creates truth-telling. That\'s the whole system.',
    ],
    framework: {
      name: 'Consistency Check',
      summary: 'Audit the gap between values stated and values lived.',
      steps: [
        { label: 'Name your values', prompt: 'List three values you\'d say define how you lead.' },
        { label: 'Find the gap', prompt: 'For each value: where did you act inconsistently with it in the last two weeks?' },
        { label: 'Cost of the gap', prompt: 'What does your team notice or experience because of that inconsistency?' },
        { label: 'One commitment', prompt: 'Pick the most important gap. What\'s one concrete behavior you\'ll change this week?' },
      ],
    },
    promptStarters: [
      'One of my core values is… and here\'s where I\'m not living it…',
      'I said I believe in X. Here\'s where my actions haven\'t matched that in the last month…',
      'The version of me I want to be consistent with is…',
    ],
  },
];

// ─── Three Pillars ─────────────────────────────────────────────────────────

export const PILLARS = [
  {
    id: 'lead-work',
    title: 'Lead Work',
    tagline: 'The operational foundation. Built in Foundation, deepened here.',
    icon: 'Briefcase',
    accent: '#002E47',
    accentLight: '#002E4715',
    status: 'available',
    badge: 'Foundation Complete',
    badgeTone: 'emerald',
    description: 'You built these skills during Foundation. Lead Work is where you deepen them — setting direction, running accountability systems, communicating with precision, and making meetings worth attending.',
    skillSource: 'leadWork',      // resolved in components as LEAD_WORK_SKILLS
  },
  {
    id: 'lead-team',
    title: 'Lead Team',
    tagline: 'The 9 crucial conversations. One at a time.',
    icon: 'Users',
    accent: '#47A88D',
    accentLight: '#47A88D15',
    status: 'active',
    badge: 'Active',
    badgeTone: 'teal',
    description: 'Nine conversations that define how you lead. From the 1:1 that holds everything to the feedback that unlocks performance — each conversation is a skill you can build.',
    skillSource: 'leadTeam',      // resolved as CONVERSATIONS from conversationLibrary.js
  },
  {
    id: 'lead-self',
    title: 'Lead Self',
    tagline: 'The inner game. Know yourself so you can lead others.',
    icon: 'Heart',
    accent: '#6366F1',
    accentLight: '#6366F115',
    status: 'coming',
    badge: 'Q3 2026',
    badgeTone: 'indigo',
    description: 'Energy, identity, resilience, and presence. The work of leading yourself so the team has someone worth following.',
    skillSource: 'leadSelf',      // resolved as LEAD_SELF_SKILLS
  },
];

export const getPillarById = (id) => PILLARS.find((p) => p.id === id) || null;
export const getLeadWorkSkillById = (id) => LEAD_WORK_SKILLS.find((s) => s.id === id) || null;
export const getLeadSelfSkillById = (id) => LEAD_SELF_SKILLS.find((s) => s.id === id) || null;
