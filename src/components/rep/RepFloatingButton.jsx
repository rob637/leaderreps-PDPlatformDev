// src/components/rep/RepFloatingButton.jsx
// Floating button to access RepUp AI Coach
// RepUp hovers above the app as persistent overlay

import React, { useState } from 'react';
import { Brain, Sparkles } from 'lucide-react';
import RepUpOverlay from './RepUpOverlay';
import { useDailyPlan } from '../../hooks/useDailyPlan';

const RepFloatingButton = () => {
  const [showRepUp, setShowRepUp] = useState(false);
  const { currentPhase } = useDailyPlan();

  // Hide RepUp during preparation phase - only show starting from Foundation
  const isInPrepPhase = currentPhase?.id === 'pre-start' || currentPhase?.name === 'Preparation';
  
  if (isInPrepPhase) {
    return null;
  }

  // Hide the floating button when RepUp is showing (RepUp has its own minimize button)
  if (showRepUp) {
    return <RepUpOverlay onClose={() => setShowRepUp(false)} />;
  }

  const handleButtonClick = () => {
    setShowRepUp(true);
  };

  return (
    <>
      {/* Floating AI Coach Button - Full on desktop, compact on mobile */}
      {/* Desktop version */}
      <button
        onClick={handleButtonClick}
        className="
          fixed z-40 
          hidden md:flex
          bottom-8
          right-8
          items-center gap-2 
          px-4 py-3 
          rounded-full 
          shadow-lg hover:shadow-xl
          transition-all duration-200 
          active:scale-95 hover:scale-105
          bg-gradient-to-r from-corporate-navy to-corporate-teal text-white
        "
        aria-label="RepUp"
      >
        <Brain className="w-5 h-5" />
        <span className="text-sm font-semibold">RepUp</span>
        <span className="text-[10px] bg-white/20 dark:bg-slate-800/20 px-2 py-0.5 rounded-full font-bold">NEW</span>
      </button>

      {/* Mobile version - compact brain icon only */}
      <button
        onClick={handleButtonClick}
        className="
          fixed z-40
          flex md:hidden
          bottom-20
          right-4
          items-center justify-center
          w-12 h-12
          rounded-full
          shadow-lg hover:shadow-xl
          transition-all duration-200
          active:scale-90
          bg-gradient-to-r from-corporate-navy to-corporate-teal text-white
        "
        aria-label="RepUp AI Coach"
      >
        <Brain className="w-5 h-5" />
      </button>

    </>
  );
};

export default RepFloatingButton;
