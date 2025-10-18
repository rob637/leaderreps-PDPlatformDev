// src/components/shared/UI.jsx
import React from 'react';
import { TrendingUp, Clock as ClockIcon } from 'lucide-react';
import { IconMap } from '../../data/Constants'; // string → component map

// ===== Sidebar (default export) =====
export default function NavSidebar({ currentScreen, setCurrentScreen, user }) {
  // Use string keys so we always resolve via IconMap
  const NAV = [
    { id: 'dashboard',         iconKey: 'Home',        label: 'Dashboard' },
    { id: 'prof-dev-plan',     iconKey: 'ShieldCheck', label: 'Professional Dev Plan' },
    { id: 'daily-practice',    iconKey: 'Clock',       label: 'Daily Practice & Scorecard' },
    { id: 'coaching-lab',      iconKey: 'Zap',         label: 'Coaching Lab' },
    { id: 'planning-hub',      iconKey: 'Users',       label: 'Planning Hub' },
    { id: 'business-readings', iconKey: 'BookOpen',    label: 'Business Readings' },
    { id: 'app-settings',      iconKey: 'Settings',    label: 'App Settings' },
  ];

  const Item = ({ id, iconKey, label }) => {
    const active = currentScreen === id;
    const Icon = IconMap?.[iconKey];
    return (
      <button
        type="button"
        onClick={() => setCurrentScreen(id)}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition
          ${active ? 'bg-emerald-100 text-emerald-700' : 'text-gray-700 hover:bg-gray-100'}`}
      >
        {Icon ? <Icon size={18} /> : <span className="w-[18px]" />}
        <span>{label}</span>
      </button>
    );
  };

  return (
    <aside className="w-64 shrink-0 border-r border-gray-200 bg-white min-h-screen hidden md:flex flex-col">
      <div className="p-4 border-b border-gray-100">
        <div className="text-lg font-semibold">LeaderReps</div>
        <div className="mt-1 text-xs text-gray-500 flex items-center gap-1">
          <ClockIcon size={14} />
          <span>{new Date().toLocaleTimeString()}</span>
        </div>
        <div className="mt-1 text-xs text-gray-500 truncate">{user?.email || 'Guest'}</div>
      </div>

      <nav className="p-3 space-y-1">
        {NAV.map((item) => (
          <Item key={item.id} {...item} />
        ))}
      </nav>

      <div className="mt-auto p-3 text-xs text-gray-400 flex items-center gap-1">
        <TrendingUp size={14} /> <span>v1</span>
      </div>
    </aside>
  );
}

// ===== Named UI primitives =====
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
