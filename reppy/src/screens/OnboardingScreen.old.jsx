import { useState } from 'react';
import { useProgress } from '../App';

const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    type: 'info',
    title: 'Welcome to Reppy',
    subtitle: 'Your Leadership Growth Partner',
    content: "Reppy is your personal leadership coach, brought to you by LeaderReps. Grow one small step at a time. No courses. No overwhelm. Just meaningful daily moments that compound into real growth.",
    showLogo: true,
  },
  {
    id: 'name',
    type: 'input',
    title: "What should I call you?",
    subtitle: "First name is perfect",
    placeholder: "Your name",
    field: 'name',
  },
  {
    id: 'role',
    type: 'choice',
    title: "What best describes your role?",
    subtitle: "This helps me personalize your experience",
    field: 'role',
    options: [
      { value: 'team_lead', label: 'Team Lead', description: 'Managing a small team' },
      { value: 'manager', label: 'Manager', description: 'Leading multiple teams or a department' },
      { value: 'director', label: 'Director/VP', description: 'Senior leadership role' },
      { value: 'executive', label: 'Executive', description: 'C-suite or company leadership' },
      { value: 'aspiring', label: 'Aspiring Leader', description: 'Not yet in a formal role' },
      { value: 'entrepreneur', label: 'Entrepreneur/Founder', description: 'Building something new' },
    ],
  },
  {
    id: 'challenge',
    type: 'choice',
    title: "What's your biggest leadership challenge right now?",
    subtitle: "Be honest—we all have them",
    field: 'challenge',
    options: [
      { value: 'confidence', label: 'Building Confidence', description: "Feeling like I'm ready to lead" },
      { value: 'communication', label: 'Communication', description: 'Getting my message across effectively' },
      { value: 'difficult_people', label: 'Difficult Conversations', description: 'Handling conflict or giving feedback' },
      { value: 'time', label: 'Time & Priorities', description: 'Too much to do, not enough time' },
      { value: 'delegation', label: 'Delegation', description: 'Letting go and empowering others' },
      { value: 'influence', label: 'Influence', description: 'Getting buy-in without authority' },
    ],
  },
  {
    id: 'goal',
    type: 'input',
    title: "What kind of leader do you want to become?",
    subtitle: "Dream a little. No wrong answers.",
    placeholder: "I want to become a leader who...",
    field: 'goal',
    multiline: true,
  },
  {
    id: 'commitment',
    type: 'choice',
    title: "How much time can you invest daily?",
    subtitle: "Even 5 minutes can create real change",
    field: 'commitment',
    options: [
      { value: '5', label: '5 minutes', description: 'Quick daily check-in' },
      { value: '10', label: '10 minutes', description: 'Deeper daily practice' },
      { value: '15', label: '15+ minutes', description: 'Committed growth time' },
    ],
  },
  {
    id: 'ready',
    type: 'info',
    title: "You're ready!",
    subtitle: "Your leadership journey begins now",
    content: "Remember: leadership isn't about being perfect. It's about showing up, learning, and getting a little better each day. I'll be here with you every step of the way.",
    icon: '✨',
    final: true,
  },
];

export default function OnboardingScreen() {
  const { progress, updateProgress } = useProgress();
  const [currentStep, setCurrentStep] = useState(0);
  const [profile, setProfile] = useState(progress?.profile || {});
  const [inputValue, setInputValue] = useState('');

  const step = ONBOARDING_STEPS[currentStep];

  const handleNext = async () => {
    // Save input value if this is an input step
    if (step.type === 'input' && step.field) {
      setProfile(prev => ({ ...prev, [step.field]: inputValue }));
      setInputValue('');
    }

    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Complete onboarding
      await updateProgress({
        onboardingComplete: true,
        profile: profile,
      });
    }
  };

  const handleChoice = async (value) => {
    const newProfile = { ...profile, [step.field]: value };
    setProfile(newProfile);
    
    // Auto-advance after selection
    setTimeout(() => {
      setCurrentStep(prev => prev + 1);
    }, 300);
  };

  const canProceed = () => {
    if (step.type === 'info') return true;
    if (step.type === 'input') return inputValue.trim().length > 0;
    if (step.type === 'choice') return !!profile[step.field];
    return false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-reppy-cream to-reppy-teal-light flex flex-col safe-area-top safe-area-bottom">
      {/* Progress bar */}
      <div className="px-6 pt-6">
        <div className="flex gap-1.5">
          {ONBOARDING_STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i < currentStep ? 'bg-reppy-teal' :
                i === currentStep ? 'bg-reppy-teal/60' :
                'bg-reppy-navy/10'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-md animate-fade-in" key={currentStep}>
          {/* LeaderReps Logo for welcome step */}
          {step.showLogo && (
            <div className="flex justify-center mb-6">
              <img 
                src="/lr_logo_teal__1_.png" 
                alt="LeaderReps" 
                className="h-12 object-contain"
              />
            </div>
          )}
          
          {/* Icon for info steps */}
          {step.type === 'info' && step.icon && (
            <div className="text-6xl text-center mb-6">{step.icon}</div>
          )}

          {/* Title */}
          <h1 className="text-2xl font-bold text-reppy-navy text-center mb-2">
            {step.title}
          </h1>
          
          {/* Subtitle */}
          <p className="text-reppy-navy/60 text-center mb-8">
            {step.subtitle}
          </p>

          {/* Content based on type */}
          {step.type === 'info' && step.content && (
            <div className="bg-white rounded-2xl p-6 shadow-sm mb-8">
              <p className="text-reppy-navy/80 leading-relaxed text-center">
                {step.content}
              </p>
            </div>
          )}

          {step.type === 'input' && (
            <div className="mb-8">
              {step.multiline ? (
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={step.placeholder}
                  className="input-journal h-32"
                  autoFocus
                />
              ) : (
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={step.placeholder}
                  className="input-journal text-center text-lg"
                  autoFocus
                />
              )}
            </div>
          )}

          {step.type === 'choice' && (
            <div className="space-y-3 mb-8">
              {step.options.map(option => (
                <button
                  key={option.value}
                  onClick={() => handleChoice(option.value)}
                  className={`w-full p-4 rounded-xl text-left transition-all ${
                    profile[step.field] === option.value
                      ? 'bg-reppy-teal text-white shadow-md'
                      : 'bg-white hover:bg-reppy-teal-light border border-reppy-teal-light'
                  }`}
                >
                  <div className={`font-medium ${
                    profile[step.field] === option.value ? 'text-white' : 'text-reppy-navy'
                  }`}>
                    {option.label}
                  </div>
                  <div className={`text-sm ${
                    profile[step.field] === option.value ? 'text-white/80' : 'text-reppy-navy/60'
                  }`}>
                    {option.description}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Continue button */}
          {(step.type === 'info' || step.type === 'input') && (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="btn-primary w-full"
            >
              {step.final ? "Let's begin" : 'Continue'}
            </button>
          )}
        </div>
      </div>

      {/* Back button (only show after first step) */}
      {currentStep > 0 && (
        <div className="px-6 pb-8">
          <button
            onClick={() => setCurrentStep(prev => prev - 1)}
            className="text-reppy-navy/60 text-sm flex items-center gap-1 mx-auto"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>
      )}
    </div>
  );
}
