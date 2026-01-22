// Demo Flow Steps Configuration

export const demoSteps = [
  {
    id: 'welcome',
    screen: 'welcome',
    title: 'Welcome',
    subtitle: 'Meet Alex Martinez',
    duration: '1 min',
    narration: {
      headline: 'Welcome to LeaderReps',
      body: 'This is Alex Martinez, an Engineering Manager at TechStart Inc. Alex is 23 days into the 70-day Leadership Development Program. Let\'s see what a typical day looks like.',
      highlight: null,
    },
  },
  {
    id: 'dashboard',
    screen: 'dashboard',
    title: 'Dashboard',
    subtitle: 'Your Daily Hub',
    duration: '2 min',
    narration: {
      headline: 'Your Leadership Hub',
      body: 'The dashboard gives Alex an at-a-glance view of progress, today\'s activities, and motivational insights. Everything needed to stay on track.',
      highlight: 'Notice the 18-day streak and progress indicators',
    },
  },
  {
    id: 'morning',
    screen: 'daily-practice',
    title: 'Morning Practice',
    subtitle: 'Start with Purpose',
    duration: '3 min',
    narration: {
      headline: 'Start Each Day with Purpose',
      body: 'Alex begins every morning with a 5-minute leadership ritual. Today\'s focus is Strategic Communication - a skill Alex identified as a growth area.',
      highlight: 'The daily intention sets the tone for intentional growth',
    },
  },
  {
    id: 'content',
    screen: 'content-library',
    title: 'Content Library',
    subtitle: 'Deep Learning Resources',
    duration: '3 min',
    narration: {
      headline: 'World-Class Content at Your Fingertips',
      body: 'Throughout the day, Alex can explore videos, programs, documents, and reading summaries. All content is curated to support the current skill focus.',
      highlight: '12 videos watched, with more aligned to current goals',
    },
  },
  {
    id: 'roadmap',
    screen: 'roadmap',
    title: 'Your Journey',
    subtitle: 'Track Progress',
    duration: '2 min',
    narration: {
      headline: 'Visualize Your Leadership Journey',
      body: 'The Roadmap shows Alex\'s progress through the 70-day program. Week 4 is nearly complete, with clear milestones ahead.',
      highlight: '32% complete with 6 achievements earned',
    },
  },
  {
    id: 'reflection',
    screen: 'reflection',
    title: 'Evening Reflection',
    subtitle: 'Capture Insights',
    duration: '2 min',
    narration: {
      headline: 'End Each Day with Reflection',
      body: 'The evening ritual helps Alex capture insights, celebrate wins, and prepare for tomorrow. Journaling reinforces learning and builds self-awareness.',
      highlight: '15 journal entries capturing real leadership moments',
    },
  },
  {
    id: 'community',
    screen: 'community',
    title: 'Community',
    subtitle: 'Learn Together',
    duration: '2 min',
    narration: {
      headline: 'You\'re Not Alone on This Journey',
      body: 'Alex connects with other leaders in the community, shares experiences, and gets support from coaches when needed.',
      highlight: 'Peer learning accelerates growth',
    },
  },
  {
    id: 'conclusion',
    screen: 'conclusion',
    title: 'Your Turn',
    subtitle: 'Start Your Journey',
    duration: '1 min',
    narration: {
      headline: 'Ready to Transform Your Leadership?',
      body: 'Alex\'s journey shows what\'s possible with consistent, intentional practice. In just 23 days, real growth is happening.',
      highlight: null,
    },
  },
];

export const quickDemoSteps = ['welcome', 'dashboard', 'morning', 'content', 'conclusion'];

export const getDemoStep = (stepId) => demoSteps.find(s => s.id === stepId);

export const getNextStep = (currentStepId) => {
  const currentIndex = demoSteps.findIndex(s => s.id === currentStepId);
  return currentIndex < demoSteps.length - 1 ? demoSteps[currentIndex + 1] : null;
};

export const getPrevStep = (currentStepId) => {
  const currentIndex = demoSteps.findIndex(s => s.id === currentStepId);
  return currentIndex > 0 ? demoSteps[currentIndex - 1] : null;
};

export const getStepIndex = (stepId) => demoSteps.findIndex(s => s.id === stepId);

export const totalSteps = demoSteps.length;
