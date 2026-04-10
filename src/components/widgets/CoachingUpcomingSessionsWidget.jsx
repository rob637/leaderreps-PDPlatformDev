// src/components/widgets/CoachingUpcomingSessionsWidget.jsx
import React, { useState, useMemo } from 'react';
import { Calendar, Clock, Users, MapPin, Video, ChevronRight, ChevronLeft, Play, X, Loader } from 'lucide-react';
import { Card } from '../ui';

/**
 * Coaching Upcoming Sessions Widget
 * 
 * Displays scheduled coaching sessions that users can register for.
 * Shows Open Gym, Leader Circle, Workshops, and Live Workout sessions.
 * Supports both list and calendar view modes.
 */

// Session type configurations
const SESSION_TYPE_CONFIG = {
  open_gym: {
    label: 'Open Gym',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    accent: 'border-l-orange-500',
    calendarColor: 'bg-blue-100 text-blue-700'
  },
  open_gym_redirecting_feedback: {
    label: 'Open Gym - Redirecting Feedback',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    accent: 'border-l-orange-500',
    calendarColor: 'bg-blue-100 text-blue-700'
  },
  open_gym_handling_pushback: {
    label: 'Open Gym - Handling Pushback',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    accent: 'border-l-orange-500',
    calendarColor: 'bg-blue-100 text-blue-700'
  },
  leader_circle: {
    label: 'Leader Circle',
    color: 'bg-teal-100 text-teal-800 border-teal-200',
    accent: 'border-l-teal-500',
    calendarColor: 'bg-teal-100 text-teal-700'
  },
  live_workout: {
    label: 'Live Workout',
    color: 'bg-teal-100 text-teal-800 border-teal-200',
    accent: 'border-l-teal-500',
    calendarColor: 'bg-green-100 text-green-700'
  },
  workshop: {
    label: 'Workshop',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    accent: 'border-l-blue-500',
    calendarColor: 'bg-teal-100 text-teal-700'
  },
  one_on_one: {
    label: '1:1 Coaching',
    color: 'bg-green-100 text-green-800 border-green-200',
    accent: 'border-l-green-500',
    calendarColor: 'bg-green-100 text-green-700'
  }
};

// Format date for display
const formatSessionDate = (dateString) => {
  if (!dateString) return 'TBD';
  
  // Parse date as local time (not UTC) to avoid timezone shift issues
  // If dateString is "2026-03-12", JavaScript would interpret as midnight UTC
  // which shifts to previous day in US timezones. Add T12:00:00 to force noon local time.
  let date;
  if (dateString.includes('T')) {
    date = new Date(dateString);
  } else {
    // Add noon time to prevent timezone shift
    date = new Date(dateString + 'T12:00:00');
  }
  
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
};

// Helper for default max attendees by session type
const getDefaultMaxAttendeesForType = (sessionType) => {
  switch (sessionType) {
    case 'one_on_one': return 1;
    case 'leader_circle': return 12;
    case 'live_workout': return 30;
    case 'workshop': return 25;
    case 'open_gym': return 20;
    default: return 20;
  }
};

// Helper to get derived session type for Open Gym variants
const getDerivedSessionType = (session) => {
  if (session?.sessionType === 'open_gym') {
    const title = (session.title || '').toLowerCase();
    if (title.includes('redirecting feedback')) return 'open_gym_redirecting_feedback';
    if (title.includes('handling pushback')) return 'open_gym_handling_pushback';
    return 'open_gym';
  }
  return session?.sessionType || 'workshop';
};

// Session Card Component
const SessionCard = ({ session, isRegistered, onRegister, onCancel, showSwitch = false }) => {
  const typeConfig = SESSION_TYPE_CONFIG[session.sessionType] || SESSION_TYPE_CONFIG.workshop;
  
  // Check if session is full
  const maxAttendees = session.maxAttendees || getDefaultMaxAttendeesForType(session.sessionType);
  const isFull = (session.registrationCount || 0) >= maxAttendees;
  
  // Determine button text for exclusive sessions switching
  const buttonText = showSwitch ? 'Switch' : 'Register';
  const buttonColor = showSwitch 
    ? 'bg-amber-500 hover:bg-amber-600' 
    : 'bg-corporate-teal hover:bg-teal-700';
  
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 border-l-4 ${typeConfig.accent} hover:shadow-md transition-shadow`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${typeConfig.color} mb-2`}>
            {typeConfig.label}
          </span>
          <h3 className="font-bold text-slate-800 dark:text-white">{session.title}</h3>
          {session.coach && (
            <p className="text-sm text-slate-500 dark:text-slate-400">with {session.coach}</p>
          )}
        </div>
        
        {isRegistered ? (
          <button
            onClick={() => onCancel?.(session)}
            className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
          >
            Cancel
          </button>
        ) : isFull ? (
          <span className="px-3 py-1.5 text-sm font-medium text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-lg cursor-not-allowed">
            Full
          </span>
        ) : (
          <button
            onClick={() => onRegister?.(session)}
            className={`px-3 py-1.5 text-sm font-medium text-white ${buttonColor} rounded-lg transition-colors`}
          >
            {buttonText}
          </button>
        )}
      </div>
      
      {session.description && (
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">{session.description}</p>
      )}
      
      <div className="flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          <span>{formatSessionDate(session.date)}</span>
        </div>
        {session.time && (
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{session.time}</span>
          </div>
        )}
        {session.durationMinutes && (
          <div className="flex items-center gap-1">
            <span>{session.durationMinutes} min</span>
          </div>
        )}
        {session.maxAttendees && (
          <div className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            <span>{session.registrationCount ?? session.currentAttendees ?? 0}/{session.maxAttendees}</span>
          </div>
        )}
        {session.location && (
          <div className="flex items-center gap-1">
            {session.location === 'virtual' ? (
              <Video className="w-3.5 h-3.5" />
            ) : (
              <MapPin className="w-3.5 h-3.5" />
            )}
            <span className="capitalize">{session.location}</span>
          </div>
        )}
      </div>
      
      {isRegistered && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
            ✓ Registered
          </span>
        </div>
      )}
    </div>
  );
};

// Day Sessions Modal Component
const DaySessionsModal = ({ isOpen, onClose, date, sessions, registeredIds, onRegister, onCancel, existingExclusiveRegistrations }) => {
  const [registering, setRegistering] = useState(null);
  
  // Extract existing 1:1 session ID for Switch UX
  const existing1on1SessionId = existingExclusiveRegistrations?.one_on_one?.sessionId || 
                                 existingExclusiveRegistrations?.['1:1']?.sessionId || null;
  
  if (!isOpen) return null;
  
  const dateObj = date ? new Date(date + 'T12:00:00') : new Date();
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  
  const checkRegistered = (sessionId) => {
    if (!registeredIds) return false;
    if (typeof registeredIds.has === 'function') return registeredIds.has(sessionId);
    return !!registeredIds[sessionId];
  };
  
  const handleRegisterClick = async (session) => {
    setRegistering(session.id);
    try {
      await onRegister?.(session);
    } finally {
      setRegistering(null);
    }
  };
  
  const handleCancelClick = async (session) => {
    setRegistering(session.id);
    try {
      await onCancel?.(session);
    } finally {
      setRegistering(null);
    }
  };

  // Helper to get session type config
  const getTypeConfig = (sessionType) => {
    return SESSION_TYPE_CONFIG[sessionType] || SESSION_TYPE_CONFIG.workshop;
  };
  
  // Helper for spots calculation  
  const getDefaultMaxAttendees = (sessionType) => {
    switch (sessionType) {
      case 'one_on_one': return 1;
      case 'leader_circle': return 12;
      case 'live_workout': return 30;
      case 'workshop': return 25;
      case 'open_gym': return 20;
      default: return 20;
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" onClick={onClose}>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-xl animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Sessions on {formattedDate}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {sessions.length} session{sessions.length !== 1 ? 's' : ''} available
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Sessions List */}
          <div className="p-4 max-h-96 overflow-y-auto space-y-3">
            {sessions.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400">No sessions scheduled for this day</p>
              </div>
            ) : (
              sessions.map(session => {
                const typeConfig = getTypeConfig(session.sessionType);
                const isReg = checkRegistered(session.id);
                const maxSpots = session.maxAttendees || getDefaultMaxAttendees(session.sessionType);
                const spotsLeft = Math.max(0, maxSpots - (session.registrationCount || 0));
                const isFull = spotsLeft <= 0 && !isReg;
                
                // Show "Switch" for 1:1 sessions when user has a different 1:1 registered
                const is1on1 = session.sessionType === 'one_on_one' || session.sessionType === '1:1';
                const showSwitch = is1on1 && existing1on1SessionId && existing1on1SessionId !== session.id;
                const buttonText = showSwitch ? 'Switch' : 'Register';
                const buttonColor = showSwitch 
                  ? 'bg-amber-500 hover:bg-amber-600' 
                  : 'bg-corporate-teal hover:bg-teal-700';
                
                return (
                  <div
                    key={session.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isFull 
                        ? 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-corporate-teal/50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${typeConfig.color} mb-2`}>
                          {typeConfig.label}
                        </span>
                        <h3 className={`font-bold ${isFull ? 'text-slate-400' : 'text-slate-800 dark:text-white'}`}>{session.title}</h3>
                        {session.coach && (
                          <p className="text-sm text-slate-500 dark:text-slate-400">with {session.coach}</p>
                        )}
                        
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400">
                          {session.time && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{session.time}</span>
                            </div>
                          )}
                          <div className={`flex items-center gap-1 ${isFull ? 'text-red-500' : spotsLeft <= 3 ? 'text-orange-600' : ''}`}>
                            <Users className="w-3.5 h-3.5" />
                            <span>{isFull ? 'Full' : `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} left`}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="ml-3 flex-shrink-0">
                        {isReg ? (
                          <button
                            onClick={() => handleCancelClick(session)}
                            disabled={registering === session.id}
                            className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 flex items-center gap-1"
                          >
                            {registering === session.id ? <Loader className="w-3 h-3 animate-spin" /> : 'Cancel'}
                          </button>
                        ) : isFull ? (
                          <span className="px-3 py-1.5 text-sm font-medium text-slate-400 bg-slate-100 dark:bg-slate-600 rounded-lg">
                            Full
                          </span>
                        ) : (
                          <button
                            onClick={() => handleRegisterClick(session)}
                            disabled={registering === session.id}
                            className={`px-3 py-1.5 text-sm font-medium text-white ${buttonColor} rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1`}
                          >
                            {registering === session.id ? <Loader className="w-3 h-3 animate-spin" /> : buttonText}
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {session.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">{session.description}</p>
                    )}
                    
                    {isReg && (
                      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                          ✓ You're registered
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
          
          {/* Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={onClose}
              className="w-full py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CoachingUpcomingSessionsWidget = ({ scope = {}, helpText }) => {
  const { 
    sessions = [], 
    upcomingSessions = [],
    registeredIds = new Set(),
    handleRegister,
    handleCancel,
    navigate,
    viewMode = 'list',
    setViewMode,
    showAllSessions = false,
    initialTypeFilter = 'all',
    setSessionTypeFilter: externalSetFilter,
    existingExclusiveRegistrations = {}  // For Switch UX
  } = scope;
  
  // Internal state for calendar if not controlled externally
  const [internalViewMode] = useState('list');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [typeFilter, setTypeFilter] = useState(initialTypeFilter || 'all');
  
  // State for day modal
  const [selectedDay, setSelectedDay] = useState(null);
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  
  const activeViewMode = setViewMode ? viewMode : internalViewMode;
  // const toggleViewMode = setViewMode || setInternalViewMode;
  
  // Use upcomingSessions if provided, otherwise filter sessions
  const allUpcomingSessions = useMemo(() => {
    if (upcomingSessions?.length > 0) return upcomingSessions;
    return (sessions || []).filter(s => {
      if (!s.date) return true;
      // Parse date as local time (add T12:00:00 to prevent UTC timezone shift)
      const dateStr = s.date.includes('T') ? s.date : s.date + 'T12:00:00';
      const sessionDate = new Date(dateStr);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return sessionDate >= today;
    });
  }, [upcomingSessions, sessions]);
  
  // Apply type filter
  const displaySessions = useMemo(() => {
    if (typeFilter === 'all') return allUpcomingSessions;
    return allUpcomingSessions.filter(s => {
      // Allow fallback: if typeFilter is 'open_gym', match all open gyms.
      // But if we have specific filters selected, only match those.
      const derivedType = getDerivedSessionType(s);
      if (typeFilter === 'open_gym') return s.sessionType === 'open_gym';
      return derivedType === typeFilter || s.sessionType === typeFilter;
    });
  }, [allUpcomingSessions, typeFilter]);
  
  // Get friendly label for the current filter
  const getFilterLabel = (filter) => {
    if (filter === 'all') return '';
    if (filter === 'one_on_one' || filter === '1:1') return '1:1 Coaching';
    if (filter === 'open_gym') return 'Open Gym';
    if (filter === 'leader_circle') return 'Leader Circle';
    if (filter === 'workshop') return 'Workshop';
    return filter;
  };
  
  // Get unique session types for filter buttons
  const availableTypes = useMemo(() => {
    const types = new Set(allUpcomingSessions.map(s => getDerivedSessionType(s)).filter(Boolean));
    return Array.from(types).sort(); // simple string sort puts 1:1 first, then open gym
  }, [allUpcomingSessions]);
  
  // Calendar helpers
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  
  // Group sessions by date for calendar
  const sessionsByDate = useMemo(() => {
    const map = {};
    (displaySessions || []).forEach(session => {
      if (session.date) {
        const dateKey = session.date.split('T')[0];
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push(session);
      }
    });
    return map;
  }, [displaySessions]);
  
  const getDayKey = (day) => {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return d.toISOString().split('T')[0];
  };
  
  const isToday = (day) => {
    const today = new Date();
    return day === today.getDate() && 
           currentDate.getMonth() === today.getMonth() && 
           currentDate.getFullYear() === today.getFullYear();
  };
  
  const getSessionTypeClass = (sessionType) => {
    const type = (sessionType || '').toLowerCase();
    const config = SESSION_TYPE_CONFIG[type];
    return config?.calendarColor || 'bg-teal-100 text-teal-700';
  };
  
  // Check if registered - handle both Set and plain object
  const checkRegistered = (sessionId) => {
    if (!registeredIds) return false;
    if (typeof registeredIds.has === 'function') return registeredIds.has(sessionId);
    return !!registeredIds[sessionId];
  };
  
  // Show filter-specific empty state if a filter is applied
  if (displaySessions.length === 0) {
    const filterLabel = getFilterLabel(typeFilter);
    const hasOtherSessions = allUpcomingSessions.length > 0;
    
    return (
      <Card title="Live Sessions" icon={Calendar} accent="ORANGE" helpText={helpText}>
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="font-bold text-slate-600 dark:text-slate-300 mb-1">
            {filterLabel ? `No Upcoming ${filterLabel} Sessions` : 'No Upcoming Sessions'}
          </h3>
          <p className="text-sm text-slate-400 dark:text-slate-500 mb-4">
            {filterLabel 
              ? `There are no ${filterLabel.toLowerCase()} sessions scheduled at this time.`
              : 'Check back soon for new coaching opportunities.'
            }
          </p>
          {hasOtherSessions && typeFilter !== 'all' && (
            <button
              onClick={() => setTypeFilter('all')}
              className="text-sm text-corporate-teal hover:text-teal-600 font-medium"
            >
              View all {allUpcomingSessions.length} available sessions →
            </button>
          )}
        </div>
      </Card>
    );
  }
  
  return (
    <Card 
      title="Live Sessions" 
      icon={Calendar} 
      accent="ORANGE"
      helpText={helpText}
    >
      {activeViewMode === 'calendar' ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={prevMonth} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
              <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            </button>
            <span className="text-sm font-bold text-slate-800 dark:text-white">{monthName}</span>
            <button onClick={nextMonth} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
              <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            </button>
          </div>
          
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={i} className="text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 py-1">
                {day}
              </div>
            ))}
          </div>
          
          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="h-12 bg-slate-50 dark:bg-slate-700/50 rounded" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateKey = getDayKey(day);
              const daySessions = sessionsByDate[dateKey] || [];
              const hasSession = daySessions.length > 0;
              
              const handleDayClick = () => {
                if (hasSession) {
                  setSelectedDay(dateKey);
                  setIsDayModalOpen(true);
                }
              };
              
              return (
                <div 
                  key={day}
                  onClick={handleDayClick}
                  className={`h-12 rounded border p-0.5 transition-all ${
                    isToday(day) 
                      ? 'border-corporate-navy bg-slate-50 dark:bg-slate-800/40' 
                      : hasSession 
                        ? 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-corporate-teal hover:shadow-sm cursor-pointer' 
                        : 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50'
                  }`}
                >
                  <div className={`text-[10px] font-bold ${isToday(day) ? 'text-corporate-navy dark:text-corporate-navy' : 'text-slate-400 dark:text-slate-500'}`}>
                    {day}
                  </div>
                  {daySessions.slice(0, 1).map(session => (
                    <div 
                      key={session.id}
                      className={`text-[8px] px-0.5 rounded truncate ${getSessionTypeClass(session.sessionType)}`}
                    >
                      {session.title?.substring(0, 8)}
                    </div>
                  ))}
                  {daySessions.length > 1 && (
                    <div className="text-[8px] text-slate-400 dark:text-slate-500">+{daySessions.length - 1}</div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Day Sessions Modal */}
          <DaySessionsModal
            isOpen={isDayModalOpen}
            onClose={() => setIsDayModalOpen(false)}
            date={selectedDay}
            sessions={selectedDay ? (sessionsByDate[selectedDay] || []) : []}
            registeredIds={registeredIds}
            onRegister={handleRegister}
            onCancel={handleCancel}
            existingExclusiveRegistrations={existingExclusiveRegistrations}
          />
          
          {/* Legend */}
          <div className="flex flex-wrap gap-2 mt-3 text-[10px]">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded bg-blue-100" /> Open Gym
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded bg-rep-teal-light" /> Leader Circle
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded bg-teal-100" /> Workshop
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Type Filter Buttons */}
          {availableTypes.length > 1 && (
            <div className="flex flex-wrap gap-2 pb-3 mb-3 border-b border-slate-100 dark:border-slate-700">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  typeFilter === 'all'
                    ? 'bg-corporate-teal text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                All ({allUpcomingSessions.length})
              </button>
              {availableTypes.map(type => {
                const config = SESSION_TYPE_CONFIG[type] || {};
                const count = allUpcomingSessions.filter(s => {
                  if (type === 'open_gym') return s.sessionType === 'open_gym';
                  return getDerivedSessionType(s) === type || s.sessionType === type;
                }).length;
                return (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                      typeFilter === type
                        ? 'bg-corporate-teal text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {config.label || type} ({count})
                  </button>
                );
              })}
            </div>
          )}
          
          {displaySessions.length === 0 && typeFilter !== 'all' ? (
            <div className="text-center py-6">
              <p className="text-sm text-slate-400">No {SESSION_TYPE_CONFIG[typeFilter]?.label || typeFilter} sessions available.</p>
              <button onClick={() => setTypeFilter('all')} className="mt-2 text-sm text-corporate-teal font-medium">Show all sessions</button>
            </div>
          ) : (
            displaySessions.slice(0, showAllSessions ? undefined : 5).map(session => {
              // Show "Switch" for exclusive sessions when user already has a different session of the same type registered
              const derivedTargetType = getDerivedSessionType(session);
              const normalizedTargetType = derivedTargetType === '1:1' ? 'one_on_one' : derivedTargetType;
              const isExclusiveSession = ['one_on_one', 'open_gym_redirecting_feedback', 'open_gym_handling_pushback', 'open_gym'].includes(normalizedTargetType);
              
              const existingReg = isExclusiveSession ? existingExclusiveRegistrations[normalizedTargetType] : null;
              const showSwitch = isExclusiveSession && existingReg && existingReg.sessionId !== session.id;
              
              return (
                <SessionCard 
                  key={session.id}
                  session={session}
                  isRegistered={checkRegistered(session.id)}
                  onRegister={handleRegister}
                  onCancel={handleCancel}
                  showSwitch={showSwitch}
                />
              );
            })
          )}
          {!showAllSessions && displaySessions.length > 5 && (
            <button 
              onClick={() => navigate?.('coaching-lab')}
              className="w-full py-2 text-sm text-corporate-teal font-medium hover:bg-teal-50 rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              View all {displaySessions.length} sessions
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </Card>
  );
};

export default CoachingUpcomingSessionsWidget;
