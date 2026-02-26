import React, { useState, useEffect, useMemo } from 'react';
import { PageLayout } from '../ui/PageLayout.jsx';
import { useAppServices } from '../../services/useAppServices.jsx';
import { useDailyPlan } from '../../hooks/useDailyPlan';
import { useAccessControlContext } from '../../providers/AccessControlProvider';
import { useCoachingSessions, SESSION_TYPES } from '../../hooks/useCoachingSessions';
import { useCoachingRegistrations, REGISTRATION_STATUS } from '../../hooks/useCoachingRegistrations';
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp } from '../../services/firebaseUtils';
import { 
  Loader, Users, Calendar, MessageSquare, Video, 
  Clock, ChevronLeft, ChevronRight, Play, Bot, UserCheck,
  CalendarDays, ExternalLink, Lock, Megaphone
} from 'lucide-react';
import { useFeatures } from '../../providers/FeatureProvider';
import WidgetRenderer from '../admin/WidgetRenderer';
import { NoWidgetsEnabled, TabButton } from '../ui';

// ============================================
// TAB NAVIGATION
// ============================================

// Helper to get default max attendees per session type
const getDefaultMaxAttendees = (sessionType) => {
  switch (sessionType) {
    case SESSION_TYPES.ONE_ON_ONE:
    case 'one_on_one':
    case '1:1':
      return 1;
    case SESSION_TYPES.LEADER_CIRCLE:
    case 'leader_circle':
      return 12;
    case SESSION_TYPES.LIVE_WORKOUT:
    case 'live_workout':
      return 30;
    case SESSION_TYPES.WORKSHOP:
    case 'workshop':
      return 25;
    case SESSION_TYPES.OPEN_GYM:
    case 'open_gym':
      return 20;
    default:
      return 20;
  }
};

// ============================================
// CALENDAR VIEW COMPONENT
// ============================================
const CalendarView = ({ sessions = [], onViewDetails }) => {
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
    (sessions || []).forEach(session => {
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
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
        <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </button>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">{monthName}</h3>
        <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-300" />
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
            <div key={`empty-${i}`} className="h-20 bg-slate-50 dark:bg-slate-800 rounded-lg" />
          ))}
          
          {/* Actual days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateKey = getDayKey(day);
            const daySessions = sessionsByDate[dateKey] || [];
            const hasSession = daySessions.length > 0;
            
            // Helper to get session type color class
            const getSessionTypeClass = (sessionType) => {
              const type = (sessionType || '').toLowerCase();
              if (type === 'open_gym' || type === 'OPEN_GYM') return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700';
              if (type === 'leader_circle' || type === 'LEADER_CIRCLE') return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700';
              if (type === 'live_workout' || type === 'LIVE_WORKOUT') return 'bg-green-100 dark:bg-green-900/30 text-green-700';
              return 'bg-teal-100 dark:bg-teal-900/30 text-teal-700';
            };
            
            return (
              <div 
                key={day}
                className={`h-20 rounded-lg border p-1 transition-colors ${
                  isToday(day) 
                    ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' 
                    : hasSession 
                      ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-300 cursor-pointer' 
                      : 'border-slate-100 bg-slate-50 dark:bg-slate-800'
                }`}
              >
                <div className={`text-xs font-bold mb-1 ${isToday(day) ? 'text-indigo-600' : 'text-slate-500 dark:text-slate-400'}`}>
                  {day}
                </div>
                {daySessions.slice(0, 2).map(session => (
                  <div 
                    key={session.id}
                    onClick={() => onViewDetails(session)}
                    className={`text-[10px] px-1 py-0.5 rounded truncate mb-0.5 cursor-pointer ${getSessionTypeClass(session.sessionType)}`}
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
          <div className="w-3 h-3 rounded bg-blue-100 dark:bg-blue-900/30" /> Open Gym
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-purple-100 dark:bg-purple-900/30" /> Leader Circle
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-teal-100 dark:bg-teal-900/30" /> Workshop
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
    const normalizedType = (type || '').toLowerCase();
    switch (normalizedType) {
      case SESSION_TYPES.OPEN_GYM:
      case 'open_gym': 
        return { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600', icon: Users };
      case SESSION_TYPES.LEADER_CIRCLE:
      case 'leader_circle': 
        return { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600', icon: MessageSquare };
      case SESSION_TYPES.WORKSHOP:
      case 'workshop': 
        return { bg: 'bg-teal-50 dark:bg-teal-900/20', text: 'text-teal-600', icon: Video };
      case SESSION_TYPES.ONE_ON_ONE:
      case 'one_on_one':
      case '1:1': 
        return { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600', icon: UserCheck };
      case SESSION_TYPES.LIVE_WORKOUT:
      case 'live_workout':
        return { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-600', icon: Play };
      default: 
        return { bg: 'bg-slate-50 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-300', icon: Calendar };
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
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md transition-all">
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
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600">
                    ✓ Registered
                  </span>
                )}
              </div>
              <h4 className="font-bold text-slate-800 dark:text-slate-200">{session.title}</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">{session.description}</p>
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
              {(() => {
                const maxAttendees = session.maxAttendees || getDefaultMaxAttendees(session.sessionType);
                const spotsLeft = Math.max(0, maxAttendees - Math.max(0, session.registrationCount || 0));
                return spotsLeft !== undefined && (
                  <span className={`flex items-center gap-1 ${spotsLeft <= 0 ? 'text-red-500 font-medium' : spotsLeft <= 3 ? 'text-orange-600' : ''}`}>
                    <Users className="w-3 h-3" /> {spotsLeft <= 0 ? 'Full' : `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''}`}
                  </span>
                );
              })()}
            </div>
            
            {isRegistered ? (
              <button 
                onClick={() => onCancel(session)}
                className="px-3 py-1.5 text-xs font-bold text-red-600 border border-red-200 dark:border-red-800 rounded hover:bg-red-50 transition-colors"
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
        <div className="w-14 h-14 bg-white/20 dark:bg-slate-800/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <Bot className="w-7 h-7" />
        </div>
        <div className="flex-grow">
          <h3 className="text-xl font-bold mb-2">AI Feedback Coach</h3>
          <p className="text-violet-100 text-sm mb-4">
            Practice giving feedback with our AI roleplay partner. Get instant coaching on your delivery and approach.
          </p>
          <button 
            onClick={() => navigate('ai-roleplay')}
            className="px-4 py-2 bg-white dark:bg-slate-800 text-indigo-600 font-bold rounded-lg hover:bg-violet-50 transition-colors flex items-center gap-2"
          >
            <Play className="w-4 h-4" /> Start Practicing
          </button>
        </div>
      </div>
    </div>

    {/* 1:1 Coaching Request */}
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 bg-orange-50 dark:bg-orange-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <UserCheck className="w-7 h-7 text-orange-600" />
        </div>
        <div className="flex-grow">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">Request 1:1 Coaching</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
            Book a personalized session with one of our executive coaches for deep-dive guidance on your specific challenges.
          </p>
          <button className="px-4 py-2 border border-orange-600 text-orange-600 font-bold rounded-lg hover:bg-orange-50 transition-colors flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Schedule Session
          </button>
        </div>
      </div>
    </div>

    {/* Submit Scenario */}
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 bg-teal-50 dark:bg-teal-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <MessageSquare className="w-7 h-7 text-teal-600" />
        </div>
        <div className="flex-grow">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">Submit a Scenario</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
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
const MyCoachingSection = ({ registrations = [], sessions = [], pastSessions = [], onCancel, onReschedule, navigate }) => {
  // Get active registrations (not cancelled/no-show) - normalize to lowercase for comparison
  const activeRegistrations = registrations.filter(r => {
    const status = (r.status || '').toLowerCase();
    return status !== 'cancelled' && status !== 'no_show';
  });
  
  // Separate by status (case-insensitive)
  const scheduledRegistrations = activeRegistrations.filter(r => (r.status || '').toLowerCase() === 'registered');
  const attendedRegistrations = activeRegistrations.filter(r => (r.status || '').toLowerCase() === 'attended');
  const certifiedRegistrations = activeRegistrations.filter(r => (r.status || '').toLowerCase() === 'certified');
  
  // Find session details for a registration
  const getSessionForRegistration = (reg) => {
    return sessions.find(s => s.id === reg.sessionId);
  };
  
  // Status badge component
  const StatusBadge = ({ status }) => {
    const normalizedStatus = (status || '').toLowerCase();
    const styles = {
      registered: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      attended: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
      certified: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
    };
    const labels = {
      registered: 'Scheduled',
      attended: 'Awaiting Certification',
      certified: 'Certified ✓'
    };
    return (
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${styles[normalizedStatus] || styles.registered}`}>
        {labels[normalizedStatus] || status}
      </span>
    );
  };
  
  // Registration card component
  const RegistrationCard = ({ registration }) => {
    const session = getSessionForRegistration(registration);
    const sessionDate = registration.sessionDate 
      ? new Date(registration.sessionDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      : 'Date TBD';
    const sessionTime = registration.sessionTime || 'Time TBD';
    
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
              registration.sessionType === 'one_on_one' ? 'bg-orange-50 dark:bg-orange-900/20' :
              registration.sessionType === 'open_gym' ? 'bg-blue-50 dark:bg-blue-900/20' :
              'bg-teal-50 dark:bg-teal-900/20'
            }`}>
              {registration.sessionType === 'one_on_one' ? (
                <UserCheck className="w-6 h-6 text-orange-600" />
              ) : registration.sessionType === 'open_gym' ? (
                <Users className="w-6 h-6 text-blue-600" />
              ) : (
                <Video className="w-6 h-6 text-teal-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 truncate">
                {registration.sessionTitle || session?.title || 'Coaching Session'}
              </h4>
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mt-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{sessionDate}</span>
                <Clock className="w-3.5 h-3.5 ml-2" />
                <span>{sessionTime}</span>
              </div>
              {registration.coach && (
                <p className="text-xs text-slate-400 mt-1">with {registration.coach}</p>
              )}
              {registration.coachingItemId && (
                <p className="text-xs text-corporate-teal mt-1">
                  Milestone {registration.coachingItemId.includes('-') ? registration.coachingItemId.split('-')[1] : ''} requirement
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={registration.status} />
            {(registration.status || '').toLowerCase() === 'registered' && (
              <div className="flex gap-2 mt-2">
                {onReschedule && (
                  <button 
                    onClick={() => onReschedule(registration)}
                    className="text-xs font-medium text-corporate-teal hover:text-teal-700"
                  >
                    Reschedule
                  </button>
                )}
                {onCancel && (
                  <button 
                    onClick={() => onCancel(session || { id: registration.sessionId })}
                    className="text-xs font-medium text-red-500 hover:text-red-700"
                  >
                    Cancel
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Progress indicator for certification flow */}
        {registration.coachingItemId && ((() => {
          const status = (registration.status || '').toLowerCase();
          const isAttendedOrCertified = status === 'attended' || status === 'certified';
          const isCertified = status === 'certified';
          return (
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2 text-xs">
              <div className={`flex items-center gap-1 ${registration.status ? 'text-emerald-600' : 'text-slate-400'}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${registration.status ? 'bg-emerald-500 text-white' : 'bg-slate-200'}`}>
                  {registration.status ? '✓' : '1'}
                </div>
                <span className="font-medium">Scheduled</span>
              </div>
              <div className={`flex-1 h-0.5 ${isAttendedOrCertified ? 'bg-emerald-300' : 'bg-slate-200'}`} />
              <div className={`flex items-center gap-1 ${isAttendedOrCertified ? 'text-emerald-600' : 'text-slate-400'}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isAttendedOrCertified ? 'bg-emerald-500 text-white' : 'bg-slate-200'}`}>
                  {isAttendedOrCertified ? '✓' : '2'}
                </div>
                <span className="font-medium">Attended</span>
              </div>
              <div className={`flex-1 h-0.5 ${isCertified ? 'bg-emerald-300' : 'bg-slate-200'}`} />
              <div className={`flex items-center gap-1 ${isCertified ? 'text-emerald-600' : 'text-slate-400'}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isCertified ? 'bg-emerald-500 text-white' : 'bg-slate-200'}`}>
                  {isCertified ? '✓' : '3'}
                </div>
                <span className="font-medium">Certified</span>
              </div>
            </div>
          </div>
          );
        })())}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{scheduledRegistrations.length}</p>
          <p className="text-xs text-blue-600 dark:text-blue-400">Upcoming</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{attendedRegistrations.length}</p>
          <p className="text-xs text-amber-600 dark:text-amber-400">Awaiting Cert</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{certifiedRegistrations.length}</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400">Certified</p>
        </div>
      </div>

      {/* Upcoming Sessions */}
      <div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-blue-600" />
          Upcoming Sessions
          {scheduledRegistrations.length > 0 && (
            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 text-xs font-bold px-2 py-0.5 rounded-full">
              {scheduledRegistrations.length}
            </span>
          )}
        </h3>
        
        {scheduledRegistrations.length === 0 ? (
          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 p-8 text-center">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h4 className="font-bold text-slate-600 dark:text-slate-300 mb-1">No Upcoming Sessions</h4>
            <p className="text-slate-400 text-sm mb-4">Schedule coaching sessions from your milestone actions on the dashboard.</p>
            <button 
              onClick={() => navigate && navigate('dashboard')}
              className="px-4 py-2 bg-corporate-teal text-white font-medium rounded-lg hover:bg-teal-600 transition-colors text-sm"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {scheduledRegistrations.map(reg => (
              <RegistrationCard key={reg.id} registration={reg} />
            ))}
          </div>
        )}
      </div>

      {/* Awaiting Certification */}
      {attendedRegistrations.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" />
            Awaiting Certification
            <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 text-xs font-bold px-2 py-0.5 rounded-full">
              {attendedRegistrations.length}
            </span>
          </h3>
          <div className="space-y-3">
            {attendedRegistrations.map(reg => (
              <RegistrationCard key={reg.id} registration={reg} />
            ))}
          </div>
        </div>
      )}

      {/* Certified Sessions */}
      {certifiedRegistrations.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-600" />
            Certified Sessions
            <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 text-xs font-bold px-2 py-0.5 rounded-full">
              {certifiedRegistrations.length}
            </span>
          </h3>
          <div className="space-y-3">
            {certifiedRegistrations.map(reg => (
              <RegistrationCard key={reg.id} registration={reg} />
            ))}
          </div>
        </div>
      )}

      {/* Past Sessions / Replays */}
      {pastSessions.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <Video className="w-5 h-5 text-purple-600" />
            Past Sessions & Replays
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pastSessions.map(session => (
              <div key={session.id} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Play className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{session.title}</h4>
                    <p className="text-xs text-slate-400 mb-2">{session.date}</p>
                    {session.replayUrl && (
                      <button className="text-xs font-bold text-purple-600 hover:text-purple-800">
                        Watch Replay →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// MAIN COACHING HUB COMPONENT
// ============================================
const CoachingHub = () => {
  const { db, navigate, user } = useAppServices();
  const { isFeatureEnabled } = useFeatures();
  const { currentDayNumber, unlockedContentIds } = useDailyPlan();
  const { zoneVisibility } = useAccessControlContext();
  
  // Use the new coaching hooks
  const { 
    sessions: newSessions, 
    // thisWeekSessions,
    // upcomingSessions: hookUpcomingSessions,
    loading: sessionsLoading,
    // sessionTypes 
  } = useCoachingSessions();
  
  const {
    registrations: newRegistrations,
    registerForSession,
    cancelRegistration,
    // isRegistered: checkIsRegistered,
    // getUpcomingRegistrations,
    // getPastRegistrations,
    loading: registrationsLoading
  } = useCoachingRegistrations();
  
  // Also fetch legacy sessions from content collection for backward compatibility
  const [legacySessions, setLegacySessions] = useState([]);
  const [legacyRegistrations, setLegacyRegistrations] = useState([]);
  const [legacyLoading, setLegacyLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('my'); // Default to My Sessions
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'

  // Day-based content unlocking
  const unlockedSet = useMemo(() => {
    return new Set((unlockedContentIds || []).map(id => String(id).toLowerCase()));
  }, [unlockedContentIds]);

  // Fetch legacy coaching sessions from content collection
  useEffect(() => {
    const q = query(
      collection(db, 'content'), 
      where('type', '==', 'COACHING_SESSION')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Filter by day-based unlocked resources
      const unlockedItems = items.filter(item => {
        if (!item.isHiddenUntilUnlocked) return true;
        return unlockedSet.has(String(item.id).toLowerCase());
      });

      // Sort by date client-side to avoid index requirement
      unlockedItems.sort((a, b) => {
        const dateA = a.date ? new Date(a.date) : new Date(0);
        const dateB = b.date ? new Date(b.date) : new Date(0);
        return dateA - dateB;
      });
      setLegacySessions(unlockedItems);
      setLegacyLoading(false);
    }, (error) => {
      console.error('Error fetching legacy sessions:', error);
      setLegacyLoading(false);
    });
    
    return () => unsubscribe();
  }, [db, unlockedSet]);

  // Fetch legacy user registrations
  useEffect(() => {
    if (!user?.uid) return;
    
    const q = query(
      collection(db, 'coaching_registrations'),
      where('userId', '==', user.uid)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLegacyRegistrations(items);
    }, () => {
      console.log('No legacy registrations yet');
    });
    
    return () => unsubscribe();
  }, [db, user?.uid]);

  // Combine sessions from both sources (new coaching_sessions + legacy content)
  const sessions = useMemo(() => {
    // Merge new sessions and legacy sessions, avoiding duplicates
    const sessionMap = new Map();
    
    // Add new sessions first (defensive: ensure array)
    (newSessions || []).forEach(s => sessionMap.set(s.id, s));
    
    // Add legacy sessions (won't overwrite if ID exists)
    (legacySessions || []).forEach(s => {
      if (!sessionMap.has(s.id)) {
        sessionMap.set(s.id, s);
      }
    });
    
    return Array.from(sessionMap.values()).sort((a, b) => {
      const dateA = a.date ? new Date(a.date) : new Date(0);
      const dateB = b.date ? new Date(b.date) : new Date(0);
      return dateA - dateB;
    });
  }, [newSessions, legacySessions]);

  // Combine registrations from both sources
  const registrations = useMemo(() => {
    const regMap = new Map();
    (newRegistrations || []).forEach(r => regMap.set(r.sessionId, r));
    (legacyRegistrations || []).forEach(r => {
      if (!regMap.has(r.sessionId)) {
        regMap.set(r.sessionId, r);
      }
    });
    return Array.from(regMap.values());
  }, [newRegistrations, legacyRegistrations]);

  const loading = sessionsLoading || registrationsLoading || legacyLoading;

  const registeredIds = useMemo(() => 
    new Set((registrations || [])
      .filter(r => r.status !== 'cancelled')
      .map(r => r.sessionId)), 
    [registrations]
  );

  const registeredSessions = useMemo(() => 
    (sessions || []).filter(s => registeredIds.has(s.id)),
    [sessions, registeredIds]
  );

  const upcomingSessions = useMemo(() => {
    const now = new Date();
    return (sessions || []).filter(s => {
      if (!s.date) return true; // Show sessions without date
      return new Date(s.date) >= now;
    });
  }, [sessions]);

  const pastSessions = useMemo(() => {
    const now = new Date();
    return (sessions || [])
      .filter(s => s.date && new Date(s.date) < now && registeredIds.has(s.id))
      .slice(0, 6);
  }, [sessions, registeredIds]);

  const handleRegister = async (session) => {
    if (!user?.uid) {
      alert('Please log in to register for sessions.');
      return;
    }
    
    // Try new hook first
    const result = await registerForSession(session);
    if (!result.success) {
      // Fallback to legacy registration
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
    }
  };

  const handleCancel = async (session) => {
    if (!user?.uid) return;
    
    // Try new hook first
    const result = await cancelRegistration(session.id);
    if (!result.success) {
      // Fallback to legacy deletion
      try {
        const regRef = doc(db, 'coaching_registrations', `${user.uid}_${session.id}`);
        await deleteDoc(regRef);
      } catch (error) {
        console.error('Error canceling:', error);
      }
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
    registeredIds,
    showAllSessions: true
  };

  // Zone Gate: Coaching unlocks when user enters Foundation phase
  if (!zoneVisibility.isCoachingZoneOpen) {
    return (
      <PageLayout 
        title="Coaching Sessions" 
        subtitle="Live sessions, on-demand practice, and personalized coaching"
        icon={Megaphone}
        breadcrumbs={[
          { label: 'Home', path: 'dashboard' },
          { label: 'Coaching Sessions', path: null }
        ]}
      >
        <div className="max-w-2xl mx-auto">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-200 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-slate-400" />
            </div>
            <h2 className="text-xl font-bold text-corporate-navy mb-2">Complete Your Prep First</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              Coaching Sessions unlock once you complete your preparation phase and enter the Foundation program.
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Complete all required prep items to get started.
            </p>
            <button 
              onClick={() => navigate('dashboard')}
              className="px-6 py-2.5 bg-corporate-teal text-white font-bold rounded-lg hover:bg-teal-600 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title="Coaching Sessions" 
      subtitle="Live sessions, on-demand practice, and personalized coaching"
      icon={Megaphone}
      breadcrumbs={[
        { label: 'Home', path: 'dashboard' },
        { label: 'Coaching Sessions', path: null }
      ]}
    >
      <div className="max-w-6xl mx-auto">
        
        {/* Tab Navigation */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 mb-6 overflow-x-auto">
          <div className="flex">
            {isFeatureEnabled('coaching-my-sessions') && (
              <TabButton 
                active={activeTab === 'my'} 
                onClick={() => setActiveTab('my')}
                icon={UserCheck}
                label="My Sessions"
                badge={registrations.filter(r => { const s = (r.status || '').toLowerCase(); return s !== 'cancelled' && s !== 'no_show'; }).length}
              />
            )}
            {isFeatureEnabled('coaching-upcoming-sessions') && (
              <TabButton 
                active={activeTab === 'live'} 
                onClick={() => setActiveTab('live')}
                icon={Calendar}
                label="Browse Sessions"
                badge={upcomingSessions.length}
              />
            )}
            {isFeatureEnabled('coaching-on-demand') && (
              <TabButton 
                active={activeTab === 'ondemand'} 
                onClick={() => setActiveTab('ondemand')}
                icon={Bot}
                label="Resources"
              />
            )}
          </div>
          
          {activeTab === 'live' && (
            <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-700 rounded-lg">
              <button 
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 text-xs font-bold rounded ${viewMode === 'list' ? 'bg-white dark:bg-slate-800 shadow text-slate-800 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'}`}
              >
                List
              </button>
              <button 
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-1 text-xs font-bold rounded ${viewMode === 'calendar' ? 'bg-white dark:bg-slate-800 shadow text-slate-800 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'}`}
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
              <WidgetRenderer widgetId="coaching-upcoming-sessions" scope={scope} />
            )}

            {/* On-Demand Tab */}
            {activeTab === 'ondemand' && isFeatureEnabled('coaching-on-demand') && (
              <WidgetRenderer widgetId="coaching-on-demand" scope={scope} />
            )}

            {/* My Coaching Tab */}
            {activeTab === 'my' && isFeatureEnabled('coaching-my-sessions') && (
              <WidgetRenderer widgetId="coaching-my-sessions" scope={scope} />
            )}
            
            {/* Fallback if no tabs are enabled */}
            {!isFeatureEnabled('coaching-upcoming-sessions') && 
             !isFeatureEnabled('coaching-on-demand') && 
             !isFeatureEnabled('coaching-my-sessions') && (
               <NoWidgetsEnabled moduleName="Coaching" />
            )}
          </>
        )}

      </div>
    </PageLayout>
  );
};

export default CoachingHub;