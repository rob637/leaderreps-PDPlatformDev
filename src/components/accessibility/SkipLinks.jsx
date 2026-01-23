/**
 * SkipLinks - Skip navigation links for keyboard users
 */
import React, { useState } from 'react';

const SkipLinks = ({
  links = [
    { id: 'main-content', label: 'Skip to main content' },
    { id: 'main-nav', label: 'Skip to navigation' },
  ],
  className = '',
}) => {
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const handleClick = (e, id) => {
    e.preventDefault();
    const target = document.getElementById(id);
    if (target) {
      target.setAttribute('tabindex', '-1');
      target.focus();
      target.scrollIntoView({ behavior: 'smooth' });
      // Remove tabindex after focus
      target.addEventListener('blur', () => {
        target.removeAttribute('tabindex');
      }, { once: true });
    }
  };

  return (
    <nav
      aria-label="Skip links"
      className={`skip-links ${className}`}
    >
      {links.map((link, index) => (
        <a
          key={link.id}
          href={`#${link.id}`}
          onClick={(e) => handleClick(e, link.id)}
          onFocus={() => setFocusedIndex(index)}
          onBlur={() => setFocusedIndex(-1)}
          className={`
            fixed z-[9999]
            px-4 py-2
            bg-corporate-navy text-white
            font-medium rounded-lg
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-corporate-teal focus:ring-offset-2
            ${focusedIndex === index 
              ? 'top-2 left-2 opacity-100' 
              : 'top-0 left-0 -translate-y-full opacity-0 pointer-events-none'}
          `}
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
};

export default SkipLinks;
