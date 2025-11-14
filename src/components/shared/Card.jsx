import React from 'react';
import { IconMap } from '../../data/Constants'; // fix the path as needed

// LEADERREPS.COM OFFICIAL CORPORATE COLORS - VERIFIED 11/14/25
const COLORS = {
  NAVY: '#002E47',        // Primary text, headers, navigation
  TEAL: '#47A88D',        // Secondary buttons, success states, accents
  LIGHT_GRAY: '#FCFCFA'   // Page backgrounds, subtle surfaces
};

export default function Card({ title, icon, className = '', children }) {
  const IconComp = typeof icon === 'string' ? IconMap[icon] : icon;
  return (
    <div 
      className={`rounded-2xl border-2 p-6 shadow-lg hover:shadow-xl transition-all duration-300 ${className}`}
      style={{ 
        backgroundColor: COLORS.LIGHT_GRAY,
        borderColor: COLORS.TEAL,
        borderLeftColor: COLORS.TEAL,
        borderLeftWidth: '4px'
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        {IconComp ? (
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${COLORS.TEAL}20` }}
          >
            <IconComp size={20} style={{ color: COLORS.TEAL }} />
          </div>
        ) : null}
        <h3 className="text-xl font-bold" style={{ color: COLORS.NAVY }}>{title}</h3>
      </div>
      <div style={{ color: COLORS.NAVY }}>
        {children}
      </div>
    </div>
  );
}
