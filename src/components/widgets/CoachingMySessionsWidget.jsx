// src/components/widgets/CoachingMySessionsWidget.jsx
import React, { useState } from 'react';
import { 
  User, Calendar, Clock, CheckCircle, ChevronRight, 
  UserCheck, Video, Users, AlertCircle, Play, RefreshCw
} from 'lucide-react';
import { Card } from '../ui';
import { REGISTRATION_STATUS } from '../../data/Constants';
import SessionPickerModal from '../coaching/SessionPickerModal';

/**
 * Coaching My Sessions Widget
 * 
 * Displays the user's coaching registrations with full status tracking:
 * - Scheduled (registered)
 * - Attended (attended) - awaiting facilitator certification
 * - Certified (certified) - completed
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
  const normalizedStatus = (status || '').toLowerCase();
  const styles = {
    registered: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    attended: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    certified: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
  };
  const labels = { registered: 'Scheduled', attended: 'Awaiting Certification', certified: 'Certified ✓' };
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${styles[normalizedStatus] || styles.registered}`}>
      {labels[normalizedStatus] || status}
    </span>
  );
};

const getSessionIcon = (sessionType) => {
  const type = (sessionType || '').toLowerCase();
  switch (type) {
    case 'one_on_one': return UserCheck;
    case 'open_gym': return Users;
    default: return Video;
  }
};

const RegistrationCard = ({ registration, sessions = [], onCancel, onReschedule }) => {
  const session = sessions.find(s => s.id === registration.sessionId);
  const isToday = registration.sessionDate && new Date(registration.sessionDate).toDateString() === new Date().toDateString();
  const Icon = getSessionIcon(registration.sessionType);
  const normalizedStatus = (registration.status || '').toLowerCase();
  
  const getIconBgClass = () => {
    const type = (registration.sessionType || '').toLowerCase();
    if (type === 'one_on_one') return 'bg-orange-50 dark:bg-orange-900/20';
    if (type === 'open_gym') return 'bg-blue-50 dark:bg-blue-900/20';
    return 'bg-teal-50 dark:bg-teal-900/20';
  };
  
  const getIconColorClass = () => {
    const type = (registration.sessionType || '').toLowerCase();
    if (type === 'one_on_one') return 'text-orange-600';
    if (type === 'open_gym') return 'text-blue-600';
    return 'text-teal-600';
  };
  
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl border p-4 transition-shadow hover:shadow-md ${isToday ? 'border-green-300 bg-green-50/50 dark:bg-green-900/10' : 'border-slate-200 dark:border-slate-700'}`}>
      <div className="flex justify-between items-start gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getIconBgClass()}`}>
            <Icon className={`w-5 h-5 ${getIconColorClass()}`} />
          </div>
          <div className="flex-1 min-w-0">
            {isToday && <span className="inline-block px-2 py-0.5 bg-green-600 text-white text-[10px] font-bold rounded-full mb-1">TODAY</span>}
            <h4 className="font-bold text-slate-800 dark:text-slate-200 truncate">{registration.sessionTitle || session?.title || 'Coaching Session'}</h4>
            {(registration.coach || session?.coach) && <p className="text-sm text-slate-500 dark:text-slate-400">with {registration.coach || session?.coach}</p>}
          </div>
        </div>
        <StatusBadge status={registration.status} />
      </div>
      
      <div className="flex gap-4 mt-3 text-sm text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /><span>{formatSessionDate(registration.sessionDate || session?.date)}</span></div>
        {(registration.sessionTime || session?.time) && <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /><span>{registration.sessionTime || session?.time}</span></div>}
      </div>
      
      {registration.coachingItemId && (
        <div className="mt-2 text-xs text-corporate-teal">
          Milestone {registration.coachingItemId.includes('milestone-') ? registration.coachingItemId.split('-')[1] : ''} requirement
        </div>
      )}
      
      {normalizedStatus === 'registered' && (
        <div className="mt-3 flex gap-2">
          {session?.meetingLink && isToday && <a href={session.meetingLink} target="_blank" rel="noopener noreferrer" className="flex-1 py-2 bg-corporate-teal text-white text-center text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors">Join Session</a>}
          {onReschedule && (
            <button 
              onClick={() => onReschedule(registration)} 
              className="px-3 py-2 text-sm font-medium text-slate-600 bg-slate-100 dark:bg-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Reschedule
            </button>
          )}
          {onCancel && <button onClick={() => onCancel({ id: registration.sessionId })} className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 transition-colors">Cancel</button>}
        </div>
      )}
    </div>
  );
};

const PastSessionCard = ({ session }) => (
  <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center"><Play className="w-4 h-4 text-purple-600" /></div>
    <div className="flex-1 min-w-0">
      <p className="font-medium text-slate-700 dark:text-slate-200 truncate">{session.title}</p>
      <p className="text-xs text-slate-400">{formatSessionDate(session.date)}</p>
    </div>
    {session.replayUrl && <a href={session.replayUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-purple-600 hover:text-purple-800">Replay →</a>}
  </div>
);

const CoachingMySessionsWidget = ({ scope = {}, helpText }) => {
  const { registrations = [], sessions = [], pastSessions = [], handleCancel, navigate } = scope;
  
  // State for reschedule modal
  const [rescheduleItem, setRescheduleItem] = useState(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  
  // Handle reschedule click
  const handleReschedule = (registration) => {
    // Create a coaching item object for the SessionPickerModal
    const coachingItem = {
      id: registration.coachingItemId,
      sessionType: registration.sessionType,
      label: registration.sessionTitle || 'Coaching Session'
    };
    setRescheduleItem(coachingItem);
    setShowRescheduleModal(true);
  };
  
  // Handle successful reschedule
  const handleRescheduleComplete = () => {
    setShowRescheduleModal(false);
    setRescheduleItem(null);
  };
  
  // Normalize status comparison to lowercase
  const activeRegistrations = registrations.filter(r => {
    const status = (r.status || '').toLowerCase();
    return status !== 'cancelled' && status !== 'no_show';
  });
  const scheduledRegistrations = activeRegistrations.filter(r => (r.status || '').toLowerCase() === 'registered');
  const attendedRegistrations = activeRegistrations.filter(r => (r.status || '').toLowerCase() === 'attended');
  const certifiedRegistrations = activeRegistrations.filter(r => (r.status || '').toLowerCase() === 'certified');
  
  const hasAny = activeRegistrations.length > 0 || pastSessions.length > 0;
  
  if (!hasAny) {
    return (
      <Card title="My Sessions" icon={User} accent="TEAL" helpText={helpText}>
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-600 dark:text-slate-300 mb-1">No Sessions Yet</h3>
          <p className="text-sm text-slate-400 mb-4">Browse sessions and register for coaching.</p>
          <button onClick={() => navigate?.('coaching-hub')} className="px-4 py-2 bg-corporate-teal text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors">Browse Sessions</button>
        </div>
      </Card>
    );
  }
  
  return (
    <Card title="My Sessions" icon={User} accent="TEAL" helpText={helpText}>
      <div className="grid grid-cols-3 gap-2 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{scheduledRegistrations.length}</p>
          <p className="text-[10px] text-blue-600 dark:text-blue-400 uppercase">Upcoming</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-amber-700 dark:text-amber-300">{attendedRegistrations.length}</p>
          <p className="text-[10px] text-amber-600 dark:text-amber-400 uppercase">Awaiting</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{certifiedRegistrations.length}</p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase">Certified</p>
        </div>
      </div>
      
      {scheduledRegistrations.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-2 flex items-center gap-1"><Calendar className="w-3 h-3" />Upcoming ({scheduledRegistrations.length})</p>
          <div className="space-y-2">{scheduledRegistrations.slice(0, 3).map(reg => <RegistrationCard key={reg.id || reg.sessionId} registration={reg} sessions={sessions} onCancel={handleCancel} onReschedule={handleReschedule} />)}</div>
          {scheduledRegistrations.length > 3 && <button onClick={() => navigate?.('coaching-hub')} className="w-full mt-2 py-2 text-sm text-corporate-teal font-medium hover:bg-teal-50 rounded-lg transition-colors flex items-center justify-center gap-1">View all {scheduledRegistrations.length}<ChevronRight className="w-4 h-4" /></button>}
        </div>
      )}
      
      {attendedRegistrations.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-amber-600 uppercase mb-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" />Awaiting Certification ({attendedRegistrations.length})</p>
          <div className="space-y-2">{attendedRegistrations.slice(0, 2).map(reg => <RegistrationCard key={reg.id || reg.sessionId} registration={reg} sessions={sessions} />)}</div>
        </div>
      )}
      
      {certifiedRegistrations.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-emerald-600 uppercase mb-2 flex items-center gap-1"><CheckCircle className="w-3 h-3" />Certified ({certifiedRegistrations.length})</p>
          <div className="space-y-2">{certifiedRegistrations.slice(0, 2).map(reg => <RegistrationCard key={reg.id || reg.sessionId} registration={reg} sessions={sessions} />)}</div>
        </div>
      )}
      
      {pastSessions.length > 0 && (
        <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-2">Past Sessions ({pastSessions.length})</p>
          <div className="space-y-2">{pastSessions.slice(0, 3).map(session => <PastSessionCard key={session.id} session={session} />)}</div>
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

export default CoachingMySessionsWidget;
