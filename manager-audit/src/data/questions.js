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
    prompt:
      'Managers define what "done" looks like before work begins, not after it comes back wrong.',
  },
  {
    id: 'ce-2',
    category: 'clear-expectations',
    prompt: 'Managers confirm ownership is clear before a project starts.',
  },
  // Following Up on the Work
  {
    id: 'fu-1',
    category: 'follow-up',
    prompt:
      'Managers follow up on the work itself ("Where are you on…"), not just on whether people feel good about it ("How\u2019s the project going?").',
  },
  {
    id: 'fu-2',
    category: 'follow-up',
    prompt:
      'When something goes wrong, my managers coach the person through it instead of taking the work back.',
  },
  // Delivering Reinforcing Feedback
  {
    id: 'rp-1',
    category: 'reinforcing-feedback',
    prompt:
      'Managers name specific behaviors and the impact when they recognize strong performance — they don\u2019t just say "great job."',
  },
  {
    id: 'rp-2',
    category: 'reinforcing-feedback',
    prompt:
      'When someone on the team does something worth repeating, their manager tells them exactly what it was and why it mattered.',
  },
  // Delivering Redirecting Feedback
  {
    id: 'rd-1',
    category: 'redirecting-feedback',
    prompt:
      'My managers address behavior gaps when they notice them, not after they\u2019ve let them go too long.',
  },
  {
    id: 'rd-2',
    category: 'redirecting-feedback',
    prompt:
      'Managers close the loop by following up after a redirecting feedback conversation to confirm the behavior actually changed.',
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
