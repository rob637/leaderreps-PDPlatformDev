// src/components/rep/RepFloatingButton.jsx
// Floating button to access The Great Gazoo AI Coach
// Gazoo hovers above the app as persistent overlay

import React, { useState } from 'react';
import { Brain, Sparkles } from 'lucide-react';
import GazooOverlay from './GazooOverlay';

const RepFloatingButton = () => {
  const [showGazoo, setShowGazoo] = useState(false);

  // Hide the floating button when Gazoo is showing (Gazoo has its own minimize button)
  if (showGazoo) {
    return <GazooOverlay onClose={() => setShowGazoo(false)} />;
  }

  const handleButtonClick = () => {
    setShowGazoo(true);
  };

  return (
    <>
      {/* Floating AI Coach Button - Desktop only (hidden on mobile) */}
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
          bg-gradient-to-r from-lime-500 to-emerald-600 text-white
        "
        aria-label="The Great Gazoo"
      >
        <Brain className="w-5 h-5" />
        <span className="text-sm font-semibold">The Great Gazoo</span>
        <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">NEW</span>
      </button>

    </>
  );
};

export default RepFloatingButton;
