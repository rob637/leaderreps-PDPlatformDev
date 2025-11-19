import React, { useState, useEffect } from 'react';
import { useAppServices } from '../../services/useAppServices';
import { dailyLogService } from '../../services/dailyLogService';
import WinTracker from '../arena/WinTracker';
import BookendsWidget from '../arena/BookendsWidget';
import FocusCard from '../arena/FocusCard';
import { Calendar, ChevronRight, Activity, Dumbbell } from 'lucide-react';

const ArenaDashboard = () => {
  const { user, db } = useAppServices();
  const [dailyLog, setDailyLog] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Date Management
  const [currentDate] = useState(new Date());
  const dateId = dailyLogService.getDateId(currentDate);
  
  // Bookend Mode State (Lifted from BookendsWidget)
  const [bookendMode, setBookendMode] = useState('AM');

  // Subscribe to data
  useEffect(() => {
    if (!user?.uid || !db) return;

    setLoading(true);
    const unsubscribe = dailyLogService.subscribeToDailyLog(
      db, 
      user.uid, 
      dateId, 
      (data) => {
        setDailyLog(data || {});
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, db, dateId]);

  // Handlers
  const handleAddWin = async (text, type) => {
    try {
      await dailyLogService.addWinItem(db, user.uid, dateId, text, type);
    } catch (error) {
      console.error("Error adding win:", error);
    }
  };

  const handleToggleWin = async (itemId) => {
    try {
      await dailyLogService.toggleWinItem(db, user.uid, dateId, itemId);
    } catch (error) {
      console.error("Error toggling win:", error);
    }
  };

  const handleDeleteWin = async (itemId) => {
    // Optional: Implement delete if needed
    console.log("Delete not implemented yet", itemId);
  };

  const handleUpdatePM = async (data) => {
    try {
      await dailyLogService.saveDailyLog(db, user.uid, dateId, data);
    } catch (error) {
      console.error("Error saving PM reflection:", error);
    }
  };

  // Calculate Stats
  const wins = dailyLog?.wins || [];
  const stats = {
    completedTasks: wins.filter(w => w.completed).length,
    totalTasks: wins.length,
    dailyReps: dailyLog?.dailyRep || false,
    grounding: dailyLog?.groundingRep || false
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-400">Loading Arena...</div>;
  }

  return (
    <div className="min-h-full p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header Section Removed - Moved to AppContent */}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)] min-h-[600px]">
        
        {/* Left/Center Column: Training & WINs */}
        <div className="lg:col-span-7 flex flex-col gap-6 h-full overflow-hidden">
          {bookendMode === 'AM' ? (
            <>
              <FocusCard block={1} focus="Feedback" />
              
              <div className="flex-1 min-h-0">
                <WinTracker 
                  wins={wins} 
                  onToggle={handleToggleWin}
                  onDelete={handleDeleteWin}
                />
              </div>

              {/* Placeholder for Daily Reps */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-300 p-6">
                 <div className="flex items-center justify-between mb-4">
                   <h3 className="font-bold text-corporate-navy">Daily Reps</h3>
                   <span className="text-xs text-gray-400 uppercase tracking-wider">Coming Soon</span>
                 </div>
                 <div className="p-4 bg-gray-50 rounded-xl text-center text-gray-400 italic text-sm">
                   Your daily leadership exercises will appear here.
                 </div>
              </div>

              {/* Placeholder for Upcoming Events */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-300 p-6">
                 <div className="flex items-center justify-between mb-4">
                   <h3 className="font-bold text-corporate-navy">Upcoming Events</h3>
                   <span className="text-xs text-gray-400 uppercase tracking-wider">Coming Soon</span>
                 </div>
                 <div className="p-4 bg-gray-50 rounded-xl text-center text-gray-400 italic text-sm">
                   Team meetings and coaching sessions will appear here.
                 </div>
              </div>
            </>
          ) : (
            <>
              {/* PM Mode: Development Plan Details & Habit Tracking */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-300 p-6 flex-1">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-xl text-corporate-navy flex items-center gap-2">
                    <Target className="w-6 h-6 text-corporate-teal" />
                    Development Plan Details
                  </h3>
                </div>
                <div className="p-8 bg-gray-50 rounded-xl text-center border border-gray-100 h-full flex items-center justify-center">
                  <div className="text-gray-400">
                    <p className="font-medium mb-2">Your Development Plan Review</p>
                    <p className="text-sm italic">Review your progress on your core competencies.</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-300 p-6 flex-1">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-xl text-corporate-navy flex items-center gap-2">
                    <Activity className="w-6 h-6 text-corporate-orange" />
                    Habit Tracking
                  </h3>
                </div>
                <div className="p-8 bg-gray-50 rounded-xl text-center border border-gray-100 h-full flex items-center justify-center">
                  <div className="text-gray-400">
                    <p className="font-medium mb-2">Daily Habit Check-in</p>
                    <p className="text-sm italic">Track your consistency and build momentum.</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right Column: Bookends */}
        <div className="lg:col-span-5 h-full min-h-[500px]">
          <BookendsWidget 
            pmData={dailyLog}
            onUpdatePM={handleUpdatePM}
            onAddWin={handleAddWin}
            stats={stats}
            wins={wins}
            mode={bookendMode}
            setMode={setBookendMode}
          />
        </div>

      </div>
    </div>
  );
};

export default ArenaDashboard;
