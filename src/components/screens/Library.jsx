// src/components/screens/Library.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, ShieldCheck, Film, ArrowLeft, Sparkles, Target, Trophy, Users, TrendingUp, Star, Zap, PlayCircle, FileText } from 'lucide-react';
import { useAppServices } from '../../services/useAppServices.jsx';
import { membershipService } from '../../services/membershipService.js';
import { Button } from '../shared/UI';
import { getReadings, getVideos, getCourses } from '../../services/contentService';
import { useFeatures } from '../../providers/FeatureProvider';
import WidgetRenderer from '../admin/WidgetRenderer';

const LibraryCard = ({ title, description, icon: Icon, onClick, isLocked = false, requiredTier }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left transition-all duration-300 rounded-2xl border p-6 h-full flex flex-col group
        ${isLocked 
          ? 'opacity-90 border-slate-200 bg-slate-50 hover:bg-slate-100' 
          : 'bg-white hover:shadow-xl hover:-translate-y-1 cursor-pointer border-slate-200 hover:border-[#47A88D]/50'
        }`}
    >
      <div className="text-center mb-4 w-full">
        <div
          className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors
            ${isLocked ? 'bg-slate-200 text-slate-400' : 'bg-[#47A88D]/10 text-[#47A88D] group-hover:bg-[#47A88D]/20'}`}
        >
          <Icon className="w-10 h-10" />
        </div>
        <h3 className={`text-xl font-bold mb-3 ${isLocked ? 'text-slate-500' : 'text-[#002E47]'}`}>
          {title}
        </h3>
      </div>
      <div className="flex-1 flex flex-col w-full">
        <p className="text-slate-600 text-center mb-4 flex-1">
          {description}
        </p>
        {isLocked && requiredTier && (
          <div className="mt-auto w-full">
            <div className="inline-flex items-center px-3 py-2 rounded-full text-sm font-semibold w-full justify-center bg-[#E04E1B]/10 text-[#E04E1B] border border-[#E04E1B]/20">
              Requires Premium Tier
            </div>
          </div>
        )}
      </div>
    </button>
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
    if (navigate && typeof navigate === 'function') {
      const hasAccess = membershipService.hasAccess(currentTier, item.requiredTier);
      
      if (!hasAccess) {
        navigate('membership-upgrade');
      } else {
        navigate(item.screen);
      }
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
    membershipService,
    
    // Icons
    BookOpen, ShieldCheck, Film, ArrowLeft, Sparkles, Target, Trophy, Users, TrendingUp, Star, Zap, PlayCircle, FileText
  };

  return (
      <div className="min-h-screen bg-slate-50 p-6 md:p-10 animate-fade-in">
        <div className="max-w-7xl mx-auto">
      
        {/* Back Button */}
        <button 
            onClick={() => navigate('dashboard')}
            className="flex items-center gap-2 mb-8 text-slate-500 hover:text-[#002E47] transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back to Dashboard</span>
        </button>

        {/* Header */}
        <div className="text-center mb-12 space-y-4">
            <div className="flex items-center justify-center gap-3">
                <BookOpen className='w-8 h-8 text-[#47A88D]'/>
                <h1 className="text-4xl font-bold text-[#002E47]">Content</h1>
                <BookOpen className='w-8 h-8 text-[#47A88D]'/>
            </div>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">Your complete leadership development ecosystem.</p>
        </div>

        <WidgetRenderer widgetId="content-library-main" scope={scope}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
                {libraryItems.map(item => (
                    <LibraryCard 
                        key={item.id}
                        {...item}
                        onClick={() => handleCardClick(item)}
                        isLocked={!membershipService.hasAccess(currentTier, item.requiredTier)}
                        requiredTier={item.requiredTier}
                    />
                ))}
            </div>
        </WidgetRenderer>
        
      </div>
    </div>
  );
};

export default Library;
