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
    baseClasses = "px-6 py-3 rounded-xl font-semibold bg-gray-300 text-gray-500 cursor-not-allowed shadow-inner transition-none flex items-center justify-center";
  } else if (variant === 'primary') {
    baseClasses += " text-white";
    customStyle = {
      backgroundColor: '#47A88D',
      '--tw-ring-color': '#47A88D80', // 50% opacity
    };
  } else if (variant === 'secondary') {
    baseClasses += " text-white";
    customStyle = {
      backgroundColor: '#E04E1B',
      '--tw-ring-color': '#E04E1B80',
    };
  } else if (variant === 'outline') {
    baseClasses = "px-6 py-3 rounded-xl font-semibold transition-all shadow-md border-2 flex items-center justify-center";
    customStyle = {
      borderColor: '#47A88D',
      color: '#47A88D',
      backgroundColor: '#FCFCFA',
      '--tw-ring-color': '#47A88D80',
    };
  } else if (variant === 'nav-back') {
    baseClasses = "px-4 py-2 rounded-lg font-medium transition-all shadow-sm border-2 border-gray-300 text-gray-700 hover:bg-gray-100 flex items-center justify-center";
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
      className={`relative p-6 rounded-2xl border-2 shadow-2xl hover:shadow-xl transition-all duration-300 text-left ${className}`}
      style={{ background: 'linear-gradient(180deg,#FFFFFF, #FCFCFA)', borderColor: '#E5E7EB', color: '#002E47' }}
      onClick={onClick}
    >
      <span style={{ position:'absolute', top:0, left:0, right:0, height:6, background: accentColor, borderTopLeftRadius:14, borderTopRightRadius:14 }} />
      
      {Icon && (
        <div className="w-10 h-10 rounded-lg flex items-center justify-center border mb-3" style={{ borderColor: '#E5E7EB', background: '#FCFCFA' }}>
          <Icon className="w-5 h-5" style={{ color: '#47A88D' }} />
        </div>
      )}
      {title && <h2 className="text-xl font-extrabold mb-2" style={{ color: '#002E47' }}>{title}</h2>}
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
        <span style={{ position:'absolute', inset:0, background: checked ? '#E04E1B' : '#9CA3AF', borderRadius: 9999, transition: 'background .15s ease' }} />
        <span style={{ position:'relative', left: checked ? 22 : 2, width:22, height:22, background:'#FFFFFF', borderRadius:'9999px', boxShadow:'0 1px 2px rgba(0,0,0,.2)', transition:'left .15s ease' }} />
      </button>
      <span style={{ color: '#002E47', fontWeight: 600 }}>{label}</span>
    </div>
  );
};