// src/components/rep/GazooSpotlight.jsx
// The Great Gazoo - Guided Spotlight Mode
// Walks users through their dashboard with an interactive spotlight tour

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, ChevronRight, ChevronLeft, Sparkles, 
  Target, Play, Zap, Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Step definitions for the guided tour
// Each step targets an element with data-gazoo-step="stepId"
const TOUR_STEPS = {
  dashboard: [
    {
      id: 'win-the-day',
      title: "Set Your Daily Wins",
      description: "These are your 3 most important things to accomplish today. Be specific!",
      tip: "Pro tip: Start with what you're avoiding - those are often the most impactful.",
      action: "Set at least one win, then tap Next",
      position: 'right' // Where Gazoo panel appears relative to element
    },
    {
      id: 'conditioning',
      title: "Weekly Conditioning",
      description: "Build leadership muscles with focused drills. Complete at least one rep this week.",
      tip: "Conditioning builds lasting habits. Commit to a rep and follow through!",
      action: "Tap to see available conditioning reps",
      position: 'right'
    },
    {
      id: 'this-weeks-actions',
      title: "This Week's Actions",
      description: "Your weekly curriculum - content, calls, and community sessions.",
      tip: "Work through these in order for the best learning experience.",
      action: "Tap an item to see details",
      position: 'right'
    },
    {
      id: 'pm-bookend',
      title: "PM Reflection",
      description: "End your day with reflection. What worked? What didn't? What's next?",
      tip: "Reflection turns experience into wisdom. Don't skip this!",
      action: "Complete this at the end of your workday",
      position: 'right'
    }
  ]
};

// Calculate position for Gazoo panel based on element location
const calculatePanelPosition = (elementRect, preferredPosition, windowWidth, windowHeight) => {
  const panelWidth = 320;
  const panelHeight = 280;
  const padding = 16;
  
  // Try preferred position first
  let position = { top: 0, left: 0 };
  
  if (preferredPosition === 'right' && elementRect.right + panelWidth + padding < windowWidth) {
    // Position to the right
    position.left = elementRect.right + padding;
    position.top = Math.max(padding, Math.min(elementRect.top, windowHeight - panelHeight - padding));
  } else if (preferredPosition === 'left' && elementRect.left - panelWidth - padding > 0) {
    // Position to the left
    position.left = elementRect.left - panelWidth - padding;
    position.top = Math.max(padding, Math.min(elementRect.top, windowHeight - panelHeight - padding));
  } else if (elementRect.bottom + panelHeight + padding < windowHeight) {
    // Position below
    position.top = elementRect.bottom + padding;
    position.left = Math.max(padding, Math.min(elementRect.left, windowWidth - panelWidth - padding));
  } else {
    // Position above
    position.top = Math.max(padding, elementRect.top - panelHeight - padding);
    position.left = Math.max(padding, Math.min(elementRect.left, windowWidth - panelWidth - padding));
  }
  
  return position;
};

const GazooSpotlight = ({ 
  isOpen, 
  onClose, 
  screenContext = 'dashboard',
  onComplete 
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [elementRect, setElementRect] = useState(null);
  const [panelPosition, setPanelPosition] = useState({ top: 100, left: 100 });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [_completedSteps, setCompletedSteps] = useState(new Set());
  
  const steps = useMemo(() => TOUR_STEPS[screenContext] || [], [screenContext]);
  const currentStep = steps[currentStepIndex];
  
  // Find and observe the target element
  const updateElementPosition = useCallback(() => {
    if (!currentStep) return;
    
    const element = document.querySelector(`[data-gazoo-step="${currentStep.id}"]`);
    if (element) {
      const rect = element.getBoundingClientRect();
      setElementRect(rect);
      
      const position = calculatePanelPosition(
        rect, 
        currentStep.position, 
        window.innerWidth, 
        window.innerHeight
      );
      setPanelPosition(position);
    } else {
      // Element not found - might not be visible yet
      setElementRect(null);
    }
  }, [currentStep]);
  
  // Set up resize observer and scroll listener
  useEffect(() => {
    if (!isOpen) return;
    
    updateElementPosition();
    
    // Update on scroll and resize
    const handleUpdate = () => updateElementPosition();
    window.addEventListener('scroll', handleUpdate, true);
    window.addEventListener('resize', handleUpdate);
    
    // Poll for element changes (in case DOM updates)
    const interval = setInterval(updateElementPosition, 500);
    
    return () => {
      window.removeEventListener('scroll', handleUpdate, true);
      window.removeEventListener('resize', handleUpdate);
      clearInterval(interval);
    };
  }, [isOpen, updateElementPosition]);
  
  // Scroll element into view when step changes
  useEffect(() => {
    if (!isOpen || !currentStep) return;
    
    const element = document.querySelector(`[data-gazoo-step="${currentStep.id}"]`);
    if (element) {
      // Scroll element into view with some padding
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Update position after scroll
      setTimeout(updateElementPosition, 300);
    }
  }, [isOpen, currentStep, updateElementPosition]);
  
  const handleNext = useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      setIsTransitioning(true);
      setCompletedSteps(prev => new Set([...prev, currentStep.id]));
      
      setTimeout(() => {
        setCurrentStepIndex(prev => prev + 1);
        setIsTransitioning(false);
      }, 200);
    } else {
      // Tour complete
      setCompletedSteps(prev => new Set([...prev, currentStep.id]));
      onComplete?.();
      onClose();
    }
  }, [currentStepIndex, steps.length, currentStep, onComplete, onClose]);
  
  const handlePrev = useCallback(() => {
    if (currentStepIndex > 0) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStepIndex(prev => prev - 1);
        setIsTransitioning(false);
      }, 200);
    }
  }, [currentStepIndex]);
  
  const handleSkip = useCallback(() => {
    onClose();
  }, [onClose]);
  
  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
      setCompletedSteps(new Set());
    }
  }, [isOpen]);
  
  if (!isOpen || !currentStep) return null;
  
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Dimmed backdrop with spotlight cutout */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998]"
            style={{ pointerEvents: 'none' }}
          >
            {/* SVG mask for spotlight effect */}
            <svg className="absolute inset-0 w-full h-full">
              <defs>
                <mask id="spotlight-mask">
                  <rect width="100%" height="100%" fill="white" />
                  {elementRect && (
                    <rect
                      x={elementRect.left - 8}
                      y={elementRect.top - 8}
                      width={elementRect.width + 16}
                      height={elementRect.height + 16}
                      rx="12"
                      fill="black"
                    />
                  )}
                </mask>
              </defs>
              <rect
                width="100%"
                height="100%"
                fill="rgba(0, 0, 0, 0.6)"
                mask="url(#spotlight-mask)"
              />
            </svg>
            
            {/* Glowing border around highlighted element */}
            {elementRect && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute rounded-xl ring-4 ring-emerald-400/60 shadow-[0_0_40px_rgba(16,185,129,0.4)]"
                style={{
                  left: elementRect.left - 8,
                  top: elementRect.top - 8,
                  width: elementRect.width + 16,
                  height: elementRect.height + 16,
                  pointerEvents: 'none'
                }}
              />
            )}
          </motion.div>
          
          {/* Clickable backdrop to close - uses clip-path to cut a hole for the highlighted element */}
          <div 
            className="fixed inset-0 z-[9998]" 
            onClick={handleSkip}
            style={{ 
              pointerEvents: 'auto',
              background: 'transparent',
              // Cut a hole in the backdrop so clicks pass through to the highlighted element
              // evenodd fill rule is REQUIRED - without it the inner path doesn't create a hole
              clipPath: elementRect 
                ? `polygon(evenodd,
                    0% 0%, 0% 100%, 100% 100%, 100% 0%,
                    ${elementRect.left - 8}px ${elementRect.top - 8}px,
                    ${elementRect.left + elementRect.width + 8}px ${elementRect.top - 8}px,
                    ${elementRect.left + elementRect.width + 8}px ${elementRect.top + elementRect.height + 8}px,
                    ${elementRect.left - 8}px ${elementRect.top + elementRect.height + 8}px
                  )`
                : undefined
            }}
          />
          
          {/* Gazoo coaching panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ 
              opacity: isTransitioning ? 0.5 : 1, 
              scale: isTransitioning ? 0.95 : 1,
              y: 0
            }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed z-[10000] w-80 bg-gradient-to-br from-emerald-600 via-emerald-500 to-lime-500 rounded-2xl shadow-2xl"
            style={{
              top: panelPosition.top,
              left: panelPosition.left,
              pointerEvents: 'auto'
            }}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <span className="text-white font-bold text-sm">The Great Gazoo</span>
                    <div className="text-white/70 text-xs">
                      Step {currentStepIndex + 1} of {steps.length}
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleSkip}
                  className="bg-transparent text-white/70 hover:text-white hover:bg-white/10 transition-colors p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Progress dots */}
              <div className="flex gap-1.5 mt-3">
                {steps.map((step, idx) => (
                  <div 
                    key={step.id}
                    className={`h-1.5 flex-1 rounded-full transition-all ${
                      idx < currentStepIndex ? 'bg-white' :
                      idx === currentStepIndex ? 'bg-white/80' : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
            </div>
            
            {/* Content */}
            <div className="p-4">
              <h3 className="text-white font-bold text-lg mb-2 flex items-center gap-2">
                <Target className="w-5 h-5" />
                {currentStep.title}
              </h3>
              
              <p className="text-white/90 text-sm mb-3">
                {currentStep.description}
              </p>
              
              {/* Tip box */}
              <div className="bg-white/15 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2">
                  <Zap className="w-4 h-4 text-yellow-200 flex-shrink-0 mt-0.5" />
                  <p className="text-white/90 text-xs">
                    {currentStep.tip}
                  </p>
                </div>
              </div>
              
              {/* Action prompt */}
              <div className="flex items-center gap-2 text-white/80 text-sm mb-4">
                <Play className="w-4 h-4 text-lime-200" />
                <span>{currentStep.action}</span>
              </div>
            </div>
            
            {/* Navigation */}
            <div className="px-4 pb-4 flex justify-between items-center">
              <button
                onClick={handlePrev}
                disabled={currentStepIndex === 0}
                className={`flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg transition-all bg-transparent ${
                  currentStepIndex === 0 
                    ? 'text-white/30 cursor-not-allowed' 
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              
              <button
                onClick={handleNext}
                className="flex items-center gap-1 text-sm px-4 py-2 bg-white text-emerald-700 font-semibold rounded-lg hover:bg-white/90 transition-all shadow-lg"
              >
                {currentStepIndex === steps.length - 1 ? (
                  <>
                    <Award className="w-4 h-4" />
                    Finish Tour
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default GazooSpotlight;
