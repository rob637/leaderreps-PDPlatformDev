// src/components/screens/labs/shared/LabComponents.jsx
// REFACTORED: Shared UI components for Labs

import React, { useState } from 'react';
import { CheckCircle, AlertTriangle, Target } from 'lucide-react';

/* =========================================================
   SHARED CONSTANTS & THEME
========================================================= */
export const COLORS = {
  BG: '#FCFCFA',             // Corporate light gray
  SURFACE: '#FCFCFA',        // Corporate light gray
  BORDER: '#47A88D',         // Corporate teal
  SUBTLE: '#349881',         // Corporate subtle teal
  TEXT: '#002E47',           // Corporate navy
  MUTED: '#349881',          // Corporate subtle teal
  NAVY: '#002E47',           // Corporate navy
  TEAL: '#47A88D',           // Corporate teal
  BLUE: '#002E47',           // NO BLUE! Use corporate navy
  ORANGE: '#E04E1B',         // Corporate orange
  GREEN: '#47A88D',          // NO GREEN! Use corporate teal
  AMBER: '#E04E1B',          // NO AMBER! Use corporate orange
  RED: '#E04E1B',            // NO RED! Use corporate orange
  LIGHT_GRAY: '#FCFCFA'      // Corporate light gray
};

export const COMPLEXITY_MAP = {
  Low:    { label: 'Novice',       hex: COLORS.GREEN, icon: CheckCircle },
  Medium: { label: 'Intermediate', hex: COLORS.AMBER, icon: AlertTriangle },
  High:   { label: 'Expert',       hex: COLORS.RED,   icon: Target },
};

/* =========================================================
   SHARED UI COMPONENTS
========================================================= */
export const Button = ({ children, onClick, disabled = false, variant = 'primary', className = '', ...rest }) => {
    let baseStyle = "px-6 py-3 rounded-xl font-semibold transition-all shadow-xl focus:outline-none focus:ring-4 text-white flex items-center justify-center";

    if (variant === 'primary') { baseStyle += ` bg-[${COLORS.TEAL}] hover:bg-[#349881] focus:ring-[#47A88D]/50`; } 
    else if (variant === 'secondary') { baseStyle += ` bg-[${COLORS.ORANGE}] hover:bg-[${COLORS.SUBTLE}] focus:ring-[#E04E1B]/50`; } 
    else if (variant === 'outline') { baseStyle = `px-6 py-3 rounded-xl font-semibold transition-all shadow-md border-2 border-[${COLORS.TEAL}] text-[${COLORS.TEAL}] hover:bg-[#47A88D]/10 focus:ring-4 focus:ring-[#47A88D]/50 bg-[${COLORS.LIGHT_GRAY}] flex items-center justify-center`; }

    if (disabled) { baseStyle = "px-6 py-3 rounded-xl font-semibold bg-gray-300 text-gray-500 cursor-not-allowed shadow-inner transition-none flex items-center justify-center"; }

    return (
        <button {...rest} onClick={onClick} disabled={disabled} className={`${baseStyle} ${className}`}>
            {children}
        </button>
    );
};

export const Card = ({ children, title, icon: Icon, className = '', onClick, accent = 'ORANGE' }) => {
  const interactive = !!onClick;
  const Tag = interactive ? 'button' : 'div';
  const accentColor = COLORS[accent] || COLORS.ORANGE;
  return (
    <Tag
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      className={`relative p-6 rounded-2xl border-2 shadow-xl hover:shadow-2xl transition-all duration-300 text-left ${className}`}
      style={{
        background: 'linear-gradient(180deg,#FCFCFA,#FCFCFA)',
        borderColor: COLORS.SUBTLE,
        color: COLORS.TEXT
      }}
      onClick={onClick}
    >
      <span style={{
        position:'absolute', top:0, left:0, right:0, height:6,
        background: accentColor,
        borderTopLeftRadius:14, borderTopRightRadius:14
      }} />

      {Icon && (
        <div className="w-10 h-10 rounded-lg flex items-center justify-center border mb-3"
             style={{ borderColor: COLORS.SUBTLE, background: '#F3F4F6' }}>
          <Icon className="w-5 h-5" style={{ color: COLORS.TEAL }} />
        </div>
      )}
      {title && <h2 className="text-xl font-extrabold mb-2" style={{ color: COLORS.NAVY }}>{title}</h2>}
      {children}
    </Tag>
  );
};

export const Tooltip = ({ content, children }) => {
    const [isVisible, setIsVisible] = useState(false);
    
    return (
        <div className="relative inline-block" onMouseEnter={() => setIsVisible(true)} onMouseLeave={() => setIsVisible(false)}>
            {children}
            {isVisible && content && (
                <div className="absolute z-10 w-64 p-3 -mt-2 -ml-32 text-xs text-white bg-[#002E47] rounded-lg shadow-lg bottom-full left-1/2 transform translate-x-1/2">
                    {content}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[#002E47]"></div>
                </div>
            )}
        </div>
    );
};