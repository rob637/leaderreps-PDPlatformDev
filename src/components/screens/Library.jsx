// src/components/screens/Library.jsx

import React from 'react';
import { BookOpen, ShieldCheck, Film, ArrowLeft } from 'lucide-react';
import { useAppServices } from '../../services/useAppServices.jsx';
import { membershipService } from '../../services/membershipService.js';

// LEADERREPS.COM OFFICIAL CORPORATE COLORS - VERIFIED 11/14/25
const COLORS = {
  // === PRIMARY BRAND COLORS (from leaderreps.com) ===
  NAVY: '#002E47',        // Primary text, headers, navigation
  ORANGE: '#E04E1B',      // Call-to-action buttons, highlights, alerts  
  TEAL: '#47A88D',        // Secondary buttons, success states, accents
  LIGHT_GRAY: '#FCFCFA',  // Page backgrounds, subtle surfaces
  
  // === TEXT & BACKGROUNDS (corporate colors only) ===
  TEXT: '#002E47',        // NAVY for all text
  MUTED: '#47A88D',       // TEAL for muted text
  BG: '#FCFCFA',          // LIGHT_GRAY for backgrounds
  SUBTLE: '#47A88D'       // TEAL for subtle elements
};

const LibraryCard = ({ title, description, icon: Icon, onClick, disabled = false, requiredTier }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`card-corporate-elevated w-full text-left transition-all duration-300 ${
        disabled
          ? 'opacity-60 cursor-not-allowed'
          : 'hover:shadow-xl hover:-translate-y-1 cursor-pointer'
      }`}
      style={{ 
        borderColor: disabled ? COLORS.SUBTLE : COLORS.TEAL,
        background: disabled ? COLORS.LIGHT_GRAY : 'white'
      }}
    >
      <div className="flex items-start gap-6">
        <div
          className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ 
            backgroundColor: disabled ? `${COLORS.SUBTLE}20` : `${COLORS.TEAL}15`,
            border: `2px solid ${disabled ? COLORS.SUBTLE : COLORS.TEAL}30`
          }}
        >
          <Icon
            className="w-8 h-8"
            style={{ color: disabled ? COLORS.SUBTLE : COLORS.TEAL }}
          />
        </div>
        <div className="flex-1">
          <h3 className="corporate-heading-md mb-3" style={{ color: disabled ? COLORS.MUTED : COLORS.NAVY }}>
            {title}
          </h3>
          <p className="corporate-text-body mb-4">
            {description}
          </p>
          {disabled && requiredTier && (
            <div 
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
              style={{ 
                backgroundColor: `${COLORS.ORANGE}20`, 
                color: COLORS.ORANGE,
                border: `1px solid ${COLORS.ORANGE}40`
              }}
            >
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
  const currentTier = membershipData?.currentPlanId || 'basic';

  const libraryItems = [
    {
      id: 'courses',
      title: 'Courses',
      description: 'Structured leadership courses and learning paths to develop your skills.',
      icon: ShieldCheck,
      screen: 'applied-leadership',
      requiredTier: 'professional' // Pro and Elite can access
    },
    {
      id: 'readings',
      title: 'Reading & Reps',
      description: 'Curated business readings with actionable exercises and practice opportunities.',
      icon: BookOpen,
      screen: 'business-readings',
      requiredTier: 'professional' // Pro and Elite can access
    },
    {
      id: 'media',
      title: 'Media',
      description: 'Video content, leader talks, and multimedia resources for visual learners.',
      icon: Film,
      screen: 'leadership-videos',
      requiredTier: 'elite' // Elite tier only
    }
  ];

  const handleCardClick = (item) => {
    if (navigate && typeof navigate === 'function') {
      navigate(item.screen);
    }
  };

  return (
    <div className="page-corporate container-corporate animate-corporate-fade-in">
      <div>
        {/* Back Button */}
        <button
          onClick={() => navigate && navigate('dashboard')}
          className="inline-flex items-center px-4 py-2 mb-6 text-sm font-semibold rounded-lg transition-all duration-200"
          style={{
            backgroundColor: COLORS.LIGHT_GRAY,
            color: COLORS.NAVY,
            border: `1px solid ${COLORS.TEAL}`
          }}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to The Arena
        </button>

        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="corporate-heading-xl mb-4">
            Leadership Library
          </h1>
          <p className="corporate-text-body max-w-2xl mx-auto">
            Explore our collection of courses, readings, and media to accelerate your leadership development.
          </p>
        </div>

        {/* Library Cards */}
        <div className="section-corporate grid-corporate-3">
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
          <div className="card-corporate-elevated mt-12 text-center" style={{ borderColor: COLORS.ORANGE }}>
            <div className="gradient-corporate-feature p-8 rounded-2xl">
              <h3 className="corporate-heading-lg mb-4">
                Unlock the Full Library
              </h3>
              <p className="corporate-text-body mb-6 max-w-md mx-auto">
                Upgrade to Pro or Elite to access our complete collection of leadership development resources.
              </p>
              <button
                onClick={() => navigate && navigate('membership-upgrade')}
                className="btn-corporate-primary"
              >
                View Plans
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Library;
