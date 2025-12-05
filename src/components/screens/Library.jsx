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
        id: 'courses',
        title: 'Courses',
        description: 'Structured leadership courses and learning paths to develop your skills.',
        icon: ShieldCheck,
        screen: 'course-library'
      },
      {
        featureId: 'reading-hub',
        id: 'readings',
        title: 'Reading & Reps',
        description: 'Curated business readings with actionable exercises and practice opportunities.',
        icon: BookOpen,
        screen: 'business-readings'
      },
      {
        featureId: 'leadership-videos',
        id: 'media',
        title: 'Media',
        description: 'Video content, leader talks, and multimedia resources for visual learners.',
        icon: Film,
        screen: 'leadership-videos'
      },
      {
        featureId: 'strat-templates',
        id: 'templates',
        title: 'Strategic Templates',
        description: 'Downloadable worksheets and tools for your team.',
        icon: FileText,
        screen: 'strat-templates'
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
      backTo="dashboard"
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
