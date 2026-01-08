import React, { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useAppServices } from '../../services/useAppServices';
import { X, Save, RefreshCw, Calendar, AlertTriangle, CheckCircle, Circle, Trophy } from 'lucide-react';

// The 5 required prep items
const REQUIRED_PREP_ITEMS = [
  { id: 'leaderProfile', label: 'Leader Profile', field: 'leaderProfile' },
  { id: 'baselineAssessment', label: 'Baseline Assessment', field: 'baselineAssessment' },
  { id: 'action-prep-001-video', label: 'Foundation Video', field: 'videoWatched' },
  { id: 'action-prep-001-workbook', label: 'Foundation Workbook', field: 'workbookDownloaded' },
  { id: 'action-prep-002-exercises', label: 'Prep Exercises', field: 'exercisesComplete' }
];

const PrepStatusModal = ({ isOpen, onClose, userId, userName }) => {
  const { db } = useAppServices();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prepStatus, setPrepStatus] = useState({});
  const [leaderProfileData, setLeaderProfileData] = useState(null);
  const [error, setError] = useState(null);

  const fetchPrepData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch development plan data
      const devPlanRef = doc(db, `modules/${userId}/development_plan/current`);
      const devPlanSnap = await getDoc(devPlanRef);
      
      // Fetch leader profile
      const profileRef = doc(db, `modules/${userId}/profile/leader`);
      const profileSnap = await getDoc(profileRef);
      
      // Fetch action progress
      const actionProgressRef = doc(db, `modules/${userId}/action_progress/current`);
      const actionProgressSnap = await getDoc(actionProgressRef);
      
      const devPlanData = devPlanSnap.exists() ? devPlanSnap.data() : {};
      const profileData = profileSnap.exists() ? profileSnap.data() : null;
      const actionProgress = actionProgressSnap.exists() ? actionProgressSnap.data() : {};
      
      setLeaderProfileData(profileData);
      
      // Determine status for each required prep item
      const status = {
        // Leader Profile - check if profile exists with required fields
        leaderProfile: !!(profileData?.role && profileData?.goals?.length > 0),
        
        // Baseline Assessment - check assessmentHistory
        baselineAssessment: !!(
          devPlanData?.assessmentHistory?.length > 0 ||
          devPlanData?.currentPlan?.focusAreas?.length > 0
        ),
        
        // Video - check action progress
        videoWatched: actionProgress?.['action-prep-001-video']?.status === 'completed',
        
        // Workbook - check action progress  
        workbookDownloaded: actionProgress?.['action-prep-001-workbook']?.status === 'completed',
        
        // Exercises - check action progress
        exercisesComplete: actionProgress?.['action-prep-002-exercises']?.status === 'completed'
      };
      
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

  const togglePrepItem = (field) => {
    setPrepStatus(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const actionProgressRef = doc(db, `modules/${userId}/action_progress/current`);
      
      // Build updates for action progress
      const actionUpdates = {};
      
      if (prepStatus.videoWatched) {
        actionUpdates['action-prep-001-video'] = { status: 'completed', completedAt: new Date().toISOString() };
      } else {
        actionUpdates['action-prep-001-video'] = { status: 'not_started' };
      }
      
      if (prepStatus.workbookDownloaded) {
        actionUpdates['action-prep-001-workbook'] = { status: 'completed', completedAt: new Date().toISOString() };
      } else {
        actionUpdates['action-prep-001-workbook'] = { status: 'not_started' };
      }
      
      if (prepStatus.exercisesComplete) {
        actionUpdates['action-prep-002-exercises'] = { status: 'completed', completedAt: new Date().toISOString() };
      } else {
        actionUpdates['action-prep-002-exercises'] = { status: 'not_started' };
      }
      
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
  const allComplete = completedCount === 5;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
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
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-800">
                  Editing Prep Phase for <span className="font-bold">{userName}</span>
                </p>
              </div>

              {error && (
                <div className="bg-red-50 p-3 rounded-lg border border-red-100 flex items-center gap-2 text-red-700 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  {error}
                </div>
              )}

              {/* Progress Summary */}
              <div className={`p-4 rounded-lg border ${allComplete ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
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
                    {completedCount}/5
                  </span>
                </div>
              </div>

              {/* Required Prep Items */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Required Prep Items (Progress-Based)
                </label>
                <div className="space-y-2">
                  {REQUIRED_PREP_ITEMS.map((item) => {
                    const isComplete = prepStatus[item.field];
                    const isEditable = item.field !== 'leaderProfile' && item.field !== 'baselineAssessment';
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => isEditable && togglePrepItem(item.field)}
                        disabled={!isEditable}
                        className={`
                          w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left
                          ${isComplete 
                            ? 'bg-emerald-50 border-emerald-200' 
                            : 'bg-white border-slate-200 hover:border-slate-300'
                          }
                          ${!isEditable ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}
                        `}
                      >
                        {isComplete ? (
                          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-400 flex-shrink-0" />
                        )}
                        <span className={`flex-1 font-medium ${isComplete ? 'text-emerald-800' : 'text-slate-700'}`}>
                          {item.label}
                        </span>
                        {!isEditable && (
                          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                            Read-only
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-500 mt-3">
                  Click to toggle completion status. Leader Profile and Baseline Assessment are determined by actual data and cannot be manually toggled.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg font-medium transition-colors"
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
