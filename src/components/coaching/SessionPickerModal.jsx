import React, { useState, useMemo } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle, 
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Zap,
  MessageSquare,
  Video,
  Loader
} from 'lucide-react';
import { useCoachingSessions, SESSION_TYPES } from '../../hooks/useCoachingSessions';
import { useCoachingRegistrations, REGISTRATION_STATUS } from '../../hooks/useCoachingRegistrations';

/**
 * SessionPickerModal Component
 * 
 * Modal for selecting and registering for a coaching session.
 * Shows available sessions that match the skill focus of the Dev Plan action.
 * 
 * Features:
 * - Filters sessions by skill/type from the coaching item
 * - Shows this week and upcoming sessions
 * - One-click registration
 * - Shows current registration status if already registered
 */
const SessionPickerModal = ({ 
  isOpen, 
  onClose, 
  coachingItem,
  currentRegistration,
  onRegister,
  onAttended
}) => {
  const [selectedWeek, setSelectedWeek] = useState(0); // 0 = this week, 1 = next week, etc.
  const [registering, setRegistering] = useState(null);
  
  // Get sessions filtered by skill focus
  const skillFocus = coachingItem?.skillFocus || coachingItem?.skill || [];
  const skillArray = Array.isArray(skillFocus) ? skillFocus : [skillFocus].filter(Boolean);
  
  const { 
    upcomingSessions,
    loading: sessionsLoading,
    getSessionsForDevPlan 
  } = useCoachingSessions({
    filterSkill: skillArray.length > 0 ? skillArray[0] : null
  });
  
  const {
    isRegistered,
    getRegistration,
    registerForSession,
    cancelRegistration,
    loading: registrationsLoading
  } = useCoachingRegistrations();
  
  // Get matching sessions based on coaching item
  const matchingSessions = useMemo(() => {
    let sessions = [];
    if (skillArray.length > 0) {
      sessions = getSessionsForDevPlan(skillArray);
    } else {
      // If no skill filter, show all upcoming sessions
      sessions = upcomingSessions;
    }

    // STRICT FILTERING: Filter by title/label similarity
    // If the coaching item has a specific title like "Live QS1", only show sessions with that in the title
    const targetTitle = coachingItem?.label || coachingItem?.title;
    if (targetTitle) {
      const normalizedTarget = targetTitle.toLowerCase();
      
      // If the target is generic, don't filter too strictly
      const isGeneric = normalizedTarget === 'coaching session' || normalizedTarget === 'coaching';
      
      if (!isGeneric) {
        sessions = sessions.filter(s => {
          const sessionTitle = (s.title || '').toLowerCase();
          const sessionType = (s.sessionType || '').toLowerCase();
          
          // Match if session title includes the target title (e.g. "Live QS1" in "Live QS1 - Tuesday")
          // OR if the target title includes the session type (e.g. "Open Gym" in "Open Gym Session")
          return sessionTitle.includes(normalizedTarget) || 
                 normalizedTarget.includes(sessionTitle) ||
                 normalizedTarget.includes(sessionType);
        });
      }
    }
    
    return sessions;
  }, [skillArray, getSessionsForDevPlan, upcomingSessions, coachingItem]);
  
  // Group sessions by week
  const sessionsByWeek = useMemo(() => {
    const weeks = {};
    const now = new Date();
    
    matchingSessions.forEach(session => {
      const sessionDate = new Date(session.date);
      const diffTime = sessionDate - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const weekOffset = Math.floor((diffDays + now.getDay()) / 7);
      
      if (!weeks[weekOffset]) {
        weeks[weekOffset] = [];
      }
      weeks[weekOffset].push(session);
    });
    
    // Sort sessions within each week by date
    Object.keys(weeks).forEach(week => {
      weeks[week].sort((a, b) => new Date(a.date) - new Date(b.date));
    });
    
    return weeks;
  }, [matchingSessions]);
  
  const weekKeys = Object.keys(sessionsByWeek).map(Number).sort((a, b) => a - b);
  const currentWeekSessions = sessionsByWeek[weekKeys[selectedWeek]] || [];
  
  // Get week label
  const getWeekLabel = (weekOffset) => {
    if (weekOffset === 0) return 'This Week';
    if (weekOffset === 1) return 'Next Week';
    return `${weekOffset} Weeks Away`;
  };
  
  // Format date for display
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Get session type icon
  const getSessionIcon = (sessionType) => {
    switch (sessionType) {
      case SESSION_TYPES.OPEN_GYM: return Users;
      case SESSION_TYPES.LEADER_CIRCLE: return Users;
      case SESSION_TYPES.WORKSHOP: return MessageSquare;
      case SESSION_TYPES.LIVE_WORKOUT: return Zap;
      case SESSION_TYPES.ONE_ON_ONE: return Video;
      default: return Calendar;
    }
  };
  
  // Handle registration
  const handleRegister = async (session) => {
    setRegistering(session.id);
    try {
      // Pass coaching item context to registration
      const result = await registerForSession(session, {
        coachingItemId: coachingItem?.id,
        skillFocus: coachingItem?.skillFocus || coachingItem?.skill || session.skillFocus || session.skills || []
      });
      
      if (result.success) {
        onRegister?.(session);
      } else {
        alert(result.error || 'Failed to register');
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Failed to register for session');
    } finally {
      setRegistering(null);
    }
  };
  
  // Handle cancellation
  const handleCancel = async (sessionId) => {
    if (!confirm('Are you sure you want to cancel your registration?')) return;
    
    setRegistering(sessionId);
    try {
      const result = await cancelRegistration(sessionId);
      if (!result.success) {
        alert(result.error || 'Failed to cancel registration');
      }
    } catch (error) {
      console.error('Cancellation error:', error);
      alert('Failed to cancel registration');
    } finally {
      setRegistering(null);
    }
  };
  
  // Handle marking as attended
  const handleMarkAttended = (session) => {
    onAttended?.(session.id);
  };
  
  if (!isOpen) return null;
  
  const loading = sessionsLoading || registrationsLoading;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Pick a Session</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {coachingItem?.label || 'Coaching Session'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Week Navigation */}
          {weekKeys.length > 1 && (
            <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setSelectedWeek(Math.max(0, selectedWeek - 1))}
                disabled={selectedWeek === 0}
                className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {getWeekLabel(weekKeys[selectedWeek])}
              </span>
              <button
                onClick={() => setSelectedWeek(Math.min(weekKeys.length - 1, selectedWeek + 1))}
                disabled={selectedWeek === weekKeys.length - 1}
                className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
          
          {/* Sessions List */}
          <div className="p-4 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="w-6 h-6 text-corporate-teal animate-spin" />
              </div>
            ) : currentWeekSessions.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  No sessions available {weekKeys.length > 1 ? 'for this week' : 'right now'}
                </p>
                <p className="text-slate-400 text-xs mt-1">
                  Check back later for new sessions
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {currentWeekSessions.map(session => {
                  const SessionIcon = getSessionIcon(session.sessionType);
                  const registered = isRegistered(session.id);
                  // eslint-disable-next-line no-unused-vars
                  const _registration = getRegistration(session.id); // For future use
                  const spotsLeft = session.maxAttendees - (session.registrationCount || 0);
                  const isFull = spotsLeft <= 0;
                  const isPast = new Date(session.date) < new Date();
                  
                  return (
                    <div
                      key={session.id}
                      className={`
                        p-3 rounded-xl border transition-all
                        ${registered 
                          ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800' 
                          : isFull 
                            ? 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-60'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-teal-300 hover:shadow-sm'
                        }
                      `}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className={`
                          p-2 rounded-lg
                          ${registered ? 'bg-teal-100 dark:bg-teal-900/30 text-corporate-teal' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}
                        `}>
                          <SessionIcon className="w-5 h-5" />
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {session.title}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(session.date)}</span>
                            <Clock className="w-3 h-3 ml-1" />
                            <span>{session.time}</span>
                          </div>
                          {session.coach && (
                            <p className="text-xs text-slate-400 mt-1">
                              with {session.coach}
                            </p>
                          )}
                          
                          {/* Spots indicator */}
                          {!registered && !isPast && (
                            <div className={`
                              flex items-center gap-1 text-xs mt-2
                              ${spotsLeft <= 3 ? 'text-orange-600' : 'text-slate-400'}
                            `}>
                              <Users className="w-3 h-3" />
                              <span>
                                {isFull 
                                  ? 'Session full' 
                                  : `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} left`
                                }
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Action Button */}
                        <div className="flex-shrink-0">
                          {isPast ? (
                            registered ? (
                              <button
                                onClick={() => handleMarkAttended(session)}
                                className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 dark:bg-green-900/30 rounded-lg hover:bg-green-200 transition-colors"
                              >
                                I Attended
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400">Past</span>
                            )
                          ) : registered ? (
                            <button
                              onClick={() => handleCancel(session.id)}
                              disabled={registering === session.id}
                              className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                            >
                              {registering === session.id ? (
                                <Loader className="w-3 h-3 animate-spin" />
                              ) : (
                                'Cancel'
                              )}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRegister(session)}
                              disabled={isFull || registering === session.id}
                              className={`
                                px-3 py-1.5 text-xs font-medium rounded-lg transition-colors
                                ${isFull 
                                  ? 'text-slate-400 bg-slate-100 dark:bg-slate-700 cursor-not-allowed'
                                  : 'text-white bg-corporate-teal hover:bg-teal-700 disabled:opacity-50'
                                }
                              `}
                            >
                              {registering === session.id ? (
                                <Loader className="w-3 h-3 animate-spin" />
                              ) : isFull ? (
                                'Full'
                              ) : (
                                'Register'
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Footer */}
          {currentRegistration && (
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-teal-50 dark:bg-teal-900/20">
              <div className="flex items-center gap-2 text-sm text-corporate-teal">
                <CheckCircle className="w-4 h-4" />
                <span>
                  You're registered for <strong>{currentRegistration.sessionTitle}</strong>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionPickerModal;
