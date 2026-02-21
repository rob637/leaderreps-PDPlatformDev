import React, { useState } from 'react';

/**
 * FacilitatorAvatar - Renders a facilitator photo with initials fallback
 * 
 * Gracefully handles broken image URLs by falling back to initials.
 * 
 * Props:
 * - name: facilitator name (used for initials + alt text)
 * - photoUrl: optional image URL
 * - size: 'sm' (40px) or 'lg' (96px)
 */
const FacilitatorAvatar = ({ name, photoUrl, size = 'sm' }) => {
  const [imgError, setImgError] = useState(false);

  const getInitials = (n) => {
    if (!n) return '?';
    const parts = n.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return n.substring(0, 2).toUpperCase();
  };

  const showPhoto = photoUrl && !imgError;
  const isLarge = size === 'lg';

  const containerClass = isLarge
    ? 'w-24 h-24 rounded-full border-4 border-white shadow-lg'
    : 'w-10 h-10 rounded-full shadow-sm flex-shrink-0';

  if (showPhoto) {
    return (
      <img
        src={photoUrl}
        alt={name}
        className={`${containerClass} object-cover`}
        onError={() => setImgError(true)}
      />
    );
  }

  const textClass = isLarge ? 'text-2xl' : 'text-sm';

  return (
    <div className={`${containerClass} bg-gradient-to-br from-corporate-navy to-corporate-teal flex items-center justify-center`}>
      <span className={`text-white font-bold ${textClass}`}>{getInitials(name)}</span>
    </div>
  );
};

export default FacilitatorAvatar;
