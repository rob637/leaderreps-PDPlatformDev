import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  CheckCircle, Circle, Play, BookOpen, Users, Video, FileText, Zap, 
  ExternalLink, Loader, Layers, MessageSquare, 
  SkipForward, Clock, AlertTriangle,
  User, ClipboardCheck, Calendar, ChevronDown, ChevronUp, Trophy
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

const ThisWeeksActionsWidget = ({ helpText }) => {
  const { db, developmentPlanData, updateDevelopmentPlanData } = useAppServices();
  const [viewingResource, setViewingResource] = useState(null);
  const [loadingResource, setLoadingResource] = useState(false);
  // const [showSkipConfirm, setShowSkipConfirm] = useState(null);
  
  // Interactive content modals
  const [showLeaderProfileModal, setShowLeaderProfileModal] = useState(false);
  const [showBaselineModal, setShowBaselineModal] = useState(false);
  const [savingBaseline, setSavingBaseline] = useState(false);
  
  // Prep Complete expanded state (default collapsed when all done)
  const [prepExpanded, setPrepExpanded] = useState(false);
  
  // This Week and Prior Week expanded states (default collapsed when all done)
  const [thisWeekExpanded, setThisWeekExpanded] = useState(false);
  const [priorWeekExpanded, setPriorWeekExpanded] = useState(false);
  
  // Preserve carried over items even after completion (ref to avoid re-render loops)
  const preservedCarriedOverRef = useRef([]);
  const [preservedCarriedOver, setPreservedCarriedOver] = useState([]);

  // Use Daily Plan Hook (New Architecture)
  const { 
    dailyPlan, 
    currentPhase, 
    phaseDayNumber, 
    currentDayData, 
    toggleItemComplete: toggleDailyItem,
    userState,
    journeyDay,
    prepRequirementsComplete
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
        // Actions from explore-config are always optional
        // Otherwise check the flags: required if not explicitly optional
        required: dayId === 'explore-config' ? false : (action.required !== false && !action.optional),
        optional: dayId === 'explore-config' ? true : (action.optional === true),
        resourceId: action.resourceId,
        resourceType: (action.resourceType || action.type || 'content').toLowerCase(),
        resourceTitle: action.resourceTitle,
        url: action.url || action.videoUrl || action.link || action.details?.externalUrl || action.metadata?.externalUrl,
        category,
        // Mark as coming from daily plan for UI distinction
        fromDailyPlan: true,
        dayId: dayId,
        dayNumber: dayNumber,
        // Pass through estimated time
        estimatedMinutes: action.estimatedMinutes
      };
    });
  };

  // Combine all actionable items from Daily Plan
  const allActions = useMemo(() => {
    if (!dailyPlan || dailyPlan.length === 0) return [];

    // Pre-Start phase = COMPLETION-BASED (not day-based or time-based)
    // Two sections: Required Prep and Explore (optional)
    if (currentPhase?.id === 'pre-start') {
      // Interactive content items (Leader Profile & Baseline Assessment)
      // These are part of the required items
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
      
      // Get prep phase actions from daily plan (progress-based, not day-based)
      // EXCLUDE explore-config - those are handled separately
      const prepDays = dailyPlan.filter(d => d.phase === 'pre-start' && d.id !== 'explore-config');
      
      let allPrepActions = [];
      prepDays.forEach(day => {
        if (day.actions) {
          allPrepActions.push(...normalizeDailyActions(day.actions, day.id, day.dayNumber));
        }
      });
      
      // Filter out items handled by interactive components
      const onboardingLabels = ['leader profile', 'baseline assessment'];
      const filteredPrepActions = allPrepActions.filter(action => {
        const labelLower = (action.label || '').toLowerCase();
        const handlerType = action.handlerType || '';
        if (onboardingLabels.some(keyword => labelLower.includes(keyword))) return false;
        if (handlerType === 'leader-profile' || handlerType === 'baseline-assessment') return false;
        if (action.type === 'daily_rep') return false;
        return true;
      });
      
      // Required prep actions - from prep days (NOT explore-config)
      // Required = required === true OR (required !== false AND optional !== true)
      const requiredPrepActions = filteredPrepActions.filter(action => {
        return action.required === true || (action.required !== false && action.optional !== true);
      });
      
      // Explore actions come ONLY from the explore-config document
      // This is what the admin configures in Daily Plan Manager > Explore section
      const exploreConfig = dailyPlan.find(d => d.id === 'explore-config');
      const explorePrepActions = exploreConfig?.actions 
        ? normalizeDailyActions(exploreConfig.actions, 'explore-config', 0)
        : [];
      
      // COMPLETION-BASED GATING:
      // If required prep is NOT complete, only show required items
      if (!prepRequirementsComplete?.allComplete) {
        return [...interactiveItems, ...requiredPrepActions];
      }
      
      // Required prep is complete - show ALL prep items (including Explore)
      return [...interactiveItems, ...requiredPrepActions, ...explorePrepActions];
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

  // Get carried over items (including incomplete prep phase items)
  const carriedOverItems = useMemo(() => {
    // No carryover in Prep Phase
    if (currentPhase?.id === 'pre-start') return [];
    
    const carriedItems = [];
    
    // Get explicitly carried over items from actionProgress
    const explicitCarryOver = getCarriedOverItems(currentWeekNumber);
    carriedItems.push(...explicitCarryOver);
    
    // Check for incomplete prep phase items (interactive items)
    // These should carry over to Start phase if not completed
    if (currentPhase?.id === 'start') {
      // Leader Profile - if not complete, carry over
      if (!leaderProfileComplete) {
        carriedItems.push({
          id: 'interactive-leader-profile',
          type: 'INTERACTIVE',
          handlerType: 'leader-profile',
          label: 'Complete Your Leader Profile',
          required: true,
          category: 'Onboarding',
          fromDailyPlan: false,
          isInteractive: true,
          autoComplete: false,
          icon: 'User',
          description: 'Tell us about yourself to personalize your journey',
          estimatedMinutes: 3,
          carriedOver: true
        });
      }
      
      // Baseline Assessment - if not complete, carry over
      if (!baselineAssessmentComplete) {
        carriedItems.push({
          id: 'interactive-baseline-assessment',
          type: 'INTERACTIVE',
          handlerType: 'baseline-assessment',
          label: 'Take Baseline Assessment',
          required: true,
          category: 'Onboarding',
          fromDailyPlan: false,
          isInteractive: true,
          autoComplete: false,
          icon: 'ClipboardCheck',
          description: 'Assess your current leadership skills',
          estimatedMinutes: 5,
          carriedOver: true
        });
      }
      
      // Also check for incomplete prep phase daily plan items
      const prepDays = dailyPlan.filter(d => d.phase === 'pre-start');
      const dailyProgress = userState?.dailyProgress || {};
      
      prepDays.forEach(day => {
        if (day.actions && Array.isArray(day.actions)) {
          day.actions.forEach((action, idx) => {
            // Skip if not required
            if (action.optional || action.required === false) return;
            
            // Check if completed in dailyProgress
            const actionId = action.id || `daily-${day.id}-${(action.label || '').toLowerCase().replace(/\s+/g, '-').substring(0, 20)}-${idx}`;
            const isCompleted = Object.values(dailyProgress).some(
              dp => dp?.itemsCompleted?.includes(actionId)
            );
            
            if (!isCompleted) {
              // Filter out items that are in the interactive list or daily reps
              const labelLower = (action.label || '').toLowerCase();
              if (labelLower.includes('leader profile') || labelLower.includes('baseline assessment')) return;
              if (action.type === 'daily_rep') return;
              
              carriedItems.push({
                ...action,
                id: actionId,
                label: action.label || 'Preparation Action',
                required: true,
                category: 'Preparation',
                fromDailyPlan: true,
                dayId: day.id,
                dayNumber: day.dayNumber,
                carriedOver: true,
                resourceId: action.resourceId,
                resourceType: (action.resourceType || action.type || 'content').toLowerCase(),
                url: action.url || action.videoUrl || action.link || action.details?.externalUrl
              });
            }
          });
        }
      });
    }
    
    return carriedItems;
  }, [currentPhase?.id, currentWeekNumber, getCarriedOverItems, leaderProfileComplete, baselineAssessmentComplete, dailyPlan, userState?.dailyProgress]);

  // Preserve carried over items - merge new items but keep completed ones
  useEffect(() => {
    if (carriedOverItems.length > 0) {
      // Add any new items to the preserved list
      const existingIds = new Set(preservedCarriedOverRef.current.map(i => i.id));
      const newItems = carriedOverItems.filter(item => !existingIds.has(item.id));
      if (newItems.length > 0) {
        preservedCarriedOverRef.current = [...preservedCarriedOverRef.current, ...newItems];
        setPreservedCarriedOver([...preservedCarriedOverRef.current]);
      }
    }
  }, [carriedOverItems]);
  
  // Use preserved items if available, otherwise use current carriedOverItems
  const displayedCarriedOverItems = preservedCarriedOver.length > 0 ? preservedCarriedOver : carriedOverItems;

  // Calculate progress
  const completedItems = useMemo(() => {
    // Get completed items from userState.dailyProgress for the relevant days
    // But simpler to just check item status via getItemProgress or userState
    // userState.dailyProgress is keyed by dayId
    
    // Let's use a Set of completed item IDs for fast lookup
    const completedSet = new Set();
    
    const dailyProgress = userState?.dailyProgress || {};
    
    Object.values(dailyProgress).forEach(dayProgress => {
      if (dayProgress && dayProgress.itemsCompleted) {
        dayProgress.itemsCompleted.forEach(id => completedSet.add(id));
      }
    });
    
    const result = Array.from(completedSet);
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
    ? "Prep Actions" 
    : "This Week's Actions";

  // Separate actions into Required Prep and Additional Prep for prep phase
  // Uses the `required` and `optional` flags from the daily plan data
  const requiredPrepActions = useMemo(() => {
    if (currentPhase?.id !== 'pre-start') return [];
    // Required items are those with: required === true OR (required !== false AND optional !== true)
    // Also include interactive items (Leader Profile & Baseline Assessment)
    return allActions.filter(action => {
      // Interactive items are always considered required
      if (action.isInteractive) return true;
      
      // Check the required/optional flags from the daily plan data
      const isRequired = action.required === true || (action.required !== false && action.optional !== true);
      return isRequired;
    });
  }, [currentPhase?.id, allActions]);
  
  const additionalPrepActions = useMemo(() => {
    if (currentPhase?.id !== 'pre-start') return [];
    // Explore items come ONLY from the explore-config document
    // This is what the admin configures in Daily Plan Manager > Explore section
    const exploreConfig = dailyPlan?.find(d => d.id === 'explore-config');
    if (!exploreConfig?.actions || exploreConfig.actions.length === 0) return [];
    
    return exploreConfig.actions.map((action, idx) => {
      const label = action.label || 'Explore Action';
      return {
        ...action,
        id: action.id || `explore-${idx}`,
        type: action.type || action.resourceType || 'content',
        displayType: action.resourceType || action.type || 'content',
        label: label,
        required: false,
        optional: true,
        resourceId: action.resourceId,
        resourceType: (action.resourceType || action.type || 'content').toLowerCase(),
        resourceTitle: action.resourceTitle,
        url: action.url || action.videoUrl || action.link,
        category: 'Explore',
        fromDailyPlan: true,
        dayId: 'explore-config',
        dayNumber: 0,
        estimatedMinutes: action.estimatedMinutes
      };
    });
  }, [currentPhase?.id, dailyPlan]);

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
    
    const resourceId = item.resourceId || item.id;

    // Always fetch from Firestore for consistent, reliable resource data
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
           } else if (data.type === 'DOCUMENT' || data.type === 'TOOL') {
               // Handle documents - get URL from details or top-level
               resourceData.url = data.url || data.details?.url || data.details?.pdfUrl || data.metadata?.url;
               resourceData.resourceType = 'document';
           }
           setViewingResource(resourceData);
        } else {
            // Fallback: If not in Firestore, use the URL from the item directly
            if (item.url) {
              setViewingResource({
                ...item,
                type: item.resourceType || item.type || 'document',
                url: item.url
              });
            } else {
              alert("Resource not found.");
            }
        }
      } catch (error) {
        console.error("Error fetching resource:", error);
        alert("Failed to load resource.");
      } finally {
        setLoadingResource(false);
      }
    } else if (item.url) {
      // No resourceId but has URL - use direct URL as last resort
      setViewingResource({
        ...item,
        type: item.resourceType || item.type || 'document',
        url: item.url
      });
    } else {
      alert("No resource available.");
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
    
    // 1. Update Daily Plan (Source of Truth for Day-by-Day)
    if (item.fromDailyPlan) {
      if (isCurrentlyComplete) {
        // When UNCOMPLETING, find the day where this item was completed
        // It may have been completed on a different day than the current display day
        const dailyProgress = userState?.dailyProgress || {};
        let completedOnDayId = null;
        
        for (const [dayId, dayProgress] of Object.entries(dailyProgress)) {
          if (dayProgress?.itemsCompleted?.includes(itemId)) {
            completedOnDayId = dayId;
            break;
          }
        }
        
        if (completedOnDayId) {
          toggleDailyItem(completedOnDayId, itemId, false);
        } else {
          if (item.dayId) {
            toggleDailyItem(item.dayId, itemId, false);
          }
        }
      } else if (item.dayId) {
        // When COMPLETING, use the item's assigned day
        toggleDailyItem(item.dayId, itemId, true);
      }
    }
    
    // 2. Update Action Progress (Legacy/Global tracking)
    if (isCurrentlyComplete) {
      await uncompleteItem(itemId);
    } else {
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
    
    // Determine if this item is clickable (either interactive or has a resource)
    const isClickable = item.isInteractive || item.resourceId || item.url;
    
    // Determine click handler for the main row
    const handleRowClick = (e) => {
      if (item.isInteractive) {
        handleInteractiveClick(item);
      } else if (item.resourceId || item.url) {
        // Open the resource viewer for content items
        handleViewResource(e, item);
      }
    };
    
    return (
      <div 
        className={`group flex items-start gap-3 p-3 rounded-xl border transition-all ${getCategoryStyles()} ${isClickable ? 'cursor-pointer' : ''}`}
        onClick={isClickable ? handleRowClick : undefined}
      >
        <div
          onClick={(e) => {
            e.stopPropagation();
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
              <>
                <span className="text-slate-600">{item.description}</span>
                {item.estimatedMinutes && (
                  <><span>•</span><span className="text-slate-500">{item.estimatedMinutes} min</span></>
                )}
              </>
            ) : (
              <>
                <span className="capitalize">{(item.resourceType || item.displayType || item.type)?.replace(/_/g, ' ').toLowerCase() || 'Action'}</span>
                {item.resourceTitle && (
                  <><span>•</span><span className="text-slate-600 font-medium">{item.resourceTitle}</span></>
                )}
                {item.description && !item.resourceTitle && (
                  <><span>•</span><span className="text-slate-600">{item.description}</span></>
                )}
                {/* Show estimated time to complete */}
                {item.estimatedMinutes && (
                   <><span>•</span><span className="text-slate-500">{item.estimatedMinutes} min</span></>
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
      <Card title={widgetTitle} icon={CheckCircle} accent="TEAL" helpText={helpText}>
        
        {/* ========== PREPARATION PHASE: Progress-Based Sections ========== */}
        {currentPhase?.id === 'pre-start' && (
          <>
            {/* SECTION 1: Preparation */}
            {!prepRequirementsComplete?.allComplete ? (
              // Preparation NOT Complete - Show as primary section
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-bold text-amber-800 uppercase tracking-wider">Preparation</span>
                  </div>
                  <div className="flex-1 h-px bg-amber-200"></div>
                  <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                    {prepRequirementsComplete?.completedCount || 0}/{prepRequirementsComplete?.totalCount || requiredPrepActions.length} complete
                  </span>
                </div>
                <p className="text-xs text-slate-600 mb-3 px-1">
                  Complete these {prepRequirementsComplete?.totalCount || requiredPrepActions.length} items to get ready for Session One and access additional arena functionality.
                </p>
                <div className="space-y-1 p-3 bg-amber-50/50 rounded-xl border border-amber-200/60">
                  {requiredPrepActions.map((item, idx) => (
                    <ActionItem key={item.id || idx} item={item} idx={idx} />
                  ))}
                </div>
              </div>
            ) : (
              // Preparation IS Complete - Show collapsed celebration
              <div className="mb-4">
                <button
                  onClick={() => setPrepExpanded(!prepExpanded)}
                  className="w-full group flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 hover:from-emerald-100 hover:to-teal-100 transition-all"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-bold text-emerald-800">🎉 Preparation Complete!</p>
                    <p className="text-xs text-emerald-600">
                      All 5 tasks done — Your leadership tools are now unlocked below!
                    </p>
                  </div>
                  <div className="flex-shrink-0 p-2 text-emerald-600 group-hover:text-emerald-800 transition-colors">
                    {prepExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </button>
                
                {prepExpanded && (
                  <div className="mt-2 p-3 bg-white/80 rounded-xl border border-slate-200/60 space-y-2">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Completed Items</p>
                    {prepRequirementsComplete.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span className="text-emerald-700">{item.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Explore items (when prep complete) - shown inline with actions */}
            {prepRequirementsComplete?.allComplete && additionalPrepActions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-slate-600 px-1">
                  Explore these tools at your own pace before Session 1:
                </p>
                <div className="space-y-1">
                  {additionalPrepActions.map((item, idx) => (
                    <ActionItem key={item.id || idx} item={item} idx={idx} />
                  ))}
                </div>
                
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
                  <p className="text-xs text-slate-600">
                    🚀 <span className="font-semibold">You're all set!</span> Session 1 will build on everything you've learned.
                  </p>
                </div>
              </div>
            )}
            
            {/* Just the success message if no explore items */}
            {prepRequirementsComplete?.allComplete && additionalPrepActions.length === 0 && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
                <p className="text-xs text-slate-600">
                  🚀 <span className="font-semibold">You're all set!</span> Session 1 will build on everything you've learned.
                </p>
              </div>
            )}
          </>
        )}
        
        {/* ========== START/POST PHASE: Week-Based Actions ========== */}
        {currentPhase?.id !== 'pre-start' && (
          <>
            {/* Carried Over Items - Show even when all complete */}
            {displayedCarriedOverItems.length > 0 && (() => {
              const completedCarriedOver = displayedCarriedOverItems.filter(item => {
                const progress = getItemProgress(item.id);
                return progress.status === 'completed' || completedItems.includes(item.id);
              });
              const allCarriedOverComplete = completedCarriedOver.length === displayedCarriedOverItems.length;
              
              return allCarriedOverComplete ? (
                // All Prior Week items complete - Show collapsed celebration
                <div className="mb-4">
                  <button
                    onClick={() => setPriorWeekExpanded(!priorWeekExpanded)}
                    className="w-full group flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 hover:from-emerald-100 hover:to-teal-100 transition-all"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-bold text-emerald-800">✅ Prior Week Complete!</p>
                      <p className="text-xs text-emerald-600">
                        All {displayedCarriedOverItems.length} carried-over {displayedCarriedOverItems.length === 1 ? 'task' : 'tasks'} finished
                      </p>
                    </div>
                    <div className="flex-shrink-0 p-2 text-emerald-600 group-hover:text-emerald-800 transition-colors">
                      {priorWeekExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </button>
                  
                  {priorWeekExpanded && (
                    <div className="mt-2 space-y-1">
                      {displayedCarriedOverItems.map((item, idx) => (
                        <ActionItem key={item.id || `carried-${idx}`} item={item} idx={idx} isCarriedOver={true} />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                // Prior Week items still incomplete - Show active section
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span className="text-sm font-bold text-amber-800 uppercase tracking-wider">Prior Week - Incomplete</span>
                    </div>
                    <div className="flex-1 h-px bg-amber-200"></div>
                    <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                      {completedCarriedOver.length}/{displayedCarriedOverItems.length} complete
                    </span>
                  </div>
                  <div className="space-y-1 p-3 bg-amber-50/50 rounded-xl border border-amber-200/60">
                    {displayedCarriedOverItems.map((item, idx) => (
                      <ActionItem key={item.id || `carried-${idx}`} item={item} idx={idx} isCarriedOver={true} />
                    ))}
                  </div>
                </div>
              );
            })()}}

            {/* Current Week Items */}
            {allActions.length > 0 && (() => {
              const completedThisWeek = allActions.filter(item => {
                const progress = getItemProgress(item.id);
                return progress.status === 'completed' || completedItems.includes(item.id);
              });
              const allThisWeekComplete = completedThisWeek.length === allActions.length;
              
              return allThisWeekComplete ? (
                // All This Week items complete - Show collapsed celebration
                <div className="mb-4">
                  <button
                    onClick={() => setThisWeekExpanded(!thisWeekExpanded)}
                    className="w-full group flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 hover:from-emerald-100 hover:to-teal-100 transition-all"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-bold text-emerald-800">🎉 This Week Complete!</p>
                      <p className="text-xs text-emerald-600">
                        All {allActions.length} {allActions.length === 1 ? 'task' : 'tasks'} finished — Great work!
                      </p>
                    </div>
                    <div className="flex-shrink-0 p-2 text-emerald-600 group-hover:text-emerald-800 transition-colors">
                      {thisWeekExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </button>
                  
                  {thisWeekExpanded && (
                    <div className="mt-2 space-y-1">
                      {allActions.map((item, idx) => (
                        <ActionItem key={item.id || idx} item={item} idx={idx} />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                // This Week items still in progress
                <>
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-teal-600" />
                      <span className="text-sm font-bold text-teal-800 uppercase tracking-wider">This Week</span>
                    </div>
                    <div className="flex-1 h-px bg-teal-200"></div>
                    <span className="text-xs font-medium text-teal-600 bg-teal-100 px-2 py-0.5 rounded-full">
                      {completedThisWeek.length}/{allActions.length} complete
                    </span>
                  </div>
                  <div className="space-y-1">
                    {allActions.map((item, idx) => (
                      <ActionItem key={item.id || idx} item={item} idx={idx} />
                    ))}
                  </div>
                </>
              );
            })()}

            {/* Empty state */}
            {allActions.length === 0 && displayedCarriedOverItems.length === 0 && (
              <div className="p-4 text-center text-slate-500 text-sm italic">No actions scheduled for this week.</div>
            )}

          </>
        )}
      </Card>
      
      {/* Leader Profile Modal */}
      {showLeaderProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-md">
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