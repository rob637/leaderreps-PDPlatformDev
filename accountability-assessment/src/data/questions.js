/**
 * Accountability Assessment Questions
 * 
 * Designed to assess 5 core accountability dimensions:
 * 1. Ownership Mindset - Taking full responsibility for outcomes
 * 2. Commitment Reliability - Following through on promises and deadlines
 * 3. Transparent Communication - Honest, proactive updates on progress/challenges
 * 4. Standards & Expectations - Setting and maintaining high performance standards
 * 5. Feedback & Growth - Giving/receiving feedback, continuous improvement
 */

export const ACCOUNTABILITY_DIMENSIONS = {
  ownership: {
    id: 'ownership',
    name: 'Ownership Mindset',
    shortName: 'Owner',
    icon: '🎯',
    color: '#E04E1B', // Orange (LeaderReps brand)
    description: 'You take full responsibility for outcomes—successes AND failures. You never pass blame or make excuses.',
    strengths: ['Takes initiative', 'Accepts responsibility', 'Solves problems proactively', 'Leads by example'],
    growth: ['May take on too much', 'Can be hard on yourself'],
  },
  reliability: {
    id: 'reliability',
    name: 'Commitment Reliability',
    shortName: 'Reliable',
    icon: '✅',
    color: '#47A88D', // Teal (LeaderReps brand)
    description: 'When you commit, you deliver. People know they can count on you to do what you say.',
    strengths: ['Meets deadlines', 'Keeps promises', 'Consistent follow-through', 'Builds trust'],
    growth: ['May over-commit', 'Can struggle to say no'],
  },
  transparency: {
    id: 'transparency',
    name: 'Transparent Communication',
    shortName: 'Open',
    icon: '🔍',
    color: '#06B6D4', // Cyan
    description: 'You proactively share progress, challenges, and mistakes. No surprises, no hidden agendas.',
    strengths: ['Proactive updates', 'Honest about challenges', 'Builds psychological safety', 'Earns trust through openness'],
    growth: ['May overshare', 'Can create unnecessary worry'],
  },
  standards: {
    id: 'standards',
    name: 'Standards & Expectations',
    shortName: 'Standard-Setter',
    icon: '📏',
    color: '#8B5CF6', // Purple
    description: 'You set clear, high expectations—for yourself and others. Mediocrity is not acceptable.',
    strengths: ['Clear expectations', 'High performance standards', 'Quality-focused', 'Drives excellence'],
    growth: ['May seem demanding', 'Can be perceived as perfectionist'],
  },
  feedback: {
    id: 'feedback',
    name: 'Feedback & Growth',
    shortName: 'Coach',
    icon: '💪',
    color: '#10B981', // Green
    description: 'You give direct feedback and welcome it in return. You see accountability as a growth tool, not punishment.',
    strengths: ['Gives constructive feedback', 'Receives feedback well', 'Develops others', 'Continuous improvement'],
    growth: ['Feedback delivery can sting', 'May push too hard for growth'],
  },
};

export const ASSESSMENT_QUESTIONS = [
  // SECTION 1: Leadership Scenarios (4 questions)
  {
    id: 'scenario_1',
    type: 'scenario',
    section: 1,
    question: "A project you led missed its deadline due to multiple factors including your delayed decision-making. How do you respond?",
    options: [
      { id: 'a', text: "Acknowledge your role first, then work with the team to fix it", scores: { ownership: 3 } },
      { id: 'b', text: "Immediately notify stakeholders and reset expectations transparently", scores: { transparency: 3 } },
      { id: 'c', text: "Analyze what happened and establish clearer checkpoints going forward", scores: { standards: 2, reliability: 1 } },
      { id: 'd', text: "Have honest conversations with team members about what could improve", scores: { feedback: 2, transparency: 1 } },
    ],
  },
  {
    id: 'scenario_2',
    type: 'scenario',
    section: 2,
    question: "A team member consistently delivers work that's 'good enough' but not up to the standards you've set. What do you do?",
    options: [
      { id: 'a', text: "Have a direct conversation about the gap between current and expected performance", scores: { feedback: 3 } },
      { id: 'b', text: "Review whether the standards were clear and communicated properly", scores: { standards: 2, ownership: 1 } },
      { id: 'c', text: "Document specific examples and create an improvement plan with deadlines", scores: { reliability: 2, standards: 1 } },
      { id: 'd', text: "Share openly how this impacts the team and ask what support they need", scores: { transparency: 2, feedback: 1 } },
    ],
  },
  {
    id: 'scenario_3',
    type: 'scenario',
    section: 1,
    question: "You realize you can't deliver on a commitment you made two weeks ago. What's your first move?",
    options: [
      { id: 'a', text: "Immediately communicate the delay and propose a new realistic timeline", scores: { transparency: 3 } },
      { id: 'b', text: "Take ownership of the miss and ask for help to get back on track", scores: { ownership: 2, feedback: 1 } },
      { id: 'c', text: "Reassess your commitments and build in buffers going forward", scores: { reliability: 3 } },
      { id: 'd', text: "Reflect on what caused the slip and create systems to prevent it", scores: { standards: 2, ownership: 1 } },
    ],
  },
  {
    id: 'scenario_4',
    type: 'scenario',
    section: 1,
    question: "Your team knows about a problem but no one wants to bring it up with leadership. How do you handle it?",
    options: [
      { id: 'a', text: "Create a safe space for honest conversation about the issue", scores: { transparency: 2, feedback: 1 } },
      { id: 'b', text: "Model vulnerability by sharing your own observations and concerns first", scores: { ownership: 3 } },
      { id: 'c', text: "Establish an expectation that problems are raised early, not hidden", scores: { standards: 3 } },
      { id: 'd', text: "Follow up individually to understand the root cause of the silence", scores: { feedback: 2, transparency: 1 } },
    ],
  },

  // SECTION 2: Self-Assessment (5 questions - rate 1-5)
  {
    id: 'self_1',
    type: 'rating',
    section: 2,
    question: "When something goes wrong on my watch, I immediately own it—even when others contributed to the problem.",
    dimension: 'ownership',
  },
  {
    id: 'self_2',
    type: 'rating',
    section: 2,
    question: "People know they can count on me to do exactly what I said I would do.",
    dimension: 'reliability',
  },
  {
    id: 'self_3',
    type: 'rating',
    section: 2,
    question: "I proactively share bad news and challenges rather than waiting to be asked.",
    dimension: 'transparency',
  },
  {
    id: 'self_4',
    type: 'rating',
    section: 2,
    question: "I set clear expectations and don't accept 'good enough' when excellence is achievable.",
    dimension: 'standards',
  },
  {
    id: 'self_5',
    type: 'rating',
    section: 2,
    question: "I give direct, honest feedback even when it's uncomfortable—and I actively seek feedback on myself.",
    dimension: 'feedback',
  },

  // SECTION 3: Additional Assessment (3 questions)
  {
    id: 'behavior_1',
    type: 'rating',
    section: 2,
    question: "When I commit to a deadline, I treat it as a promise—not a rough estimate.",
    dimension: 'reliability',
  },
  {
    id: 'behavior_2',
    type: 'rating',
    section: 2,
    question: "I never blame others, circumstances, or 'the system' for outcomes I could have influenced.",
    dimension: 'ownership',
  },
  {
    id: 'behavior_3',
    type: 'rating',
    section: 2,
    question: "I address accountability gaps quickly rather than hoping they'll resolve themselves.",
    dimension: 'feedback',
  },

  // SECTION 4: Energy & Preference (2 questions)
  {
    id: 'energy_1',
    type: 'ranking',
    section: 3,
    question: "Which accountability behaviors come most naturally to you? (Rank your top 3)",
    options: [
      { id: 'ownership', text: "Taking full ownership of outcomes, win or lose", emoji: "🎯" },
      { id: 'reliability', text: "Following through on every commitment I make", emoji: "✅" },
      { id: 'transparency', text: "Being upfront about progress, challenges, and mistakes", emoji: "🔍" },
      { id: 'standards', text: "Setting and maintaining high performance standards", emoji: "📏" },
      { id: 'feedback', text: "Giving and receiving direct, honest feedback", emoji: "💪" },
    ],
  },
  {
    id: 'challenge_1',
    type: 'multi-select',
    section: 3,
    question: "Which accountability areas do you most want to strengthen? (Select up to 2)",
    maxSelect: 2,
    options: [
      { id: 'ownership', text: "Stop making excuses and own my results completely", emoji: "🎯" },
      { id: 'reliability', text: "Become someone people can always count on", emoji: "✅" },
      { id: 'transparency', text: "Be more proactive about sharing challenges and progress", emoji: "🔍" },
      { id: 'standards', text: "Set clearer expectations and hold people to them", emoji: "📏" },
      { id: 'feedback', text: "Get better at giving and receiving difficult feedback", emoji: "💪" },
    ],
  },
];

export const ACCOUNTABILITY_ARCHETYPES = {
  'ownership-champion': {
    name: 'The Ownership Champion',
    tagline: 'Takes full responsibility, no excuses, no blame',
    description: 'You embody the principle that leaders own outcomes—period. When things go wrong, you look in the mirror first. When things go right, you credit others. This mindset inspires trust and respect from everyone around you.',
    famousLeaders: ['Jocko Willink', 'Angela Duckworth', 'Admiral William McRaven'],
    superpower: 'Extreme ownership that transforms team culture',
    leaderRepsPath: 'Building on your ownership strength, LeaderReps will help you cascade this mindset through your team while avoiding the trap of taking on too much.',
  },
  'reliable-executor': {
    name: 'The Reliable Executor',
    tagline: 'When you commit, consider it done',
    description: 'Your word is your bond. People know that when you say you\'ll do something, it\'s as good as done. This reliability creates a ripple effect—your consistency raises the bar for everyone.',
    famousLeaders: ['Sheryl Sandberg', 'Tim Cook', 'Warren Buffett'],
    superpower: 'Building trust through consistent follow-through',
    leaderRepsPath: 'LeaderReps will help you teach your team to be equally reliable while ensuring you don\'t over-commit in your dedication to delivery.',
  },
  'transparent-communicator': {
    name: 'The Transparent Leader',
    tagline: 'No surprises, no hidden agendas, just truth',
    description: 'You believe that problems hidden are problems multiplied. Your proactive communication about challenges, progress, and even mistakes creates psychological safety and prevents expensive surprises.',
    famousLeaders: ['Ray Dalio', 'Brené Brown', 'Kim Scott'],
    superpower: 'Creating trust through radical honesty',
    leaderRepsPath: 'LeaderReps will help you foster this same transparency in your team culture while teaching you to deliver hard truths with empathy.',
  },
  'standards-setter': {
    name: 'The Standards Setter',
    tagline: 'Excellence is the only acceptable outcome',
    description: 'You don\'t accept mediocrity—from yourself or others. Your clear expectations and high standards drive performance that others thought impossible. You prove that what gets measured gets managed.',
    famousLeaders: ['Steve Jobs', 'Indra Nooyi', 'Bill Belichick'],
    superpower: 'Elevating performance through clear, high expectations',
    leaderRepsPath: 'LeaderReps will help you set standards that inspire rather than intimidate, and build systems that make excellence sustainable.',
  },
  'accountability-coach': {
    name: 'The Accountability Coach',
    tagline: 'Develops others through direct feedback and growth',
    description: 'You see accountability as a gift, not a punishment. Your willingness to have difficult conversations—and receive tough feedback yourself—accelerates growth for everyone. You build accountable people, not just accountable processes.',
    famousLeaders: ['Bill Campbell', 'Pat Summitt', 'Marshall Goldsmith'],
    superpower: 'Developing accountable leaders through coaching',
    leaderRepsPath: 'LeaderReps will enhance your coaching skills with frameworks for accountability conversations that drive results without damaging relationships.',
  },
  'balanced-accountable': {
    name: 'The Balanced Accountable Leader',
    tagline: 'Strong across all accountability dimensions',
    description: 'You demonstrate strong capability across the accountability spectrum—from ownership to follow-through to feedback. This balance makes you effective in any situation and a model for others to emulate.',
    famousLeaders: ['Satya Nadella', 'Mary Barra', 'Alan Mulally'],
    superpower: 'Comprehensive accountability that adapts to context',
    leaderRepsPath: 'LeaderReps will help you systematically develop each dimension while teaching you to identify and close accountability gaps in your team.',
  },
};

// Calculate results from answers
export const calculateResults = (answers) => {
  const scores = {
    ownership: 0,
    reliability: 0,
    transparency: 0,
    standards: 0,
    feedback: 0,
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
  const maxPossible = 18; // Rough max per dimension (adjusted for 5 dimensions)
  const normalized = {};
  
  for (const [dim, score] of Object.entries(scores)) {
    normalized[dim] = Math.min(100, Math.round((score / maxPossible) * 100));
  }

  // Calculate overall accountability score (weighted average)
  const totalScore = Object.values(normalized).reduce((a, b) => a + b, 0);
  const overallScore = Math.round(totalScore / 5);

  // Find top 2 dimensions
  const sorted = Object.entries(normalized)
    .sort((a, b) => b[1] - a[1]);
  
  const [top1, top2] = sorted.slice(0, 2).map(([dim]) => dim);
  
  // Find bottom dimension (growth area)
  const bottom = sorted[sorted.length - 1][0];

  // Determine archetype based on top dimensions
  let archetype;
  if (top1 === 'ownership') archetype = 'ownership-champion';
  else if (top1 === 'reliability') archetype = 'reliable-executor';
  else if (top1 === 'transparency') archetype = 'transparent-communicator';
  else if (top1 === 'standards') archetype = 'standards-setter';
  else if (top1 === 'feedback') archetype = 'accountability-coach';
  else archetype = 'balanced-accountable';

  // Check for balanced leader (if scores are close)
  const scoreValues = Object.values(normalized);
  const maxScore = Math.max(...scoreValues);
  const minScore = Math.min(...scoreValues);
  if (maxScore - minScore < 15) {
    archetype = 'balanced-accountable';
  }

  // Determine accountability maturity level
  let maturityLevel;
  let maturityDescription;
  if (overallScore >= 80) {
    maturityLevel = 'Exemplary';
    maturityDescription = 'You model exceptional accountability. Focus on cascading this to your team.';
  } else if (overallScore >= 65) {
    maturityLevel = 'Strong';
    maturityDescription = 'Your accountability is above average. A few targeted improvements will make you exceptional.';
  } else if (overallScore >= 50) {
    maturityLevel = 'Developing';
    maturityDescription = 'You have solid foundations. Focused work on 1-2 areas will accelerate your growth.';
  } else {
    maturityLevel = 'Emerging';
    maturityDescription = 'Accountability is a significant growth opportunity. The good news: this is learnable.';
  }

  return {
    scores: normalized,
    sortedDimensions: sorted,
    topDimensions: [top1, top2],
    weakestDimension: bottom,
    archetype,
    archetypeData: ACCOUNTABILITY_ARCHETYPES[archetype],
    overallScore,
    maturityLevel,
    maturityDescription,
  };
};

// Get growth recommendations based on weak dimension
export const getGrowthRecommendations = (weakestDimension) => {
  const recommendations = {
    ownership: [
      "Practice saying 'I own this' before explaining contributing factors",
      "When things go wrong, list what YOU could have done differently first",
      "End each week reviewing outcomes you influenced but didn't fully own",
    ],
    reliability: [
      "Under-promise, over-deliver: add 20% buffer to every commitment",
      "Create a single source of truth for all your commitments",
      "Set up weekly reviews to proactively flag at-risk deliverables",
    ],
    transparency: [
      "Implement 'no surprises'—share challenges within 24 hours of discovery",
      "Start team meetings with 'what I'm struggling with this week'",
      "Practice radical candor: care personally, challenge directly",
    ],
    standards: [
      "Document your expectations explicitly—what 'good' and 'great' look like",
      "Have a 'standards conversation' early in every project or relationship",
      "Stop accepting 'good enough'—name it when you see it",
    ],
    feedback: [
      "Schedule recurring 1:1s with a standing feedback agenda item",
      "Practice receiving feedback with 'thank you' before explaining",
      "Use the SBI model: Situation, Behavior, Impact for all feedback",
    ],
  };
  return recommendations[weakestDimension] || recommendations.ownership;
};
