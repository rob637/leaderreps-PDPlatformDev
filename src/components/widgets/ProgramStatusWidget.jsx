import React, { useState } from 'react';
import { Calendar, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { useAppServices } from '../../services/useAppServices';
import { useDailyPlan } from '../../hooks/useDailyPlan';
import { Card } from '../ui';

const ProgramStatusWidget = () => {
  const { user, updateDevelopmentPlanData, isAdmin } = useAppServices();
  const { currentDayNumber, userState, simulatedNow } = useDailyPlan();
  const [isFixing, setIsFixing] = useState(false);

  const startDate = userState?.startDate ? (
    userState.startDate.toDate ? userState.startDate.toDate() : new Date(userState.startDate)
  ) : null;

  const prepStartDate = startDate ? new Date(startDate.getTime() - (14 * 24 * 60 * 60 * 1000)) : null;

  const handleResetDate = async () => {
    if (!confirm("This will reset your Start Date to 14 days from now (starting Prep Day 1 today). Continue?")) return;
    setIsFixing(true);
    try {
      // Set start date to 14 days in future
      const newStart = new Date();
      newStart.setDate(newStart.getDate() + 14);
      newStart.setHours(0, 0, 0, 0);
      
      await updateDevelopmentPlanData({ startDate: newStart });
      window.location.reload();
    } catch (error) {
      console.error("Error resetting date:", error);
      alert("Failed to reset date");
    } finally {
      setIsFixing(false);
    }
  };

  // Only show to admins - this is a debug widget
  if (!isAdmin) return null;

  return (
    <Card title="Program Status (Admin Debug)" icon={Clock} accent="RED">
      <div className="space-y-3 text-xs">
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded border border-slate-100">
            <div className="font-bold text-slate-500 dark:text-slate-400">Current Date</div>
            <div className="text-slate-800 dark:text-slate-200">{simulatedNow.toLocaleDateString()}</div>
          </div>
          <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded border border-slate-100">
            <div className="font-bold text-slate-500 dark:text-slate-400">Day Number</div>
            <div className={`font-bold ${currentDayNumber < 1 ? 'text-orange-500' : 'text-blue-600'}`}>
              Day {currentDayNumber}
            </div>
          </div>
        </div>

        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-100 dark:border-blue-800">
          <div className="flex justify-between items-center mb-1">
            <span className="font-bold text-blue-800">Cohort Start (Day 1)</span>
            <Calendar className="w-3 h-3 text-blue-500" />
          </div>
          <div className="text-blue-900 font-mono">
            {startDate ? startDate.toLocaleDateString() : 'Not Set'}
          </div>
        </div>

        <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded border border-orange-100">
          <div className="flex justify-between items-center mb-1">
            <span className="font-bold text-orange-800">Prep Start (Day -14)</span>
            <Calendar className="w-3 h-3 text-orange-500" />
          </div>
          <div className="text-orange-900 font-mono">
            {prepStartDate ? prepStartDate.toLocaleDateString() : 'Not Set'}
          </div>
        </div>

        {currentDayNumber > 0 && (
          <div className="flex items-start gap-2 p-2 bg-red-50 dark:bg-red-900/20 text-red-700 rounded border border-red-100">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              You are in the main program (Week {Math.ceil(currentDayNumber / 7)}).
              If you expected Prep, your Start Date is in the past.
            </div>
          </div>
        )}

        <button 
          onClick={handleResetDate}
          disabled={isFixing}
          className="w-full py-2 bg-slate-800 text-white rounded hover:bg-slate-700 flex items-center justify-center gap-2"
        >
          <RefreshCw className={`w-3 h-3 ${isFixing ? 'animate-spin' : ''}`} />
          Reset to Prep Day 1 (Start +14d)
        </button>
      </div>
    </Card>
  );
};

export default ProgramStatusWidget;
