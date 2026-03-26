/**
 * Leadership Readiness Assessment Questions
 * 
 * Designed to assess 5 core leadership readiness dimensions:
 * 1. Self-Awareness - Understanding your strengths, weaknesses, and impact on others
 * 2. Emotional Intelligence - Managing emotions and building relationships
 * 3. Strategic Thinking - Seeing the big picture and making sound decisions
 * 4. Influence & Communication - Inspiring and motivating others effectively
 * 5. Resilience & Adaptability - Handling pressure and navigating change
 */

export const READINESS_DIMENSIONS = {
  selfAwareness: {
    id: 'selfAwareness',
    name: 'Self-Awareness',
    shortName: 'Aware',
    icon: '🪞',
    color: '#8B5CF6', // Purple
    description: 'You understand your strengths, weaknesses, values, and how your actions impact others. This foundation enables authentic leadership.',
    strengths: ['Knows personal triggers', 'Seeks honest feedback', 'Recognizes blind spots', 'Leads with authenticity'],
    growth: ['May be overly self-critical', 'Can become introspective'],
  },
  emotionalIntelligence: {
    id: 'emotionalIntelligence',
    name: 'Emotional Intelligence',
    shortName: 'EQ',
    icon: '💛',
    color: '#F59E0B', // Amber
    description: 'You read emotions well, manage your own reactions, and build strong relationships. People feel understood and valued around you.',
    strengths: ['Reads the room', 'Manages reactions', 'Builds rapport', 'Shows empathy'],
    growth: ['May absorb others\' stress', 'Can prioritize harmony over honesty'],
  },
  strategicThinking: {
    id: 'strategicThinking',
    name: 'Strategic Thinking',
    shortName: 'Strategic',
    icon: '🎯',
    color: '#06B6D4', // Cyan
    description: 'You see the big picture, anticipate challenges, and make decisions that align with long-term goals. You think several moves ahead.',
    strengths: ['Sees patterns and trends', 'Anticipates challenges', 'Makes sound decisions', 'Plans for the future'],
    growth: ['May overlook details', 'Can seem disconnected from day-to-day'],
  },
  influence: {
    id: 'influence',
    name: 'Influence & Communication',
    shortName: 'Influencer',
    icon: '📢',
    color: '#E04E1B', // Orange (LeaderReps brand)
    description: 'You inspire action without authority. Your communication is clear, compelling, and tailored to your audience. People want to follow you.',
    strengths: ['Communicates with clarity', 'Inspires action', 'Adapts message to audience', 'Builds buy-in'],
    growth: ['May rely too much on charisma', 'Can oversell ideas'],
  },
  resilience: {
    id: 'resilience',
    name: 'Resilience & Adaptability',
    shortName: 'Resilient',
    icon: '🔄',
    color: '#47A88D', // Teal (LeaderReps brand)
    description: 'You bounce back from setbacks, stay calm under pressure, and adapt quickly to change. Challenges fuel your growth rather than defeat you.',
    strengths: ['Stays calm in crisis', 'Learns from failure', 'Embraces change', 'Maintains optimism'],
    growth: ['May suppress emotions', 'Can seem detached from stress'],
  },
};

export const ASSESSMENT_QUESTIONS = [
  // SECTION 1: Leadership Scenarios (4 questions)
  {
    id: 'scenario_1',
    type: 'scenario',
    section: 1,
    question: "Your team is struggling with a major deadline. How do you respond?",
    options: [
      { id: 'a', text: "Check in with team members individually to understand what's really going on", scores: { emotionalIntelligence: 3 } },
      { id: 'b', text: "Take a step back to reassess priorities and identify what can be cut or delayed", scores: { strategicThinking: 3 } },
      { id: 'c', text: "Rally the team with a clear message about why this matters and how we'll win", scores: { influence: 3 } },
      { id: 'd', text: "Stay calm, acknowledge the stress, and model composure while finding solutions", scores: { resilience: 2, selfAwareness: 1 } },
    ],
  },
  {
    id: 'scenario_2',
    type: 'scenario',
    section: 1,
    question: "A colleague gives you critical feedback about your leadership style in front of others. What's your immediate reaction?",
    options: [
      { id: 'a', text: "Thank them and ask for specific examples so you can understand better", scores: { selfAwareness: 3 } },
      { id: 'b', text: "Acknowledge the feedback calmly and suggest continuing the conversation privately", scores: { emotionalIntelligence: 2, resilience: 1 } },
      { id: 'c', text: "Take a breath, process internally, and respond thoughtfully rather than defensively", scores: { resilience: 3 } },
      { id: 'd', text: "Use the moment to open up a broader team discussion about communication", scores: { influence: 2, strategicThinking: 1 } },
    ],
  },
  {
    id: 'scenario_3',
    type: 'scenario',
    section: 1,
    question: "You're asked to lead a project in an area where you have limited expertise. How do you approach it?",
    options: [
      { id: 'a', text: "Be honest about your knowledge gaps and quickly build relationships with experts", scores: { selfAwareness: 2, emotionalIntelligence: 1 } },
      { id: 'b', text: "Focus on the strategic direction and empower team members to own their areas", scores: { strategicThinking: 3 } },
      { id: 'c', text: "See it as an exciting challenge and dive into learning the domain quickly", scores: { resilience: 3 } },
      { id: 'd', text: "Leverage your communication skills to align stakeholders while you learn", scores: { influence: 3 } },
    ],
  },
  {
    id: 'scenario_4',
    type: 'scenario',
    section: 1,
    question: "A major company change is announced that your team is upset about. How do you lead through it?",
    options: [
      { id: 'a', text: "Create space for people to express concerns and really listen", scores: { emotionalIntelligence: 3 } },
      { id: 'b', text: "Help the team see the bigger picture and find opportunities in the change", scores: { strategicThinking: 2, influence: 1 } },
      { id: 'c', text: "Model adaptability and optimism while being honest about uncertainties", scores: { resilience: 3 } },
      { id: 'd', text: "Reflect on your own reaction first, then engage authentically with the team", scores: { selfAwareness: 3 } },
    ],
  },

  // SECTION 2: Self-Assessment (5 questions - rate 1-5)
  {
    id: 'self_1',
    type: 'rating',
    section: 2,
    question: "I regularly seek feedback about my leadership and am genuinely open to hearing things I don't want to hear.",
    dimension: 'selfAwareness',
  },
  {
    id: 'self_2',
    type: 'rating',
    section: 2,
    question: "I can sense when someone is struggling or upset, even when they haven't said anything.",
    dimension: 'emotionalIntelligence',
  },
  {
    id: 'self_3',
    type: 'rating',
    section: 2,
    question: "I naturally think about how today's decisions will impact things months or years from now.",
    dimension: 'strategicThinking',
  },
  {
    id: 'self_4',
    type: 'rating',
    section: 2,
    question: "I can get people excited about an idea and motivated to take action, even without formal authority.",
    dimension: 'influence',
  },
  {
    id: 'self_5',
    type: 'rating',
    section: 2,
    question: "When things don't go as planned, I recover quickly and find a new path forward.",
    dimension: 'resilience',
  },

  // SECTION 3: Additional Assessment (3 questions)
  {
    id: 'behavior_1',
    type: 'rating',
    section: 2,
    question: "I understand how my mood and behavior affect the people around me.",
    dimension: 'selfAwareness',
  },
  {
    id: 'behavior_2',
    type: 'rating',
    section: 2,
    question: "I stay calm and composed even in high-pressure situations.",
    dimension: 'resilience',
  },
  {
    id: 'behavior_3',
    type: 'rating',
    section: 2,
    question: "I can explain complex ideas in simple, compelling ways.",
    dimension: 'influence',
  },

  // SECTION 4: Energy & Preference (2 questions)
  {
    id: 'energy_1',
    type: 'ranking',
    section: 3,
    question: "Which leadership qualities come most naturally to you? (Rank your top 3)",
    options: [
      { id: 'selfAwareness', text: "Understanding myself and seeking growth", emoji: "🪞" },
      { id: 'emotionalIntelligence', text: "Reading people and building relationships", emoji: "💛" },
      { id: 'strategicThinking', text: "Seeing the big picture and planning ahead", emoji: "🎯" },
      { id: 'influence', text: "Inspiring others and communicating effectively", emoji: "📢" },
      { id: 'resilience', text: "Staying strong through challenges and change", emoji: "🔄" },
    ],
  },
  {
    id: 'challenge_1',
    type: 'multi-select',
    section: 3,
    question: "Which leadership areas do you most want to strengthen? (Select up to 2)",
    maxSelect: 2,
    options: [
      { id: 'selfAwareness', text: "Becoming more self-aware and authentic", emoji: "🪞" },
      { id: 'emotionalIntelligence', text: "Better understanding and connecting with others", emoji: "💛" },
      { id: 'strategicThinking', text: "Thinking more strategically about the future", emoji: "🎯" },
      { id: 'influence', text: "Becoming more influential and persuasive", emoji: "📢" },
      { id: 'resilience', text: "Building resilience and handling pressure better", emoji: "🔄" },
    ],
  },
];

export const READINESS_ARCHETYPES = {
  'self-aware-leader': {
    name: 'The Self-Aware Leader',
    tagline: 'Leads from a place of authenticity and self-knowledge',
    description: 'You lead by truly knowing yourself—your strengths, your triggers, and your impact on others. This self-awareness creates trust and enables genuine connection with your team.',
    famousLeaders: ['Satya Nadella', 'Brené Brown', 'Howard Schultz'],
    superpower: 'Authentic leadership that inspires trust',
    leaderRepsPath: 'LeaderReps will help you leverage your self-awareness to develop other leaders and create a culture of honest feedback and growth.',
    readinessLevel: 'high',
  },
  'empathetic-connector': {
    name: 'The Empathetic Connector',
    tagline: 'Builds bridges and brings out the best in people',
    description: 'Your emotional intelligence is your superpower. You sense what people need, build strong relationships, and create environments where everyone feels valued and heard.',
    famousLeaders: ['Oprah Winfrey', 'Jacinda Ardern', 'Simon Sinek'],
    superpower: 'Creating deep connections that drive engagement',
    leaderRepsPath: 'LeaderReps will help you channel your empathy into driving results while setting boundaries that prevent burnout.',
    readinessLevel: 'high',
  },
  'strategic-visionary': {
    name: 'The Strategic Visionary',
    tagline: 'Sees around corners and charts the course forward',
    description: 'You think in systems and timelines. While others focus on today\'s fires, you\'re mapping out how to win tomorrow. Your strategic mind helps teams navigate complexity.',
    famousLeaders: ['Jeff Bezos', 'Indra Nooyi', 'Reed Hastings'],
    superpower: 'Anticipating the future and positioning to win',
    leaderRepsPath: 'LeaderReps will help you translate your strategic vision into actionable plans that your team can execute with clarity.',
    readinessLevel: 'high',
  },
  'inspiring-influencer': {
    name: 'The Inspiring Influencer',
    tagline: 'Moves people to action through powerful communication',
    description: 'You have a gift for making people believe. Your communication is clear, compelling, and perfectly tailored. People don\'t just hear your ideas—they rally behind them.',
    famousLeaders: ['Barack Obama', 'Steve Jobs', 'Mary Barra'],
    superpower: 'Inspiring action and building momentum',
    leaderRepsPath: 'LeaderReps will help you ensure your influence drives sustainable results, not just short-term excitement.',
    readinessLevel: 'high',
  },
  'resilient-navigator': {
    name: 'The Resilient Navigator',
    tagline: 'Thrives in chaos and leads through uncertainty',
    description: 'You\'re the calm in the storm. When others panic, you steady the ship. Setbacks don\'t defeat you—they fuel your determination. Your resilience is contagious.',
    famousLeaders: ['Angela Merkel', 'Winston Churchill', 'Sheryl Sandberg'],
    superpower: 'Maintaining composure and finding paths forward',
    leaderRepsPath: 'LeaderReps will help you build this resilience in your team while ensuring you don\'t neglect your own wellbeing.',
    readinessLevel: 'high',
  },
  'balanced-ready': {
    name: 'The Balanced Leader',
    tagline: 'Well-rounded and ready for the next level',
    description: 'You demonstrate solid capability across multiple leadership dimensions. This balance makes you adaptable and effective in diverse situations—a strong foundation for growth.',
    famousLeaders: ['Satya Nadella', 'Tim Cook', 'Ursula Burns'],
    superpower: 'Versatility that adapts to any leadership challenge',
    leaderRepsPath: 'LeaderReps will help you identify which dimension to develop next for maximum impact on your leadership journey.',
    readinessLevel: 'high',
  },
  'emerging-leader': {
    name: 'The Emerging Leader',
    tagline: 'On the path with tremendous potential',
    description: 'You have the raw materials for great leadership. Some dimensions need strengthening, but your willingness to assess yourself honestly is itself a sign of leadership potential.',
    famousLeaders: ['Every great leader started somewhere'],
    superpower: 'Growth mindset and willingness to develop',
    leaderRepsPath: 'LeaderReps is designed exactly for leaders like you—our 8-week program systematically builds the leadership muscles you need.',
    readinessLevel: 'developing',
  },
};

// Calculate results from answers
export const calculateResults = (answers) => {
  const scores = {
    selfAwareness: 0,
    emotionalIntelligence: 0,
    strategicThinking: 0,
    influence: 0,
    resilience: 0,
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
  const maxPossible = 18; // Rough max per dimension
  const normalized = {};
  
  for (const [dim, score] of Object.entries(scores)) {
    normalized[dim] = Math.min(100, Math.round((score / maxPossible) * 100));
  }

  // Calculate overall readiness score (weighted average)
  const totalScore = Object.values(normalized).reduce((a, b) => a + b, 0);
  const overallScore = Math.round(totalScore / 5);

  // Find top 2 dimensions
  const sorted = Object.entries(normalized)
    .sort((a, b) => b[1] - a[1]);
  
  const [top1, top2] = sorted.slice(0, 2).map(([dim]) => dim);
  
  // Find bottom dimension (growth area)
  const bottom = sorted[sorted.length - 1][0];

  // Determine archetype based on top dimension
  let archetype;
  if (top1 === 'selfAwareness') archetype = 'self-aware-leader';
  else if (top1 === 'emotionalIntelligence') archetype = 'empathetic-connector';
  else if (top1 === 'strategicThinking') archetype = 'strategic-visionary';
  else if (top1 === 'influence') archetype = 'inspiring-influencer';
  else if (top1 === 'resilience') archetype = 'resilient-navigator';
  else archetype = 'balanced-ready';

  // Check for balanced leader (if scores are close)
  const scoreValues = Object.values(normalized);
  const maxScore = Math.max(...scoreValues);
  const minScore = Math.min(...scoreValues);
  if (maxScore - minScore < 15) {
    archetype = 'balanced-ready';
  }

  // Check for emerging leader (if overall score is lower)
  if (overallScore < 50) {
    archetype = 'emerging-leader';
  }

  // Determine readiness level
  let readinessLevel;
  let readinessDescription;
  if (overallScore >= 80) {
    readinessLevel = 'Highly Ready';
    readinessDescription = 'You have strong leadership foundations. Focus on mastering advanced skills and developing others.';
  } else if (overallScore >= 65) {
    readinessLevel = 'Ready';
    readinessDescription = 'You\'re prepared for leadership challenges. Targeted development in 1-2 areas will accelerate your impact.';
  } else if (overallScore >= 50) {
    readinessLevel = 'Developing';
    readinessDescription = 'You have solid potential with room to grow. A structured development program will transform your leadership.';
  } else {
    readinessLevel = 'Emerging';
    readinessDescription = 'Leadership is a significant growth opportunity. The great news: these skills are absolutely learnable.';
  }

  return {
    scores: normalized,
    sortedDimensions: sorted,
    topDimensions: [top1, top2],
    growthArea: bottom,
    archetype,
    overallScore,
    readinessLevel,
    readinessDescription,
  };
};

// Get growth recommendations based on results
export const getGrowthRecommendations = (results) => {
  const recommendations = [];
  const growthDimension = READINESS_DIMENSIONS[results.growthArea];
  const topDimension = READINESS_DIMENSIONS[results.topDimensions[0]];

  recommendations.push({
    type: 'strength',
    title: `Your Superpower: ${topDimension.name}`,
    description: topDimension.description,
    tips: topDimension.strengths.slice(0, 2),
  });

  recommendations.push({
    type: 'growth',
    title: `Growth Opportunity: ${growthDimension.name}`,
    description: `Developing your ${growthDimension.name.toLowerCase()} will make you a more complete leader.`,
    tips: [
      `Practice daily ${growthDimension.name.toLowerCase()} exercises`,
      'Seek feedback specifically on this area',
      'Find a mentor who excels here',
    ],
  });

  return recommendations;
};
