import React, { useState, useEffect } from 'react';
import { useAppServices } from '../../../services/useAppServices.jsx';
import { useContentAccess } from '../../../hooks/useContentAccess';
import { collection, query, where, getDocs, orderBy } from '../../../services/firebaseUtils';
import { UNIFIED_COLLECTION, CONTENT_TYPES } from '../../../services/unifiedContentService';
import { getContentGroupById, GROUP_TYPES } from '../../../services/contentGroupsService';
import { PageLayout } from '../../ui/PageLayout.jsx';
import { Loader, Dumbbell, CheckCircle, Lock, BookOpen, Wrench, Film, FileText, PlayCircle } from 'lucide-react';
import { Button, Badge } from '../../screens/developmentplan/DevPlanComponents.jsx';

const WorkoutDetail = (props) => {
  const { db, navigate } = useAppServices();
  const { isContentUnlocked } = useContentAccess();
  const [workout, setWorkout] = useState(null);
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Handle both direct props (from spread) and navParams prop (legacy/wrapper)
  const workoutId = props.id || props.navParams?.id;

  useEffect(() => {
    const fetchWorkoutData = async () => {
      if (!workoutId) return;

      try {
        setLoading(true);
        
        // 1. Fetch Workout Details from LOV
        const workoutData = await getContentGroupById(db, GROUP_TYPES.WORKOUTS, workoutId);
        
        if (workoutData) {
          setWorkout(workoutData);
          
          // 2. Query content where workouts array contains this workoutId
          const contentRef = collection(db, UNIFIED_COLLECTION);
          const q = query(
            contentRef,
            where('workouts', 'array-contains', workoutId),
            where('status', '==', 'PUBLISHED'),
            orderBy('updatedAt', 'desc')
          );
          
          const contentSnap = await getDocs(q);
          let contentItems = contentSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          // 3. If workout has contentOrder, sort by it
          if (workoutData.contentOrder && workoutData.contentOrder.length > 0) {
            const orderMap = {};
            workoutData.contentOrder.forEach((id, index) => {
              orderMap[id] = index;
            });
            contentItems.sort((a, b) => {
              const orderA = orderMap[a.id] ?? 999;
              const orderB = orderMap[b.id] ?? 999;
              return orderA - orderB;
            });
          }
          
          setContent(contentItems);
        }
      } catch (error) {
        console.error("Error fetching workout details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkoutData();
  }, [db, workoutId]);

  const handleContentClick = (item) => {
    // Navigate based on content type
    const navState = { 
      fromWorkout: { 
        id: workoutId, 
        title: workout?.label 
      } 
    };

    switch (item.type) {
      case CONTENT_TYPES.VIDEO:
        navigate('video-detail', { id: item.id, ...navState });
        break;
      case CONTENT_TYPES.READ_REP:
        navigate('read-rep-detail', { id: item.id, ...navState });
        break;
      case CONTENT_TYPES.TOOL:
        navigate('tool-detail', { id: item.id, ...navState });
        break;
      case CONTENT_TYPES.DOCUMENT:
        navigate('document-detail', { id: item.id, ...navState });
        break;
      default:
        console.warn("Unknown content type:", item.type);
    }
  };

  const getIconForType = (type) => {
    switch (type) {
      case CONTENT_TYPES.VIDEO: return <Film className="w-5 h-5" />;
      case CONTENT_TYPES.TOOL: return <Wrench className="w-5 h-5" />;
      case CONTENT_TYPES.READ_REP: return <BookOpen className="w-5 h-5" />;
      case CONTENT_TYPES.DOCUMENT: return <FileText className="w-5 h-5" />;
      default: return <CheckCircle className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <PageLayout title="Loading Workout..." showBack={true}>
        <div className="flex justify-center p-12">
          <Loader className="w-8 h-8 animate-spin text-corporate-teal" />
        </div>
      </PageLayout>
    );
  }

  if (!workout) {
    return (
      <PageLayout title="Workout Not Found" showBack={true}>
        <div className="p-6 text-center">
          <p className="text-gray-600 dark:text-gray-300">The requested workout could not be found.</p>
          <Button onClick={() => navigate('workouts-index')} className="mt-4">
            Back to Workouts
          </Button>
        </div>
      </PageLayout>
    );
  }

  if (workout.isHiddenUntilUnlocked && !isContentUnlocked(workout)) {
    return (
      <PageLayout title="Content Locked" showBack={true}>
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-6">
            <Lock className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">This Workout is Locked</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8">
            You haven't unlocked this content yet. Continue your Development Plan to gain access.
          </p>
          {workout.unlockDay && (
            <p className="text-sm text-slate-400 mb-4">Unlocks on Day {workout.unlockDay}</p>
          )}
          <Button onClick={() => navigate('workouts-index')}>
            Back to Workouts
          </Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title={workout.label} 
      subtitle={workout.description}
      breadcrumbs={[
        { label: 'Home', path: 'dashboard' },
        { label: 'Library', path: 'library' },
        { label: 'Workouts', path: 'workouts-index' },
        { label: workout.label, path: null }
      ]}
    >
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Workout Overview Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 sm:p-8">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                  <Dumbbell className="w-6 h-6 text-orange-600" />
                </div>
                <h2 className="text-xl font-bold text-corporate-navy">Workout Overview</h2>
              </div>
              <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                {workout.description}
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Badge variant="teal" icon={CheckCircle}>
                  {content.length} Content Items
                </Badge>
              </div>
            </div>
            
            {/* CTA Section */}
            <div className="w-full md:w-72 bg-slate-50 dark:bg-slate-800 rounded-lg p-6 border border-slate-100 flex flex-col justify-center items-center text-center">
              <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mb-4 text-orange-500">
                <PlayCircle className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-2">Start This Workout</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Work through the content to build your skills.
              </p>
            </div>
          </div>
        </div>

        {/* Content List */}
        <div>
          <h3 className="text-lg font-bold text-corporate-navy mb-4 flex items-center gap-2">
            <span className="bg-orange-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">
              {content.length}
            </span>
            Workout Content
          </h3>
          
          <div className="space-y-4">
            {content.map((item) => {
              const isLocked = item.isHiddenUntilUnlocked && !isContentUnlocked(item);
              
              return (
                <div 
                  key={item.id}
                  onClick={() => !isLocked && handleContentClick(item)}
                  className={`
                    group bg-white dark:bg-slate-800 border rounded-lg p-5 flex items-center gap-4 transition-all
                    ${isLocked 
                      ? 'border-slate-200 dark:border-slate-700 opacity-60 cursor-not-allowed' 
                      : 'border-slate-200 dark:border-slate-700 hover:border-orange-500 hover:shadow-md cursor-pointer'
                    }
                  `}
                >
                  <div className={`
                    flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors
                    ${isLocked 
                      ? 'bg-slate-100 dark:bg-slate-700 text-slate-400' 
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 group-hover:bg-orange-500 group-hover:text-white'
                    }
                  `}>
                    {isLocked ? <Lock className="w-5 h-5" /> : getIconForType(item.type)}
                  </div>
                  
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {item.type?.replace('_', ' ')}
                      </span>
                    </div>
                    <h4 className={`font-bold transition-colors ${isLocked ? 'text-slate-400' : 'text-slate-800 dark:text-slate-200 group-hover:text-orange-500'}`}>
                      {item.title}
                    </h4>
                    {item.description && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">
                        {item.description}
                      </p>
                    )}
                    {isLocked && item.unlockDay && (
                      <p className="text-xs text-slate-400 mt-1">Unlocks on Day {item.unlockDay}</p>
                    )}
                  </div>
                  
                  <div className="flex-shrink-0 flex items-center gap-3">
                    {item.estimatedTime && (
                      <span className="text-xs font-medium text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded">
                        {item.estimatedTime} min
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            
            {content.length === 0 && (
              <div className="text-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg text-slate-400">
                No content has been added to this workout yet.
              </div>
            )}
          </div>
        </div>

      </div>
    </PageLayout>
  );
};

export default WorkoutDetail;
