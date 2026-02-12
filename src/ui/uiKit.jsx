// src/ui/uiKit.jsx
/* Small, dependency-free UI kit for consistent look and feel */
import React from 'react';
import { BookOpen } from 'lucide-react'; // Placeholder for Icon use

export const Button = ({
  children, onClick, disabled = false, variant = 'primary', className = '', ...rest
}) => {
  // Base styles using safe Tailwind classes
  let baseClasses = "px-6 py-3 rounded-xl font-semibold transition-all shadow-lg focus:outline-none focus:ring-4 flex items-center justify-center";
  let customStyle = {};
  
  if (disabled) {
    baseClasses = "px-6 py-3 rounded-xl font-semibold bg-gray-300 dark:bg-slate-600 text-gray-500 dark:text-slate-400 cursor-not-allowed shadow-inner transition-none flex items-center justify-center";
  } else if (variant === 'primary') {
    baseClasses += " text-white bg-corporate-teal hover:bg-corporate-teal/90 focus:ring-corporate-teal/30";
  } else if (variant === 'secondary') {
    baseClasses += " text-white bg-corporate-orange hover:bg-corporate-orange/90 focus:ring-corporate-orange/30";
  } else if (variant === 'outline') {
    baseClasses = "px-6 py-3 rounded-xl font-semibold transition-all shadow-md border-2 flex items-center justify-center border-corporate-teal text-corporate-teal dark:text-corporate-teal bg-white dark:bg-slate-800 hover:bg-corporate-teal/5 dark:hover:bg-corporate-teal/10 focus:ring-4 focus:ring-corporate-teal/30";
  } else if (variant === 'nav-back') {
    baseClasses = "px-4 py-2 rounded-lg font-medium transition-all shadow-sm border-2 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center justify-center";
  }

  return (
    <button 
      {...rest} 
      onClick={onClick} 
      disabled={disabled} 
      className={`${baseClasses} ${className}`}
      style={customStyle}
    >
      {children}
    </button>
  );
};

export const Card = ({
  children, title, icon: Icon, className = '', onClick, accent = 'TEAL'
}) => {
  const interactive = !!onClick;
  const Tag = interactive ? 'button' : 'div';
  
  const accentMap = {
    NAVY: '#002E47',
    TEAL: '#47A88D',
    ORANGE: '#E04E1B',
    SUBTLE_TEAL: '#349881',
    LIGHT_GRAY: '#FCFCFA',
    OFF_WHITE: '#FFFFFF',
    BG: '#FCFCFA',
    SURFACE: '#FFFFFF',
    TEXT: '#002E47',
    RED: '#E04E1B',
    BLUE: '#3B82F6',
  };
  const accentColor = accentMap[accent] || accentMap.TEAL;

  const handleKeyDown = (e) => {
    if (!interactive) return;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); }
  };

  return (
    <Tag
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={handleKeyDown}
      className={`relative p-6 rounded-2xl border-2 shadow-2xl hover:shadow-xl transition-all duration-300 text-left bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-corporate-navy dark:text-white ${className}`}
      onClick={onClick}
    >
      <span style={{ position:'absolute', top:0, left:0, right:0, height:6, background: accentColor, borderTopLeftRadius:14, borderTopRightRadius:14 }} />
      
      {Icon && (
        <div className="w-10 h-10 rounded-lg flex items-center justify-center border mb-3 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700">
          <Icon className="w-5 h-5 text-corporate-teal" />
        </div>
      )}
      {title && <h2 className="text-xl font-extrabold mb-2 text-corporate-navy dark:text-white">{title}</h2>}
      {children}
    </Tag>
  );
};

export const ExecSwitch = ({ checked, onChange, label = 'Executive Brief' }) => {
  const toggle = () => onChange(!checked);
  const onKey = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } };
  return (
    <div className="flex items-center gap-2">
      <button type="button" role="switch" aria-checked={checked} onClick={toggle} onKeyDown={onKey} className="relative inline-flex items-center" style={{ width: 46, height: 26 }}>
        <span className={`absolute inset-0 rounded-full transition-colors duration-150 ${checked ? 'bg-corporate-orange' : 'bg-gray-400 dark:bg-slate-600'}`} />
        <span className="relative w-[22px] h-[22px] bg-white dark:bg-slate-800 rounded-full shadow transition-all duration-150" style={{ left: checked ? 22 : 2 }} />
      </button>
      <span className="font-semibold text-corporate-navy dark:text-white">{label}</span>
    </div>
  );
};