export const ASSESSMENT_TITLE =
  "How Strong Is Your Team's Accountability System?";

export const START_ASSESSMENT_URL = 'https://leaderreps-accountability.web.app';

export const ASSESSMENT_QUESTIONS = [
  {
    id: 'clear-expectations',
    shortLabel: 'Clear Expectations',
    prompt:
      'If you asked your direct report right now, "What does success look like for your top priority?," would their answer match yours?',
    ifYes:
      'Strong foundation. Shared expectations reduce friction before it starts — this is the bedrock of accountability.',
    ifNotYet:
      "When the definition of success lives only in your head, your team can’t hit a target they can’t see. This is the most common source of rework and missed expectations. The fix isn’t a longer explanation — it’s writing down what done looks like before the conversation starts.",
  },
  {
    id: 'clean-handoff',
    shortLabel: 'Clean Handoff',
    prompt:
      'When you hand off work, do you get a clear commitment — "I\'ll have this done by Friday" — instead of "I\'ll try"?',
    ifYes:
      'Ownership language locks in commitment and makes accountability explicit. You\'re making it easy for people to be accountable and hard to slide through on vague agreements.',
    ifNotYet:
      '"I\'ll try" isn\'t a commitment — it\'s a placeholder. Every time you accept vague language, you take ownership back. The fix is simple: make the ask explicit and require clear acceptance.',
  },
  {
    id: 'avoiding-rescue',
    shortLabel: 'Avoiding Rescue',
    prompt:
      'When things start going sideways do you let your direct report work through it without jumping in and taking it back?',
    ifYes:
      'Keeping ownership with your team builds their capability and your capacity. That\'s the trade — short-term discomfort for long-term strength.',
    ifNotYet:
      'Stepping in feels efficient. It isn\'t. Every time you take work back, you signal that you don\'t trust the handoff and you make yourself the bottleneck. This one compounds fast.',
  },
  {
    id: 'follow-up',
    shortLabel: 'Follow-Up on the Work',
    prompt:
      'In the last week, did you check in on work in progress — not to take over, but to stay connected and keep things on track?',
    ifYes:
      'Follow-up is what keeps expectations visible after the conversation ends. You\'re staying connected to the work without taking it over — which means your team stays accountable and you stay informed. That\'s the system working.',
    ifNotYet:
      'Without follow-up, expectations fade. Work drifts. And by the time you notice something is off, it\'s already cost you time. A quick check-in — "where are we on this?" — isn\'t micromanaging. It\'s how standards stay real between conversations.',
  },
  {
    id: 'timely-redirecting-feedback',
    shortLabel: 'Timely Redirecting Feedback',
    prompt:
      'The last few times something was off, did you give feedback soon after you noticed (ideally within 24 hours)?',
    note: 'Softening it significantly or letting it go counts as a "Not Yet."',
    ifYes:
      'Addressing issues quickly signals that standards are real. It also keeps small problems from becoming big ones.',
    ifNotYet:
      'Delayed feedback often feels kinder in the moment. It rarely is. The longer you wait, the more the team learns that standards are flexible — and the harder the conversation becomes when you finally have it.',
  },
  {
    id: 'reinforcing-feedback',
    shortLabel: 'Reinforcing Feedback',
    prompt:
      'In the last week, did you catch someone doing something right and tell them specifically what they did well?',
    ifYes:
      'Managers tend to default to feedback when something goes wrong. You\'re doing even more — noticing when something goes right and naming it specifically. That\'s what builds the behaviors you actually want to see repeated. It also builds the kind of trust that makes redirecting feedback land better when you need it.',
    ifNotYet:
      'Reinforcing feedback isn\'t a nicety — it\'s a tool. When people don\'t hear specifically what they did well, they can\'t repeat it deliberately. And when the only feedback they receive is corrective, they learn to brace for criticism rather than reach for growth. Catching people doing things right is a leadership behavior, not a personality trait. It takes practice.',
  },
  {
    id: 'pattern-recognition',
    shortLabel: 'Pattern Recognition',
    prompt:
      'When you give the same feedback more than once, do you address the pattern directly and not just fix the immediate problem?',
    ifYes:
      'Pattern-level feedback changes behavior. Task-level feedback fixes the immediate problem. Both are valuable. You\'re having the right conversations at the right times.',
    ifNotYet:
      'If the same issue keeps coming back, it\'s not a task problem — it\'s a behavior pattern. Fixing the task without naming the pattern means you\'ll have the same conversation again next month. The pattern is what needs to change, and you can\'t change what you haven\'t named.',
  },
];

export const SCORE_BANDS = {
  '6-7': {
    key: 'strong-system',
    label: 'Strong System',
    kitTag: 'ASA 6-7',
    headline: 'Your system is doing real work.',
    summary:
      'The structure is holding, which means you have capacity to sharpen the edges.\n\nMost managers are carrying more than they should. You’ve built something that carries some of that load for you. That means your team has something many teams don’t: a system that creates clarity, accountability, and follow-through — without it all running through you.\n\nBelow, you’ll see all seven questions with the full yes / not yet analysis.\n\nOne question worth sitting with: if your team took this assessment about you, would their answers match yours? The gap between how you see your system and how your team experiences it is where the most useful work lives.',
  },
  '3-5': {
    key: 'room-to-strengthen',
    label: 'Room to Strengthen',
    kitTag: 'ASA 3-5',
    headline: 'You have a system. A few targeted reps will make it significantly stronger.',
    summary:
      'The gaps probably show up as recurring issues, more follow-up than you want, or a nagging sense that accountability is inconsistent. These are fixable.\n\nYou’re not starting from zero. Some of the system is already in place through the expectations you set, follow-up you do, or feedback you give.\n\nBut a few answers came back "not yet." Those show your gaps, and in an accountability system, gaps compound. One unclear expectation leads to a missed handoff. One delayed piece of feedback becomes a pattern the team learns to expect. The load comes back to you.\n\nBelow, you’ll see all seven questions with the full yes / not yet analysis.\n\nStart with the "not yet" answers that show up most in your actual work week. Not all of them at once. Start with the one that costs you the most time or energy when it’s missing. One rep, repeated, until it’s consistent.',
  },
  '0-2': {
    key: 'system-not-yet-installed',
    label: 'System Not Yet Installed',
    kitTag: 'ASA 0-2',
    headline: 'Your system needs a rebuild.',
    summary:
      'This isn’t about how much you care or how hard you work.\n\nMany managers score exactly where you did — not because they’re bad at their jobs, but because nobody taught them how to build an accountability system.\n\nSo they do what feels natural: work harder, step in faster, over-explain. It works until it doesn’t — because the load becomes unsustainable and the team never fully owns its work. That’s not a people problem. It’s a missing system.\n\nBelow, you’ll see all seven questions with the full yes / not yet analysis.\n\nFind the "not yet" that costs you the most time or energy. One behavior, practiced consistently for two weeks, will do more than five behaviors practiced inconsistently. Build the system one rep at a time.',
  },
};

const SCORE_LABELS_BY_KEY = {
  'clear-expectations': 'Clear Expectations',
  'clean-handoff': 'Clean Handoff',
  'avoiding-rescue': 'Avoiding Rescue',
  'follow-up': 'Follow-Up on the Work',
  'timely-redirecting-feedback': 'Timely Redirecting Feedback',
  'reinforcing-feedback': 'Reinforcing Feedback',
  'pattern-recognition': 'Pattern Recognition',
};

const getBandKeyForYesCount = (yesCount) => {
  if (yesCount >= 6) return '6-7';
  if (yesCount >= 3) return '3-5';
  return '0-2';
};

const getBandForYesCount = (yesCount) => SCORE_BANDS[getBandKeyForYesCount(yesCount)];

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
  const scoreBandKey = getBandKeyForYesCount(yesCount);

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
    scoreBand: scoreBandKey,
    scoreLabel: scoreBand.label,
    headline: scoreBand.headline,
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
  "I took the Accountability System Pulse Check from LeaderReps. Find out how strong your team's accountability system really is in 3 minutes!";
