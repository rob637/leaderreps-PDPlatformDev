// Manager Accountability Audit — 10 questions across 4 scored categories + 2 gut-check
// Scored questions: Likert 1–5 (Rarely → Consistently)
// Gut-check questions (Q9, Q10): binary Agree / Disagree (unscored)

export const ASSESSMENT_TITLE = 'The Manager Accountability Audit';
export const ASSESSMENT_SUBTITLE_LINE_1 =
  'Strong accountability systems run on specific behaviors: setting clear expectations, following up on the work, and delivering feedback.';
export const ASSESSMENT_SUBTITLE_LINE_2 =
  'Find out how consistently your managers are running those behaviors, and where the gaps are.';

export const LIKERT_OPTIONS = [
  { value: 1, label: 'Rarely', short: '1' },
  { value: 2, label: 'Occasionally', short: '2' },
  { value: 3, label: 'Sometimes', short: '3' },
  { value: 4, label: 'Usually', short: '4' },
  { value: 5, label: 'Consistently', short: '5' },
];

// Binary options for gut-check questions (unscored, stored as 'agree' | 'disagree')
export const AGREE_DISAGREE_OPTIONS = [
  { value: 'agree', label: 'Agree' },
  { value: 'disagree', label: 'Disagree' },
];

// Four scored categories + the unscored gut-check
export const CATEGORIES = {
  'clear-expectations': {
    id: 'clear-expectations',
    label: 'Setting Clear Expectations',
    order: 1,
    scored: true,
  },
  'follow-up': {
    id: 'follow-up',
    label: 'Following Up on the Work',
    order: 2,
    scored: true,
  },
  'reinforcing-feedback': {
    id: 'reinforcing-feedback',
    label: 'Delivering Reinforcing Feedback',
    order: 3,
    scored: true,
  },
  'redirecting-feedback': {
    id: 'redirecting-feedback',
    label: 'Delivering Redirecting Feedback',
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

export const ASSESSMENT_QUESTIONS = [
  // Setting Clear Expectations
  {
    id: 'ce-1',
    category: 'clear-expectations',
    prompt: 'Managers define what "done" looks like before work begins.',
  },
  {
    id: 'ce-2',
    category: 'clear-expectations',
    prompt:
      'When giving their direct a task, managers explicitly and clearly hand off ownership.',
  },
  // Following Up on the Work
  {
    id: 'fu-1',
    category: 'follow-up',
    prompt:
      'Managers follow up on their direct\u2019s work while it is still in progress.',
  },
  {
    id: 'fu-2',
    category: 'follow-up',
    prompt:
      'When their direct is struggling with a task, managers coach them through it instead of taking the work back.',
  },
  // Delivering Reinforcing Feedback
  {
    id: 'rp-1',
    category: 'reinforcing-feedback',
    prompt:
      'When recognizing strong performance, managers name specific behaviors instead of just saying "great job!"',
  },
  {
    id: 'rp-2',
    category: 'reinforcing-feedback',
    prompt:
      'When their direct does something worth repeating, managers tell them why it mattered.',
  },
  // Delivering Redirecting Feedback
  {
    id: 'rd-1',
    category: 'redirecting-feedback',
    prompt:
      'Managers address gaps when they notice them, not after they\u2019ve let them go too long.',
  },
  {
    id: 'rd-2',
    category: 'redirecting-feedback',
    prompt:
      'After giving feedback, managers follow up to confirm that change happened.',
  },
  // Gut check (unscored, Agree / Disagree)
  {
    id: 'gc-1',
    category: 'gut-check',
    optionsType: 'agree-disagree',
    prompt: 'Managers are having the conversations I\u2019d have if I was in their seat.',
  },
  {
    id: 'gc-2',
    category: 'gut-check',
    optionsType: 'agree-disagree',
    prompt: 'I\u2019ve been compensating for gaps more than I should be.',
  },
];

// Overall band thresholds (averaged across the 4 scored categories, 1.0–5.0)
// Copy is fixed — do not change without product sign-off.
export const SCORE_BANDS = {
  gap: {
    id: 'gap',
    min: 1.0,
    max: 2.4,
    label: 'Significant Gap',
    summary:
      'Significant gaps in your accountability system. Your managers are missing critical reps. Performance and ownership issues are likely showing up across your teams.',
    color: '#B84825',
    kitTag: 'manager-audit-gap',
  },
  developing: {
    id: 'developing',
    min: 2.5,
    max: 3.4,
    label: 'Developing',
    summary:
      'Your accountability system is developing. Some reps are running, but inconsistency is creating gaps. Strengthening the weak areas will have a direct impact on team performance.',
    color: '#C9913A',
    kitTag: 'manager-audit-developing',
  },
  strong: {
    id: 'strong',
    min: 3.5,
    max: 5.0,
    label: 'Strong',
    summary:
      'Your accountability system is strong. Your managers are running the reps consistently. The opportunity is locking in the ones that still have room to grow.',
    color: '#277A68',
    kitTag: 'manager-audit-strong',
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

export const getOptionsForQuestion = (q) => {
  if (q.optionsType === 'agree-disagree') return AGREE_DISAGREE_OPTIONS;
  return LIKERT_OPTIONS;
};

/**
 * Calculate results from an answers object keyed by questionId → value.
 * Scored questions use 1..5 numbers; gut-check questions store 'agree' | 'disagree'.
 */
export const calculateResults = (answers) => {
  const categoryScores = {};
  const categoryRaw = {};
  const categoryBands = {};
  const questionResults = [];
  const gutCheckAnswers = [];

  const byCategory = {};
  ASSESSMENT_QUESTIONS.forEach((q) => {
    if (!byCategory[q.category]) byCategory[q.category] = [];
    byCategory[q.category].push(q);
  });

  Object.entries(byCategory).forEach(([catId, questions]) => {
    const cat = CATEGORIES[catId];

    if (cat?.scored) {
      const total = questions.reduce(
        (sum, q) => sum + Number(answers[q.id] || 0),
        0,
      );
      const score = total / questions.length;
      categoryRaw[catId] = total;
      categoryScores[catId] = Number(score.toFixed(2));
      categoryBands[catId] = {
        label: getCategoryBandLabel(score),
        score: Number(score.toFixed(2)),
        isStrong: score >= 3.5,
      };
    }

    questions.forEach((q) => {
      const raw = answers[q.id];
      const opts = getOptionsForQuestion(q);
      const matched = opts.find((o) => o.value === raw);
      const item = {
        id: q.id,
        category: q.category,
        prompt: q.prompt,
        answer: raw ?? null,
        answerLabel: matched?.label || '',
      };
      questionResults.push(item);
      if (q.category === 'gut-check') gutCheckAnswers.push(item);
    });
  });

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
