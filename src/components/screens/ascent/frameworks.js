// src/components/screens/ascent/frameworks.js
//
// Lead Team — Reusable frameworks v1
//
// Three frameworks. Same three reused across all conversations.
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
};

export const getFrameworkById = (id) => FRAMEWORKS[id] || null;
