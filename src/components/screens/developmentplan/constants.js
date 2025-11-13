// src/components/screens/developmentplan/constants.js
export const TIER_COLORS = {
  T1: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-400' },
  T2: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-400' },
  T3: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-400' },
  T4: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-400' },
  T5: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-400' },
  DEFAULT: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-400' },
};

export const STATUS_STYLES = {
  'Not Started': 'bg-gray-200 text-gray-700',
  'In Progress': 'bg-blue-200 text-blue-800 animate-pulse',
  'Completed': 'bg-green-200 text-green-800',
  'Retired': 'bg-red-200 text-red-800',
};
