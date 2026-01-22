import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw, 
  Compass, 
  Play,
  Pause,
  X
} from 'lucide-react';
import { Button, ProgressBar } from '../ui';

const DemoControls = ({ 
  currentStep,
  currentIndex,
  totalSteps,
  progress,
  mode,
  canGoNext,
  canGoPrev,
  goNext,
  goPrev,
  restart,
  toggleMode,
  togglePause,
  isPaused,
  timeRemaining,
  goToStep,
  allSteps,
}) => {
  const [showStepPicker, setShowStepPicker] = React.useState(false);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Step Picker Dropdown */}
      {showStepPicker && (
        <div className="absolute bottom-full left-0 right-0 mb-2 mx-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-4 max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Jump to Section</h3>
              <button 
                onClick={() => setShowStepPicker(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {allSteps.map((step, idx) => (
                <button
                  key={step.id}
                  onClick={() => {
                    goToStep(step.id);
                    setShowStepPicker(false);
                  }}
                  className={`p-3 rounded-lg text-left transition-all ${
                    step.id === currentStep?.id
                      ? 'bg-primary-100 border-2 border-primary-500'
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      step.id === currentStep?.id
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="text-xs text-gray-500">{step.duration}</span>
                  </div>
                  <p className="font-medium text-sm text-gray-900">{step.title}</p>
                  <p className="text-xs text-gray-500 truncate">{step.subtitle}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Control Bar */}
      <div className="bg-white/95 backdrop-blur border-t border-gray-200 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-3">
          {/* Progress Bar */}
          <div className="mb-3">
            <ProgressBar value={progress} size="sm" />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            {/* Left: Mode Toggle & Timer */}
            <div className="flex items-center gap-2">
              <Button
                variant={mode === 'guided' ? 'primary' : 'ghost'}
                size="sm"
                onClick={toggleMode}
                className="flex items-center gap-1.5"
              >
                {mode === 'guided' ? (
                  <>
                    <Play className="w-4 h-4" />
                    <span className="hidden sm:inline">Guided</span>
                  </>
                ) : (
                  <>
                    <Compass className="w-4 h-4" />
                    <span className="hidden sm:inline">Explore</span>
                  </>
                )}
              </Button>
              
              {/* Timer & Pause for Guided Mode */}
              {mode === 'guided' && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={togglePause}
                    className="flex items-center gap-1"
                  >
                    {isPaused ? (
                      <Play className="w-4 h-4 text-green-600" />
                    ) : (
                      <Pause className="w-4 h-4 text-amber-600" />
                    )}
                  </Button>
                  <span className="text-sm font-mono text-gray-600 min-w-[2rem]">
                    {timeRemaining}s
                  </span>
                </div>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={restart}
                className="flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Restart</span>
              </Button>
            </div>

            {/* Center: Step Info & Picker */}
            <button
              onClick={() => setShowStepPicker(!showStepPicker)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="text-sm font-medium text-gray-700">
                {currentIndex + 1} / {totalSteps}
              </span>
              <span className="text-sm text-gray-500 hidden sm:inline">
                {currentStep?.title}
              </span>
            </button>

            {/* Right: Navigation */}
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={goPrev}
                disabled={!canGoPrev}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={goNext}
                disabled={!canGoNext}
                className="flex items-center gap-1"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoControls;
