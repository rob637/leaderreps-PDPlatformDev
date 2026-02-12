import React, { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, serverTimestamp, setDoc, collection, query, orderBy, getDocs } from 'firebase/firestore';
import { useAppServices } from '../../services/useAppServices';
import { X, Save, RefreshCw, Calendar, AlertTriangle, CheckCircle, Circle, Trophy } from 'lucide-react';

const PrepStatusModal = ({ isOpen, onClose, userId, userName }) => {
  const { db } = useAppServices();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prepStatus, setPrepStatus] = useState({});
  const [requiredPrepItems, setRequiredPrepItems] = useState([]);
  const [error, setError] = useState(null);

  const fetchPrepData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch daily plan to get required prep items dynamically
      const dailyPlanQuery = query(collection(db, 'daily_plan_v1'), orderBy('dayNumber', 'asc'));
      const dailyPlanSnap = await getDocs(dailyPlanQuery);
      const dailyPlan = dailyPlanSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Filter to prep phase days by phase field (not time-based)
      const prepDays = dailyPlan.filter(d => d.phase === 'pre-start');
      
      // Collect all required prep actions
      const allPrepActions = [];
      prepDays.forEach(day => {
        if (day.actions) {
          day.actions.forEach((action, idx) => {
            // Skip daily_rep type
            if (action.type === 'daily_rep') return;
            // Check if required
            const isRequired = action.required === true || (action.required !== false && action.optional !== true);
            if (isRequired) {
              allPrepActions.push({
                ...action,
                id: action.id || `daily-${day.id}-${idx}`,
                dayId: day.id
              });
            }
          });
        }
      });
      
      setRequiredPrepItems(allPrepActions);
      
      // 2. Fetch user data to check completion status
      const devPlanRef = doc(db, `modules/${userId}/development_plan/current`);
      const devPlanSnap = await getDoc(devPlanRef);
      
      const profileRef = doc(db, `modules/${userId}/profile/leader`);
      const profileSnap = await getDoc(profileRef);
      
      const actionProgressRef = doc(db, `modules/${userId}/action_progress/current`);
      const actionProgressSnap = await getDoc(actionProgressRef);
      
      const devPlanData = devPlanSnap.exists() ? devPlanSnap.data() : {};
      const profileData = profileSnap.exists() ? profileSnap.data() : null;
      const actionProgress = actionProgressSnap.exists() ? actionProgressSnap.data() : {};
      
      // Determine status for each required prep item
      const status = {};
      allPrepActions.forEach(action => {
        const handlerType = action.handlerType || '';
        const labelLower = (action.label || '').toLowerCase();
        
        let complete = false;
        
        // Special handling for interactive items
        if (handlerType === 'leader-profile' || labelLower.includes('leader profile')) {
          complete = !!(profileData?.role && profileData?.goals?.length > 0);
        } else if (handlerType === 'baseline-assessment' || labelLower.includes('baseline assessment')) {
          complete = !!(
            devPlanData?.assessmentHistory?.length > 0 ||
            devPlanData?.currentPlan?.focusAreas?.length > 0
          );
        } else {
          // Check action progress
          complete = actionProgress?.[action.id]?.status === 'completed';
        }
        
        status[action.id] = complete;
      });
      
      setPrepStatus(status);
    } catch (err) {
      console.error("Error fetching prep data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [db, userId]);

  useEffect(() => {
    if (isOpen && userId) {
      fetchPrepData();
    }
  }, [isOpen, userId, fetchPrepData]);

  const togglePrepItem = (actionId) => {
    setPrepStatus(prev => ({
      ...prev,
      [actionId]: !prev[actionId]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const actionProgressRef = doc(db, `modules/${userId}/action_progress/current`);
      
      // Build updates for action progress based on dynamic items
      const actionUpdates = {};
      
      requiredPrepItems.forEach(item => {
        const handlerType = item.handlerType || '';
        const labelLower = (item.label || '').toLowerCase();
        
        // Skip interactive items - they can't be manually toggled
        if (handlerType === 'leader-profile' || labelLower.includes('leader profile')) return;
        if (handlerType === 'baseline-assessment' || labelLower.includes('baseline assessment')) return;
        
        // Update action progress for this item
        if (prepStatus[item.id]) {
          actionUpdates[item.id] = { status: 'completed', completedAt: new Date().toISOString() };
        } else {
          actionUpdates[item.id] = { status: 'not_started' };
        }
      });
      
      await setDoc(actionProgressRef, {
        ...actionUpdates,
        updatedAt: serverTimestamp()
      }, { merge: true });

      onClose();
    } catch (err) {
      console.error("Error saving prep data:", err);
      setError("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const completedCount = Object.values(prepStatus).filter(Boolean).length;
  const totalCount = requiredPrepItems.length;
  const allComplete = totalCount > 0 && completedCount === totalCount;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 dark:bg-slate-800">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-corporate-teal" />
            Manage Prep Phase
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin text-corporate-teal" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                <p className="text-sm text-blue-800">
                  Editing Prep Phase for <span className="font-bold">{userName}</span>
                </p>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 flex items-center gap-2 text-red-700 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  {error}
                </div>
              )}

              {/* Progress Summary */}
              <div className={`p-4 rounded-lg border ${allComplete ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {allComplete ? (
                      <Trophy className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                    )}
                    <span className={`font-bold ${allComplete ? 'text-emerald-800' : 'text-amber-800'}`}>
                      {allComplete ? 'Required Prep Complete!' : 'Required Prep In Progress'}
                    </span>
                  </div>
                  <span className={`text-sm font-bold px-2 py-1 rounded-full ${allComplete ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-200 text-amber-800'}`}>
                    {completedCount}/{totalCount}
                  </span>
                </div>
              </div>

              {/* Required Prep Items */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-3">
                  Required Prep Items (from Daily Plan)
                </label>
                {requiredPrepItems.length === 0 ? (
                  <div className="text-center py-4 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <p className="text-sm">No required prep items found in the daily plan.</p>
                    <p className="text-xs mt-1">Configure required prep items in the Daily Plan Manager.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {requiredPrepItems.map((item) => {
                      const handlerType = item.handlerType || '';
                      const labelLower = (item.label || '').toLowerCase();
                      const isComplete = prepStatus[item.id];
                      const isInteractive = handlerType === 'leader-profile' || 
                                           labelLower.includes('leader profile') ||
                                           handlerType === 'baseline-assessment' || 
                                           labelLower.includes('baseline assessment');
                      
                      return (
                        <button
                          key={item.id}
                          onClick={() => !isInteractive && togglePrepItem(item.id)}
                          disabled={isInteractive}
                          className={`
                            w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left
                            ${isComplete 
                              ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' 
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                            }
                            ${isInteractive ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}
                          `}
                        >
                          {isComplete ? (
                            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-400 flex-shrink-0" />
                          )}
                          <span className={`flex-1 font-medium ${isComplete ? 'text-emerald-800' : 'text-slate-700 dark:text-slate-200'}`}>
                            {item.label || 'Required Item'}
                          </span>
                          {isInteractive && (
                            <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                              Read-only
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                  Click to toggle completion status. Interactive items (Leader Profile, Baseline Assessment) are determined by actual data.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-corporate-teal text-white rounded-lg hover:bg-teal-700 font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Update Progress
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrepStatusModal;
