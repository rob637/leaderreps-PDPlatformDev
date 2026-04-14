export const ASSESSMENT_TITLE =
  "How Strong Is Your Team's Accountability System?";

export const START_ASSESSMENT_URL = 'https://leaderreps-accountability.web.app';

export const ASSESSMENT_QUESTIONS = [
  {
    id: 'shared-understanding',
    shortLabel: 'Shared Understanding',
    prompt:
      "If you stopped your direct report right now and asked, \"What does success look like for your #1 priority?\", would their answer match yours?",
    ifYes:
      'Strong foundation. Shared expectations reduce friction before it starts. This is the bedrock of accountability.',
    ifNotYet:
      "When the definition of success lives only in your head, your team cannot hit a target they cannot see. This is the most common source of rework and missed expectations. The fix is not a longer explanation. It is a shared definition of success before work starts.",
  },
  {
    id: 'ownership-language',
    shortLabel: 'Ownership Language',
    prompt:
      "When assigning work, do you require clear ownership language from your direct? 'I'll have this done by Friday' instead of 'I'm on it' or 'I'll try'?",
    ifYes:
      'Ownership language locks in commitment and makes accountability explicit. You are making it easy for people to be accountable and hard to slide through on vague agreements.',
    ifNotYet:
      "'I'll get to it' is not a commitment, it is a placeholder. Every time you accept vague language, you take ownership back. The fix is simple: make the ask explicit and require an ownership claim.",
  },
  {
    id: 'ownership-discipline',
    shortLabel: 'Ownership Discipline',
    prompt:
      'Do you keep ownership with your direct report, even when it would be faster to step in and do the work yourself?',
    ifYes:
      'Keeping ownership with your team builds their competence and your capacity. You are doing what a leader should do, holding the line even when it is uncomfortable.',
    ifNotYet:
      'Stepping in feels efficient. It is not. Every time you take work back, you signal that you do not trust the handoff and you make yourself the bottleneck. This one compounds fast.',
  },
  {
    id: 'timely-feedback',
    shortLabel: 'Timely Feedback',
    prompt:
      'The last few times something was off, did you address it soon after you noticed, ideally within 24 hours?',
    note: "Softening it significantly or letting it go counts as a 'Not yet.'",
    ifYes:
      'Addressing issues quickly signals that standards are real. It also keeps small problems from becoming big ones.',
    ifNotYet:
      'Delayed feedback often feels kinder in the moment. It rarely is. The longer you wait, the more the team learns that standards are flexible, and the harder the conversation becomes when you finally have it.',
  },
  {
    id: 'pattern-feedback',
    shortLabel: 'Pattern Feedback vs. Task Feedback',
    prompt:
      'When a standard is missed more than once, do you address the underlying behavior pattern, not just the immediate task?',
    ifYes:
      'Pattern-level feedback changes behavior. Task-level feedback fixes the immediate problem. Both are valuable. You are having the right conversations at the right times.',
    ifNotYet:
      'If the same issue keeps coming back, it is not a task problem, it is a behavior pattern. Fixing the task without naming the pattern means you will have the same conversation again next month. The pattern is what needs to change, and you cannot change what you have not named.',
  },
];

export const SCORE_BANDS = {
  '4-5': {
    key: 'execution-engine',
    label: 'Execution Engine',
    kitTag: 'ASA 4-5',
    summary:
      'Your system is doing real work. The system structure is holding, which means you have capacity to sharpen the edges. Too many managers carry their team\'s accountability on their own, stepping in when they should hold back, accepting vague commitments because it\'s faster, delaying feedback because the moment never feels quite right. You are not doing that. That means your team has something many teams do not: a system that carries some of the load so you do not have to. One question worth sitting with as you read the analysis: if your team took this quiz about you, would their answers match yours?',
  },
  '2-3': {
    key: 'leaky-system',
    label: 'Leaky System',
    kitTag: 'ASA 2-3',
    summary:
      'You have a system, but it is leaking in a few places. The gaps probably show up as recurring issues, more follow-up than you want, or a nagging sense that accountability is inconsistent. These are fixable. You are not starting from zero, but gaps compound. One unclear expectation leads to a missed handoff. One delayed piece of feedback becomes a pattern the team learns to expect. Start with the not-yet answer that costs you the most time or energy, then run one rep repeatedly until it is consistent.',
  },
  '0-1': {
    key: 'system-not-yet-installed',
    label: 'System Not Yet Installed',
    kitTag: 'ASA 0-1',
    summary:
      'Your system needs a rebuild. This is not about how much you care or how hard you work. Many managers score here because nobody taught them how to build an accountability system. So they work harder, step in faster, and over-explain. It works until it does not, because the load becomes unsustainable and the team never fully owns its work. Find the not-yet that costs you the most time or energy. One behavior, practiced consistently for two weeks, will outperform five done inconsistently.',
  },
};

const SCORE_LABELS_BY_KEY = {
  'shared-understanding': 'Shared Understanding',
  'ownership-language': 'Ownership Language',
  'ownership-discipline': 'Ownership Discipline',
  'timely-feedback': 'Timely Feedback',
  'pattern-feedback': 'Pattern Feedback',
};

const getBandForYesCount = (yesCount) => {
  if (yesCount >= 4) return SCORE_BANDS['4-5'];
  if (yesCount >= 2) return SCORE_BANDS['2-3'];
  return SCORE_BANDS['0-1'];
};

export const calculateResults = (answers) => {
  const answerMap = Object.fromEntries(
    answers.map((entry) => [entry.questionId, entry.value]),
  );

  const yesCount = ASSESSMENT_QUESTIONS.reduce(
    (sum, question) => sum + (answerMap[question.id] === 'yes' ? 1 : 0),
    0,
  );
  const totalQuestions = ASSESSMENT_QUESTIONS.length;
  const notYetCount = totalQuestions - yesCount;
  const scoreBand = getBandForYesCount(yesCount);

  const questionResults = ASSESSMENT_QUESTIONS.map((question) => {
    const answer = answerMap[question.id] === 'yes' ? 'yes' : 'not-yet';
    return {
      id: question.id,
      shortLabel: question.shortLabel,
      prompt: question.prompt,
      note: question.note || '',
      answer,
      answerLabel: answer === 'yes' ? 'Yes' : 'Inconsistent / Not Yet',
      ifYes: question.ifYes,
      ifNotYet: question.ifNotYet,
    };
  });

  const scores = Object.fromEntries(
    questionResults.map((result) => [
      SCORE_LABELS_BY_KEY[result.id],
      result.answer === 'yes' ? 100 : 0,
    ]),
  );

  return {
    totalQuestions,
    yesCount,
    notYetCount,
    scoreBand:
      yesCount >= 4 ? '4-5' : yesCount >= 2 ? '2-3' : '0-1',
    scoreLabel: scoreBand.label,
    summary: scoreBand.summary,
    archetype: scoreBand.key,
    archetypeName: scoreBand.label,
    kitTag: scoreBand.kitTag,
    overallScore: Math.round((yesCount / totalQuestions) * 100),
    questionResults,
    scores,
  };
};

export const getLinkedInShareText = () =>
  "I just took the Accountability System Assessment from LeaderReps - find out how strong your team's accountability system really is in 3 minutes";
