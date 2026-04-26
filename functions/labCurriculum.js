/**
 * Leadership Lab Curriculum — 16-Week Spine
 *
 * Three tracks:
 *   - foundation   (Lead Work)   weeks 1-5
 *   - ascent-team  (Lead Team)   weeks 6-11
 *   - ascent-self  (Lead Self)   weeks 12-16
 *
 * Each week is the FIXED spine. Claude personalizes the *delivery* of each
 * piece (anchor experiment, prescriptions, simulations, reveals) using the
 * user's leadership profile, evidence, and people. The themes, core
 * concepts, and anchor experiments themselves are NOT to be re-invented
 * by the model.
 *
 * Schema for each week:
 *   number            integer 1..N
 *   track             "foundation" | "ascent-team" | "ascent-self"
 *   theme             short title line (e.g. "Reinforcing — Recognizing...")
 *   shortName         one-word handle for code/UI ("reinforcing")
 *   corePromise       one-sentence outcome the week delivers
 *   coreConcept       2-3 sentence teaching used as the "why"
 *   signatureQuestion the single question the week orbits around
 *   anchorExperiment  the BASE behavioral practice. Claude personalizes it.
 *   noticePrompts     3 attention-direction prompts for the week
 *   prescriptionTopics ideas for the Wednesday concept prescription
 *   simulationTypes   role-plays appropriate to this week
 *   revealHooks       strategic insights Claude can deliver IF evidence supports
 */

const LL_CURRICULUM = [
  // ───────────────────────────────────────────────────────────────────────
  // FOUNDATION — LEAD WORK
  // ───────────────────────────────────────────────────────────────────────
  {
    number: 1,
    track: "foundation",
    theme: "Reinforcing — Recognizing & Reinforcing Great Leadership",
    shortName: "reinforcing",
    corePromise:
      "Your team gets more of what you notice. By Friday you'll know what you've been ignoring.",
    coreConcept:
      "Recognition is not a soft skill — it's the cheapest, most reliable way to shape behavior on a team. Most leaders dramatically over-index on what's wrong and under-index on what's working. Your attention IS the feedback signal.",
    signatureQuestion:
      "What good thing happened today that I didn't acknowledge?",
    anchorExperiment:
      "For five workdays in a row, send one specific recognition message per day to a different person. Not generic praise. Name the behavior, name the impact: 'When you did X, it made Y possible.' Track who got recognized and notice who you almost forgot.",
    noticePrompts: [
      "Notice the moment you think 'good job' but don't say it out loud.",
      "Notice who you compliment effortlessly — and who you don't.",
      "Notice the difference between 'thanks' and naming a specific behavior.",
    ],
    prescriptionTopics: [
      "Recognition as behavior reinforcement, not morale management",
      "Why generic praise (\"great job\") is worse than no praise",
      "The 5-to-1 positive-to-corrective ratio in high-performing teams",
    ],
    simulationTypes: [
      "Recognizing a quiet contributor whose work usually goes unnoticed",
      "Acknowledging someone you've been frustrated with",
    ],
    revealHooks: [
      "You praise the loud people. The quiet ones are starving.",
      "You only acknowledge effort when results land — but effort sometimes precedes results by months.",
      "Your recognition pattern reveals who you actually respect.",
    ],
  },
  {
    number: 2,
    track: "foundation",
    theme: "One-on-One — Mastering the 1:1 Conversation",
    shortName: "one-on-one",
    corePromise:
      "Your 1:1s become the highest-leverage 30 minutes of your week.",
    coreConcept:
      "A 1:1 is not a status meeting. It's the only place in the org chart where one human can fully attend to another about *their* work, *their* growth, *their* obstacles. If your 1:1 looks like a Jira sync, you're wasting the format.",
    signatureQuestion: "Is this their meeting or mine?",
    anchorExperiment:
      "Run your next three 1:1s with NO agenda from you. Open with one question: 'What's the most important thing for us to talk about today?' Then shut up. Hold silence. Let them fill it. Note where the conversation actually goes vs. where you would have steered it.",
    noticePrompts: [
      "Notice how long you can stay quiet before you fill the gap.",
      "Notice when you redirect from their topic back to yours.",
      "Notice what they bring up only when you don't lead with your list.",
    ],
    prescriptionTopics: [
      "The 1:1 as a coaching surface, not a status check",
      "Why your team's best ideas live one question past their first answer",
      "The cost of a hijacked 1:1 — what people stop bringing you",
    ],
    simulationTypes: [
      "1:1 with a direct report who only ever brings you status updates",
      "1:1 with someone who's clearly avoiding a hard topic",
    ],
    revealHooks: [
      "You run 1:1s the way your worst boss ran yours.",
      "You ask questions, but you ask them like a prosecutor, not a coach.",
      "Your 1:1s have the same shape every week — and that shape is yours, not theirs.",
    ],
  },
  {
    number: 3,
    track: "foundation",
    theme: "Redirecting — Giving Feedback That Actually Lands",
    shortName: "redirecting",
    corePromise:
      "You give one piece of unsoftened, specific feedback this week — and learn it doesn't break the relationship.",
    coreConcept:
      "The kindest thing you can do is be clear. Hedging, softening, and over-contextualizing are forms of withholding — they protect *your* comfort, not theirs. Direct feedback delivered with genuine care is a sign of respect: you believe they can handle the truth and use it.",
    signatureQuestion: "Am I being clear, or just being nice?",
    anchorExperiment:
      "Choose one conversation you've been mentally rehearsing but avoiding. Set a specific time. Deliver the message in 2-3 direct sentences. No 'I'm wondering if maybe...' No 'It might be worth considering...' Say the thing. Then stop talking and let them respond.",
    noticePrompts: [
      "Notice the exact words you use to soften your message.",
      "Notice what happens in your body in the silence after you say the thing.",
      "Notice whether the relationship actually got worse — or just felt different.",
    ],
    prescriptionTopics: [
      "Care + Challenge: Radical Candor's two axes",
      "Why over-explaining is unkind — it leaves people guessing",
      "The 'sandwich' is a tax on the recipient, not a kindness",
    ],
    simulationTypes: [
      "Telling a high performer they're hurting team dynamics",
      "Telling someone their work isn't meeting the bar",
    ],
    revealHooks: [
      "Your softening doesn't protect them — it protects you.",
      "You give feedback like you're asking permission to give feedback.",
      "The people who report to you have learned that 'maybe' means 'definitely, but I don't want to say it.'",
    ],
  },
  {
    number: 4,
    track: "foundation",
    theme: "Readiness — Handling Pushback & Resistance",
    shortName: "readiness",
    corePromise: "You stop equating disagreement with disrespect.",
    coreConcept:
      "Pushback is information. When someone resists, they're telling you what they're protecting — their identity, their workload, their relationships, their fear. Your job is not to overpower the resistance. It's to get curious enough about it that you can decide what to do with it.",
    signatureQuestion: "What is the resistance trying to protect?",
    anchorExperiment:
      "The next time someone pushes back on you, do not respond with your reasoning. Respond with one question: 'Help me understand what's underneath that for you.' Then listen for 60 seconds without rebutting. Note what you learn that you wouldn't have learned by re-arguing your case.",
    noticePrompts: [
      "Notice the moment your jaw tightens when challenged.",
      "Notice the difference between 'they're wrong' and 'they're protecting something.'",
      "Notice which pushback you take personally vs. impersonally — and why.",
    ],
    prescriptionTopics: [
      "The difference between resistance and refusal",
      "Why the loudest objector is rarely the actual blocker",
      "Curiosity as a leadership move under pressure",
    ],
    simulationTypes: [
      "A peer publicly disagreeing with you in a meeting",
      "A direct report repeatedly slow-walking a decision",
    ],
    revealHooks: [
      "When people push back, you stop coaching and start prosecuting.",
      "You confuse 'they need more data' with 'they don't trust me yet.'",
      "Your resistance to *their* resistance is the actual blocker.",
    ],
  },
  {
    number: 5,
    track: "foundation",
    theme: "Capstone — Leading With Confidence",
    shortName: "capstone-foundation",
    corePromise:
      "You name your leadership stance — what you stand for, what you'll never trade away.",
    coreConcept:
      "Confident leaders are not loud, certain, or unshakeable. They're *legible*. People know what they stand for, what they value, what they'll trade and what they won't. Confidence is not a feeling — it's a position you've made publicly clear, then lived consistently.",
    signatureQuestion:
      "What would I do if I weren't worried about being liked?",
    anchorExperiment:
      "Write your one-page Leadership Stance. Three sections: 'What I stand for' (3 things), 'What I won't trade away' (3 things), 'How you'll know I'm at my best' (3 things). Share it with one person who works with you and ask: 'Does this match what you actually see?'",
    noticePrompts: [
      "Notice where your stated values and your actual decisions diverge.",
      "Notice which of your 'non-negotiables' you've quietly negotiated.",
      "Notice the moment you choose being liked over being clear.",
    ],
    prescriptionTopics: [
      "Confidence as legibility, not certainty",
      "Why your team needs to know what you'll never compromise on",
      "The cost of an unstated stance — your team has to guess",
    ],
    simulationTypes: [
      "Defending a decision your team dislikes but you believe in",
      "Telling your boss the line you won't cross",
    ],
    revealHooks: [
      "You have strong values and weak boundaries.",
      "You lead by reaction, not by stance — your team can't predict you.",
      "Everyone knows what you'll tolerate. No one knows what you'll fight for.",
    ],
  },

  // ───────────────────────────────────────────────────────────────────────
  // ASCENT — LEAD TEAM
  // ───────────────────────────────────────────────────────────────────────
  {
    number: 6,
    track: "ascent-team",
    theme: "Operating Rhythm — How Your Team Hears You",
    shortName: "operating-rhythm",
    corePromise:
      "Your team stops guessing when you'll show up, what you'll bring, and what they're supposed to do with it.",
    coreConcept:
      "Most teams don't suffer from too little communication — they suffer from unpredictable communication. The leader's job is to design a rhythm: a sacred 1:1 cadence, a weekly written update, a defined office hour, a clear answer to 'when do you Slack vs. meet vs. email.' Predictability is a leadership asset. Inconsistency is a leadership tax your team pays in anxiety.",
    signatureQuestion:
      "If I disappeared for two weeks, would my team know what to expect from me?",
    anchorExperiment:
      "Write a one-page 'Operating Manual for Working With Me.' Five sections: when I'm available, how to reach me for what (Slack vs. email vs. meeting), what I'll always do (e.g., never cancel 1:1s twice in a row), what I'll never do (e.g., reply to non-urgent messages after 8pm), and how I make decisions. Share it with your team this week. Ask: 'Does this match what you actually experience from me?'",
    noticePrompts: [
      "Notice the channels your team uses to reach you — and which ones you actually respond on.",
      "Notice the meetings you cancel vs. the ones you protect.",
      "Notice the difference between being responsive and being available.",
    ],
    prescriptionTopics: [
      "Predictability as a leadership asset, not boring management",
      "Why inconsistency is the most exhausting thing a team experiences",
      "The difference between communication frequency and communication rhythm",
    ],
    simulationTypes: [
      "A team member telling you they don't know how to get your attention",
      "Resetting your operating rhythm with a team that's adapted around your inconsistency",
    ],
    revealHooks: [
      "Your team is exhausted by your inconsistency, not your demands.",
      "You communicate like a fire hose — sometimes everywhere, sometimes nowhere. There's no rhythm.",
      "You think you're being responsive. Your team experiences it as random.",
    ],
  },
  {
    number: 7,
    track: "ascent-team",
    theme: "Trust — The Trust Ledger",
    shortName: "trust",
    corePromise:
      "You stop assuming trust and start engineering it through small, visible deposits.",
    coreConcept:
      "Trust is not a feeling — it's an accumulated balance. Every interaction is a deposit or a withdrawal. Reliability (do what you said), vulnerability (admit what you don't know), and discretion (what's said in confidence stays there) are the three currencies. Most leaders are over-drawn and don't know it.",
    signatureQuestion:
      "What did I do today that built trust — and what did I do that withdrew?",
    anchorExperiment:
      "Track every commitment you make this week — every 'I'll get back to you,' 'I'll think about it,' 'let's circle back.' Write them down. At the end of the week, count how many you actually closed the loop on. Then close the open ones, even the small ones, and watch what happens.",
    noticePrompts: [
      "Notice the casual commitments you make that you don't track.",
      "Notice the things people stopped bringing you — and why.",
      "Notice when you make a deposit (admitting a mistake, keeping a confidence) vs. a withdrawal (over-promising, name-dropping a private convo).",
    ],
    prescriptionTopics: [
      "The Trust Equation: credibility + reliability + intimacy / self-orientation",
      "Why small broken promises cost more than big ones",
      "Vulnerability as a leadership skill, not weakness",
    ],
    simulationTypes: [
      "Repairing trust with someone you let down 6 months ago",
      "Receiving feedback that your team doesn't trust you on something specific",
    ],
    revealHooks: [
      "You're a high-credibility, low-reliability leader. People believe what you say in the moment but don't bet on what you'll do later.",
      "Your team trusts your competence and questions your discretion.",
      "The trust withdrawals you don't track add up — your team is keeping score even if you aren't.",
    ],
  },
  {
    number: 8,
    track: "ascent-team",
    theme: "Productive Conflict — Making Disagreement Safe",
    shortName: "conflict",
    corePromise:
      "Your meetings get harder and shorter. Conflict moves from hallways to the table.",
    coreConcept:
      "Teams that don't fight in the room fight in the parking lot. Healthy conflict is not personality clash — it's the rigorous, public stress-testing of ideas. Your job is not to prevent conflict. It's to design conditions where conflict is about ideas (productive) and not about identity (corrosive).",
    signatureQuestion: "What's the conversation we keep avoiding here?",
    anchorExperiment:
      "In your next team meeting, name one disagreement that's been simmering and surface it explicitly: 'I've noticed we keep dancing around X. Let's actually decide.' Run the conflict for 15 minutes. Make a decision. Note who participates and who goes silent.",
    noticePrompts: [
      "Notice the topics your team won't raise unless you raise them first.",
      "Notice who in the room becomes quiet when conflict starts.",
      "Notice the difference between someone fighting for an idea and fighting to win.",
    ],
    prescriptionTopics: [
      "Conflict as a team skill, not a personality trait",
      "Why 'disagree and commit' requires the disagreement first",
      "Psychological safety + high standards (the Edmondson 2x2)",
    ],
    simulationTypes: [
      "Mediating between two senior people who keep clashing",
      "Surfacing a disagreement that everyone agrees not to discuss",
    ],
    revealHooks: [
      "You confuse politeness with alignment. Your team agrees with you in the room and re-litigates in Slack.",
      "You allow conflict — but only the kind you can win.",
      "The silence in your meetings isn't agreement. It's resignation.",
    ],
  },
  {
    number: 9,
    track: "ascent-team",
    theme: "Alignment — From Compliance to Commitment",
    shortName: "alignment",
    corePromise:
      "You can tell the difference between a head-nod and a real \"yes.\"",
    coreConcept:
      "Compliance is what people give you when they have to. Commitment is what they give you when they want to. Compliance gets the task done. Commitment gets the task done well, on time, and adapted intelligently when conditions change. The path from compliance to commitment runs through being heard before being asked.",
    signatureQuestion: "Did they agree, or did they just stop arguing?",
    anchorExperiment:
      "After your next team decision, individually ask three people: 'On a scale of 1-10, how committed are you to this?' Anyone below an 8 — ask: 'What would have to be true to make it a 9?' Don't move on until you've heard them out.",
    noticePrompts: [
      "Notice the difference in body language between 'yes I agree' and 'yes I'll do it.'",
      "Notice who gives you the fastest yes — and why that should worry you.",
      "Notice when you mistake your own clarity for the team's commitment.",
    ],
    prescriptionTopics: [
      "The 1-10 commitment check as a leadership instrument",
      "Why fast consensus is usually false consensus",
      "Disagree-and-commit requires that everyone got to disagree first",
    ],
    simulationTypes: [
      "Rolling out a decision your team didn't help shape",
      "Discovering a senior person quietly working against a decision they 'agreed' to",
    ],
    revealHooks: [
      "You build alignment by exhausting people, not convincing them.",
      "Your team commits to outcomes when they help shape the path. You keep handing them the path.",
      "You measure alignment by silence. Silence is not agreement.",
    ],
  },
  {
    number: 10,
    track: "ascent-team",
    theme: "Accountability — Peer-to-Peer",
    shortName: "accountability",
    corePromise:
      "You stop being the only person on the team holding people accountable.",
    coreConcept:
      "If you're the only enforcement mechanism, the team will never outgrow your bandwidth. Real accountability is peer-to-peer: teammates calling each other up to the standard, in real time, without escalating to you. Your job is to make that culture safe, expected, and habitual — then get out of the way.",
    signatureQuestion: "Who else, besides me, can hold this line?",
    anchorExperiment:
      "Find one moment this week where you would normally be the one to address a missed commitment. Don't address it. Instead, ask the affected teammate (privately): 'How are you going to handle this with them?' Coach them through it. Let them have the conversation.",
    noticePrompts: [
      "Notice every time you become the first responder to a missed commitment.",
      "Notice who on the team waits for you vs. who handles it themselves.",
      "Notice the relief on your team when you finally let them resolve it.",
    ],
    prescriptionTopics: [
      "Peer-to-peer accountability as a culture, not a process",
      "Why escalating to the manager is the slow lane",
      "The four levels: avoidance → manager-led → peer-led → self-led",
    ],
    simulationTypes: [
      "Coaching a teammate to confront a peer instead of doing it for them",
      "Receiving 'tell so-and-so to do their job' and bouncing it back",
    ],
    revealHooks: [
      "You hold everyone accountable. That's the problem.",
      "Your team has learned that you'll handle it — so they don't have to.",
      "You're the bottleneck for accountability and you call that 'leadership.'",
    ],
  },
  {
    number: 11,
    track: "ascent-team",
    theme: "Momentum — Protecting the Team's Energy",
    shortName: "momentum",
    corePromise:
      "You start designing for your team's pace, not just their output.",
    coreConcept:
      "Sustainable performance is a function of pace, focus, and recovery — not effort. Teams running on fear, urgency, and over-commitment generate impressive Q1 numbers and Q3 collapse. Your job is to manage the team's energy as deliberately as their roadmap. Tired teams make stupid mistakes. Scattered teams make slow ones.",
    signatureQuestion: "Are we sprinting, or just running scared?",
    anchorExperiment:
      "Do an energy audit this week. List the last 5 things your team committed to. Mark each: high-leverage / medium / low. Then mark each: required your team's full focus / split focus / background. Find the one you can drop or defer. Drop it publicly.",
    noticePrompts: [
      "Notice how often 'urgent' actually means 'I forgot to plan.'",
      "Notice the difference between focused intensity and frantic motion.",
      "Notice who on your team is running on fumes that you've stopped seeing.",
    ],
    prescriptionTopics: [
      "Focus as a finite leadership resource",
      "The cost of context switching — your team pays compound interest",
      "Why 'do less, better' is harder than 'do more'",
    ],
    simulationTypes: [
      "Telling a senior stakeholder you're saying no to their request",
      "Resetting expectations with your boss about scope vs. timeline",
    ],
    revealHooks: [
      "You run your team on cortisol, then wonder why they burn out.",
      "Your urgency is contagious — and it's not always warranted.",
      "You measure your team's commitment by their hours, not their results.",
    ],
  },

  // ───────────────────────────────────────────────────────────────────────
  // ASCENT — LEAD SELF
  // ───────────────────────────────────────────────────────────────────────
  {
    number: 12,
    track: "ascent-self",
    theme: "Identity — Who Am I When No One's Watching",
    shortName: "identity",
    corePromise:
      "You distinguish your role from your self. The job stops being who you are.",
    coreConcept:
      "When your identity fuses with your role, every setback becomes existential and every promotion becomes a personality. Healthy leaders hold their role tightly and their self lightly. The job is what you do; it is not who you are. Knowing the difference is what lets you make hard calls without breaking yourself.",
    signatureQuestion: "If this title disappeared tomorrow, who am I?",
    anchorExperiment:
      "Write two paragraphs. Paragraph 1: 'I am the kind of leader who ___' (your role identity). Paragraph 2: 'I am the kind of person who ___' (your human identity, no work language allowed). Read them back. Notice which one is easier to write — and what that tells you.",
    noticePrompts: [
      "Notice how often you introduce yourself by your title.",
      "Notice the moment a work setback feels like a personal failure.",
      "Notice what's left when you remove the role.",
    ],
    prescriptionTopics: [
      "Role identity vs. self identity — the leadership cost of fusion",
      "Why your worst leadership moments come from defending your identity, not your decision",
      "The freedom of holding the title lightly",
    ],
    simulationTypes: [
      "Receiving feedback that triggers a deep identity threat",
      "Imagining the conversation when you leave this role someday",
    ],
    revealHooks: [
      "You confuse your role with your self. Every critique of the job feels like a critique of you.",
      "Your job has eaten your identity. There's no version of you that exists outside it.",
      "You're protecting the title, not the work.",
    ],
  },
  {
    number: 13,
    track: "ascent-self",
    theme: "Energy — Managing Your Capacity",
    shortName: "energy",
    corePromise:
      "You stop confusing busy with productive, and tired with committed.",
    coreConcept:
      "Time is finite. Energy is renewable but not infinite, and it has four dimensions: physical, emotional, mental, spiritual. Most leaders manage their calendar and ignore their capacity. The result: a perfectly-scheduled day delivered by a leader who's running on three hours of sleep and isn't actually thinking clearly.",
    signatureQuestion: "What am I burning, and is it worth what I'm getting?",
    anchorExperiment:
      "For five days, log two numbers each evening: physical energy (1-10) and mental clarity (1-10) at the end of the day. At the end of the week, look at the pattern. Identify the one habit that visibly degrades both. Drop it for the following week and re-measure.",
    noticePrompts: [
      "Notice the time of day you're sharpest — and what you're using it for.",
      "Notice the small recovery rituals you've stopped doing.",
      "Notice the difference between physical tiredness and emotional depletion.",
    ],
    prescriptionTopics: [
      "The Power of Full Engagement — four dimensions of energy",
      "Why peak performers manage energy, not time",
      "The compound cost of skipped recovery",
    ],
    simulationTypes: [
      "Telling your boss you need to renegotiate your scope",
      "Coaching a high-performer who's burning out and pretending they're not",
    ],
    revealHooks: [
      "You spend your sharpest hours on your dullest work.",
      "You measure your commitment in hours and your team measures you in clarity.",
      "Your energy crashes are predictable. You just don't track them.",
    ],
  },
  {
    number: 14,
    track: "ascent-self",
    theme: "Boundaries — The Strategic No",
    shortName: "boundaries",
    corePromise: "You start saying no to good things to protect the great.",
    coreConcept:
      "Every yes is a no to something else. Leaders who can't say no to good opportunities never have the bandwidth for great ones. The most powerful leadership word is 'no,' said clearly, with reasoning, without apology. A strategic no is not rejection — it's a statement of priority.",
    signatureQuestion: "What am I saying yes to by saying yes to this?",
    anchorExperiment:
      "List your last 10 yeses (commitments, meetings, projects). For each, identify: what did I implicitly say no to by saying yes to this? Find one current commitment you'd say no to in hindsight. This week, exit it cleanly.",
    noticePrompts: [
      "Notice how often you say yes when your gut says no.",
      "Notice the language you use to soften a no until it sounds like a maybe.",
      "Notice who you can say no to easily — and who you can't.",
    ],
    prescriptionTopics: [
      "Essentialism — the disciplined pursuit of less",
      "Why a soft no creates more work than a clear no",
      "The opportunity cost calculation most leaders never run",
    ],
    simulationTypes: [
      "Saying no to a senior leader's pet project",
      "Exiting a commitment you should never have made",
    ],
    revealHooks: [
      "You say yes to be liked, then resent the work.",
      "You don't have a priority problem. You have a 'no' problem.",
      "Your bandwidth is fully consumed by things you didn't choose.",
    ],
  },
  {
    number: 15,
    track: "ascent-self",
    theme: "Voice — Owning Your Point of View",
    shortName: "voice",
    corePromise:
      "You stop hiding behind data, consensus, or 'the team thinks.' You speak as you.",
    coreConcept:
      "Senior leaders are paid for judgment. Hiding your point of view behind data, the team, or 'best practices' may feel safe but it's an abdication. People follow leaders who are willing to say 'I believe' and stand there. Your voice — your actual point of view, owned in the first person — is the most senior thing you bring to a room.",
    signatureQuestion: "What do *I* actually think?",
    anchorExperiment:
      "In your next three meetings, count how often you say 'the team thinks,' 'the data shows,' or 'best practice is.' Then take one of those statements and re-state it in the first person: 'I think...,' 'I believe...,' 'My judgment is....' Notice what shifts in the room.",
    noticePrompts: [
      "Notice the moments you cite data instead of stating an opinion.",
      "Notice when you say 'we' to avoid saying 'I.'",
      "Notice how often your most important point is your last sentence — said quickly, almost as an afterthought.",
    ],
    prescriptionTopics: [
      "The leadership tax of hiding behind data",
      "First-person language as a senior-leadership signal",
      "Why your team needs you to own your judgment, not just your analysis",
    ],
    simulationTypes: [
      "Disagreeing with your boss's strongly-held position",
      "Stating an unpopular opinion in a senior meeting",
    ],
    revealHooks: [
      "You hide your judgment behind the team's. They notice.",
      "You're paid for your point of view and you keep giving us a memo.",
      "Your voice gets quieter the more senior the room.",
    ],
  },
  {
    number: 16,
    track: "ascent-self",
    theme: "Legacy — What You're Really Building",
    shortName: "legacy",
    corePromise:
      "You see your leadership as a body of work, not a stack of weeks.",
    coreConcept:
      "Most leaders measure themselves quarter to quarter and miss the longer pattern. Legacy isn't ego — it's the question of what you're actually building over years, in the people you developed, the standards you held, and the culture you left behind. The leaders who matter long-term are the ones who started thinking about legacy early.",
    signatureQuestion:
      "In 5 years, what will people say it was like to work for me?",
    anchorExperiment:
      "Write your retirement speech — given by someone who worked for you, 10 years from now. What did they learn from you? What did you stand for? What changed because you were here? Read it. Notice the gap between that speech and the leader you're being this week. Pick one thing to close that gap, starting Monday.",
    noticePrompts: [
      "Notice the difference between what you'd be remembered for vs. what you'd want to be remembered for.",
      "Notice which of your current behaviors you'd be proud to be your legacy.",
      "Notice who in your career most shaped you — and why.",
    ],
    prescriptionTopics: [
      "Legacy thinking as a leadership instrument, not retirement nostalgia",
      "The leaders who shape you most are the ones who thought about you most",
      "Why short-term metrics obscure long-term contribution",
    ],
    simulationTypes: [
      "Mentoring a younger version of yourself",
      "Closing out a chapter cleanly — the conversation when you leave",
    ],
    revealHooks: [
      "You're optimizing for this quarter and ignoring the decade.",
      "Your team will remember how you made them feel, not what you delivered. You've inverted the priority.",
      "The leaders who shaped you most are the ones you'd want to become. You're not yet on that path.",
    ],
  },
];

/**
 * Lookup helpers
 */
function getCurriculumWeek(weekNumber) {
  return LL_CURRICULUM.find((w) => w.number === weekNumber) || null;
}

function getCurriculumByTrack(track) {
  return LL_CURRICULUM.filter((w) => w.track === track);
}

function getCurriculumWeekCount() {
  return LL_CURRICULUM.length;
}

module.exports = {
  LL_CURRICULUM,
  getCurriculumWeek,
  getCurriculumByTrack,
  getCurriculumWeekCount,
};
