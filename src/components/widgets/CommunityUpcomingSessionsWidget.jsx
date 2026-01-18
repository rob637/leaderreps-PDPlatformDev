// src/components/widgets/CommunityUpcomingSessionsWidget.jsx
import React, { useState, useMemo } from 'react';
import { Calendar, Clock, Users, MapPin, Video, ChevronRight, ChevronLeft, Play, Repeat } from 'lucide-react';
import { Card } from '../ui';
import { useCommunitySessions } from '../../hooks/useCommunitySessions';
import { useCommunityRegistrations } from '../../hooks/useCommunityRegistrations';
import { COMMUNITY_SESSION_TYPE_CONFIG } from '../../services/communityService';

/**
 * Community Upcoming Sessions Widget
 * 
 * Displays scheduled community sessions that users can register for.
 * Shows Leader Circles, Community Events, Masterminds, etc.
 * Supports both list and calendar view modes.
 */

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
  const typeConfig = COMMUNITY_SESSION_TYPE_CONFIG[session.sessionType] || COMMUNITY_SESSION_TYPE_CONFIG.community_event;
  
  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-4 border-l-4 hover:shadow-md transition-shadow ${typeConfig.color.replace('bg-', 'border-l-').replace('text-', 'border-l-').split(' ')[0]}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${typeConfig.color} mb-2`}>
            {typeConfig.label}
          </span>
          <h3 className="font-bold text-slate-800">{session.title}</h3>
          {session.host && (
            <p className="text-sm text-slate-500">with {session.host}</p>
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
      
      <div className="flex flex-wrap gap-3 text-sm text-slate-500">
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          <span>{formatSessionDate(session.date)}</span>
        </div>
        {session.time && (
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{session.time} ({session.durationMinutes}m)</span>
          </div>
        )}
        {session.recurrence && session.recurrence !== 'none' && (
          <div className="flex items-center gap-1 text-corporate-teal">
            <Repeat className="w-4 h-4" />
            <span className="capitalize">{session.recurrence}</span>
          </div>
        )}
      </div>
    </div>
  );
};

const CommunityUpcomingSessionsWidget = ({ helpText }) => {
  const { upcomingSessions, loading: sessionsLoading } = useCommunitySessions();
  const { isRegistered, registerForSession, cancelRegistration } = useCommunityRegistrations();
  // const [viewMode, setViewMode] = useState('list'); // 'list', 'calendar'
  const [filterType, setFilterType] = useState('all');

  // Filter sessions
  const filteredSessions = useMemo(() => {
    if (filterType === 'all') return upcomingSessions;
    return upcomingSessions.filter(s => s.sessionType === filterType);
  }, [upcomingSessions, filterType]);

  const handleRegister = async (session) => {
    if (confirm(`Register for "${session.title}"?`)) {
      await registerForSession(session);
    }
  };

  const handleCancel = async (session) => {
    if (confirm(`Cancel registration for "${session.title}"?`)) {
      await cancelRegistration(session.id);
    }
  };

  if (sessionsLoading) {
    return (
      <Card title="Upcoming Community Sessions" icon={Users} helpText={helpText}>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-slate-100 rounded-xl"></div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card 
      title="Upcoming Community Sessions" 
      icon={Users}
      helpText={helpText}
      action={
        <div className="flex gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-corporate-teal/20"
          >
            <option value="all">All Types</option>
            {Object.entries(COMMUNITY_SESSION_TYPE_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>
        </div>
      }
    >
      <div className="space-y-4">
        {filteredSessions.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No upcoming sessions scheduled.</p>
          </div>
        ) : (
          filteredSessions.slice(0, 5).map(session => (
            <SessionCard
              key={session.id}
              session={session}
              isRegistered={isRegistered(session.id)}
              onRegister={handleRegister}
              onCancel={handleCancel}
            />
          ))
        )}
        
        {filteredSessions.length > 5 && (
          <button className="w-full py-2 text-sm text-corporate-teal font-medium hover:bg-teal-50 rounded-lg transition-colors">
            View All Sessions
          </button>
        )}
      </div>
    </Card>
  );
};

export default CommunityUpcomingSessionsWidget;
