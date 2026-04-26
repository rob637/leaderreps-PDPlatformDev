// src/components/screens/ascent/frameworks.js
//
// Lead Team — Reusable frameworks v1
//
// Five frameworks. Reused across conversations.
// "Muscle memory beats library size."

export const FRAMEWORKS = {
  prep4: {
    id: 'prep4',
    name: 'The 4-Question Prep',
    summary: 'Sixty seconds before any conversation that matters.',
    steps: [
      { label: 'Outcome', prompt: 'What outcome do I actually want from this conversation?' },
      { label: 'Truth', prompt: 'What is true that I have not said out loud yet?' },
      { label: 'Their ear', prompt: 'What might they hear that I do not intend?' },
      { label: 'First ask', prompt: 'What is the first question I will ask?' },
    ],
  },
  sbi: {
    id: 'sbi',
    name: 'SBI — Situation · Behavior · Impact',
    summary: 'A clean way to give feedback without making it personal.',
    steps: [
      { label: 'Situation', prompt: 'When and where did it happen? Be specific.' },
      { label: 'Behavior', prompt: 'What did they actually do or say? Observable, not inferred.' },
      { label: 'Impact', prompt: 'What was the effect — on the work, the team, you?' },
    ],
  },
  grow: {
    id: 'grow',
    name: 'GROW — Goal · Reality · Options · Will',
    summary: 'A coaching arc that keeps you out of the answer chair.',
    steps: [
      { label: 'Goal', prompt: 'What outcome are you after?' },
      { label: 'Reality', prompt: 'What is actually happening now?' },
      { label: 'Options', prompt: 'What could you do? Name three.' },
      { label: 'Will', prompt: 'What will you do — and by when?' },
    ],
  },
  reversible: {
    id: 'reversible',
    name: 'Reversible vs. Irreversible',
    summary: 'Decide how to decide before you decide.',
    steps: [
      { label: 'Door type', prompt: 'Two-way door (reversible) or one-way door (not)?' },
      { label: 'Decider', prompt: 'Who decides? Who inputs? Who is just informed?' },
      { label: 'By when', prompt: 'When is the call made? What is the cost of waiting?' },
      { label: 'Tell who', prompt: 'How and when do you communicate the decision?' },
    ],
  },
  sixHats: {
    id: 'sixHats',
    name: 'Six Thinking Hats',
    summary: 'Structure a group discussion so every angle gets a voice — no one dominates, nothing gets missed.',
    steps: [
      { label: 'White Hat', prompt: 'What do we know for certain? What data do we have — and what are we missing?' },
      { label: 'Red Hat', prompt: 'What does your gut say? What feelings or reactions are in the room right now?' },
      { label: 'Black Hat', prompt: 'What could go wrong? What are the real risks and weaknesses here?' },
      { label: 'Yellow Hat', prompt: 'What is the best case? Where is the genuine value and opportunity?' },
      { label: 'Green Hat', prompt: 'What else could we try? What creative options or alternatives exist?' },
      { label: 'Blue Hat', prompt: 'What process should we use? What is the agreed next step?' },
    ],
  },
  radarCheck: {
    id: 'radarCheck',
    name: 'Conflict Radar Check',
    summary: 'A quick three-question scan before a hard conversation heats up.',
    steps: [
      { label: 'Issue vs. person', prompt: 'Is this about a behavior/outcome — or am I reacting to the person?' },
      { label: 'Shared stake', prompt: 'What does the other person care about that we actually agree on?' },
      { label: 'One request', prompt: 'What is the single most important thing I need from them going forward?' },
    ],
  },
};

export const getFrameworkById = (id) => FRAMEWORKS[id] || null;
