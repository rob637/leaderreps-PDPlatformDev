import React from 'react';
import { IconMap } from '../../data/Constants'; // fix the path as needed

export default function Card({ title, icon, className = '', children }) {
  const IconComp = typeof icon === 'string' ? IconMap[icon] : icon;
  return (
    <div 
      className={`rounded-2xl border-2 p-6 shadow-lg hover:shadow-xl transition-all duration-300 ${className}`}
      style={{ 
        backgroundColor: '#FCFCFA',
        borderColor: 'var(--corporate-teal)',
        borderLeftColor: '#47A88D',
        borderLeftWidth: '4px'
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        {IconComp ? (
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: '#47A88D20' }}
          >
            <IconComp size={20} style={{ color: 'var(--corporate-teal)' }} />
          </div>
        ) : null}
        <h3 className="text-xl font-bold" style={{ color: 'var(--corporate-navy)' }}>{title}</h3>
      </div>
      <div style={{ color: 'var(--corporate-navy)' }}>
        {children}
      </div>
    </div>
  );
}
