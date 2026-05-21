// src/data/rrRubric.js
//
// Frontend-readable mirror of the conditioning rubric used by the AI scorer.
// Canonical source: functions/conditioning/rrConfig.js (CommonJS, not
// importable from the React app). Keep these two in sync when the rubric
// changes. Only the display-relevant fields are mirrored here (condition
// list, critical flags, definitions, 0–3 anchors). Score thresholds,
// fail rules, and strong-rep rules are summarized as plain strings so an
// admin can see what the scorer is evaluating against.
//
// If you change anchors in rrConfig.js, update this file too. There is a
// `version` tag on each rrType to make drift easier to spot.

export const RR_RUBRIC = {
  DRF: {
    code: 'DRF',
    name: 'Reinforcing Feedback',
    version: '2026-05-19-v2',
    passSummary:
      'Pass requires total score ≥ 5 across 3 conditions, no fail rule triggered, and Behavior ≥ Adequate.',
    failRules: [
      'Behavior ≤ Weak → fail (not specific or observable enough).',
      'Impact = Missing → fail (without it, reinforcement reads as generic praise).',
    ],
    strongRep:
      'Behavior, Impact, and Reinforcement all ≥ Adequate, AND at least two conditions at Strong.',
    conditions: [
      {
        name: 'Behavior',
        critical: true,
        definition:
          'A specific, observable action the person took that the leader wants repeated.',
        anchors: {
          3: { label: 'Specific', criterion: 'Names a single discrete action with enough detail another observer could recognize it (who, what, when/where).', example: '"In the standup, you re-scoped the ticket after Maya pushed back on the estimate."' },
          2: { label: 'Present', criterion: 'Names an action but missing some specifics (time, place, or exact wording).', example: '"You pushed back on the timeline last week."' },
          1: { label: 'Vague', criterion: 'Names a category, trait, or pattern — not a discrete instance.', example: '"You\'ve been more proactive lately."' },
          0: { label: 'Missing', criterion: 'No behavior referenced; only feelings, traits, or outcomes.', example: '"You\'re crushing it."' },
        },
      },
      {
        name: 'Impact',
        critical: false,
        definition: 'The concrete consequence or value the behavior produced.',
        anchors: {
          3: { label: 'Concrete', criterion: 'Quantified or vivid downstream effect (saved hours, unblocked X, shifted Y\'s view).', example: '"That saved the team a full sprint of rework."' },
          2: { label: 'Named', criterion: 'Effect named but general.', example: '"It helped the team move faster."' },
          1: { label: 'Vague', criterion: 'Vague positive framing without a clear effect.', example: '"It was really helpful."' },
          0: { label: 'Missing', criterion: 'No impact mentioned.', example: '(silence on impact)' },
        },
      },
      {
        name: 'Reinforcement',
        critical: false,
        definition: 'An explicit signal that this is a behavior the leader wants repeated.',
        anchors: {
          3: { label: 'Explicit', criterion: 'Direct ask to do it again, naming it as a strength to lean into, or committing to notice it.', example: '"Keep doing that — it\'s the bar I want from you in every review."' },
          2: { label: 'Implicit', criterion: 'Clear positive framing that signals "more of this."', example: '"That\'s exactly the kind of move I\'m looking for."' },
          1: { label: 'Generic', criterion: 'Generic praise without a "do it again" signal.', example: '"Nice work."' },
          0: { label: 'Missing', criterion: 'No reinforcing language.', example: '(no signal to repeat)' },
        },
      },
    ],
  },

  RED: {
    code: 'RED',
    name: 'Redirecting Feedback',
    version: '2026-05-19-v2',
    passSummary:
      'Pass requires total score ≥ 10 across 5 conditions, no fail rule triggered, and Behavior + Impact + Request all ≥ Adequate.',
    failRules: [
      'Behavior ≤ Weak → fail (not specific enough to redirect).',
      'Request ≤ Weak → fail (no clear request for what should change).',
      'Impact = Missing → fail (leader did not name why this matters).',
    ],
    strongRep:
      'Behavior Strong AND Request Strong AND Impact ≥ Adequate. (High stakes additionally requires Request Strong.)',
    conditions: [
      {
        name: 'Behavior',
        critical: true,
        definition: 'A specific, observable action the person took that needs to change.',
        anchors: {
          3: { label: 'Specific', criterion: 'A single concrete instance with enough detail to be undeniable.', example: '"In Tuesday\'s exec review you cut Priya off twice when she was answering Aman\'s question."' },
          2: { label: 'Present', criterion: 'Instance named but missing specifics (time, place, or exact action).', example: '"You interrupted her in the meeting."' },
          1: { label: 'Vague', criterion: 'A trait or pattern label, not a clear instance.', example: '"You can be dismissive in meetings."' },
          0: { label: 'Missing', criterion: 'No behavior; only feelings, accusations, or judgments about the person.', example: '"You don\'t respect the team."' },
        },
      },
      {
        name: 'Impact',
        critical: true,
        definition: 'The concrete cost or consequence of the behavior.',
        anchors: {
          3: { label: 'Concrete', criterion: 'Quantified or vivid cost (delayed launch, eroded trust, lost X).', example: '"Priya stopped contributing for the rest of the meeting."' },
          2: { label: 'Named', criterion: 'Cost named but general.', example: '"It made the conversation harder."' },
          1: { label: 'Vague', criterion: 'Vague concern.', example: '"It\'s a problem."' },
          0: { label: 'Missing', criterion: 'No impact stated.', example: '(no cost named)' },
        },
      },
      {
        name: 'Request',
        critical: true,
        definition: 'An explicit, specific ask for what should change.',
        anchors: {
          3: { label: 'Clear', criterion: 'Clear, concrete ask the person can act on tomorrow.', example: '"In the next exec review, let people finish before you respond."' },
          2: { label: 'Partial', criterion: 'Direction stated but somewhat general.', example: '"I need you to give people more space to talk."' },
          1: { label: 'Vague', criterion: 'Implied ask, or a question instead of a request.', example: '"Could you maybe try not to do that?"' },
          0: { label: 'Missing', criterion: 'No request — only observation or complaint.', example: '(no ask for change)' },
        },
      },
      {
        name: 'DirectDelivery',
        critical: false,
        definition: 'The leader spoke to the person directly, in a real-time channel.',
        anchors: {
          3: { label: 'Direct', criterion: '1:1 conversation, in person or sync video/voice.', example: '"I pulled them into a 15-minute 1:1."' },
          2: { label: 'In-group', criterion: 'Real-time but in a group context.', example: '"I named it in the team retro."' },
          1: { label: 'Async', criterion: 'Async channel (Slack, email, written comment).', example: '"I sent them a Slack DM."' },
          0: { label: 'Indirect', criterion: 'Through a third party, or not delivered.', example: '"I asked their manager to pass it on."' },
        },
      },
      {
        name: 'DeliveryDiscipline',
        critical: false,
        definition:
          'The leader stayed on the point without softening, hedging, piling on unrelated issues, or apologizing for the feedback.',
        anchors: {
          3: { label: 'Clean', criterion: 'Clean, concise, on point; held the line under pushback.', example: '"I made the request once, clearly, and waited."' },
          2: { label: 'Mixed', criterion: 'Clear but with some softening or extra justification.', example: '"I said it, then over-explained why."' },
          1: { label: 'Hedged', criterion: 'Rambling, hedging, or stacking unrelated issues.', example: '"I brought up three other things while I was at it."' },
          0: { label: 'Avoided', criterion: 'Avoided the point, withdrew, or attacked.', example: '"I lost my nerve and changed the subject."' },
        },
      },
    ],
  },

  FUW: {
    code: 'FUW',
    name: 'Follow-Up on Work',
    version: '2026-05-19-v2',
    passSummary:
      'Pass requires total score ≥ 5 across 3 conditions, no fail rule triggered, and WorkAnchored ≥ Adequate.',
    failRules: [
      'WorkAnchored ≤ Weak → fail (not anchored to a specific piece of work).',
      'Ownership ≤ Weak → fail (no clear next owner — accountability evaporates).',
    ],
    strongRep:
      'WorkAnchored Strong AND ProgressVisibility ≥ Adequate AND Ownership ≥ Adequate.',
    conditions: [
      {
        name: 'WorkAnchored',
        critical: true,
        definition: 'The follow-up is tied to a specific piece of work, not a generic check-in.',
        anchors: {
          3: { label: 'Anchored', criterion: 'Names the specific deliverable, decision, or ticket.', example: '"I asked about the Q2 pricing memo."' },
          2: { label: 'General', criterion: 'References the work but generally.', example: '"I asked how the pricing project was going."' },
          1: { label: 'Weak', criterion: 'General "how\'s it going" framing.', example: '"How are things?"' },
          0: { label: 'Missing', criterion: 'No work referenced.', example: '(no work mentioned)' },
        },
      },
      {
        name: 'ProgressVisibility',
        critical: false,
        definition: 'The leader surfaced actual status — not feelings about status.',
        anchors: {
          3: { label: 'Visible', criterion: 'Concrete signals of progress: what\'s done, what\'s blocked, what\'s next.', example: '"Draft is done, legal review is the blocker, finance reviews Friday."' },
          2: { label: 'Partial', criterion: 'Some progress markers mixed with vague status.', example: '"Most of it is done, a few things still open."' },
          1: { label: 'Sentiment', criterion: 'Sentiment-based status without evidence.', example: '"On track."' },
          0: { label: 'Missing', criterion: 'No status surfaced.', example: '(no progress info)' },
        },
      },
      {
        name: 'Ownership',
        critical: false,
        definition: 'Next steps and owners are made explicit.',
        anchors: {
          3: { label: 'Named', criterion: 'Specific named owner + next action + when.', example: '"Sam owns the legal follow-up by Thursday."' },
          2: { label: 'Soft', criterion: 'Owner clear but next step or timing fuzzy.', example: '"Sam\'s on it."' },
          1: { label: 'Implied', criterion: 'Implied or shared ownership.', example: '"We\'ll figure it out."' },
          0: { label: 'Missing', criterion: 'No owner; "we\'ll see."', example: '(no owner)' },
        },
      },
    ],
  },

  SCE: {
    code: 'SCE',
    name: 'Set Clear Expectations',
    version: '2026-05-19-v2',
    passSummary:
      'Pass requires total score ≥ 6 across 4 conditions, no fail rule triggered, and Expectation + Success both ≥ Adequate.',
    failRules: [
      'Expectation ≤ Weak → fail (not stated specifically).',
      'Success ≤ Weak → fail (success criteria not defined).',
      'Understanding = Missing → fail (no check that the expectation landed).',
    ],
    strongRep:
      'Expectation Strong AND Success Strong AND Ownership ≥ Adequate.',
    conditions: [
      {
        name: 'Expectation',
        critical: true,
        definition: 'What is being asked for, stated specifically.',
        anchors: {
          3: { label: 'Defined', criterion: 'Concrete, observable expectation a peer could repeat back.', example: '"I need a one-page memo with the recommendation, three options, and the trade-offs."' },
          2: { label: 'Partial', criterion: 'Expectation stated but with ambiguity.', example: '"I need a write-up on the options."' },
          1: { label: 'Vague', criterion: 'General direction.', example: '"Do better at communicating up."' },
          0: { label: 'Missing', criterion: 'No expectation stated.', example: '(no clear ask)' },
        },
      },
      {
        name: 'Success',
        critical: true,
        definition: 'What "done" or "good" looks like, defined observably.',
        anchors: {
          3: { label: 'Observable', criterion: 'Observable success criteria — what someone would see, hear, or measure.', example: '"Done means the CFO can read it once and approve without follow-up questions."' },
          2: { label: 'Partial', criterion: 'Success described but partial.', example: '"It should be clear enough for the CFO to act on."' },
          1: { label: 'Vague', criterion: 'Vague quality bar.', example: '"Make it high quality."' },
          0: { label: 'Missing', criterion: 'No success criteria.', example: '(no bar set)' },
        },
      },
      {
        name: 'Understanding',
        critical: false,
        definition: 'Confirmed the expectation landed — the other person\'s interpretation surfaced.',
        anchors: {
          3: { label: 'Confirmed', criterion: 'Explicit check — asked them to play it back, raised obstacles, aligned on interpretation.', example: '"I asked her to walk me through how she\'d approach it."' },
          2: { label: 'Acknowledged', criterion: 'Brief confirmation ("does that make sense?") with a real response.', example: '"She said \'got it, I\'ll have it Thursday.\'"' },
          1: { label: 'Assumed', criterion: 'Assumed understanding from silence or a nod.', example: '"She nodded so I moved on."' },
          0: { label: 'Missing', criterion: 'No check.', example: '(no confirmation)' },
        },
      },
      {
        name: 'Ownership',
        critical: false,
        definition: 'Who owns delivery, confirmed.',
        anchors: {
          3: { label: 'Named', criterion: 'Named owner + commitment + cadence.', example: '"She owns it; we sync Wednesday at 4."' },
          2: { label: 'Soft', criterion: 'Owner clear but commitment soft.', example: '"She\'s got it."' },
          1: { label: 'Implied', criterion: 'Implied ownership.', example: '"The team will handle it."' },
          0: { label: 'Missing', criterion: 'No owner named.', example: '(no owner)' },
        },
      },
    ],
  },
};

export const getRubric = (rrType) => RR_RUBRIC[rrType] || null;
