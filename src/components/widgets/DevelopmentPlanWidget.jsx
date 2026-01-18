import React, { useState, useMemo } from 'react';
import { BookOpen, CheckCircle, Circle, MessageSquare, Users, Video, Zap, Repeat, Play, FileText, ExternalLink, Loader, Layers } from 'lucide-react';
import { Card } from '../ui';
import UniversalResourceViewer from '../ui/UniversalResourceViewer';
import { doc, getDoc } from 'firebase/firestore';
import { useAppServices } from '../../services/useAppServices';
import { useDailyPlan } from '../../hooks/useDailyPlan';
import { useActionProgress } from '../../hooks/useActionProgress';
import { CONTENT_COLLECTIONS } from '../../services/contentService';

const DevelopmentPlanWidget = ({ helpText }) => {
  const { db } = useAppServices();
  const [viewingResource, setViewingResource] = useState(null);
  const [loadingResource, setLoadingResource] = useState(false);

  // Use Daily Plan Hook
  const { 
    dailyPlan, 
    currentPhase, 
    phaseDayNumber,
    toggleItemComplete: toggleDailyItem,
    userState
  } = useDailyPlan();
  
  const { getItemProgress, completeItem, uncompleteItem } = useActionProgress();

  // Calculate Current Week
  const currentWeekNumber = useMemo(() => {
    if (currentPhase?.id === 'pre-start') return 0;
    if (currentPhase?.id === 'start') {
      return Math.ceil(phaseDayNumber / 7);
    }
    return 1;
  }, [currentPhase, phaseDayNumber]);

  // Get Week Data
  const weekData = useMemo(() => {
    if (!dailyPlan || dailyPlan.length === 0) return null;
    
    // Filter for current week days
    // Note: This logic assumes standard 7-day weeks starting from day 1 of the phase
    const startDay = (currentWeekNumber - 1) * 7 + 1;
    const endDay = currentWeekNumber * 7;
    const phaseStartDbDay = 15; // Hardcoded for Start Phase
    const absStartDay = phaseStartDbDay + startDay - 1;
    const absEndDay = phaseStartDbDay + endDay - 1;
    
    const weekDays = dailyPlan.filter(d => 
      d.dayNumber >= absStartDay && 
      d.dayNumber <= absEndDay
    );
    
    // Aggregate actions
    const actions = [];
    weekDays.forEach(day => {
      if (day.actions) {
        actions.push(...day.actions.map((a, idx) => ({
          ...a, 
          dayId: day.id,
          id: a.id || `daily-${day.id}-${idx}` // Ensure ID
        })));
      }
    });
    
    // Try to find week metadata from the first day of the week (if stored there)
    // or fallback to generic info
    const firstDay = weekDays[0] || {};
    
    return {
      title: currentPhase?.displayName || 'Development Plan',
      weekNumber: currentWeekNumber,
      focus: firstDay.weekFocus || `Week ${currentWeekNumber} Focus`,
      description: firstDay.weekDescription || 'Complete your daily actions to progress.',
      actions
    };
  }, [dailyPlan, currentWeekNumber, currentPhase]);

  // Calculate Progress
  const completedItems = useMemo(() => {
    const completedSet = new Set();
    if (userState?.dailyProgress) {
      Object.values(userState.dailyProgress).forEach(dayProgress => {
        if (dayProgress.itemsCompleted) {
          dayProgress.itemsCompleted.forEach(id => completedSet.add(id));
        }
      });
    }
    return Array.from(completedSet);
  }, [userState?.dailyProgress]);

  const progressPercent = useMemo(() => {
    if (!weekData || weekData.actions.length === 0) return 0;
    const completedCount = weekData.actions.filter(item => {
      const progress = getItemProgress(item.id);
      return progress.status === 'completed' || completedItems.includes(item.id);
    }).length;
    return Math.round((completedCount / weekData.actions.length) * 100);
  }, [weekData, getItemProgress, completedItems]);

  if (!weekData) return null;

  const getItemIcon = (type) => {
    const normalizedType = (type || '').toUpperCase();
    switch (normalizedType) {
      case 'WORKOUT': return Video;
      case 'PROGRAM': return Play;
      case 'SKILL': return Zap;
      case 'TOOL': return FileText;
      case 'READ_AND_REP': return BookOpen;
      case 'LEADER_CIRCLE': return Users;
      case 'OPEN_GYM': return Users;
      case 'VIDEO': return Video;
      case 'READING': return BookOpen;
      case 'DOCUMENT': return FileText;
      case 'COURSE': return Layers;
      case 'COMMUNITY': return Users;
      case 'COACHING': return MessageSquare;
      default: return Circle;
    }
  };

  const handleViewResource = async (e, item) => {
    e.stopPropagation();
    
    if (item.url && !item.title?.toLowerCase().includes('pdq')) {
      setViewingResource({
          ...item,
          type: item.resourceType || 'link'
      });
      return;
    }

    const resourceId = item.resourceId || item.id;

    if (resourceId) {
      setLoadingResource(item.id);
      try {
        const contentRef = doc(db, 'content_library', resourceId);
        const contentSnap = await getDoc(contentRef);
        
        if (contentSnap.exists()) {
           const data = contentSnap.data();
           let resourceData = { id: contentSnap.id, ...data, resourceType: data.type };
           if (data.type === 'REP' && data.details?.videoUrl) {
               resourceData.url = data.details.videoUrl;
               resourceData.resourceType = 'video';
           } else if (data.type === 'VIDEO') {
               resourceData.url = data.url || data.videoUrl || data.details?.externalUrl || data.metadata?.externalUrl;
               resourceData.resourceType = 'video';
           } else if (data.type === 'READ_REP') {
               if (data.details?.pdfUrl) {
                   resourceData.url = data.details.pdfUrl;
                   resourceData.resourceType = 'pdf';
               }
           }
           setViewingResource(resourceData);
        } else {
            // Fallback logic...
            alert("Resource not found.");
        }
      } catch (error) {
        console.error("Error fetching resource:", error);
        alert("Failed to load resource.");
      } finally {
        setLoadingResource(false);
      }
    }
  };

  const handleToggle = async (item) => {
    const itemId = item.id;
    if (!itemId) return;
    
    const progress = getItemProgress(itemId);
    const isCurrentlyComplete = progress.status === 'completed' || completedItems.includes(itemId);
    
    if (item.dayId) {
      toggleDailyItem(item.dayId, itemId, !isCurrentlyComplete);
    }
    
    if (isCurrentlyComplete) {
      await uncompleteItem(itemId);
    } else {
      await completeItem(itemId, {
        currentWeek: currentWeekNumber,
        weekNumber: currentWeekNumber,
        category: item.category?.toLowerCase(),
        label: item.label || item.title
      });
    }
  };

  return (
    <>
      {viewingResource && (
        <UniversalResourceViewer 
          resource={viewingResource} 
          onClose={() => setViewingResource(null)} 
        />
      )}
      <Card title={weekData.title} subtitle={`Week ${weekData.weekNumber}`} icon={BookOpen} accent="BLUE" helpText={helpText}>
        <div className="space-y-4">
          {/* Header Info */}
          <div>
            <div className="flex justify-between items-start mb-1">
              <h3 className="text-lg font-bold text-slate-800">{weekData.focus}</h3>
              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full uppercase tracking-wider">
                Week {weekData.weekNumber}
              </span>
            </div>
            <p className="text-sm text-slate-600 mb-3">{weekData.description}</p>
            
            {/* Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-2 mb-1">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>{progressPercent}% Complete</span>
              <span>{weekData.actions.length} Items</span>
            </div>
          </div>

          {/* Actions List */}
          <div className="space-y-2">
            {weekData.actions.map((item, idx) => {
              const progress = getItemProgress(item.id);
              const isCompleted = progress.status === 'completed' || completedItems.includes(item.id);
              const Icon = getItemIcon(item.type);

              return (
                <div 
                  key={item.id || idx}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                    isCompleted ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <div 
                    onClick={() => handleToggle(item)}
                    className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer transition-colors ${
                      isCompleted ? 'bg-blue-500 border-blue-500' : 'border-slate-300 hover:border-blue-400'
                    }`}
                  >
                    {isCompleted && <CheckCircle className="w-3 h-3 text-white" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${isCompleted ? 'text-slate-500 line-through' : 'text-slate-700'}`}>
                      {item.label || item.title}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Icon className="w-3 h-3" />
                      <span className="capitalize">{item.type?.replace(/_/g, ' ').toLowerCase()}</span>
                    </div>
                  </div>

                  {(item.resourceId || item.url) && (
                    <button
                      onClick={(e) => handleViewResource(e, item)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      {loadingResource === item.id ? <Loader className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </>
  );
};

export default DevelopmentPlanWidget;