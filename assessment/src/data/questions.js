/**
 * Leadership DNA Assessment Questions
 * 
 * Designed to assess 6 core leadership dimensions:
 * 1. Vision & Strategy - Big picture thinking, long-term planning
 * 2. People & Empathy - Emotional intelligence, team development
 * 3. Execution & Drive - Getting things done, accountability
 * 4. Communication - Clarity, influence, storytelling
 * 5. Adaptability - Change management, resilience
 * 6. Innovation & Growth - Creative problem-solving, learning orientation
 */

export const LEADERSHIP_DIMENSIONS = {
  vision: {
    id: 'vision',
    name: 'Vision & Strategy',
    shortName: 'Visionary',
    icon: '🔭',
    color: '#8B5CF6', // Purple
    description: 'You see the big picture and inspire others with a compelling future. Strategic thinking is your superpower.',
    strengths: ['Long-term planning', 'Inspiring others', 'Strategic thinking', 'Goal setting'],
    growth: ['May overlook execution details', 'Can seem disconnected from day-to-day'],
  },
  people: {
    id: 'people',
    name: 'People & Empathy',
    shortName: 'Connector',
    icon: '💚',
    color: '#10B981', // Green
    description: 'You lead through relationships and genuine care. People trust you and feel valued on your team.',
    strengths: ['Building trust', 'Developing others', 'Conflict resolution', 'Team cohesion'],
    growth: ['May avoid difficult conversations', 'Can prioritize harmony over results'],
  },
  execution: {
    id: 'execution',
    name: 'Execution & Drive',
    shortName: 'Driver',
    icon: '🎯',
    color: '#EF4444', // Red
    description: 'You turn plans into results. Your teams ship on time and exceed expectations.',
    strengths: ['Accountability', 'Results-oriented', 'Decisiveness', 'Urgency'],
    growth: ['May push too hard', 'Can miss the human element'],
  },
  communication: {
    id: 'communication',
    name: 'Communication',
    shortName: 'Communicator',
    icon: '🎙️',
    color: '#F59E0B', // Amber
    description: 'You excel at getting ideas across clearly and persuasively. Your words move people to action.',
    strengths: ['Clarity', 'Influence', 'Active listening', 'Storytelling'],
    growth: ['May over-communicate', 'Can dominate conversations'],
  },
  adaptability: {
    id: 'adaptability',
    name: 'Adaptability',
    shortName: 'Navigator',
    icon: '🌊',
    color: '#06B6D4', // Cyan
    description: 'You thrive in change and help others navigate uncertainty. Resilience is your hallmark.',
    strengths: ['Change leadership', 'Resilience', 'Flexibility', 'Crisis management'],
    growth: ['May seem inconsistent', 'Can lack follow-through'],
  },
  innovation: {
    id: 'innovation',
    name: 'Innovation & Growth',
    shortName: 'Innovator',
    icon: '💡',
    color: '#EC4899', // Pink
    description: 'You challenge the status quo and find creative solutions. Learning and experimentation define your approach.',
    strengths: ['Creative thinking', 'Problem-solving', 'Continuous learning', 'Experimentation'],
    growth: ['May overlook proven solutions', 'Can create unnecessary change'],
  },
};

export const ASSESSMENT_QUESTIONS = [
  // SECTION 1: Leadership Scenarios (4 questions)
  {
    id: 'scenario_1',
    type: 'scenario',
    section: 1,
    question: "Your team just missed an important deadline. What's your first response?",
    options: [
      { id: 'a', text: "Analyze what went wrong and create a plan to prevent it next time", scores: { execution: 2, vision: 1 } },
      { id: 'b', text: "Check in with each team member to understand their challenges", scores: { people: 3 } },
      { id: 'c', text: "Communicate openly with stakeholders and reset expectations", scores: { communication: 3 } },
      { id: 'd', text: "Adapt the approach and find a faster path forward", scores: { adaptability: 2, innovation: 1 } },
    ],
  },
  {
    id: 'scenario_2',
    type: 'scenario',
    section: 1,
    question: "A new competitor is disrupting your industry. How do you respond?",
    options: [
      { id: 'a', text: "Develop a long-term strategic response to stay ahead", scores: { vision: 3 } },
      { id: 'b', text: "Rally the team around the challenge and boost morale", scores: { people: 2, communication: 1 } },
      { id: 'c', text: "Launch quick experiments to test new approaches", scores: { innovation: 3 } },
      { id: 'd', text: "Double down on execution to outperform them", scores: { execution: 2, adaptability: 1 } },
    ],
  },
  {
    id: 'scenario_3',
    type: 'scenario',
    section: 1,
    question: "You need to deliver difficult feedback to a high performer. What's your approach?",
    options: [
      { id: 'a', text: "Schedule a private conversation focused on their growth", scores: { people: 3 } },
      { id: 'b', text: "Be direct and clear about expectations and consequences", scores: { execution: 2, communication: 1 } },
      { id: 'c', text: "Frame it as an opportunity to evolve and try new approaches", scores: { innovation: 2, adaptability: 1 } },
      { id: 'd', text: "Connect the feedback to their career vision and goals", scores: { vision: 2, people: 1 } },
    ],
  },
  {
    id: 'scenario_4',
    type: 'scenario',
    section: 1,
    question: "Your company is going through a major reorganization. How do you lead your team?",
    options: [
      { id: 'a', text: "Help the team see how this fits the bigger picture", scores: { vision: 2, communication: 1 } },
      { id: 'b', text: "Focus on supporting each person through the transition", scores: { people: 3 } },
      { id: 'c', text: "Embrace the change and help the team adapt quickly", scores: { adaptability: 3 } },
      { id: 'd', text: "Keep the team focused on delivering despite the chaos", scores: { execution: 2, adaptability: 1 } },
    ],
  },

  // SECTION 2: Self-Assessment (6 questions - rate 1-5)
  {
    id: 'self_1',
    type: 'rating',
    section: 2,
    question: "I naturally think about where our team should be in 3-5 years.",
    dimension: 'vision',
  },
  {
    id: 'self_2',
    type: 'rating',
    section: 2,
    question: "I can sense when someone on my team is struggling, even if they don't say anything.",
    dimension: 'people',
  },
  {
    id: 'self_3',
    type: 'rating',
    section: 2,
    question: "I'm known for following through and getting things done on time.",
    dimension: 'execution',
  },
  {
    id: 'self_4',
    type: 'rating',
    section: 2,
    question: "People often come to me to help explain complex ideas simply.",
    dimension: 'communication',
  },
  {
    id: 'self_5',
    type: 'rating',
    section: 2,
    question: "I stay calm and effective when plans change unexpectedly.",
    dimension: 'adaptability',
  },
  {
    id: 'self_6',
    type: 'rating',
    section: 2,
    question: "I regularly challenge 'the way we've always done it' to find better approaches.",
    dimension: 'innovation',
  },

  // SECTION 3: Energy & Preference (2 questions)
  {
    id: 'energy_1',
    type: 'ranking',
    section: 3,
    question: "Which activities energize you most as a leader? (Rank your top 3)",
    options: [
      { id: 'vision', text: "Setting direction and painting a compelling future", emoji: "🔭" },
      { id: 'people', text: "Coaching and developing team members", emoji: "💚" },
      { id: 'execution', text: "Hitting targets and celebrating wins", emoji: "🎯" },
      { id: 'communication', text: "Presenting ideas and influencing stakeholders", emoji: "🎙️" },
      { id: 'adaptability', text: "Navigating change and solving crises", emoji: "🌊" },
      { id: 'innovation', text: "Experimenting and trying new approaches", emoji: "💡" },
    ],
  },
  {
    id: 'challenge_1',
    type: 'multi-select',
    section: 3,
    question: "What leadership challenges do you most want to improve? (Select up to 2)",
    maxSelect: 2,
    options: [
      { id: 'vision', text: "Thinking more strategically and long-term", emoji: "🔭" },
      { id: 'people', text: "Having difficult conversations with empathy", emoji: "💚" },
      { id: 'execution', text: "Holding myself and others accountable", emoji: "🎯" },
      { id: 'communication', text: "Communicating more clearly and persuasively", emoji: "🎙️" },
      { id: 'adaptability', text: "Staying resilient during uncertainty", emoji: "🌊" },
      { id: 'innovation', text: "Being more creative and open to new ideas", emoji: "💡" },
    ],
  },
];

export const LEADERSHIP_ARCHETYPES = {
  'visionary-innovator': {
    name: 'The Visionary Innovator',
    tagline: 'Future-focused pioneer who transforms industries',
    description: 'You combine big-picture thinking with creative problem-solving. You see opportunities others miss and have the courage to pursue unconventional paths.',
    famousLeaders: ['Elon Musk', 'Steve Jobs', 'Sara Blakely'],
    superpower: 'Turning bold ideas into reality',
  },
  'empathetic-communicator': {
    name: 'The Empathetic Communicator',
    tagline: 'Heart-centered leader who builds trust and alignment',
    description: 'You lead through genuine connection and clear communication. People feel heard, valued, and inspired to do their best work.',
    famousLeaders: ['Brené Brown', 'Satya Nadella', 'Oprah Winfrey'],
    superpower: 'Creating psychological safety',
  },
  'strategic-executor': {
    name: 'The Strategic Executor',
    tagline: 'Results-driven leader who makes things happen',
    description: 'You combine vision with relentless execution. You set ambitious goals and systematically achieve them.',
    famousLeaders: ['Jeff Bezos', 'Indra Nooyi', 'Tim Cook'],
    superpower: 'Turning strategy into results',
  },
  'adaptive-navigator': {
    name: 'The Adaptive Navigator',
    tagline: 'Resilient leader who thrives in uncertainty',
    description: 'You excel when others flounder. Change energizes you, and you help teams find their footing in turbulent times.',
    famousLeaders: ['Reed Hastings', 'Angela Merkel', 'Jacinda Ardern'],
    superpower: 'Leading through transformation',
  },
  'people-champion': {
    name: 'The People Champion',
    tagline: 'Developer of talent who builds extraordinary teams',
    description: 'You believe leadership is about growing others. Your teams are known for high engagement, low turnover, and exceptional performance.',
    famousLeaders: ['Mary Barra', 'Alan Mulally', 'Sheryl Sandberg'],
    superpower: 'Unlocking human potential',
  },
  'balanced-leader': {
    name: 'The Balanced Leader',
    tagline: 'Versatile leader who adapts to any situation',
    description: 'You have strong capabilities across multiple dimensions. You can shift your style to match what each situation requires.',
    famousLeaders: ['Sundar Pichai', 'Ginni Rometty', 'Satya Nadella'],
    superpower: 'Contextual leadership agility',
  },
};

// Calculate results from answers
export const calculateResults = (answers) => {
  const scores = {
    vision: 0,
    people: 0,
    execution: 0,
    communication: 0,
    adaptability: 0,
    innovation: 0,
  };

  // Process each answer
  for (const answer of answers) {
    const question = ASSESSMENT_QUESTIONS.find(q => q.id === answer.questionId);
    if (!question) continue;

    if (question.type === 'scenario') {
      const selected = question.options.find(o => o.id === answer.value);
      if (selected?.scores) {
        for (const [dim, score] of Object.entries(selected.scores)) {
          scores[dim] += score;
        }
      }
    } else if (question.type === 'rating') {
      scores[question.dimension] += answer.value; // 1-5 scale
    } else if (question.type === 'ranking') {
      // Top 3 ranking: 1st = 3 points, 2nd = 2 points, 3rd = 1 point
      answer.value.forEach((dimId, index) => {
        scores[dimId] += (3 - index);
      });
    } else if (question.type === 'multi-select') {
      // Challenges selected = areas for growth (inverse of strength)
      // We note these for the AI analysis but don't subtract
    }
  }

  // Normalize to percentages
  const maxPossible = 20; // Rough max per dimension
  const normalized = {};
  let total = 0;
  
  for (const [dim, score] of Object.entries(scores)) {
    normalized[dim] = Math.min(100, Math.round((score / maxPossible) * 100));
    total += normalized[dim];
  }

  // Find top 2 dimensions
  const sorted = Object.entries(normalized)
    .sort((a, b) => b[1] - a[1]);
  
  const [top1, top2] = sorted.slice(0, 2).map(([dim]) => dim);

  // Determine archetype
  let archetype;
  if (top1 === 'vision' && top2 === 'innovation') archetype = 'visionary-innovator';
  else if (top1 === 'people' && top2 === 'communication') archetype = 'empathetic-communicator';
  else if (top1 === 'vision' && top2 === 'execution') archetype = 'strategic-executor';
  else if (top1 === 'execution' && top2 === 'vision') archetype = 'strategic-executor';
  else if (top1 === 'adaptability') archetype = 'adaptive-navigator';
  else if (top1 === 'people') archetype = 'people-champion';
  else archetype = 'balanced-leader';

  return {
    scores: normalized,
    sortedDimensions: sorted,
    topDimensions: [top1, top2],
    archetype,
    archetypeData: LEADERSHIP_ARCHETYPES[archetype],
  };
};
