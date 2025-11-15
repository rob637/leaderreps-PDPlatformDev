// src/components/shared/UI.jsx
import React from 'react';
import { IconMap } from '../../data/Constants'; // string → component map

// ===== UI primitives =====
export function Button({ children, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`rounded-md border px-3 py-2 text-sm hover:bg-gray-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * Card accepts either:
 *  - icon: 'Clock' (string key resolved via IconMap), or
 *  - icon: SomeIconComponent (component)
 */
export function Card({ title, icon, className = '', children }) {
  const IconComp = typeof icon === 'string' ? IconMap?.[icon] : icon;
  return (
    <div className={`rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ${className}`}>
      {(title || IconComp) && (
        <div className="flex items-center gap-2 mb-3">
          {IconComp ? <IconComp size={18} /> : null}
          {title ? <h3 className="text-lg font-semibold">{title}</h3> : null}
        </div>
      )}
      {children}
    </div>
  );
}

// Lightweight tooltip (pure CSS)
export function Tooltip({ content, children }) {
  return (
    <span className="relative inline-flex group">
      {children}
      <span
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-1
                   scale-0 group-hover:scale-100 transition origin-top
                   rounded bg-black/80 text-white text-xs px-2 py-1 whitespace-nowrap z-10"
      >
        {content}
      </span>
    </span>
  );
}
