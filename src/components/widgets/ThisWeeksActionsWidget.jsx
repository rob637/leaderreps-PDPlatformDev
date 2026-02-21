import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { 
  CheckCircle, Circle, Play, BookOpen, Users, Video, FileText, Zap, 
  ExternalLink, Loader, Layers, MessageSquare, 
  SkipForward, Clock, AlertTriangle,
  User, ClipboardCheck, Calendar, ChevronDown, ChevronUp, Trophy, Bell
} from 'lucide-react';
import { Card } from '../ui';
import { useDailyPlan } from '../../hooks/useDailyPlan';
import { useActionProgress } from '../../hooks/useActionProgress';
// useCoachingRegistrations available if needed
import { useLeaderProfile } from '../../hooks/useLeaderProfile';
import UniversalResourceViewer from '../ui/UniversalResourceViewer';
import CoachingActionItem from '../coaching/CoachingActionItem';
import { doc, getDoc, updateDoc, deleteField, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { RotateCcw } from 'lucide-react';
import { useAppServices } from '../../services/useAppServices';
import { CONTENT_COLLECTIONS } from '../../services/contentService';
import LeaderProfileFormSimple from '../profile/LeaderProfileFormSimple';
import BaselineAssessmentSimple from '../screens/developmentplan/BaselineAssessmentSimple';
import NotificationPreferencesWidget from './NotificationPreferencesWidget';
import FoundationCommitmentWidget from './FoundationCommitmentWidget';
import ConditioningTutorialWidget from './ConditioningTutorialWidget';
import { VideoSeriesPlayer } from '../video';

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
  const { db, user, developmentPlanData, updateDevelopmentPlanData, isAdmin } = useAppServices();
  const [resettingPrep, setResettingPrep] = useState(false);
  const [viewingResource, setViewingResource] = useState(null);
  const [loadingResource, setLoadingResource] = useState(false);
  const [viewingSeriesId, setViewingSeriesId] = useState(null);
  // const [showSkipConfirm, setShowSkipConfirm] = useState(null);
  
  // Interactive content modals
  const [showLeaderProfileModal, setShowLeaderProfileModal] = useState(false);
  const [showBaselineModal, setShowBaselineModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showFoundationCommitmentModal, setShowFoundationCommitmentModal] = useState(false);
  const [showConditioningTutorialModal, setShowConditioningTutorialModal] = useState(false);
  const [savingBaseline, setSavingBaseline] = useState(false);
  
  // Prep Complete expanded state (default collapsed when all done)
  const [prepExpanded, setPrepExpanded] = useState(false);
  
  // Admin: Reset prep progress for testing
  const resetPrepProgress = async () => {
    if (!isAdmin || !user?.uid || !db) return;
    if (!confirm('⚠️ This will reset ALL prep phase progress AND data (leader profile, baseline, etc). Continue?')) return;
    
    setResettingPrep(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      
      // Clear prepStatus flags and related data on user doc
      await updateDoc(userRef, {
        prepStatus: deleteField(),
        foundationCommitment: deleteField(),
        conditioningTutorial: deleteField(),
        notificationSettings: deleteField()
      });
      
      // DELETE leader profile document entirely (not just mark incomplete)
      const leaderProfileRef = doc(db, 'user_data', user.uid, 'leader_profile', 'current');
      try {
        await deleteDoc(leaderProfileRef);
        console.log('Deleted leader profile document');
      } catch (e) {
        console.log('Leader profile not found, skipping');
      }
      
      // Clear action_progress for ALL prep items (delete all during prep reset)
      const actionProgressRef = collection(db, 'users', user.uid, 'action_progress');
      const progressSnap = await getDocs(actionProgressRef);
      for (const docSnap of progressSnap.docs) {
        await deleteDoc(docSnap.ref);
      }
      console.log(`Deleted ${progressSnap.docs.length} action_progress items`);
      
      // Clear video progress
      const videoProgressRef = collection(db, 'users', user.uid, 'videoProgress');
      const videoSnap = await getDocs(videoProgressRef);
      for (const docSnap of videoSnap.docs) {
        await deleteDoc(docSnap.ref);
      }
      console.log(`Deleted ${videoSnap.docs.length} videoProgress items`);
      
      // Clear assessment history AND focusAreas from development plan
      if (updateDevelopmentPlanData) {
        await updateDevelopmentPlanData({ 
          assessmentHistory: deleteField(),
          focusAreas: deleteField(),
          currentPlan: deleteField()
        });
        console.log('Cleared assessmentHistory, focusAreas, currentPlan from development plan');
      }
      
      alert('✅ Prep progress AND data reset! Page will reload.');
      window.location.reload();
    } catch (error) {
      console.error('Error resetting prep:', error);
      alert('Error: ' + error.message);
    } finally {
      setResettingPrep(false);
    }
  };
  
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
    toggleItemComplete: toggleDailyItem,
    userState,
    prepRequirementsComplete
  } = useDailyPlan();

  const actionProgress = useActionProgress();
  // const coachingRegistrations = useCoachingRegistrations();
  
  // Leader Profile completion tracking (for auto-check in Pre-Start)
  const { isComplete: leaderProfileComplete } = useLeaderProfile();
  
  // Baseline Assessment completion tracking - use developmentPlanData directly for real-time updates
  const baselineAssessmentComplete = useMemo(() => {
    const assessmentHistory = developmentPlanData?.assessmentHistory;
    return assessmentHistory && assessmentHistory.length > 0;
  }, [developmentPlanData?.assessmentHistory]);
  
  // Notification Setup completion tracking
  const [notificationSetupComplete, setNotificationSetupComplete] = useState(false);
  useEffect(() => {
    const checkNotificationSettings = async () => {
      if (!db || !user?.uid) return;
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const ns = userSnap.data().notificationSettings;
          // Consider complete if a strategy has been explicitly set
          setNotificationSetupComplete(ns && ns.strategy ? true : false);
        }
      } catch (error) {
        console.warn('Could not check notification settings:', error);
      }
    };
    checkNotificationSettings();
  }, [db, user?.uid, showNotificationModal]); // Re-check when modal closes
  
  // Foundation Commitment completion tracking
  const [foundationCommitmentComplete, setFoundationCommitmentComplete] = useState(false);
  useEffect(() => {
    const checkFoundationCommitment = async () => {
      if (!db || !user?.uid) return;
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const fc = userSnap.data().foundationCommitment;
          setFoundationCommitmentComplete(fc && fc.acknowledged ? true : false);
        }
      } catch (error) {
        console.warn('Could not check foundation commitment:', error);
      }
    };
    checkFoundationCommitment();
  }, [db, user?.uid, showFoundationCommitmentModal]); // Re-check when modal closes
  
  // Conditioning Tutorial completion tracking
  const [conditioningTutorialComplete, setConditioningTutorialComplete] = useState(false);
  useEffect(() => {
    const checkConditioningTutorial = async () => {
      if (!db || !user?.uid) return;
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const ct = userSnap.data().conditioningTutorial;
          setConditioningTutorialComplete(ct && ct.completed ? true : false);
        }
      } catch (error) {
        console.warn('Could not check conditioning tutorial:', error);
      }
    };
    checkConditioningTutorial();
  }, [db, user?.uid, showConditioningTutorialModal]); // Re-check when modal closes
  
  // Video series duration data (fetched on demand)
  const [videoSeriesDurations, setVideoSeriesDurations] = useState({});
  
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

  // Normalize weekly resources (coaching and community items from weeklyResources)
  const normalizeWeeklyResources = (weeklyResources, dayId, dayNumber, weekNumber) => {
    const items = [];
    
    // Process coaching items
    if (weeklyResources?.weeklyCoaching && Array.isArray(weeklyResources.weeklyCoaching)) {
      weeklyResources.weeklyCoaching.forEach((item, idx) => {
        const label = item.coachingItemLabel || 'Coaching';
        // Create stable ID from week + label to avoid duplicates
        const stableId = item.coachingItemId || `weekly-coaching-week${weekNumber}-${label.toLowerCase().replace(/\s+/g, '-').substring(0, 25)}-${idx}`;
        
        items.push({
          id: stableId,
          type: (item.coachingItemType || 'coaching').toLowerCase().replace(/\s+/g, '_'),
          displayType: 'coaching',
          label: label,
          // Coach items are optional unless explicitly marked required
          required: item.isOptionalCoachingItem === false,
          optional: item.isOptionalCoachingItem !== false,
          category: 'Coaching',
          fromDailyPlan: true,
          fromWeeklyResources: true,
          dayId: dayId,
          dayNumber: dayNumber,
          weekNumber: weekNumber,
          handlerType: item.coachingItemType === 'AI Feedback Coach' ? 'ai-roleplay' : item.coachingItemType?.toLowerCase().replace(/\s+/g, '-')
        });
      });
    }
    
    // Process community items
    if (weeklyResources?.weeklyCommunity && Array.isArray(weeklyResources.weeklyCommunity)) {
      weeklyResources.weeklyCommunity.forEach((item, idx) => {
        const label = item.communityItemLabel || 'Community';
        const stableId = item.communityItemId || `weekly-community-week${weekNumber}-${label.toLowerCase().replace(/\s+/g, '-').substring(0, 25)}-${idx}`;
        
        items.push({
          id: stableId,
          type: (item.communityItemType || 'community').toLowerCase().replace(/\s+/g, '_'),
          displayType: 'community',
          label: label,
          required: item.isRequiredCommunityItem === true,
          optional: item.isRequiredCommunityItem !== true,
          category: 'Community',
          fromDailyPlan: true,
          fromWeeklyResources: true,
          dayId: dayId,
          dayNumber: dayNumber,
          weekNumber: weekNumber,
          recommendedWeekDay: item.recommendedWeekDay
        });
      });
    }
    
    return items;
  };

  // Normalize daily plan actions
  const normalizeDailyActions = useCallback((actions, dayId, dayNumber) => {
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
      } else if (actionType === 'onboarding') {
        category = 'Onboarding';
      }
      
      // Determine if this is an interactive item based on handlerType
      const handlerType = action.handlerType || '';
      const isInteractive = ['leader-profile', 'baseline-assessment', 'notification-setup', 'foundation-commitment', 'conditioning-tutorial'].includes(handlerType);
      
      // Auto-complete status for interactive items
      let autoComplete = undefined;
      if (handlerType === 'leader-profile') autoComplete = leaderProfileComplete;
      else if (handlerType === 'baseline-assessment') autoComplete = baselineAssessmentComplete;
      else if (handlerType === 'notification-setup') autoComplete = notificationSetupComplete;
      else if (handlerType === 'foundation-commitment') autoComplete = foundationCommitmentComplete;
      else if (handlerType === 'conditioning-tutorial') autoComplete = conditioningTutorialComplete;
      
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
        estimatedMinutes: action.estimatedMinutes,
        // Interactive item support
        isInteractive,
        autoComplete,
        handlerType
      };
    });
  }, [leaderProfileComplete, baselineAssessmentComplete, notificationSetupComplete, foundationCommitmentComplete, conditioningTutorialComplete]);

  // Combine all actionable items from Daily Plan
  const allActions = useMemo(() => {
    if (!dailyPlan || dailyPlan.length === 0) return [];

    // Pre-Start phase = COMPLETION-BASED (not day-based or time-based)
    // Two sections: Required Prep and Explore (optional)
    if (currentPhase?.id === 'pre-start') {
      // Get prep phase actions from daily plan (progress-based, not day-based)
      // EXCLUDE explore-config - those are handled separately
      const prepDays = dailyPlan.filter(d => d.phase === 'pre-start' && d.id !== 'explore-config');
      
      let allPrepActions = [];
      prepDays.forEach(day => {
        if (day.actions) {
          allPrepActions.push(...normalizeDailyActions(day.actions, day.id, day.dayNumber));
        }
      });
      
      // Filter out daily_rep type items (those are not milestone items)
      const filteredPrepActions = allPrepActions.filter(action => {
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
        return requiredPrepActions;
      }
      
      // Required prep is complete - show ALL prep items (including Explore)
      return [...requiredPrepActions, ...explorePrepActions];
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
      // Also include weekly resources (coaching/community items) from the first day of each week
      if (day.weeklyResources && day.dayNumber === absStartDay) {
        weekActions.push(...normalizeWeeklyResources(day.weeklyResources, day.id, day.dayNumber, currentWeekNumber));
      }
    });
    
    // Filter out Daily Reps
    return weekActions.filter(action => action.type !== 'daily_rep');
    
  }, [dailyPlan, currentPhase?.id, currentWeekNumber, prepRequirementsComplete?.allComplete, normalizeDailyActions]);

  // Get carried over items (including incomplete prep phase items AND all prior weeks)
  const carriedOverItems = useMemo(() => {
    // No carryover in Prep Phase
    if (currentPhase?.id === 'pre-start') return [];
    
    const carriedItems = [];
    const dailyProgress = userState?.dailyProgress || {};
    
    // Helper function to check if an action is completed
    const isActionCompleted = (actionId) => {
      // Check in dailyProgress
      const completedInDailyProgress = Object.values(dailyProgress).some(
        dp => dp?.itemsCompleted?.includes(actionId)
      );
      if (completedInDailyProgress) return true;
      
      // Also check in actionProgress
      const progress = getItemProgress(actionId);
      return progress?.status === 'completed';
    };
    
    // Get explicitly carried over items from actionProgress
    const explicitCarryOver = getCarriedOverItems(currentWeekNumber);
    carriedItems.push(...explicitCarryOver);
    
    // Check for incomplete prep phase items (interactive items)
    // These should carry over to Start phase if not completed
    if (currentPhase?.id === 'start') {
      // Check for incomplete prep phase daily plan items (including interactive items)
      const prepDays = dailyPlan.filter(d => d.phase === 'pre-start');
      
      prepDays.forEach(day => {
        if (day.actions && Array.isArray(day.actions)) {
          day.actions.forEach((action, idx) => {
            // Skip if not required
            if (action.optional || action.required === false) return;
            
            // Check if completed
            const actionId = action.id || `daily-${day.id}-${(action.label || '').toLowerCase().replace(/\s+/g, '-').substring(0, 20)}-${idx}`;
            
            // Check interactive items by handlerType
            const handlerType = action.handlerType || '';
            let isComplete = false;
            
            if (handlerType === 'leader-profile') {
              isComplete = leaderProfileComplete;
            } else if (handlerType === 'baseline-assessment') {
              isComplete = baselineAssessmentComplete;
            } else if (handlerType === 'notification-setup') {
              isComplete = notificationSetupComplete;
            } else {
              isComplete = isActionCompleted(actionId);
            }
            
            if (!isComplete) {
              // Skip daily reps
              if (action.type === 'daily_rep') return;
              
              carriedItems.push({
                ...action,
                id: actionId,
                label: action.label || 'Preparation Action',
                required: true,
                category: action.type === 'onboarding' ? 'Onboarding' : 'Preparation',
                fromDailyPlan: true,
                dayId: day.id,
                dayNumber: day.dayNumber,
                carriedOver: true,
                fromWeek: 0,
                resourceId: action.resourceId,
                resourceType: (action.resourceType || action.type || 'content').toLowerCase(),
                url: action.url || action.videoUrl || action.link || action.details?.externalUrl,
                isInteractive: ['leader-profile', 'baseline-assessment', 'notification-setup'].includes(handlerType),
                handlerType
              });
            }
          });
        }
      });
      
      // **NEW: Check for incomplete items from ALL prior weeks (not just prep)**
      // Loop through weeks 1 to currentWeekNumber - 1
      const phaseStartDbDay = 15; // Start phase begins at day 15
      
      for (let priorWeek = 1; priorWeek < currentWeekNumber; priorWeek++) {
        const startDay = (priorWeek - 1) * 7 + 1;
        const endDay = priorWeek * 7;
        const absStartDay = phaseStartDbDay + startDay - 1;
        const absEndDay = phaseStartDbDay + endDay - 1;
        
        // Get days for this prior week
        const priorWeekDays = dailyPlan.filter(d => 
          d.dayNumber >= absStartDay && 
          d.dayNumber <= absEndDay
        );
        
        // Check each action in each day
        priorWeekDays.forEach(day => {
          if (day.actions && Array.isArray(day.actions)) {
            day.actions.forEach((action, idx) => {
              // Skip if not required
              if (action.optional || action.required === false) return;
              // Skip daily reps (handled separately)
              if (action.type === 'daily_rep') return;
              
              const label = action.label || 'Week Action';
              const actionId = action.id || `daily-${day.id}-${label.toLowerCase().replace(/\s+/g, '-').substring(0, 20)}-${idx}`;
              
              // Skip if already in carriedItems (avoid duplicates)
              if (carriedItems.some(item => item.id === actionId)) return;
              
              if (!isActionCompleted(actionId)) {
                // Map action type to category
                let category = 'Content';
                const actionType = (action.type || '').toLowerCase();
                if (actionType === 'community' || actionType === 'leader_circle' || actionType === 'open_gym') {
                  category = 'Community';
                } else if (actionType === 'coaching' || actionType === 'call') {
                  category = 'Coaching';
                }
                
                carriedItems.push({
                  ...action,
                  id: actionId,
                  type: action.type || action.resourceType || 'content',
                  displayType: action.resourceType || action.type || 'content',
                  label: label,
                  required: true,
                  category,
                  fromDailyPlan: true,
                  dayId: day.id,
                  dayNumber: day.dayNumber,
                  carriedOver: true,
                  fromWeek: priorWeek,
                  resourceId: action.resourceId,
                  resourceType: (action.resourceType || action.type || 'content').toLowerCase(),
                  resourceTitle: action.resourceTitle,
                  url: action.url || action.videoUrl || action.link || action.details?.externalUrl || action.metadata?.externalUrl,
                  estimatedMinutes: action.estimatedMinutes
                });
              }
            });
          }
          
          // **NEW: Also check weeklyResources (coaching/community) for first day of each prior week**
          if (day.weeklyResources && day.dayNumber === absStartDay) {
            // Check coaching items
            if (day.weeklyResources.weeklyCoaching && Array.isArray(day.weeklyResources.weeklyCoaching)) {
              day.weeklyResources.weeklyCoaching.forEach((item, idx) => {
                // Only carry over required coaching items (isOptionalCoachingItem === false)
                if (item.isOptionalCoachingItem !== false) return;
                
                const label = item.coachingItemLabel || 'Coaching';
                const itemId = item.coachingItemId || `weekly-coaching-week${priorWeek}-${label.toLowerCase().replace(/\s+/g, '-').substring(0, 25)}-${idx}`;
                
                // Skip if already in carriedItems
                if (carriedItems.some(ci => ci.id === itemId)) return;
                
                if (!isActionCompleted(itemId)) {
                  carriedItems.push({
                    id: itemId,
                    type: (item.coachingItemType || 'coaching').toLowerCase().replace(/\s+/g, '_'),
                    displayType: 'coaching',
                    label: label,
                    required: true,
                    category: 'Coaching',
                    fromDailyPlan: true,
                    fromWeeklyResources: true,
                    dayId: day.id,
                    dayNumber: day.dayNumber,
                    carriedOver: true,
                    fromWeek: priorWeek,
                    handlerType: item.coachingItemType === 'AI Feedback Coach' ? 'ai-roleplay' : item.coachingItemType?.toLowerCase().replace(/\s+/g, '-')
                  });
                }
              });
            }
            
            // Check community items
            if (day.weeklyResources.weeklyCommunity && Array.isArray(day.weeklyResources.weeklyCommunity)) {
              day.weeklyResources.weeklyCommunity.forEach((item, idx) => {
                // Only carry over required community items
                if (item.isRequiredCommunityItem !== true) return;
                
                const label = item.communityItemLabel || 'Community';
                const itemId = item.communityItemId || `weekly-community-week${priorWeek}-${label.toLowerCase().replace(/\s+/g, '-').substring(0, 25)}-${idx}`;
                
                // Skip if already in carriedItems
                if (carriedItems.some(ci => ci.id === itemId)) return;
                
                if (!isActionCompleted(itemId)) {
                  carriedItems.push({
                    id: itemId,
                    type: (item.communityItemType || 'community').toLowerCase().replace(/\s+/g, '_'),
                    displayType: 'community',
                    label: label,
                    required: true,
                    category: 'Community',
                    fromDailyPlan: true,
                    fromWeeklyResources: true,
                    dayId: day.id,
                    dayNumber: day.dayNumber,
                    carriedOver: true,
                    fromWeek: priorWeek,
                    recommendedWeekDay: item.recommendedWeekDay
                  });
                }
              });
            }
          }
        });
      }
    }
    
    return carriedItems;
  }, [currentPhase?.id, currentWeekNumber, getCarriedOverItems, getItemProgress, leaderProfileComplete, baselineAssessmentComplete, notificationSetupComplete, dailyPlan, userState?.dailyProgress]);

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

  // Fetch video series durations for video_series actions
  // Use a ref to track fetched series IDs to avoid infinite loops
  const fetchedSeriesRef = useRef(new Set());
  
  useEffect(() => {
    const fetchVideoSeriesDurations = async () => {
      if (!db || !allActions.length) return;
      
      // Find video_series actions that haven't been fetched yet
      const seriesIds = allActions
        .filter(a => a.resourceType === 'video_series' && a.resourceId && !fetchedSeriesRef.current.has(a.resourceId))
        .map(a => a.resourceId);
      
      if (seriesIds.length === 0) return;
      
      // Mark as fetched immediately to prevent re-fetching
      seriesIds.forEach(id => fetchedSeriesRef.current.add(id));
      
      const newDurations = {};
      
      for (const seriesId of seriesIds) {
        try {
          const seriesRef = doc(db, 'video_series', seriesId);
          const seriesSnap = await getDoc(seriesRef);
          if (seriesSnap.exists()) {
            const data = seriesSnap.data();
            // totalDuration is stored in minutes
            newDurations[seriesId] = Math.round(data.totalDuration || 0);
          }
        } catch (error) {
          console.warn('Could not fetch video series duration:', seriesId, error);
        }
      }
      
      if (Object.keys(newDurations).length > 0) {
        setVideoSeriesDurations(prev => ({ ...prev, ...newDurations }));
      }
    };
    
    fetchVideoSeriesDurations();
  }, [db, allActions]); // Removed videoSeriesDurations to prevent infinite loop

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
  const _progressPercent = totalRequiredCount > 0 ? Math.round((completedRequiredCount / totalRequiredCount) * 100) : 0;

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
  
  // Handler for INTERACTIVE content items (Leader Profile, Baseline Assessment, Notification Setup, Foundation Commitment, Conditioning Tutorial)
  const handleInteractiveClick = (item) => {
    if (item.handlerType === 'leader-profile') {
      setShowLeaderProfileModal(true);
    } else if (item.handlerType === 'baseline-assessment') {
      setShowBaselineModal(true);
    } else if (item.handlerType === 'notification-setup') {
      setShowNotificationModal(true);
    } else if (item.handlerType === 'foundation-commitment') {
      setShowFoundationCommitmentModal(true);
    } else if (item.handlerType === 'conditioning-tutorial') {
      setShowConditioningTutorialModal(true);
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
      // Set prepStatus flag for unified tracking
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { 'prepStatus.baselineAssessment': true }).catch(e => console.warn('Could not set prepStatus:', e));
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

    // Video Series — open dedicated player
    if (item.resourceType === 'video_series' && resourceId) {
      setViewingSeriesId(resourceId);
      return;
    }

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
    // For interactive prep items, use prepRequirementsComplete to match the counter
    // Fall back to individual hook values for legacy compatibility
    let isCompleted;
    if (item.isInteractive) {
      // Try to get completion from unified prepRequirementsComplete first
      if (Array.isArray(prepRequirementsComplete?.items)) {
        const prepItem = prepRequirementsComplete.items.find(p => p.handlerType === item.handlerType);
        isCompleted = prepItem?.complete || false;
      } else {
        // Fallback to individual hook values
        isCompleted = item.handlerType === 'leader-profile' ? leaderProfileComplete : 
                      item.handlerType === 'baseline-assessment' ? baselineAssessmentComplete : 
                      item.handlerType === 'notification-setup' ? notificationSetupComplete :
                      item.handlerType === 'foundation-commitment' ? foundationCommitmentComplete :
                      item.handlerType === 'conditioning-tutorial' ? conditioningTutorialComplete :
                      item.autoComplete || false;
      }
    } else {
      isCompleted = (progress.status === 'completed' || completedItems.includes(item.id));
    }
    const isSkipped = progress.status === 'skipped';
    const Icon = item.isInteractive 
      ? (item.icon === 'User' ? User : item.icon === 'Bell' ? Bell : ClipboardCheck)
      : getIcon(item.type);
    
    if (isSkipped) return null;

    const getCategoryStyles = () => {
      if (isCompleted) return 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-700';
      return 'bg-blue-50 border-blue-100 hover:bg-blue-100 hover:border-blue-200 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 dark:hover:border-slate-600';
    };

    const getCheckboxStyles = () => {
      if (isCompleted) return 'bg-emerald-500 border-emerald-500';
      return 'border-blue-300 group-hover:border-blue-500 dark:border-blue-500 dark:group-hover:border-blue-400';
    };

    const getIconColor = () => {
      if (isCompleted) return 'text-emerald-600 dark:text-emerald-400';
      return 'text-blue-600 dark:text-blue-400';
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
            // Prevent manual completion for interactive items - they must be completed through their forms
            if (item.isInteractive) return;
            // Prevent manual completion for video series - must watch all videos
            if (item.resourceType === 'video_series') {
              alert('Watch all videos in the series to mark this complete. Click the row to open the video player.');
              return;
            }
            handleToggle(item);
          }}
          className={`flex-shrink-0 mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${item.resourceType === 'video_series' && !isCompleted ? 'cursor-not-allowed' : 'cursor-pointer touch-manipulation active:scale-90'} ${getCheckboxStyles()}`}
        >
          {isCompleted && <CheckCircle className="w-4 h-4 text-white pointer-events-none" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <p className={`text-sm font-bold ${isCompleted ? 'text-emerald-700 dark:text-emerald-400 line-through' : 'text-slate-700 dark:text-white'}`}>
              {item.label || item.title || 'Untitled Action'}
            </p>
            {item.required !== false && !item.optional && !isCarriedOver && !isCompleted && (
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/40 px-1.5 py-0.5 rounded uppercase tracking-wider">Required</span>
            )}
            {!item.isInteractive && item.optional && !isCarriedOver && (
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:text-slate-400 dark:bg-slate-700 px-1.5 py-0.5 rounded uppercase tracking-wider">Optional</span>
            )}
            {isCarriedOver && (
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/40 px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" /> {item.fromWeek === 0 ? 'Prep' : `Week ${item.fromWeek}`}
              </span>
            )}
          </div>
          
          <div className={`flex items-center gap-2 text-xs ${getIconColor()}`}>
            <Icon className="w-3 h-3" />
            {item.isInteractive ? (
              <>
                <span className="text-slate-600 dark:text-slate-400">{item.description}</span>
                {item.estimatedMinutes && (
                  <><span>•</span><span className="text-slate-500 dark:text-slate-400">{item.estimatedMinutes} min</span></>
                )}
              </>
            ) : (
              <>
                <span className="capitalize">{(item.resourceType || item.displayType || item.type)?.replace(/_/g, ' ').toLowerCase() || 'Action'}</span>
                {item.resourceTitle && (
                  <><span>•</span><span className="text-slate-600 dark:text-slate-400 font-medium">{item.resourceTitle}</span></>
                )}
                {item.description && !item.resourceTitle && (
                  <><span>•</span><span className="text-slate-600 dark:text-slate-400">{item.description}</span></>
                )}
                {/* Show estimated time to complete - for video_series, use fetched totalDuration */}
                {(item.estimatedMinutes || (item.resourceType === 'video_series' && videoSeriesDurations[item.resourceId])) && (
                   <><span>•</span><span className="text-slate-500 dark:text-slate-400">{item.estimatedMinutes || videoSeriesDurations[item.resourceId]} min</span></>
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
              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-500 dark:hover:text-blue-400 dark:hover:bg-blue-900/30 rounded-xl transition-all"
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
              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center bg-transparent text-slate-400 hover:text-corporate-teal hover:bg-teal-50 dark:text-slate-500 dark:hover:text-teal-400 dark:hover:bg-teal-900/30 rounded-xl transition-all"
              title={isCompleted ? 'Edit' : 'Complete'}
            >
              <ExternalLink className="w-5 h-5" />
            </button>
          )}

          {/* Regular content items with resources */}
          {!item.isInteractive && (item.resourceId || item.url) && (
            <button
              onClick={(e) => handleViewResource(e, item)}
              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center bg-transparent text-slate-400 hover:text-corporate-teal hover:bg-teal-50 dark:text-slate-500 dark:hover:text-teal-400 dark:hover:bg-teal-900/30 rounded-xl transition-all"
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
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-sm font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider">Preparation</span>
                  </div>
                  <div className="flex-1 h-px bg-amber-200 dark:bg-amber-700"></div>
                  <span className="text-xs font-medium text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-900/40 px-2 py-0.5 rounded-full">
                    {prepRequirementsComplete?.completedCount || 0}/{prepRequirementsComplete?.totalCount || requiredPrepActions.length} complete
                  </span>
                  {isAdmin && (
                    <button
                      onClick={resetPrepProgress}
                      disabled={resettingPrep}
                      className="ml-1 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-red-100 dark:hover:bg-red-900/40 text-slate-400 hover:text-red-500 transition-colors"
                      title="Reset prep progress (admin only)"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${resettingPrep ? 'animate-spin' : ''}`} />
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 px-1">
                  Complete these {prepRequirementsComplete?.totalCount || requiredPrepActions.length} items to get ready for Session One and access additional arena functionality.
                </p>
                <div className="space-y-1 p-3 bg-amber-50/50 dark:bg-amber-900/20 rounded-xl border border-amber-200/60 dark:border-amber-700/40">
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
                  className="w-full group flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-800/50 transition-all"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">🎉 Preparation Complete!</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">
                      All 5 tasks done — Your leadership tools are now unlocked below!
                    </p>
                  </div>
                  <div className="flex-shrink-0 p-2 text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-800 dark:group-hover:text-emerald-300 transition-colors">
                    {prepExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                  {isAdmin && (
                    <button
                      onClick={(e) => { e.stopPropagation(); resetPrepProgress(); }}
                      disabled={resettingPrep}
                      className="ml-1 p-2 rounded-lg bg-white/60 dark:bg-slate-700/60 hover:bg-red-100 dark:hover:bg-red-900/40 text-slate-400 hover:text-red-500 transition-colors"
                      title="Reset prep progress (admin only)"
                    >
                      <RotateCcw className={`w-4 h-4 ${resettingPrep ? 'animate-spin' : ''}`} />
                    </button>
                  )}
                </button>
                
                {prepExpanded && (
                  <div className="mt-2 p-3 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Completed Items</p>
                    {prepRequirementsComplete.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span className="text-emerald-700 dark:text-emerald-400">{item.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Explore items (when prep complete) - shown inline with actions */}
            {prepRequirementsComplete?.allComplete && additionalPrepActions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-slate-600 dark:text-slate-400 px-1">
                  Explore these tools at your own pace before Session 1:
                </p>
                <div className="space-y-1">
                  {additionalPrepActions.map((item, idx) => (
                    <ActionItem key={item.id || idx} item={item} idx={idx} />
                  ))}
                </div>
                
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    🚀 <span className="font-semibold">You're all set!</span> Session 1 will build on everything you've learned.
                  </p>
                </div>
              </div>
            )}
            
            {/* Just the success message if no explore items */}
            {prepRequirementsComplete?.allComplete && additionalPrepActions.length === 0 && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                <p className="text-xs text-slate-600 dark:text-slate-400">
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
                // For interactive items, use live hook values
                if (item.isInteractive) {
                  if (item.handlerType === 'leader-profile') return leaderProfileComplete;
                  if (item.handlerType === 'baseline-assessment') return baselineAssessmentComplete;
                  if (item.handlerType === 'notification-setup') return notificationSetupComplete;
                }
                const progress = getItemProgress(item.id);
                return progress.status === 'completed' || completedItems.includes(item.id);
              });
              const allCarriedOverComplete = completedCarriedOver.length === displayedCarriedOverItems.length;
              
              return allCarriedOverComplete ? (
                // All Prior Week items complete - Show collapsed celebration
                <div className="mb-4">
                  <button
                    onClick={() => setPriorWeekExpanded(!priorWeekExpanded)}
                    className="w-full group flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-800/50 transition-all"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">✅ Prior Week Complete!</p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400">
                        All {displayedCarriedOverItems.length} carried-over {displayedCarriedOverItems.length === 1 ? 'task' : 'tasks'} finished
                      </p>
                    </div>
                    <div className="flex-shrink-0 p-2 text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-800 dark:group-hover:text-emerald-300 transition-colors">
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
                      <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span className="text-sm font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider">Catch Up</span>
                    </div>
                    <div className="flex-1 h-px bg-amber-200 dark:bg-amber-700"></div>
                    <span className="text-xs font-medium text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-900/40 px-2 py-0.5 rounded-full">
                      {completedCarriedOver.length}/{displayedCarriedOverItems.length} complete
                    </span>
                  </div>
                  <div className="space-y-1 p-3 bg-amber-50/50 dark:bg-amber-900/20 rounded-xl border border-amber-200/60 dark:border-amber-700/40">
                    {displayedCarriedOverItems.map((item, idx) => (
                      <ActionItem key={item.id || `carried-${idx}`} item={item} idx={idx} isCarriedOver={true} />
                    ))}
                  </div>
                </div>
              );
            })()}

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
                    className="w-full group flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-800/50 transition-all"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">🎉 This Week Complete!</p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400">
                        All {allActions.length} {allActions.length === 1 ? 'task' : 'tasks'} finished — Great work!
                      </p>
                    </div>
                    <div className="flex-shrink-0 p-2 text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-800 dark:group-hover:text-emerald-300 transition-colors">
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
                      <CheckCircle className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      <span className="text-sm font-bold text-teal-800 dark:text-teal-400 uppercase tracking-wider">This Week</span>
                    </div>
                    <div className="flex-1 h-px bg-teal-200 dark:bg-teal-700"></div>
                    <span className="text-xs font-medium text-teal-600 bg-teal-100 dark:text-teal-300 dark:bg-teal-900/40 px-2 py-0.5 rounded-full">
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
              <div className="p-4 text-center text-slate-500 dark:text-slate-400 text-sm italic">No actions scheduled for this week.</div>
            )}

          </>
        )}
      </Card>
      
      {/* Video Series Player Modal */}
      {viewingSeriesId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden">
            <VideoSeriesPlayer
              seriesId={viewingSeriesId}
              onClose={() => setViewingSeriesId(null)}
              onComplete={async (completedSeriesId) => {
                // Find the action item with this series as its resource and mark it complete
                // Check both current actions and carried-over items
                const seriesAction = allActions.find(a => a.resourceId === completedSeriesId && a.resourceType === 'video_series')
                  || carriedOverItems.find(a => a.resourceId === completedSeriesId && a.resourceType === 'video_series');
                if (seriesAction) {
                  completeItem(seriesAction.id, {
                    currentWeek: currentWeekNumber,
                    weekNumber: currentWeekNumber,
                    category: seriesAction.category?.toLowerCase(),
                    label: seriesAction.label || seriesAction.title,
                    carriedOver: seriesAction.carriedOver || false
                  });
                  // Update unified prepStatus for video series completion
                  try {
                    const userRef = doc(db, 'users', user?.uid);
                    await updateDoc(userRef, { 'prepStatus.videoSeries': true });
                  } catch (err) {
                    console.warn('Could not update prepStatus for video series:', err);
                  }
                }
              }}
              showHeader={true}
            />
          </div>
        </div>
      )}
      
      {/* Leader Profile Modal */}
      {showLeaderProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-xl">
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
          <div className="relative w-full max-w-xl">
            <BaselineAssessmentSimple 
              onComplete={handleBaselineComplete}
              onClose={() => setShowBaselineModal(false)}
              isLoading={savingBaseline}
              initialData={developmentPlanData?.assessmentHistory?.[developmentPlanData.assessmentHistory.length - 1]}
            />
          </div>
        </div>
      )}

      {/* Notification Setup Modal */}
      {showNotificationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-xl">
            <NotificationPreferencesWidget 
              onComplete={() => {
                setShowNotificationModal(false);
                setNotificationSetupComplete(true);
              }}
              onClose={() => setShowNotificationModal(false)}
            />
          </div>
        </div>
      )}

      {/* Foundation Commitment Modal */}
      {showFoundationCommitmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-xl">
            <FoundationCommitmentWidget 
              onComplete={() => {
                setShowFoundationCommitmentModal(false);
                setFoundationCommitmentComplete(true);
              }}
              onClose={() => setShowFoundationCommitmentModal(false)}
            />
          </div>
        </div>
      )}

      {/* Conditioning Tutorial Modal */}
      {showConditioningTutorialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-xl">
            <ConditioningTutorialWidget 
              onComplete={() => {
                setShowConditioningTutorialModal(false);
                setConditioningTutorialComplete(true);
              }}
              onClose={() => setShowConditioningTutorialModal(false)}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default ThisWeeksActionsWidget;