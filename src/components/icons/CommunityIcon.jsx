// src/components/icons/CommunityIcon.jsx
// Custom 3-person community icon - cleaner, more spaced design
import React from 'react';

/**
 * CommunityIcon - A custom SVG icon showing 3 people silhouettes
 * Redesigned for better visibility at small sizes (mobile nav)
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
      {/* Left person */}
      <circle cx="5.5" cy="8.5" r="2.5" />
      <path d="M2 17v-1c0-2 1.5-3 3.5-3s3.5 1 3.5 3v1" />
      
      {/* Center person (slightly higher to show depth) */}
      <circle cx="12" cy="6" r="2.5" />
      <path d="M8.5 15v-1c0-2 1.5-3 3.5-3s3.5 1 3.5 3v1" />
      
      {/* Right person */}
      <circle cx="18.5" cy="8.5" r="2.5" />
      <path d="M15 17v-1c0-2 1.5-3 3.5-3s3.5 1 3.5 3v1" />
    </svg>
  );
};

export default CommunityIcon;
