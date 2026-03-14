import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { 
  CheckCircle, Circle, Play, BookOpen, Users, Video, FileText, Zap, 
  ExternalLink, Loader, Layers, MessageSquare, 
  SkipForward, Clock, AlertTriangle, PlayCircle,
  User, ClipboardCheck, Calendar, ChevronDown, ChevronUp, Trophy, Bell,
  RotateCcw, Award
} from 'lucide-react';
import { SESSION_TYPES, COMMUNITY_SESSION_TYPES } from '../../data/Constants';
import { Card } from '../ui';
import { useDailyPlan } from '../../hooks/useDailyPlan';
import { useActionProgress } from '../../hooks/useActionProgress';
import { useLeaderProfile } from '../../hooks/useLeaderProfile';
import { useCoachingRegistrations, REGISTRATION_STATUS } from '../../hooks/useCoachingRegistrations';
import UniversalResourceViewer from '../ui/UniversalResourceViewer';
import CoachingActionItem from '../coaching/CoachingActionItem';
import SessionPickerModal from '../coaching/SessionPickerModal';
import { doc, getDoc, updateDoc, deleteField, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { useAppServices } from '../../services/useAppServices';
import { CONTENT_COLLECTIONS } from '../../services/contentService';
import LeaderProfileFormSimple from '../profile/LeaderProfileFormSimple';
import BaselineAssessmentSimple from '../screens/developmentplan/BaselineAssessmentSimple';
import NotificationPreferencesWidget from './NotificationPreferencesWidget';
import FoundationCommitmentWidget from './FoundationCommitmentWidget';
import ConditioningTutorialWidget from './ConditioningTutorialWidget';
import { VideoSeriesPlayer } from '../video';
import LeaderCertificateViewer from '../coaching/LeaderCertificateViewer';

// Session type labels for display in user-facing UI
const COACHING_SESSION_LABELS = {
  [SESSION_TYPES.OPEN_GYM]: { label: 'Open Gym Session', description: 'Drop-in feedback session', icon: '🏋️' },
  [SESSION_TYPES.LEADER_CIRCLE]: { label: 'Leader Circle', description: 'Peer discussion group', icon: '👥' },
  [SESSION_TYPES.WORKSHOP]: { label: 'Workshop', description: 'Structured learning session', icon: '📚' },
  [SESSION_TYPES.LIVE_WORKOUT]: { label: 'Live Workout', description: 'Quick skill practice', icon: '⚡' },
  [SESSION_TYPES.ONE_ON_ONE]: { label: '1:1 Coaching', description: 'Personal coaching session', icon: '🎯' }
};

const COMMUNITY_SESSION_LABELS = {
  [COMMUNITY_SESSION_TYPES.LEADER_CIRCLE]: { label: 'Leader Circle', description: 'Peer discussion group', icon: '👥' },
  [COMMUNITY_SESSION_TYPES.COMMUNITY_EVENT]: { label: 'Community Event', description: 'Live networking event', icon: '🎉' },
  [COMMUNITY_SESSION_TYPES.ACCOUNTABILITY_POD]: { label: 'Accountability Pod', description: 'Small group check-in', icon: '🤝' },
  [COMMUNITY_SESSION_TYPES.MASTERMIND]: { label: 'Mastermind', description: 'Expert-led group session', icon: '🧠' },
  [COMMUNITY_SESSION_TYPES.NETWORKING]: { label: 'Networking', description: 'Casual networking session', icon: '🌐' }
};

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
  
  // Session picker modals
  const [showSessionPicker, setShowSessionPicker] = useState(false);
  const [sessionPickerItem, setSessionPickerItem] = useState(null);
  const [showCommunitySessionPicker, setShowCommunitySessionPicker] = useState(false);
  const [communitySessionPickerItem, setCommunitySessionPickerItem] = useState(null);
  
  // Leader Certification viewer
  const [showCertificateViewer, setShowCertificateViewer] = useState(false);
  const [certificationMilestone, setCertificationMilestone] = useState(null);
  
  // Prep Complete expanded state (default collapsed when all done)
  const [prepExpanded, setPrepExpanded] = useState(false);
  const [exploreExpanded, setExploreExpanded] = useState(false);
  
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
  const { 
    registrations: coachingRegistrationsList,
    getRegistrationForCoachingItem 
  } = useCoachingRegistrations();
  
  // Leader Profile completion tracking (for auto-check in Pre-Start)
  const { isComplete: leaderProfileComplete } = useLeaderProfile();
  
  // Baseline Assessment completion tracking - use developmentPlanData directly for real-time updates
  const baselineAssessmentComplete = useMemo(() => {
    const assessmentHistory = developmentPlanData?.assessmentHistory;
    return assessmentHistory && assessmentHistory.length > 0;
  }, [developmentPlanData?.assessmentHistory]);
  
  // Notification Setup completion tracking
  // Must use prepStatus.notifications (set explicitly when user completes the setup form)
  // NOT notificationSettings.strategy (which can be set by defaults from other flows)
  // Initialize from user prop to avoid race condition
  const [notificationSetupComplete, setNotificationSetupComplete] = useState(
    user?.prepStatus?.notifications === true
  );
  useEffect(() => {
    // Re-check from Firestore when modal closes or user changes
    const checkNotificationSettings = async () => {
      if (!db || !user?.uid) return;
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          // Only mark complete if user explicitly completed notification setup
          setNotificationSetupComplete(data.prepStatus?.notifications === true);
        }
      } catch (error) {
        console.warn('Could not check notification settings:', error);
      }
    };
    checkNotificationSettings();
  }, [db, user?.uid, showNotificationModal]); // Re-check when modal closes
  
  // Also sync from user prop when it changes
  useEffect(() => {
    if (user?.prepStatus?.notifications === true) {
      setNotificationSetupComplete(true);
    }
  }, [user?.prepStatus?.notifications]);
  
  // Foundation Commitment completion tracking
  // Initialize from user prop to avoid race condition
  const [foundationCommitmentComplete, setFoundationCommitmentComplete] = useState(
    user?.prepStatus?.foundationCommitment === true
  );
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
  
  // Sync from user prop when it changes
  useEffect(() => {
    if (user?.prepStatus?.foundationCommitment === true) {
      setFoundationCommitmentComplete(true);
    }
  }, [user?.prepStatus?.foundationCommitment]);
  
  // Conditioning Tutorial completion tracking
  // Initialize from user prop to avoid race condition
  const [conditioningTutorialComplete, setConditioningTutorialComplete] = useState(
    user?.prepStatus?.conditioningTutorial === true
  );
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
  
  // Sync from user prop when it changes
  useEffect(() => {
    if (user?.prepStatus?.conditioningTutorial === true) {
      setConditioningTutorialComplete(true);
    }
  }, [user?.prepStatus?.conditioningTutorial]);
  
  // Video Series completion tracking (check prepStatus.videoSeries)
  const videoSeriesComplete = useMemo(() => {
    return user?.prepStatus?.videoSeries === true;
  }, [user?.prepStatus?.videoSeries]);
  
  // Video series duration data (fetched on demand)
  const [videoSeriesDurations, setVideoSeriesDurations] = useState({});
  
  // Interactive content duration data (fetched from content_library)
  const [interactiveDurations, setInteractiveDurations] = useState({});
  
  // Progress tracking
  const { 
    completeItem, 
    uncompleteItem, 
    // skipItem, 
    getItemProgress,
    getCarriedOverItems,
    progressData
  } = actionProgress;

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
      let handlerType = action.handlerType || '';
      
      // FAILSAFE: Standardize handlerType (replace underscore with dash)
      if (handlerType) {
        handlerType = handlerType.replace('_', '-').toLowerCase();
      }

      // Get label for inference
      const labelLower = (action.label || action.title || '').toLowerCase();

      // FAILSAFE: Attempt to infer handlerType from ID, resourceId, or label
      if (!handlerType) {
        if (action.id?.includes('leader-profile') || action.resourceId === 'interactive-leader-profile' || labelLower.includes('leader profile')) {
          handlerType = 'leader-profile';
        } else if (action.id?.includes('baseline-assessment') || action.resourceId === 'interactive-baseline-assessment' || labelLower.includes('baseline') || labelLower.includes('skills assessment')) {
          handlerType = 'baseline-assessment';
        } else if (action.id?.includes('notification-setup') || action.resourceId === 'interactive-notification-setup' || labelLower.includes('setup notification')) {
          handlerType = 'notification-setup';
        } else if (action.id?.includes('conditioning-tutorial') || action.resourceId === 'interactive-conditioning-tutorial' || labelLower.includes('conditioning tutorial')) {
          handlerType = 'conditioning-tutorial';
        } else if (action.id?.includes('foundation-commitment') || action.resourceId === 'interactive-foundation-commitment' || labelLower.includes('foundation expectation') || labelLower.includes('foundation commitment')) {
          handlerType = 'foundation-commitment';
        } else if (action.resourceType === 'video_series') {
          handlerType = 'video-series';
        }
      }
      
      // HOTFIX: Fix Review Onboarding Guide having wrong handlerType (likely clonied from Leader Profile)
      // This ensures it opens the link instead of the profile modal
      // Check both case-sensitive and case-insensitive to be safe
      // (labelLower already defined above)
      
      // Expanded match to be extremely safe - catch any variation
      // BUT exclude Leader Profile explicitly to prevent false positives
      if ((labelLower.includes('onboarding guide') || labelLower.includes('review onboarding')) && 
          !labelLower.includes('leader profile') && !labelLower.includes('baseline')) {
        // UNCONDITIONALLY clear handlerType if it looks like leader-profile
        // This prevents the Leader Profile modal from hijacking the click
        if (handlerType && (handlerType.includes('leader') || handlerType.includes('profile'))) {
           handlerType = '';
        }
        // Force clear strict match too just in case
        if (handlerType === 'leader-profile') handlerType = '';
      }

      const isInteractive = ['leader-profile', 'baseline-assessment', 'notification-setup', 'foundation-commitment', 'conditioning-tutorial'].includes(handlerType);
      
      // Auto-complete status for interactive items
      let autoComplete = undefined;
      if (handlerType === 'leader-profile') autoComplete = leaderProfileComplete;
      else if (handlerType === 'baseline-assessment') autoComplete = baselineAssessmentComplete;
      else if (handlerType === 'notification-setup') autoComplete = notificationSetupComplete;
      else if (handlerType === 'foundation-commitment') autoComplete = foundationCommitmentComplete;
      else if (handlerType === 'conditioning-tutorial') autoComplete = conditioningTutorialComplete;
      else if (handlerType === 'video-series') autoComplete = videoSeriesComplete;
      
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
        duration: action.duration,
        // Interactive item support
        isInteractive,
        autoComplete,
        handlerType,
        // Prep section for splitting Onboarding vs Session 1 (default to 'onboarding' for backwards compatibility)
        prepSection: action.prepSection || 'onboarding'
      };
    });
  }, [leaderProfileComplete, baselineAssessmentComplete, notificationSetupComplete, foundationCommitmentComplete, conditioningTutorialComplete, videoSeriesComplete]);

  // Combine all actionable items from Daily Plan
  const allActions = useMemo(() => {
    if (!dailyPlan || dailyPlan.length === 0) return [];

    // Pre-Start phase = COMPLETION-BASED (not day-based or time-based)
    // Two sections: Required Prep and Explore (optional)
    if (currentPhase?.id === 'pre-start') {
      // Get prep phase actions from daily plan (progress-based, not day-based)
      // EXCLUDE explore-config - those are handled separately
      // If onboarding-config and session1-config exist, skip legacy day-* docs to avoid duplicates
      const hasOnboardingConfig = dailyPlan.some(d => d.id === 'onboarding-config' && d.phase === 'pre-start');
      const hasSession1Config = dailyPlan.some(d => d.id === 'session1-config' && d.phase === 'pre-start');
      const prepDays = dailyPlan.filter(d => {
        if (d.phase !== 'pre-start') return false;
        if (d.id === 'explore-config') return false;
        if (hasOnboardingConfig && hasSession1Config && /^day-\d+$/.test(d.id)) return false;
        return true;
      });
      
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
    
    // =================== FOUNDATION PHASE (MILESTONE-BASED) ===================
    // Foundation uses 5 gated milestones instead of 8 weeks
    // Milestones are stored as milestone-1, milestone-2, etc. in daily_plan_v1
    if (currentPhase?.id === 'start') {
      // Determine current milestone from user's milestone progress
      // Current milestone = first milestone that is NOT signed off (or 6 if all signed = graduated)
      let currentMilestone = 1;
      const milestoneProgress = user?.milestoneProgress || {};
      let signedOffCount = 0;
      for (let m = 1; m <= 5; m++) {
        const mData = milestoneProgress[`milestone_${m}`] || {};
        if (mData.signedOff) {
          currentMilestone = m + 1;
          signedOffCount++;
        } else {
          break;
        }
      }
      
      // Check if graduated (all 5 milestones signed off)
      const isGraduated = signedOffCount === 5;
      
      // Cap at 5 for showing milestone content (graduated users still see milestone 5 content)
      const displayMilestone = Math.min(currentMilestone, 5);
      
      // Look for milestone document in dailyPlan
      const milestoneDoc = dailyPlan.find(d => d.id === `milestone-${displayMilestone}`);
      
      // Initialize arrays for all action types
      let certificateActions = [];
      let milestoneActions = [];
      let coachingActions = [];
      let communityActions = [];
      
      // Milestone names mapping
      const milestoneNames = {
        1: 'Foundation Basics',
        2: 'Communication Mastery',
        3: 'Team Leadership',
        4: 'Strategic Thinking',
        5: 'Executive Presence'
      };
      
      // CHECK FOR UNVIEWED CERTIFICATES
      // If graduated and milestone 5 certificate not viewed, show GRADUATION certificate
      if (isGraduated) {
        const milestone5Data = milestoneProgress['milestone_5'] || {};
        if (!milestone5Data.certificateViewed) {
          certificateActions.push({
            id: 'view-certificate-graduation',
            type: 'certificate',
            displayType: 'certificate',
            label: '🎓 View Your Graduation Certificate',
            description: 'Congratulations! You have completed the Foundation Program!',
            icon: '🎓',
            required: false,
            category: 'Certificate',
            fromDailyPlan: true,
            dayId: 'graduation',
            handlerType: 'view-certificate',
            isViewCertificate: true,
            certificateMilestone: 5,
            certificateMilestoneName: 'Foundation Program Graduation',
            isGraduation: true
          });
        }
      } else if (currentMilestone > 1) {
        // Not graduated - check for previous milestone certificate
        const prevMilestoneData = milestoneProgress[`milestone_${currentMilestone - 1}`] || {};
        if (prevMilestoneData.signedOff && !prevMilestoneData.certificateViewed) {
          const prevMilestoneName = milestoneNames[currentMilestone - 1] || `Milestone ${currentMilestone - 1}`;
          
          certificateActions.push({
            id: `view-certificate-milestone-${currentMilestone - 1}`,
            type: 'certificate',
            displayType: 'certificate',
            label: `🎉 View Your ${prevMilestoneName} Certificate`,
            description: `Congratulations! Print or save your certificate for ${prevMilestoneName}`,
            icon: '🏆',
            required: false, // Viewing is optional but encouraged
            category: 'Certificate',
            fromDailyPlan: true,
            dayId: `milestone-${displayMilestone}`,
            handlerType: 'view-certificate',
            isViewCertificate: true,
            certificateMilestone: currentMilestone - 1,
            certificateMilestoneName: prevMilestoneName
          });
        }
      }
      
      // If graduated, don't show milestone content - just the graduation certificate
      if (isGraduated) {
        return [...certificateActions];
      }
      
      // Get regular actions from milestone if configured
      if (milestoneDoc?.actions && milestoneDoc.actions.length > 0) {
        milestoneActions = normalizeDailyActions(
          milestoneDoc.actions, 
          `milestone-${displayMilestone}`, 
          displayMilestone
        ).filter(action => action.type !== 'daily_rep');
      }
      
      // Generate coaching session actions from milestone's coachingSessionTypes
      // These require 3 steps: Schedule → Attend → Get Certified by facilitator
      if (milestoneDoc?.coachingSessionTypes && milestoneDoc.coachingSessionTypes.length > 0) {
        coachingActions = milestoneDoc.coachingSessionTypes.map((sessionType) => {
          const typeInfo = COACHING_SESSION_LABELS[sessionType] || { label: 'Coaching Session', description: '', icon: '🎯' };
          return {
            id: `milestone-${displayMilestone}-coaching-${sessionType}`,
            type: 'coaching',
            displayType: 'coaching',
            sessionType: sessionType, // Pass to SessionPickerModal for filtering
            label: typeInfo.label,
            description: typeInfo.description,
            icon: typeInfo.icon,
            required: true,
            category: 'Coaching',
            fromDailyPlan: true,
            dayId: `milestone-${displayMilestone}`,
            handlerType: 'session-picker',
            isSessionPicker: true,
            requiresCertification: true, // Must be certified by facilitator to complete
            milestoneId: displayMilestone
          };
        });
      }
      
      // Generate community session actions from milestone's communitySessionTypes
      if (milestoneDoc?.communitySessionTypes && milestoneDoc.communitySessionTypes.length > 0) {
        communityActions = milestoneDoc.communitySessionTypes.map((sessionType) => {
          const typeInfo = COMMUNITY_SESSION_LABELS[sessionType] || { label: 'Community Session', description: '', icon: '🎉' };
          return {
            id: `milestone-${displayMilestone}-community-${sessionType}`,
            type: 'community',
            displayType: 'community',
            sessionType: sessionType, // Pass to CommunitySessionPickerModal for filtering
            label: `Join: ${typeInfo.label}`,
            description: typeInfo.description,
            icon: typeInfo.icon,
            required: false,
            optional: true,
            category: 'Community',
            fromDailyPlan: true,
            dayId: `milestone-${displayMilestone}`,
            handlerType: 'community-session-picker',
            isSessionPicker: true
          };
        });
      }
      
      // NOTE: Leader Certification is handled by the facilitator in Admin > Sign-Off Queue
      // Users don't see a "waiting for certification" item - they only see the certificate
      // to view/print AFTER the facilitator signs off (shown at start of next milestone)
      
      // Return combined actions: CERTIFICATE first (from previous milestone), regular actions, coaching, community
      // NO certification gate shown to user - it's handled by facilitator
      return [...certificateActions, ...milestoneActions, ...coachingActions, ...communityActions];
    }
    
    // =================== ASCENT PHASE (WEEK-BASED) ===================
    // Post phase still uses week-based structure
    // Calculate day range for current week
    const startDay = (currentWeekNumber - 1) * 7 + 1;
    const endDay = currentWeekNumber * 7;
    
    // Filter dailyPlan for days in this week range
    const phaseStartDbDay = 71; // Ascent starts at day 71
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
    
  }, [dailyPlan, currentPhase?.id, currentWeekNumber, prepRequirementsComplete?.allComplete, normalizeDailyActions, user?.milestoneProgress]);

  // Calculate current milestone info for display
  const currentMilestoneInfo = useMemo(() => {
    if (currentPhase?.id !== 'start') return null;
    
    const milestoneProgress = user?.milestoneProgress || {};
    let currentMilestone = 1;
    let signedOffCount = 0;
    for (let m = 1; m <= 5; m++) {
      const mData = milestoneProgress[`milestone_${m}`] || {};
      if (mData.signedOff) {
        currentMilestone = m + 1;
        signedOffCount++;
      } else {
        break;
      }
    }
    
    // Check if graduated
    const isGraduated = signedOffCount === 5;
    
    if (isGraduated) {
      return {
        number: 5,
        name: 'Foundation Program Completed! 🎓',
        isGraduated: true
      };
    }
    
    const milestoneNames = {
      1: 'Foundation Basics',
      2: 'Communication Mastery',
      3: 'Team Leadership',
      4: 'Strategic Thinking',
      5: 'Executive Presence'
    };
    
    return {
      number: currentMilestone,
      name: milestoneNames[currentMilestone] || `Milestone ${currentMilestone}`,
      isGraduated: false
    };
  }, [currentPhase?.id, user?.milestoneProgress]);

  // Get carried over items (including incomplete prep phase items AND all prior weeks)
  const carriedOverItems = useMemo(() => {
    // No carryover in Prep Phase
    if (currentPhase?.id === 'pre-start') return [];
    
    const carriedItems = [];
    const dailyProgress = userState?.dailyProgress || {};
    
    // Helper function to check if an action is completed
    const isActionCompleted = (actionId, actionLabel) => {
      // Check in dailyProgress
      const completedInDailyProgress = Object.values(dailyProgress).some(
        dp => dp?.itemsCompleted?.includes(actionId)
      );
      if (completedInDailyProgress) return true;
      
      // Also check in actionProgress by ID
      const progress = getItemProgress(actionId);
      if (progress?.status === 'completed') return true;
      
      // Fallback: check actionProgress by EXACT label match + prep-phase context.
      // Action IDs change when admin edits content, so match the full label exactly.
      // Only match completed prep items (weekNumber null or <= 0).
      if (actionLabel && progressData) {
        const actionLabelNorm = actionLabel.toLowerCase().trim();
        const matchByLabel = Object.values(progressData).some(p => {
          if (p?.status !== 'completed' || !p?.label) return false;
          // Only consider prep-phase entries (weekNumber null or <= 0)
          if (p.weekNumber != null && p.weekNumber > 0) return false;
          if (p.originalWeek != null && p.originalWeek > 0) return false;
          return p.label.toLowerCase().trim() === actionLabelNorm;
        });
        if (matchByLabel) return true;
      }
      
      return false;
    };
    
    // Get explicitly carried over items from actionProgress
    const explicitCarryOver = getCarriedOverItems(currentWeekNumber);
    carriedItems.push(...explicitCarryOver);
    
    // Check for incomplete prep phase items (interactive items)
    // These should carry over to Start phase if not completed
    // SKIP if all prep requirements are already complete - don't show completed phases
    if (currentPhase?.id === 'start' && !prepRequirementsComplete?.allComplete) {
      // Check for incomplete prep phase daily plan items (including interactive items)
      // Include session1-config items (Watch Session 1 Video, Setup Notifications) for carryover
      // Exclude only onboarding-config (duplicate of day-001 items) and explore-config
      const prepDays = dailyPlan.filter(d => 
        d.phase === 'pre-start' && 
        d.id !== 'onboarding-config' && 
        d.id !== 'explore-config'
      );
      
      prepDays.forEach(day => {
        if (day.actions && Array.isArray(day.actions)) {
          day.actions.forEach((action, idx) => {
            // Skip if not required
            if (action.optional || action.required === false) return;
            
            // Check if completed
            const actionId = action.id || `daily-${day.id}-${(action.label || '').toLowerCase().replace(/\s+/g, '-').substring(0, 20)}-${idx}`;
            
            // Check interactive items by handlerType
            let handlerType = action.handlerType || '';
            
            // Standardize handlerType if present
            if (handlerType) {
              handlerType = handlerType.replace('_', '-').toLowerCase();
            } else {
              // Failsafe: Infer handlerType from ID, resourceId, or label
              const labelLower = (action.label || '').toLowerCase();
              if (action.id?.includes('leader-profile') || action.resourceId === 'interactive-leader-profile' || labelLower.includes('leader profile')) {
                handlerType = 'leader-profile';
              } else if (action.id?.includes('baseline-assessment') || action.resourceId === 'interactive-baseline-assessment' || labelLower.includes('baseline') || labelLower.includes('skills assessment')) {
                handlerType = 'baseline-assessment';
              } else if (action.id?.includes('notification-setup') || action.resourceId === 'interactive-notification-setup' || labelLower.includes('setup notification')) {
                handlerType = 'notification-setup';
              } else if (action.id?.includes('conditioning-tutorial') || action.resourceId === 'interactive-conditioning-tutorial' || labelLower.includes('conditioning tutorial')) {
                handlerType = 'conditioning-tutorial';
              } else if (action.id?.includes('foundation-commitment') || action.resourceId === 'interactive-foundation-commitment' || labelLower.includes('foundation expectation') || labelLower.includes('foundation commitment')) {
                handlerType = 'foundation-commitment';
              } else if (action.resourceType === 'video_series') {
                handlerType = 'video-series';
              }
            }
            
            let isComplete = false;
            
            if (handlerType === 'leader-profile') {
              isComplete = leaderProfileComplete;
            } else if (handlerType === 'baseline-assessment') {
              isComplete = baselineAssessmentComplete;
            } else if (handlerType === 'notification-setup') {
              isComplete = notificationSetupComplete;
            } else if (handlerType === 'foundation-commitment') {
              isComplete = foundationCommitmentComplete;
            } else if (handlerType === 'conditioning-tutorial') {
              isComplete = conditioningTutorialComplete;
            } else if (handlerType === 'video-series') {
              isComplete = videoSeriesComplete;
            } else {
              isComplete = isActionCompleted(actionId, action.label);
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
                isInteractive: ['leader-profile', 'baseline-assessment', 'notification-setup', 'foundation-commitment', 'conditioning-tutorial'].includes(handlerType),
                handlerType,
                estimatedMinutes: action.estimatedMinutes,
                duration: action.duration
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
  }, [currentPhase?.id, currentWeekNumber, getCarriedOverItems, getItemProgress, progressData, leaderProfileComplete, baselineAssessmentComplete, notificationSetupComplete, foundationCommitmentComplete, conditioningTutorialComplete, videoSeriesComplete, dailyPlan, userState?.dailyProgress]);

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
  // Filter out prep items when all prep is complete (completed phases shouldn't carry forward)
  // Also filter out any individually completed items
  const displayedCarriedOverItems = useMemo(() => {
    const baseItems = preservedCarriedOver.length > 0 ? preservedCarriedOver : carriedOverItems;
    
    // If all prep is complete, filter out ALL prep items
    if (prepRequirementsComplete?.allComplete) {
      return baseItems.filter(item => 
        item.fromWeek !== 0 && 
        item.category !== 'Preparation' && 
        item.category !== 'Onboarding'
      );
    }
    
    // Even if not all prep is complete, filter out items that ARE individually complete
    // This handles cases where an item is complete but wasn't detected properly initially
    return baseItems.filter(item => {
      // Check if this specific item is complete
      if (item.isInteractive) {
        if (item.handlerType === 'leader-profile') return !leaderProfileComplete;
        if (item.handlerType === 'baseline-assessment') return !baselineAssessmentComplete;
        if (item.handlerType === 'notification-setup') return !notificationSetupComplete;
        if (item.handlerType === 'foundation-commitment') return !foundationCommitmentComplete;
        if (item.handlerType === 'conditioning-tutorial') return !conditioningTutorialComplete;
        if (item.handlerType === 'video-series') return !videoSeriesComplete;
      }
      // Check prepRequirementsComplete.items for this item
      if (prepRequirementsComplete?.items) {
        const prepItem = prepRequirementsComplete.items.find(p => 
          p.id === item.id || 
          (p.label && item.label && p.label.toLowerCase() === item.label.toLowerCase())
        );
        if (prepItem?.complete) return false; // Filter out - it's complete
      }
      return true; // Keep - not found or not complete
    });
  }, [preservedCarriedOver, carriedOverItems, prepRequirementsComplete?.allComplete, prepRequirementsComplete?.items, leaderProfileComplete, baselineAssessmentComplete, notificationSetupComplete, foundationCommitmentComplete, conditioningTutorialComplete, videoSeriesComplete]);

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

  // Fetch durations for interactive items from content_library
  const fetchedInteractiveRef = useRef(new Set());
  
  useEffect(() => {
    const fetchInteractiveDurations = async () => {
      if (!db || !allActions.length) return;
      
      // Find interactive items that haven't been fetched yet
      const interactiveIds = allActions
        .filter(a => a.isInteractive && a.resourceId && !fetchedInteractiveRef.current.has(a.resourceId))
        .map(a => a.resourceId);
      
      if (interactiveIds.length === 0) return;
      
      // Mark as fetched immediately to prevent re-fetching
      interactiveIds.forEach(id => fetchedInteractiveRef.current.add(id));
      
      const newDurations = {};
      
      for (const resourceId of interactiveIds) {
        try {
          const contentRef = doc(db, 'content_library', resourceId);
          const contentSnap = await getDoc(contentRef);
          if (contentSnap.exists()) {
            const data = contentSnap.data();
            // estimatedTime is stored as number in minutes
            if (data.estimatedTime) {
              newDurations[resourceId] = parseInt(data.estimatedTime, 10) || data.estimatedTime;
            }
          }
        } catch (error) {
          console.warn('Could not fetch interactive content duration:', resourceId, error);
        }
      }
      
      if (Object.keys(newDurations).length > 0) {
        setInteractiveDurations(prev => ({ ...prev, ...newDurations }));
      }
    };
    
    fetchInteractiveDurations();
  }, [db, allActions]);

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

  // Dynamic title - context-aware for phase
  // When in 'start' phase but only showing carried-over prep items (no milestone content), 
  // show "Preparation Phase" instead of "Current Milestone"
  const widgetTitle = useMemo(() => {
    if (currentPhase?.id === 'pre-start') {
      return "Prep Actions";
    }
    if (currentPhase?.id === 'start') {
      // If we only have carried-over prep items and no milestone content, show "Preparation Phase"
      const hasNoMilestoneContent = allActions.length === 0;
      const hasCarriedOverItems = displayedCarriedOverItems.length > 0;
      if (hasNoMilestoneContent && hasCarriedOverItems) {
        return "Preparation Phase";
      }
      return "Current Milestone";
    }
    return "This Week's Actions";
  }, [currentPhase?.id, allActions.length, displayedCarriedOverItems.length]);

  // Separate actions into Required Prep and Additional Prep for prep phase
  // Uses the `required` and `optional` flags from the daily plan data
  // Separate prep actions from the 3 config documents
  // onboarding-config → onboardingActions
  // session1-config → session1Actions  
  // explore-config → exploreActions (handled separately)
  const onboardingActions = useMemo(() => {
    if (currentPhase?.id !== 'pre-start') return [];
    
    // Primary: Read from onboarding-config document
    const onboardingConfig = dailyPlan?.find(d => d.id === 'onboarding-config');
    if (onboardingConfig?.actions && onboardingConfig.actions.length > 0) {
      // Filter out hidden actions before normalizing
      const visibleActions = onboardingConfig.actions.filter(a => a.hidden !== true);
      return normalizeDailyActions(visibleActions, 'onboarding-config', -2);
    }
    
    // Fallback: Filter from legacy prep days by prepSection field
    return allActions.filter(action => {
      if (action.dayId === 'explore-config' || action.dayId === 'session1-config') return false;
      if (action.prepSection === 'explore' || action.prepSection === 'session1') return false;
      // Include items with no prepSection OR prepSection='onboarding'
      return !action.prepSection || action.prepSection === 'onboarding';
    });
  }, [currentPhase?.id, dailyPlan, allActions, normalizeDailyActions]);

  const session1Actions = useMemo(() => {
    if (currentPhase?.id !== 'pre-start') return [];
    
    // Primary: Read from session1-config document
    const session1Config = dailyPlan?.find(d => d.id === 'session1-config');
    if (session1Config?.actions && session1Config.actions.length > 0) {
      // Filter out hidden actions before normalizing
      const visibleActions = session1Config.actions.filter(a => a.hidden !== true);
      return normalizeDailyActions(visibleActions, 'session1-config', -1);
    }
    
    // Fallback: Filter from legacy prep days by prepSection field
    return allActions.filter(action => {
      if (action.dayId === 'explore-config' || action.dayId === 'onboarding-config') return false;
      return action.prepSection === 'session1';
    });
  }, [currentPhase?.id, dailyPlan, allActions, normalizeDailyActions]);

  // requiredPrepActions = combined onboarding + session1 for completion tracking
  const requiredPrepActions = useMemo(() => {
    return [...onboardingActions, ...session1Actions];
  }, [onboardingActions, session1Actions]);

  // Get explore items from legacy prep days that have prepSection='explore'
  const exploreActionsFromLegacy = useMemo(() => {
    if (currentPhase?.id !== 'pre-start') return [];
    return allActions.filter(action => {
      if (action.dayId === 'explore-config' || action.dayId === 'onboarding-config' || action.dayId === 'session1-config') return false;
      return action.prepSection === 'explore';
    });
  }, [currentPhase?.id, allActions]);

  // Calculate local prep completion count using widget's state values
  // This syncs the counter with the visual checkboxes in ActionItem
  const localPrepCompletion = useMemo(() => {
    if (currentPhase?.id !== 'pre-start') return { 
      completedCount: 0, totalCount: 0, allComplete: false,
      onboardingCount: 0, onboardingTotal: 0, onboardingComplete: false,
      session1Count: 0, session1Total: 0, session1Complete: false
    };
    
    // Helper to check if an action is completed - uses prepRequirementsComplete for unified tracking
    const isActionComplete = (action) => {
      // First, try to find this action in prepRequirementsComplete (for unified tracking)
      // This ensures the counter matches the DevelopmentJourneyWidget
      if (Array.isArray(prepRequirementsComplete?.items)) {
        const itemLabel = (action.label || '').toLowerCase().trim();
        const prepItem = prepRequirementsComplete.items.find(p => {
          // 1. Match by exact ID first (most reliable)
          if (action.id && p.id && action.id === p.id) return true;
          // 2. Match by handlerType (for interactive items)
          if (action.handlerType && p.handlerType && action.handlerType === p.handlerType) return true;
          // 3. Match by EXACT label (case-insensitive, trimmed) - NOT substring
          const pLabel = (p.label || '').toLowerCase().trim();
          if (pLabel && itemLabel && pLabel === itemLabel) return true;
          return false;
        });
        if (prepItem) {
          return prepItem.complete || false;
        }
      }
      
      // Fallback: Infer handlerType from ID, resourceId, or label
      let handlerType = action.handlerType || '';
      const labelLower = (action.label || '').toLowerCase();
      if (handlerType) {
        handlerType = handlerType.replace('_', '-').toLowerCase();
      } else {
        if (action.id?.includes('leader-profile') || action.resourceId === 'interactive-leader-profile' || labelLower.includes('leader profile')) handlerType = 'leader-profile';
        else if (action.id?.includes('baseline-assessment') || action.resourceId === 'interactive-baseline-assessment' || labelLower.includes('baseline') || labelLower.includes('skills assessment')) handlerType = 'baseline-assessment';
        else if (action.id?.includes('notification-setup') || action.resourceId === 'interactive-notification-setup' || labelLower.includes('setup notification')) handlerType = 'notification-setup';
        else if (action.id?.includes('conditioning-tutorial') || action.resourceId === 'interactive-conditioning-tutorial' || labelLower.includes('conditioning tutorial')) handlerType = 'conditioning-tutorial';
        else if (action.id?.includes('foundation-commitment') || action.resourceId === 'interactive-foundation-commitment' || labelLower.includes('foundation expectation') || labelLower.includes('foundation commitment')) handlerType = 'foundation-commitment';
        else if (action.resourceType === 'video_series') handlerType = 'video-series';
      }
      
      // Fallback: Interactive item checks
      if (handlerType === 'leader-profile') return leaderProfileComplete;
      if (handlerType === 'baseline-assessment') return baselineAssessmentComplete;
      if (handlerType === 'notification-setup') return notificationSetupComplete;
      if (handlerType === 'foundation-commitment') return foundationCommitmentComplete;
      if (handlerType === 'conditioning-tutorial') return conditioningTutorialComplete;
      if (handlerType === 'video-series') return videoSeriesComplete;
      
      // Fallback: Standard completion check
      const progress = getItemProgress(action.id);
      return progress.status === 'completed' || completedItems.includes(action.id);
    };
    
    // Calculate onboarding completion
    const onboardingCount = onboardingActions.filter(isActionComplete).length;
    const onboardingTotal = onboardingActions.length;
    const onboardingComplete = onboardingTotal === 0 || onboardingCount === onboardingTotal;
    
    // Calculate session1 completion
    const session1Count = session1Actions.filter(isActionComplete).length;
    const session1Total = session1Actions.length;
    const session1Complete = session1Total === 0 || session1Count === session1Total;
    
    // Overall totals
    const completedCount = onboardingCount + session1Count;
    const totalCount = onboardingTotal + session1Total;
    const allComplete = totalCount > 0 && completedCount === totalCount;
    
    return { 
      completedCount, totalCount, allComplete,
      onboardingCount, onboardingTotal, onboardingComplete,
      session1Count, session1Total, session1Complete
    };
  }, [currentPhase?.id, onboardingActions, session1Actions, prepRequirementsComplete, leaderProfileComplete, baselineAssessmentComplete, notificationSetupComplete, foundationCommitmentComplete, conditioningTutorialComplete, videoSeriesComplete, getItemProgress, completedItems]);
  
  const additionalPrepActions = useMemo(() => {
    if (currentPhase?.id !== 'pre-start') return [];
    // Explore items come ONLY from the explore-config document
    // This is what the admin configures in Daily Plan Manager > Explore section
    const exploreConfig = dailyPlan?.find(d => d.id === 'explore-config');
    if (!exploreConfig?.actions || exploreConfig.actions.length === 0) return [];
    
    return exploreConfig.actions.map((action, idx) => {
      const label = action.label || 'Explore Action';
      const labelLower = label.toLowerCase();
      
      // Infer handlerType from ID, resourceId, or label
      let handlerType = action.handlerType || '';
      if (handlerType) {
        handlerType = handlerType.replace('_', '-').toLowerCase();
      } else {
        if (action.id?.includes('leader-profile') || action.resourceId === 'interactive-leader-profile' || labelLower.includes('leader profile')) {
          handlerType = 'leader-profile';
        } else if (action.id?.includes('baseline-assessment') || action.resourceId === 'interactive-baseline-assessment' || labelLower.includes('baseline') || labelLower.includes('skills assessment')) {
          handlerType = 'baseline-assessment';
        } else if (action.id?.includes('notification-setup') || action.resourceId === 'interactive-notification-setup' || labelLower.includes('setup notification')) {
          handlerType = 'notification-setup';
        } else if (action.id?.includes('conditioning-tutorial') || action.resourceId === 'interactive-conditioning-tutorial' || labelLower.includes('conditioning tutorial')) {
          handlerType = 'conditioning-tutorial';
        } else if (action.id?.includes('foundation-commitment') || action.resourceId === 'interactive-foundation-commitment' || labelLower.includes('foundation expectation') || labelLower.includes('foundation commitment')) {
          handlerType = 'foundation-commitment';
        }
      }
      
      const isInteractive = ['leader-profile', 'baseline-assessment', 'notification-setup', 'foundation-commitment', 'conditioning-tutorial'].includes(handlerType);
      
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
        estimatedMinutes: action.estimatedMinutes,
        handlerType,
        isInteractive
      };
    });
  }, [currentPhase?.id, dailyPlan]);

  // Combine explore-config items with prepSection='explore' items from legacy prep days
  const allExploreActions = useMemo(() => {
    return [...exploreActionsFromLegacy, ...additionalPrepActions];
  }, [exploreActionsFromLegacy, additionalPrepActions]);

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
           // Include original item properties for tracking (dayId, fromDailyPlan, label, category)
           // Preserve actionItemId (original item.id) separately since Firestore doc ID may differ
           let resourceData = { 
             id: contentSnap.id, 
             actionItemId: item.id, // Original action item ID for completion tracking
             resourceId: resourceId,
             ...data, 
             resourceType: data.type,
             // Preserve item tracking properties for completion
             dayId: item.dayId,
             fromDailyPlan: item.fromDailyPlan !== false, // Default to true for daily plan items
             label: item.label || data.title,
             category: item.category || data.category,
             carriedOver: item.carriedOver
           };
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
           
           // Auto-complete documents (PDFs, tools) when opened - they are "completed" by viewing
           // This applies to items like Onboarding Guide and similar resources
           if ((data.type === 'DOCUMENT' || data.type === 'TOOL') && item.fromDailyPlan) {
             const itemId = item.id;
             if (itemId && item.dayId) {
               toggleDailyItem(item.dayId, itemId, true);
               completeItem(itemId, {
                 currentWeek: currentWeekNumber,
                 weekNumber: currentWeekNumber,
                 category: item.category?.toLowerCase() || 'content',
                 label: item.label || data.title,
                 carriedOver: item.carriedOver || false
               });
             }
           }
        } else {
            // Fallback: If not in Firestore, use the URL from the item directly
            if (item.url) {
              setViewingResource({
                ...item,
                type: item.resourceType || item.type || 'document',
                url: item.url
              });
              // Auto-complete documents when opened (fallback path)
              const resourceType = (item.resourceType || item.type || '').toLowerCase();
              if ((resourceType === 'document' || resourceType === 'tool') && item.fromDailyPlan && item.id && item.dayId) {
                toggleDailyItem(item.dayId, item.id, true);
                completeItem(item.id, {
                  currentWeek: currentWeekNumber,
                  weekNumber: currentWeekNumber,
                  category: item.category?.toLowerCase() || 'content',
                  label: item.label,
                  carriedOver: item.carriedOver || false
                });
              }
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
      // Auto-complete documents when opened (direct URL path)
      const resourceType = (item.resourceType || item.type || '').toLowerCase();
      if ((resourceType === 'document' || resourceType === 'tool') && item.fromDailyPlan && item.id && item.dayId) {
        toggleDailyItem(item.dayId, item.id, true);
        completeItem(item.id, {
          currentWeek: currentWeekNumber,
          weekNumber: currentWeekNumber,
          category: item.category?.toLowerCase() || 'content',
          label: item.label,
          carriedOver: item.carriedOver || false
        });
      }
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
    
    // ========== SPECIAL HANDLING: Leader Certification (Final Milestone Gate) ==========
    // This is the LAST action in each milestone - requires facilitator certification + user acknowledgment
    if (item.isLeaderCertification) {
      const milestoneId = item.milestoneId;
      
      // Check if user has been certified for this milestone by looking at coaching registrations
      const certifiedRegistration = coachingRegistrationsList.find(r => 
        r.status === REGISTRATION_STATUS.CERTIFIED &&
        r.coachingItemId?.includes(`milestone-${milestoneId}`)
      );
      
      const isCertified = !!certifiedRegistration;
      const isAcknowledged = progress?.status === 'completed';
      
      // Get user name from profile or user object
      const userName = developmentPlanData?.leaderProfile?.preferredName || 
                       developmentPlanData?.leaderProfile?.name ||
                       user?.displayName || 
                       'Leader';
      
      const handleViewCertificate = () => {
        if (!isCertified) return;
        setCertificationMilestone({
          milestone: milestoneId,
          userName,
          certificationDate: certifiedRegistration?.certifiedAt?.toDate?.() || certifiedRegistration?.certifiedAt || new Date(),
          facilitatorName: certifiedRegistration?.certifiedBy || 'Program Facilitator',
          isAcknowledged
        });
        setShowCertificateViewer(true);
      };
      
      const handleAcknowledgeCertificate = async () => {
        // Mark the certification action as complete
        await completeItem(item.id, {
          currentWeek: currentWeekNumber,
          weekNumber: currentWeekNumber,
          category: 'certification',
          label: item.label,
          acknowledgedAt: new Date().toISOString()
        });
        setShowCertificateViewer(false);
      };
      
      return (
        <div 
          className={`group p-4 rounded-xl border transition-all ${
            isAcknowledged 
              ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-700 cursor-default'
              : isCertified
                ? 'bg-amber-50 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/30 dark:border-amber-700 dark:hover:bg-amber-900/40 cursor-pointer'
                : 'bg-slate-100 border-slate-200 dark:bg-slate-800/50 dark:border-slate-700 cursor-not-allowed opacity-60'
          }`}
          onClick={isCertified && !isAcknowledged ? handleViewCertificate : undefined}
        >
          {/* Header with icon and label */}
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isAcknowledged 
                ? 'bg-emerald-500' 
                : isCertified
                  ? 'bg-gradient-to-br from-amber-400 to-amber-600'
                  : 'bg-slate-300 dark:bg-slate-600'
            }`}>
              {isAcknowledged ? (
                <CheckCircle className="w-5 h-5 text-white" />
              ) : (
                <Trophy className="w-5 h-5 text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-bold ${
                isAcknowledged 
                  ? 'text-emerald-700 dark:text-emerald-400' 
                  : isCertified
                    ? 'text-amber-700 dark:text-amber-400'
                    : 'text-slate-500 dark:text-slate-400'
              }`}>
                {item.label}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {isAcknowledged 
                  ? '✓ Certificate acknowledged - Milestone complete!' 
                  : isCertified 
                    ? '🎉 You\'ve been certified! Click to view your certificate'
                    : '🔒 Complete all actions & get facilitator certification'
                }
              </p>
            </div>
            {isAcknowledged && (
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/40 px-1.5 py-0.5 rounded uppercase tracking-wider">
                Complete
              </span>
            )}
          </div>
          
          {/* Status indicator */}
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
              isAcknowledged
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                : isCertified
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                  : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
            }`}>
              {isAcknowledged ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5" />
                  Milestone {milestoneId} Complete
                </>
              ) : isCertified ? (
                <>
                  <Trophy className="w-3.5 h-3.5" />
                  View & Acknowledge Certificate
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5" />
                  Awaiting Certification
                </>
              )}
            </div>
          </div>
        </div>
      );
    }
    
    // ========== SPECIAL HANDLING: View Certificate (from previous milestone) ==========
    // This shows at the START of a new milestone when the previous one was signed off
    if (item.isViewCertificate) {
      const milestoneProgress = user?.milestoneProgress || {};
      const certMilestone = item.certificateMilestone;
      const certData = milestoneProgress[`milestone_${certMilestone}`] || {};
      const isViewed = certData.certificateViewed || false;
      
      const handleViewPreviousCertificate = async () => {
        if (isViewed) return; // Already viewed
        
        // Get user name for certificate
        const userName = developmentPlanData?.leaderProfile?.preferredName || 
                         developmentPlanData?.leaderProfile?.name ||
                         user?.displayName || 
                         'Leader';
        
        // Show the certificate viewer
        setCertificationMilestone({
          milestone: certMilestone,
          userName,
          certificationDate: certData.signOffApprovedAt || new Date(),
          facilitatorName: certData.signedOffBy || 'Program Facilitator',
          isAcknowledged: false
        });
        setShowCertificateViewer(true);
      };
      
      return (
        <div
          className={`group flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
            isViewed
              ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700'
              : 'bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/30 border-amber-300 dark:border-amber-600 hover:shadow-md'
          }`}
          onClick={handleViewPreviousCertificate}
        >
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
            isViewed 
              ? 'bg-emerald-500' 
              : 'bg-gradient-to-br from-amber-400 to-yellow-500 animate-pulse'
          }`}>
            {isViewed ? (
              <CheckCircle className="w-5 h-5 text-white" />
            ) : (
              <Award className="w-5 h-5 text-white" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold ${
                isViewed ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-800 dark:text-amber-200'
              }`}>
                {isViewed ? '✅ Certificate Viewed' : item.label}
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${
              isViewed ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
            }`}>
              {isViewed ? `${item.certificateMilestoneName} certificate saved` : item.description}
            </p>
          </div>
          
          {!isViewed && (
            <div className="flex-shrink-0">
              <span className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-semibold">
                View & Print
              </span>
            </div>
          )}
        </div>
      );
    }
    
    // ========== SPECIAL HANDLING: Coaching Sessions with Certification ==========
    // These have a 3-step flow: Schedule → Attend → Get Certified
    if (item.requiresCertification) {
      // Find the registration for this coaching item using the hook's function
      const registration = getRegistrationForCoachingItem(item.id);
      
      const registrationStatus = registration?.status;
      const isScheduled = registrationStatus && registrationStatus !== REGISTRATION_STATUS.CANCELLED;
      const isAttended = registrationStatus === REGISTRATION_STATUS.ATTENDED || registrationStatus === REGISTRATION_STATUS.CERTIFIED;
      const isCertified = registrationStatus === REGISTRATION_STATUS.CERTIFIED;
      
      const handleCoachingClick = () => {
        if (!isCertified) {
          // Open session picker to schedule or reschedule
          setSessionPickerItem(item);
          setShowSessionPicker(true);
        }
        // If certified, action is complete - no action needed
      };
      
      return (
        <div 
          className={`group p-4 rounded-xl border transition-all cursor-pointer ${
            isCertified 
              ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-700'
              : 'bg-teal-50 border-teal-100 hover:bg-teal-100 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700'
          }`}
          onClick={handleCoachingClick}
        >
          {/* Header with icon and label */}
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isCertified 
                ? 'bg-emerald-500' 
                : 'bg-gradient-to-br from-corporate-teal to-teal-600'
            }`}>
              {isCertified ? (
                <CheckCircle className="w-5 h-5 text-white" />
              ) : (
                <Video className="w-5 h-5 text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-bold ${isCertified ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-white'}`}>
                {item.label}
              </p>
              {isCertified ? (
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  ✓ Certified by facilitator
                </p>
              ) : isAttended ? (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  ⏳ Awaiting facilitator certification
                </p>
              ) : isScheduled && registration ? (
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {registration.sessionDate 
                        ? new Date(registration.sessionDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                        : 'Date TBD'
                      }
                      {registration.sessionTime && ` at ${registration.sessionTime}`}
                    </span>
                  </div>
                  {registration.coach && (
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">with {registration.coach}</p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Click to schedule your coaching session
                </p>
              )}
            </div>
            
            {/* Right side: Status badge and action button */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-corporate-teal bg-teal-50 dark:text-teal-400 dark:bg-teal-900/40 px-1.5 py-0.5 rounded uppercase tracking-wider">
                Required
              </span>
              {!isCertified && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSessionPickerItem(item);
                    setShowSessionPicker(true);
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    isScheduled 
                      ? 'text-slate-600 bg-white dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600'
                      : 'text-white bg-corporate-teal hover:bg-teal-600'
                  }`}
                >
                  {isScheduled ? 'Reschedule' : 'Schedule'}
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }
    
    // ========== STANDARD ACTION ITEMS ==========
    // For ALL prep phase items, use prepRequirementsComplete for unified completion tracking
    // This ensures the checkbox state matches the DevelopmentJourneyWidget counter
    let isCompleted;
    
    // Check if this is a prep phase item (from onboarding-config or session1-config)
    const isPrepPhaseItem = item.dayId === 'onboarding-config' || item.dayId === 'session1-config';
    
    if (isPrepPhaseItem && Array.isArray(prepRequirementsComplete?.items)) {
      // For prep items, look up completion in prepRequirementsComplete
      // Match by ID first, then handlerType, then exact label (same logic as DevelopmentJourneyWidget)
      const itemLabel = (item.label || '').toLowerCase().trim();
      const prepItem = prepRequirementsComplete.items.find(p => {
        // 1. Match by exact ID first (most reliable)
        if (item.id && p.id && item.id === p.id) return true;
        // 2. Match by handlerType (for interactive items)
        if (item.handlerType && p.handlerType && item.handlerType === p.handlerType) return true;
        // 3. Match by EXACT label (case-insensitive, trimmed) - NOT substring
        const pLabel = (p.label || '').toLowerCase().trim();
        if (pLabel && itemLabel && pLabel === itemLabel) return true;
        return false;
      });
      
      if (prepItem) {
        isCompleted = prepItem.complete || false;
      } else if (item.isInteractive) {
        // Fallback for interactive items not in prepRequirementsComplete
        isCompleted = item.handlerType === 'leader-profile' ? leaderProfileComplete : 
                      item.handlerType === 'baseline-assessment' ? baselineAssessmentComplete : 
                      item.handlerType === 'notification-setup' ? notificationSetupComplete :
                      item.handlerType === 'foundation-commitment' ? foundationCommitmentComplete :
                      item.handlerType === 'conditioning-tutorial' ? conditioningTutorialComplete :
                      item.handlerType === 'video-series' ? videoSeriesComplete :
                      item.autoComplete || false;
      } else {
        // Fallback to action progress for content items not found in prepRequirementsComplete
        isCompleted = (progress.status === 'completed' || completedItems.includes(item.id));
      }
    } else if (item.isInteractive) {
      // Interactive items outside prep phase (or when prepRequirementsComplete not available)
      isCompleted = item.handlerType === 'leader-profile' ? leaderProfileComplete : 
                    item.handlerType === 'baseline-assessment' ? baselineAssessmentComplete : 
                    item.handlerType === 'notification-setup' ? notificationSetupComplete :
                    item.handlerType === 'foundation-commitment' ? foundationCommitmentComplete :
                    item.handlerType === 'conditioning-tutorial' ? conditioningTutorialComplete :
                    item.handlerType === 'video-series' ? videoSeriesComplete :
                    item.autoComplete || false;
    } else {
      // Non-prep, non-interactive items use standard progress check
      isCompleted = (progress.status === 'completed' || completedItems.includes(item.id));
    }
    const isSkipped = progress.status === 'skipped';
    const Icon = item.isInteractive 
      ? (item.icon === 'User' ? User : item.icon === 'Bell' ? Bell : ClipboardCheck)
      : getIcon(item.type);
    
    if (isSkipped) return null;

    const getCategoryStyles = () => {
      if (isCompleted) return 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-700';
      return 'bg-teal-50 border-teal-100 hover:bg-teal-100 hover:border-teal-200 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 dark:hover:border-slate-600';
    };

    const getCheckboxStyles = () => {
      if (isCompleted) return 'bg-emerald-500 border-emerald-500';
      return 'border-teal-300 group-hover:border-corporate-teal dark:border-teal-500 dark:group-hover:border-teal-400';
    };

    const getIconColor = () => {
      if (isCompleted) return 'text-emerald-600 dark:text-emerald-400';
      return 'text-corporate-teal dark:text-teal-400';
    };
    
    // Determine if this item is clickable (interactive, has resource, or is session picker)
    const isClickable = item.isInteractive || item.resourceId || item.url || item.isSessionPicker;
    
    // Determine click handler for the main row
    const handleRowClick = (e) => {
      if (item.isSessionPicker) {
        // Open session picker modal for coaching/community sessions
        if (item.type === 'coaching' || item.handlerType === 'session-picker') {
          setSessionPickerItem(item);
          setShowSessionPicker(true);
        } else if (item.type === 'community' || item.handlerType === 'community-session-picker') {
          // For now, use the same coaching session picker - can create a separate community one later
          setCommunitySessionPickerItem(item);
          setShowCommunitySessionPicker(true);
        }
      } else if (item.isInteractive) {
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
            // Prevent manual completion for any item with a resource - must open/view the content first
            if (item.resourceId || item.url) {
              alert('Open the content to mark this complete. Click the row to view it.');
              return;
            }
            handleToggle(item);
          }}
          className={`flex-shrink-0 mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${(item.resourceId || item.url || item.isInteractive) && !isCompleted ? 'cursor-not-allowed' : 'cursor-pointer touch-manipulation active:scale-90'} ${getCheckboxStyles()}`}
        >
          {isCompleted && <CheckCircle className="w-4 h-4 text-white pointer-events-none" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <p className={`text-sm font-bold ${isCompleted ? 'text-emerald-700 dark:text-emerald-400 line-through' : 'text-slate-700 dark:text-white'}`}>
              {item.label || item.title || 'Untitled Action'}
            </p>
            {item.required !== false && !item.optional && !isCarriedOver && !isCompleted && (
              <span className="text-[10px] font-bold text-corporate-teal bg-teal-50 dark:text-teal-400 dark:bg-teal-900/40 px-1.5 py-0.5 rounded uppercase tracking-wider">Required</span>
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
                <span className="capitalize">Form</span>
                <span>•</span>
                <span className="text-slate-600 dark:text-slate-400 font-medium">
                  {item.handlerType === 'notification-setup' ? 'Personal Settings'
                    : item.handlerType === 'conditioning-tutorial' ? 'Session 1'
                    : 'Foundation Onboarding'}
                </span>
                {(interactiveDurations[item.resourceId] || item.estimatedMinutes || item.duration) && (
                  <><span>•</span><span className="text-slate-500 dark:text-slate-400">{interactiveDurations[item.resourceId] || item.estimatedMinutes || item.duration} min</span></>
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
                {(item.estimatedMinutes || item.duration || (item.resourceType === 'video_series' && videoSeriesDurations[item.resourceId])) && (
                   <><span>•</span><span className="text-slate-500 dark:text-slate-400">{item.estimatedMinutes || item.duration || videoSeriesDurations[item.resourceId]} min</span></>
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
              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-corporate-teal hover:bg-teal-50 dark:text-slate-500 dark:hover:text-teal-400 dark:hover:bg-teal-900/30 rounded-xl transition-all"
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
          onVideoComplete={(resource) => {
            // Mark the video item as complete when user clicks "Mark as Watched"
            const item = resource;
            // Use actionItemId (original item ID) for completion, fall back to resourceId or id
            const itemId = item.actionItemId || item.resourceId || item.id;
            const dailyPlanItemId = item.actionItemId || item.id; // For daily plan toggle
            
            if (itemId && item.fromDailyPlan && item.dayId) {
              toggleDailyItem(item.dayId, dailyPlanItemId, true);
            }
            if (itemId) {
              completeItem(itemId, {
                currentWeek: currentWeekNumber,
                weekNumber: currentWeekNumber,
                category: item.category?.toLowerCase() || 'content',
                label: item.label || item.title,
                carriedOver: item.carriedOver || false
              });
            }
          }}
        />
      )}
      <Card title={widgetTitle} icon={CheckCircle} accent="TEAL" helpText={helpText}>
        
        {/* ========== PREPARATION PHASE: Two Sections (Onboarding + Session 1 Prep) ========== */}
        {currentPhase?.id === 'pre-start' && (
          <>
            {/* SECTION 1: Onboarding */}
            {onboardingActions.length > 0 && (
              !localPrepCompletion.onboardingComplete ? (
                // Onboarding NOT Complete - Show as primary section
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      <span className="text-sm font-bold text-teal-800 dark:text-teal-400 uppercase tracking-wider">Onboarding</span>
                    </div>
                    <div className="flex-1 h-px bg-teal-200 dark:bg-teal-700"></div>
                    <span className="text-xs font-medium text-teal-700 bg-teal-100 dark:text-teal-300 dark:bg-teal-900/40 px-2 py-0.5 rounded-full">
                      {localPrepCompletion.onboardingCount}/{localPrepCompletion.onboardingTotal} complete
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
                    Complete these {localPrepCompletion.onboardingTotal} items to get ready for Session 1.
                  </p>
                  <div className="space-y-1 p-3 bg-teal-50/50 dark:bg-teal-900/20 rounded-xl border border-teal-200/60 dark:border-teal-700/40">
                    {onboardingActions.map((item, idx) => (
                      <ActionItem key={item.id || idx} item={item} idx={idx} />
                    ))}
                  </div>
                </div>
              ) : (
                // Onboarding IS Complete - Show collapsed celebration
                <div className="mb-4">
                  <button
                    onClick={() => setPrepExpanded(!prepExpanded)}
                    className="w-full group flex items-center gap-3 p-4 rounded-xl bg-teal-50 dark:bg-teal-900/40 border border-teal-200 dark:border-teal-700 hover:bg-teal-100 dark:hover:bg-teal-800/50 transition-all"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-corporate-teal flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-bold text-teal-800 dark:text-teal-300">✓ Onboarding Complete!</p>
                      <p className="text-xs text-teal-600 dark:text-teal-400">
                        All {localPrepCompletion.onboardingTotal} onboarding tasks done
                      </p>
                    </div>
                    <div className="flex-shrink-0 p-2 text-teal-600 dark:text-teal-400 group-hover:text-teal-800 dark:group-hover:text-teal-300 transition-colors">
                      {prepExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </button>
                  
                  {prepExpanded && (
                    <div className="mt-2 p-3 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Completed Items</p>
                      {onboardingActions.map((item) => (
                        <div key={item.id} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-corporate-teal flex-shrink-0" />
                          <span className="text-teal-700 dark:text-teal-400">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            )}
            
            {/* SECTION 2: Session 1 Prep (shows immediately alongside Onboarding) */}
            {session1Actions.length > 0 && (
              !localPrepCompletion.session1Complete ? (
                // Session 1 Prep NOT Complete - Show as primary section
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <PlayCircle className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      <span className="text-sm font-bold text-teal-800 dark:text-teal-400 uppercase tracking-wider">Session 1 Preparation</span>
                    </div>
                    <div className="flex-1 h-px bg-teal-200 dark:bg-teal-700"></div>
                    <span className="text-xs font-medium text-teal-700 bg-teal-100 dark:text-teal-300 dark:bg-teal-900/40 px-2 py-0.5 rounded-full">
                      {localPrepCompletion.session1Count}/{localPrepCompletion.session1Total} complete
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 px-1">
                    Complete these {localPrepCompletion.session1Total} items to get ready for Session 1.
                  </p>
                  <div className="space-y-1 p-3 bg-teal-50/50 dark:bg-teal-900/20 rounded-xl border border-teal-200/60 dark:border-teal-700/40">
                    {session1Actions.map((item, idx) => (
                      <ActionItem key={item.id || idx} item={item} idx={idx} />
                    ))}
                  </div>
                </div>
              ) : (
                // Session 1 Prep IS Complete - Show collapsed celebration
                <div className="mb-4">
                  <button
                    onClick={() => setExploreExpanded(!exploreExpanded)}
                    className="w-full group flex items-center gap-3 p-4 rounded-xl bg-teal-50 dark:bg-teal-900/40 border border-teal-200 dark:border-teal-700 hover:bg-teal-100 dark:hover:bg-teal-800/50 transition-all"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-corporate-teal flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-bold text-teal-800 dark:text-teal-300">✓ Session 1 Prep Complete!</p>
                      <p className="text-xs text-teal-600 dark:text-teal-400">
                        All {localPrepCompletion.session1Total} prep tasks done — Explore is now unlocked!
                      </p>
                    </div>
                    <div className="flex-shrink-0 p-2 text-teal-600 dark:text-teal-400 group-hover:text-teal-800 dark:group-hover:text-teal-300 transition-colors">
                      {exploreExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </button>
                  
                  {exploreExpanded && (
                    <div className="mt-2 p-3 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Completed Items</p>
                      {session1Actions.map((item) => (
                        <div key={item.id} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-corporate-teal flex-shrink-0" />
                          <span className="text-teal-700 dark:text-teal-400">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            )}
            
            {/* Explore items (when BOTH onboarding AND session1 are complete) */}
            {localPrepCompletion.allComplete && allExploreActions.length > 0 && (() => {
              // Calculate if all explore items are complete
              const allExploreComplete = allExploreActions.every(item => {
                if (item.isInteractive) {
                  if (item.handlerType === 'notification-setup') return notificationSetupComplete;
                  if (item.handlerType === 'conditioning-tutorial') return conditioningTutorialComplete;
                  if (item.handlerType === 'leader-profile') return leaderProfileComplete;
                  if (item.handlerType === 'baseline-assessment') return baselineAssessmentComplete;
                  if (item.handlerType === 'foundation-commitment') return foundationCommitmentComplete;
                  if (item.handlerType === 'video-series') return videoSeriesComplete;
                }
                const progress = getItemProgress(item.id);
                return progress.status === 'completed' || completedItems.includes(item.id);
              });
              
              return allExploreComplete ? (
                // All explore items complete - show collapsed section
                <div className="mb-4">
                  <button
                    onClick={() => setExploreExpanded(!exploreExpanded)}
                    className="w-full group flex items-center gap-3 p-4 rounded-xl bg-teal-50 dark:bg-teal-900/40 border border-teal-200 dark:border-teal-700 hover:bg-teal-100 dark:hover:bg-teal-800/50 transition-all"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-corporate-teal flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-bold text-teal-800 dark:text-teal-300">✨ Explore Complete!</p>
                      <p className="text-xs text-teal-600 dark:text-teal-400">
                        All {allExploreActions.length} optional tools explored — You're ready for Session 1!
                      </p>
                    </div>
                    <div className="flex-shrink-0 p-2 text-teal-600 dark:text-teal-400 group-hover:text-teal-800 dark:group-hover:text-teal-300 transition-colors">
                      {exploreExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </button>
                  
                  {exploreExpanded && (
                    <div className="mt-2 p-3 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Explored Items</p>
                      {allExploreActions.map((item) => (
                        <div key={item.id} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-corporate-teal flex-shrink-0" />
                          <span className="text-teal-700 dark:text-teal-400">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      🚀 <span className="font-semibold">You're all set!</span> Session 1 will build on everything you've learned.
                    </p>
                  </div>
                </div>
              ) : (
                // Not all complete - show normal explore section
                <div className="space-y-2">
                  <p className="text-xs text-slate-600 dark:text-slate-400 px-1">
                    Explore these tools at your own pace before Session 1:
                  </p>
                  <div className="space-y-1">
                    {allExploreActions.map((item, idx) => (
                      <ActionItem key={item.id || idx} item={item} idx={idx} />
                    ))}
                  </div>
                  
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      🚀 <span className="font-semibold">You're all set!</span> Session 1 will build on everything you've learned.
                    </p>
                  </div>
                </div>
              );
            })()}
            
            {/* Just the success message if no explore items */}
            {localPrepCompletion.allComplete && allExploreActions.length === 0 && (
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
                // Match ActionItem's completion logic exactly
                if (item.isInteractive) {
                  // Use prepRequirementsComplete.items first (same as ActionItem)
                  if (Array.isArray(prepRequirementsComplete?.items)) {
                    const prepItem = prepRequirementsComplete.items.find(p => p.handlerType === item.handlerType);
                    if (prepItem) return prepItem.complete;
                  }
                  // Fallback to individual hook values
                  if (item.handlerType === 'leader-profile') return leaderProfileComplete;
                  if (item.handlerType === 'baseline-assessment') return baselineAssessmentComplete;
                  if (item.handlerType === 'notification-setup') return notificationSetupComplete;
                  if (item.handlerType === 'foundation-commitment') return foundationCommitmentComplete;
                  if (item.handlerType === 'conditioning-tutorial') return conditioningTutorialComplete;
                  if (item.handlerType === 'video-series') return videoSeriesComplete;
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
                      <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">✅ Onboarding Complete!</p>
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
                      <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      <span className="text-sm font-bold text-teal-800 dark:text-teal-400 uppercase tracking-wider">Catch Up</span>
                    </div>
                    <div className="flex-1 h-px bg-teal-200 dark:bg-teal-700"></div>
                    <span className="text-xs font-medium text-teal-700 bg-teal-100 dark:text-teal-300 dark:bg-teal-900/40 px-2 py-0.5 rounded-full">
                      {completedCarriedOver.length}/{displayedCarriedOverItems.length} complete
                    </span>
                  </div>
                  <div className="space-y-1 p-3 bg-teal-50/50 dark:bg-teal-900/20 rounded-xl border border-teal-200/60 dark:border-teal-700/40">
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
                // Special handling for coaching items that require certification
                if (item.requiresCertification) {
                  const reg = getRegistrationForCoachingItem(item.id);
                  return reg?.status === REGISTRATION_STATUS.CERTIFIED;
                }
                // Standard completion check
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
                      <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                        🎉 {currentPhase?.id === 'start' ? 'Milestone Complete!' : 'This Week Complete!'}
                      </p>
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
                      <span className="text-sm font-bold text-teal-800 dark:text-teal-400 uppercase tracking-wider">
                        {currentPhase?.id === 'start' 
                          ? currentMilestoneInfo?.name || 'Current Milestone'
                          : 'This Week'}
                      </span>
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
              <div className="p-4 text-center text-slate-500 dark:text-slate-400 text-sm italic">
                {currentPhase?.id === 'start' 
                  ? 'No content configured for this milestone yet. Check Content Manager.'
                  : 'No actions scheduled for this week.'
                }
              </div>
            )}

          </>
        )}
      </Card>
      
      {/* Video Series Player Modal */}
      {viewingSeriesId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pb-24 sm:pb-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-5xl h-[70dvh] sm:h-[85vh] bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pb-24 sm:pb-4 bg-black/50 backdrop-blur-sm">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pb-24 sm:pb-4 bg-black/50 backdrop-blur-sm">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pb-24 sm:pb-4 bg-black/50 backdrop-blur-sm">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pb-24 sm:pb-4 bg-black/50 backdrop-blur-sm">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pb-24 sm:pb-4 bg-black/50 backdrop-blur-sm">
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

      {/* Coaching Session Picker Modal */}
      {showSessionPicker && sessionPickerItem && (
        <SessionPickerModal
          isOpen={showSessionPicker}
          onClose={() => {
            setShowSessionPicker(false);
            setSessionPickerItem(null);
          }}
          coachingItem={sessionPickerItem}
          onRegister={(session) => {
            // Mark the action as "scheduled" (not fully complete until attended)
            completeItem(sessionPickerItem.id, {
              currentWeek: currentWeekNumber,
              category: 'coaching',
              label: sessionPickerItem.label,
              sessionId: session.id,
              status: 'scheduled'
            });
            setShowSessionPicker(false);
            setSessionPickerItem(null);
          }}
          onAttended={(sessionId) => {
            // Mark as fully complete when attended
            completeItem(sessionPickerItem.id, {
              currentWeek: currentWeekNumber,
              category: 'coaching',
              label: sessionPickerItem.label,
              sessionId,
              status: 'attended'
            });
            setShowSessionPicker(false);
            setSessionPickerItem(null);
          }}
        />
      )}

      {/* Community Session Picker Modal (uses same modal for now) */}
      {showCommunitySessionPicker && communitySessionPickerItem && (
        <SessionPickerModal
          isOpen={showCommunitySessionPicker}
          onClose={() => {
            setShowCommunitySessionPicker(false);
            setCommunitySessionPickerItem(null);
          }}
          coachingItem={communitySessionPickerItem}
          onRegister={(session) => {
            completeItem(communitySessionPickerItem.id, {
              currentWeek: currentWeekNumber,
              category: 'community',
              label: communitySessionPickerItem.label,
              sessionId: session.id,
              status: 'scheduled'
            });
            setShowCommunitySessionPicker(false);
            setCommunitySessionPickerItem(null);
          }}
          onAttended={(sessionId) => {
            completeItem(communitySessionPickerItem.id, {
              currentWeek: currentWeekNumber,
              category: 'community',
              label: communitySessionPickerItem.label,
              sessionId,
              status: 'attended'
            });
            setShowCommunitySessionPicker(false);
            setCommunitySessionPickerItem(null);
          }}
        />
      )}

      {/* Leader Certification Viewer Modal */}
      {showCertificateViewer && certificationMilestone && (
        <LeaderCertificateViewer
          isOpen={showCertificateViewer}
          onClose={() => {
            setShowCertificateViewer(false);
            setCertificationMilestone(null);
          }}
          onAcknowledge={async () => {
            // Mark the certification action as complete
            const itemId = `milestone-${certificationMilestone.milestone}-certification`;
            await completeItem(itemId, {
              currentWeek: currentWeekNumber,
              weekNumber: currentWeekNumber,
              category: 'certification',
              label: 'Leader Certification',
              acknowledgedAt: new Date().toISOString()
            });
            
            // Also mark the certificate as viewed in milestone progress
            if (user?.uid && certificationMilestone?.milestone) {
              const milestoneKey = `milestone_${certificationMilestone.milestone}`;
              const userRef = doc(db, 'users', user.uid);
              await updateDoc(userRef, {
                [`milestoneProgress.${milestoneKey}.certificateViewed`]: true,
                [`milestoneProgress.${milestoneKey}.certificateViewedAt`]: new Date().toISOString()
              }).catch(e => console.warn('Could not mark certificate as viewed:', e));
            }
            
            setShowCertificateViewer(false);
            setCertificationMilestone(null);
          }}
          milestone={certificationMilestone.milestone}
          userName={certificationMilestone.userName}
          certificationDate={certificationMilestone.certificationDate}
          facilitatorName={certificationMilestone.facilitatorName}
          isAcknowledged={certificationMilestone.isAcknowledged}
        />
      )}
    </>
  );
};

export default ThisWeeksActionsWidget;