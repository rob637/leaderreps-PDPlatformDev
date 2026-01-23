/**
 * Reppy Infinite Curriculum System
 * 
 * Instead of a fixed 52-week program, Reppy uses a phase-based infinite curriculum.
 * Users progress through phases, then enter an endless "Daily Leadership" mode
 * with rotating, personalized content.
 * 
 * PHASES:
 * 1. Foundation (Sessions 1-20): Core leadership fundamentals
 * 2. Growth (Sessions 21-50): Advanced skills and application
 * 3. Mastery (Sessions 51-80): Leadership excellence and influence
 * 4. Daily Leadership (81+): Infinite rotating content tailored to user
 */

// Phase definitions
export const PHASES = {
  FOUNDATION: {
    id: 'foundation',
    name: 'Foundation',
    subtitle: 'Building Your Leadership Core',
    color: '#47A88D', // teal
    startSession: 1,
    endSession: 20,
    description: 'Establish the essential mindsets, habits, and skills every great leader needs.',
    icon: '🌱',
  },
  GROWTH: {
    id: 'growth',
    name: 'Growth',
    subtitle: 'Expanding Your Impact',
    color: '#3B82F6', // blue
    startSession: 21,
    endSession: 50,
    description: 'Develop advanced leadership capabilities and learn to multiply your influence.',
    icon: '🌿',
  },
  MASTERY: {
    id: 'mastery',
    name: 'Mastery',
    subtitle: 'Leading at the Highest Level',
    color: '#8B5CF6', // purple
    startSession: 51,
    endSession: 80,
    description: 'Refine your leadership to inspire, transform, and leave a lasting legacy.',
    icon: '🌳',
  },
  DAILY: {
    id: 'daily',
    name: 'Daily Leadership',
    subtitle: 'Your Ongoing Journey',
    color: '#F59E0B', // amber
    startSession: 81,
    endSession: Infinity,
    description: 'Continuous growth through personalized daily leadership practices.',
    icon: '☀️',
  },
};

// Get current phase based on session number
export const getPhase = (sessionNumber) => {
  if (sessionNumber <= 20) return PHASES.FOUNDATION;
  if (sessionNumber <= 50) return PHASES.GROWTH;
  if (sessionNumber <= 80) return PHASES.MASTERY;
  return PHASES.DAILY;
};

// Session format types
export const SESSION_TYPES = {
  QUOTE: 'quote',           // Inspirational quote with reflection
  MICRO_LESSON: 'lesson',   // Short teaching with practice
  BOOK_BITE: 'book',        // Book synopsis with key takeaways
  VIDEO_INSIGHT: 'video',   // Video recommendation with discussion
  SCENARIO: 'scenario',     // Leadership scenario for decision practice
  REFLECTION: 'reflection', // Deep personal reflection exercise
  CHALLENGE: 'challenge',   // Micro-challenge to complete today
  DISCUSSION: 'discussion', // Thought-provoking discussion topic
};

// Foundation Phase Content (Sessions 1-20)
export const foundationContent = [
  {
    session: 1,
    type: SESSION_TYPES.MICRO_LESSON,
    title: 'The Leader Within',
    theme: 'self-awareness',
    content: {
      opening: "Every leadership journey begins with a single truth: you already have what it takes.",
      lesson: "Leadership isn't a position—it's a decision. The most effective leaders didn't wait for permission. They chose to step up, to care more, to go first. Today, we plant the seed of that same decision in you.",
      insight: "Research shows that 85% of leadership success comes from self-awareness and emotional intelligence—skills anyone can develop with intention.",
      practice: "Think of a moment recently when you had an opportunity to lead—even in a small way—but held back. What stopped you? What would change if you simply... decided?",
      challenge: "Before your next interaction today, pause for 3 seconds and ask yourself: 'How would the leader I want to become handle this?'",
    },
  },
  {
    session: 2,
    type: SESSION_TYPES.QUOTE,
    title: 'Words to Lead By',
    theme: 'vision',
    content: {
      quote: "The very essence of leadership is that you have to have a vision. You can't blow an uncertain trumpet.",
      author: "Theodore Hesburgh",
      context: "Hesburgh led Notre Dame for 35 years, transforming it from a regional school into a world-class university. He did it by being crystal clear about where they were going.",
      reflection: "Leaders don't need to have all the answers. But they do need to provide direction. People can handle uncertainty in the 'how'—what they can't handle is uncertainty in the 'why' and 'where.'",
      practice: "If someone asked you right now, 'Where are we going and why does it matter?'—could you answer in one clear sentence?",
    },
  },
  {
    session: 3,
    type: SESSION_TYPES.BOOK_BITE,
    title: 'Atomic Habits',
    theme: 'habits',
    content: {
      book: {
        title: 'Atomic Habits',
        author: 'James Clear',
        year: 2018,
      },
      synopsis: "The quality of your life depends on the quality of your habits. Clear argues that tiny changes, compounded over time, create remarkable results. The key? Focus on systems, not goals.",
      keyInsight: "You do not rise to the level of your goals. You fall to the level of your systems.",
      leadershipConnection: "Great leaders don't rely on willpower or motivation—they design systems that make good leadership automatic. Every consistent leader has rituals they protect.",
      takeaway: "Instead of asking 'What do I want to achieve as a leader?', ask 'What kind of leader do I want to become?' Then build one small habit that proves it.",
      practice: "Identify one leadership habit you want to embody. Make it so small it's impossible to fail. (Example: 'I will give one person genuine recognition every day.')",
    },
  },
  {
    session: 4,
    type: SESSION_TYPES.SCENARIO,
    title: 'The Pushback',
    theme: 'influence',
    content: {
      setup: "You've proposed a new approach to your team. It would improve efficiency, but requires everyone to change how they work. Your most experienced team member pushes back: 'We've always done it this way. Why fix what isn't broken?'",
      context: "Resistance to change is natural. How you respond in this moment will either build trust or create defensiveness.",
      options: [
        {
          choice: "Assert your authority: 'I've made the decision. Let's move forward.'",
          analysis: "Gets compliance, but not commitment. The experienced team member may comply publicly while undermining privately.",
        },
        {
          choice: "Ask questions first: 'Help me understand—what's working well in the current approach?'",
          analysis: "Shows respect for their experience. Creates space to learn something you might have missed, and makes them feel heard.",
        },
        {
          choice: "Explain your reasoning in detail, walking through all the data.",
          analysis: "Information rarely changes minds. People need to feel understood before they'll be open to understanding you.",
        },
      ],
      principle: "Seek first to understand, then to be understood. The best leaders make people feel heard even when they don't change the decision.",
      practice: "Think of someone who resists your ideas regularly. What might they be protecting or afraid of losing?",
    },
  },
  {
    session: 5,
    type: SESSION_TYPES.REFLECTION,
    title: 'Your Leadership Origin Story',
    theme: 'identity',
    content: {
      opening: "Every leader has a story—moments that shaped who they are and why they lead the way they do.",
      prompt: "Think back to the earliest moment you can remember when someone led you well—a teacher, coach, parent, manager, or mentor. What did they do? How did it make you feel?",
      deeperPrompt: "Now think of a time when you were led poorly. What was missing? What did you need that you didn't get?",
      insight: "Your leadership style is often a response to these experiences. We either emulate the leaders who inspired us, or we compensate for the ones who let us down.",
      integration: "The leaders who left the greatest impact on you—what one quality did they share that you want to carry forward?",
    },
  },
  {
    session: 6,
    type: SESSION_TYPES.VIDEO_INSIGHT,
    title: 'Start With Why',
    theme: 'purpose',
    content: {
      video: {
        title: 'How Great Leaders Inspire Action',
        speaker: 'Simon Sinek',
        platform: 'TED',
        duration: '18 minutes',
        url: 'https://www.ted.com/talks/simon_sinek_how_great_leaders_inspire_action',
      },
      preview: "Sinek reveals a simple but powerful pattern: every inspiring leader and organization communicates from the inside out—starting with WHY they do what they do, not what they do.",
      keyMoment: "People don't buy what you do; they buy why you do it. The goal is not to do business with everybody who needs what you have. The goal is to do business with people who believe what you believe.",
      leadershipApplication: "Most leaders communicate what they want people to do. Exceptional leaders start with why it matters—connecting to values and purpose first.",
      practice: "Think about something you need your team to do. Before explaining WHAT, can you articulate WHY it matters in a way that connects to their values?",
    },
  },
  {
    session: 7,
    type: SESSION_TYPES.CHALLENGE,
    title: 'The Listening Challenge',
    theme: 'communication',
    content: {
      challenge: "In your next three conversations today, practice 'listening to understand' instead of 'listening to respond.'",
      rules: [
        "Don't interrupt, even if you have a great idea",
        "Ask at least one follow-up question before sharing your view",
        "Summarize what they said before adding your perspective",
        "Notice when your mind starts preparing your response—and bring attention back to them",
      ],
      why: "Studies show that leaders who listen well are rated 40% higher in overall effectiveness. Yet most of us listen at only 25% efficiency—we're too busy thinking about what we'll say next.",
      reflection: "At the end of the day, note: What did you learn that you would have missed? How did people respond to being truly heard?",
    },
  },
  {
    session: 8,
    type: SESSION_TYPES.MICRO_LESSON,
    title: 'Emotional Contagion',
    theme: 'emotional-intelligence',
    content: {
      opening: "Your mood is contagious. Whether you realize it or not, you're constantly broadcasting emotional signals that others pick up and mirror.",
      lesson: "Neuroscience has confirmed what great leaders have always known: emotions spread through teams like ripples in a pond. As a leader, you're the biggest stone being dropped.",
      insight: "Research by Daniel Goleman shows that up to 70% of how employees perceive workplace climate is attributable to the leader's emotional state and behavior.",
      realTalk: "This doesn't mean you have to be fake-positive. Authenticity matters more than cheerfulness. But it does mean you need to be intentional about what you're broadcasting.",
      practice: "Before your next meeting or interaction, do a 10-second 'state check': How am I feeling right now? Is this the energy I want to bring into this room?",
      challenge: "Notice the emotional climate of your team today. Is it what you want? What might you be contributing to it?",
    },
  },
  {
    session: 9,
    type: SESSION_TYPES.DISCUSSION,
    title: 'The Vulnerability Question',
    theme: 'trust',
    content: {
      opening: "Here's a belief many leaders hold: 'If I show vulnerability, people will lose confidence in me.'",
      question: "Is this true? When has a leader's vulnerability made you trust them MORE rather than less?",
      perspective1: "Some argue that leaders must project strength and certainty. Teams need someone to believe in, especially in difficult times.",
      perspective2: "Others point to Brené Brown's research showing that vulnerability is the birthplace of trust. 'You cannot get to courage without rumbling with vulnerability.'",
      synthesis: "Perhaps the answer is in the type of vulnerability. Sharing that you're unsure about the future is different from sharing that you don't have values.",
      yourTake: "Think of a leader you deeply respected. Did they ever show vulnerability? What kind? How did it affect your trust in them?",
      practice: "Is there something you've been hiding from your team that, if shared appropriately, might actually build more trust?",
    },
  },
  {
    session: 10,
    type: SESSION_TYPES.QUOTE,
    title: 'The Courage to Serve',
    theme: 'servant-leadership',
    content: {
      quote: "The first responsibility of a leader is to define reality. The last is to say thank you. In between, the leader is a servant.",
      author: "Max De Pree",
      context: "De Pree was CEO of Herman Miller, consistently rated one of the best-managed companies in America. He pioneered the concept of servant leadership in corporate settings.",
      reflection: "This quote flips the traditional power dynamic. Leaders don't exist to be served—they exist to serve. Their job is to remove obstacles, provide resources, and help others succeed.",
      deeperQuestion: "What if your primary job as a leader isn't to direct, but to clear the path for others to do their best work?",
      practice: "Ask one person on your team today: 'What's one obstacle I could help remove for you?' Then actually do something about it.",
    },
  },
];

// Growth Phase Content (Sessions 21-50) - Sample entries
export const growthContent = [
  {
    session: 21,
    type: SESSION_TYPES.MICRO_LESSON,
    title: 'The Delegation Spectrum',
    theme: 'delegation',
    content: {
      opening: "Most leaders think delegation is binary: do it yourself or hand it off completely. But there's actually a spectrum—and mastering it changes everything.",
      lesson: "The delegation spectrum runs from 'Tell' (just do exactly this) to 'Trust' (own this completely, I trust your judgment). In between are levels like 'Sell' (here's why), 'Consult' (get input, I decide), 'Participate' (let's decide together), and 'Empower' (you decide, keep me informed).",
      insight: "Problems occur when there's a mismatch. You think you're empowering; they think you're abandoning. You think you're consulting; they think you're controlling.",
      practice: "Think of something you recently delegated. What level did you intend? What level did the other person perceive?",
      challenge: "For your next delegation, explicitly name the level: 'I want your input, but I'll make the final call' (Consult) vs. 'This is yours to own—keep me updated' (Empower).",
    },
  },
  {
    session: 25,
    type: SESSION_TYPES.BOOK_BITE,
    title: 'Radical Candor',
    theme: 'feedback',
    content: {
      book: {
        title: 'Radical Candor',
        author: 'Kim Scott',
        year: 2017,
      },
      synopsis: "Scott, a former Google and Apple executive, argues that the best leaders combine two things: they care personally AND challenge directly. Missing either one leads to dysfunction.",
      keyInsight: "Ruinous Empathy (caring but not challenging) is actually more dangerous than Obnoxious Aggression. When you're too nice to tell someone the truth, you're not being kind—you're being cowardly.",
      leadershipConnection: "Your job is to be clear, not nice. Kindness doesn't mean avoiding hard truths. It means delivering them in a way that helps people grow.",
      takeaway: "The key question before any feedback: 'Will saying this help them, or am I just trying to feel better about myself?'",
      practice: "Is there feedback you've been avoiding giving because you don't want to hurt someone's feelings? What would Radical Candor sound like?",
    },
  },
  {
    session: 30,
    type: SESSION_TYPES.SCENARIO,
    title: 'The High Performer Problem',
    theme: 'difficult-conversations',
    content: {
      setup: "Your top performer delivers exceptional results—they're responsible for 30% of the team's output. But they're also toxic: condescending to peers, dismissive in meetings, and creating an environment where others are afraid to speak up. Two good people have already left, citing them as the reason.",
      context: "This is one of the hardest leadership challenges: the 'brilliant jerk.' Their results make them feel untouchable. Addressing it risks losing them. Not addressing it risks losing everyone else.",
      options: [
        {
          choice: "Focus on their results and hope the team adjusts.",
          analysis: "Short-term gain, long-term disaster. You're signaling that behavior doesn't matter if you perform. Others will leave or disengage.",
        },
        {
          choice: "Have a direct conversation with clear expectations and consequences.",
          analysis: "The right move. They may not realize their impact. Give them a genuine chance to change, with specific behaviors and timelines.",
        },
        {
          choice: "Let them go immediately to protect the team culture.",
          analysis: "Sometimes necessary, but usually premature. Fairness requires giving them a chance to change. Also, others are watching how you treat people.",
        },
      ],
      principle: "Culture > Results. A toxic high performer destroys more value than they create—you just can't see it on a spreadsheet.",
      practice: "Do you have a 'brilliant jerk' on your team? What's the real cost of their behavior that isn't showing up in metrics?",
    },
  },
];

// Mastery Phase Content (Sessions 51-80) - Sample entries
export const masteryContent = [
  {
    session: 51,
    type: SESSION_TYPES.REFLECTION,
    title: 'Your Leadership Legacy',
    theme: 'legacy',
    content: {
      opening: "You've been building skills. Now let's talk about meaning. What will remain after you're gone?",
      prompt: "Fast forward 20 years. Someone you led—maybe someone you haven't even met yet—is telling their team about you. What do you want them to say?",
      deeperPrompt: "Now think about the leaders who shaped you. What did they give you that you still carry? That's their legacy living through you.",
      insight: "Legacy isn't built in a final chapter. It's built in every interaction, every decision, every moment when you choose who you want to be.",
      integration: "What's one thing you could do this week that your future self would be proud of? Something that would be worth telling a story about?",
    },
  },
  {
    session: 60,
    type: SESSION_TYPES.MICRO_LESSON,
    title: 'Leading Leaders',
    theme: 'leadership-multiplication',
    content: {
      opening: "The ultimate leadership skill isn't leading followers—it's developing other leaders. Your ceiling becomes the organization's ceiling.",
      lesson: "Leadership multiplication works in stages: First, you add value by doing. Then you multiply by developing doers. Finally, you compound by developing developers—leaders who develop other leaders.",
      insight: "John Maxwell calls this the 'Leadership Lid.' An organization cannot rise above its leadership. The only way to remove the lid is to develop more leaders.",
      practice: "Who on your team has leadership potential? What would it take to move from just managing them to actively developing them?",
      challenge: "This week, have a conversation with someone about their leadership development. Not their task performance—their leadership journey.",
    },
  },
];

// Daily Leadership Content (Session 81+) - Rotating themes
export const dailyThemes = [
  'presence', 'courage', 'empathy', 'clarity', 'resilience',
  'accountability', 'influence', 'listening', 'trust', 'growth',
  'vision', 'service', 'authenticity', 'feedback', 'delegation',
  'decision-making', 'conflict', 'culture', 'communication', 'change',
  'innovation', 'priorities', 'boundaries', 'gratitude', 'humility',
];

// Get content for a session
export const getSessionContent = (sessionNumber, profile = {}) => {
  // Foundation (1-20)
  if (sessionNumber <= 20) {
    return foundationContent.find(c => c.session === sessionNumber) || generateDynamicContent(sessionNumber, 'foundation', profile);
  }
  
  // Growth (21-50)
  if (sessionNumber <= 50) {
    return growthContent.find(c => c.session === sessionNumber) || generateDynamicContent(sessionNumber, 'growth', profile);
  }
  
  // Mastery (51-80)
  if (sessionNumber <= 80) {
    return masteryContent.find(c => c.session === sessionNumber) || generateDynamicContent(sessionNumber, 'mastery', profile);
  }
  
  // Daily Leadership (81+)
  return generateDailyContent(sessionNumber, profile);
};

// Generate dynamic content based on session and profile
const generateDynamicContent = (sessionNumber, phase, profile) => {
  const types = Object.values(SESSION_TYPES);
  const type = types[sessionNumber % types.length];
  
  return {
    session: sessionNumber,
    type,
    title: `Session ${sessionNumber}`,
    theme: dailyThemes[(sessionNumber - 1) % dailyThemes.length],
    dynamic: true, // Flag for AI to generate
    phase,
    profile,
  };
};

// Generate daily leadership content (session 81+)
const generateDailyContent = (sessionNumber, profile) => {
  const dayInCycle = (sessionNumber - 81) % 30; // 30-day rotation
  const types = Object.values(SESSION_TYPES);
  const type = types[dayInCycle % types.length];
  const theme = dailyThemes[dayInCycle % dailyThemes.length];
  
  return {
    session: sessionNumber,
    type,
    title: `Daily Leadership`,
    theme,
    dynamic: true,
    phase: 'daily',
    profile,
    cycleDay: dayInCycle + 1,
  };
};

export default {
  PHASES,
  SESSION_TYPES,
  getPhase,
  getSessionContent,
  foundationContent,
  growthContent,
  masteryContent,
  dailyThemes,
};
