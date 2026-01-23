// src/components/rep/RepAvatar.jsx
// Rep's visual identity - abstract, warm, professional

import React from 'react';

/**
 * Rep's avatar - a stylized compass/path icon suggesting guidance
 * Uses corporate teal with warm accents
 */
const RepAvatar = ({ size = 'md', pulse = false, className = '' }) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  return (
    <div 
      className={`
        ${sizes[size]} 
        rounded-2xl 
        bg-gradient-to-br from-corporate-teal to-corporate-navy
        flex items-center justify-center
        shadow-lg
        ${pulse ? 'animate-pulse' : ''}
        ${className}
      `}
    >
      {/* Stylized "R" with path/compass motif */}
      <svg 
        viewBox="0 0 40 40" 
        className="w-2/3 h-2/3"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer ring - represents journey/continuity */}
        <circle 
          cx="20" 
          cy="20" 
          r="16" 
          stroke="rgba(255,255,255,0.3)" 
          strokeWidth="2"
          strokeDasharray="4 2"
        />
        
        {/* Inner path - represents guidance */}
        <path 
          d="M14 28V12h6c3.314 0 6 2.239 6 5s-2.686 5-6 5h-2l8 6" 
          stroke="white" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          fill="none"
        />
        
        {/* Accent dot - represents you (the leader) */}
        <circle 
          cx="28" 
          cy="26" 
          r="2.5" 
          fill="#E04E1B"
        />
      </svg>
    </div>
  );
};

export default RepAvatar;
