// src/components/screens/Library.jsx

import React from 'react';
import { BookOpen, ShieldCheck, Film } from 'lucide-react';
import { useAppServices } from '../../services/useAppServices.jsx';
import { membershipService } from '../../services/membershipService.js';

const COLORS = {
  NAVY: '#0B2447',
  TEAL: '#47A88D',
  ORANGE: '#E5491D',
  MUTED: '#6B7280',
  SUBTLE: '#E5E7EB'
};

const LibraryCard = ({ title, description, icon: Icon, onClick, disabled = false, requiredTier }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative w-full p-6 rounded-xl border-2 transition-all duration-200 text-left ${
        disabled
          ? 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-60'
          : 'bg-white border-corporate-teal hover:shadow-lg hover:scale-105 cursor-pointer'
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`p-3 rounded-lg ${
            disabled ? 'bg-gray-300' : 'bg-corporate-teal/10'
          }`}
        >
          <Icon
            className={`w-8 h-8 ${
              disabled ? 'text-gray-500' : 'text-corporate-teal'
            }`}
          />
        </div>
        <div className="flex-1">
          <h3
            className="text-xl font-bold mb-2"
            style={{ color: disabled ? COLORS.MUTED : COLORS.NAVY }}
          >
            {title}
          </h3>
          <p
            className="text-sm"
            style={{ color: COLORS.MUTED }}
          >
            {description}
          </p>
          {disabled && requiredTier && (
            <div className="mt-2 inline-block px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-md font-semibold">
              Requires {requiredTier === 'professional' ? 'Pro' : 'Elite'} Tier
            </div>
          )}
        </div>
      </div>
    </button>
  );
};

const Library = () => {
  const { membershipData, navigate } = useAppServices();
  const currentTier = membershipData?.currentTier || 'basic';

  const libraryItems = [
    {
      id: 'courses',
      title: 'Courses',
      description: 'Structured leadership courses and learning paths to develop your skills.',
      icon: ShieldCheck,
      screen: 'applied-leadership',
      requiredTier: 'professional'
    },
    {
      id: 'readings',
      title: 'Reading & Reps',
      description: 'Curated business readings with actionable exercises and practice opportunities.',
      icon: BookOpen,
      screen: 'business-readings',
      requiredTier: 'professional'
    },
    {
      id: 'media',
      title: 'Media',
      description: 'Video content, leader talks, and multimedia resources for visual learners.',
      icon: Film,
      screen: 'leadership-videos',
      requiredTier: 'elite'
    }
  ];

  const handleCardClick = (item) => {
    if (navigate && typeof navigate === 'function') {
      navigate(item.screen);
    }
  };

  return (
    <div className="min-h-screen bg-corporate-light-gray p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-4xl font-bold mb-2"
            style={{ color: COLORS.NAVY }}
          >
            Leadership Library
          </h1>
          <p
            className="text-lg"
            style={{ color: COLORS.MUTED }}
          >
            Explore our collection of courses, readings, and media to accelerate your leadership development.
          </p>
        </div>

        {/* Library Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {libraryItems.map((item) => {
            const hasAccess = membershipService.hasAccess(currentTier, item.requiredTier);
            return (
              <LibraryCard
                key={item.id}
                title={item.title}
                description={item.description}
                icon={item.icon}
                onClick={() => handleCardClick(item)}
                disabled={!hasAccess}
                requiredTier={item.requiredTier}
              />
            );
          })}
        </div>

        {/* Upgrade CTA for Basic Users */}
        {currentTier === 'basic' && (
          <div
            className="mt-8 p-6 rounded-xl border-2"
            style={{ borderColor: COLORS.ORANGE, backgroundColor: '#FFF5F0' }}
          >
            <h3
              className="text-xl font-bold mb-2"
              style={{ color: COLORS.NAVY }}
            >
              Unlock the Full Library
            </h3>
            <p className="mb-4" style={{ color: COLORS.MUTED }}>
              Upgrade to Pro or Elite to access our complete collection of leadership development resources.
            </p>
            <button
              onClick={() => navigate && navigate('membership-module')}
              className="px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200 hover:opacity-90"
              style={{ backgroundColor: COLORS.ORANGE }}
            >
              View Plans
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Library;
