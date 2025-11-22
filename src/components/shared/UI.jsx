// src/components/shared/UI.jsx
import React from 'react';
import { IconMap } from '../../data/Constants'; // string → component map

// ===== UI primitives =====
export function Button({ children, onClick, disabled = false, variant = 'primary', className = '', size = 'md', ...rest }) {
  const baseStyle = "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const sizeStyles = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg"
  };

  const variantStyles = {
    primary: "bg-corporate-teal text-white shadow-sm hover:bg-teal-700 focus:ring-teal-500/50",
    secondary: "bg-corporate-orange text-white shadow-sm hover:bg-orange-700 focus:ring-orange-500/50",
    outline: "bg-white text-corporate-teal border-2 border-corporate-teal shadow-sm hover:bg-teal-50 focus:ring-teal-500/50",
    'nav-back': "bg-white text-slate-700 border border-slate-200 shadow-sm hover:bg-slate-50 focus:ring-slate-200/50 px-4 py-2 text-sm",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100 focus:ring-slate-200/50 px-3 py-1.5 text-sm",
    'soft-teal': "bg-teal-50 text-teal-700 hover:bg-teal-100 focus:ring-teal-500/50 border border-teal-100",
    'soft-orange': "bg-orange-50 text-orange-700 hover:bg-orange-100 focus:ring-orange-500/50 border border-orange-100",
    'soft-blue': "bg-blue-50 text-blue-700 hover:bg-blue-100 focus:ring-blue-500/50 border border-blue-100",
    'soft-purple': "bg-purple-50 text-purple-700 hover:bg-purple-100 focus:ring-purple-500/50 border border-purple-100",
  };

  const disabledStyle = "bg-slate-200 text-slate-400 shadow-none border-transparent hover:bg-slate-200 cursor-not-allowed";

  const finalClassName = `
    ${baseStyle} 
    ${sizeStyles[size] || sizeStyles.md} 
    ${disabled ? disabledStyle : (variantStyles[variant] || variantStyles.primary)} 
    ${className}
  `.trim();

  return <button {...rest} onClick={onClick} disabled={disabled} className={finalClassName}>{children}</button>;
}

/**
 * Card accepts either:
 *  - icon: 'Clock' (string key resolved via IconMap), or
 *  - icon: SomeIconComponent (component)
 */
export function Card({ children, title, icon, className = '', onClick, accent = 'NAVY', actions }) {
  const interactive = !!onClick;
  const Tag = interactive ? 'button' : 'div';
  const handleKeyDown = (e) => { if (interactive && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onClick?.(); } };

  // Resolve Icon
  const IconComp = typeof icon === 'string' ? IconMap?.[icon] : icon;

  // Map accent names to Tailwind border classes
  const accentMap = {
    'TEAL': 'border-corporate-teal',
    'ORANGE': 'border-corporate-orange',
    'NAVY': 'border-corporate-navy',
    'BLUE': 'border-blue-500',
    'GREEN': 'border-green-500',
    'PURPLE': 'border-purple-500',
    'YELLOW': 'border-yellow-500',
    'RED': 'border-red-500',
    'GRAY': 'border-slate-500',
    'PINK': 'border-pink-500',
    'INDIGO': 'border-indigo-500',
  };

  const borderClass = accentMap[accent] || 'border-corporate-navy';

  const textClassMap = {
    'TEAL': 'text-corporate-teal',
    'ORANGE': 'text-corporate-orange',
    'NAVY': 'text-corporate-navy',
    'BLUE': 'text-blue-600',
    'GREEN': 'text-green-600',
    'PURPLE': 'text-purple-600',
    'YELLOW': 'text-yellow-600',
    'RED': 'text-red-600',
    'GRAY': 'text-slate-600',
    'PINK': 'text-pink-600',
    'INDIGO': 'text-indigo-600',
  };

  const iconClass = textClassMap[accent] || 'text-corporate-navy';

  return (
    <Tag
      {...(interactive ? { type: 'button' } : {})}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={handleKeyDown}
      className={`relative rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 text-left border-t-4 ${borderClass} ${className} ${interactive ? 'hover:-translate-y-0.5 hover:shadow-md cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {(title || actions || IconComp) && (
        <div className="flex items-center justify-between p-5 pb-2">
          <div className="flex items-center gap-2">
            {IconComp && (
              <IconComp size={20} className={iconClass} />
            )}
            {title && (
              <h2 className="text-lg font-bold text-slate-800">{title}</h2>
            )}
          </div>
          {actions && (
            <div className="flex-shrink-0">{actions}</div>
          )}
        </div>
      )}
      
      <div className={title || actions || IconComp ? "p-5 pt-2" : "p-5"}>
        {children}
      </div>
    </Tag>
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
