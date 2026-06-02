// Manager Accountability Audit — 10 questions across 4 scored categories + 2 gut-check
// Likert 1–5: 1 Rarely, 2 Occasionally, 3 Sometimes, 4 Usually, 5 Consistently

export const ASSESSMENT_TITLE = 'The Manager Accountability Audit';
export const ASSESSMENT_SUBTITLE =
  'Find out where your management team is leaving performance on the table.';

export const LIKERT_OPTIONS = [
  { value: 1, label: 'Rarely', short: '1' },
  { value: 2, label: 'Occasionally', short: '2' },
  { value: 3, label: 'Sometimes', short: '3' },
  { value: 4, label: 'Usually', short: '4' },
  { value: 5, label: 'Consistently', short: '5' },
];

// Four scored categories + the unscored gut-check
export const CATEGORIES = {
  'clear-expectations': {
    id: 'clear-expectations',
    label: 'Set Clear Expectations',
    order: 1,
    scored: true,
  },
  'follow-up': {
    id: 'follow-up',
    label: 'Follow-Up on the Work',
    order: 2,
    scored: true,
  },
  'reinforcing-feedback': {
    id: 'reinforcing-feedback',
    label: 'Reinforcing Feedback',
    order: 3,
    scored: true,
  },
  'redirecting-feedback': {
    id: 'redirecting-feedback',
    label: 'Redirecting Feedback',
    order: 4,
    scored: true,
  },
  'gut-check': {
    id: 'gut-check',
    label: 'The Gut Check',
    order: 5,
    scored: false,
  },
};

// Per-category diagnostic copy shown when the leader scores Gap or Developing
// in that category. Strong scores get a one-line acknowledgment instead.
export const CATEGORY_DIAGNOSTICS = {
  'clear-expectations': {
    headline: 'Your managers aren\'t setting expectations the team can actually act on.',
    body:
      'When expectations are vague, the team improvises — and improvisation is where standards quietly drop. People are working hard, but not necessarily on the right things, in the right way, by the right time. Until the standard is named in plain language, you can\'t hold anyone to it.',
    rep: 'Before assigning the next piece of work, your manager names the outcome, the standard, and the deadline out loud — and asks the person to repeat it back in their own words.',
    youWillSee:
      'Less rework. Fewer "I didn\'t know that\'s what you meant" conversations. Faster handoffs.',
  },
  'follow-up': {
    headline: 'Work is being delegated, but no one is closing the loop.',
    body:
      'When follow-up is inconsistent, the team learns that some things matter more than others — and they\'re the ones deciding which. Deadlines slip without consequence. Quality drifts. The manager ends up doing the work themselves "just this once" until that becomes the system.',
    rep: 'Every time your manager delegates, they put the check-in on the calendar in the same conversation — not later, not "I\'ll ping you," but a specific time before the work is due.',
    youWillSee:
      'Fewer end-of-week fire drills. Issues surface days earlier. The manager stops being the bottleneck.',
  },
  'reinforcing-feedback': {
    headline: 'Good work is happening, but it\'s invisible.',
    body:
      'When strong work goes unrecognized, top performers start to wonder if it matters. Average becomes the new standard because that\'s what gets the same response as great. Reinforcing feedback isn\'t about being nice — it\'s about making the standard repeatable.',
    rep: 'When your manager sees the behavior they want more of, they name it on the spot — the specific action, the impact it had, and why it matters.',
    youWillSee:
      'Standards lift. The behaviors you want spread across the team. Engagement scores move.',
  },
  'redirecting-feedback': {
    headline: 'Performance problems are being tolerated, not addressed.',
    body:
      'When managers avoid the hard conversation, the team feels it. The strongest people lose respect. The under-performers learn that the line is somewhere else. The longer the delay, the bigger the conversation has to be — until it becomes a separation instead of a coaching moment.',
    rep: 'Within 24 hours of seeing a behavior that misses the standard, your manager addresses it directly — what they observed, why it matters, what good looks like, and what changes next.',
    youWillSee:
      'Issues get smaller, not bigger. The team self-corrects. You stop being the one who has to "finally have the conversation."',
  },
};

export const CATEGORY_STRONG_NOTES = {
  'clear-expectations':
    'Your managers are setting expectations the team can act on. Keep reinforcing the standard.',
  'follow-up':
    'Your managers are closing the loop on delegated work. The team knows follow-up is real.',
  'reinforcing-feedback':
    'Your managers are catching good work and naming it. That\'s how standards rise.',
  'redirecting-feedback':
    'Your managers are addressing performance issues directly and on time. That\'s rare — protect it.',
};

export const ASSESSMENT_QUESTIONS = [
  // Set Clear Expectations
  {
    id: 'ce-1',
    category: 'clear-expectations',
    prompt:
      'Our managers spell out what "good" looks like — the outcome, the standard, and the deadline — before work begins.',
  },
  {
    id: 'ce-2',
    category: 'clear-expectations',
    prompt:
      'Our team members could repeat back, in their own words, exactly what is expected of them on their current priorities.',
  },
  // Follow-Up on the Work
  {
    id: 'fu-1',
    category: 'follow-up',
    prompt:
      'Our managers schedule the check-in at the moment they delegate, not after the deadline is missed.',
  },
  {
    id: 'fu-2',
    category: 'follow-up',
    prompt:
      'Issues with delegated work surface days before the deadline, not the morning of.',
  },
  // Reinforcing Feedback
  {
    id: 'rp-1',
    category: 'reinforcing-feedback',
    prompt:
      'Our managers catch people doing the right things and name it specifically — the action, the impact, why it matters.',
  },
  {
    id: 'rp-2',
    category: 'reinforcing-feedback',
    prompt:
      'Top performers on our team know we see their work and value it.',
  },
  // Redirecting Feedback
  {
    id: 'rd-1',
    category: 'redirecting-feedback',
    prompt:
      'Our managers address performance issues within 24 hours of seeing them, not in the next quarterly review.',
  },
  {
    id: 'rd-2',
    category: 'redirecting-feedback',
    prompt:
      'Our managers can have a hard conversation without it turning into a relationship problem.',
  },
  // Gut check (unscored)
  {
    id: 'gc-1',
    category: 'gut-check',
    prompt:
      'If I left for a month, our team would hit the same standards without me checking in.',
  },
  {
    id: 'gc-2',
    category: 'gut-check',
    prompt:
      'I rarely have to step in and rescue work that should have been handled by my managers.',
  },
];

// Overall band thresholds (averaged across the 4 scored categories, 1.0–5.0)
export const SCORE_BANDS = {
  gap: {
    id: 'gap',
    min: 1.0,
    max: 2.4,
    label: 'Accountability Gap',
    headline: 'Your management team has a real accountability gap.',
    summary:
      'Right now, the system is mostly running on your effort, not your managers\'. Expectations are unclear, follow-up is inconsistent, and feedback — both kinds — is rare or late. The good news: this is the most leveraged thing you can fix. Small, consistent reps in each of the four areas below will close the gap faster than another off-site or another tool.',
    kitTag: 'manager-audit-gap',
    color: '#B84825',
  },
  developing: {
    id: 'developing',
    min: 2.5,
    max: 3.4,
    label: 'Developing',
    headline: 'Your managers are doing some of it — not consistently enough yet.',
    summary:
      'You\'ve got pockets of accountability working, but it depends on the manager and the day. That inconsistency is what your strongest people feel — and what your weakest people exploit. The categories flagged below are the ones to install as a repeatable system, not a personality trait.',
    kitTag: 'manager-audit-developing',
    color: '#C9913A',
  },
  strong: {
    id: 'strong',
    min: 3.5,
    max: 5.0,
    label: 'Strong',
    headline: 'Your management team is running a strong accountability system.',
    summary:
      'You\'re in the top tier. The four reps are happening consistently enough that the team trusts the standard. Your work now is protecting that and developing the next layer of managers underneath. Look at any category below that came in under "Strong" — that\'s where the next gain is.',
    kitTag: 'manager-audit-strong',
    color: '#277A68',
  },
};

const getBandForScore = (score) => {
  if (score >= 3.5) return SCORE_BANDS.strong;
  if (score >= 2.5) return SCORE_BANDS.developing;
  return SCORE_BANDS.gap;
};

const getCategoryBandLabel = (score) => {
  if (score >= 3.5) return 'Strong';
  if (score >= 2.5) return 'Developing';
  return 'Gap';
};

/**
 * Calculate results from an answers object keyed by questionId → 1..5
 */
export const calculateResults = (answers) => {
  const categoryScores = {};
  const categoryRaw = {};
  const categoryBands = {};
  const questionResults = [];
  const gutCheckAnswers = [];

  // Group questions by category
  const byCategory = {};
  ASSESSMENT_QUESTIONS.forEach((q) => {
    if (!byCategory[q.category]) byCategory[q.category] = [];
    byCategory[q.category].push(q);
  });

  Object.entries(byCategory).forEach(([catId, questions]) => {
    const total = questions.reduce(
      (sum, q) => sum + Number(answers[q.id] || 0),
      0,
    );
    const score = total / questions.length; // 1–5
    const cat = CATEGORIES[catId];

    if (cat?.scored) {
      categoryRaw[catId] = total;
      categoryScores[catId] = Number(score.toFixed(2));
      categoryBands[catId] = {
        label: getCategoryBandLabel(score),
        score: Number(score.toFixed(2)),
        isStrong: score >= 3.5,
      };
    }

    questions.forEach((q) => {
      const val = Number(answers[q.id] || 0);
      const item = {
        id: q.id,
        category: q.category,
        prompt: q.prompt,
        answer: val,
        answerLabel: LIKERT_OPTIONS.find((o) => o.value === val)?.label || '',
      };
      questionResults.push(item);
      if (q.category === 'gut-check') gutCheckAnswers.push(item);
    });
  });

  // Overall = average of the 4 scored categories
  const scoredValues = Object.values(categoryScores);
  const overallScore =
    scoredValues.length > 0
      ? scoredValues.reduce((a, b) => a + b, 0) / scoredValues.length
      : 0;

  const band = getBandForScore(overallScore);

  return {
    overallScore: Number(overallScore.toFixed(2)),
    band: band.id,
    bandLabel: band.label,
    headline: band.headline,
    summary: band.summary,
    kitTag: band.kitTag,
    categoryScores,
    categoryBands,
    categoryRaw,
    questionResults,
    gutCheckAnswers,
    totalQuestions: ASSESSMENT_QUESTIONS.length,
  };
};
