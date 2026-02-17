// src/components/icons/LockerIcon.jsx
// Custom locker icon - looks like a gym/school locker
import React from 'react';

/**
 * LockerIcon - A custom SVG icon showing a locker
 * Designed for mobile nav visibility
 * 
 * @param {string} className - CSS classes to apply
 * @param {number} size - Icon size (width and height)
 * @param {string} strokeWidth - Stroke width for the icon
 */
const LockerIcon = ({ 
  className = '', 
  size = 24, 
  strokeWidth = 2,
  ...props 
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Locker body - tall rectangle */}
      <rect x="5" y="2" width="14" height="20" rx="1" />
      
      {/* Top vent slits */}
      <line x1="8" y1="5" x2="12" y2="5" />
      <line x1="8" y1="7" x2="12" y2="7" />
      
      {/* Handle/latch on right side */}
      <line x1="16" y1="10" x2="16" y2="14" />
      
      {/* Bottom vent slits */}
      <line x1="8" y1="17" x2="12" y2="17" />
      <line x1="8" y1="19" x2="12" y2="19" />
    </svg>
  );
};

export default LockerIcon;
