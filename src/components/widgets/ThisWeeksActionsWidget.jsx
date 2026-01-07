import React, { useState, useMemo } from 'react';
import { 
  CheckCircle, Circle, Play, BookOpen, Users, Video, FileText, Zap, 
  ExternalLink, Loader, Layers, MessageSquare, 
  SkipForward, Clock, AlertTriangle,
  User, ClipboardCheck, Calendar
} from 'lucide-react';
import { Card } from '../ui';
import { useDailyPlan } from '../../hooks/useDailyPlan';
import { useActionProgress } from '../../hooks/useActionProgress';
import { useCoachingRegistrations } from '../../hooks/useCoachingRegistrations';
import { useLeaderProfile } from '../../hooks/useLeaderProfile';
import UniversalResourceViewer from '../ui/UniversalResourceViewer';
import CoachingActionItem from '../coaching/CoachingActionItem';
import { doc, getDoc } from 'firebase/firestore';
import { useAppServices } from '../../services/useAppServices';
import { CONTENT_COLLECTIONS } from '../../services/contentService';
import LeaderProfileFormSimple from '../profile/LeaderProfileFormSimple';
import BaselineAssessmentSimple from '../screens/developmentplan/BaselineAssessmentSimple';

// Helper function to generate Google Calendar URL
const generateCalendarUrl = (calendarEvent) => {
  if (!calendarEvent) return null;
  
  const { title, startDate, duration, description, location } = calendarEvent;
  const start = new Date(startDate);
  const end = new Date(start.getTime() + (duration * 60 * 1000)); // duration in minutes
  
  // Format dates for Google Calendar (YYYYMMDDTHHMMSSZ)
  const formatDate = (date) => {
    // Keep the Z to indicate UTC time
    return date.toISOString().replace(/-|:|\.\d{3}/g, '');
  };
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${formatDate(start)}/${formatDate(end)}`,
    details: description || '',
    location: location || '',
  });
  
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

const ThisWeeksActionsWidget = () => {
  const { db, developmentPlanData, updateDevelopmentPlanData } = useAppServices();
  const [viewingResource, setViewingResource] = useState(null);
  const [loadingResource, setLoadingResource] = useState(false);
  // const [showSkipConfirm, setShowSkipConfirm] = useState(null);
  
  // Interactive content modals
  const [showLeaderProfileModal, setShowLeaderProfileModal] = useState(false);
  const [showBaselineModal, setShowBaselineModal] = useState(false);
  const [savingBaseline, setSavingBaseline] = useState(false);

  // Use Daily Plan Hook (New Architecture)
  const { 
    dailyPlan, 
    currentPhase, 
    phaseDayNumber, 
    currentDayData, 
    toggleItemComplete: toggleDailyItem,
    userState,
    journeyDay
  } = useDailyPlan();

  const actionProgress = useActionProgress();
  // const coachingRegistrations = useCoachingRegistrations();
  
  // Leader Profile completion tracking (for auto-check in Pre-Start)
  const { isComplete: leaderProfileComplete } = useLeaderProfile();
  
  // Baseline Assessment completion tracking
  const baselineAssessmentComplete = useMemo(() => {
    const assessmentHistory = userState?.assessmentHistory;
    return assessmentHistory && assessmentHistory.length > 0;
  }, [userState?.assessmentHistory]);
  
  // Progress tracking
  const { 
    completeItem, 
    uncompleteItem, 
    // skipItem, 
    getItemProgress,
    getCarriedOverItems
  } = actionProgress;
  
  // Coaching registrations
  // const {
    // registrations: userRegistrations
  // } = coachingRegistrations;

  // Calculate Current Week Number
  const currentWeekNumber = useMemo(() => {
    if (currentPhase?.id === 'pre-start') return 0;
    if (currentPhase?.id === 'start') {
      return Math.ceil(phaseDayNumber / 7);
    }
    return 1; // Default
  }, [currentPhase, phaseDayNumber]);

  // Normalize daily plan actions
  const normalizeDailyActions = (actions, dayId, dayNumber) => {
    return (actions || []).map((action, idx) => {
      const label = action.label || 'Daily Action';
      const fallbackId = `daily-${dayId}-${label.toLowerCase().replace(/\s+/g, '-').substring(0, 20)}-${idx}`;
      
      // Map action type to category
      let category = 'Content';
      const actionType = (action.type || '').toLowerCase();
      if (actionType === 'community' || actionType === 'leader_circle' || actionType === 'open_gym') {
        category = 'Community';
      } else if (actionType === 'coaching' || actionType === 'call') {
        category = 'Coaching';
      }
      
      return {
        ...action,
        id: action.id || fallbackId,
        // Keep original type for filtering (e.g., 'daily_rep'), use resourceType for display
        type: action.type || action.resourceType || 'content',
        displayType: action.resourceType || action.type || 'content',
        label: label,
        required: action.required !== false && !action.optional,
        optional: action.optional === true,
        resourceId: action.resourceId,
        resourceType: (action.resourceType || action.type || 'content').toLowerCase(),
        url: action.url || action.videoUrl || action.link || action.details?.externalUrl || action.metadata?.externalUrl,
        category,
        // Mark as coming from daily plan for UI distinction
        fromDailyPlan: true,
        dayId: dayId,
        dayNumber: dayNumber
      };
    });
  };

  // Combine all actionable items from Daily Plan
  const allActions = useMemo(() => {
    if (!dailyPlan || dailyPlan.length === 0) return [];

    // Pre-Start phase = Day-by-Day only (cumulative up to journeyDay)
    if (currentPhase?.id === 'pre-start') {
      // Get current day's actions (cumulative logic is handled in useDailyPlan for currentDayData, 
      // but here we want to be explicit about what we show)
      
      // In Prep Phase, we show actions for the CURRENT Journey Day
      // (Previous days are "done" or carried over if we implemented that, but Prep is linear)
      // Actually, useDailyPlan says "cumulativeActions: true" for Prep Phase.
      // So we should show actions from Day 1 to Journey Day.
      
      // Filter dailyPlan for Prep Phase days <= journeyDay
      const prepDays = dailyPlan.filter(d => 
        d.phase === 'pre-start' && 
        d.dayNumber <= 14 // Hardcoded prep phase length or use config
      );
      
      // Sort by dayNumber
      prepDays.sort((a, b) => a.dayNumber - b.dayNumber);
      
      // Take days up to journeyDay (mapped to 1-14)
      // Note: journeyDay is 1-based index of visits.
      // If journeyDay is 1, we show Day 1.
      // If journeyDay is 2, we show Day 1 and Day 2? Or just Day 2?
      // Usually "cumulative" means "everything available so far".
      
      // Let's stick to currentDayData for Prep Phase as it handles the logic best
      const dailyNormalized = normalizeDailyActions(currentDayData?.actions, currentDayData?.id, currentDayData?.dayNumber);
      
      // Filter out Leader Profile and Baseline Assessment from daily actions (handled by interactive content)
      const onboardingLabels = ['leader profile', 'baseline assessment'];
      const filteredDailyActions = dailyNormalized.filter(action => {
        const labelLower = (action.label || '').toLowerCase();
        if (onboardingLabels.some(keyword => labelLower.includes(keyword))) return false;
        if (action.type === 'daily_rep') return false;
        return true;
      });
      
      // Interactive content items (Leader Profile & Baseline Assessment)
      // These are now managed in content_library as INTERACTIVE type
      const interactiveItems = [
        {
          id: 'interactive-leader-profile',
          type: 'INTERACTIVE',
          handlerType: 'leader-profile',
          label: 'Complete Your Leader Profile',
          required: true,
          category: 'Onboarding',
          fromDailyPlan: false,
          isInteractive: true,
          autoComplete: leaderProfileComplete,
          icon: 'User',
          description: 'Tell us about yourself to personalize your journey',
          estimatedMinutes: 3
        },
        {
          id: 'interactive-baseline-assessment',
          type: 'INTERACTIVE',
          handlerType: 'baseline-assessment',
          label: 'Take Baseline Assessment',
          required: true,
          category: 'Onboarding',
          fromDailyPlan: false,
          isInteractive: true,
          autoComplete: baselineAssessmentComplete,
          icon: 'ClipboardCheck',
          description: 'Assess your current leadership skills',
          estimatedMinutes: 5
        }
      ];
      return [...interactiveItems, ...filteredDailyActions];
    }
    
    // Start/Post phase = Show actions for the CURRENT WEEK
    // Calculate day range for current week
    const startDay = (currentWeekNumber - 1) * 7 + 1;
    const endDay = currentWeekNumber * 7;
    
    // Filter dailyPlan for days in this week range (relative to phase start)
    // Note: dailyPlan has absolute dayNumbers (15-70 for Start Phase)
    // We need to map phaseDayNumber to absolute dayNumber
    const phaseStartDbDay = 15; // Hardcoded for now, should come from config
    const absStartDay = phaseStartDbDay + startDay - 1;
    const absEndDay = phaseStartDbDay + endDay - 1;
    
    const weekDays = dailyPlan.filter(d => 
      d.dayNumber >= absStartDay && 
      d.dayNumber <= absEndDay
    );
    
    let weekActions = [];
    weekDays.forEach(day => {
      if (day.actions) {
        weekActions.push(...normalizeDailyActions(day.actions, day.id, day.dayNumber));
      }
    });
    
    // Filter out Daily Reps
    return weekActions.filter(action => action.type !== 'daily_rep');
    
  }, [dailyPlan, currentPhase?.id, journeyDay, currentDayData, leaderProfileComplete, baselineAssessmentComplete, currentWeekNumber]);

  // Get carried over items (Simplified for Daily Plan)
  const carriedOverItems = useMemo(() => {
    // No carryover in Prep Phase
    if (currentPhase?.id === 'pre-start') return [];
    
    // Get explicitly carried over items from actionProgress
    const explicitCarryOver = getCarriedOverItems(currentWeekNumber);
    
    // TODO: Implement automatic carryover from previous weeks in Daily Plan
    // For now, rely on explicit carryover
    return explicitCarryOver;
  }, [currentPhase?.id, currentWeekNumber, getCarriedOverItems]);

  // Calculate progress
  const completedItems = useMemo(() => {
    // Get completed items from userState.dailyProgress for the relevant days
    // But simpler to just check item status via getItemProgress or userState
    // userState.dailyProgress is keyed by dayId
    
    // Let's use a Set of completed item IDs for fast lookup
    const completedSet = new Set();
    
    const dailyProgress = userState?.dailyProgress || {};
    console.log('[ThisWeeksActions] Computing completedItems from dailyProgress:', {
      keys: Object.keys(dailyProgress),
      day001: dailyProgress['day-001']?.itemsCompleted
    });
    
    Object.values(dailyProgress).forEach(dayProgress => {
      if (dayProgress && dayProgress.itemsCompleted) {
        dayProgress.itemsCompleted.forEach(id => completedSet.add(id));
      }
    });
    
    const result = Array.from(completedSet);
    console.log('[ThisWeeksActions] completedItems result:', result);
    return result;
  }, [userState]);

  // Filter to only required items for progress calculation
  const requiredActions = useMemo(() => {
    return allActions.filter(item => item.required !== false && !item.optional);
  }, [allActions]);

  const completedRequiredCount = useMemo(() => {
    return requiredActions.filter(item => {
      const progress = getItemProgress(item.id);
      return progress.status === 'completed' || completedItems.includes(item.id);
    }).length;
  }, [requiredActions, getItemProgress, completedItems]);

  // Progress percentage based only on required items (per Ryan's feedback)
  const totalRequiredCount = requiredActions.length;
  const progressPercent = totalRequiredCount > 0 ? Math.round((completedRequiredCount / totalRequiredCount) * 100) : 0;

  // Dynamic title
  const widgetTitle = currentPhase?.id === 'pre-start' 
    ? "Actions" 
    : "This Week's Actions";

  // Helper to get icon based on type
  const getIcon = (type) => {
    const normalized = (type || '').toUpperCase();
    switch (normalized) {
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
      case 'INTERACTIVE': return User;  // Interactive content items
      default: return Circle;
    }
  };

  // Helper to check if an item is a coaching item
  // const isCoachingItem = (item) => {
  //   const category = (item.category || '').toLowerCase();
  //   const type = (item.type || item.coachingItemType || '').toLowerCase();
  //   if (category === 'coaching') return true;
  //   const coachingTypes = ['open_gym', 'opengym', 'leader_circle', 'leadercircle', 'workshop', 'live_workout', 'one_on_one', 'coaching'];
  //   return coachingTypes.some(ct => type.includes(ct));
  // };
  
  // Helper to find user's registration for a coaching item
  // const findRegistrationForItem = (item) => {
  //   if (!userRegistrations || userRegistrations.length === 0) return null;
  //   const exactMatch = userRegistrations.find(reg => reg.coachingItemId === item.id && reg.status !== 'cancelled');
  //   if (exactMatch) return exactMatch;
  //   // ... (simplified for brevity, can add back fuzzy matching if needed)
  //   return null;
  // };
  
  // Handler for coaching item completion
  // const handleCoachingComplete = async (itemId, metadata) => {
  //   await completeItem(itemId, {
  //     ...metadata,
  //     currentWeek: currentWeekNumber,
  //     category: 'coaching'
  //   });
  //   // Also toggle in Daily Plan if possible (need dayId)
  //   // We'll need to find the item to get its dayId
  //   const item = allActions.find(i => i.id === itemId);
  //   if (item && item.dayId) {
  //     toggleDailyItem(item.dayId, itemId, true);
  //   }
  // };
  
  // Handler for INTERACTIVE content items (Leader Profile, Baseline Assessment)
  const handleInteractiveClick = (item) => {
    if (item.handlerType === 'leader-profile') {
      setShowLeaderProfileModal(true);
    } else if (item.handlerType === 'baseline-assessment') {
      setShowBaselineModal(true);
    }
  };
  
  // Handler for Baseline Assessment completion
  const handleBaselineComplete = async (assessment) => {
    setSavingBaseline(true);
    try {
      const newHistory = [...(developmentPlanData?.assessmentHistory || []), assessment];
      await updateDevelopmentPlanData({
        assessmentHistory: newHistory,
        'currentPlan.focusAreas': assessment.focusAreas || []
      });
      setShowBaselineModal(false);
    } catch (error) {
      console.error('Error saving baseline assessment:', error);
    } finally {
      setSavingBaseline(false);
    }
  };

  const handleViewResource = async (e, item) => {
    e.stopPropagation();
    const itemLabel = (item.label || item.title || '').toLowerCase();
    const isPDQ = itemLabel.includes('pdq');
    
    if (item.url && !isPDQ) {
      setViewingResource({
          ...item,
          type: item.resourceType || item.type || 'document',
          url: item.url
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
               resourceData.resourceType = 'read_rep';
               if (data.details) {
                   resourceData.synopsis = data.details.synopsis;
                   resourceData.author = data.details.author;
                   if (data.details.pdfUrl) resourceData.url = data.details.pdfUrl;
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
    if (!itemId) {
      console.error('[ThisWeeksActions] handleToggle called with no itemId', item);
      return;
    }
    
    const progress = getItemProgress(itemId);
    const isCurrentlyComplete = progress.status === 'completed' || completedItems.includes(itemId);
    
    console.log('[ThisWeeksActions] handleToggle:', {
      itemId,
      itemLabel: item.label,
      isCurrentlyComplete,
      progressStatus: progress.status,
      inCompletedItems: completedItems.includes(itemId),
      fromDailyPlan: item.fromDailyPlan,
      dayId: item.dayId,
      isInteractive: item.isInteractive
    });
    
    // 1. Update Daily Plan (Source of Truth for Day-by-Day)
    if (item.fromDailyPlan && item.dayId) {
      console.log('[ThisWeeksActions] Calling toggleDailyItem:', item.dayId, itemId, !isCurrentlyComplete);
      toggleDailyItem(item.dayId, itemId, !isCurrentlyComplete);
    }
    
    // 2. Update Action Progress (Legacy/Global tracking)
    if (isCurrentlyComplete) {
      console.log('[ThisWeeksActions] Calling uncompleteItem:', itemId);
      await uncompleteItem(itemId);
    } else {
      console.log('[ThisWeeksActions] Calling completeItem:', itemId);
      await completeItem(itemId, {
        currentWeek: currentWeekNumber,
        weekNumber: currentWeekNumber,
        category: item.category?.toLowerCase(),
        label: item.label || item.title,
        carriedOver: item.carriedOver || false
      });
    }
  };

  // Action Item Renderer
  const ActionItem = ({ item, isCarriedOver = false }) => {
    const progress = getItemProgress(item.id);
    // Interactive items use autoComplete (derived from hooks), others use progress tracking
    const isCompleted = item.isInteractive 
      ? item.autoComplete 
      : (progress.status === 'completed' || completedItems.includes(item.id));
    const isSkipped = progress.status === 'skipped';
    const Icon = item.isInteractive 
      ? (item.icon === 'User' ? User : ClipboardCheck)
      : getIcon(item.type);
    
    if (isSkipped) return null;

    const getCategoryStyles = () => {
      if (isCompleted) return 'bg-emerald-50 border-emerald-200';
      return 'bg-blue-50 border-blue-100 hover:bg-blue-100 hover:border-blue-200';
    };

    const getCheckboxStyles = () => {
      if (isCompleted) return 'bg-emerald-500 border-emerald-500';
      return 'border-blue-300 group-hover:border-blue-500';
    };

    const getIconColor = () => {
      if (isCompleted) return 'text-emerald-600';
      return 'text-blue-600';
    };
    
    // Determine click handler for the main row
    const handleRowClick = () => {
      if (item.isInteractive) {
        handleInteractiveClick(item);
      }
    };
    
    return (
      <div 
        className={`group flex items-start gap-3 p-3 rounded-xl border transition-all ${getCategoryStyles()} ${item.isInteractive ? 'cursor-pointer' : ''}`}
        onClick={item.isInteractive ? handleRowClick : undefined}
      >
        <div
          onClick={(e) => {
            e.stopPropagation();
            console.log('[ThisWeeksActions] Checkbox clicked:', {
              itemId: item.id,
              itemLabel: item.label,
              isInteractive: item.isInteractive,
              willCallToggle: !item.isInteractive
            });
            if (!item.isInteractive) handleToggle(item);
          }}
          className={`flex-shrink-0 mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer touch-manipulation active:scale-90 ${getCheckboxStyles()}`}
        >
          {isCompleted && <CheckCircle className="w-4 h-4 text-white pointer-events-none" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <p className={`text-sm font-bold ${isCompleted ? 'text-emerald-700 line-through' : 'text-slate-700'}`}>
              {item.label || item.title || 'Untitled Action'}
            </p>
            {item.required !== false && !item.optional && !isCarriedOver && !isCompleted && (
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase tracking-wider">Required</span>
            )}
            {!item.isInteractive && item.optional && !isCarriedOver && (
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-wider">Optional</span>
            )}
            {isCarriedOver && (
              <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" /> Prior Week
              </span>
            )}
          </div>
          
          <div className={`flex items-center gap-2 text-xs ${getIconColor()}`}>
            <Icon className="w-3 h-3" />
            {item.isInteractive ? (
              <span className="text-slate-600">{item.description}</span>
            ) : (
              <>
                <span className="capitalize">{item.type?.replace(/_/g, ' ').toLowerCase() || 'Action'}</span>
                {item.description && (
                  <><span>•</span><span className="text-slate-600">{item.description}</span></>
                )}
                {/* Show Day Number for context in weekly view */}
                {item.dayNumber && (
                   <><span>•</span><span className="text-slate-500">Day {item.dayNumber - 14}</span></>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 -mr-1">
          {item.calendarEvent && (
            <a
              href={generateCalendarUrl(item.calendarEvent)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
            >
              <Calendar className="w-5 h-5" />
            </a>
          )}

          {/* Interactive items get a click button to open modal (always visible for create/edit) */}
          {item.isInteractive && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleInteractiveClick(item);
              }}
              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-corporate-teal hover:bg-teal-50 rounded-xl transition-all"
              title={isCompleted ? 'Edit' : 'Complete'}
            >
              <ExternalLink className="w-5 h-5" />
            </button>
          )}

          {/* Regular content items with resources */}
          {!item.isInteractive && (item.resourceId || item.url) && (
            <button
              onClick={(e) => handleViewResource(e, item)}
              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-corporate-teal hover:bg-teal-50 rounded-xl transition-all"
            >
              {loadingResource === item.id ? <Loader className="w-5 h-5 animate-spin" /> : <ExternalLink className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {viewingResource && (
        <UniversalResourceViewer 
          resource={viewingResource} 
          onClose={() => setViewingResource(null)} 
        />
      )}
      <Card title={widgetTitle} icon={CheckCircle} accent="TEAL">
        {/* Carried Over Items */}
        {carriedOverItems.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2 px-1">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">Prior Week - Incomplete</span>
              </div>
              <div className="flex-1 h-px bg-slate-200"></div>
              <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">{carriedOverItems.length} items</span>
            </div>
            <div className="space-y-1 p-3 bg-slate-50/80 rounded-xl border border-slate-200/60">
              {carriedOverItems.map((item, idx) => (
                <ActionItem key={item.id || `carried-${idx}`} item={item} idx={idx} isCarriedOver={true} />
              ))}
            </div>
          </div>
        )}

        {/* Current Week Items */}
        {allActions.length > 0 && (
          <div className="flex items-center gap-2 mb-2 px-1">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-teal-600" />
              <span className="text-sm font-bold text-teal-800 uppercase tracking-wider">This Week</span>
            </div>
            <div className="flex-1 h-px bg-teal-200"></div>
            <span className="text-xs font-medium text-teal-600 bg-teal-100 px-2 py-0.5 rounded-full">{allActions.length} items</span>
          </div>
        )}

        <div className="space-y-1">
          {allActions.length === 0 && carriedOverItems.length === 0 ? (
            <div className="p-4 text-center text-slate-500 text-sm italic">No actions scheduled for this week.</div>
          ) : allActions.length === 0 ? (
            <div className="p-4 text-center text-slate-500 text-sm italic">No new actions this week. Complete your carried-over items above!</div>
          ) : (
            allActions.map((item, idx) => (
              <ActionItem key={item.id || idx} item={item} idx={idx} />
            ))
          )}
        </div>

        {/* Completion Celebration */}
        {progressPercent === 100 && totalRequiredCount > 0 && (
          <div className="mt-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 text-center">
            <div className="text-2xl mb-1">🎉</div>
            <p className="text-sm font-semibold text-emerald-800">Week {currentWeekNumber} Complete!</p>
            <p className="text-xs text-emerald-600 mt-1">Great work! You've completed all required actions for this week.</p>
          </div>
        )}
      </Card>
      
      {/* Leader Profile Modal */}
      {showLeaderProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg my-8">
            <LeaderProfileFormSimple 
              onComplete={() => setShowLeaderProfileModal(false)}
              onClose={() => setShowLeaderProfileModal(false)}
            />
          </div>
        </div>
      )}
      
      {/* Baseline Assessment Modal */}
      {showBaselineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl">
            <BaselineAssessmentSimple 
              onComplete={handleBaselineComplete}
              onClose={() => setShowBaselineModal(false)}
              isLoading={savingBaseline}
              initialData={developmentPlanData?.assessmentHistory?.[developmentPlanData.assessmentHistory.length - 1]}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default ThisWeeksActionsWidget;