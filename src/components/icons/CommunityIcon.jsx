// src/components/icons/CommunityIcon.jsx
// Custom 3-person community icon matching the LeaderReps website design
import React from 'react';

/**
 * CommunityIcon - A custom SVG icon showing 3 people silhouettes
 * Matches the community icon on the LeaderReps website
 * 
 * @param {string} className - CSS classes to apply
 * @param {number} size - Icon size (width and height)
 * @param {string} strokeWidth - Stroke width for the icon
 */
const CommunityIcon = ({ 
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
      {/* Center person (front) - larger */}
      <circle cx="12" cy="7" r="3" />
      <path d="M12 10c-3.5 0-6 2-6 5v1h12v-1c0-3-2.5-5-6-5z" />
      
      {/* Left person (back) */}
      <circle cx="5" cy="6" r="2" />
      <path d="M5 8c-2 0-3.5 1.2-3.5 3v1h4" />
      
      {/* Right person (back) */}
      <circle cx="19" cy="6" r="2" />
      <path d="M19 8c2 0 3.5 1.2 3.5 3v1h-4" />
    </svg>
  );
};

export default CommunityIcon;
