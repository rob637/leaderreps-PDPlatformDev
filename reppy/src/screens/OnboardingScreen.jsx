import { useState } from 'react';
import { useProgress, useTheme } from '../App';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getThemeClasses } from '../theme';

const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    type: 'info',
    title: "Hey, I'm Reppy",
    subtitle: 'Your Personal Leadership Coach',
    content: "I'm not a course or a chatbot with generic advice. I learn how you think, remember your journey, and coach you the way *you* learn best.\n\nEvery day: 3 quick touchpoints, real conversations, lasting growth.",
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
    id: 'coachingStyle',
    type: 'coaching-style',
    title: "How should I coach you?",
    subtitle: "You can change this anytime",
    field: 'coachingStyle',
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
  const { isDark } = useTheme();
  const theme = getThemeClasses(isDark);
  
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
    if (step.type === 'coaching-style') return !!profile[step.field];
    return false;
  };

  return (
    <div className={`fixed inset-0 ${theme.bg} flex flex-col safe-area-top safe-area-bottom`}>
      {/* Progress bar - fixed at top */}
      <div className={`px-6 pt-6 pb-4 ${theme.bg} flex-shrink-0`}>
        <div className="flex gap-1.5">
          {ONBOARDING_STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                i < currentStep ? 'bg-blue-600' :
                i === currentStep ? 'bg-blue-400' :
                isDark ? 'bg-gray-700' : 'bg-gray-200'
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
              <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-xl">
                <img 
                  src="/reppy-icon-192.png" 
                  alt="Reppy" 
                  className="w-full h-full object-cover"
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
          <h1 className={`text-2xl md:text-3xl font-bold ${theme.textPrimary} text-center mb-2`}>
            {step.title}
          </h1>
          <p className={`${theme.textMuted} text-center mb-8 text-base`}>
            {step.subtitle}
          </p>

          {/* Content based on step type */}
          {step.type === 'info' && (
            <div className={`${theme.card} rounded-xl ${theme.border} border p-6 mb-8`}>
              <p className={`${theme.textSecondary} text-center leading-relaxed text-base`}>
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
                  className={`w-full ${theme.input} border-2 rounded-xl px-4 py-3 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all resize-none`}
                  autoFocus
                />
              ) : (
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={step.placeholder}
                  className={`w-full ${theme.input} border-2 rounded-xl px-4 py-4 text-lg text-center focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all`}
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
                className={`w-full ${theme.input} border-2 rounded-xl px-4 py-3 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all resize-none`}
                autoFocus
              />
              
              {/* Coach feedback */}
              {coachFeedback && (
                <div className={`mt-4 p-4 rounded-xl ${
                  goalApproved 
                    ? 'bg-green-100 border border-green-500 dark:bg-green-900/30 dark:border-green-600' 
                    : 'bg-yellow-100 border border-yellow-500 dark:bg-yellow-900/30 dark:border-yellow-600'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      goalApproved ? 'bg-green-600' : 'bg-yellow-600'
                    }`}>
                      <span className="text-sm text-white">{goalApproved ? '✓' : '💭'}</span>
                    </div>
                    <div>
                      <p className={`text-sm font-medium mb-1 ${
                        goalApproved ? 'text-green-700 dark:text-green-400' : 'text-yellow-700 dark:text-yellow-400'
                      }`}>
                        {goalApproved ? 'Great goal!' : 'Let me help...'}
                      </p>
                      <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {coachFeedback}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Loading state */}
              {isCoaching && (
                <div className={`mt-4 p-4 rounded-xl ${theme.card} ${theme.border} border`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center animate-pulse">
                      <span className="text-sm">🤔</span>
                    </div>
                    <p className={`${theme.textMuted} text-sm`}>Reppy is thinking...</p>
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
                      ? 'bg-blue-600/20 border-blue-500'
                      : `${theme.card} ${theme.border} ${theme.textSecondary} hover:border-blue-300`
                  }`}
                >
                  <span className="text-2xl">{option.icon}</span>
                  <span className={`font-medium text-base ${profile[step.field] === option.value ? 'text-blue-600' : theme.textPrimary}`}>{option.label}</span>
                  {profile[step.field] === option.value && (
                    <svg className="w-5 h-5 ml-auto text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Coaching Style Selection */}
          {step.type === 'coaching-style' && (
            <div className="space-y-4 mb-8">
              {/* Guide Me */}
              <button
                onClick={() => handleChoice('guide')}
                className={`w-full p-5 rounded-xl border-2 transition-all text-left ${
                  profile.coachingStyle === 'guide'
                    ? 'bg-blue-600/20 border-blue-500'
                    : `${theme.card} ${theme.border} hover:border-blue-300`
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-600/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🧭</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className={`font-semibold ${theme.textPrimary}`}>Guide Me</h4>
                      {profile.coachingStyle === 'guide' && (
                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <p className={`${theme.textMuted} text-sm mt-1`}>
                      I'll share ideas and examples upfront, then help you apply them to your situation.
                    </p>
                    <p className={`${theme.textFaint} text-xs mt-2 italic`}>
                      Best for: Quick answers, when you're new to a topic
                    </p>
                  </div>
                </div>
              </button>

              {/* Coach Me */}
              <button
                onClick={() => handleChoice('coach')}
                className={`w-full p-5 rounded-xl border-2 transition-all text-left ${
                  profile.coachingStyle === 'coach'
                    ? 'bg-blue-600/20 border-blue-500'
                    : `${theme.card} ${theme.border} hover:border-blue-300`
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">💬</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className={`font-semibold ${theme.textPrimary}`}>Coach Me</h4>
                      <span className="text-xs px-2 py-0.5 bg-blue-600 text-white rounded-full">Recommended</span>
                      {profile.coachingStyle === 'coach' && (
                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <p className={`${theme.textMuted} text-sm mt-1`}>
                      I'll ask questions first, then offer guidance when you need it. A balanced approach.
                    </p>
                    <p className={`${theme.textFaint} text-xs mt-2 italic`}>
                      Best for: Building skills while getting support
                    </p>
                  </div>
                </div>
              </button>

              {/* Challenge Me */}
              <button
                onClick={() => handleChoice('challenge')}
                className={`w-full p-5 rounded-xl border-2 transition-all text-left ${
                  profile.coachingStyle === 'challenge'
                    ? 'bg-blue-600/20 border-blue-500'
                    : `${theme.card} ${theme.border} hover:border-blue-300`
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-600/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🔥</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className={`font-semibold ${theme.textPrimary}`}>Challenge Me</h4>
                      {profile.coachingStyle === 'challenge' && (
                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <p className={`${theme.textMuted} text-sm mt-1`}>
                      I'll push you to think deeply. Expect questions, not answers. Maximum growth.
                    </p>
                    <p className={`${theme.textFaint} text-xs mt-2 italic`}>
                      Best for: Deep learning, when you want to be stretched
                    </p>
                  </div>
                </div>
              </button>

              <p className={`${theme.textFaint} text-xs text-center mt-4`}>
                💡 Research shows we learn more when challenged—but there's no wrong choice!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Bottom Button Area - ALWAYS VISIBLE */}
      <div className={`flex-shrink-0 ${theme.bg} border-t ${theme.border} px-6 py-4 safe-area-bottom`}>
        <div className="max-w-md mx-auto">
          {/* Back button row */}
          {currentStep > 0 && (
            <button
              onClick={() => setCurrentStep(prev => prev - 1)}
              className={`flex items-center gap-2 ${theme.textMuted} hover:${theme.textPrimary} mb-3 transition-colors`}
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
                <p className={`${theme.textFaint} text-xs text-center`}>
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
