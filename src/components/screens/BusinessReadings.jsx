
/* eslint-disable no-console */
import React, { useState, useMemo, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';
import {
  BookOpen, Target, CheckCircle, Clock, AlertTriangle,
  MessageSquare, Filter, TrendingUp, Star, Search as SearchIcon
} from 'lucide-react';

/* =========================================================
   HIGH-CONTRAST PALETTE
========================================================= */
const COLORS = {
  BG: '#FFFFFF',
  SURFACE: '#FFFFFF',
  BORDER: '#1F2937',
  SUBTLE: '#E5E7EB',
  TEXT: '#0F172A',
  MUTED: '#4B5563',
  NAVY: '#0B3B5B',
  TEAL: '#219E8B',
  BLUE: '#2563EB',
  ORANGE: '#E04E1B',
  GREEN: '#10B981',
  AMBER: '#F59E0B',
  RED: '#EF4444',
};

const COMPLEXITY_MAP = {
  Low:    { label: 'Novice',       hex: COLORS.GREEN, icon: CheckCircle },
  Medium: { label: 'Intermediate', hex: COLORS.AMBER, icon: AlertTriangle },
  High:   { label: 'Expert',       hex: COLORS.RED,   icon: Target },
};

/* =========================================================
   ExecSwitch (inline, safe)
========================================================= */
const ExecSwitch = ({ checked, onChange }) => {
  const toggle = () => onChange(!checked);
  const onKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
  };
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={toggle}
        onKeyDown={onKey}
        className="relative inline-flex items-center"
        style={{ width: 46, height: 26 }}
      >
        <span
          style={{
            position: 'absolute',
            inset: 0,
            background: checked ? COLORS.ORANGE : '#9CA3AF',
            borderRadius: 9999,
            transition: 'background .15s ease'
          }}
        />
        <span
          style={{
            position: 'relative',
            left: checked ? 22 : 2,
            width: 22,
            height: 22,
            background: '#FFFFFF',
            borderRadius: '9999px',
            boxShadow: '0 1px 2px rgba(0,0,0,.2)',
            transition: 'left .15s ease'
          }}
        />
      </button>
      <span style={{ color: COLORS.NAVY, fontWeight: 600 }}>Executive Brief</span>
    </div>
  );
};

/* =========================================================
   MOCK BOOKS (fallback if context has none)
========================================================= */
const MOCK_ALL_BOOKS = {
  'Strategy & Execution': [
    { id: 's_e_1', title: 'The E-Myth Revisited', author: 'Michael E. Gerber', theme: 'Why most small businesses fail and how to build a scalable system.', complexity: 'Medium', duration: 180, focus: 'Delegation, Process Mapping, Systemization' },
    { id: 's_e_2', title: 'Good to Great', author: 'Jim Collins', theme: 'How some companies make the leap to enduring greatness.', complexity: 'High', duration: 240, focus: 'Level 5 Leadership, Hedgehog Concept, Discipline' },
    { id: 's_e_3', title: 'Measure What Matters', author: 'John Doerr', theme: 'Achieving ambitious goals using OKRs.', complexity: 'Medium', duration: 200, focus: 'Goal Setting, Quarterly Planning, Accountability' },
    { id: 's_e_4', title: 'Getting Things Done', author: 'David Allen', theme: 'Stress-free productivity with GTD.', complexity: 'Low', duration: 150, focus: 'Task Management, Workflow Design, Capture' },
    { id: 's_e_5', title: 'Playing to Win', author: 'A.G. Lafley & Roger L. Martin', theme: 'A practical guide to strategy as choice.', complexity: 'High', duration: 220, focus: 'Strategy Choices, Capabilities, Management Systems' },
    { id: 's_e_6', title: 'Blue Ocean Strategy', author: 'W. Chan Kim & Renée Mauborgne', theme: 'Create uncontested market space.', complexity: 'High', duration: 230, focus: 'Value Innovation, Noncustomers, Strategy Canvas' },
  ],
  'People & Culture': [
    { id: 'p_c_1', title: 'Dare to Lead', author: 'Brené Brown', theme: 'Courageous leadership by embracing vulnerability and trust.', complexity: 'Medium', duration: 210, focus: 'Psychological Safety, Feedback, Vulnerability' },
    { id: 'p_c_2', title: 'The Five Dysfunctions of a Team', author: 'Patrick Lencioni', theme: 'Common pitfalls that prevent teams from working.', complexity: 'Low', duration: 150, focus: 'Team Building, Conflict Management, Trust' },
    { id: 'p_c_3', title: 'Radical Candor', author: 'Kim Scott', theme: 'Challenging directly while caring personally.', complexity: 'Medium', duration: 190, focus: 'Feedback Delivery, Coaching, Guidance' },
    { id: 'p_c_4', title: 'Leaders Eat Last', author: 'Simon Sinek', theme: 'Building trust and safety in teams.', complexity: 'Low', duration: 200, focus: 'Trust, Empathy, Team Cohesion' },
    { id: 'p_c_5', title: 'No Rules Rules', author: 'Reed Hastings & Erin Meyer', theme: 'Netflix and the culture of reinvention.', complexity: 'High', duration: 240, focus: 'Candor, Talent Density, Freedom & Responsibility' },
  ],
  'Self-Awareness & Growth': [
    { id: 's_a_1', title: 'Atomic Habits', author: 'James Clear', theme: 'Build good habits by tiny improvements.', complexity: 'Low', duration: 180, focus: 'Habit Formation, Self-Discipline, Identity' },
    { id: 's_a_2', title: 'Mindset', author: 'Carol Dweck', theme: 'Fixed vs Growth Mindsets.', complexity: 'Medium', duration: 190, focus: 'Growth Mindset, Resilience, Learning' },
    { id: 's_a_3', title: 'Essentialism', author: 'Greg McKeown', theme: 'Pursue the essential, eliminate the rest.', complexity: 'Low', duration: 160, focus: 'Prioritization, Saying No, Focus' },
    { id: 's_a_4', title: 'Deep Work', author: 'Cal Newport', theme: 'Rules for focused success in a distracted world.', complexity: 'Medium', duration: 200, focus: 'Focus, Attention, Productivity' },
    { id: 's_a_5', title: 'The First 90 Days', author: 'Michael D. Watkins', theme: 'Strategies for leaders in transition.', complexity: 'Medium', duration: 210, focus: 'Onboarding, Alignment, Early Wins' },
  ],
  'Innovation & Change': [
    { id: 'i_c_1', title: 'The Lean Startup', author: 'Eric Ries', theme: 'Build-measure-learn with continuous innovation.', complexity: 'High', duration: 250, focus: 'MVP, Build-Measure-Learn, Iteration' },
    { id: 'i_c_2', title: 'Start With Why', author: 'Simon Sinek', theme: 'The Golden Circle and purpose-driven leadership.', complexity: 'Medium', duration: 180, focus: 'Golden Circle, Purpose-Driven, Inspiration' },
    { id: 'i_c_3', title: "The Innovator's Dilemma", author: 'Clayton Christensen', theme: 'Why great firms fail when technologies change.', complexity: 'High', duration: 240, focus: 'Disruption, Value Networks, Technology S-Curves' },
    { id: 'i_c_4', title: 'Switch', author: 'Chip & Dan Heath', theme: 'How to change things when change is hard.', complexity: 'Low', duration: 180, focus: 'Rider-Elephant-Path, Behavior Change, Influence' },
  ],
  'Sales & Influence': [
    { id: 's_i_1', title: 'Influence', author: 'Robert Cialdini', theme: 'The psychology of persuasion.', complexity: 'Medium', duration: 210, focus: 'Reciprocity, Social Proof, Scarcity' },
    { id: 's_i_2', title: 'Never Split the Difference', author: 'Chris Voss', theme: 'Negotiation lessons from the FBI.', complexity: 'Medium', duration: 210, focus: 'Mirroring, Labeling, Tactical Empathy' },
    { id: 's_i_3', title: 'SPIN Selling', author: 'Neil Rackham', theme: 'Consultative selling framework.', complexity: 'Medium', duration: 200, focus: 'Situation, Problem, Implication, Need-Payoff' },
    { id: 's_i_4', title: 'The Challenger Sale', author: 'Matthew Dixon & Brent Adamson', theme: 'Teach, Tailor, and Take Control.', complexity: 'High', duration: 220, focus: 'Reframing, Commercial Insight, Control' },
    { id: 's_i_5', title: 'To Sell Is Human', author: 'Daniel H. Pink', theme: 'Everyone is in sales now.', complexity: 'Low', duration: 180, focus: 'Attunement, Buoyancy, Clarity' },
  ],
  'Product & Design': [
    { id: 'p_d_1', title: 'Inspired', author: 'Marty Cagan', theme: 'How to create tech products customers love.', complexity: 'High', duration: 240, focus: 'Discovery, Empowered Teams, Product Strategy' },
    { id: 'p_d_2', title: 'Lean UX', author: 'Jeff Gothelf', theme: 'Collaborative design for agile teams.', complexity: 'Medium', duration: 200, focus: 'Hypotheses, Experiments, Collaboration' },
    { id: 'p_d_3', title: 'Hooked', author: 'Nir Eyal', theme: 'How to build habit-forming products.', complexity: 'Medium', duration: 190, focus: 'Triggers, Actions, Variable Rewards' },
    { id: 'p_d_4', title: 'Sprint', author: 'Jake Knapp', theme: 'Solve big problems and test new ideas in five days.', complexity: 'Low', duration: 170, focus: 'Prototyping, Testing, Speed' },
    { id: 'p_d_5', title: "Don't Make Me Think", author: 'Steve Krug', theme: 'Common-sense approach to web usability.', complexity: 'Low', duration: 150, focus: 'Usability, Navigation, Clarity' },
  ],
  'Finance & Decision-Making': [
    { id: 'f_d_1', title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', theme: 'Two systems of thought and their biases.', complexity: 'High', duration: 260, focus: 'Heuristics, Biases, Decision Hygiene' },
    { id: 'f_d_2', title: 'The Psychology of Money', author: 'Morgan Housel', theme: 'Timeless lessons on wealth, greed, and happiness.', complexity: 'Low', duration: 180, focus: 'Behavioral Finance, Risk, Compounding' },
    { id: 'f_d_3', title: 'Financial Intelligence', author: 'Karen Berman & Joe Knight', theme: "A manager's guide to knowing what the numbers really mean.", complexity: 'Medium', duration: 210, focus: 'Income Statement, Cash Flow, Ratios' },
    { id: 'f_d_4', title: 'Superforecasting', author: 'Philip Tetlock & Dan Gardner', theme: 'The art and science of prediction.', complexity: 'High', duration: 220, focus: 'Calibration, Fermi Estimates, Aggregation' },
  ],
  'Communication & Writing': [
    { id: 'c_w_1', title: 'Made to Stick', author: 'Chip & Dan Heath', theme: 'Why some ideas survive and others die.', complexity: 'Low', duration: 180, focus: 'Simplicity, Unexpectedness, Stories' },
    { id: 'c_w_2', title: 'On Writing Well', author: 'William Zinsser', theme: 'Fundamentals of clear non-fiction writing.', complexity: 'Low', duration: 180, focus: 'Clarity, Brevity, Voice' },
    { id: 'c_w_3', title: 'Storytelling with Data', author: 'Cole Nussbaumer Knaflic', theme: 'Effective data communication.', complexity: 'Medium', duration: 200, focus: 'Charts, Context, Narrative' },
    { id: 'c_w_4', title: 'Confessions of a Public Speaker', author: 'Scott Berkun', theme: 'Real-world lessons for presentations.', complexity: 'Low', duration: 170, focus: 'Delivery, Anxiety, Audience' },
  ],
};

/* =========================================================
   PER-BOOK ACTION PLANS (tailored)
========================================================= */
function getActionSteps(book) {
  const t = (book.title || '').toLowerCase();
  const foci = (book.focus || '').split(',').map(s => s.trim()).filter(Boolean);
  const steps = [];
  const add = (...arr) => steps.push(...arr);

  // ---- Strategy & Execution ----
  if (t.includes('e-myth')) {
    add(
      'Map one repeatable process (5–7 steps) and write a 1‑page SOP.',
      'Pilot the SOP with one person; refine based on defects/rework.',
      'Create a “Definition of Done” checklist and attach it to the SOP.',
      'Delegate the checklist, not the task; review output weekly.'
    );
  } else if (t.includes('good to great')) {
    add(
      'Draft your Hedgehog: Passion ∩ Best‑in‑World ∩ Economic Engine (metric per revenue driver).',
      'Run “First Who, Then What”: define 3 non‑negotiable behaviors; adjust hiring/roles accordingly.',
      'Create a Stop‑Doing list (3 items) that violates the Hedgehog; stop or sunset each within 30 days.'
    );
  } else if (t.includes('measure what matters')) {
    add(
      'Write 1 Objective and 3–4 measurable Key Results for this quarter.',
      'Set weekly KR check‑ins with confidence scores (0.0–1.0).',
      'Retrospective at mid‑quarter: drop or adjust one KR to focus on impact.'
    );
  } else if (t.includes('getting things done')) {
    add(
      'Do a 30‑minute “capture sweep” (inbox, notes, mind).',
      'Clarify the next physical action for each item (2 minutes or less → do it).',
      'Create 3 contexts (e.g., @Computer, @Meetings, @Errands) and move tasks accordingly.'
    );
  } else if (t.includes('playing to win')) {
    add(
      'Write the 5 choices: Winning Aspiration → Where to Play → How to Win → Capabilities → Management Systems.',
      'Pick 1 “Where to Play” segment and test a “How to Win” hypothesis with a lightweight experiment.',
      'Align capabilities: list top 3 gaps and assign owners to close them.'
    );
  } else if (t.includes('blue ocean')) {
    add(
      'Interview 5 non‑customers; capture top reasons they don’t buy.',
      'Build an ERRC grid (Eliminate, Reduce, Raise, Create) for your value curve.',
      'Prototype one “Create” move and test with 5 prospects within two weeks.'
    );
  }

  // ---- People & Culture ----
  else if (t.includes('dare to lead')) {
    add(
      'Schedule a 60‑min “rumble” with a peer to practice candid conversation with clear agreements.',
      'Add a weekly “permission slip” ritual (what you’ll do bravely, what help you need).',
      'Define 2 team norms that signal psychological safety; publish and model them.'
    );
  } else if (t.includes('five dysfunctions')) {
    add(
      'Run a trust exercise: share one failure + one current risk; respond only with curiosity.',
      'Add a “disagree‑and‑commit” line to meeting notes; track decisions and follow‑through.',
      'Implement a visible scoreboard for one team objective.'
    );
  } else if (t.includes('radical candor')) {
    add(
      'Ask your team: “What’s one thing I could do better?” then act on one item within a week.',
      'Use situation‑behavior‑impact (SBI) for feedback in your next 1:1.',
      'Schedule 10‑minute “guidance moments” immediately after key meetings.'
    );
  } else if (t.includes('leaders eat last')) {
    add(
      'Run a “safety check” once a week: what would make next week safer to speak up?',
      'Recognize one quiet positive behavior publicly every standup.',
      'Protect a team boundary (capacity/interruptions) and report the impact.'
    );
  } else if (t.includes('no rules rules')) {
    add(
      'Raise talent density: define the bar; exit one “good‑but‑not‑great” responsibility (reassign or stop).',
      'Start a candor round: 30 minutes of written feedback, then discuss themes.',
      'Replace one policy with a principle and a guardrail.'
    );
  }

  // ---- Self-Awareness & Growth ----
  else if (t.includes('atomic habits')) {
    add(
      'Pick one keystone habit; write it as Habit Stack: “After [current], I will [new], then [small reward]”.',
      'Make it obvious: place the cue in your workspace; remove one friction for the first action.',
      'Track a 7‑day streak; if broken, never miss twice.'
    );
  } else if (t.includes('mindset')) {
    add(
      'Rewrite one failure story as a learning narrative; share the tweak you’ll try next time.',
      'Introduce “yet” language in team reviews (e.g., “we haven’t hit X yet”).',
      'Choose one skill and set a 30‑day deliberate practice plan (feedback loop + reps).'
    );
  } else if (t.includes('essentialism')) {
    add(
      'List 3 essential outcomes for this quarter; say no to one non‑essential project this week.',
      'Schedule a weekly 90‑minute “priority protect” block.',
      'Define a “minimum viable progress” you’ll ship every Friday.'
    );
  } else if (t.includes('deep work')) {
    add(
      'Block 2 × 90‑minute deep work sessions per week; pick one task per block.',
      'Set a “shutdown ritual” checklist to end the day.',
      'Track distraction sources; remove one app from the first screen of your phone.'
    );
  } else if (t.includes('first 90 days')) {
    add(
      'Draft a 30‑60‑90 plan with learning goals, relationship map, and early wins.',
      'Schedule 8 stakeholder interviews; ask “What does success look like in 6 months?”',
      'Ship one visible win by day 45 and broadcast the story/metrics.'
    );
  }

  // ---- Innovation & Change ----
  else if (t.includes('lean startup')) {
    add(
      'Define riskiest assumption; design a testable hypothesis with a pass/fail metric.',
      'Ship a landing page or concierge MVP to 5 target users; collect qualitative feedback.',
      'Decide to persevere, pivot, or pause based on evidence.'
    );
  } else if (t.includes('start with why')) {
    add(
      'Write your Golden Circle: Why → How → What in 3 short sentences.',
      'Audit one touchpoint; make “Why” the opening line.',
      'Create a story snippet (problem → belief → promise) for the team to repeat.'
    );
  } else if (t.includes("innovator's dilemma")) {
    add(
      'Identify a disruptive wedge; set up a small, separate team with its own P&L.',
      'Define success by learning metrics first (not revenue).',
      'Pilot with non‑customers or over‑served segments.'
    );
  } else if (t.includes('switch')) {
    add(
      'Find the bright spot; copy the first step exactly for one more team.',
      'Script the critical move (one behavior) and remove one friction in the path.',
      'Motivate the Elephant: show a before/after to make progress feel visible.'
    );
  }

  // ---- Sales & Influence ----
  else if (t.includes('influence')) {
    add(
      'Pick 2 principles (e.g., Social Proof + Scarcity) and design one experiment per principle.',
      'Rewrite a CTA to include a credible signal (testimonial, numbers, time bound).',
      'Add a pre‑commitment step for the next campaign.'
    );
  } else if (t.includes('never split the difference')) {
    add(
      'Practice mirroring (last 1–3 words) and labeling (“it seems…”) in your next negotiation.',
      'Prepare two calibrated questions starting with “How” or “What”.',
      'Set your “no‑deal” conditions before the meeting.'
    );
  } else if (t.includes('spin selling')) {
    add(
      'Write 3 SPIN question sets for your next discovery call.',
      'Capture one implied need and convert it to an explicit need.',
      'Summarize value in a need‑payoff statement and verify it with the buyer.'
    );
  } else if (t.includes('challenger sale')) {
    add(
      'Draft one Commercial Insight that reframes a costly status quo.',
      'Tailor the message to one stakeholder’s KPIs; prepare a “teach” moment.',
      'Plan the “take control” close with next steps and mutual plan.'
    );
  } else if (t.includes('to sell is human')) {
    add(
      'Write a problem‑finding question; ask it in your next customer chat.',
      'Create a “5‑second elevator pitch” (single sentence with contrast).',
      'Set up a weekly buoyancy ritual: positive self‑talk + one micro‑win log.'
    );
  }

  // ---- Product & Design ----
  else if (t.includes('inspired')) {
    add(
      'Define a product outcome (not feature) and 3 opportunity areas.',
      'Run 5 discovery interviews this week; capture pains and JTBD.',
      'Create a lightweight product principles doc for the squad.'
    );
  } else if (t.includes('lean ux')) {
    add(
      'Write a testable hypothesis and success metric; design the smallest experiment.',
      'Pair with engineering to prototype in 24–48 hours.',
      'Run an assumption mapping workshop with the squad.'
    );
  } else if (t.includes('hooked')) {
    add(
      'Map the Hook: Trigger → Action → Variable Reward → Investment for your product.',
      'Instrument one variable reward loop and measure time‑to‑value.',
      'Add a small user investment right after the first success.'
    );
  } else if (t.includes('sprint')) {
    add(
      'Schedule a 5‑day sprint; recruit 5 users now.',
      'Pick one critical assumption; storyboard a happy path.',
      'Prototype by day 4; test on day 5 and decide.'
    );
  } else if (t.includes("don't make me think")) {
    add(
      'Run a 5‑user hallway usability test; note top 3 friction points.',
      'Reduce copy on one key page by 30% while preserving meaning.',
      'Improve the affordance of one primary action (contrast, label, placement).'
    );
  }

  // ---- Finance & Decision-Making ----
  else if (t.includes('thinking, fast and slow')) {
    add(
      'Run a pre‑mortem on a current decision; list 5 ways it fails.',
      'Separate noise from signal: compute a base rate before estimating.',
      'Add a “checklist for bias” to your next review.'
    );
  } else if (t.includes('psychology of money')) {
    add(
      'Write your personal risk story (loss tolerance, time horizon).',
      'Automate a small monthly “pay yourself first”.',
      'Choose one behavior to avoid (FOMO trades, lifestyle creep) and track it.'
    );
  } else if (t.includes('financial intelligence')) {
    add(
      'Trace one decision through the 3 statements (IS → BS → CF).',
      'Define one operating metric and a cash metric for your team.',
      'Review a variance report and propose one correction.'
    );
  } else if (t.includes('superforecasting')) {
    add(
      'Break a forecast into two factors (outside view + inside view).',
      'Write a short rationale and a date to score the prediction.',
      'Update the forecast with new evidence monthly.'
    );
  }

  // ---- Communication & Writing ----
  else if (t.includes('made to stick')) {
    add(
      'Rewrite one idea with SUCCESs: Simple, Unexpected, Concrete, Credible, Emotional, Story.',
      'Add a concrete example and a number to your next memo.',
      'Test understanding: ask one person to explain it back in their words.'
    );
  } else if (t.includes('on writing well')) {
    add(
      'Cut 20% of words from a page; remove filler and passive voice.',
      'Use strong nouns/verbs; limit adjectives to essentials.',
      'Write a compelling lead and one clean transition.'
    );
  } else if (t.includes('storytelling with data')) {
    add(
      'Choose the right chart for the question; strip non‑data ink.',
      'Write the takeaway as the chart title (complete sentence).',
      'Add an annotation at the key point; test with a non‑expert.'
    );
  } else if (t.includes('confessions of a public speaker')) {
    add(
      'Run a 10‑minute rehearsal to find and cut rough spots.',
      'Design openings: story, question, or startling fact.',
      'Record and review one talk; pick one improvement.'
    );
  }

  // ---- Fallback using focus tags ----
  if (steps.length === 0) {
    const focusBased = [
      foci[0] ? `Apply “${foci[0]}” to one current project this week; define a small, visible outcome.` : 'Pick one chapter idea and apply it to a live project this week.',
      foci[1] ? `Teach “${foci[1]}” to a peer; ask for one improvement suggestion.` : 'Share your plan with a peer for feedback.',
      'Define one metric to watch; write down expected movement in 14 days.'
    ];
    add(...focusBased);
  }
  return steps.slice(0, 4);
}

/* =========================================================
   PER-BOOK KEY FRAMEWORKS (tailored)
========================================================= */
function getFrameworks(book) {
  const t = (book.title || '').toLowerCase();
  const items = [];
  const add = (name, desc) => items.push({ name, desc });

  // Strategy & Execution
  if (t.includes('e-myth')) {
    add('E‑Myth Roles', 'Entrepreneur (vision), Manager (systems), Technician (doing) — balance across roles.');
    add('Franchise Prototype', 'Document processes so work is system‑dependent, not people‑dependent.');
    add('SOP + DoD', 'Standard operating procedures with a clear “Definition of Done”.');
  } else if (t.includes('good to great')) {
    add('Level 5 Leadership', 'Personal humility + fierce resolve; puts company first.');
    add('Hedgehog Concept', 'Passion ∩ Best‑in‑World ∩ Economic Engine (single economic denominator).');
    add('Flywheel & Stop‑Doing', 'Small wins accumulate; stop distractions that break momentum.');
  } else if (t.includes('measure what matters')) {
    add('OKRs', 'Ambitious Objectives + measurable Key Results; public, quarterly cadence.');
    add('CFRs', 'Conversations, Feedback, Recognition — sustains progress between OKR checks.');
  } else if (t.includes('getting things done')) {
    add('GTD Five Steps', 'Capture → Clarify → Organize → Reflect → Engage.');
    add('Contexts & Two‑Minute Rule', 'Do it if <2 minutes; otherwise organize by context.');
  } else if (t.includes('playing to win')) {
    add('Five Choices', 'Winning Aspiration → Where to Play → How to Win → Capabilities → Systems.');
    add('Strategy as Choice', 'Focus on coherent choices and the capabilities that enable them.');
  } else if (t.includes('blue ocean')) {
    add('ERRC Grid', 'Eliminate, Reduce, Raise, Create — reshape value curve.');
    add('Strategy Canvas', 'Visualize factors of competition and pursue noncustomers.');
  }

  // People & Culture
  else if (t.includes('dare to lead')) {
    add('BRAVING Trust', 'Boundaries, Reliability, Accountability, Vault, Integrity, Non‑judgment, Generosity.');
    add('Rumble Skills', 'Clear is kind: candid yet caring conversations with explicit agreements.');
  } else if (t.includes('five dysfunctions')) {
    add('Dysfunctions Pyramid', 'Absence of Trust → Fear of Conflict → Lack of Commitment → Avoidance of Accountability → Inattention to Results.');
  } else if (t.includes('radical candor')) {
    add('Candor Quadrants', 'Caring Personally × Challenging Directly; aim for Radical Candor.');
    add('Guidance Culture', 'Normalize asking for criticism and giving specific, kind feedback.');
  } else if (t.includes('leaders eat last')) {
    add('Circle of Safety', 'Leaders create safety that enables cooperation and risk‑taking.');
  } else if (t.includes('no rules rules')) {
    add('Talent Density', 'Fewer, better people + candid feedback + freedom with responsibility.');
  }

  // Self
  else if (t.includes('atomic habits')) {
    add('Four Laws', 'Make it Obvious, Attractive, Easy, Satisfying; invert to break bad habits.');
    add('Identity‑Based Habits', 'Become the type of person who… then act as that identity.');
  } else if (t.includes('mindset')) {
    add('Growth vs Fixed', 'Abilities can be developed through effort, strategies, and feedback.');
  } else if (t.includes('essentialism')) {
    add('Trade‑offs', 'Do less, but better; ruthless prioritization and saying no.');
  } else if (t.includes('deep work')) {
    add('Deep vs Shallow', 'Schedule long, distraction‑free blocks; protect attention as a resource.');
  } else if (t.includes('first 90 days')) {
    add('STARS', 'Startup, Turnaround, Accelerated Growth, Realignment, Sustaining Success.');
  }

  // Innovation
  else if (t.includes('lean startup')) {
    add('Build‑Measure‑Learn', 'Rapid cycles with MVPs; validate assumptions with real users.');
    add('Innovation Accounting', 'Measure learning progress, not just revenue early on.');
  } else if (t.includes('start with why')) {
    add('Golden Circle', 'Start with WHY → HOW → WHAT for resonance and consistency.');
  } else if (t.includes("innovator's dilemma")) {
    add('Disruptive Innovation', 'Entrants succeed by targeting overlooked segments with simpler, cheaper offers.');
  } else if (t.includes('switch')) {
    add('Rider‑Elephant‑Path', 'Direct the rational mind, motivate emotion, shape the environment.');
  }

  // Sales & Influence
  else if (t.includes('influence')) {
    add('Six Principles', 'Reciprocity, Commitment, Social Proof, Authority, Liking, Scarcity.');
  } else if (t.includes('never split the difference')) {
    add('Tactical Empathy', 'Mirroring, labeling, calibrated questions, late‑night FM DJ voice.');
  } else if (t.includes('spin selling')) {
    add('SPIN', 'Situation, Problem, Implication, Need‑Payoff for consultative discovery.');
  } else if (t.includes('challenger sale')) {
    add('Teach‑Tailor‑Take Control', 'Commercial insight that reframes thinking and drives action.');
  } else if (t.includes('to sell is human')) {
    add('Attunement‑Buoyancy‑Clarity', 'Understand others, stay resilient, and clarify problems worth solving.');
  }

  // Product & Design
  else if (t.includes('inspired')) {
    add('Empowered Teams', 'Product teams own outcomes; discovery reduces waste.');
  } else if (t.includes('lean ux')) {
    add('Hypothesis‑Driven', 'Collaborative, outcome‑oriented design with rapid experiments.');
  } else if (t.includes('hooked')) {
    add('Hook Model', 'Trigger → Action → Variable Reward → Investment forms habits.');
  } else if (t.includes('sprint')) {
    add('Design Sprint', 'Five days: map, sketch, decide, prototype, test.');
  } else if (t.includes("don't make me think")) {
    add('Usability Heuristics', 'Clarity, obvious navigation, and self‑evident actions.');
  }

  // Finance & Decision
  else if (t.includes('thinking, fast and slow')) {
    add('System 1 & 2', 'Fast, intuitive vs slow, analytical; watch for predictable biases.');
  } else if (t.includes('psychology of money')) {
    add('Behavioral Finance', 'Time horizon, survivorship bias, tails drive results.');
  } else if (t.includes('financial intelligence')) {
    add('3 Statements', 'Income Statement, Balance Sheet, Cash Flow: read them together.');
  } else if (t.includes('superforecasting')) {
    add('Bayesian Updates', 'Use base rates; update beliefs with evidence; score with Brier.');
  }

  // Communication
  else if (t.includes('made to stick')) {
    add('SUCCESs', 'Simple, Unexpected, Concrete, Credible, Emotional, Story.');
  } else if (t.includes('on writing well')) {
    add('Clarity First', 'Cut clutter; strong nouns/verbs; clean structure.');
  } else if (t.includes('storytelling with data')) {
    add('Narrative Charts', 'Title as takeaway; declutter; annotate meaning.');
  } else if (t.includes('confessions of a public speaker')) {
    add('Practice Loop', 'Iterate via rehearsal, recording, and focused edits.');
  }

  if (items.length === 0) {
    // Fallback: derive from focus tags
    const foci = (book.focus || '').split(',').map(s => s.trim()).filter(Boolean);
    if (foci[0]) add(foci[0], 'Apply this lens to decisions and process design this month.');
    if (foci[1]) add(foci[1], 'Teach this concept to a peer to solidify understanding.');
    if (items.length === 0) add('Core Principles', 'Prioritize outcomes, feedback loops, and small, testable steps.');
  }

  return items.slice(0, 4);
}

/* =========================================================
   LIGHTWEIGHT HTML SANITIZER (allow basic tags/attrs only)
========================================================= */
function sanitizeHTML(dirty) {
  if (!dirty || typeof dirty !== 'string') return '';
  let clean = dirty.replace(/<\/?(script|style)[^>]*>/gi, '');
  clean = clean.replace(/\son\w+="[^"]*"/gi, '');
  clean = clean.replace(/\son\w+='[^']*'/gi, '');
  clean = clean.replace(/(href|src)\s*=\s*"(javascript:[^"]*)"/gi, '$1="#"');
  clean = clean.replace(/(href|src)\s*=\s*'(javascript:[^']*)'/gi, '$1="#"');
  return clean;
}

/* =========================================================
   AI COACH (LOCAL TIPS FALLBACK)
========================================================= */
const mockAIResponse = (bookTitle, focusAreas, query) => {
  const q = (query || '').toLowerCase();
  if (bookTitle.includes('E-Myth')) {
    if (q.includes('delegate') || q.includes('system') || q.includes('hand off')) {
      return `Design a **5-step checklist** and delegate the checklist—not the task. Move from people-dependency to **system-dependency**.`;
    }
    if (q.includes('growth') || q.includes('scaling')) {
      return `Map three core processes (sales, ops, finance). Scale the processes first; then plug people into them.`;
    }
    return `Separate roles: Entrepreneur (vision), Manager (process), Technician (execution). Build the system that does the work.`;
  }
  if (bookTitle.includes('Good to Great')) {
    if (q.includes('hedgehog') || q.includes('core')) {
      return `Hedgehog = **Passion ∩ Best in the World ∩ Economic Engine**. If it misses one, stop doing it.`;
    }
    if (q.includes('leader') || q.includes('culture') || q.includes('management')) {
      return `Start with **Level 5 Leadership** and **First Who, Then What**. Fix the people system before the plan.`;
    }
    return `Apply disciplined people, thought, and action. Get the “who” right, then push the flywheel.`;
  }
  if (bookTitle.includes('Radical Candor')) {
    if (q.includes('feedback') || q.includes('difficult')) {
      return `Aim for **Caring Personally + Challenging Directly**. Be specific, timely, and discuss behavior, not identity.`;
    }
    if (q.includes('criticism') || q.includes('praise')) {
      return `Ask for criticism first, then model candor in the way you give it.`;
    }
    return `Reinforce the relationship, then deliver the direct challenge.`;
  }
  if (bookTitle.includes('Atomic Habits')) {
    if (q.includes('start') || q.includes('new habit') || q.includes('consistency')) {
      return `Use the **2-Minute Rule**; stack on an existing habit; add an immediate reward.`;
    }
    if (q.includes('break') || q.includes('stop')) {
      return `Invert the Four Laws: make it **Invisible, Unattractive, Difficult, Unsatisfying**—add friction and remove cues.`;
    }
    return `Shift identity: “What would a disciplined person do right now?”`;
  }
  return `Define the outcome, then apply **${(focusAreas && focusAreas[0]) || 'core'}** principles to design the smallest repeatable action.`;
};

/* =========================================================
   RICH FLYER (default) + EXECUTIVE BRIEF (short)
========================================================= */
function richFlyerFallbackHTML(book, tier) {
  const focus = (book.focus || '').split(',').map(s => s.trim()).filter(Boolean);
  const section = (title, inner) => `
    <section style="break-inside: avoid; margin: 0 0 14px 0; padding: 10px; border: 1px solid ${COLORS.SUBTLE}; border-radius: 10px; background: #fff">
      <h3 style="margin:0 0 8px 0; color: ${COLORS.NAVY}; font-weight: 800; letter-spacing: .01em">${title}</h3>
      ${inner}
    </section>
  `;
  const chips = focus.slice(0, 6).map(f => `<span style="display:inline-block; padding:4px 8px; margin:2px; border-radius:9999px; background:#F3F4F6; color:#374151; font-size:12px">${f}</span>`).join('');

  const actions = getActionSteps(book).map(s => `<li>${s}</li>`).join('');
  const frameworks = getFrameworks(book).map(f => `<li><strong>${f.name}:</strong> ${f.desc}</li>`).join('');

  return `
    <div style="padding: 16px; border: 1px solid ${COLORS.SUBTLE}; border-radius: 16px; box-shadow: 0 10px 28px rgba(0,0,0,.06)">
      <header style="padding-bottom: 12px; margin-bottom: 8px; border-bottom: 4px solid ${COLORS.ORANGE}">
        <p style="margin:0 0 4px 0; font-size: 12px; letter-spacing:.14em; color:${COLORS.TEAL}; font-weight: 900; text-transform: uppercase">${tier} Competency</p>
        <h2 style="margin:0; color:${COLORS.NAVY}; font-weight:900; font-size:32px; letter-spacing:-.01em">${book.title}</h2>
        <p style="margin:6px 0 0 0; color:${COLORS.ORANGE}; font-weight:800">by ${book.author}</p>
        <div style="margin-top:8px">${chips}</div>
      </header>

      <div style="column-count: 2; column-gap: 18px">
        ${section('Key Ideas', `
          <ul style="margin:0 0 0 18px; color:${COLORS.TEXT}">
            <li>What it solves: ${book.theme || 'Practical playbook for managers and operators.'}</li>
            <li>How it works: principles distilled into repeatable habits and systems.</li>
            <li>Where it fails: common traps and anti-patterns to avoid.</li>
          </ul>
        `)}

        ${section('Key Frameworks', `
          <ul style="margin:0 0 0 18px; color:${COLORS.TEXT}">
            ${frameworks}
          </ul>
        `)}

        ${section("Manager's 30/60/90 (Action Plan)", `
          <ul style="margin:0 0 0 18px; color:${COLORS.TEXT}">
            ${actions}
          </ul>
        `)}

        ${section('Metrics to Watch', `
          <ul style="margin:0 0 0 18px; color:${COLORS.TEXT}">
            <li>Leading indicators tied to behavior change</li>
            <li>Quality bar (defects escaped, rework)</li>
            <li>Throughput / cycle time</li>
          </ul>
        `)}

        ${section('Memorable Quotes', `
          <blockquote style="margin:0; color:${COLORS.TEXT}">“Clarity beats cleverness.”</blockquote>
          <blockquote style="margin:6px 0 0 0; color:${COLORS.TEXT}">“Build the system that builds the results.”</blockquote>
        `)}

        ${section('Common Pitfalls', `
          <ul style="margin:0 0 0 18px; color:${COLORS.TEXT}">
            <li>Delegating intention instead of process</li>
            <li>Optimizing locally instead of end-to-end</li>
            <li>Skipping the feedback loop</li>
          </ul>
        `)}

        ${section('FAQ / How-To', `
          <p style="margin:0 0 6px 0; color:${COLORS.TEXT}"><strong>How do I start?</strong> Pick one flow, document the steps, and run it twice a week.</p>
          <p style="margin:0; color:${COLORS.TEXT}"><strong>What if we lack buy-in?</strong> Pilot with one team; publish before/after metrics.</p>
        `)}

        ${section('Glossary (light)', `
          <ul style="margin:0 0 0 18px; color:${COLORS.TEXT}">
            <li><strong>SOP:</strong> simple checklist that ensures outcomes</li>
            <li><strong>Leading indicator:</strong> a measure that predicts goal movement</li>
          </ul>
        `)}
      </div>
    </div>
  `;
}

function execBriefFallbackHTML(book, tier) {
  const actions = getActionSteps(book).slice(0, 3).map(s => `<li>${s}</li>`).join('');
  const frameworks = getFrameworks(book).slice(0, 2).map(f => `<li><strong>${f.name}:</strong> ${f.desc}</li>`).join('');
  return `
    <div style="display:flex;flex-direction:column;gap:12px">
      <header style="border-bottom:3px solid ${COLORS.ORANGE};padding-bottom:10px">
        <p style="margin:0 0 4px 0;font-size:12px;letter-spacing:.13em;color:${COLORS.TEAL};font-weight:800;text-transform:uppercase">${tier} Competency</p>
        <h2 style="margin:0;color:${COLORS.NAVY};font-weight:900;font-size:28px;line-height:1.05;letter-spacing:-.02em">${book.title}</h2>
        <p style="margin:6px 0 0 0;color:${COLORS.ORANGE};font-weight:800">by ${book.author}</p>
      </header>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div>
          <h3 style="margin:0 0 6px 0; color:${COLORS.NAVY}">Key Frameworks</h3>
          <ul style="margin:0 0 0 18px; color:${COLORS.TEXT}">${frameworks}</ul>
        </div>
        <div>
          <h3 style="margin:0 0 6px 0; color:${COLORS.NAVY}">Action Plan</h3>
          <ul style="margin:0 0 0 18px; color:${COLORS.TEXT}">${actions}</ul>
        </div>
      </div>
    </div>
  `;
}

/* Use model when available; otherwise use rich fallback above */
async function buildAIFlyerHTML({ book, tier, executive, callSecureGeminiAPI }) {
  if (!callSecureGeminiAPI) {
    return executive ? execBriefFallbackHTML(book, tier) : richFlyerFallbackHTML(book, tier);
  }
  const baseInstruction = executive
    ? `Write a crisp EXECUTIVE BRIEF (120–180 words). Include a short "Key Frameworks" list that names the book's frameworks (e.g., Hedgehog, GTD, SPIN) and 2–3 specific actions.`
    : `Create a full one-page BOOK FLYER with a two-column feel. Sections: Key Ideas, Key Frameworks (name them with one-line descriptions), Manager's 30/60/90 (book-specific steps), Metrics to Watch, Memorable Quotes, Common Pitfalls, FAQ/How-To, Glossary. Output clean HTML with only <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>, <blockquote>, <div>, <span>. No <style> tags or external links.`;

  const systemPrompt =
    `You are the LeaderReps Researcher. Summarize faithfully using widely-established ideas about the book. ` +
    `Frameworks and actions must clearly reference the book’s named models when they exist.`;

  const userPrompt =
    `${baseInstruction}\n\nBook: ${book.title} by ${book.author}\n` +
    `Focus areas: ${(book.focus || '')}\nComplexity: ${book.complexity}\nEst. Minutes: ${book.duration}\nTier: ${tier}`;

  try {
    let out = await callSecureGeminiAPI({ systemPrompt, userPrompt });
    if (!out) out = await callSecureGeminiAPI(`${systemPrompt}\n\n${userPrompt}`);

    // Extract text robustly
    let html = '';
    if (typeof out === 'string') html = out;
    else if (out?.text) html = out.text;
    else if (out?.response) html = out.response;
    else if (Array.isArray(out?.candidates)) {
      const c = out.candidates[0];
      if (c?.content) html = c.content;
      if (c?.text) html = c.text;
    } else {
      html = JSON.stringify(out);
    }

    html = sanitizeHTML(html);
    if (!/[<][a-zA-Z]/.test(html)) {
      html = `<div style="column-count:2; column-gap:18px"><p>${html.replace(/\n/g, '<br/>')}</p></div>`;
    }
    return html;
  } catch (e) {
    console.error('AI flyer error (fallback used):', e);
    return executive ? execBriefFallbackHTML(book, tier) : richFlyerFallbackHTML(book, tier);
  }
}

/* =========================================================
   MAIN COMPONENT
========================================================= */
export default function BusinessReadingsScreen() {
  const services = (typeof useAppServices === 'function' ? useAppServices() : {}) || {};
  const {
    allBooks: contextBooks = {},
    updateCommitmentData = () => true,
    navigate = () => {},
    callSecureGeminiAPI,
    hasGeminiKey,
  } = services;

  // Optional debug
  const [showDbg, setShowDbg] = useState(() => {
    try { return typeof window !== 'undefined' && /[?&]dbg=1\b/.test(window.location.search); }
    catch { return false; }
  });
  const [debugStamp] = useState(() => new Date().toLocaleString());

  const [selectedBook, setSelectedBook] = useState(null);
  const [htmlFlyer, setHtmlFlyer] = useState('');
  const [selectedTier, setSelectedTier] = useState('');
  const [savedBooks, setSavedBooks] = useState({});
  const [isExecutiveBrief, setIsExecutiveBrief] = useState(false);

  const [filters, setFilters] = useState({ complexity: 'All', maxDuration: 300, search: '' });
  const [hoveredId, setHoveredId] = useState(null);

  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const aiInputRef = useRef(null);
  const searchInputRef = useRef(null);
  const [focusedField, setFocusedField] = useState(null); // 'search' | 'coach' | null
  const lastSelSearch = useRef({ start: null, end: null });
  const lastSelCoach = useRef({ start: null, end: null });

  useEffect(() => {
    try {
      if (globalThis.notepad?.addContent) {
        globalThis.notepad.setTitle('LeaderReps Notepad');
        globalThis.notepad.addContent('📚 BusinessReadings mounted.');
      }
    } catch {}
  }, []);

  const allBooks = Object.keys(contextBooks).length ? contextBooks : MOCK_ALL_BOOKS;

  /* ---------- Filtering ---------- */
  const filteredBooks = useMemo(() => {
    const flat = Object.entries(allBooks).flatMap(([tier, books]) =>
      (books || []).map(b => ({ ...b, tier }))
    );
    const s = (filters.search || '').toLowerCase();

    return flat
      .filter(b => {
        const cOK = filters.complexity === 'All' || b.complexity === filters.complexity;
        const dOK = b.duration <= filters.maxDuration;
        const sOK = !s || b.title.toLowerCase().includes(s) || b.author.toLowerCase().includes(s) || (b.focus || '').toLowerCase().includes(s);
        return cOK && dOK && sOK;
      })
      .reduce((acc, b) => {
        (acc[b.tier] ||= []).push(b);
        return acc;
      }, {});
  }, [allBooks, filters]);

  /* ---------- Flyer generation (AI then fallback) ---------- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!selectedBook) { setHtmlFlyer(''); return; }
      const tierKey = selectedTier || Object.keys(allBooks).find(k => (allBooks[k] || []).some(b => b.id === selectedBook.id)) || 'Strategy & Execution';

      setHtmlFlyer(`<div style="padding:12px;border:1px dashed ${COLORS.SUBTLE};border-radius:12px;color:${COLORS.MUTED}">Generating ${isExecutiveBrief ? 'executive brief' : 'full flyer'}…</div>`);

      let html;
      if (hasGeminiKey?.() && typeof callSecureGeminiAPI === 'function') {
        html = await buildAIFlyerHTML({ book: selectedBook, tier: tierKey, executive: isExecutiveBrief, callSecureGeminiAPI });
      } else {
        html = isExecutiveBrief ? execBriefFallbackHTML(selectedBook, tierKey) : richFlyerFallbackHTML(selectedBook, tierKey);
      }
      if (!cancelled) setHtmlFlyer(html);
    })();
    return () => { cancelled = true; };
  }, [selectedBook, selectedTier, isExecutiveBrief, allBooks]);

  /* ---------- Reset contextual state when changing book ---------- */
  useEffect(() => {
    if (selectedBook) {
      setIsExecutiveBrief(false);
      setAiQuery('');
      setAiResponse('');
      setIsSubmitting(false);
    }
  }, [selectedBook]);

  /* ---------- Focus retention for Search & AI inputs ---------- */
  const rememberCaret = (ref, store) => {
    try {
      if (!ref.current) return;
      store.start = ref.current.selectionStart;
      store.end = ref.current.selectionEnd;
    } catch { /* ignore */ }
  };

  useLayoutEffect(() => {
    if (focusedField === 'search' && searchInputRef.current) {
      const el = searchInputRef.current;
      if (document.activeElement !== el) el.focus();
      if (lastSelSearch.current.start != null) {
        try { el.setSelectionRange(lastSelSearch.current.start, lastSelSearch.current.end); } catch { /* ignore */ }
      }
    }
  }, [filters.search, focusedField]);

  useLayoutEffect(() => {
    if (focusedField === 'coach' && aiInputRef.current) {
      const el = aiInputRef.current;
      if (document.activeElement !== el) el.focus();
      if (lastSelCoach.current.start != null) {
        try { el.setSelectionRange(lastSelCoach.current.start, lastSelCoach.current.end); } catch { /* ignore */ }
      }
    }
  }, [aiQuery, focusedField]);

  /* ---------- AI Coach (stabilized submit + varied, contextual answers) ---------- */
  const handleAiSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    const q = aiQuery.trim();
    if (!selectedBook || !q) return;

    setIsSubmitting(true);
    setAiResponse('Thinking…');

    const focusAreas = (selectedBook.focus || '').split(',').map(s => s.trim()).filter(Boolean);

    try {
      if (hasGeminiKey?.() && typeof callSecureGeminiAPI === 'function') {
        const systemPrompt =
          `You are the LeaderReps AI Coach.\n` +
          `Context:\n` +
          `- Book: ${selectedBook.title} by ${selectedBook.author}\n` +
          `- Focus areas: ${focusAreas.join(', ') || '—'}\n` +
          `- User Question: ${q}\n` +
          `Guidelines: Answer directly with 3–5 sentences plus 1–2 concrete next actions tailored to the question. If multiple interpretations exist, state them briefly then choose the highest leverage step.`;

        let out = await callSecureGeminiAPI({ systemPrompt, userPrompt: q });
        if (!out) out = await callSecureGeminiAPI(`${systemPrompt}`);

        let text = '';
        if (typeof out === 'string') text = out;
        else if (out?.text) text = out.text;
        else if (out?.response) text = out.response;
        else if (Array.isArray(out?.candidates) && out.candidates[0]?.content) text = out.candidates[0].content;
        else if (Array.isArray(out?.candidates) && out.candidates[0]?.text) text = out.candidates[0].text;
        else text = JSON.stringify(out);

        setAiResponse(text || 'No response.');
      } else {
        const tip = mockAIResponse(selectedBook.title, focusAreas, q);
        setAiResponse(tip);
      }
    } catch (err) {
      console.error('AI error:', err);
      const tip = mockAIResponse(selectedBook.title, focusAreas, q);
      setAiResponse(`(AI error; using local tips)\n\n${tip}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [aiQuery, selectedBook, callSecureGeminiAPI, hasGeminiKey, isSubmitting]);

  /* ---------- Actions ---------- */
  const handleCommitment = (book) => {
    const newCommitment = {
      id: book.id,
      title: `Read: ${book.title} (${book.author})`,
      category: 'Reading',
      tier: selectedTier,
      notes: `Flyer theme: ${book.theme}. Est. ${book.duration} min.`,
      status: 'Active',
      progressMinutes: 0,
      totalDuration: book.duration,
      createdAt: new Date().toISOString(),
    };
    const ok = updateCommitmentData(newCommitment);
    if (ok) navigate('daily-practice');
    else console.error('Failed to add commitment.');
  };

  const handleSaveForLater = (bookId) => {
    setSavedBooks(prev => ({ ...prev, [bookId]: !prev[bookId] }));
  };

  /* =========================================================
     SUBCOMPONENTS
  ========================================================== */
  const BookList = () => (
    <div className="space-y-10">
      <h2 className="text-3xl font-extrabold flex items-center gap-3 border-b-4 pb-2"
          style={{ color: COLORS.NAVY, borderColor: COLORS.ORANGE }}>
        <BookOpen className="w-7 h-7" style={{ color: COLORS.TEAL }}/> LeaderReps Curated Reading Library
      </h2>

      {/* Controls */}
      <div className="p-5 rounded-xl shadow-xl border" style={{ background: COLORS.SURFACE, borderColor: COLORS.SUBTLE }}>
        <h3 className="text-xl font-bold flex items-center gap-2 mb-4" style={{ color: COLORS.NAVY }}>
          <Filter className="w-5 h-5" style={{ color: COLORS.ORANGE }}/> Personalize Your Search
        </h3>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-1 flex items-center gap-1" style={{ color: COLORS.MUTED }}>
            <SearchIcon className="w-4 h-4" style={{ color: COLORS.TEAL }}/> Search by Title, Author, or Focus
          </label>
          <input
            type="text"
            ref={searchInputRef}
            value={filters.search}
            onFocus={() => setFocusedField('search')}
            onBlur={() => setFocusedField(null)}
            onChange={(e) => { rememberCaret(searchInputRef, lastSelSearch.current); setFilters(prev => ({ ...prev, search: e.target.value })); }}
            placeholder="Start typing to find a book..."
            className="w-full p-3 border rounded-lg shadow-sm focus:outline-none"
            style={{ borderColor: COLORS.SUBTLE, color: COLORS.TEXT }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: COLORS.MUTED }}>Complexity Level</label>
            <select
              value={filters.complexity}
              onChange={(e) => setFilters({ ...filters, complexity: e.target.value })}
              className="w-full p-2 border rounded-lg shadow-sm focus:outline-none"
              style={{ borderColor: COLORS.SUBTLE, color: COLORS.TEXT }}
            >
              <option value="All">All Levels</option>
              {Object.keys(COMPLEXITY_MAP).map(k => (
                <option key={k} value={k}>{COMPLEXITY_MAP[k].label}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1" style={{ color: COLORS.MUTED }}>
              Max Est. Learning Minutes ({filters.maxDuration} minutes)
            </label>
            <input
              type="range"
              min="150"
              max="300"
              step="10"
              value={filters.maxDuration}
              onChange={(e) => setFilters({ ...filters, maxDuration: parseInt(e.target.value, 10) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs mt-1" style={{ color: COLORS.MUTED }}>
              <span>150 min (Quick Reads)</span>
              <span>300 min (Deep Dive)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Book groups */}
      <div className="space-y-12">
        {Object.entries(filteredBooks).map(([tier, books]) => (
          <div key={tier}
               className="rounded-2xl shadow-xl overflow-hidden border-2"
               style={{ background: COLORS.SURFACE, borderColor: COLORS.SUBTLE }}>
            {/* Header */}
            <div className="p-6" style={{ background: COLORS.NAVY }}>
              <h3 className="text-2xl font-bold flex items-center gap-2" style={{ color: COLORS.SURFACE }}>
                {tier}
              </h3>
              <p className="text-base mt-1" style={{ color: '#E5E7EB' }}>
                Foundational books for this competency. ({books.length} available)
              </p>
            </div>

            {/* Cards (stronger visuals, no images) */}
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {(books || []).map((book) => {
                const c = COMPLEXITY_MAP[book.complexity] || COMPLEXITY_MAP.Medium;
                const isSaved = !!savedBooks[book.id];
                const isSelected = selectedBook?.id === book.id;
                const isHovered = hoveredId === book.id;

                return (
                  <div key={book.id} className="relative">
                    <button
                      onMouseEnter={() => setHoveredId(book.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      onClick={() => { setSelectedBook(book); setSelectedTier(tier); }}
                      className="p-5 text-left w-full h-full block rounded-2xl border-2 transition-all"
                      style={{
                        background: 'linear-gradient(180deg,#FFFFFF,#F9FAFB)',
                        borderColor: isSelected ? COLORS.TEAL : (isHovered ? COLORS.NAVY : COLORS.SUBTLE),
                        boxShadow: (isSelected || isHovered) ? '0 12px 30px rgba(0,0,0,.12)' : '0 2px 8px rgba(0,0,0,.06)',
                        color: COLORS.TEXT,
                        position: 'relative'
                      }}
                    >
                      <span style={{
                        position:'absolute',top:0,left:0,right:0,height:6,
                        background: isSelected ? COLORS.TEAL : COLORS.ORANGE,
                        borderTopLeftRadius:14,borderTopRightRadius:14
                      }} />

                      <div className="flex gap-3 items-start">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center border" style={{ borderColor: COLORS.SUBTLE, background: '#F3F4F6' }}>
                          <BookOpen className="w-5 h-5" style={{ color: COLORS.TEAL }} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-extrabold text-lg" style={{ color: COLORS.NAVY }}>{book.title}</p>
                          <p className="text-sm italic" style={{ color: COLORS.MUTED }}>by {book.author}</p>
                        </div>
                      </div>

                      <div className="my-3" style={{ height: 1, background: COLORS.SUBTLE }} />

                      <div className="flex flex-col text-sm gap-2" style={{ color: COLORS.TEXT }}>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4" style={{ color: COLORS.ORANGE, marginRight: 8 }}/>
                          <span className="font-semibold">Learning Mins:</span>
                          <span className="ml-auto font-bold">{book.duration} min</span>
                        </div>
                        <div className="flex items-center">
                          <c.icon className="w-4 h-4" style={{ color: c.hex, marginRight: 8 }}/>
                          <span className="font-semibold">Complexity:</span>
                          <span className="ml-auto font-bold" style={{ color: c.hex }}>{c.label}</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-3" style={{ borderTop: '1px solid #F3F4F6' }}>
                        <p className="text-xs font-semibold" style={{ color: COLORS.TEAL }}>Key Focus</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(book.focus || '').split(',').slice(0, 3).map((f, i) => (
                            <span key={i}
                                  className="px-2 py-0.5 text-xs font-medium rounded-full"
                                  style={{ background: '#F3F4F6', color: '#4B5563' }}>
                              {f.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    </button>

                    {/* Save */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSaveForLater(book.id); }}
                      aria-label={isSaved ? 'Remove from Saved' : 'Save for Later'}
                      className="absolute top-2 right-2 p-2 rounded-full"
                      style={{
                        background: isSaved ? COLORS.AMBER : '#FFFFFFCC',
                        color: isSaved ? '#FFFFFF' : '#9CA3AF',
                        boxShadow: '0 1px 2px rgba(0,0,0,.2)'
                      }}
                    >
                      <Star className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                );
              })}
            </div>

            {books.length === 0 && (
              <div className="p-6 text-center" style={{ color: COLORS.MUTED }}>
                No books match the current filters in this category.
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const BookFlyer = () => {
    const progressMinutes = 45;
    const total = selectedBook.duration;
    const pct = Math.min(100, Math.round((progressMinutes / total) * 100));

    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center pb-4" style={{ borderBottom: `1px solid ${COLORS.SUBTLE}` }}>
          <h2 className="text-3xl font-bold flex items-center gap-3" style={{ color: COLORS.NAVY }}>
            Focus Flyer: {selectedBook.title}
          </h2>
          <button
            onClick={() => setSelectedBook(null)}
            className="font-semibold px-3 py-2 rounded border"
            style={{ color: COLORS.NAVY, borderColor: COLORS.SUBTLE }}
          >
            ← Back to Library
          </button>
        </div>

        <div className="rounded-2xl shadow-2xl p-8 border" style={{ background: COLORS.SURFACE, borderColor: COLORS.SUBTLE }}>
          {/* Progress + Exec Brief */}
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
            <div className="flex items-center gap-3 p-3 rounded border" style={{ background: '#F9FAFB', borderColor: COLORS.SUBTLE }}>
              <TrendingUp className="w-5 h-5" style={{ color: COLORS.TEAL }}/>
              <div>
                <p className="text-xs font-medium" style={{ color: COLORS.MUTED }}>YOUR COMMITMENT STATUS</p>
                <div className="flex items-center gap-2">
                  <div className="w-40 h-2 rounded-full" style={{ background: COLORS.SUBTLE }}>
                    <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: COLORS.TEAL }} />
                  </div>
                  <span className="text-sm font-bold" style={{ color: COLORS.NAVY }}>{pct}% Complete</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ExecSwitch checked={isExecutiveBrief} onChange={setIsExecutiveBrief} />
            </div>
          </div>

          {/* Rendered Flyer (HTML) */}
          <div className="max-w-none space-y-4" style={{ color: COLORS.TEXT }} dangerouslySetInnerHTML={{ __html: htmlFlyer }} />

          {/* AI Coach */}
          <div className="mt-8 pt-4" style={{ borderTop: `1px solid ${COLORS.SUBTLE}` }}>
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-3" style={{ color: COLORS.NAVY }}>
              <MessageSquare className="text-2xl w-6 h-6" style={{ color: COLORS.BLUE }}/> AI Coach: Instant Application
            </h3>

            {aiResponse && (
              <div className="p-4 mb-4 rounded" style={{ background: '#EFF6FF', border: '1px solid #93C5FD', color: COLORS.TEXT }}>
                <p className="text-sm font-semibold" style={{ color: '#1D4ED8' }}>AI Coach:</p>
                <p className="text-base" style={{ whiteSpace: 'pre-wrap' }}>{aiResponse}</p>
              </div>
            )}

            <form onSubmit={handleAiSubmit} className="flex gap-2">
              <input
                type="text"
                ref={aiInputRef}
                value={aiQuery}
                onFocus={() => setFocusedField('coach')}
                onBlur={() => setFocusedField(null)}
                onChange={(e) => { rememberCaret(aiInputRef, lastSelCoach.current); setAiQuery(e.target.value); }}
                placeholder={`Ask how to apply ${selectedBook.title} at work (e.g., "How do I delegate?")`}
                className="flex-grow p-3 border rounded"
                style={{ borderColor: COLORS.SUBTLE, color: COLORS.TEXT }}
                required
              />
              <button
                type="submit"
                className="px-4 rounded font-semibold flex items-center gap-1"
                style={{
                  background: isSubmitting ? '#9CA3AF' : (aiQuery.trim() ? COLORS.BLUE : '#D1D5DB'),
                  color: aiQuery.trim() ? '#FFFFFF' : '#6B7280',
                  cursor: (aiQuery.trim() && !isSubmitting) ? 'pointer' : 'not-allowed',
                  opacity: isSubmitting ? 0.8 : 1
                }}
                disabled={!aiQuery.trim() || isSubmitting}
                aria-busy={isSubmitting ? 'true' : 'false'}
              >
                <MessageSquare className="w-5 h-5" /> {isSubmitting ? 'Working…' : 'Ask'}
              </button>
            </form>
          </div>

          {/* Commit actions */}
          <div className="mt-10 pt-6 flex justify-end gap-4" style={{ borderTop: `1px solid ${COLORS.SUBTLE}` }}>
            <button
              onClick={() => handleSaveForLater(selectedBook.id)}
              className="flex items-center gap-2 px-6 py-3 font-semibold rounded-xl border-2"
              style={{
                background: COLORS.SURFACE,
                borderColor: savedBooks[selectedBook.id] ? COLORS.AMBER : COLORS.SUBTLE,
                color: savedBooks[selectedBook.id] ? '#B45309' : COLORS.MUTED
              }}
            >
              <Star className="w-5 h-5" fill={savedBooks[selectedBook.id] ? 'currentColor' : 'none'}/>
              {savedBooks[selectedBook.id] ? 'Saved to Library' : 'Save for Later'}
            </button>
            <button
              onClick={() => handleCommitment(selectedBook)}
              className="flex items-center gap-2 px-6 py-3 font-semibold rounded-xl"
              style={{
                background: COLORS.ORANGE, color: '#FFF',
                boxShadow: `0 8px 24px ${COLORS.ORANGE}45`
              }}
            >
              <TrendingUp className="w-5 h-5" /> Add to Daily Practice Commitment
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 md:p-10 min-h-screen" style={{ background: COLORS.BG, color: COLORS.TEXT }}>
      {showDbg && (
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            background: '#111827',
            color: '#FFFFFF',
            border: `2px solid ${COLORS.AMBER}`,
            borderRadius: 8,
            padding: '8px 12px',
            marginBottom: 12
          }}
        >
          <strong>Debug:</strong> BusinessReadings.jsx (v7.2 tailored frameworks + actions) mounted at {debugStamp}.
          <button
            onClick={() => setShowDbg(false)}
            style={{ float: 'right', background: 'transparent', color: '#FFFFFF', border: 'none', fontWeight: 700, cursor: 'pointer' }}
            aria-label="Dismiss debug banner"
          >
            ×
          </button>
        </div>
      )}

      <h1 className="text-4xl font-extrabold mb-10" style={{ color: COLORS.NAVY }}>Professional Reading Hub</h1>
      {!selectedBook && <BookList />}
      {selectedBook && <BookFlyer />}
    </div>
  );
}
