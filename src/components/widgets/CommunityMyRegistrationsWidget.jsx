// src/components/widgets/CommunityMyRegistrationsWidget.jsx
import React, { useState } from 'react';
import { 
  Calendar, Clock, CheckCircle, ChevronRight, Star, Video, Users,
  AlertCircle, UserCheck, MessageSquare, Play, RefreshCw
} from 'lucide-react';
import { Card } from '../ui';
import { useCommunityRegistrations } from '../../hooks/useCommunityRegistrations';
import { useCommunitySessions } from '../../hooks/useCommunitySessions';
import SessionPickerModal from '../coaching/SessionPickerModal';

/**
 * Community My Registrations Widget
 * 
 * Displays the user's community registrations with status tracking:
 * - Scheduled (REGISTERED)
 * - Attended (ATTENDED)
 * - Completed (COMPLETED)
 */

const formatSessionDate = (dateString) => {
  if (!dateString) return 'TBD';
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

const StatusBadge = ({ status }) => {
  const styles = {
    REGISTERED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    ATTENDED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
  };
  const labels = { REGISTERED: 'Scheduled', ATTENDED: 'Attended', COMPLETED: 'Completed ✓' };
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${styles[status] || styles.REGISTERED}`}>
      {labels[status] || status}
    </span>
  );
};

const getSessionIcon = (sessionType) => {
  switch (sessionType) {
    case 'leader_circle': return Users;
    case 'community_event': return Star;
    case 'accountability_pod': return UserCheck;
    case 'mastermind': return MessageSquare;
    default: return Video;
  }
};

const RegistrationCard = ({ registration, sessions = [], onCancel, onReschedule }) => {
  const session = sessions.find(s => s.id === registration.sessionId);
  const isToday = registration.sessionDate && new Date(registration.sessionDate).toDateString() === new Date().toDateString();
  const Icon = getSessionIcon(registration.sessionType);
  
  const getIconBg = (type) => {
    switch (type) {
      case 'leader_circle': return 'bg-purple-50 dark:bg-purple-900/20';
      case 'community_event': return 'bg-orange-50 dark:bg-orange-900/20';
      case 'accountability_pod': return 'bg-teal-50 dark:bg-teal-900/20';
      case 'mastermind': return 'bg-blue-50 dark:bg-blue-900/20';
      default: return 'bg-slate-50 dark:bg-slate-800';
    }
  };
  
  const getIconColor = (type) => {
    switch (type) {
      case 'leader_circle': return 'text-purple-600';
      case 'community_event': return 'text-orange-600';
      case 'accountability_pod': return 'text-teal-600';
      case 'mastermind': return 'text-blue-600';
      default: return 'text-slate-600';
    }
  };
  
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl border p-4 transition-shadow hover:shadow-md ${isToday ? 'border-green-300 bg-green-50/50 dark:bg-green-900/10' : 'border-slate-200 dark:border-slate-700'}`}>
      <div className="flex justify-between items-start gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getIconBg(registration.sessionType)}`}>
            <Icon className={`w-5 h-5 ${getIconColor(registration.sessionType)}`} />
          </div>
          <div className="flex-1 min-w-0">
            {isToday && <span className="inline-block px-2 py-0.5 bg-green-600 text-white text-[10px] font-bold rounded-full mb-1">TODAY</span>}
            <h4 className="font-bold text-slate-800 dark:text-slate-200 truncate">{registration.sessionTitle || session?.title || 'Community Event'}</h4>
            {registration.host && <p className="text-sm text-slate-500 dark:text-slate-400">with {registration.host}</p>}
          </div>
        </div>
        <StatusBadge status={registration.status} />
      </div>
      
      <div className="flex gap-4 mt-3 text-sm text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /><span>{formatSessionDate(registration.sessionDate)}</span></div>
        {registration.sessionTime && <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /><span>{registration.sessionTime}</span></div>}
      </div>
      
      {registration.status === 'REGISTERED' && (
        <div className="mt-3 flex gap-2">
          {session?.meetingLink && isToday && <a href={session.meetingLink} target="_blank" rel="noopener noreferrer" className="flex-1 py-2 bg-purple-600 text-white text-center text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors">Join Event</a>}
          {onReschedule && (
            <button 
              onClick={() => onReschedule(registration)} 
              className="px-3 py-2 text-sm font-medium text-slate-600 bg-slate-100 dark:bg-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Reschedule
            </button>
          )}
          {onCancel && <button onClick={() => onCancel(registration.sessionId)} className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 transition-colors">Cancel</button>}
        </div>
      )}
    </div>
  );
};

const PastEventCard = ({ session }) => (
  <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center"><Play className="w-4 h-4 text-purple-600" /></div>
    <div className="flex-1 min-w-0">
      <p className="font-medium text-slate-700 dark:text-slate-200 truncate">{session.title}</p>
      <p className="text-xs text-slate-400">{formatSessionDate(session.date)}</p>
    </div>
    {session.replayUrl && <a href={session.replayUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-purple-600 hover:text-purple-800">Replay →</a>}
  </div>
);

const CommunityMyRegistrationsWidget = ({ scope = {}, helpText }) => {
  const { registrations: scopeRegistrations, sessions: scopeSessions, handleCancel: scopeHandleCancel, navigate } = scope;
  
  // State for reschedule modal
  const [rescheduleItem, setRescheduleItem] = useState(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  
  // Use hooks if not provided via scope
  const { registrations: hookRegistrations, cancelRegistration, loading: regLoading } = useCommunityRegistrations();
  const { sessions: hookSessions, loading: sessLoading } = useCommunitySessions();
  
  const registrations = scopeRegistrations || hookRegistrations || [];
  const sessions = scopeSessions || hookSessions || [];
  const loading = !scopeRegistrations && (regLoading || sessLoading);
  
  const handleCancel = async (sessionId) => {
    if (scopeHandleCancel) {
      await scopeHandleCancel(sessionId);
    } else if (window.confirm('Are you sure you want to cancel your registration?')) {
      await cancelRegistration(sessionId);
    }
  };
  
  // Handle reschedule click
  const handleReschedule = (registration) => {
    // Create a coaching-like item object for the SessionPickerModal
    const communityItem = {
      id: registration.communityItemId || `community-${registration.sessionType}`,
      sessionType: registration.sessionType,
      label: registration.sessionTitle || 'Community Event'
    };
    setRescheduleItem(communityItem);
    setShowRescheduleModal(true);
  };
  
  // Handle successful reschedule
  const handleRescheduleComplete = () => {
    setShowRescheduleModal(false);
    setRescheduleItem(null);
  };
  
  const activeRegistrations = registrations.filter(r => r.status !== 'CANCELLED' && r.status !== 'NO_SHOW');
  const scheduledRegistrations = activeRegistrations.filter(r => r.status === 'REGISTERED');
  const attendedRegistrations = activeRegistrations.filter(r => r.status === 'ATTENDED');
  const completedRegistrations = activeRegistrations.filter(r => r.status === 'COMPLETED');
  
  const hasAny = activeRegistrations.length > 0;
  
  if (loading) {
    return (
      <Card title="My Events" icon={Users} accent="PURPLE" helpText={helpText}>
        <div className="animate-pulse space-y-4">
          <div className="h-24 bg-slate-100 dark:bg-slate-700 rounded-xl"></div>
          <div className="h-24 bg-slate-100 dark:bg-slate-700 rounded-xl"></div>
        </div>
      </Card>
    );
  }
  
  if (!hasAny) {
    return (
      <Card title="My Events" icon={Users} accent="PURPLE" helpText={helpText}>
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-600 dark:text-slate-300 mb-1">No Events Yet</h3>
          <p className="text-sm text-slate-400 mb-4">Browse upcoming community events and register to connect with fellow leaders.</p>
          <button onClick={() => navigate?.('community')} className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors">Browse Events</button>
        </div>
      </Card>
    );
  }
  
  return (
    <Card title="My Events" icon={Users} accent="PURPLE" helpText={helpText}>
      <div className="grid grid-cols-3 gap-2 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{scheduledRegistrations.length}</p>
          <p className="text-[10px] text-blue-600 dark:text-blue-400 uppercase">Upcoming</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-amber-700 dark:text-amber-300">{attendedRegistrations.length}</p>
          <p className="text-[10px] text-amber-600 dark:text-amber-400 uppercase">Attended</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{completedRegistrations.length}</p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase">Completed</p>
        </div>
      </div>
      
      {scheduledRegistrations.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-2 flex items-center gap-1"><Calendar className="w-3 h-3" />Upcoming ({scheduledRegistrations.length})</p>
          <div className="space-y-2">{scheduledRegistrations.slice(0, 3).map(reg => <RegistrationCard key={reg.id} registration={reg} sessions={sessions} onCancel={handleCancel} onReschedule={handleReschedule} />)}</div>
          {scheduledRegistrations.length > 3 && <button onClick={() => navigate?.('community')} className="w-full mt-2 py-2 text-sm text-purple-600 font-medium hover:bg-purple-50 rounded-lg transition-colors flex items-center justify-center gap-1">View all {scheduledRegistrations.length}<ChevronRight className="w-4 h-4" /></button>}
        </div>
      )}
      
      {attendedRegistrations.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-amber-600 uppercase mb-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" />Recently Attended ({attendedRegistrations.length})</p>
          <div className="space-y-2">{attendedRegistrations.slice(0, 2).map(reg => <RegistrationCard key={reg.id} registration={reg} sessions={sessions} />)}</div>
        </div>
      )}
      
      {completedRegistrations.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-emerald-600 uppercase mb-2 flex items-center gap-1"><CheckCircle className="w-3 h-3" />Completed ({completedRegistrations.length})</p>
          <div className="space-y-2">{completedRegistrations.slice(0, 2).map(reg => <RegistrationCard key={reg.id} registration={reg} sessions={sessions} />)}</div>
        </div>
      )}
      
      {/* Reschedule Modal */}
      <SessionPickerModal
        isOpen={showRescheduleModal}
        onClose={() => setShowRescheduleModal(false)}
        coachingItem={rescheduleItem}
        onRegister={handleRescheduleComplete}
      />
    </Card>
  );
};

export default CommunityMyRegistrationsWidget;
