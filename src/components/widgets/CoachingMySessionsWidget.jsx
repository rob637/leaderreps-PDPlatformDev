// src/components/widgets/CoachingMySessionsWidget.jsx
import React from 'react';
import { User, Calendar, Clock, CheckCircle, XCircle, ChevronRight, Star } from 'lucide-react';
import { Card } from '../ui';

/**
 * Coaching My Sessions Widget
 * 
 * Displays the user's registered sessions and coaching history.
 * Shows upcoming registrations and past completed sessions.
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

// Registered Session Card
const RegisteredSessionCard = ({ session, onCancel }) => {
  const isToday = new Date(session.date).toDateString() === new Date().toDateString();
  
  return (
    <div className={`bg-white rounded-xl border p-4 ${isToday ? 'border-green-300 bg-green-50' : 'border-slate-200'}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          {isToday && (
            <span className="inline-block px-2 py-0.5 bg-green-600 text-white text-xs font-bold rounded-full mb-2">
              TODAY
            </span>
          )}
          <h4 className="font-bold text-slate-800">{session.title}</h4>
          {session.coach && (
            <p className="text-sm text-slate-500">with {session.coach}</p>
          )}
        </div>
        
        <button
          onClick={() => onCancel?.(session)}
          className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
        >
          Cancel
        </button>
      </div>
      
      <div className="flex gap-4 mt-3 text-sm text-slate-500">
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          <span>{formatSessionDate(session.date)}</span>
        </div>
        {session.time && (
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{session.time}</span>
          </div>
        )}
      </div>
      
      {session.meetingLink && isToday && (
        <a 
          href={session.meetingLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 block w-full py-2 bg-corporate-teal text-white text-center font-medium rounded-lg hover:bg-teal-700 transition-colors"
        >
          Join Session
        </a>
      )}
    </div>
  );
};

// Past Session Card
const PastSessionCard = ({ session }) => {
  return (
    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
        <CheckCircle className="w-4 h-4 text-green-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-700 truncate">{session.title}</p>
        <p className="text-xs text-slate-400">{formatSessionDate(session.date)}</p>
      </div>
      {session.rating && (
        <div className="flex items-center gap-0.5">
          {[...Array(session.rating)].map((_, i) => (
            <Star key={i} className="w-3 h-3 text-yellow-500 fill-yellow-500" />
          ))}
        </div>
      )}
    </div>
  );
};

const CoachingMySessionsWidget = ({ scope = {}, helpText }) => {
  const { 
    registeredSessions = [],
    pastSessions = [],
    handleCancel,
    navigate
  } = scope;
  
  const hasUpcoming = registeredSessions.length > 0;
  const hasPast = pastSessions.length > 0;
  
  if (!hasUpcoming && !hasPast) {
    return (
      <Card title="My Coaching" icon={User} accent="TEAL" helpText={helpText}>
        <div className="text-center py-8">
          <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-600 mb-1">No Sessions Yet</h3>
          <p className="text-sm text-slate-400 mb-4">Register for a live session to get started.</p>
          <button 
            onClick={() => navigate?.('coaching-lab')}
            className="px-4 py-2 bg-corporate-teal text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
          >
            Browse Sessions
          </button>
        </div>
      </Card>
    );
  }
  
  return (
    <Card title="My Coaching" icon={User} accent="TEAL" helpText={helpText}>
      {/* Upcoming Registrations */}
      {hasUpcoming && (
        <div className="mb-4">
          <p className="text-xs font-medium text-slate-500 uppercase mb-2">
            Upcoming ({registeredSessions.length})
          </p>
          <div className="space-y-2">
            {registeredSessions.slice(0, 3).map(session => (
              <RegisteredSessionCard 
                key={session.id}
                session={session}
                onCancel={handleCancel}
              />
            ))}
          </div>
          
          {registeredSessions.length > 3 && (
            <button 
              onClick={() => navigate?.('coaching-lab', { tab: 'my' })}
              className="w-full mt-2 py-2 text-sm text-corporate-teal font-medium hover:bg-teal-50 rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              View all {registeredSessions.length} registrations
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
      
      {/* Past Sessions */}
      {hasPast && (
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase mb-2">
            History ({pastSessions.length})
          </p>
          <div className="space-y-2">
            {pastSessions.slice(0, 5).map(session => (
              <PastSessionCard key={session.id} session={session} />
            ))}
          </div>
          
          {pastSessions.length > 5 && (
            <button 
              onClick={() => navigate?.('coaching-lab', { tab: 'my', view: 'history' })}
              className="w-full mt-2 py-2 text-sm text-slate-500 font-medium hover:bg-slate-100 rounded-lg transition-colors"
            >
              View full history
            </button>
          )}
        </div>
      )}
      
      {/* Stats Summary */}
      {hasPast && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-2xl font-bold text-corporate-navy">{pastSessions.length}</p>
              <p className="text-xs text-slate-500">Sessions</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-corporate-navy">
                {Math.round(pastSessions.reduce((acc, s) => acc + (s.durationMinutes || 60), 0) / 60)}h
              </p>
              <p className="text-xs text-slate-500">Total Time</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-corporate-navy">
                {pastSessions.filter(s => s.rating >= 4).length}
              </p>
              <p className="text-xs text-slate-500">5-Star</p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default CoachingMySessionsWidget;
