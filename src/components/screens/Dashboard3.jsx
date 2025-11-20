// src/components/screens/Dashboard3.jsx
// Dashboard 3: Rebuild based on "The Arena" Sketch
// Implements the specific layout requested: Focus, AM Reps, Win the Day, Notifications, Scorecard, PM Reflection.

import React, { useState, useEffect } from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';
import { useDashboard } from './dashboard/DashboardHooks.jsx';
import { 
  CheckCircle, Circle, Plus, Save, Bell, Trophy, Flame,
  Calendar, ChevronRight, ArrowRight, Edit3, CheckSquare, Square
} from 'lucide-react';
import { COLORS } from './dashboard/dashboardConstants.js';

const Dashboard3 = () => {
  const { 
    user, 
    userData,
    dailyPracticeData, 
    updateDailyPracticeData,
    globalMetadata
  } = useAppServices();

  // Determine display name (First Name Only)
  const getFirstName = () => {
    if (userData?.firstName) return userData.firstName;
    if (user?.displayName) return user.displayName.split(' ')[0];
    return 'Leader';
  };
  
  const firstName = getFirstName();

  // Use the shared dashboard logic for persistence
  const {
    // AM Bookend (Win the Day)
    morningWIN,
    setMorningWIN,
    otherTasks,
    
    // PM Bookend (Reflection)
    reflectionGood,
    setReflectionGood,
    reflectionBetter,
    setReflectionBetter,
    handleSaveEveningBookend,
    
    // Habits / Reps
    habitsCompleted,
    handleHabitToggle,
    
    // Streak
    streakCount,

    // Locker History
    winsList,
    setWinsList
  } = useDashboard({
    dailyPracticeData,
    updateDailyPracticeData
  });

  // Local state for the 3 specific "Win the Day" inputs if not fully covered by hook
  // The hook has morningWIN (1) and otherTasks (array). 
  // We will map the UI's 1, 2, 3 to morningWIN and otherTasks[0], otherTasks[1].
  
  const [win1, setWin1] = useState('');
  const [win2, setWin2] = useState('');
  const [win3, setWin3] = useState('');
  
  // Completion states for Wins
  const [win1Completed, setWin1Completed] = useState(false);
  const [win2Completed, setWin2Completed] = useState(false);
  const [win3Completed, setWin3Completed] = useState(false);

  // Sync hook state to local state on load
  useEffect(() => {
    if (morningWIN) setWin1(morningWIN);
    // Check if morningWIN has a completion status stored separately or if we need to migrate
    // For now, we'll assume morningWIN is just text in the hook, but we can store completion in dailyPracticeData directly
    if (dailyPracticeData?.morningWINCompleted) setWin1Completed(dailyPracticeData.morningWINCompleted);

    if (otherTasks && otherTasks.length > 0) {
        setWin2(otherTasks[0]?.text || '');
        setWin2Completed(otherTasks[0]?.completed || false);
    }
    if (otherTasks && otherTasks.length > 1) {
        setWin3(otherTasks[1]?.text || '');
        setWin3Completed(otherTasks[1]?.completed || false);
    }
  }, [morningWIN, otherTasks, dailyPracticeData]);

  const handleSaveWinTheDay = async () => {
    // Save Win 1 (Morning WIN)
    if (win1 !== morningWIN) {
        setMorningWIN(win1);
    }
    
    // Construct otherTasks array for Win 2 and Win 3
    const newTasks = [];
    if (win2) newTasks.push({ id: 'win2', text: win2, completed: win2Completed });
    if (win3) newTasks.push({ id: 'win3', text: win3, completed: win3Completed });
    
    // Update using the correct structure for useDashboard compatibility
    await updateDailyPracticeData({
        morningBookend: {
            dailyWIN: win1,
            winCompleted: win1Completed,
            otherTasks: newTasks,
            completedAt: new Date().toISOString()
        }
    });
  };

  // Auto-save when completion toggles change
  const toggleWinCompletion = async (index, currentStatus) => {
      const newStatus = !currentStatus;
      
      // Prepare winsList update for Locker
      let updatedWinsList = [...winsList];
      const todayDate = new Date().toLocaleDateString();
      let winId = '';
      let winText = '';
      
      if (index === 1) {
          winId = `morning-win-${new Date().toISOString().split('T')[0]}`;
          winText = win1 || 'Morning Win';
      } else if (index === 2) {
          winId = `task-win-win2`;
          winText = win2 || 'Win 2';
      } else if (index === 3) {
          winId = `task-win-win3`;
          winText = win3 || 'Win 3';
      }

      if (newStatus) {
          if (!updatedWinsList.find(w => w.id === winId)) {
              updatedWinsList.push({
                  id: winId,
                  text: winText,
                  date: todayDate,
                  completed: true,
                  timestamp: new Date().toISOString()
              });
          }
      } else {
          updatedWinsList = updatedWinsList.filter(w => w.id !== winId);
      }
      setWinsList(updatedWinsList);

      if (index === 1) {
          setWin1Completed(newStatus);
          // Construct otherTasks to preserve them
          const newTasks = [];
          if (win2) newTasks.push({ id: 'win2', text: win2, completed: win2Completed });
          if (win3) newTasks.push({ id: 'win3', text: win3, completed: win3Completed });

          await updateDailyPracticeData({ 
              'morningBookend.winCompleted': newStatus,
              winsList: updatedWinsList
          });
      } else if (index === 2) {
          setWin2Completed(newStatus);
          const newTasks = [];
          if (win2) newTasks.push({ id: 'win2', text: win2, completed: newStatus });
          if (win3) newTasks.push({ id: 'win3', text: win3, completed: win3Completed });
          
          await updateDailyPracticeData({ 
              'morningBookend.otherTasks': newTasks,
              winsList: updatedWinsList
          });
      } else if (index === 3) {
          setWin3Completed(newStatus);
          const newTasks = [];
          if (win2) newTasks.push({ id: 'win2', text: win2, completed: win2Completed });
          if (win3) newTasks.push({ id: 'win3', text: win3, completed: newStatus });
          
          await updateDailyPracticeData({ 
              'morningBookend.otherTasks': newTasks,
              winsList: updatedWinsList
          });
      }
  };

  // Get Weekly Focus from Global Metadata or Default
  const weeklyFocus = globalMetadata?.weeklyFocus || 'Feedback';

  // Mock Data for Notifications (from Sketch)
  const notifications = [
    { id: 1, text: "Yesterday's 'needs work' -> ...", type: 'alert' },
    { id: 2, text: "Upcoming Feedback Practice session 11/29 4:00", action: "Register", type: 'event' },
    { id: 3, text: "New R&R unlocked", type: 'success' },
    { id: 4, text: "Upcoming Leaders Circle - Tomorrow", status: "Registered", type: 'event' }
  ];

  return (
    <div className="min-h-screen bg-[#FCFCFA] p-4 md:p-8 font-sans text-[#002E47]">
      {/* Header */}
      <header className="mb-8">
        <div className="flex justify-between items-end">
            <div>
                <h1 className="text-4xl font-extrabold tracking-tight text-[#002E47] mb-1">The Arena</h1>
                <p className="text-xl text-[#47A88D] font-medium">Hey, {firstName}.</p>
            </div>
            <div className="hidden md:block text-right max-w-md">
                <p className="text-sm italic text-gray-500">"[Daily quote/saying...]"</p>
            </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Main Content Column */}
        <div className="lg:col-span-8 space-y-8">
            
            {/* Focus Section */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-left">
                <h2 className="text-lg font-bold text-[#002E47] mb-2">This week's Focus: <span className="text-[#E04E1B]">{weeklyFocus}</span></h2>
            </section>

            {/* AM Backend - Lock-in your Day */}
            <section className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-[#47A88D]">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-[#002E47]">AM Bookend <span className="text-sm font-normal text-gray-500">- Lock-in your Day</span></h3>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#47A88D]">Do my Reps</span>
                </div>
                
                <div className="space-y-3">
                    {/* Grounding Rep */}
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left">
                        <button 
                            onClick={() => handleHabitToggle('readLIS', !habitsCompleted.readLIS)}
                            className="focus:outline-none"
                        >
                            {habitsCompleted.readLIS ? 
                                <CheckSquare className="w-6 h-6 text-[#47A88D]" /> : 
                                <Square className="w-6 h-6 text-gray-300" />
                            }
                        </button>
                        <div className="flex-1 text-left">
                            <p className={`font-medium ${habitsCompleted.readLIS ? 'text-gray-400 line-through' : 'text-[#002E47]'}`}>
                                Grounding Rep: Read LIS
                            </p>
                        </div>
                        <span className="text-xs text-gray-400 italic">if no LIS Enter/Save</span>
                    </div>

                    {/* Daily Rep 1 */}
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left">
                        <button 
                            onClick={() => handleHabitToggle('dailyRep1', !habitsCompleted.dailyRep1)}
                            className="focus:outline-none"
                        >
                            {habitsCompleted.dailyRep1 ? 
                                <CheckSquare className="w-6 h-6 text-[#47A88D]" /> : 
                                <Square className="w-6 h-6 text-gray-300" />
                            }
                        </button>
                        <div className="flex-1 text-left">
                            <p className={`font-medium ${habitsCompleted.dailyRep1 ? 'text-gray-400 line-through' : 'text-[#002E47]'}`}>
                                Daily Rep: daily rep (1)
                            </p>
                        </div>
                    </div>

                    {/* Daily Rep 2 */}
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left">
                        <button 
                            onClick={() => handleHabitToggle('dailyRep2', !habitsCompleted.dailyRep2)}
                            className="focus:outline-none"
                        >
                            {habitsCompleted.dailyRep2 ? 
                                <CheckSquare className="w-6 h-6 text-[#47A88D]" /> : 
                                <Square className="w-6 h-6 text-gray-300" />
                            }
                        </button>
                        <div className="flex-1 text-left">
                            <p className={`font-medium ${habitsCompleted.dailyRep2 ? 'text-gray-400 line-through' : 'text-[#002E47]'}`}>
                                Daily Rep: daily rep (2)
                            </p>
                        </div>
                        <span className="text-xs text-gray-400 italic">Daily reps are delivered based on Focus/Dev Plan</span>
                    </div>
                </div>
            </section>

            {/* Win the Day (Today's 1-2-3) */}
            <section className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-[#E04E1B]">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-[#002E47]">AM Bookend <span className="text-sm font-normal text-gray-500">- Win the Day</span></h3>
                    <button onClick={handleSaveWinTheDay} className="text-xs font-bold uppercase tracking-wider text-[#E04E1B] flex items-center gap-1 hover:underline">
                        <Save className="w-3 h-3" /> Save
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Priority 1 */}
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#E04E1B] text-white flex items-center justify-center font-bold shrink-0">1</div>
                        <input 
                            type="text" 
                            value={win1}
                            onChange={(e) => setWin1(e.target.value)}
                            placeholder="Top priority"
                            className={`flex-1 p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#E04E1B]/20 focus:border-[#E04E1B] outline-none transition-all ${win1Completed ? 'text-gray-400 line-through' : ''}`}
                        />
                        <button 
                            onClick={() => toggleWinCompletion(1, win1Completed)}
                            className="text-gray-300 hover:text-[#47A88D] focus:outline-none"
                        >
                            {win1Completed ? 
                                <CheckSquare className="w-6 h-6 text-[#47A88D]" /> : 
                                <Square className="w-6 h-6" />
                            }
                        </button>
                    </div>

                    {/* Priority 2 */}
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#E04E1B]/10 text-[#E04E1B] flex items-center justify-center font-bold shrink-0">2</div>
                        <input 
                            type="text" 
                            value={win2}
                            onChange={(e) => setWin2(e.target.value)}
                            placeholder="Next most important"
                            className={`flex-1 p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#E04E1B]/20 focus:border-[#E04E1B] outline-none transition-all ${win2Completed ? 'text-gray-400 line-through' : ''}`}
                        />
                        <button 
                            onClick={() => toggleWinCompletion(2, win2Completed)}
                            className="text-gray-300 hover:text-[#47A88D] focus:outline-none"
                        >
                            {win2Completed ? 
                                <CheckSquare className="w-6 h-6 text-[#47A88D]" /> : 
                                <Square className="w-6 h-6" />
                            }
                        </button>
                    </div>

                    {/* Priority 3 */}
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#E04E1B]/10 text-[#E04E1B] flex items-center justify-center font-bold shrink-0">3</div>
                        <input 
                            type="text" 
                            value={win3}
                            onChange={(e) => setWin3(e.target.value)}
                            placeholder="Next most important"
                            className={`flex-1 p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#E04E1B]/20 focus:border-[#E04E1B] outline-none transition-all ${win3Completed ? 'text-gray-400 line-through' : ''}`}
                        />
                        <button 
                            onClick={() => toggleWinCompletion(3, win3Completed)}
                            className="text-gray-300 hover:text-[#47A88D] focus:outline-none"
                        >
                            {win3Completed ? 
                                <CheckSquare className="w-6 h-6 text-[#47A88D]" /> : 
                                <Square className="w-6 h-6" />
                            }
                        </button>
                    </div>
                </div>
            </section>

            {/* PM Backend - Reflection */}
            <section className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-[#002E47]">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-[#002E47]">PM Bookend <span className="text-sm font-normal text-gray-500">- Reflection</span></h3>
                    <button onClick={handleSaveEveningBookend} className="text-xs font-bold uppercase tracking-wider text-[#002E47] flex items-center gap-1 hover:underline">
                        <Save className="w-3 h-3" /> Save Journal
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-1 text-left">What went well today?</label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={reflectionGood}
                                onChange={(e) => setReflectionGood(e.target.value)}
                                className="flex-1 p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#002E47]/20 focus:border-[#002E47] outline-none transition-all"
                                placeholder="Add a win..."
                            />
                            <button className="p-3 bg-[#002E47]/5 text-[#002E47] rounded-xl hover:bg-[#002E47]/10">
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-1 text-left">What needs work?</label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={reflectionBetter}
                                onChange={(e) => setReflectionBetter(e.target.value)}
                                className="flex-1 p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#002E47]/20 focus:border-[#002E47] outline-none transition-all"
                                placeholder="Add an improvement..."
                            />
                            <button className="p-3 bg-[#002E47]/5 text-[#002E47] rounded-xl hover:bg-[#002E47]/10">
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    
                    <div className="text-right">
                        <span className="text-xs text-gray-400 italic">End of day Save 'Journal Page' &rarr; history in Locker</span>
                    </div>
                </div>
            </section>

        </div>

        {/* Right Column (Notifications & Scorecard) */}
        <div className="lg:col-span-4 space-y-8">
            
            {/* Notifications */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-[#002E47] mb-4 flex items-center gap-2 text-left">
                    <Bell className="w-5 h-5" /> Notifications
                </h3>
                <div className="space-y-4">
                    {notifications.map((note) => (
                        <div key={note.id} className="p-3 bg-gray-50 rounded-xl text-sm text-left border border-gray-100">
                            <p className="text-gray-700 mb-2">{note.text}</p>
                            <div className="flex justify-between items-center">
                                {note.action && (
                                    <button className="px-3 py-1 bg-[#002E47] text-white text-xs rounded-lg font-semibold hover:bg-[#002E47]/90">
                                        {note.action}
                                    </button>
                                )}
                                {note.status && (
                                    <span className="flex items-center gap-1 text-[#47A88D] font-bold text-xs ml-auto">
                                        <CheckCircle className="w-3 h-3" /> {note.status}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Today Scorecard */}
            <section className="bg-[#002E47] text-white rounded-2xl p-6 shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                    <h3 className="text-xl font-bold mb-6">Today Scorecard</h3>
                    
                    <div className="space-y-6">
                        {/* Reps Score */}
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-300 text-sm">I did my reps today</p>
                                <p className="text-2xl font-bold">2 of 2 <span className="text-[#47A88D] text-lg ml-1">100%</span></p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-[#47A88D]" />
                        </div>

                        {/* Win the Day Score */}
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-300 text-sm">I won the day</p>
                                <p className="text-2xl font-bold">2 of 3 <span className="text-orange-400 text-lg ml-1">66%</span></p>
                            </div>
                            <Trophy className="w-8 h-8 text-orange-400" />
                        </div>

                        {/* Streak */}
                        <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Flame className="w-5 h-5 text-orange-500" />
                                <span className="font-bold">{streakCount} day streak</span>
                            </div>
                            <span className="text-xs text-gray-400">Keep it up!</span>
                        </div>
                    </div>
                </div>
                
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#47A88D] opacity-10 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#E04E1B] opacity-10 rounded-full blur-2xl transform -translate-x-10 translate-y-10"></div>
            </section>

        </div>
      </div>
    </div>
  );
};

export default Dashboard3;
