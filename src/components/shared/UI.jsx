// src/components/shared/UI.jsx
import React from 'react';
import {
  Home,
  Zap,
  Users,
  Settings,
  BookOpen,
  ShieldCheck,
  Mic,
  TrendingUp,
  Clock as ClockIcon, // ✅ alias, not bare Clock
} from 'lucide-react';
import { IconMap } from '../../data/Constants'; // string→component map

export default function NavSidebar({ currentScreen, setCurrentScreen, user }) {
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
    const Icon = IconMap[iconKey];
    return (
      <button
        type="button"
        onClick={() => setCurrentScreen(id)}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
          active ? 'bg-emerald-100 text-emerald-700' : 'text-gray-700 hover:bg-gray-100'
        }`}
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
