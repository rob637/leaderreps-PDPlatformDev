// src/components/screens/Library.jsx

import React, { useState, useEffect } from 'react';
import { BookOpen, ShieldCheck, Film, ArrowLeft, Sparkles, Target, Trophy, Users, TrendingUp, Star, Zap, PlayCircle, FileText } from 'lucide-react';
import { useAppServices } from '../../services/useAppServices.jsx';
import { membershipService } from '../../services/membershipService.js';
import { Button } from '../shared/UI';
import { getReadings, getVideos, getCourses } from '../../services/contentService';
import { useFeatures } from '../../providers/FeatureProvider';

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
      <div className="p-6 h-full flex flex-col">
        <div className="text-center mb-4">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ 
              backgroundColor: disabled ? `${COLORS.SUBTLE}20` : `${COLORS.TEAL}15`,
              border: `3px solid ${disabled ? COLORS.SUBTLE : COLORS.TEAL}30`
            }}
          >
            <Icon
              className="w-10 h-10"
              style={{ color: disabled ? COLORS.SUBTLE : COLORS.TEAL }}
            />
          </div>
          <h3 className="text-xl font-bold mb-3" style={{ color: disabled ? COLORS.MUTED : COLORS.NAVY }}>
            {title}
          </h3>
        </div>
        <div className="flex-1 flex flex-col">
          <p className="text-gray-600 text-center mb-4 flex-1">
            {description}
          </p>
          {disabled && requiredTier && (
            <div className="mt-auto">
              <div 
                className="inline-flex items-center px-3 py-2 rounded-full text-sm font-semibold w-full justify-center"
                style={{ 
                  backgroundColor: `${COLORS.ORANGE}20`, 
                  color: COLORS.ORANGE,
                  border: `1px solid ${COLORS.ORANGE}40`
                }}
              >
                Requires Premium Tier
              </div>
            </div>
          )}
        </div>
      </div>
    </button>
  );
};

const Library = ({ simulatedTier, isDeveloperMode }) => {
  const { membershipData, navigate, db } = useAppServices();
  const { isFeatureEnabled } = useFeatures();
  const [contentCounts, setContentCounts] = useState({ readings: 0, videos: 0, courses: 0 });
  const [loading, setLoading] = useState(true);
  
  // Match Dashboard's exact tier logic - MUST match Dashboard.jsx line 285
  const currentTier = simulatedTier || membershipData?.currentTier || 'free';
  
  // Fetch content counts on mount
  useEffect(() => {
    const fetchContentCounts = async () => {
      try {
        setLoading(true);
        const [readingsData, videosData, coursesData] = await Promise.all([
          getReadings(db, currentTier),
          getVideos(db, currentTier),
          getCourses(db, currentTier)
        ]);
        setContentCounts({
          readings: readingsData.length,
          videos: videosData.length,
          courses: coursesData.length
        });
      } catch (error) {
        console.error('Error fetching content counts:', error);
        setContentCounts({ readings: 0, videos: 0, courses: 0 });
      } finally {
        setLoading(false);
      }
    };
    
    if (db) {
      fetchContentCounts();
    }
  }, [db, currentTier]);
  
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // DEBUG: Measure actual widths
    setTimeout(() => {
      const pageEl = document.querySelector('.page-corporate');
      const contentEl = document.querySelector('.content-full');
      console.log('📏 LIBRARY Width Measurements:', {
        pageWidth: pageEl?.offsetWidth,
        contentWidth: contentEl?.offsetWidth,
        pageComputedMaxWidth: window.getComputedStyle(pageEl || document.body).maxWidth,
        contentComputedMaxWidth: window.getComputedStyle(contentEl || document.body).maxWidth
      });
    }, 100);
  }, []);

  const libraryItems = [
    {
      id: 'courses',
      title: 'Courses',
      description: 'Structured leadership courses and learning paths to develop your skills.',
      icon: ShieldCheck,
      screen: isFeatureEnabled('course-library') ? 'course-library' : 'applied-leadership',
      requiredTier: 'free' // Available to all users, but content varies by tier
    },
    {
      id: 'readings',
      title: 'Reading & Reps',
      description: 'Curated business readings with actionable exercises and practice opportunities.',
      icon: BookOpen,
      screen: isFeatureEnabled('reading-hub') ? 'reading-hub' : 'business-readings',
      requiredTier: 'free' // Available to all users, but content varies by tier
    },
    {
      id: 'media',
      title: 'Media',
      description: 'Video content, leader talks, and multimedia resources for visual learners.',
      icon: Film,
      screen: 'leadership-videos',
      requiredTier: 'free' // Available to all users, but content varies by tier
    },
    // Feature: Strategic Templates
    ...(isFeatureEnabled('strat-templates') ? [{
      id: 'templates',
      title: 'Strategic Templates',
      description: 'Downloadable worksheets and tools for your team.',
      icon: FileText,
      screen: 'strat-templates',
      requiredTier: 'professional'
    }] : [])
  ];

  const handleCardClick = (item) => {
    console.log('🔍 Library Card Click Debug:', {
      itemId: item.id,
      itemTitle: item.title,
      targetScreen: item.screen,
      currentTier: currentTier,
      requiredTier: item.requiredTier,
      navigateFunction: typeof navigate
    });
    
    if (navigate && typeof navigate === 'function') {
      const hasAccess = membershipService.hasAccess(currentTier, item.requiredTier);
      
      console.log('🔑 Access Check Result:', {
        hasAccess: hasAccess,
        willNavigateTo: hasAccess ? item.screen : 'membership-upgrade'
      });
      
      if (!hasAccess) {
        console.log('❌ No access - redirecting to membership-upgrade');
        navigate('membership-upgrade');
      } else {
        console.log('✅ Access granted - navigating to:', item.screen);
        navigate(item.screen);
      }
    } else {
      console.error('❌ Navigate function not available or not a function');
    }
  };

  return (
      <div className="page-corporate container-corporate animate-corporate-fade-in">
        <div className="content-full">
      <div>
        {/* Back Button */}
        <div className="flex items-center gap-2 mb-6 text-gray-600 hover:text-gray-800 cursor-pointer transition-colors" onClick={() => navigate('dashboard')}>
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back to Dashboard</span>
        </div>

        {/* Enhanced Header with Stats */}
        <div className="mb-12 text-center relative">
          {/* Floating decorative elements */}
          <div className="absolute top-0 left-1/4 w-6 h-6 rounded-full animate-bounce" style={{ backgroundColor: `${COLORS.TEAL}30`, animationDelay: '0s' }}></div>
          <div className="absolute top-8 right-1/4 w-4 h-4 rounded-full animate-bounce" style={{ backgroundColor: `${COLORS.ORANGE}30`, animationDelay: '1s' }}></div>
          <div className="absolute top-4 left-3/4 w-5 h-5 rounded-full animate-bounce" style={{ backgroundColor: `${COLORS.NAVY}30`, animationDelay: '2s' }}></div>
          
          <div className="flex items-center justify-center gap-2 mb-4">
            <BookOpen className='w-8 h-8' style={{color: COLORS.TEAL}}/>
            <h1 className="corporate-heading-xl" style={{ color: COLORS.NAVY }}>
              Leadership Content
            </h1>
            <BookOpen className='w-8 h-8' style={{color: COLORS.TEAL}}/>
          </div>
          
          <p className="corporate-text-body mx-auto mb-8 px-4">
            🚀 Your complete leadership development ecosystem. <strong>6 structured courses</strong>, <strong>50+ curated readings</strong>, and <strong>exclusive video content</strong> - all designed to accelerate your growth from manager to executive.
          </p>
          
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3 mx-auto mb-8 max-w-md">
            <div className="bg-white rounded-xl p-4 shadow-md border-2" style={{ borderColor: `${COLORS.TEAL}20` }}>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Target className="w-5 h-5" style={{ color: COLORS.TEAL }} />
                <span className="text-2xl font-bold" style={{ color: COLORS.NAVY }}>
                  {loading ? '...' : contentCounts.courses}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-600">Expert-Led Courses</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-md border-2" style={{ borderColor: `${COLORS.NAVY}20` }}>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Trophy className="w-5 h-5" style={{ color: COLORS.NAVY }} />
                <span className="text-2xl font-bold" style={{ color: COLORS.NAVY }}>
                  {loading ? '...' : `${contentCounts.readings}+`}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-600">Curated Readings</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-md border-2" style={{ borderColor: `${COLORS.ORANGE}20` }}>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="w-5 h-5" style={{ color: COLORS.ORANGE }} />
                <span className="text-2xl font-bold" style={{ color: COLORS.NAVY }}>
                  {loading ? '...' : contentCounts.videos > 0 ? `${contentCounts.videos}` : 'Elite'}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-600">Premium Videos</p>
            </div>
          </div>
        </div>

        {/* Enhanced Library Cards */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Trophy className="w-6 h-6" style={{ color: COLORS.TEAL }} />
            <h2 className="text-2xl font-bold" style={{ color: COLORS.NAVY }}>
              Choose Your Learning Path
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                requiredTier={hasAccess ? null : item.requiredTier}
              />
            );
          })}
          </div>
        </div>


        
        {/* Upgrade CTA for Free Users */}
        {currentTier === 'free' && (
          <div className="card-corporate-elevated mt-12 text-center" style={{ borderColor: COLORS.TEAL }}>
            <div className="relative z-10 p-8 text-center">
              <h3 className="text-2xl font-bold mb-4" style={{ color: COLORS.NAVY }}>
                Unlock Leadership Library
              </h3>
              
              <p className="text-lg text-gray-700 mb-6">
                Access our premium library of leadership courses, expert-curated readings, and exclusive videos.
              </p>
              
              <div className="text-center mb-6">
                <span className="inline-block bg-orange-100 text-orange-800 px-4 py-2 rounded-full text-sm font-semibold">Requires Premium</span>
              </div>
              
              <button
                onClick={() => navigate('membership-upgrade')}
                className="bg-gradient-to-r from-teal-600 to-navy-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Upgrade Now
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default Library;
