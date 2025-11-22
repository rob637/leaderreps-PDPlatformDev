// src/components/screens/Library.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, ShieldCheck, Film, ArrowLeft, Sparkles, Target, Trophy, Users, TrendingUp, Star, Zap, PlayCircle, FileText } from 'lucide-react';
import { useAppServices } from '../../services/useAppServices.jsx';
import { membershipService } from '../../services/membershipService.js';
import { Button, Card } from '../shared/UI';
import { getReadings, getVideos, getCourses } from '../../services/contentService';
import { useFeatures } from '../../providers/FeatureProvider';
import WidgetRenderer from '../admin/WidgetRenderer';

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
    <Card
      onClick={disabled ? undefined : onClick}
      accent={disabled ? 'GRAY' : 'TEAL'}
      className={`h-full ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-50' : 'hover:shadow-xl'}`}
    >
      <div className="flex flex-col items-center text-center h-full">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4"
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
        <p className="text-gray-600 mb-4 flex-1">
          {description}
        </p>
        {disabled && requiredTier && (
          <div className="mt-auto w-full">
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
    </Card>
  );
};

const Library = ({ simulatedTier, isDeveloperMode }) => {
  const { membershipData, navigate, db } = useAppServices();
  const { isFeatureEnabled, getFeatureOrder } = useFeatures();
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

  const libraryItems = useMemo(() => {
    const allLibraryItems = [
      {
        featureId: 'course-library',
        id: 'courses',
        title: 'Courses',
        description: 'Structured leadership courses and learning paths to develop your skills.',
        icon: ShieldCheck,
        screen: 'course-library',
        requiredTier: 'free'
      },
      {
        featureId: 'reading-hub',
        id: 'readings',
        title: 'Reading & Reps',
        description: 'Curated business readings with actionable exercises and practice opportunities.',
        icon: BookOpen,
        screen: 'reading-hub',
        requiredTier: 'free'
      },
      {
        featureId: 'leadership-videos',
        id: 'media',
        title: 'Media',
        description: 'Video content, leader talks, and multimedia resources for visual learners.',
        icon: Film,
        screen: 'leadership-videos',
        requiredTier: 'free'
      },
      {
        featureId: 'strat-templates',
        id: 'templates',
        title: 'Strategic Templates',
        description: 'Downloadable worksheets and tools for your team.',
        icon: FileText,
        screen: 'strat-templates',
        requiredTier: 'professional'
      }
    ];

    return allLibraryItems
      .filter(item => isFeatureEnabled(item.featureId))
      .sort((a, b) => {
        const orderA = getFeatureOrder(a.featureId);
        const orderB = getFeatureOrder(b.featureId);
        return orderA - orderB;
      });
  }, [isFeatureEnabled, getFeatureOrder]);

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

  const scope = {
    // Data
    libraryItems,
    contentCounts,
    loading,
    currentTier,
    
    // Functions
    handleCardClick,
    navigate,
    isFeatureEnabled,
    
    // Components
    LibraryCard,
    
    // Constants/Utils
    COLORS,
    membershipService,
    
    // Icons
    BookOpen, ShieldCheck, Film, ArrowLeft, Sparkles, Target, Trophy, Users, TrendingUp, Star, Zap, PlayCircle, FileText
  };

  return (
      <div className="page-corporate container-corporate animate-corporate-fade-in">
        <div className="content-full">
      <div>
        {/* Back Button */}
        <div className="mb-6">
          <Button 
            variant="nav-back" 
            onClick={() => navigate('dashboard')}
            className="pl-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
                <BookOpen className='w-8 h-8' style={{color: COLORS.TEAL}}/>
                <h1 className="corporate-heading-xl" style={{ color: COLORS.NAVY }}>Content</h1>
                <BookOpen className='w-8 h-8' style={{color: COLORS.TEAL}}/>
            </div>
            <p className="corporate-text-body text-gray-600 mx-auto px-4">Your complete leadership development ecosystem.</p>
        </div>

        <WidgetRenderer widgetId="content-library-main" scope={scope} />
        
        </div>
      </div>
    </div>
  );
};

export default Library;
