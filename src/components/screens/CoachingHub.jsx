import React, { useState, useEffect, useMemo } from 'react';
import { PageLayout } from '../ui/PageLayout.jsx';
import { useAppServices } from '../../services/useAppServices.jsx';
import { useDevPlan } from '../../hooks/useDevPlan';
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { 
  Loader, Users, Calendar, MessageSquare, Video, 
  Clock, ChevronLeft, ChevronRight, Play, Bot, UserCheck,
  CalendarDays, ExternalLink
} from 'lucide-react';
import { useFeatures } from '../../providers/FeatureProvider';
import WidgetRenderer from '../admin/WidgetRenderer';
import { NoWidgetsEnabled } from '../ui';

// ============================================
// TAB NAVIGATION
// ============================================
const TabButton = ({ active, onClick, icon: IconComponent, label, badge }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
      active 
        ? 'border-indigo-600 text-indigo-600' 
        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
    }`}
  >
    <IconComponent className="w-4 h-4" />
    {label}
    {badge > 0 && (
      <span className="bg-indigo-100 text-indigo-600 text-xs font-bold px-2 py-0.5 rounded-full">
        {badge}
      </span>
    )}
  </button>
);

// ============================================
// CALENDAR VIEW COMPONENT
// ============================================
const CalendarView = ({ sessions, onViewDetails }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Group sessions by date
  const sessionsByDate = useMemo(() => {
    const map = {};
    sessions.forEach(session => {
      if (session.date) {
        const dateKey = session.date.split('T')[0]; // YYYY-MM-DD
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push(session);
      }
    });
    return map;
  }, [sessions]);

  const getDayKey = (day) => {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return d.toISOString().split('T')[0];
  };

  const isToday = (day) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
        <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h3 className="text-lg font-bold text-slate-800">{monthName}</h3>
        <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <ChevronRight className="w-5 h-5 text-slate-600" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-bold text-slate-400 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for days before month starts */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="h-20 bg-slate-50 rounded-lg" />
          ))}
          
          {/* Actual days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateKey = getDayKey(day);
            const daySessions = sessionsByDate[dateKey] || [];
            const hasSession = daySessions.length > 0;
            
            return (
              <div 
                key={day}
                className={`h-20 rounded-lg border p-1 transition-colors ${
                  isToday(day) 
                    ? 'border-indigo-400 bg-indigo-50' 
                    : hasSession 
                      ? 'border-slate-200 bg-white hover:border-indigo-300 cursor-pointer' 
                      : 'border-slate-100 bg-slate-50'
                }`}
              >
                <div className={`text-xs font-bold mb-1 ${isToday(day) ? 'text-indigo-600' : 'text-slate-500'}`}>
                  {day}
                </div>
                {daySessions.slice(0, 2).map(session => (
                  <div 
                    key={session.id}
                    onClick={() => onViewDetails(session)}
                    className={`text-[10px] px-1 py-0.5 rounded truncate mb-0.5 cursor-pointer ${
                      session.sessionType === 'OPEN_GYM' ? 'bg-blue-100 text-blue-700' :
                      session.sessionType === 'LEADER_CIRCLE' ? 'bg-purple-100 text-purple-700' :
                      'bg-teal-100 text-teal-700'
                    }`}
                  >
                    {session.title?.substring(0, 12)}...
                  </div>
                ))}
                {daySessions.length > 2 && (
                  <div className="text-[10px] text-slate-400">+{daySessions.length - 2} more</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 pb-4 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-blue-100" /> Open Gym
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-purple-100" /> Leader Circle
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-teal-100" /> Workshop
        </div>
      </div>
    </div>
  );
};

// ============================================
// SESSION CARD COMPONENT
// ============================================
const SessionCard = ({ session, onRegister, onCancel, isRegistered }) => {
  const getTypeStyle = (type) => {
    switch (type) {
      case 'OPEN_GYM': return { bg: 'bg-blue-50', text: 'text-blue-600', icon: Users };
      case 'LEADER_CIRCLE': return { bg: 'bg-purple-50', text: 'text-purple-600', icon: MessageSquare };
      case 'WORKSHOP': return { bg: 'bg-teal-50', text: 'text-teal-600', icon: Video };
      case '1:1': return { bg: 'bg-orange-50', text: 'text-orange-600', icon: UserCheck };
      default: return { bg: 'bg-slate-50', text: 'text-slate-600', icon: Calendar };
    }
  };

  const style = getTypeStyle(session.sessionType);
  const Icon = style.icon;
  
  // Parse date
  const sessionDate = session.date ? new Date(session.date) : new Date();
  const month = sessionDate.toLocaleString('default', { month: 'short' }).toUpperCase();
  const day = sessionDate.getDate();
  const time = session.time || '10:00 AM';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-all">
      <div className="flex gap-4">
        {/* Date Badge */}
        <div className={`w-16 h-16 ${style.bg} rounded-lg flex flex-col items-center justify-center flex-shrink-0`}>
          <span className={`text-xs font-bold uppercase ${style.text}`}>{month}</span>
          <span className={`text-xl font-bold ${style.text}`}>{day}</span>
        </div>

        {/* Content */}
        <div className="flex-grow">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                  {session.sessionType?.replace('_', ' ') || 'Session'}
                </span>
                {isRegistered && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-600">
                    ✓ Registered
                  </span>
                )}
              </div>
              <h4 className="font-bold text-slate-800">{session.title}</h4>
              <p className="text-sm text-slate-500 line-clamp-1">{session.description}</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> {time}
              </span>
              {session.coach && (
                <span className="flex items-center gap-1">
                  <UserCheck className="w-3 h-3" /> {session.coach}
                </span>
              )}
              {session.spotsLeft !== undefined && (
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" /> {session.spotsLeft} spots
                </span>
              )}
            </div>
            
            {isRegistered ? (
              <button 
                onClick={() => onCancel(session)}
                className="px-3 py-1.5 text-xs font-bold text-red-600 border border-red-200 rounded hover:bg-red-50 transition-colors"
              >
                Cancel
              </button>
            ) : (
              <button 
                onClick={() => onRegister(session)}
                className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 rounded hover:bg-indigo-700 transition-colors"
              >
                Register
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// ON-DEMAND COACHING SECTION
// ============================================
const OnDemandSection = ({ navigate }) => (
  <div className="space-y-6">
    {/* AI Coaching */}
    <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-6 text-white">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <Bot className="w-7 h-7" />
        </div>
        <div className="flex-grow">
          <h3 className="text-xl font-bold mb-2">AI Feedback Coach</h3>
          <p className="text-violet-100 text-sm mb-4">
            Practice giving feedback with our AI roleplay partner. Get instant coaching on your delivery and approach.
          </p>
          <button 
            onClick={() => navigate('ai-roleplay')}
            className="px-4 py-2 bg-white text-indigo-600 font-bold rounded-lg hover:bg-violet-50 transition-colors flex items-center gap-2"
          >
            <Play className="w-4 h-4" /> Start Practicing
          </button>
        </div>
      </div>
    </div>

    {/* 1:1 Coaching Request */}
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
          <UserCheck className="w-7 h-7 text-orange-600" />
        </div>
        <div className="flex-grow">
          <h3 className="text-lg font-bold text-slate-800 mb-2">Request 1:1 Coaching</h3>
          <p className="text-slate-500 text-sm mb-4">
            Book a personalized session with one of our executive coaches for deep-dive guidance on your specific challenges.
          </p>
          <button className="px-4 py-2 border border-orange-600 text-orange-600 font-bold rounded-lg hover:bg-orange-50 transition-colors flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Schedule Session
          </button>
        </div>
      </div>
    </div>

    {/* Submit Scenario */}
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 bg-teal-50 rounded-xl flex items-center justify-center flex-shrink-0">
          <MessageSquare className="w-7 h-7 text-teal-600" />
        </div>
        <div className="flex-grow">
          <h3 className="text-lg font-bold text-slate-800 mb-2">Submit a Scenario</h3>
          <p className="text-slate-500 text-sm mb-4">
            Have a tricky situation? Submit it for discussion in the next Open Gym or get async feedback from our coaches.
          </p>
          <button className="px-4 py-2 border border-teal-600 text-teal-600 font-bold rounded-lg hover:bg-teal-50 transition-colors flex items-center gap-2">
            <ExternalLink className="w-4 h-4" /> Submit Scenario
          </button>
        </div>
      </div>
    </div>
  </div>
);

// ============================================
// MY COACHING DASHBOARD
// ============================================
const MyCoachingSection = ({ registeredSessions, pastSessions, onCancel }) => (
  <div className="space-y-8">
    {/* Upcoming Registered */}
    <div>
      <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
        <CalendarDays className="w-5 h-5 text-indigo-600" />
        My Upcoming Sessions
        {registeredSessions.length > 0 && (
          <span className="bg-indigo-100 text-indigo-600 text-xs font-bold px-2 py-0.5 rounded-full">
            {registeredSessions.length}
          </span>
        )}
      </h3>
      
      {registeredSessions.length === 0 ? (
        <div className="bg-slate-50 rounded-xl border border-dashed border-slate-300 p-8 text-center">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h4 className="font-bold text-slate-600 mb-1">No Registered Sessions</h4>
          <p className="text-slate-400 text-sm">Browse live coaching to find sessions to join.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {registeredSessions.map(session => (
            <SessionCard 
              key={session.id} 
              session={session} 
              isRegistered={true}
              onCancel={onCancel}
            />
          ))}
        </div>
      )}
    </div>

    {/* Past Sessions / Replays */}
    <div>
      <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
        <Video className="w-5 h-5 text-purple-600" />
        Past Sessions & Replays
      </h3>
      
      {pastSessions.length === 0 ? (
        <div className="bg-slate-50 rounded-xl border border-dashed border-slate-300 p-8 text-center">
          <Video className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h4 className="font-bold text-slate-600 mb-1">No Past Sessions Yet</h4>
          <p className="text-slate-400 text-sm">Sessions you attend will appear here with replays.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pastSessions.map(session => (
            <div key={session.id} className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Play className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{session.title}</h4>
                  <p className="text-xs text-slate-400 mb-2">{session.date}</p>
                  <button className="text-xs font-bold text-purple-600 hover:text-purple-800">
                    Watch Replay →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

// ============================================
// MAIN COACHING HUB COMPONENT
// ============================================
const CoachingHub = () => {
  const { db, navigate, user } = useAppServices();
  const { isFeatureEnabled } = useFeatures();
  const { getUnlockedResources } = useDevPlan();
  const [sessions, setSessions] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('live'); // Default to live
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'

  // Fetch coaching sessions
  useEffect(() => {
    const q = query(
      collection(db, 'content'), 
      where('type', '==', 'COACHING_SESSION')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Filter by unlocked resources
      const unlockedIds = getUnlockedResources('coaching');
      // Also include sessions the user is already registered for, even if locked (edge case)
      // But for now, strict locking.
      const unlockedItems = items.filter(item => unlockedIds.has(item.id));

      // Sort by date client-side to avoid index requirement
      unlockedItems.sort((a, b) => {
        const dateA = a.date ? new Date(a.date) : new Date(0);
        const dateB = b.date ? new Date(b.date) : new Date(0);
        return dateA - dateB;
      });
      setSessions(unlockedItems);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching sessions:', error);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [db]);

  // Fetch user registrations
  useEffect(() => {
    if (!user?.uid) return;
    
    const q = query(
      collection(db, 'coaching_registrations'),
      where('userId', '==', user.uid)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRegistrations(items);
    }, () => {
      // Collection might not exist yet, that's ok
      console.log('No registrations yet');
    });
    
    return () => unsubscribe();
  }, [db, user?.uid]);

  const registeredIds = useMemo(() => 
    new Set(registrations.map(r => r.sessionId)), 
    [registrations]
  );

  const registeredSessions = useMemo(() => 
    sessions.filter(s => registeredIds.has(s.id)),
    [sessions, registeredIds]
  );

  const upcomingSessions = useMemo(() => {
    const now = new Date();
    return sessions.filter(s => {
      if (!s.date) return true; // Show sessions without date
      return new Date(s.date) >= now;
    });
  }, [sessions]);

  const pastSessions = useMemo(() => {
    const now = new Date();
    return sessions
      .filter(s => s.date && new Date(s.date) < now && registeredIds.has(s.id))
      .slice(0, 6);
  }, [sessions, registeredIds]);

  const handleRegister = async (session) => {
    if (!user?.uid) {
      alert('Please log in to register for sessions.');
      return;
    }
    
    try {
      const regRef = doc(db, 'coaching_registrations', `${user.uid}_${session.id}`);
      await setDoc(regRef, {
        userId: user.uid,
        sessionId: session.id,
        sessionTitle: session.title,
        registeredAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error registering:', error);
    }
  };

  const handleCancel = async (session) => {
    if (!user?.uid) return;
    
    try {
      const regRef = doc(db, 'coaching_registrations', `${user.uid}_${session.id}`);
      await deleteDoc(regRef);
    } catch (error) {
      console.error('Error canceling:', error);
    }
  };

  // Scope for widgets
  const scope = {
    sessions,
    registrations,
    registeredSessions,
    upcomingSessions,
    pastSessions,
    handleRegister,
    handleCancel,
    navigate,
    viewMode,
    setViewMode,
    CalendarView,
    SessionCard,
    OnDemandSection,
    MyCoachingSection,
    registeredIds
  };

  return (
    <PageLayout 
      title="Coaching Hub" 
      subtitle="Live sessions, on-demand practice, and personalized coaching"
      breadcrumbs={[
        { label: 'Home', path: 'dashboard' },
        { label: 'Coaching Hub', path: null }
      ]}
    >
      <div className="max-w-6xl mx-auto">
        
        {/* Tab Navigation */}
        <div className="flex items-center justify-between border-b border-slate-200 mb-6 overflow-x-auto">
          <div className="flex">
            {isFeatureEnabled('coaching-upcoming-sessions') && (
              <TabButton 
                active={activeTab === 'live'} 
                onClick={() => setActiveTab('live')}
                icon={Calendar}
                label="Live Coaching"
                badge={upcomingSessions.length}
              />
            )}
            {isFeatureEnabled('coaching-on-demand') && (
              <TabButton 
                active={activeTab === 'ondemand'} 
                onClick={() => setActiveTab('ondemand')}
                icon={Bot}
                label="On-Demand"
              />
            )}
            {isFeatureEnabled('coaching-my-sessions') && (
              <TabButton 
                active={activeTab === 'my'} 
                onClick={() => setActiveTab('my')}
                icon={UserCheck}
                label="My Coaching"
                badge={registeredSessions.length}
              />
            )}
          </div>
          
          {activeTab === 'live' && (
            <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
              <button 
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 text-xs font-bold rounded ${viewMode === 'list' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}
              >
                List
              </button>
              <button 
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-1 text-xs font-bold rounded ${viewMode === 'calendar' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}
              >
                Calendar
              </button>
            </div>
          )}
        </div>

        {/* Tab Content */}
        {loading ? (
          <div className="flex justify-center p-12">
            <Loader className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <>
            {/* Live Coaching Tab */}
            {activeTab === 'live' && isFeatureEnabled('coaching-upcoming-sessions') && (
              <WidgetRenderer widgetId="coaching-upcoming-sessions" scope={scope}>
                {viewMode === 'calendar' ? (
                  <CalendarView 
                    sessions={upcomingSessions}
                    onViewDetails={(s) => console.log('View details:', s)}
                  />
                ) : (
                  <div className="space-y-4">
                    {upcomingSessions.length === 0 ? (
                      <div className="bg-slate-50 rounded-xl border border-dashed border-slate-300 p-12 text-center">
                        <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-600 mb-2">No Upcoming Sessions</h3>
                        <p className="text-slate-400">Check back later for new coaching opportunities.</p>
                      </div>
                    ) : (
                      upcomingSessions.map(session => (
                        <SessionCard 
                          key={session.id}
                          session={session}
                          onRegister={handleRegister}
                          onCancel={handleCancel}
                          isRegistered={registeredIds.has(session.id)}
                        />
                      ))
                    )}
                  </div>
                )}
              </WidgetRenderer>
            )}

            {/* On-Demand Tab */}
            {activeTab === 'ondemand' && isFeatureEnabled('coaching-on-demand') && (
              <WidgetRenderer widgetId="coaching-on-demand" scope={scope}>
                <OnDemandSection navigate={navigate} />
              </WidgetRenderer>
            )}

            {/* My Coaching Tab */}
            {activeTab === 'my' && isFeatureEnabled('coaching-my-sessions') && (
              <WidgetRenderer widgetId="coaching-my-sessions" scope={scope}>
                <MyCoachingSection 
                  registeredSessions={registeredSessions}
                  pastSessions={pastSessions}
                  onCancel={handleCancel}
                />
              </WidgetRenderer>
            )}
            
            {/* Fallback if no tabs are enabled */}
            {!isFeatureEnabled('coaching-upcoming-sessions') && 
             !isFeatureEnabled('coaching-on-demand') && 
             !isFeatureEnabled('coaching-my-sessions') && (
               <NoWidgetsEnabled moduleName="Coaching Hub" />
            )}
          </>
        )}

      </div>
    </PageLayout>
  );
};

export default CoachingHub;