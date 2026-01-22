import React from 'react';
import DemoHeader from './DemoHeader';
import DemoControls from './DemoControls';
import DemoNarration from './DemoNarration';
import PresenterPanel from './PresenterPanel';
import useDemoFlow from '../../hooks/useDemoFlow';
import usePresenterMode from '../../hooks/usePresenterMode';
import useNarrationAudio from '../../hooks/useNarrationAudio';

// Import screens
import WelcomeScreen from '../../screens/WelcomeScreen';
import DashboardScreen from '../../screens/DashboardScreen';
import DailyPracticeScreen from '../../screens/DailyPracticeScreen';
import ContentLibraryScreen from '../../screens/ContentLibraryScreen';
import RoadmapScreen from '../../screens/RoadmapScreen';
import ReflectionScreen from '../../screens/ReflectionScreen';
import CommunityScreen from '../../screens/CommunityScreen';
import ConclusionScreen from '../../screens/ConclusionScreen';

const screens = {
  'welcome': WelcomeScreen,
  'dashboard': DashboardScreen,
  'daily-practice': DailyPracticeScreen,
  'content-library': ContentLibraryScreen,
  'roadmap': RoadmapScreen,
  'reflection': ReflectionScreen,
  'community': CommunityScreen,
  'conclusion': ConclusionScreen,
};

const DemoShell = ({ onLogout }) => {
  const {
    currentStep,
    currentStepId,
    currentIndex,
    totalSteps,
    progress,
    mode,
    allSteps,
    isPaused,
    timeRemaining,
    goNext,
    goPrev,
    goToStep,
    restart,
    toggleMode,
    togglePause,
    canGoNext,
    canGoPrev,
  } = useDemoFlow();

  const {
    isPresenterMode,
    isPanelCollapsed,
    currentNotes,
    togglePresenterMode,
    togglePanel,
  } = usePresenterMode(currentStep?.screen || currentStepId);

  // Audio narration
  const {
    isPlaying: isAudioPlaying,
    hasAudio,
    replay: replayAudio,
  } = useNarrationAudio(currentStepId, mode === 'guided', isPaused);

  // Use the step ID to find the screen (they match now)
  const screenId = currentStep?.screen || currentStepId;
  const ScreenComponent = screens[screenId] || WelcomeScreen;
  const showNarration = mode === 'guided' && currentStep?.narration;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - hidden on welcome/conclusion */}
      {currentStepId !== 'welcome' && currentStepId !== 'conclusion' && (
        <DemoHeader onLogout={onLogout} />
      )}

      {/* Main Content */}
      <main className={`pb-24 ${isPresenterMode ? 'mr-80' : ''}`}>
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Narration Banner */}
          {showNarration && (
            <DemoNarration 
              narration={currentStep.narration} 
              hasAudio={hasAudio}
              isAudioPlaying={isAudioPlaying}
              onReplayAudio={replayAudio}
            />
          )}

          {/* Screen Content */}
          <ScreenComponent 
            goNext={goNext}
            currentStep={currentStep}
          />
        </div>
      </main>

      {/* Presenter Panel */}
      <PresenterPanel
        isVisible={isPresenterMode}
        isCollapsed={isPanelCollapsed}
        notes={currentNotes}
        onToggleCollapse={togglePanel}
        onClose={togglePresenterMode}
      />

      {/* Bottom Controls */}
      <DemoControls
        currentStep={currentStep}
        currentIndex={currentIndex}
        totalSteps={totalSteps}
        progress={progress}
        mode={mode}
        canGoNext={canGoNext}
        canGoPrev={canGoPrev}
        goNext={goNext}
        goPrev={goPrev}
        restart={restart}
        toggleMode={toggleMode}
        togglePause={togglePause}
        isPaused={isPaused}
        timeRemaining={timeRemaining}
        goToStep={goToStep}
        allSteps={allSteps}
        hasAudio={hasAudio}
        isAudioPlaying={isAudioPlaying}
      />
    </div>
  );
};

export default DemoShell;
