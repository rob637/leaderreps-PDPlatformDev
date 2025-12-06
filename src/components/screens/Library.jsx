// src/components/screens/Library.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, ShieldCheck, Film, Sparkles, Target, Trophy, Users, TrendingUp, Star, Zap, PlayCircle, FileText, Layers, Dumbbell, Wrench } from 'lucide-react';
import { useAppServices } from '../../services/useAppServices.jsx';
import { PageLayout, PageGrid, NoWidgetsEnabled } from '../ui';
import { getReadings, getVideos, getCourses } from '../../services/contentService';
import { useFeatures } from '../../providers/FeatureProvider';
import WidgetRenderer from '../admin/WidgetRenderer';

const LibraryCard = ({ title, description, icon: Icon, onClick, color, bgColor }) => {
  return (
    <button
      onClick={onClick}
      className="w-full text-left transition-all duration-300 rounded-2xl border p-6 h-full flex flex-col group
        bg-white hover:shadow-xl hover:-translate-y-1 cursor-pointer border-slate-200 hover:border-corporate-teal/50"
    >
      <div className="text-center mb-4 w-full">
        <div
          className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors
            ${bgColor || 'bg-corporate-teal/10'} ${color || 'text-corporate-teal'} group-hover:bg-opacity-80`}
        >
          <Icon className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-bold mb-3 text-corporate-navy">
          {title}
        </h3>
      </div>
      <div className="flex-1 flex flex-col w-full">
        <p className="text-slate-600 text-center mb-4 flex-1">
          {description}
        </p>
      </div>
    </button>
  );
};

const Library = () => {
  const { navigate, db } = useAppServices();
  const { isFeatureEnabled, getFeatureOrder } = useFeatures();
  const [contentCounts, setContentCounts] = useState({ readings: 0, videos: 0, courses: 0 });
  const [loading, setLoading] = useState(true);
  
  // Fetch content counts on mount
  useEffect(() => {
    const fetchContentCounts = async () => {
      try {
        setLoading(true);
        const [readingsData, videosData, coursesData] = await Promise.all([
          getReadings(db, 'free'),
          getVideos(db, 'free'),
          getCourses(db, 'free')
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
  }, [db]);
  
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const libraryItems = useMemo(() => {
    // Hardcoded list based on new architecture requirements
    // We bypass feature flags for the core 5 pillars to ensure they always show
    const allLibraryItems = [
      {
        id: 'programs',
        title: 'Programs',
        description: 'Structured learning paths to master specific leadership capabilities.',
        icon: Layers,
        screen: 'programs-index',
        color: 'text-corporate-navy',
        bgColor: 'bg-corporate-navy/10'
      },
      {
        id: 'workouts',
        title: 'Workouts',
        description: 'Practical training sessions to build skills through practice.',
        icon: Dumbbell,
        screen: 'workouts-index',
        color: 'text-corporate-teal',
        bgColor: 'bg-corporate-teal/10'
      },
      {
        id: 'skills',
        title: 'Skills',
        description: 'Browse content by specific leadership capabilities.',
        icon: Zap,
        screen: 'skills-index',
        color: 'text-corporate-orange',
        bgColor: 'bg-corporate-orange/10'
      },
      {
        id: 'readings',
        title: 'Read & Reps',
        description: 'Curated books and articles with actionable exercises.',
        icon: BookOpen,
        screen: 'read-reps-index',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50'
      },
      {
        id: 'tools',
        title: 'Tools',
        description: 'Checklists, templates, and job aids for quick application.',
        icon: Wrench,
        screen: 'tools-index',
        color: 'text-slate-600',
        bgColor: 'bg-slate-100'
      }
    ];

    return allLibraryItems;
  }, []);

  const handleCardClick = (item) => {
    if (navigate && typeof navigate === 'function') {
      navigate(item.screen);
    }
  };

  const scope = {
    // Data
    libraryItems,
    contentCounts,
    loading,
    
    // Functions
    handleCardClick,
    navigate,
    isFeatureEnabled,
    
    // Components
    LibraryCard,
    
    // Icons
    BookOpen, ShieldCheck, Film, Sparkles, Target, Trophy, Users, TrendingUp, Star, Zap, PlayCircle, FileText
  };

  return (
    <PageLayout
      title="Content Library"
      subtitle="Your complete leadership development ecosystem."
      icon={BookOpen}
      navigate={navigate}
      breadcrumbs={[
        { label: 'Home', path: 'dashboard' },
        { label: 'Content', path: null }
      ]}
    >
      <WidgetRenderer widgetId="content-library-main" scope={scope}>
        {libraryItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {libraryItems.map(item => (
              <LibraryCard 
                key={item.id}
                {...item}
                onClick={() => handleCardClick(item)}
              />
            ))}
          </div>
        ) : (
          <NoWidgetsEnabled moduleName="Content" />
        )}
      </WidgetRenderer>
    </PageLayout>
  );
};

export default Library;
