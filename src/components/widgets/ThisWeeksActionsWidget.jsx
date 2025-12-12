import React, { useState } from 'react';
import { CheckCircle, Circle, Play, BookOpen, Users, Video, FileText, Zap, AlertCircle, ExternalLink, Loader, Layers, MessageSquare } from 'lucide-react';
import { Card } from '../ui';
import { useDevPlan } from '../../hooks/useDevPlan';
import UniversalResourceViewer from '../ui/UniversalResourceViewer';
import { doc, getDoc } from 'firebase/firestore';
import { useAppServices } from '../../services/useAppServices';
import { CONTENT_COLLECTIONS } from '../../services/contentService';

const ThisWeeksActionsWidget = ({ scope }) => {
  const { db } = useAppServices();
  const [viewingResource, setViewingResource] = useState(null);
  const [loadingResource, setLoadingResource] = useState(false);

  // If scope is provided (e.g. from Widget Lab preview), use it.
  // Otherwise, use the real hook.
  const devPlanHook = useDevPlan();
  
  // Determine which data source to use
  const currentWeek = scope?.currentWeek || devPlanHook.currentWeek;
  const toggleItemComplete = scope?.toggleItemComplete || devPlanHook.toggleItemComplete;
  
  // If no current week data, show empty state
  if (!currentWeek) {
    return (
      <Card title="This Week's Actions" icon={CheckCircle} accent="TEAL">
        <div className="p-4 text-center text-slate-500 text-sm">
          No active plan found.
        </div>
      </Card>
    );
  }

  const { 
    content = [], 
    community = [], 
    coaching = [],
    userProgress 
  } = currentWeek;

  const completedItems = userProgress?.itemsCompleted || [];

  // Combine all actionable items
  const allActions = [
    ...content.map(i => ({ ...i, category: 'Content' })),
    ...community.map(i => ({ ...i, category: 'Community' })),
    ...coaching.map(i => ({ ...i, category: 'Coaching' }))
  ];

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

  const handleToggle = (id) => {
    const isComplete = !completedItems.includes(id);
    toggleItemComplete(id, isComplete);
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
      <div className="space-y-1">
        {allActions.length === 0 ? (
          <div className="p-4 text-center text-slate-500 text-sm italic">
            No actions scheduled for this week.
          </div>
        ) : (
          allActions.map((item, idx) => {
            const isCompleted = completedItems.includes(item.id);
            const Icon = getIcon(item.type);
            
            return (
              <div 
                key={item.id || idx}
                onClick={() => handleToggle(item.id)}
                className={`
                  group flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer
                  ${isCompleted 
                    ? 'bg-teal-50 border-teal-100' 
                    : 'bg-white border-slate-100 hover:border-teal-200 hover:shadow-sm'
                  }
                `}
              >
                {/* Checkbox */}
                <div className={`
                  mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors
                  ${isCompleted 
                    ? 'bg-teal-500 border-teal-500' 
                    : 'bg-white border-slate-300 group-hover:border-teal-400'
                  }
                `}>
                  {isCompleted && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className={`text-sm font-medium truncate ${isCompleted ? 'text-teal-900 line-through opacity-75' : 'text-slate-700'}`}>
                      {item.title || item.name || 'Untitled Action'}
                    </p>
                    {item.required !== false && !item.optional && (
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded uppercase tracking-wider">
                        Required
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Icon className="w-3 h-3" />
                    <span className="capitalize">{item.type?.replace(/_/g, ' ').toLowerCase() || 'Action'}</span>
                    <span>•</span>
                    <span>{item.estimatedTime || '15m'}</span>
                  </div>
                </div>

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
            );
          })
        )}
      </div>
    </Card>
    </>
  );
};

export default ThisWeeksActionsWidget;
