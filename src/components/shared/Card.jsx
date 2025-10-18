import React from 'react';
import { IconMap } from '../../data/Constants'; // fix the path as needed

export default function Card({ title, icon, className = '', children }) {
  const IconComp = typeof icon === 'string' ? IconMap[icon] : icon;
  return (
    <div className={`rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        {IconComp ? <IconComp size={18} /> : null}
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
}
