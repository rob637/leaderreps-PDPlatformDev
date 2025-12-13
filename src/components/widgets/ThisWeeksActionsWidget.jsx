import React, { useState, useMemo, useEffect } from 'react';
import { 
  CheckCircle, Circle, Play, BookOpen, Users, Video, FileText, Zap, 
  AlertCircle, ExternalLink, Loader, Layers, MessageSquare, 
  SkipForward, ChevronDown, ChevronUp, Clock, Flame, Award, AlertTriangle
} from 'lucide-react';
import { Card } from '../ui';
import { useDevPlan } from '../../hooks/useDevPlan';
import { useActionProgress } from '../../hooks/useActionProgress';
import { useCoachingRegistrations } from '../../hooks/useCoachingRegistrations';
import UniversalResourceViewer from '../ui/UniversalResourceViewer';
import CoachingActionItem from '../coaching/CoachingActionItem';
import { doc, getDoc } from 'firebase/firestore';
import { useAppServices } from '../../services/useAppServices';
import { CONTENT_COLLECTIONS } from '../../services/contentService';

const ThisWeeksActionsWidget = ({ scope }) => {
  const { db } = useAppServices();
  const [viewingResource, setViewingResource] = useState(null);
  const [loadingResource, setLoadingResource] = useState(false);
  const [showCarryOver, setShowCarryOver] = useState(true);
  const [showSkipConfirm, setShowSkipConfirm] = useState(null);

  // If scope is provided (e.g. from Widget Lab preview), use it.
  // Otherwise, use the real hook.
  const devPlanHook = useDevPlan();
  const actionProgress = useActionProgress();
  const coachingRegistrations = useCoachingRegistrations();
  
  // Determine which data source to use
  const currentWeek = scope?.currentWeek || devPlanHook.currentWeek;
  const toggleItemComplete = scope?.toggleItemComplete || devPlanHook.toggleItemComplete;
  
  // Progress tracking
  const { 
    completeItem, 
    uncompleteItem, 
    skipItem, 
    getItemProgress,
    getCarriedOverItems,
    stats,
    loading: progressLoading 
  } = actionProgress;
  
  // Coaching registrations
  const {
    registrations: userRegistrations,
    getRegistration,
    isRegistered
  } = coachingRegistrations;

  // Extract data from currentWeek (with fallbacks for when currentWeek is null)
  const content = currentWeek?.content || [];
  const community = currentWeek?.community || [];
  const coaching = currentWeek?.coaching || [];
  const userProgress = currentWeek?.userProgress;
  const completedItems = userProgress?.itemsCompleted || [];

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
        url: item.url,
        resourceId: item.resourceId || item.contentItemId || item.communityItemId || item.coachingItemId,
        resourceType: item.resourceType || (item.type || item.contentItemType || item.communityItemType || item.coachingItemType || '').toLowerCase(),
        category
      };
    });
  };

  // Combine all actionable items
  const allActions = useMemo(() => [
    ...normalizeItems(content, 'Content'),
    ...normalizeItems(community, 'Community'),
    ...normalizeItems(coaching, 'Coaching')
  ], [content, community, coaching]);

  // Get carried over items for this week (MUST be before any early returns)
  const carriedOverItems = useMemo(() => {
    if (!currentWeek?.weekNumber) return [];
    return getCarriedOverItems(currentWeek.weekNumber);
  }, [currentWeek?.weekNumber, getCarriedOverItems]);

  // Calculate progress (MUST be before any early returns)
  const completedCount = useMemo(() => {
    return allActions.filter(item => {
      const progress = getItemProgress(item.id);
      return progress.status === 'completed' || completedItems.includes(item.id);
    }).length;
  }, [allActions, getItemProgress, completedItems]);

  const totalCount = allActions.length + carriedOverItems.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // If no current week data, show empty state (AFTER all hooks)
  if (!currentWeek) {
    return (
      <Card title="This Week's Actions" icon={CheckCircle} accent="TEAL">
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
    
    // Use provided URL if present (unless it's PDQ, which we want to re-fetch to get the real doc)
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
           } else if (data.type === 'READ_REP') {
               if (data.details?.pdfUrl) {
                   resourceData.url = data.details.pdfUrl;
                   resourceData.resourceType = 'pdf';
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
    const isCompleted = progress.status === 'completed' || completedItems.includes(item.id);
    const isSkipped = progress.status === 'skipped';
    const Icon = getIcon(item.type);
    const carryCount = progress.carryCount || item.carryCount || 0;
    
    if (isSkipped) return null; // Don't show skipped items

    // Determine color scheme based on category
    const getCategoryStyles = () => {
      if (isCompleted) return 'bg-green-50 border-green-200';
      if (isCarriedOver) return 'bg-amber-50 border-amber-200';
      
      const category = (item.category || '').toLowerCase();
      switch (category) {
        case 'content':
          return 'bg-corporate-navy/5 border-corporate-navy/10 hover:bg-corporate-navy/10 hover:border-corporate-navy/30';
        case 'community':
          return 'bg-orange-50 border-orange-100 hover:bg-orange-100 hover:border-orange-300';
        default:
          return 'bg-slate-50 border-slate-100 hover:bg-blue-50 hover:border-blue-200';
      }
    };

    const getCheckboxStyles = () => {
      if (isCompleted) return 'bg-green-500 border-green-500';
      
      const category = (item.category || '').toLowerCase();
      switch (category) {
        case 'content':
          return 'border-corporate-navy/30 group-hover:border-corporate-navy';
        case 'community':
          return 'border-orange-300 group-hover:border-orange-500';
        default:
          return 'border-slate-300 group-hover:border-blue-400';
      }
    };

    const getIconColor = () => {
      if (isCompleted) return 'text-green-600';
      
      const category = (item.category || '').toLowerCase();
      switch (category) {
        case 'content':
          return 'text-corporate-navy';
        case 'community':
          return 'text-orange-600';
        default:
          return 'text-slate-500';
      }
    };
    
    return (
      <div 
        key={item.id || idx}
        className={`
          group flex items-start gap-3 p-3 rounded-xl border transition-all
          ${getCategoryStyles()}
        `}
      >
        {/* Checkbox - matches Win the Day style */}
        <div
          onClick={() => handleToggle(item)}
          className={`
            flex-shrink-0 mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors cursor-pointer
            ${getCheckboxStyles()}
          `}
        >
          {isCompleted && <CheckCircle className="w-3 h-3 text-white" />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <p className={`text-sm font-bold ${isCompleted ? 'text-green-700 line-through' : 'text-slate-700'}`}>
              {item.label || item.title || item.name || 'Untitled Action'}
            </p>
            {item.required !== false && !item.optional && !isCarriedOver && (
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded uppercase tracking-wider">
                Required
              </span>
            )}
            {isCarriedOver && (
              <span className="text-[10px] font-bold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                Carried {carryCount > 1 ? `(${carryCount}x)` : ''}
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
            <span className="capitalize">{item.type?.replace(/_/g, ' ').toLowerCase() || 'Action'}</span>
            <span>•</span>
            <span>{item.estimatedTime || '15m'}</span>
            {isCarriedOver && item.originalWeek && (
              <>
                <span>•</span>
                <span className="text-orange-600">From Week {item.originalWeek}</span>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {/* Skip Button (for carried over items) */}
          {isCarriedOver && !isCompleted && (
            <div className="relative">
              {showSkipConfirm === item.id ? (
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
                  <button
                    onClick={() => handleSkip(item)}
                    className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
                  >
                    Skip
                  </button>
                  <button
                    onClick={() => setShowSkipConfirm(null)}
                    className="px-2 py-1 text-xs text-slate-500 hover:bg-slate-50 rounded"
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
                  className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-full transition-colors"
                  title="Skip this item"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* View Resource Button */}
          {(item.resourceId || item.url) && (
            <button
              onClick={(e) => handleViewResource(e, item)}
              className="p-2 text-slate-400 hover:text-corporate-teal hover:bg-teal-50 rounded-full transition-colors"
              title="View Resource"
            >
              {loadingResource === item.id ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : item.resourceType === 'video' ? (
                <Play className="w-5 h-5" />
              ) : item.resourceType === 'reading' || item.resourceType === 'pdf' || item.resourceType === 'document' ? (
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
      <Card title="This Week's Actions" icon={CheckCircle} accent="TEAL">
        {/* Progress Header */}
        <div className="mb-4 p-3 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl border border-teal-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-teal-800">
                Week {currentWeek.weekNumber} Progress
              </span>
              {stats.currentStreak > 0 && (
                <span className="flex items-center gap-1 text-xs font-medium text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                  <Flame className="w-3 h-3" />
                  {stats.currentStreak} day streak
                </span>
              )}
            </div>
            <div className="text-sm font-bold text-teal-700">
              {completedCount}/{totalCount}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="h-2 bg-teal-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          
          {/* Points Display */}
          {stats.totalPoints > 0 && (
            <div className="mt-2 flex items-center gap-2 text-xs text-teal-700">
              <Award className="w-3.5 h-3.5" />
              <span>{stats.totalPoints} points earned</span>
              {stats.badges.length > 0 && (
                <span className="ml-auto">
                  {stats.badges.length} badge{stats.badges.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Carried Over Section */}
        {carriedOverItems.length > 0 && (
          <div className="mb-4">
            <button 
              onClick={() => setShowCarryOver(!showCarryOver)}
              className="w-full flex items-center justify-between p-2 rounded-lg bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800">
                  Carried Over ({carriedOverItems.length})
                </span>
              </div>
              {showCarryOver ? (
                <ChevronUp className="w-4 h-4 text-amber-600" />
              ) : (
                <ChevronDown className="w-4 h-4 text-amber-600" />
              )}
            </button>
            
            {showCarryOver && (
              <div className="mt-2 space-y-1">
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
            )}
          </div>
        )}

        {/* Current Week Items */}
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
