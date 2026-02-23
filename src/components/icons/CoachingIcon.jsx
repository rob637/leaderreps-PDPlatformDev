// src/components/icons/CoachingIcon.jsx
// Custom coaching/session icon - speech bubble with arrow showing guidance
import React from 'react';

/**
 * CoachingIcon - A custom SVG icon showing a coaching/mentoring concept
 * Speech bubble with directional arrow representing guidance
 * 
 * @param {string} className - CSS classes to apply
 * @param {number} size - Icon size (width and height)
 * @param {string} strokeWidth - Stroke width for the icon
 */
const CoachingIcon = ({ 
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
      {/* Speech bubble outline */}
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z" />
      
      {/* Arrow pointing right (guidance direction) */}
      <path d="M10 10h4" />
      <path d="M12 8l2 2-2 2" />
    </svg>
  );
};

export default CoachingIcon;
