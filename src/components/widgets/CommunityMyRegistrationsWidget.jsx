// src/components/widgets/CommunityMyRegistrationsWidget.jsx
import React from 'react';
import { Calendar, Clock, CheckCircle, XCircle, ChevronRight, Star, Video, Users } from 'lucide-react';
import { Card } from '../ui';
import { useCommunityRegistrations } from '../../hooks/useCommunityRegistrations';
import { useCommunitySessions } from '../../hooks/useCommunitySessions';

/**
 * Community My Registrations Widget
 * 
 * Displays the user's registered community sessions.
 * Shows upcoming registrations and past attended sessions.
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
          {session.host && (
            <p className="text-sm text-slate-500">with {session.host}</p>
          )}
        </div>
        
        <button
          onClick={() => onCancel?.(session.id)}
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
      
      {session.zoomLink && isToday && (
        <a 
          href={session.zoomLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 block w-full py-2 bg-corporate-teal text-white text-center font-medium rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
        >
          <Video className="w-4 h-4" />
          Join Session
        </a>
      )}
    </div>
  );
};

const CommunityMyRegistrationsWidget = ({ helpText }) => {
  const { upcomingRegistrations, cancelRegistration, loading } = useCommunityRegistrations();
  const { sessions } = useCommunitySessions();

  // Merge registration data with session details
  const mySessions = upcomingRegistrations.map(reg => {
    const sessionDetails = sessions.find(s => s.id === reg.sessionId);
    return {
      ...reg,
      ...sessionDetails, // Merge session details (title, date, time, etc.)
      id: reg.sessionId // Keep session ID as primary ID
    };
  }).filter(s => s.title); // Filter out any where session details weren't found

  const handleCancel = async (sessionId) => {
    if (confirm('Are you sure you want to cancel your registration?')) {
      await cancelRegistration(sessionId);
    }
  };

  if (loading) {
    return (
      <Card title="My Community Sessions" icon={Calendar} helpText={helpText}>
        <div className="animate-pulse space-y-4">
          <div className="h-24 bg-slate-100 rounded-xl"></div>
          <div className="h-24 bg-slate-100 rounded-xl"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card title="My Community Sessions" icon={Calendar} helpText={helpText}>
      <div className="space-y-4">
        {mySessions.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>You haven't registered for any sessions yet.</p>
          </div>
        ) : (
          mySessions.map(session => (
            <RegisteredSessionCard
              key={session.id}
              session={session}
              onCancel={handleCancel}
            />
          ))
        )}
      </div>
    </Card>
  );
};

export default CommunityMyRegistrationsWidget;
