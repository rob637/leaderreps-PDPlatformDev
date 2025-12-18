import React, { useState, useMemo } from 'react';
import { 
  CheckCircle, Circle, Play, BookOpen, Users, Video, FileText, Zap, 
  ExternalLink, Loader, Layers, MessageSquare, 
  SkipForward, Clock, AlertTriangle,
  User, ClipboardCheck, Calendar
} from 'lucide-react';
import { Card } from '../ui';
import { useDevPlan } from '../../hooks/useDevPlan';
import { useActionProgress } from '../../hooks/useActionProgress';
import { useCoachingRegistrations } from '../../hooks/useCoachingRegistrations';
import { useLeaderProfile } from '../../hooks/useLeaderProfile';
import UniversalResourceViewer from '../ui/UniversalResourceViewer';
import CoachingActionItem from '../coaching/CoachingActionItem';
import { doc, getDoc } from 'firebase/firestore';
import { useAppServices } from '../../services/useAppServices';
import { CONTENT_COLLECTIONS } from '../../services/contentService';

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

const ThisWeeksActionsWidget = ({ scope }) => {
  const { db } = useAppServices();
  const [viewingResource, setViewingResource] = useState(null);
  const [loadingResource, setLoadingResource] = useState(false);
  const [showSkipConfirm, setShowSkipConfirm] = useState(null);

  // If scope is provided (e.g. from Widget Lab preview), use it.
  // Otherwise, use the real hook.
  const devPlanHook = useDevPlan();
  const actionProgress = useActionProgress();
  const coachingRegistrations = useCoachingRegistrations();
  
  // Leader Profile completion tracking (for auto-check in Pre-Start)
  const { isComplete: leaderProfileComplete } = useLeaderProfile();
  
  // Baseline Assessment completion tracking (from useDevPlan userState)
  const baselineAssessmentComplete = useMemo(() => {
    const assessmentHistory = devPlanHook.userState?.assessmentHistory;
    return assessmentHistory && assessmentHistory.length > 0;
  }, [devPlanHook.userState?.assessmentHistory]);
  
  // Determine which data source to use
  const currentWeek = scope?.currentWeek || devPlanHook.currentWeek;
  const masterPlan = devPlanHook.masterPlan || [];
  const dailyPlan = devPlanHook.dailyPlan || [];
  const toggleItemComplete = scope?.toggleItemComplete || devPlanHook.toggleItemComplete;
  
  // Day-by-Day Architecture Integration
  // Get daily actions from current day's data
  const currentDayData = devPlanHook.currentDayData;
  const dailyActions = currentDayData?.actions || [];
  const currentPhase = devPlanHook.currentPhase;
  
  // Progress tracking
  const { 
    completeItem, 
    uncompleteItem, 
    skipItem, 
    getItemProgress,
    getCarriedOverItems
  } = actionProgress;
  
  // Coaching registrations
  const {
    registrations: userRegistrations
  } = coachingRegistrations;

  // Extract data from currentWeek (with fallbacks for when currentWeek is null)
  const content = useMemo(() => currentWeek?.content || [], [currentWeek]);
  const community = useMemo(() => currentWeek?.community || [], [currentWeek]);
  const coaching = useMemo(() => currentWeek?.coaching || [], [currentWeek]);
  const userProgress = currentWeek?.userProgress;
  const completedItems = useMemo(() => userProgress?.itemsCompleted || [], [userProgress]);

  // Normalize content items - DevPlanManager saves with different field names
  const normalizeItems = (items, category) => {
    return (items || []).map((item, idx) => {
      // Generate a stable fallback ID from label/title if no ID exists
      const label = item.label || item.contentItemLabel || item.communityItemLabel || item.coachingItemLabel || item.title || '';
      const fallbackId = label ? `${category.toLowerCase()}-${label.toLowerCase().replace(/\s+/g, '-').substring(0, 30)}` : `${category.toLowerCase()}-item-${idx}`;
      
      return {
        ...item,
        id: item.id || item.contentItemId || item.communityItemId || item.coachingItemId || fallbackId,
        type: item.type || item.contentItemType || item.communityItemType || item.coachingItemType || category.toLowerCase(),
        label: label || item.name || 'Untitled Action',
        required: item.required !== false && item.isRequiredContent !== false && item.optional !== true,
        url: item.url || item.videoUrl || item.link || item.details?.externalUrl || item.metadata?.externalUrl,
        resourceId: item.resourceId || item.contentItemId || item.communityItemId || item.coachingItemId,
        resourceType: item.resourceType || (item.type || item.contentItemType || item.communityItemType || item.coachingItemType || '').toLowerCase(),
        category
      };
    });
  };

  // Normalize daily plan actions (from DailyPlanManager / daily_plan_v1)
  const normalizeDailyActions = (actions, dayId) => {
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
        dayId: dayId
      };
    });
  };

  // Combine all actionable items
  // During Pre-Start phase: ONLY show daily actions (day-by-day architecture)
  // During Start/Post phase: Show both daily actions AND weekly content
  const allActions = useMemo(() => {
    const dailyNormalized = normalizeDailyActions(dailyActions, currentDayData?.id);
    
    // Pre-Start phase = Day-by-Day only (no legacy week content)
    if (currentPhase?.id === 'pre-start') {
      // Filter out Leader Profile and Baseline Assessment from daily actions
      // These are handled by the auto-tracking onboarding tasks and shouldn't duplicate
      const onboardingLabels = ['leader profile', 'baseline assessment'];
      const filteredDailyActions = dailyNormalized.filter(action => {
        const labelLower = (action.label || '').toLowerCase();
        
        // Filter out onboarding items
        if (onboardingLabels.some(keyword => labelLower.includes(keyword))) return false;
        
        // Filter out Daily Reps (they go to Daily Reps widget)
        if (action.type === 'daily_rep') return false;
        
        return true;
      });
      
      // Only show onboarding tasks on Day 1 of journey
      // After Day 1, users should have completed these or can access via other means
      const journeyDay = currentDayData?.journeyDay || 1;
      
      if (journeyDay === 1) {
        // Day 1: Add Leader Profile and Baseline Assessment as onboarding tasks
        // These auto-complete based on actual completion state
        const onboardingTasks = [
          {
            id: 'onboarding-leader-profile',
            type: 'onboarding',
            label: 'Complete Your Leader Profile',
            required: true,
            category: 'Onboarding',
            fromDailyPlan: false,
            isOnboardingTask: true,
            autoComplete: leaderProfileComplete,
            icon: 'User',
            description: 'Tell us about yourself to personalize your journey'
          },
          {
            id: 'onboarding-baseline-assessment',
            type: 'onboarding',
            label: 'Take Baseline Assessment',
            required: true,
            category: 'Onboarding',
            fromDailyPlan: false,
            isOnboardingTask: true,
            autoComplete: baselineAssessmentComplete,
            icon: 'ClipboardCheck',
            description: 'Assess your current leadership skills'
          }
        ];
        
        const combined = [...onboardingTasks, ...filteredDailyActions];
        console.log('[ThisWeeksActions] Pre-Start Day 1 - showing onboarding + daily actions:', combined.length);
        return combined;
      }
      
      // Days 2+: Only show daily actions (filtered, no onboarding duplicates)
      console.log('[ThisWeeksActions] Pre-Start Day', journeyDay, '- showing daily actions only:', filteredDailyActions.length);
      return filteredDailyActions;
    }
    
    // Start/Post phase = Combine daily + weekly
    // Filter out daily_rep items - they are shown in the Daily Reps widget
    const filteredDailyActions = dailyNormalized.filter(action => {
      // Filter out Daily Reps (they go to Daily Reps widget)
      if (action.type === 'daily_rep') return false;
      return true;
    });
    
    const normalized = [
      // Daily actions first (today's priorities)
      ...filteredDailyActions,
      // Then weekly content
      ...normalizeItems(content, 'Content'),
      ...normalizeItems(community, 'Community'),
      ...normalizeItems(coaching, 'Coaching')
    ];
    
    // Debug log to verify daily actions are being included
    if (dailyActions.length > 0) {
      console.log('[ThisWeeksActions] Daily actions from currentDayData:', dailyActions);
      console.log('[ThisWeeksActions] Normalized daily actions:', normalized.filter(a => a.fromDailyPlan));
    }
    
    return normalized;
  }, [dailyActions, currentDayData?.id, currentDayData?.journeyDay, content, community, coaching, currentPhase?.id, leaderProfileComplete, baselineAssessmentComplete]);

  // Get carried over items for this week (MUST be before any early returns)
  // This combines:
  // 1. Items explicitly marked as carried over in progress data
  // 2. Incomplete items from the previous week that haven't been tracked yet
  const carriedOverItems = useMemo(() => {
    if (!currentWeek?.weekNumber) return [];
    
    const currentWeekNum = currentWeek.weekNumber;

    // RULE 1: No carry-over display WITHIN the Prep Phase
    // Prep Phase is a single container (Weeks <= 0). 
    // Items shouldn't "carry over" from Day 1 to Day 2, etc.
    if (currentWeekNum <= 0) {
        return [];
    }

    // Get explicitly carried over items
    const explicitCarryOver = getCarriedOverItems(currentWeek.weekNumber);
    
    // Determine which previous weeks to check
    // Usually just the immediate previous week
    const weeksToCheck = [currentWeekNum - 1];
    
    // RULE 2: Transition from Prep Phase to Dev Plan (Week 1)
    // If we are in Week 1, we must check ALL Prep Phase weeks (0, -1, -2, etc.)
    // to ensure any required items missed during Prep are carried over.
    if (currentWeekNum === 1) {
        weeksToCheck.push(0, -1, -2, -3, -4); // Check deep into Prep history
    }
    
    let prevWeekItems = [];

    // Iterate through all weeks to check
    weeksToCheck.forEach(checkWeekNum => {
        // STRATEGY 1: Check Daily Plan (New Architecture)
        if (dailyPlan && dailyPlan.length > 0) {
          const prevWeekDays = dailyPlan.filter(d => d.weekNumber === checkWeekNum);
          
          prevWeekDays.forEach(day => {
            if (day.actions) {
              const normalized = normalizeDailyActions(day.actions, day.id);
              // Filter out Daily Reps and ensure Required
              // Note: 'weekly_action' type usually implies required in the new plan
              const validActions = normalized.filter(a => 
                a.type !== 'daily_rep' && 
                a.required
              );
              prevWeekItems.push(...validActions);
            }
          });
        } 
        
        // STRATEGY 2: Fallback to Master Plan (Legacy Architecture)
        // Only if we didn't find anything in Daily Plan OR if we want to support hybrid
        // Note: We only check Master Plan if we haven't found items for THIS specific week check yet
        // (This is a simplification, but prevents duplicates if both exist)
        if (masterPlan.length > 0) {
          // Find previous week in masterPlan
          const prevWeek = masterPlan.find(w => w.weekNumber === checkWeekNum);
          if (prevWeek) {
            const legacyItems = [
              ...normalizeItems(prevWeek.content || prevWeek.contentItems || [], 'Content'),
              ...normalizeItems(prevWeek.community || prevWeek.communityItems || [], 'Community'),
              ...normalizeItems(prevWeek.coaching || prevWeek.coachingItems || [], 'Coaching')
            ];
            // Only keep REQUIRED items from legacy plan
            const requiredLegacyItems = legacyItems.filter(item => item.required);
            prevWeekItems.push(...requiredLegacyItems);
          }
        }
    });
    
    // Filter to incomplete items that aren't already in explicitCarryOver
    const explicitIds = new Set(explicitCarryOver.map(i => i.id));
    
    const incompleteFromPrevWeek = prevWeekItems.filter(item => {
      // Skip if already in explicit carry over
      if (explicitIds.has(item.id)) return false;
      
      // Skip Onboarding items (they are handled specially on Day 1)
      if (item.type === 'onboarding' || item.id.startsWith('onboarding-')) return false;
      
      // INTELLIGENT COMPLETION CHECK
      // Check global state for specific onboarding concepts regardless of item ID
      // This handles the case where legacy items (with different IDs) represent the same concept as the new Onboarding tasks
      const labelLower = (item.label || item.title || '').toLowerCase();
      
      if (labelLower.includes('complete leader profile') && leaderProfileComplete) {
        return false; 
      }
      
      if (labelLower.includes('complete baseline assessment') && baselineAssessmentComplete) {
        return false;
      }
      
      // Check progress
      const progress = getItemProgress(item.id);
      
      // Skip if completed or skipped
      if (progress.status === 'completed' || progress.status === 'skipped' || progress.status === 'archived') {
        return false;
      }
      
      // Skip if it was completed in the legacy system
      // Check against the week the item actually belongs to (we don't have item.weekNumber easily here, 
      // but we can check the main previous week as a heuristic, or just rely on item progress)
      const prevWeekProgress = devPlanHook.userState?.weekProgress?.[`week-${String(currentWeekNum - 1).padStart(2, '0')}`];
      if (prevWeekProgress?.itemsCompleted?.includes(item.id)) {
        return false;
      }
      
      return true;
    }).map(item => ({
      ...item,
      carriedOver: true,
      originalWeek: currentWeekNum - 1, // Just mark as previous week for display simplicity
      carryCount: 1
    }));
    
    // Deduplicate items by ID (in case same item found in multiple checks)
    const uniqueIncomplete = Array.from(new Map(incompleteFromPrevWeek.map(item => [item.id, item])).values());
    
    // Combine both sources
    return [...explicitCarryOver, ...uniqueIncomplete];
  }, [currentWeek?.weekNumber, getCarriedOverItems, masterPlan, dailyPlan, getItemProgress, devPlanHook.userState?.weekProgress, leaderProfileComplete, baselineAssessmentComplete]);

  // Calculate progress (MUST be before any early returns)
  const completedCount = useMemo(() => {
    return allActions.filter(item => {
      const progress = getItemProgress(item.id);
      return progress.status === 'completed' || completedItems.includes(item.id);
    }).length;
  }, [allActions, getItemProgress, completedItems]);

  const totalCount = allActions.length + carriedOverItems.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Dynamic title based on phase
  // Pre-Start phase = "Actions" (day-focused)
  // Start phase = "This Week's Actions" (week-focused)
  const widgetTitle = currentPhase?.id === 'pre-start' 
    ? "Actions" 
    : "This Week's Actions";

  // If no current week data AND no daily actions, show empty state (AFTER all hooks)
  if (!currentWeek && dailyActions.length === 0) {
    return (
      <Card title={widgetTitle} icon={CheckCircle} accent="TEAL">
        <div className="p-4 text-center text-slate-500 text-sm">
          No active plan found.
        </div>
      </Card>
    );
  }

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
      // Legacy / New Types
      case 'VIDEO': return Video;
      case 'READING': return BookOpen;
      case 'DOCUMENT': return FileText;
      case 'COURSE': return Layers;
      case 'COMMUNITY': return Users;
      case 'COACHING': return MessageSquare;
      default: return Circle;
    }
  };

  // Helper to check if an item is a coaching item
  const isCoachingItem = (item) => {
    const category = (item.category || '').toLowerCase();
    const type = (item.type || item.coachingItemType || '').toLowerCase();
    
    // Check category
    if (category === 'coaching') return true;
    
    // Check type for coaching-related keywords
    const coachingTypes = ['open_gym', 'opengym', 'leader_circle', 'leadercircle', 'workshop', 'live_workout', 'one_on_one', 'coaching'];
    return coachingTypes.some(ct => type.includes(ct));
  };
  
  // Helper to find user's registration for a coaching item
  const findRegistrationForItem = (item) => {
    if (!userRegistrations || userRegistrations.length === 0) return null;
    
    // 1. Try exact match by coachingItemId (if saved during registration)
    const exactMatch = userRegistrations.find(reg => 
      reg.coachingItemId === item.id && 
      reg.status !== 'cancelled'
    );
    if (exactMatch) return exactMatch;

    // 2. Try to match by skill focus
    const skillFocus = item.skillFocus || item.skill || [];
    const skillArray = Array.isArray(skillFocus) ? skillFocus : [skillFocus].filter(Boolean);
    
    if (skillArray.length > 0) {
      const skillMatch = userRegistrations.find(reg => {
        const regSkills = reg.skillFocus || [];
        return regSkills.some(s => skillArray.includes(s)) && 
               reg.status !== 'cancelled';
      });
      if (skillMatch) return skillMatch;
    }
    
    // 3. Fallback: Loose match by session type (e.g. open_gym matches OPEN_GYM)
    // This helps with legacy registrations or when skill/id is missing
    const itemType = (item.type || item.coachingItemType || '').toLowerCase().replace(/_/g, '');
    if (itemType) {
      return userRegistrations.find(reg => {
        const regType = (reg.sessionType || '').toLowerCase().replace(/_/g, '');
        return reg.status !== 'cancelled' && (regType.includes(itemType) || itemType.includes(regType));
      });
    }

    return null;
  };
  
  // Handler for coaching item completion (when user attends a session)
  const handleCoachingComplete = async (itemId, metadata) => {
    await completeItem(itemId, {
      ...metadata,
      currentWeek: currentWeek?.weekNumber,
      category: 'coaching'
    });
    toggleItemComplete(itemId, true);
  };

  const handleViewResource = async (e, item) => {
    e.stopPropagation(); // Prevent toggling completion
    
    // For items with a URL, check if it should open in-app or if we need to fetch more data
    // PDQ items need re-fetch to ensure we have the right document URL
    const itemLabel = (item.label || item.title || '').toLowerCase();
    const isPDQ = itemLabel.includes('pdq');
    
    // For items with a URL that aren't PDQ special cases, open directly in the viewer
    // This ensures documents open in-app via UniversalResourceViewer
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
        // Try fetching from the new unified 'content_library' collection first
        const contentRef = doc(db, 'content_library', resourceId);
        const contentSnap = await getDoc(contentRef);
        
        let resourceData = null;

        if (contentSnap.exists()) {
           const data = contentSnap.data();
           resourceData = { 
               id: contentSnap.id, 
               ...data, 
               resourceType: data.type 
           };

           // Map details to url for viewer compatibility
           if (data.type === 'REP' && data.details?.videoUrl) {
               resourceData.url = data.details.videoUrl;
               resourceData.resourceType = 'video';
           } else if (data.type === 'VIDEO') {
               resourceData.url = data.url || data.videoUrl || data.details?.externalUrl || data.metadata?.externalUrl;
               resourceData.resourceType = 'video';
           } else if (data.type === 'READ_REP') {
               // For Read & Reps, we want to show the synopsis in the viewer
               // The UniversalResourceViewer will handle 'read_rep' type
               resourceData.resourceType = 'read_rep';
               
               // Map details to top-level properties for viewer
               if (data.details) {
                   resourceData.synopsis = data.details.synopsis;
                   resourceData.author = data.details.author;
                   if (data.details.pdfUrl) {
                       resourceData.url = data.details.pdfUrl;
                   }
               }
           }
        } else {
            // Fallback to legacy collections if not found in 'content_library'
            const type = (item.resourceType || item.type || '').toLowerCase();

            let collectionName = CONTENT_COLLECTIONS.READINGS;
            if (type === 'video' || type === 'workout') collectionName = CONTENT_COLLECTIONS.VIDEOS;
            else if (type === 'community' || type === 'leader_circle' || type === 'open_gym') collectionName = CONTENT_COLLECTIONS.COMMUNITY;
            else if (type === 'coaching') collectionName = CONTENT_COLLECTIONS.COACHING;
            else if (type === 'document' || type === 'tool') collectionName = CONTENT_COLLECTIONS.DOCUMENTS;
            else if (type === 'course' || type === 'program') collectionName = CONTENT_COLLECTIONS.COURSES;
            
            const docRef = doc(db, collectionName, resourceId);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
              resourceData = { id: docSnap.id, ...docSnap.data(), resourceType: type };
            } else {
              console.warn(`Resource not found in ${collectionName} (ID: ${resourceId})`);
              alert("Resource not found. It may have been deleted.");
              return;
            }
        }

        // Always open in the viewer (UniversalResourceViewer handles embedding logic)
        if (resourceData) {
            setViewingResource(resourceData);
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
    console.log('[ThisWeeksActions] handleToggle called for item:', itemId, item);
    
    // Guard against undefined itemId
    if (!itemId) {
      console.error('[ThisWeeksActions] Item has no id!', item);
      alert('Unable to track this item - it has no ID assigned.');
      return;
    }
    
    console.log('[ThisWeeksActions] currentWeek:', currentWeek);
    console.log('[ThisWeeksActions] completedItems:', completedItems);
    
    const progress = getItemProgress(itemId);
    console.log('[ThisWeeksActions] getItemProgress result:', progress);
    
    const isCurrentlyComplete = progress.status === 'completed' || completedItems.includes(itemId);
    console.log('[ThisWeeksActions] isCurrentlyComplete:', isCurrentlyComplete);
    
    // Toggle in legacy system for compatibility
    console.log('[ThisWeeksActions] Calling toggleItemComplete with:', itemId, !isCurrentlyComplete);
    toggleItemComplete(itemId, !isCurrentlyComplete);
    
    // Also update Daily Plan progress if applicable (for PrepWelcomeBanner sync)
    if (item.fromDailyPlan && item.dayId && devPlanHook.toggleDayItemComplete) {
      console.log('[ThisWeeksActions] Syncing to Daily Plan:', item.dayId, itemId);
      devPlanHook.toggleDayItemComplete(item.dayId, itemId, !isCurrentlyComplete);
    }
    
    // Also track in new progress system
    if (isCurrentlyComplete) {
      console.log('[ThisWeeksActions] Calling uncompleteItem');
      await uncompleteItem(itemId);
    } else {
      console.log('[ThisWeeksActions] Calling completeItem');
      await completeItem(itemId, {
        currentWeek: currentWeek.weekNumber,
        originalWeek: item.originalWeek || currentWeek.weekNumber,
        weekNumber: currentWeek.weekNumber,
        category: item.category?.toLowerCase(),
        label: item.label || item.title,
        carriedOver: item.carriedOver || false,
        carryCount: item.carryCount || 0
      });
    }
    console.log('[ThisWeeksActions] handleToggle complete');
  };

  const handleSkip = async (item) => {
    setShowSkipConfirm(null);
    await skipItem(item.id, {
      originalWeek: item.originalWeek || currentWeek.weekNumber,
      weekNumber: currentWeek.weekNumber,
      category: item.category?.toLowerCase(),
      label: item.label || item.title,
      reason: 'user_skipped'
    });
  };

  // Action Item Renderer
  const ActionItem = ({ item, idx, isCarriedOver = false }) => {
    const progress = getItemProgress(item.id);
    // For onboarding tasks, use autoComplete; otherwise use progress system
    const isCompleted = item.isOnboardingTask 
      ? item.autoComplete 
      : (progress.status === 'completed' || completedItems.includes(item.id));
    const isSkipped = progress.status === 'skipped';
    const Icon = item.isOnboardingTask 
      ? (item.icon === 'User' ? User : ClipboardCheck)
      : getIcon(item.type);
    const carryCount = progress.carryCount || item.carryCount || 0;
    
    if (isSkipped) return null; // Don't show skipped items

    // Determine color scheme: blue = to do, green = completed
    const getCategoryStyles = () => {
      if (isCompleted) return 'bg-emerald-50 border-emerald-200';
      // All incomplete items get blue styling
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
    
    return (
      <div 
        key={item.id || idx}
        className={`
          group flex items-start gap-3 p-3 rounded-xl border transition-all
          ${getCategoryStyles()}
        `}
      >
        {/* Checkbox - larger touch target (no click handler for onboarding tasks) */}
        <div
          onClick={item.isOnboardingTask ? undefined : () => handleToggle(item)}
          className={`
            flex-shrink-0 mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${item.isOnboardingTask ? '' : 'cursor-pointer touch-manipulation active:scale-90'}
            ${getCheckboxStyles()}
          `}
          title={item.isOnboardingTask ? (isCompleted ? 'Completed!' : 'Complete to check off') : undefined}
        >
          {isCompleted && <CheckCircle className="w-4 h-4 text-white" />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <p className={`text-sm font-bold ${
              isCompleted ? 'text-emerald-700 line-through' : 'text-slate-700'
            }`}>
              {item.label || item.title || item.name || 'Untitled Action'}
            </p>
            {item.isOnboardingTask && !isCompleted && (
              <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded uppercase tracking-wider">
                Auto-tracks
              </span>
            )}
            {!item.isOnboardingTask && item.required !== false && !item.optional && !isCarriedOver && (
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase tracking-wider">
                Required
              </span>
            )}
            {!item.isOnboardingTask && item.optional && !isCarriedOver && (
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-wider">
                Optional
              </span>
            )}
            {isCarriedOver && (
              <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                Prior Week {carryCount > 1 ? `(${carryCount}x)` : ''}
              </span>
            )}
            {carryCount >= 2 && (
              <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                <AlertTriangle className="w-2.5 h-2.5" />
                Last Chance
              </span>
            )}
          </div>
          
          <div className={`flex items-center gap-2 text-xs ${getIconColor()}`}>
            <Icon className="w-3 h-3" />
            {item.isOnboardingTask ? (
              <span className="text-slate-600">{item.description}</span>
            ) : (
              <>
                <span className="capitalize">{item.type?.replace(/_/g, ' ').toLowerCase() || 'Action'}</span>
                {item.description ? (
                  <>
                    <span>•</span>
                    <span className="text-slate-600">{item.description}</span>
                  </>
                ) : (
                  <>
                    <span>•</span>
                    <span>{item.estimatedTime || '15m'}</span>
                  </>
                )}
                {isCarriedOver && item.originalWeek && (
                  <>
                    <span>•</span>
                    <span className="text-slate-500">From Week {item.originalWeek}</span>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 -mr-1">
          {/* Skip Button (for carried over items) - ONLY show if no resource button, or if explicitly requested */}
          {/* We hide it by default if there's a resource button to avoid "double icon" confusion, unless user hovers */}
          {isCarriedOver && !isCompleted && (
            <div className={`relative ${item.resourceId || item.url ? 'invisible group-hover:visible' : ''}`}>
              {showSkipConfirm === item.id ? (
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-sm absolute right-0 z-10">
                  <button
                    onClick={() => handleSkip(item)}
                    className="px-3 py-2 min-h-[36px] text-xs text-red-600 hover:bg-red-50 rounded touch-manipulation active:scale-95 whitespace-nowrap"
                  >
                    Skip
                  </button>
                  <button
                    onClick={() => setShowSkipConfirm(null)}
                    className="px-3 py-2 min-h-[36px] text-xs text-slate-500 hover:bg-slate-50 rounded touch-manipulation active:scale-95 whitespace-nowrap"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSkipConfirm(item.id);
                  }}
                  className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all touch-manipulation active:scale-95"
                  title="Skip this item"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              )}
            </div>
          )}

          {/* Add to Calendar Button */}
          {item.calendarEvent && (
            <a
              href={generateCalendarUrl(item.calendarEvent)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all touch-manipulation active:scale-95"
              title="Add to Calendar"
            >
              <Calendar className="w-5 h-5" />
            </a>
          )}

          {/* View Resource Button */}
          {(item.resourceId || item.url) && (
            <button
              onClick={(e) => handleViewResource(e, item)}
              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-corporate-teal hover:bg-teal-50 rounded-xl transition-all touch-manipulation active:scale-95"
              title="View Resource"
            >
              {loadingResource === item.id ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : item.resourceType === 'video' ? (
                <Play className="w-5 h-5" />
              ) : item.resourceType === 'reading' || item.resourceType === 'pdf' || item.resourceType === 'document' || item.resourceType === 'read_rep' ? (
                <FileText className="w-5 h-5" />
              ) : item.resourceType === 'course' ? (
                <Layers className="w-5 h-5" />
              ) : (
                <ExternalLink className="w-5 h-5" />
              )}
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

        {/* Carried Over Items - Always at TOP, always visible */}
        {carriedOverItems.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2 px-1">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                  Prior Week - Incomplete
                </span>
              </div>
              <div className="flex-1 h-px bg-slate-200"></div>
              <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                {carriedOverItems.length} item{carriedOverItems.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            <div className="space-y-1 p-3 bg-slate-50/80 rounded-xl border border-slate-200/60">
              {carriedOverItems.map((item, idx) => {
                // Check if it's a coaching item
                if (isCoachingItem(item)) {
                  const progress = getItemProgress(item.id);
                  const isCompleted = progress.status === 'completed' || completedItems.includes(item.id);
                  const registration = findRegistrationForItem(item);
                  
                  return (
                    <CoachingActionItem
                      key={item.id || `carried-${idx}`}
                      item={item}
                      isCompleted={isCompleted}
                      isCarriedOver={true}
                      carryCount={progress.carryCount || item.carryCount || 0}
                      onComplete={handleCoachingComplete}
                      registration={registration}
                      weekNumber={currentWeek?.weekNumber}
                    />
                  );
                }
                
                return (
                  <ActionItem 
                    key={item.id || `carried-${idx}`} 
                    item={item} 
                    idx={idx} 
                    isCarriedOver={true} 
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Current Week Items */}
        {allActions.length > 0 && (
          <div className="flex items-center gap-2 mb-2 px-1">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-teal-600" />
              <span className="text-sm font-bold text-teal-800 uppercase tracking-wider">
                This Week
              </span>
            </div>
            <div className="flex-1 h-px bg-teal-200"></div>
            <span className="text-xs font-medium text-teal-600 bg-teal-100 px-2 py-0.5 rounded-full">
              {allActions.length} item{allActions.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        <div className="space-y-1">
          {allActions.length === 0 && carriedOverItems.length === 0 ? (
            <div className="p-4 text-center text-slate-500 text-sm italic">
              No actions scheduled for this week.
            </div>
          ) : allActions.length === 0 ? (
            <div className="p-4 text-center text-slate-500 text-sm italic">
              No new actions this week. Complete your carried-over items above!
            </div>
          ) : (
            allActions.map((item, idx) => {
              // Check if it's a coaching item
              if (isCoachingItem(item)) {
                const progress = getItemProgress(item.id);
                const isCompleted = progress.status === 'completed' || completedItems.includes(item.id);
                const registration = findRegistrationForItem(item);
                
                return (
                  <CoachingActionItem
                    key={item.id || idx}
                    item={item}
                    isCompleted={isCompleted}
                    isCarriedOver={false}
                    carryCount={progress.carryCount || 0}
                    onComplete={handleCoachingComplete}
                    registration={registration}
                    weekNumber={currentWeek?.weekNumber}
                  />
                );
              }
              
              return <ActionItem key={item.id || idx} item={item} idx={idx} />;
            })
          )}
        </div>

        {/* Completion Celebration */}
        {progressPercent === 100 && totalCount > 0 && (
          <div className="mt-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 text-center">
            <div className="text-2xl mb-1">🎉</div>
            <p className="text-sm font-semibold text-emerald-800">
              Week {currentWeek.weekNumber} Complete!
            </p>
            <p className="text-xs text-emerald-600 mt-1">
              Great work! You've completed all actions for this week.
            </p>
          </div>
        )}
      </Card>
    </>
  );
};

export default ThisWeeksActionsWidget;
