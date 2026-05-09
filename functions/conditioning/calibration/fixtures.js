// functions/conditioning/calibration/fixtures.js
//
// Hand-labeled transcripts used as the gold standard for the Conditioning
// Light scorer. Each fixture carries:
//   - id          : stable identifier
//   - rrType      : DRF | RED | FUW | SCE
//   - transcript  : the exact text a leader would write
//   - expected    : the per-condition score we believe a thoughtful human
//                   rater would assign (0-3 per rrConfig anchors)
//   - expectedResult : 'pass' | 'notYet' | 'invalid' (engine outcome)
//   - notes       : why this fixture exists / what it tests
//
// Adding fixtures is the single highest-leverage way to improve scorer
// quality. Aim for coverage of:
//   - Clear Pass and clear Not Yet on each RR
//   - Each fail rule (one fixture per rule)
//   - Edge cases where scoring is genuinely hard
//   - Adversarial inputs (gaming, off-topic, too-short)
//
// NOTE: `expected` reflects human judgement against the anchors in
// rrConfig.js. When you tighten an anchor, re-review the expected scores.

'use strict';

const FIXTURES = [
  // ============================ DRF ============================
  {
    id: 'drf-strong-01',
    rrType: 'DRF',
    transcript:
      "After standup I pulled Maya aside. I told her: in the standup just now, you re-scoped the ticket after Priya pushed back on your estimate — that took guts and saved us a sprint of rework. That's the bar I want from you in every planning meeting — keep doing exactly that.",
    expected: { Behavior: 3, Impact: 3, Reinforcement: 3 },
    expectedResult: 'pass',
    expectedStrong: true,
    notes: 'Clean DRF: specific behavior, vivid impact, explicit "do it again."',
  },
  {
    id: 'drf-pass-soft',
    rrType: 'DRF',
    transcript:
      "Told Maya she handled the standup well — pushed back on the estimate and re-scoped. It helped the team. Nice work.",
    expected: { Behavior: 2, Impact: 2, Reinforcement: 1 },
    expectedResult: 'pass',
    expectedStrong: false,
    notes: 'Borderline pass: behavior+impact present but reinforcement is weak praise.',
  },
  {
    id: 'drf-fail-vague',
    rrType: 'DRF',
    transcript: "Told Maya she's been crushing it lately. Keep it up.",
    expected: { Behavior: 0, Impact: 0, Reinforcement: 1 },
    expectedResult: 'notYet',
    expectedStrong: false,
    notes: 'Generic praise — should fail on Behavior critical rule.',
  },
  {
    id: 'drf-invalid-tooshort',
    rrType: 'DRF',
    transcript: "good rep today",
    expected: { Behavior: 0, Impact: 0, Reinforcement: 0 },
    expectedResult: 'invalid',
    expectedStrong: false,
    notes: 'Should trigger lowConfidence and return invalid.',
  },

  // ============================ RED ============================
  {
    id: 'red-strong-01',
    rrType: 'RED',
    transcript:
      "Pulled Aman into a 1:1 today. I said: in Tuesday's exec review, you cut Priya off twice when she was answering the CFO's question. She stopped contributing for the rest of the meeting and we lost her read on the pricing risk. In the next exec review, let people finish their answer before you respond. I made the request once and waited for him to respond.",
    expected: {
      Behavior: 3,
      Impact: 3,
      Request: 3,
      DirectDelivery: 3,
      DeliveryDiscipline: 3,
    },
    expectedResult: 'pass',
    expectedStrong: true,
    notes: 'Textbook RED. Should clear strongRepRule.',
  },
  {
    id: 'red-fail-norequest',
    rrType: 'RED',
    transcript:
      "Talked to Aman about how he interrupted Priya in the exec review. I told him she was making a great point about pricing risk and he cut her off. He nodded.",
    expected: {
      Behavior: 2,
      Impact: 2,
      Request: 0,
      DirectDelivery: 3,
      DeliveryDiscipline: 2,
    },
    expectedResult: 'notYet',
    expectedStrong: false,
    notes: 'Missing Request — should trigger Request fail rule.',
  },
  {
    id: 'red-fail-noimpact',
    rrType: 'RED',
    transcript:
      "Told Aman in our 1:1 that he interrupted Priya twice in the exec review and asked him to let people finish.",
    expected: {
      Behavior: 3,
      Impact: 0,
      Request: 2,
      DirectDelivery: 3,
      DeliveryDiscipline: 2,
    },
    expectedResult: 'notYet',
    expectedStrong: false,
    notes: 'Impact missing — should fail on Impact=0 rule.',
  },
  {
    id: 'red-fail-vague-behavior',
    rrType: 'RED',
    transcript:
      "Sent Aman a Slack saying he can be dismissive in meetings and it's a problem — could he try to be better?",
    expected: {
      Behavior: 1,
      Impact: 1,
      Request: 1,
      DirectDelivery: 1,
      DeliveryDiscipline: 1,
    },
    expectedResult: 'notYet',
    expectedStrong: false,
    notes: 'Trait-not-instance behavior + async + soft request = compounded fail.',
  },

  // ============================ FUW ============================
  {
    id: 'fuw-strong-01',
    rrType: 'FUW',
    transcript:
      "Caught up with Sam on the Q2 pricing memo. He said the draft is done, legal review is the blocker, and finance reviews on Friday. He owns the legal follow-up and will ping me by Thursday EOD.",
    expected: { WorkAnchored: 3, ProgressVisibility: 3, Ownership: 3 },
    expectedResult: 'pass',
    expectedStrong: true,
    notes: 'Specific work, concrete progress, named owner with date.',
  },
  {
    id: 'fuw-pass-soft',
    rrType: 'FUW',
    transcript:
      "Asked Sam how the pricing project was going. He said most of it is done with a few things still open. Sam's on it.",
    expected: { WorkAnchored: 2, ProgressVisibility: 2, Ownership: 2 },
    expectedResult: 'pass',
    expectedStrong: false,
    notes: 'Borderline pass — present but soft on every dimension.',
  },
  {
    id: 'fuw-fail-generic',
    rrType: 'FUW',
    transcript: "Checked in with Sam this morning. Asked how things were going. He said all good.",
    expected: { WorkAnchored: 1, ProgressVisibility: 1, Ownership: 0 },
    expectedResult: 'notYet',
    expectedStrong: false,
    notes: 'Generic check-in; WorkAnchored Weak triggers fail rule.',
  },
  {
    id: 'fuw-invalid',
    rrType: 'FUW',
    transcript: "talked to sam.",
    expected: { WorkAnchored: 0, ProgressVisibility: 0, Ownership: 0 },
    expectedResult: 'invalid',
    expectedStrong: false,
    notes: 'Too short to score.',
  },

  // ============================ SCE ============================
  {
    id: 'sce-strong-01',
    rrType: 'SCE',
    transcript:
      "Asked Jordan to write a one-page memo on the pricing options for the CFO: recommendation, three alternatives, trade-offs. Done means the CFO can read it once and approve without follow-up questions. I asked her to walk me through how she'd approach it — she said she'd start with the trade-off matrix and have a draft to me Wednesday at 4 for review. She owns it; we sync Thursday.",
    expected: { Expectation: 3, Success: 3, Understanding: 3, Ownership: 3 },
    expectedResult: 'pass',
    expectedStrong: true,
    notes: 'Full SCE — specific ask, observable success, real understanding check, named owner.',
  },
  {
    id: 'sce-pass-no-understanding-check',
    rrType: 'SCE',
    transcript:
      "Told Jordan I need a one-page memo for the CFO with the recommendation, three options, and trade-offs by Wednesday. Done means the CFO can act on it without more questions. She nodded and I moved on. She owns it.",
    expected: { Expectation: 3, Success: 3, Understanding: 1, Ownership: 2 },
    expectedResult: 'pass',
    expectedStrong: false,
    notes:
      'Understanding=Weak (nodded only) sits just above the Missing fail line. Pass, but flagged as growth area.',
  },
  {
    id: 'sce-fail-vague-expectation',
    rrType: 'SCE',
    transcript:
      "Told Jordan she needs to do better at communicating up to the CFO. Make it high quality. The team will handle it.",
    expected: { Expectation: 1, Success: 1, Understanding: 0, Ownership: 1 },
    expectedResult: 'notYet',
    expectedStrong: false,
    notes: 'Vague expectation + no success criteria = fail on both critical rules.',
  },
  {
    id: 'sce-fail-no-success',
    rrType: 'SCE',
    transcript:
      "Asked Jordan to write the pricing memo for the CFO. She said got it and will have a draft Wednesday.",
    expected: { Expectation: 2, Success: 0, Understanding: 2, Ownership: 2 },
    expectedResult: 'notYet',
    expectedStrong: false,
    notes: 'Expectation present but Success undefined — should fail Success rule.',
  },

  // ============================ NEW FAIL-RULE COVERAGE ============================
  {
    id: 'drf-fail-no-impact',
    rrType: 'DRF',
    transcript:
      "Pulled Maya aside after standup. Told her: when you re-scoped the ticket after Priya pushed back, that was sharp — keep doing exactly that in planning meetings.",
    expected: { Behavior: 3, Impact: 0, Reinforcement: 3 },
    expectedResult: 'notYet',
    expectedStrong: false,
    notes:
      'New fail rule: DRF Impact=Missing. Behavior + Reinforcement both Strong but never names what changed — should fail.',
  },
  {
    id: 'fuw-fail-no-owner',
    rrType: 'FUW',
    transcript:
      "Caught Sam in the hallway. He said the Q2 pricing memo draft is done and legal is reviewing it. We'll figure out next steps.",
    expected: { WorkAnchored: 3, ProgressVisibility: 3, Ownership: 1 },
    expectedResult: 'notYet',
    expectedStrong: false,
    notes:
      'New fail rule: FUW Ownership<=Weak. Work anchored and progress visible, but ownership left as "we\'ll figure it out" — should fail.',
  },
  {
    id: 'sce-fail-no-understanding-check',
    rrType: 'SCE',
    transcript:
      "Told Jordan I need a one-page memo for the CFO with the recommendation, three options, and trade-offs by Wednesday at 4. Done means the CFO can act on it without follow-up questions. She owns it; we sync Thursday.",
    expected: { Expectation: 3, Success: 3, Understanding: 0, Ownership: 3 },
    expectedResult: 'notYet',
    expectedStrong: false,
    notes:
      'New fail rule: SCE Understanding=Missing. Strong on every other dimension, but the leader never confirmed the expectation landed — should fail.',
  },
];

module.exports = { FIXTURES };
