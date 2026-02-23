// src/components/screens/CommunityHub.jsx
import React, { useState, useMemo } from 'react';
import { PageLayout } from '../ui/PageLayout.jsx';
import { useAppServices } from '../../services/useAppServices.jsx';
import { useDailyPlan } from '../../hooks/useDailyPlan';
import { useAccessControlContext } from '../../providers/AccessControlProvider';
import { useCommunitySessions, COMMUNITY_SESSION_TYPES } from '../../hooks/useCommunitySessions';
import { useCommunityRegistrations, REGISTRATION_STATUS } from '../../hooks/useCommunityRegistrations';
import { 
  Loader, Users, Calendar, MessageSquare, Video, 
  Clock, ChevronLeft, ChevronRight, Play, Lock,
  UserCheck, CheckCircle, AlertCircle, Star
} from 'lucide-react';
import { CommunityIcon } from '../icons';
import { useFeatures } from '../../providers/FeatureProvider';
import WidgetRenderer from '../admin/WidgetRenderer';
import { NoWidgetsEnabled, TabButton } from '../ui';

// ============================================
// STATUS COMPONENTS
// ============================================

const StatusBadge = ({ status }) => {
  const styles = {
    REGISTERED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    ATTENDED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
  };
  const labels = {
    REGISTERED: 'Scheduled',
    ATTENDED: 'Attended',
    COMPLETED: 'Completed ✓'
  };
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${styles[status] || styles.REGISTERED}`}>
      {labels[status] || status}
    </span>
  );
};

const getSessionTypeStyle = (type) => {
  const t = (type || '').toLowerCase();
  switch (t) {
    case 'leader_circle': return { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600', icon: Users };
    case 'community_event': return { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600', icon: Star };
    case 'accountability_pod': return { bg: 'bg-teal-50 dark:bg-teal-900/20', text: 'text-teal-600', icon: UserCheck };
    case 'mastermind': return { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600', icon: MessageSquare };
    case 'networking': return { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-600', icon: Users };
    default: return { bg: 'bg-slate-50 dark:bg-slate-800', text: 'text-slate-600', icon: Calendar };
  }
};

// ============================================
// CALENDAR VIEW
// ============================================
const CalendarView = ({ sessions = [], onViewDetails }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const sessionsByDate = useMemo(() => {
    const map = {};
    (sessions || []).forEach(session => {
      if (session.date) {
        const dateKey = session.date.split('T')[0];
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push(session);
      }
    });
    return map;
  }, [sessions]);

  const getDayKey = (day) => new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split('T')[0];
  const isToday = (day) => {
    const today = new Date();
    return day === today.getDate() && currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
        <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </button>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">{monthName}</h3>
        <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </button>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-bold text-slate-400 py-2">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (<div key={`empty-${i}`} className="h-20 bg-slate-50 dark:bg-slate-800 rounded-lg" />))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateKey = getDayKey(day);
            const daySessions = sessionsByDate[dateKey] || [];
            return (
              <div key={day} className={`h-20 rounded-lg border p-1 transition-colors ${isToday(day) ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/20' : daySessions.length > 0 ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-purple-300 cursor-pointer' : 'border-slate-100 bg-slate-50 dark:bg-slate-800'}`}>
                <div className={`text-xs font-bold mb-1 ${isToday(day) ? 'text-purple-600' : 'text-slate-500 dark:text-slate-400'}`}>{day}</div>
                {daySessions.slice(0, 2).map(s => (
                  <div key={s.id} onClick={() => onViewDetails?.(s)} className={`text-[10px] px-1 py-0.5 rounded truncate mb-0.5 cursor-pointer ${getSessionTypeStyle(s.sessionType).bg} ${getSessionTypeStyle(s.sessionType).text}`}>{s.title?.substring(0, 12)}...</div>
                ))}
                {daySessions.length > 2 && <div className="text-[10px] text-slate-400">+{daySessions.length - 2} more</div>}
              </div>
            );
          })}
        </div>
      </div>
      <div className="px-4 pb-4 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-purple-100 dark:bg-purple-900/30" /> Leader Circle</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-orange-100 dark:bg-orange-900/30" /> Community Event</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-teal-100 dark:bg-teal-900/30" /> Accountability Pod</div>
      </div>
    </div>
  );
};

// ============================================
// SESSION CARD
// ============================================
const SessionCard = ({ session, onRegister, onCancel, isRegistered }) => {
  const style = getSessionTypeStyle(session.sessionType);
  const Icon = style.icon;
  const sessionDate = session.date ? new Date(session.date) : new Date();
  const month = sessionDate.toLocaleString('default', { month: 'short' }).toUpperCase();
  const day = sessionDate.getDate();
  const time = session.time || '10:00 AM';

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md transition-all">
      <div className="flex gap-4">
        <div className={`w-16 h-16 ${style.bg} rounded-lg flex flex-col items-center justify-center flex-shrink-0`}>
          <span className={`text-xs font-bold uppercase ${style.text}`}>{month}</span>
          <span className={`text-xl font-bold ${style.text}`}>{day}</span>
        </div>
        <div className="flex-grow">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>{session.sessionType?.replace('_', ' ') || 'Event'}</span>
                {isRegistered && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600">✓ Registered</span>}
              </div>
              <h4 className="font-bold text-slate-800 dark:text-slate-200">{session.title}</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">{session.description}</p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {time}</span>
              {session.host && <span className="flex items-center gap-1"><UserCheck className="w-3 h-3" /> {session.host}</span>}
              {session.spotsLeft !== undefined && <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {session.spotsLeft} spots</span>}
            </div>
            {isRegistered ? (
              <button onClick={() => onCancel(session)} className="px-3 py-1.5 text-xs font-bold text-red-600 border border-red-200 dark:border-red-800 rounded hover:bg-red-50 transition-colors">Cancel</button>
            ) : (
              <button onClick={() => onRegister(session)} className="px-3 py-1.5 text-xs font-bold text-white bg-purple-600 rounded hover:bg-purple-700 transition-colors">Register</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MY EVENTS SECTION (like MyCoachingSection)
// ============================================
const MyEventsSection = ({ registrations = [], sessions = [], onCancel, navigate }) => {
  const activeRegistrations = registrations.filter(r => r.status !== 'CANCELLED' && r.status !== 'NO_SHOW');
  const scheduledRegistrations = activeRegistrations.filter(r => r.status === 'REGISTERED');
  const attendedRegistrations = activeRegistrations.filter(r => r.status === 'ATTENDED');
  const completedRegistrations = activeRegistrations.filter(r => r.status === 'COMPLETED');

  const getSessionForReg = (reg) => sessions.find(s => s.id === reg.sessionId);
  
  const RegistrationCard = ({ registration }) => {
    const session = getSessionForReg(registration);
    const sessionDate = registration.sessionDate ? new Date(registration.sessionDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Date TBD';
    const sessionTime = registration.sessionTime || 'Time TBD';
    const style = getSessionTypeStyle(registration.sessionType);
    const Icon = style.icon;
    const isToday = registration.sessionDate && new Date(registration.sessionDate).toDateString() === new Date().toDateString();

    return (
      <div className={`bg-white dark:bg-slate-800 rounded-xl border p-4 hover:shadow-md transition-shadow ${isToday ? 'border-green-300 bg-green-50/50 dark:bg-green-900/10' : 'border-slate-200 dark:border-slate-700'}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${style.bg}`}>
              <Icon className={`w-6 h-6 ${style.text}`} />
            </div>
            <div className="flex-1 min-w-0">
              {isToday && <span className="inline-block px-2 py-0.5 bg-green-600 text-white text-[10px] font-bold rounded-full mb-1">TODAY</span>}
              <h4 className="font-bold text-slate-800 dark:text-slate-200 truncate">{registration.sessionTitle || session?.title || 'Community Event'}</h4>
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mt-1">
                <Calendar className="w-3.5 h-3.5" /><span>{sessionDate}</span>
                <Clock className="w-3.5 h-3.5 ml-2" /><span>{sessionTime}</span>
              </div>
              {registration.host && <p className="text-sm text-slate-400 mt-1">with {registration.host}</p>}
            </div>
          </div>
          <StatusBadge status={registration.status} />
        </div>
        {registration.status === 'REGISTERED' && session?.meetingLink && isToday && (
          <div className="mt-3 flex gap-2">
            <a href={session.meetingLink} target="_blank" rel="noopener noreferrer" className="flex-1 py-2 bg-purple-600 text-white text-center text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors">Join Event</a>
            {onCancel && <button onClick={() => onCancel(registration.sessionId)} className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 transition-colors">Cancel</button>}
          </div>
        )}
        {registration.status === 'REGISTERED' && !isToday && onCancel && (
          <div className="mt-3">
            <button onClick={() => onCancel(registration.sessionId)} className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 transition-colors">Cancel Registration</button>
          </div>
        )}
      </div>
    );
  };

  if (activeRegistrations.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-slate-600 dark:text-slate-300 mb-2">No Events Scheduled</h3>
        <p className="text-slate-400 mb-6">Browse upcoming community events and register to connect with fellow leaders.</p>
        <button onClick={() => navigate?.('community', { tab: 'browse' })} className="px-6 py-2.5 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-colors">Browse Events</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3 p-4 bg-gradient-to-r from-purple-50 to-slate-50 dark:from-purple-900/20 dark:to-slate-800 rounded-xl">
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">{scheduledRegistrations.length}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Upcoming</p>
        </div>
        <div className="text-center border-x border-slate-200 dark:border-slate-700">
          <p className="text-2xl font-bold text-amber-600">{attendedRegistrations.length}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Attended</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-emerald-600">{completedRegistrations.length}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Completed</p>
        </div>
      </div>

      {/* Scheduled Events */}
      {scheduledRegistrations.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-slate-500 uppercase mb-3 flex items-center gap-2"><Calendar className="w-4 h-4" /> Upcoming Events ({scheduledRegistrations.length})</h3>
          <div className="space-y-3">{scheduledRegistrations.map(reg => <RegistrationCard key={reg.id} registration={reg} />)}</div>
        </div>
      )}

      {/* Attended */}
      {attendedRegistrations.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-amber-600 uppercase mb-3 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Recently Attended ({attendedRegistrations.length})</h3>
          <div className="space-y-3">{attendedRegistrations.map(reg => <RegistrationCard key={reg.id} registration={reg} />)}</div>
        </div>
      )}

      {/* Completed */}
      {completedRegistrations.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-emerald-600 uppercase mb-3 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Completed ({completedRegistrations.length})</h3>
          <div className="space-y-3">{completedRegistrations.slice(0, 5).map(reg => <RegistrationCard key={reg.id} registration={reg} />)}</div>
        </div>
      )}
    </div>
  );
};

// ============================================
// MAIN COMMUNITY HUB COMPONENT
// ============================================
const CommunityHub = () => {
  const { db, user, navigate, isLoading: isAppLoading, error: appError } = useAppServices();
  const { isFeatureEnabled } = useFeatures();
  const { currentDayNumber, unlockedContentIds } = useDailyPlan();
  const { zoneVisibility } = useAccessControlContext();

  const { sessions, loading: sessionsLoading } = useCommunitySessions();
  const { registrations, registerForSession, cancelRegistration, loading: registrationsLoading } = useCommunityRegistrations();

  const [activeTab, setActiveTab] = useState('my'); // Default to My Events (like Coaching)
  const [viewMode, setViewMode] = useState('list');

  const loading = sessionsLoading || registrationsLoading || isAppLoading;

  // Get upcoming sessions (future dates)
  const upcomingSessions = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return (sessions || []).filter(s => {
      if (!s.date) return false;
      const sessionDate = new Date(s.date);
      return sessionDate >= now && s.status !== 'cancelled';
    }).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [sessions]);

  // Registration check
  const registeredIds = new Set((registrations || []).filter(r => r.status !== 'CANCELLED').map(r => r.sessionId));
  const isRegistered = (sessionId) => registeredIds.has(sessionId);

  const handleRegister = async (session) => {
    await registerForSession(session);
  };

  const handleCancel = async (sessionId) => {
    if (window.confirm('Are you sure you want to cancel this registration?')) {
      await cancelRegistration(sessionId);
    }
  };

  // Widget scope
  const scope = {
    db, user, navigate, sessions: upcomingSessions, registrations: registrations || [], isRegistered,
    handleRegister, handleCancel, registeredIds, showAllSessions: true
  };

  // Zone Gate
  if (!zoneVisibility.isCommunityZoneOpen) {
    return (
      <PageLayout title="Community Events" subtitle="Connect with fellow leaders at events and workshops" icon={CommunityIcon} breadcrumbs={[{ label: 'Home', path: 'dashboard' }, { label: 'Community Events', path: null }]}>
        <div className="max-w-2xl mx-auto">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-200 flex items-center justify-center mx-auto mb-4"><Lock className="w-8 h-8 text-slate-400" /></div>
            <h2 className="text-xl font-bold text-corporate-navy mb-2">Complete Your Prep First</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-4">Community Events unlock once you complete your preparation phase and enter the Foundation program.</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Complete all required prep items to get started.</p>
            <button onClick={() => navigate('dashboard')} className="px-6 py-2.5 bg-corporate-teal text-white font-bold rounded-lg hover:bg-teal-600 transition-colors">Go to Dashboard</button>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Community Events" subtitle="Connect with fellow leaders at events and workshops" icon={CommunityIcon} breadcrumbs={[{ label: 'Home', path: 'dashboard' }, { label: 'Community Events', path: null }]}>
      <div className="max-w-6xl mx-auto">
        {/* Tab Navigation */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 mb-6 overflow-x-auto">
          <div className="flex">
            {isFeatureEnabled('community-my-registrations') && (
              <TabButton active={activeTab === 'my'} onClick={() => setActiveTab('my')} icon={UserCheck} label="My Events" badge={(registrations || []).filter(r => r.status !== 'CANCELLED' && r.status !== 'NO_SHOW').length} />
            )}
            {isFeatureEnabled('community-upcoming-sessions') && (
              <TabButton active={activeTab === 'browse'} onClick={() => setActiveTab('browse')} icon={Calendar} label="Browse Events" badge={upcomingSessions.length} />
            )}
            <TabButton active={activeTab === 'resources'} onClick={() => setActiveTab('resources')} icon={Video} label="Resources" />
          </div>
          {activeTab === 'browse' && (
            <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-700 rounded-lg">
              <button onClick={() => setViewMode('list')} className={`px-3 py-1 text-xs font-bold rounded ${viewMode === 'list' ? 'bg-white dark:bg-slate-800 shadow text-slate-800 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'}`}>List</button>
              <button onClick={() => setViewMode('calendar')} className={`px-3 py-1 text-xs font-bold rounded ${viewMode === 'calendar' ? 'bg-white dark:bg-slate-800 shadow text-slate-800 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'}`}>Calendar</button>
            </div>
          )}
        </div>

        {/* Tab Content */}
        {loading ? (
          <div className="flex justify-center p-12"><Loader className="w-8 h-8 animate-spin text-purple-600" /></div>
        ) : (
          <>
            {activeTab === 'my' && isFeatureEnabled('community-my-registrations') && (
              <MyEventsSection registrations={registrations || []} sessions={sessions || []} onCancel={handleCancel} navigate={navigate} />
            )}

            {activeTab === 'browse' && isFeatureEnabled('community-upcoming-sessions') && (
              viewMode === 'calendar' 
                ? <CalendarView sessions={upcomingSessions} onViewDetails={(s) => console.log('View session:', s)} />
                : (
                  <div className="space-y-4">
                    {upcomingSessions.length === 0 ? (
                      <div className="text-center py-12">
                        <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <h3 className="font-bold text-slate-600 dark:text-slate-300">No Upcoming Events</h3>
                        <p className="text-sm text-slate-400 mt-1">Check back soon for new community events.</p>
                      </div>
                    ) : (
                      upcomingSessions.map(session => (
                        <SessionCard key={session.id} session={session} onRegister={handleRegister} onCancel={handleCancel} isRegistered={isRegistered(session.id)} />
                      ))
                    )}
                  </div>
                )
            )}

            {activeTab === 'resources' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0"><MessageSquare className="w-7 h-7" /></div>
                    <div className="flex-grow">
                      <h3 className="text-xl font-bold mb-2">Community Feed</h3>
                      <p className="text-purple-100 text-sm mb-4">Share wins, ask questions, and engage with fellow leaders in the community feed.</p>
                      <button onClick={() => navigate('community-feed')} className="px-4 py-2 bg-white text-purple-600 font-bold rounded-lg hover:bg-purple-50 transition-colors flex items-center gap-2"><Play className="w-4 h-4" /> View Feed</button>
                    </div>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-teal-50 dark:bg-teal-900/20 rounded-xl flex items-center justify-center flex-shrink-0"><Users className="w-7 h-7 text-teal-600" /></div>
                    <div className="flex-grow">
                      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">Accountability Pods</h3>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">Join a small group of leaders for weekly check-ins and mutual accountability.</p>
                      <button className="px-4 py-2 border border-teal-600 text-teal-600 font-bold rounded-lg hover:bg-teal-50 transition-colors">Find Your Pod</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!isFeatureEnabled('community-upcoming-sessions') && !isFeatureEnabled('community-my-registrations') && (
              <NoWidgetsEnabled moduleName="Community" />
            )}
          </>
        )}
      </div>
    </PageLayout>
  );
};

export default CommunityHub;
