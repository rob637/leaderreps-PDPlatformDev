import { useState } from 'react';
import { useProgress } from '../App';
import { getFunctions, httpsCallable } from 'firebase/functions';

const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    type: 'info',
    title: 'Welcome to Reppy',
    subtitle: 'Your Leadership Coach',
    content: "Grow as a leader, one conversation at a time. No courses. No overwhelm. Just meaningful daily moments that compound into real growth.",
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
    title: "What describes your role?",
    subtitle: "This helps personalize your experience",
    field: 'role',
    options: [
      { value: 'team_lead', label: 'Team Lead', icon: '👥' },
      { value: 'manager', label: 'Manager', icon: '📊' },
      { value: 'director', label: 'Director/VP', icon: '🎯' },
      { value: 'executive', label: 'Executive', icon: '🏛️' },
      { value: 'aspiring', label: 'Aspiring Leader', icon: '🌱' },
      { value: 'entrepreneur', label: 'Entrepreneur', icon: '🚀' },
    ],
  },
  {
    id: 'challenge',
    type: 'choice',
    title: "Biggest leadership challenge?",
    subtitle: "We all have them—be honest",
    field: 'challenge',
    options: [
      { value: 'confidence', label: 'Building Confidence', icon: '💪' },
      { value: 'communication', label: 'Communication', icon: '💬' },
      { value: 'difficult_people', label: 'Difficult Conversations', icon: '🔥' },
      { value: 'time', label: 'Time & Priorities', icon: '⏰' },
      { value: 'delegation', label: 'Delegation', icon: '🤝' },
      { value: 'influence', label: 'Influence', icon: '✨' },
    ],
  },
  {
    id: 'goal',
    type: 'coached-input',
    title: "What kind of leader do you want to become?",
    subtitle: "Dream a little. I'll help you refine it.",
    placeholder: "I want to become a leader who...",
    field: 'goal',
    multiline: true,
  },
  {
    id: 'commitment',
    type: 'choice',
    title: "Daily time investment?",
    subtitle: "Even 5 minutes creates real change",
    field: 'commitment',
    options: [
      { value: '5', label: '5 minutes', icon: '⚡' },
      { value: '10', label: '10 minutes', icon: '🎯' },
      { value: '15', label: '15+ minutes', icon: '🚀' },
    ],
  },
  {
    id: 'ready',
    type: 'info',
    title: "You're ready!",
    subtitle: "Your journey begins now",
    content: "Leadership isn't about being perfect. It's about showing up, learning, and getting a little better each day. I'll be here with you.",
    icon: '✨',
    final: true,
  },
];

export default function OnboardingScreen() {
  const { progress, updateProgress } = useProgress();
  const [currentStep, setCurrentStep] = useState(0);
  const [profile, setProfile] = useState(progress?.profile || {});
  const [inputValue, setInputValue] = useState('');
  
  // AI coaching state
  const [isCoaching, setIsCoaching] = useState(false);
  const [coachFeedback, setCoachFeedback] = useState(null);
  const [goalApproved, setGoalApproved] = useState(false);

  const step = ONBOARDING_STEPS[currentStep];

  // Cheat code for testing
  const CHEAT_CODE = 'moose';

  // Get AI coaching on goal
  const getGoalCoaching = async () => {
    if (!inputValue.trim()) return;
    
    // Check for cheat code - auto-approve
    if (inputValue.trim().toLowerCase() === CHEAT_CODE) {
      setCoachFeedback("🦌 Moose mode activated! A noble leadership aspiration.");
      setGoalApproved(true);
      return;
    }
    
    setIsCoaching(true);
    setCoachFeedback(null);
    
    try {
      const functions = getFunctions();
      const reppyCoach = httpsCallable(functions, 'reppyCoach');
      
      const coachingPrompt = `The user is onboarding and was asked: "What kind of leader do you want to become?"

Their response: "${inputValue}"

Their name: ${profile.name || 'Unknown'}
Their role: ${profile.role || 'Unknown'}
Their challenge: ${profile.challenge || 'Unknown'}

EVALUATE their answer:
1. Is it thoughtful and specific enough to be meaningful?
2. Is it too vague, too short, or gibberish/garbage?

If it's GOOD (specific, thoughtful, at least a sentence):
- Start with "APPROVED:" 
- Give brief encouragement (1-2 sentences)
- Maybe highlight what you like about their vision

If it NEEDS WORK (vague, too short, gibberish, or lazy):
- Start with "REFINE:"
- Gently call it out (be direct but kind)
- Ask a specific follow-up question to help them dig deeper
- Give an example of what a more specific answer might look like

Keep response under 100 words. Be warm but honest - don't accept garbage.`;

      const result = await reppyCoach({
        messages: [{ role: 'user', content: coachingPrompt }],
        context: {
          sessionType: 'onboarding',
          sessionTheme: 'goal-setting',
        },
      });
      
      const response = result.data.message;
      const isApproved = response.toUpperCase().startsWith('APPROVED');
      
      setCoachFeedback(response.replace(/^(APPROVED:|REFINE:)\s*/i, ''));
      setGoalApproved(isApproved);
      
    } catch (error) {
      console.error('Coaching error:', error);
      // On error, just let them proceed
      setGoalApproved(true);
      setCoachFeedback("I couldn't review that, but let's keep going!");
    } finally {
      setIsCoaching(false);
    }
  };

  const handleNext = async () => {
    // Save input value if this is an input step
    if ((step.type === 'input' || step.type === 'coached-input') && step.field) {
      setProfile(prev => ({ ...prev, [step.field]: inputValue }));
      setInputValue('');
      setCoachFeedback(null);
      setGoalApproved(false);
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
    if (step.type === 'coached-input') return inputValue.trim().length > 0 && goalApproved;
    if (step.type === 'choice') return !!profile[step.field];
    return false;
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col safe-area-top safe-area-bottom">
      {/* Progress bar - fixed at top */}
      <div className="px-6 pt-6 pb-4 bg-gray-900">
        <div className="flex gap-1.5">
          {ONBOARDING_STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                i < currentStep ? 'bg-blue-600' :
                i === currentStep ? 'bg-blue-400' :
                'bg-gray-700'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content - scrollable area */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="max-w-md mx-auto py-8" key={currentStep}>
          {/* Logo for welcome step */}
          {step.showLogo && (
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg">
                <img 
                  src="/lr_logo_teal__1_.png" 
                  alt="LeaderReps" 
                  className="h-10 brightness-0 invert"
                />
              </div>
            </div>
          )}

          {/* Icon for final step */}
          {step.icon && !step.showLogo && (
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 rounded-2xl bg-green-600 flex items-center justify-center shadow-lg">
                <span className="text-4xl">{step.icon}</span>
              </div>
            </div>
          )}

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-bold text-white text-center mb-2">
            {step.title}
          </h1>
          <p className="text-gray-400 text-center mb-8 text-base">
            {step.subtitle}
          </p>

          {/* Content based on step type */}
          {step.type === 'info' && (
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-8">
              <p className="text-gray-200 text-center leading-relaxed text-base">
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
                  rows={4}
                  className="w-full bg-gray-800 border-2 border-gray-600 rounded-xl px-4 py-3 text-white text-base placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all resize-none"
                  autoFocus
                />
              ) : (
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={step.placeholder}
                  className="w-full bg-gray-800 border-2 border-gray-600 rounded-xl px-4 py-4 text-white text-lg text-center placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                  autoFocus
                />
              )}
            </div>
          )}

          {/* Coached input with AI feedback */}
          {step.type === 'coached-input' && (
            <div className="mb-8">
              <textarea
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setCoachFeedback(null);
                  setGoalApproved(false);
                }}
                placeholder={step.placeholder}
                rows={4}
                className="w-full bg-gray-800 border-2 border-gray-600 rounded-xl px-4 py-3 text-white text-base placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all resize-none"
                autoFocus
              />
              
              {/* Coach feedback */}
              {coachFeedback && (
                <div className={`mt-4 p-4 rounded-xl ${
                  goalApproved 
                    ? 'bg-green-900/30 border border-green-600' 
                    : 'bg-yellow-900/30 border border-yellow-600'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      goalApproved ? 'bg-green-600' : 'bg-yellow-600'
                    }`}>
                      <span className="text-sm">{goalApproved ? '✓' : '💭'}</span>
                    </div>
                    <div>
                      <p className={`text-sm font-medium mb-1 ${
                        goalApproved ? 'text-green-400' : 'text-yellow-400'
                      }`}>
                        {goalApproved ? 'Great goal!' : 'Let me help...'}
                      </p>
                      <p className="text-gray-300 text-sm leading-relaxed">
                        {coachFeedback}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Loading state */}
              {isCoaching && (
                <div className="mt-4 p-4 rounded-xl bg-gray-700 border border-gray-600">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center animate-pulse">
                      <span className="text-sm">🤔</span>
                    </div>
                    <p className="text-gray-400 text-sm">Reppy is thinking...</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {step.type === 'choice' && (
            <div className="space-y-3 mb-8">
              {step.options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleChoice(option.value)}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center gap-4 ${
                    profile[step.field] === option.value
                      ? 'bg-blue-600/20 border-blue-500 text-white'
                      : 'bg-gray-800 border-gray-600 text-gray-200 hover:border-gray-500 hover:bg-gray-750'
                  }`}
                >
                  <span className="text-2xl">{option.icon}</span>
                  <span className="font-medium text-base">{option.label}</span>
                  {profile[step.field] === option.value && (
                    <svg className="w-5 h-5 ml-auto text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Fixed Bottom Button Area - ALWAYS VISIBLE */}
      <div className="flex-shrink-0 bg-gray-900 border-t border-gray-800 px-6 py-4 safe-area-bottom">
        <div className="max-w-md mx-auto">
          {/* Back button row */}
          {currentStep > 0 && (
            <button
              onClick={() => setCurrentStep(prev => prev - 1)}
              className="flex items-center gap-2 text-gray-400 hover:text-white mb-3 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium">Back</span>
            </button>
          )}

          {/* Continue button for info/input steps */}
          {(step.type === 'info' || step.type === 'input') && (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="w-full py-4 px-6 rounded-xl font-semibold text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
            >
              {step.final ? "Let's Go!" : 'Continue'}
            </button>
          )}

          {/* Coached input buttons */}
          {step.type === 'coached-input' && (
            <div className="space-y-3">
              {!goalApproved ? (
                <button
                  onClick={getGoalCoaching}
                  disabled={!inputValue.trim() || isCoaching}
                  className="w-full py-4 px-6 rounded-xl font-semibold text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                >
                  {isCoaching ? 'Reviewing...' : 'Submit for Review'}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="w-full py-4 px-6 rounded-xl font-semibold text-base bg-green-600 hover:bg-green-700 text-white shadow-lg transition-all"
                >
                  Continue
                </button>
              )}
              
              {coachFeedback && !goalApproved && (
                <p className="text-gray-500 text-xs text-center">
                  Update your answer above and submit again
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
