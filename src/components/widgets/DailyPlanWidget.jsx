import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../ui';
import { Calendar, BookOpen, FileText, ChevronRight, Loader, X } from 'lucide-react';
import { useDailyPlan } from '../../hooks/useDailyPlan';
import { useAppServices } from '../../services/useAppServices';
import { doc, getDoc } from 'firebase/firestore';
import { UNIFIED_COLLECTION } from '../../services/unifiedContentService';
import UniversalResourceViewer from '../ui/UniversalResourceViewer';
import { useCardMorph } from '../../hooks/useCardMorph';

const DailyPlanWidget = ({ helpText }) => {
  const { currentDayData } = useDailyPlan();
  const { db, navigate } = useAppServices();
  const {
    morphEnabled,
    expandedKey,
    openMorph,
    closeMorph,
    prefersReducedMotion,
    transition,
  } = useCardMorph();
  const [selectedResource, setSelectedResource] = useState(null);
  const [loadingResource, setLoadingResource] = useState(false);

  // Helper to handle navigation or modal opening
  const handleActionClick = async (action, layoutKey) => {
    // If it's a Read & Rep (Unified Content), open it inline (morph or modal)
    if (action.resourceId) {
      setLoadingResource(true);
      openMorph(layoutKey);
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
              <p className="text-sm text-slate-600 dark:text-slate-300">No specific items scheduled for today.</p>
            </div>
          )}
          
          {/* Actions */}
          {actions.map((action, idx) => {
            const isReadRep = action.type === 'read_rep' || (action.resourceId && !action.type); // Guessing if type missing
            const layoutKey = `dp-action-${action.resourceId || idx}`;
            const isExpanded = expandedKey === layoutKey;

            // Row markup. When expanded, render the SAME markup but invisible
            // so the dashboard reserves its exact original height (no layout
            // jump) and the layoutId lives only on the overlay copy. When
            // collapsed, the row carries the layoutId and AnimatePresence
            // morphs back into it on close.
            const rowInner = (
              <>
                <div className={`w-2 h-2 rounded-full ${action.type === 'daily_rep' ? 'bg-corporate-teal' : 'bg-orange-400'}`}></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{action.label}</div>
                    {/* Optional Badge for Read & Reps */}
                    {isReadRep && (
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded font-medium uppercase tracking-wide">
                        Optional
                      </span>
                    )}
                  </div>

                  {action.resourceId && (
                    <button
                      type="button"
                      className="mt-2 text-xs text-blue-600 flex items-center gap-1.5 cursor-pointer hover:underline group focus:outline-none focus-visible:ring-2 focus-visible:ring-corporate-teal rounded"
                      onClick={() => handleActionClick(action, layoutKey)}
                    >
                      <div className="p-1 bg-blue-50 rounded-full group-hover:bg-blue-100 transition-colors">
                        <FileText className="w-3 h-3" />
                      </div>
                      <span className="font-medium">{action.resourceTitle || 'View Synopsis'}</span>
                    </button>
                  )}
                </div>
              </>
            );

            if (isExpanded && morphEnabled) {
              return (
                <div
                  key={`action-${idx}`}
                  aria-hidden="true"
                  // visibility:hidden preserves the exact natural height — no
                  // layout jump when the row "lifts" into the overlay.
                  style={{ visibility: 'hidden' }}
                  className="flex gap-3 items-center p-3 rounded-lg border border-slate-200 shadow-sm"
                >
                  {rowInner}
                </div>
              );
            }

            if (!morphEnabled) {
              // Flag OFF: plain row, no shared-element animation. The detail
              // view renders as a centered modal in the AnimatePresence below.
              return (
                <div
                  key={`action-${idx}`}
                  className="flex gap-3 items-center p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm"
                >
                  {rowInner}
                </div>
              );
            }

            return (
              <motion.div
                key={`action-${idx}`}
                layoutId={layoutKey}
                transition={transition}
                className="flex gap-3 items-center p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm"
              >
                {rowInner}
              </motion.div>
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

      {/* Detail viewer — morph (flag ON) or plain modal (flag OFF).
          When morphEnabled, the clicked row IS this card via shared layoutId,
          so framer-motion interpolates position/size/border-radius.
          When OFF, the same content renders as a fade-in centered modal. */}
      <AnimatePresence>
        {expandedKey && (
          <>
            {/* Scrim — fades independently */}
            <motion.div
              key="dp-scrim"
              className="fixed inset-0 z-50 bg-corporate-navy/40 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
              onClick={closeMorph}
              aria-hidden="true"
            />

            {/* Centering wrapper — see AskTrainerWidget note: framer-motion
                controls `transform` during layout animations, so the morphed
                card cannot use translate-* utilities for centering. */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                key="dp-expanded"
                layoutId={morphEnabled ? expandedKey : undefined}
                initial={morphEnabled ? false : { opacity: 0, scale: 0.96 }}
                animate={morphEnabled ? undefined : { opacity: 1, scale: 1 }}
                exit={morphEnabled ? undefined : { opacity: 0, scale: 0.96 }}
                transition={transition}
                role="dialog"
                aria-modal="true"
                aria-label={selectedResource?.title || 'Resource Details'}
                className="w-full max-w-3xl max-h-[88vh] overflow-hidden bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 shadow-2xl flex flex-col pointer-events-auto"
              >
              {/* Header — fades in after the morph so it doesn't fight the layout transition */}
              <motion.div
                className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: prefersReducedMotion ? 0 : 0.12, duration: 0.15 }}
              >
                <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 truncate pr-4">
                  {selectedResource?.title || (loadingResource ? 'Loading…' : 'Resource Details')}
                </h2>
                <button
                  type="button"
                  onClick={closeMorph}
                  className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-corporate-teal"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </motion.div>

              {/* Body */}
              <motion.div
                className="overflow-y-auto flex-1"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: prefersReducedMotion ? 0 : 0.14, duration: 0.18 }}
              >
                {loadingResource ? (
                  <div className="flex flex-col items-center justify-center p-12 space-y-3">
                    <Loader className="w-8 h-8 text-corporate-teal animate-spin" />
                    <p className="text-sm text-slate-600 dark:text-slate-300">Loading content...</p>
                  </div>
                ) : selectedResource ? (
                  <div className="min-h-[40vh] p-2">
                    <UniversalResourceViewer
                      resource={selectedResource}
                      onClose={closeMorph}
                      inline={true}
                    />
                  </div>
                ) : (
                  <div className="text-center p-8">
                    <p className="text-slate-600 dark:text-slate-300">Content not found.</p>
                  </div>
                )}
              </motion.div>
            </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default DailyPlanWidget;
