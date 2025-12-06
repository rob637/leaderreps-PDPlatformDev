// src/components/screens/Library.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, ShieldCheck, Film, Sparkles, Target, Trophy, Users, TrendingUp, Star, Zap, PlayCircle, FileText } from 'lucide-react';
import { useAppServices } from '../../services/useAppServices.jsx';
import { PageLayout, PageGrid, NoWidgetsEnabled } from '../ui';
import { getReadings, getVideos, getCourses } from '../../services/contentService';
import { useFeatures } from '../../providers/FeatureProvider';
import WidgetRenderer from '../admin/WidgetRenderer';

const LibraryCard = ({ title, description, icon: Icon, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="w-full text-left transition-all duration-300 rounded-2xl border p-6 h-full flex flex-col group
        bg-white hover:shadow-xl hover:-translate-y-1 cursor-pointer border-slate-200 hover:border-corporate-teal/50"
    >
      <div className="text-center mb-4 w-full">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors
            bg-corporate-teal/10 text-corporate-teal group-hover:bg-corporate-teal/20"
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
    const allLibraryItems = [
      {
        featureId: 'course-library',
        id: 'programs',
        title: 'Programs',
        description: 'Structured learning paths to master specific leadership capabilities.',
        icon: ShieldCheck,
        screen: 'programs-index'
      },
      {
        featureId: 'leadership-videos',
        id: 'workouts',
        title: 'Workouts',
        description: 'Practical training sessions to build skills through practice.',
        icon: Film,
        screen: 'workouts-index'
      },
      {
        featureId: 'reading-hub',
        id: 'readings',
        title: 'Read & Reps',
        description: 'Curated books and articles with actionable exercises.',
        icon: BookOpen,
        screen: 'read-reps-index'
      },
      {
        featureId: 'strat-templates',
        id: 'tools',
        title: 'Tools',
        description: 'Checklists, templates, and job aids for quick application.',
        icon: FileText,
        screen: 'tools-index'
      },
      {
        featureId: 'course-library', // Using course-library as proxy for Skills for now
        id: 'skills',
        title: 'Skills',
        description: 'Browse content by specific leadership capabilities.',
        icon: Zap,
        screen: 'skills-index'
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
      title="Content"
      subtitle="Your complete leadership development ecosystem."
      icon={BookOpen}
      navigate={navigate}
      breadcrumbs={[
        { label: 'Home', path: 'dashboard' },
        { label: 'Library', path: null }
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
