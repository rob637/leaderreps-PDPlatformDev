// functions/conditioning/calibration/realism.js
//
// Realism stress fixtures for the Conditioning Light scorer (Phase 7).
//
// These transcripts simulate what real leaders actually type into the rep
// box at 7am on a Tuesday — rambling, terse, mixed-quality, or trying to
// game the rubric. They exist to make sure the scorer doesn't over-credit
// any of these patterns.
//
// Shape matches fixtures.js so run.js can consume both interchangeably.

'use strict';

const REALISM_FIXTURES = [
  // ----- Rambling: lots of words, little substance -----
  {
    id: 'realism-rambling-drf',
    rrType: 'DRF',
    transcript:
      "Okay so this morning I was walking into the office and I bumped into Maya by the coffee machine and we got to talking about all the stuff that's been going on with the planning meetings and the new sprint cadence and how the team has been adjusting to the change and I told her she's been doing such an amazing job navigating all of it and that I really appreciate everything she brings to the table because she's such a positive force and a great example for the rest of the team and I'm so glad she's here.",
    expected: { Behavior: 0, Impact: 0, Reinforcement: 1 },
    expectedResult: 'notYet',
    expectedStrong: false,
    expectedStakes: 'low',
    notes:
      'Long, warm, and entirely generic. Scorer must not be tricked into raising scores by sheer volume.',
  },

  // ----- Terse: real but minimal -----
  {
    id: 'realism-minimal-fuw',
    rrType: 'FUW',
    transcript: 'Sam, Q2 memo. Legal review by Thursday EOD. He owns it.',
    expected: { WorkAnchored: 3, ProgressVisibility: 2, Ownership: 3 },
    expectedResult: 'pass',
    expectedStrong: false,
    expectedStakes: 'moderate',
    notes:
      'Terse note that still meets the bar on the critical conditions. Must not be penalized for brevity.',
  },

  // ----- Mixed: one condition is great, others are weak -----
  {
    id: 'realism-mixed-red',
    rrType: 'RED',
    transcript:
      "Talked to Aman. Told him: in Tuesday's exec review, you cut Priya off twice when she was answering the CFO's question. Asked him to be better in meetings going forward.",
    expected: {
      Behavior: 3,
      Impact: 1,
      Request: 1,
      DirectDelivery: 3,
      DeliveryDiscipline: 2,
    },
    expectedResult: 'notYet',
    expectedStrong: false,
    expectedStakes: 'high',
    notes:
      'Specific behavior + direct delivery, but no concrete impact and a vague request — should not pass.',
  },

  // ----- Gaming the rubric: keyword-stuffed but hollow -----
  {
    id: 'realism-gaming-sce',
    rrType: 'SCE',
    transcript:
      "I set a clear expectation with Jordan about the pricing memo. I defined success criteria. I confirmed understanding. She owns it. Done.",
    expected: { Expectation: 1, Success: 1, Understanding: 1, Ownership: 2 },
    expectedResult: 'notYet',
    expectedStrong: false,
    expectedStakes: 'moderate',
    notes:
      'Leader paraphrases the rubric instead of describing the actual conversation. Critical conditions must NOT be credited as Adequate without specifics.',
  },

  // ----- Off-topic: leader described something else entirely -----
  {
    id: 'realism-offtopic',
    rrType: 'DRF',
    transcript:
      "Spent the morning rewriting the Q3 OKRs and pushed the v2 to Confluence. Going to share at the staff meeting tomorrow.",
    expected: { Behavior: 0, Impact: 0, Reinforcement: 0 },
    expectedResult: 'invalid',
    expectedStrong: false,
    expectedStakes: 'moderate',
    notes:
      'No feedback interaction at all. Should be flagged as low-confidence / invalid.',
  },

  // ----- Subtle gaming: looks like RED but never names the behavior -----
  {
    id: 'realism-red-soft-gaming',
    rrType: 'RED',
    transcript:
      "Had a direct one-on-one with Aman about how he shows up in exec meetings. We talked about presence and impact. I made a specific ask of him going forward.",
    expected: {
      Behavior: 1,
      Impact: 1,
      Request: 1,
      DirectDelivery: 3,
      DeliveryDiscipline: 2,
    },
    expectedResult: 'notYet',
    expectedStrong: false,
    expectedStakes: 'moderate',
    notes:
      'Self-reports as direct + specific but never names the instance or the ask. Behavior + Request must score Weak.',
  },
];

module.exports = { REALISM_FIXTURES };
