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
            fixed top-0 left-0 z-[9999]
            px-4 py-2 m-2
            bg-[#002E47] text-white
            font-medium rounded-lg
            transform transition-transform duration-200
            focus:outline-none focus:ring-2 focus:ring-[#47A88D] focus:ring-offset-2
            ${focusedIndex === index ? 'translate-y-0' : '-translate-y-full'}
          `}
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
};

export default SkipLinks;
