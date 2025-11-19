import React, { useState, useEffect, useMemo } from 'react';
import { useAppServices } from '../../services/useAppServices';
import { dailyLogService } from '../../services/dailyLogService';
import { adaptDevelopmentPlanData } from '../../utils/devPlanAdapter';
import WinTracker from '../arena/WinTracker';
import BookendsWidget from '../arena/BookendsWidget';
import FocusCard from '../arena/FocusCard';
import { Calendar, ChevronRight, Activity, Dumbbell, Target } from 'lucide-react';

const ArenaDashboard = () => {
  const { user, db, developmentPlanData, navigate } = useAppServices();
  const [dailyLog, setDailyLog] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Date Management - Auto-update at midnight
  const [currentDate, setCurrentDate] = useState(new Date());
  const dateId = dailyLogService.getDateId(currentDate);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      if (dailyLogService.getDateId(now) !== dateId) {
        setCurrentDate(now);
      }
    }, 60000); // Check every minute
    return () => clearInterval(timer);
  }, [dateId]);
  
  // Bookend Mode State (Lifted from BookendsWidget)
  const [bookendMode, setBookendMode] = useState('AM');
  const [reflectionHistory, setReflectionHistory] = useState([]);

  // Adapt Development Plan Data
  const adaptedDevPlan = useMemo(() => {
    return adaptDevelopmentPlanData(developmentPlanData);
  }, [developmentPlanData]);

  const currentPlan = adaptedDevPlan?.currentPlan;
  const focusAreas = currentPlan?._originalFocusAreas || currentPlan?.focusAreas || [];
  const primaryFocus = focusAreas.length > 0 ? focusAreas[0].name : 'No active plan';
  const planProgress = currentPlan ? Math.round((currentPlan.cycle || 1) * 10) : 0; // Mock progress if needed

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
    
    // Fetch history
    const fetchHistory = async () => {
      const history = await dailyLogService.getReflectionHistory(db, user.uid);
      setReflectionHistory(history);
    };
    fetchHistory();

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
    try {
      await dailyLogService.deleteWinItem(db, user.uid, dateId, itemId);
    } catch (error) {
      console.error("Error deleting win:", error);
    }
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
        <div className="lg:col-span-7 h-full overflow-hidden flex flex-col">
          {bookendMode === 'AM' ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-300 p-8 h-full overflow-y-auto">
              {/* Unified AM Sheet */}
              <div className="space-y-8">
                <FocusCard block={1} focus="Feedback" />
                
                <WinTracker 
                  wins={wins} 
                  onToggle={handleToggleWin}
                  onDelete={handleDeleteWin}
                />

                {/* Daily Reps Section */}
                <div>
                   <div className="flex items-center justify-between mb-2">
                     <h3 className="text-lg font-bold text-corporate-navy font-serif">Daily Rep:</h3>
                     <span className="text-xs text-gray-400 uppercase tracking-wider">Coming Soon</span>
                   </div>
                   <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                     <div className="h-6 w-full bg-gray-100 rounded animate-pulse"></div>
                   </div>
                </div>

                {/* Upcoming Events Section */}
                <div>
                   <div className="flex items-center justify-between mb-2">
                     <h3 className="text-lg font-bold text-corporate-navy font-serif">Upcoming Events:</h3>
                     <span className="text-xs text-gray-400 uppercase tracking-wider">Coming Soon</span>
                   </div>
                   <div className="space-y-2 pl-4">
                      <div className="flex gap-2 text-sm text-gray-500">
                        <div className="w-1.5 h-1.5 rounded-full bg-corporate-teal mt-2 flex-shrink-0"></div>
                        <div className="flex-1 border-b border-gray-100 pb-1">Team Meeting - 11/20/25 4:00pm</div>
                      </div>
                      <div className="flex gap-2 text-sm text-gray-500">
                        <div className="w-1.5 h-1.5 rounded-full bg-corporate-teal mt-2 flex-shrink-0"></div>
                        <div className="flex-1 border-b border-gray-100 pb-1">Coaching Session - 11/25/25 10:00am</div>
                      </div>
                   </div>
                </div>

                {/* Development Plan Details (AM View) */}
                <div>
                  <div 
                    className="flex items-center justify-between mb-4 cursor-pointer group"
                    onClick={() => navigate('development-plan')}
                  >
                    <h3 className="text-xl font-bold text-corporate-navy font-serif group-hover:text-corporate-teal transition-colors">
                      Development Plan Details
                    </h3>
                    <ChevronRight className="w-6 h-6 text-corporate-navy transform rotate-90 transition-transform group-hover:text-corporate-teal" />
                  </div>
                  <div className="pl-4 border-l-2 border-gray-100">
                    {currentPlan ? (
                      <div 
                        className="bg-gray-50 rounded-lg border border-gray-100 p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => navigate('development-plan')}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="text-xs font-bold text-corporate-teal uppercase tracking-wider">Current Focus</span>
                            <h4 className="font-bold text-corporate-navy text-lg">{primaryFocus}</h4>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cycle</span>
                            <div className="font-bold text-corporate-navy">{currentPlan.cycle || 1}</div>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 italic line-clamp-2">
                          {focusAreas[0]?.why || "Focusing on core leadership competencies."}
                        </p>
                      </div>
                    ) : (
                      <div 
                        className="h-20 bg-gray-50 rounded-lg border border-gray-100 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => navigate('development-plan')}
                      >
                        <span className="font-medium text-corporate-navy">No Active Plan</span>
                        <span className="text-xs italic">Click to start your development journey</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-300 p-8 h-full overflow-y-auto">
              {/* Unified PM Sheet */}
              <div className="space-y-12">
                
                {/* Development Plan Details */}
                <div>
                  <div className="flex items-center justify-between mb-4 cursor-pointer group">
                    <h3 className="text-xl font-bold text-corporate-navy font-serif">
                      Development Plan Details
                    </h3>
                    <ChevronRight className="w-6 h-6 text-corporate-navy transform rotate-90 transition-transform" />
                  </div>
                  <div className="pl-4 border-l-2 border-gray-100">
                    <div className="h-20 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center text-gray-400 italic text-sm">
                      Plan details content...
                    </div>
                  </div>
                </div>

                {/* Habit Tracking */}
                <div>
                  <h3 className="text-xl font-bold text-corporate-navy font-serif mb-6">
                    Habit Tracking
                  </h3>
                  <div className="space-y-6 pl-2">
                    {[
                      { id: 1, streak: '6-day streak' },
                      { id: 2, streak: '1-day streak' },
                      { id: 3, streak: '12-day streak' }
                    ].map((habit) => (
                      <div key={habit.id} className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full border-2 border-corporate-navy flex items-center justify-center font-bold text-corporate-navy">
                          {habit.id}
                        </div>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-corporate-teal w-2/3 opacity-50"></div>
                        </div>
                        <span className="text-corporate-navy font-medium font-serif whitespace-nowrap">
                          {habit.streak}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
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
            reflectionHistory={reflectionHistory}
          />
        </div>

      </div>
    </div>
  );
};

export default ArenaDashboard;
