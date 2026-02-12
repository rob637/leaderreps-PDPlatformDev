import React, { useState } from 'react';
import { Card, Modal } from '../ui';
import { Calendar, BookOpen, FileText, ChevronRight, Loader, X, PlayCircle } from 'lucide-react';
import { useDailyPlan } from '../../hooks/useDailyPlan';
import { useAppServices } from '../../services/useAppServices';
import { doc, getDoc } from 'firebase/firestore';
import { UNIFIED_COLLECTION } from '../../services/unifiedContentService';
import UniversalResourceViewer from '../ui/UniversalResourceViewer';

const DailyPlanWidget = ({ helpText }) => {
  const { currentDayData } = useDailyPlan();
  const { db, navigate } = useAppServices();
  const [selectedResource, setSelectedResource] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingResource, setLoadingResource] = useState(false);

  // Helper to handle navigation or modal opening
  const handleActionClick = async (action) => {
    // If it's a Read & Rep (Unified Content), open the modal
    // We can check action.type or just try to fetch if resourceId exists
    if (action.resourceId) {
      setLoadingResource(true);
      setIsModalOpen(true);
      setSelectedResource(null); // Clear previous

      try {
        // Try Unified Collection first
        const docRef = doc(db, UNIFIED_COLLECTION, action.resourceId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setSelectedResource({ id: docSnap.id, ...docSnap.data() });
        } else {
          // Fallback: If not found in Unified, it might be legacy.
          // For now, just show the basic info we have
          setSelectedResource({ 
            title: action.resourceTitle || action.label, 
            description: 'Resource details not found.',
            ...action 
          });
        }
      } catch (err) {
        console.error("Error fetching resource:", err);
        setSelectedResource({ 
            title: action.resourceTitle || action.label, 
            error: 'Failed to load resource details.' 
        });
      } finally {
        setLoadingResource(false);
      }
    } else {
      // Legacy navigation fallback
      if (navigate) navigate('business-readings');
    }
  };

  if (!currentDayData) return null;

  const content = currentDayData.content || [];
  const actions = currentDayData.actions || [];
  const hasItems = content.length > 0 || actions.length > 0;

  return (
    <>
      <Card title="Today's Plan" icon={Calendar} accent="TEAL" helpText={helpText}>
        <div className="space-y-3">
          {!hasItems && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">No specific items scheduled for today.</p>
            </div>
          )}
          
          {/* Actions */}
          {actions.map((action, idx) => {
            const isReadRep = action.type === 'read_rep' || (action.resourceId && !action.type); // Guessing if type missing
            
            return (
              <div key={`action-${idx}`} className="flex gap-3 items-center p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className={`w-2 h-2 rounded-full ${action.type === 'daily_rep' ? 'bg-corporate-teal' : 'bg-orange-400'}`}></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{action.label}</div>
                    {/* Optional Badge for Read & Reps */}
                    {isReadRep && (
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded font-medium uppercase tracking-wide">
                        Optional
                      </span>
                    )}
                  </div>
                  
                  {action.resourceId && (
                    <div 
                      className="mt-2 text-xs text-blue-600 flex items-center gap-1.5 cursor-pointer hover:underline group" 
                      onClick={() => handleActionClick(action)}
                    >
                      <div className="p-1 bg-blue-50 rounded-full group-hover:bg-blue-100 transition-colors">
                        <FileText className="w-3 h-3" />
                      </div>
                      <span className="font-medium">{action.resourceTitle || 'View Synopsis'}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Content (Legacy) */}
          {content.map((item, idx) => (
            <div key={`content-${idx}`} className="flex gap-3 items-center p-2 bg-blue-50 rounded-lg border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors" onClick={() => navigate && navigate('business-readings')}>
              <div className="p-1.5 bg-blue-100 rounded-full text-blue-600"><BookOpen className="w-4 h-4" /></div>
              <div className="flex-1">
                <div className="text-sm font-bold text-blue-900">{item.title}</div>
                <div className="text-xs text-blue-600">{item.type}</div>
              </div>
              <ChevronRight className="w-4 h-4 text-blue-400" />
            </div>
          ))}
        </div>
      </Card>

      {/* Resource Viewer Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={selectedResource?.title || 'Resource Details'}
        maxWidth="4xl" // Make it wider for the viewer
      >
        {loadingResource ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-3">
            <Loader className="w-8 h-8 text-corporate-teal animate-spin" />
            <p className="text-sm text-slate-400 dark:text-slate-500">Loading content...</p>
          </div>
        ) : selectedResource ? (
          <div className="min-h-[60vh]">
            <UniversalResourceViewer 
              resource={selectedResource} 
              onClose={() => setIsModalOpen(false)}
              inline={true}
            />
          </div>
        ) : (
          <div className="text-center p-8">
            <p className="text-slate-500 dark:text-slate-400">Content not found.</p>
          </div>
        )}
      </Modal>
    </>
  );
};

export default DailyPlanWidget;
