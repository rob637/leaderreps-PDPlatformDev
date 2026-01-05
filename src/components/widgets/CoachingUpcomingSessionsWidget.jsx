// src/components/widgets/CoachingUpcomingSessionsWidget.jsx
import React, { useState, useMemo } from 'react';
import { Calendar, Clock, Users, MapPin, Video, ChevronRight, ChevronLeft, Play } from 'lucide-react';
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
  const date = new Date(dateString);
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

// Session Card Component
const SessionCard = ({ session, isRegistered, onRegister, onCancel }) => {
  const typeConfig = SESSION_TYPE_CONFIG[session.sessionType] || SESSION_TYPE_CONFIG.workshop;
  
  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-4 border-l-4 ${typeConfig.accent} hover:shadow-md transition-shadow`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${typeConfig.color} mb-2`}>
            {typeConfig.label}
          </span>
          <h3 className="font-bold text-slate-800">{session.title}</h3>
          {session.coach && (
            <p className="text-sm text-slate-500">with {session.coach}</p>
          )}
        </div>
        
        {isRegistered ? (
          <button
            onClick={() => onCancel?.(session)}
            className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
          >
            Cancel
          </button>
        ) : (
          <button
            onClick={() => onRegister?.(session)}
            className="px-3 py-1.5 text-sm font-medium text-white bg-corporate-teal rounded-lg hover:bg-teal-700 transition-colors"
          >
            Register
          </button>
        )}
      </div>
      
      {session.description && (
        <p className="text-sm text-slate-600 mb-3 line-clamp-2">{session.description}</p>
      )}
      
      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
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
            <span>{session.currentAttendees || 0}/{session.maxAttendees}</span>
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
        <div className="mt-3 pt-3 border-t border-slate-100">
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
            ✓ Registered
          </span>
        </div>
      )}
    </div>
  );
};

const CoachingUpcomingSessionsWidget = ({ scope = {} }) => {
  const { 
    sessions = [], 
    upcomingSessions = [],
    registeredIds = new Set(),
    handleRegister,
    handleCancel,
    navigate,
    viewMode = 'list',
    setViewMode,
    showAllSessions = false
  } = scope;
  
  // Internal state for calendar if not controlled externally
  const [internalViewMode] = useState('list');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const activeViewMode = setViewMode ? viewMode : internalViewMode;
  // const toggleViewMode = setViewMode || setInternalViewMode;
  
  // Use upcomingSessions if provided, otherwise filter sessions
  const displaySessions = useMemo(() => {
    if (upcomingSessions?.length > 0) return upcomingSessions;
    return (sessions || []).filter(s => {
      if (!s.date) return true;
      const sessionDate = new Date(s.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return sessionDate >= today;
    });
  }, [upcomingSessions, sessions]);
  
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
  
  if (displaySessions.length === 0) {
    return (
      <Card title="Live Sessions" icon={Calendar} accent="ORANGE">
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-600 mb-1">No Upcoming Sessions</h3>
          <p className="text-sm text-slate-400">Check back soon for new coaching opportunities.</p>
        </div>
      </Card>
    );
  }
  
  return (
    <Card 
      title="Live Sessions" 
      icon={Calendar} 
      accent="ORANGE"
    >
      {activeViewMode === 'calendar' ? (
        <div className="bg-white rounded-lg">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={prevMonth} className="p-1 hover:bg-slate-100 rounded">
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <span className="text-sm font-bold text-slate-800">{monthName}</span>
            <button onClick={nextMonth} className="p-1 hover:bg-slate-100 rounded">
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
          
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={i} className="text-center text-[10px] font-bold text-slate-400 py-1">
                {day}
              </div>
            ))}
          </div>
          
          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="h-12 bg-slate-50 rounded" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateKey = getDayKey(day);
              const daySessions = sessionsByDate[dateKey] || [];
              const hasSession = daySessions.length > 0;
              
              return (
                <div 
                  key={day}
                  className={`h-12 rounded border p-0.5 ${
                    isToday(day) 
                      ? 'border-indigo-400 bg-indigo-50' 
                      : hasSession 
                        ? 'border-slate-200 bg-white' 
                        : 'border-slate-100 bg-slate-50'
                  }`}
                >
                  <div className={`text-[10px] font-bold ${isToday(day) ? 'text-indigo-600' : 'text-slate-400'}`}>
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
                    <div className="text-[8px] text-slate-400">+{daySessions.length - 1}</div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Legend */}
          <div className="flex flex-wrap gap-2 mt-3 text-[10px]">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded bg-blue-100" /> Open Gym
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded bg-purple-100" /> Leader Circle
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded bg-teal-100" /> Workshop
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {displaySessions.slice(0, showAllSessions ? undefined : 5).map(session => (
            <SessionCard 
              key={session.id}
              session={session}
              isRegistered={checkRegistered(session.id)}
              onRegister={handleRegister}
              onCancel={handleCancel}
            />
          ))}
          
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
