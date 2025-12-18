import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAppServices } from '../../services/useAppServices';
import { X, Save, RefreshCw, Calendar, AlertTriangle } from 'lucide-react';

const PrepStatusModal = ({ isOpen, onClose, userId, userName }) => {
  const { db } = useAppServices();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prepVisitLog, setPrepVisitLog] = useState([]);
  const [targetDay, setTargetDay] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && userId) {
      fetchPrepData();
    }
  }, [isOpen, userId]);

  const fetchPrepData = async () => {
    setLoading(true);
    setError(null);
    try {
      const docRef = doc(db, `modules/${userId}/development_plan/current`);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const log = data.prepVisitLog || [];
        setPrepVisitLog(log);
        setTargetDay(log.length);
      } else {
        setPrepVisitLog([]);
        setTargetDay(0);
      }
    } catch (err) {
      console.error("Error fetching prep data:", err);
      setError("Failed to load user data.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let newLog = [...prepVisitLog];
      const currentCount = newLog.length;
      const targetCount = parseInt(targetDay, 10);

      if (targetCount > currentCount) {
        // Add dummy dates
        const needed = targetCount - currentCount;
        const today = new Date();
        for (let i = 0; i < needed; i++) {
          // Create dates in the past to avoid future date issues, 
          // but ensure they are unique strings
          const d = new Date(today);
          d.setDate(today.getDate() - (currentCount + i + 1));
          newLog.push(d.toISOString().split('T')[0]);
        }
      } else if (targetCount < currentCount) {
        // Remove latest dates
        newLog = newLog.slice(0, targetCount);
      }

      const docRef = doc(db, `modules/${userId}/development_plan/current`);
      
      // Ensure document exists (upsert)
      // We use setDoc with merge: true in case the doc doesn't exist yet
      const { setDoc } = await import('firebase/firestore');
      await setDoc(docRef, {
        prepVisitLog: newLog,
        updatedAt: serverTimestamp()
      }, { merge: true });

      setPrepVisitLog(newLog);
      onClose();
    } catch (err) {
      console.error("Error saving prep data:", err);
      setError("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

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

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Current Prep Day (Login Count)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    min="0"
                    max="14"
                    value={targetDay}
                    onChange={(e) => setTargetDay(e.target.value)}
                    className="w-24 px-4 py-2 text-lg font-bold text-center border border-slate-300 rounded-lg focus:ring-2 focus:ring-corporate-teal focus:border-corporate-teal outline-none"
                  />
                  <span className="text-slate-500 text-sm">
                    (Currently: {prepVisitLog.length})
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Adjusting this value will add or remove entries from the user's login log to simulate progress.
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
