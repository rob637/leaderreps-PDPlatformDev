// src/components/screens/Library.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, ShieldCheck, Film, Sparkles, Target, Trophy, Users, TrendingUp, Star, Zap, PlayCircle, FileText, Layers, Dumbbell, Wrench, ListVideo } from 'lucide-react';
import { useAppServices } from '../../services/useAppServices.jsx';
import { PageLayout, PageGrid, NoWidgetsEnabled } from '../ui';
import { DashboardCard } from '../ui/DashboardCard';
import { ContentListItem } from '../ui/ContentListItem';
import { collection, query, where, getCountFromServer } from '../../services/firebaseUtils';
import { UNIFIED_COLLECTION } from '../../services/unifiedContentService';
import { useFeatures } from '../../providers/FeatureProvider';
import WidgetRenderer from '../admin/WidgetRenderer';

const Library = () => {
  const { navigate, db } = useAppServices();
  const { isFeatureEnabled } = useFeatures();
  const [contentCounts, setContentCounts] = useState({ readings: 0, videos: 0, courses: 0, programs: 0, workouts: 0, tools: 0 });
  const [loading, setLoading] = useState(true);
  
  // Fetch content counts on mount
  useEffect(() => {
    const fetchContentCounts = async () => {
      try {
        setLoading(true);
        
        // Helper to get count for a type
        const getCount = async (type) => {
          const q = query(collection(db, UNIFIED_COLLECTION), where('type', '==', type), where('status', '==', 'PUBLISHED'));
          const snapshot = await getCountFromServer(q);
          return snapshot.data().count;
        };

        const [readingsCount, programsCount, workoutsCount, toolsCount, videosCount] = await Promise.all([
          getCount('READ_REP'),
          getCount('PROGRAM'),
          getCount('WORKOUT'),
          getCount('TOOL'),
          getCount('VIDEO')
        ]);

        setContentCounts({
          readings: readingsCount,
          programs: programsCount,
          workouts: workoutsCount,
          tools: toolsCount,
          videos: videosCount,
          courses: 0 // Deprecated concept
        });
      } catch (error) {
        console.error('Error fetching content counts:', error);
        setContentCounts({ readings: 0, videos: 0, courses: 0, programs: 0, workouts: 0, tools: 0 });
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
      /* Temporarily hidden per requirements
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
      */
      /* Temporarily hidden - not enough data yet
      {
        id: 'skills',
        title: 'Skills',
        description: 'Browse content by specific leadership capabilities.',
        icon: Zap,
        screen: 'skills-index',
        color: 'text-corporate-orange',
        bgColor: 'bg-corporate-orange/10'
      },
      */
      {
        id: 'readings',
        title: 'Read & Reps',
        description: 'Curated books and articles with actionable exercises.',
        icon: BookOpen,
        screen: 'read-reps-index',
        color: 'text-corporate-navy',
        bgColor: 'bg-corporate-navy/10'
      },
      {
        id: 'videos',
        title: 'Videos',
        description: 'Leadership videos and talks to inspire and educate.',
        icon: Film,
        screen: 'videos-index',
        color: 'text-corporate-orange',
        bgColor: 'bg-corporate-orange/10'
      },
      {
        id: 'video-series',
        title: 'Video Series',
        description: 'Curated playlists of videos to watch in sequence.',
        icon: ListVideo,
        screen: 'video-series-index',
        color: 'text-purple-600 dark:text-purple-400',
        bgColor: 'bg-purple-100 dark:bg-purple-900/30'
      },
      {
        id: 'documents',
        title: 'Documents',
        description: 'Reference materials, guides, and whitepapers.',
        icon: FileText,
        screen: 'documents-index',
        color: 'text-slate-600 dark:text-slate-300',
        bgColor: 'bg-slate-100 dark:bg-slate-700'
      },
      {
        id: 'tools',
        title: 'Tools',
        description: 'Checklists, templates, and job aids for quick application.',
        icon: Wrench,
        screen: 'tools-index',
        color: 'text-corporate-teal',
        bgColor: 'bg-corporate-teal/10'
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
    DashboardCard,
    
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
        { label: 'Content', path: null }
      ]}
    >
      <WidgetRenderer widgetId="content-library-main" scope={scope}>
        {libraryItems.length > 0 ? (
          <div className="flex flex-col gap-3 max-w-3xl mx-auto">
            {libraryItems.map(item => (
              <ContentListItem 
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
