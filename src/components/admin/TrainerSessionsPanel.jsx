// src/components/admin/TrainerSessionsPanel.jsx
// Trainer view of their scheduled sessions and open sessions
// Shows: My Sessions (assigned to me), Open Sessions (still have spots)

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Calendar, Clock, Users, Video, CheckCircle, AlertCircle,
  ChevronDown, ChevronUp, Search, Loader, User, UserCheck,
  CalendarDays, Filter, ExternalLink, RefreshCw, Eye
} from 'lucide-react';
import { useAppServices } from '../../services/useAppServices';
import { Card } from '../ui';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  getDoc
} from 'firebase/firestore';
import {
  COACHING_SESSIONS_COLLECTION,
  COACHING_REGISTRATIONS_COLLECTION,
  SESSION_STATUS,
  REGISTRATION_STATUS
} from '../../data/Constants';

// ============================================
// SESSION TYPE CONFIG
// ============================================
const SESSION_TYPE_CONFIG = {
  open_gym: {
    label: 'Open Gym',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30',
    border: 'border-l-blue-500'
  },
  leader_circle: {
    label: 'Leader Circle',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30',
    border: 'border-l-purple-500'
  },
  live_workout: {
    label: 'Live Workout',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30',
    border: 'border-l-green-500'
  },
  workshop: {
    label: 'Workshop',
    color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30',
    border: 'border-l-teal-500'
  },
  one_on_one: {
    label: '1:1 Coaching',
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30',
    border: 'border-l-orange-500'
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================
const formatDate = (dateString) => {
  if (!dateString) return 'TBD';
  
  // Parse as local date
  let date;
  if (typeof dateString === 'string' && dateString.length === 10) {
    const [y, m, d] = dateString.split('-');
    date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
  } else {
    date = dateString?.toDate?.() || new Date(dateString);
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

const isUpcoming = (dateString) => {
  if (!dateString) return false;
  let date;
  if (typeof dateString === 'string' && dateString.length === 10) {
    const [y, m, d] = dateString.split('-');
    date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
  } else {
    date = new Date(dateString);
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
};

// ============================================
// SESSION CARD COMPONENT
// ============================================
const SessionCard = ({ session, registrations, expanded, onToggle }) => {
  const typeConfig = SESSION_TYPE_CONFIG[session.sessionType] || SESSION_TYPE_CONFIG.workshop;
  const maxAttendees = session.maxAttendees || getDefaultMaxAttendees(session.sessionType);
  const registeredCount = registrations.filter(r => 
    r.status !== REGISTRATION_STATUS.CANCELLED && r.status !== REGISTRATION_STATUS.NO_SHOW
  ).length;
  const spotsLeft = maxAttendees - registeredCount;
  const isFull = spotsLeft <= 0;
  const isPast = !isUpcoming(session.date);
  
  return (
    <div className={`border rounded-lg overflow-hidden ${isPast ? 'opacity-60' : ''} border-l-4 ${typeConfig.border}`}>
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className={`p-2 rounded-lg ${typeConfig.color}`}>
            <Video className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-corporate-navy dark:text-white">
              {session.title}
            </h3>
            <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(session.date)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {session.time || 'TBD'}
              </span>
              {session.coach && (
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  {session.coach}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Registration Count */}
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${
            isFull 
              ? 'bg-red-100 text-red-700 dark:bg-red-900/30' 
              : spotsLeft <= 3 
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30'
                : 'bg-green-100 text-green-700 dark:bg-green-900/30'
          }`}>
            <Users className="w-3.5 h-3.5" />
            {registeredCount}/{maxAttendees}
          </div>
          
          {/* Session Type Badge */}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeConfig.color}`}>
            {typeConfig.label}
          </span>
          
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </button>
      
      {/* Expanded: Show Registrations */}
      {expanded && (
        <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4">
          {session.zoomLink && (
            <a 
              href={session.zoomLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Video className="w-4 h-4" />
              Join Zoom
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          
          <h4 className="font-medium text-sm text-slate-700 dark:text-slate-200 mb-2">
            Registered Leaders ({registeredCount})
          </h4>
          
          {registrations.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 italic">
              No registrations yet
            </p>
          ) : (
            <div className="grid gap-2">
              {registrations
                .filter(r => r.status !== REGISTRATION_STATUS.CANCELLED)
                .map((reg) => (
                  <div 
                    key={reg.id}
                    className="flex items-center justify-between p-2 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-corporate-navy/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-corporate-navy" />
                      </div>
                      <div>
                        <div className="font-medium text-sm text-slate-700 dark:text-slate-200">
                          {reg.userName || reg.userEmail?.split('@')[0] || 'Unknown'}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {reg.userEmail}
                        </div>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      reg.status === REGISTRATION_STATUS.CERTIFIED
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30'
                        : reg.status === REGISTRATION_STATUS.ATTENDED
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30'
                          : reg.status === REGISTRATION_STATUS.NO_SHOW
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30'
                    }`}>
                      {reg.status === REGISTRATION_STATUS.CERTIFIED ? 'Certified' :
                       reg.status === REGISTRATION_STATUS.ATTENDED ? 'Attended' :
                       reg.status === REGISTRATION_STATUS.NO_SHOW ? 'No Show' : 'Registered'}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const TrainerSessionsPanel = () => {
  const { db, user } = useAppServices();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [registrationsBySession, setRegistrationsBySession] = useState({});
  const [expandedSession, setExpandedSession] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState('my-sessions'); // 'my-sessions', 'open-sessions', 'all'
  const [refreshing, setRefreshing] = useState(false);

  // Fetch sessions and registrations
  const fetchData = useCallback(async () => {
    if (!db) return;
    
    try {
      // Get all sessions
      const sessionsRef = collection(db, COACHING_SESSIONS_COLLECTION);
      const sessionsSnap = await getDocs(sessionsRef);
      
      const sessionList = sessionsSnap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
      
      // Get all registrations
      const registrationsRef = collection(db, COACHING_REGISTRATIONS_COLLECTION);
      const registrationsSnap = await getDocs(registrationsRef);
      
      const regsBySession = {};
      registrationsSnap.docs.forEach(d => {
        const reg = { id: d.id, ...d.data() };
        if (!regsBySession[reg.sessionId]) {
          regsBySession[reg.sessionId] = [];
        }
        regsBySession[reg.sessionId].push(reg);
      });
      
      setSessions(sessionList);
      setRegistrationsBySession(regsBySession);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [db]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Filter sessions based on view and search
  const filteredSessions = useMemo(() => {
    let result = sessions;
    
    // Filter by view
    switch (view) {
      case 'my-sessions':
        // Sessions where I'm the coach OR assigned facilitator
        // Check coach field, facilitator field, or email match
        const userEmail = user?.email?.toLowerCase();
        const userName = user?.displayName?.toLowerCase();
        result = result.filter(s => {
          const coach = (s.coach || '').toLowerCase();
          const facilitator = (s.facilitator || '').toLowerCase();
          const facilitatorEmail = (s.facilitatorEmail || '').toLowerCase();
          return (
            coach.includes('ryan') || // For now, show Ryan's sessions for admins
            coach === userEmail ||
            coach === userName ||
            facilitator === userEmail ||
            facilitatorEmail === userEmail
          );
        });
        break;
        
      case 'open-sessions':
        // Sessions with spots still available
        result = result.filter(s => {
          const maxAttendees = s.maxAttendees || getDefaultMaxAttendees(s.sessionType);
          const regs = registrationsBySession[s.id] || [];
          const activeRegs = regs.filter(r => 
            r.status !== REGISTRATION_STATUS.CANCELLED && 
            r.status !== REGISTRATION_STATUS.NO_SHOW
          ).length;
          return (maxAttendees - activeRegs) > 0;
        });
        break;
        
      case 'all':
      default:
        // Show all sessions
        break;
    }
    
    // Filter by upcoming only
    result = result.filter(s => isUpcoming(s.date) || view === 'all');
    
    // Filter by search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(s =>
        s.title?.toLowerCase().includes(term) ||
        s.coach?.toLowerCase().includes(term) ||
        s.sessionType?.toLowerCase().includes(term)
      );
    }
    
    // Sort by date
    result.sort((a, b) => {
      const dateA = new Date(a.date || '9999-12-31');
      const dateB = new Date(b.date || '9999-12-31');
      return dateA - dateB;
    });
    
    return result;
  }, [sessions, view, searchTerm, registrationsBySession, user]);

  // Stats
  const stats = useMemo(() => {
    const upcoming = sessions.filter(s => isUpcoming(s.date));
    const userEmail = user?.email?.toLowerCase();
    
    const mySessions = upcoming.filter(s => {
      const coach = (s.coach || '').toLowerCase();
      return coach.includes('ryan') || coach === userEmail;
    });
    
    const openSessions = upcoming.filter(s => {
      const maxAttendees = s.maxAttendees || getDefaultMaxAttendees(s.sessionType);
      const regs = registrationsBySession[s.id] || [];
      const activeRegs = regs.filter(r => 
        r.status !== REGISTRATION_STATUS.CANCELLED && 
        r.status !== REGISTRATION_STATUS.NO_SHOW
      ).length;
      return (maxAttendees - activeRegs) > 0;
    });
    
    const totalRegistrations = Object.values(registrationsBySession)
      .flat()
      .filter(r => r.status !== REGISTRATION_STATUS.CANCELLED).length;
    
    return {
      totalUpcoming: upcoming.length,
      mySessions: mySessions.length,
      openSessions: openSessions.length,
      totalRegistrations
    };
  }, [sessions, registrationsBySession, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader className="w-8 h-8 animate-spin text-corporate-teal" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-corporate-navy dark:text-white">
            Trainer Sessions
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            View your scheduled sessions and manage open sessions
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-corporate-navy dark:text-white">
            {stats.totalUpcoming}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 uppercase">
            Upcoming Sessions
          </div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-corporate-teal">
            {stats.mySessions}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 uppercase">
            My Sessions
          </div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {stats.openSessions}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 uppercase">
            Open Sessions
          </div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {stats.totalRegistrations}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 uppercase">
            Total Registrations
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-4 flex-wrap">
          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
            <button
              onClick={() => setView('my-sessions')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === 'my-sessions'
                  ? 'bg-white dark:bg-slate-600 text-corporate-navy dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-corporate-navy'
              }`}
            >
              <User className="w-4 h-4 inline mr-1" />
              My Sessions
            </button>
            <button
              onClick={() => setView('open-sessions')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === 'open-sessions'
                  ? 'bg-white dark:bg-slate-600 text-corporate-navy dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-corporate-navy'
              }`}
            >
              <Eye className="w-4 h-4 inline mr-1" />
              Open Sessions
            </button>
            <button
              onClick={() => setView('all')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === 'all'
                  ? 'bg-white dark:bg-slate-600 text-corporate-navy dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-corporate-navy'
              }`}
            >
              <CalendarDays className="w-4 h-4 inline mr-1" />
              All Sessions
            </button>
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search sessions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/20 bg-white dark:bg-slate-800 text-sm"
            />
          </div>
        </div>
      </Card>

      {/* Sessions List */}
      <div className="space-y-3">
        {filteredSessions.length === 0 ? (
          <Card className="p-8 text-center">
            <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-medium text-slate-600 dark:text-slate-300 mb-1">
              No Sessions Found
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {view === 'my-sessions' 
                ? 'You have no upcoming sessions assigned to you.'
                : view === 'open-sessions'
                  ? 'All sessions are currently full.'
                  : 'No sessions match your search.'}
            </p>
          </Card>
        ) : (
          filteredSessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              registrations={registrationsBySession[session.id] || []}
              expanded={expandedSession === session.id}
              onToggle={() => setExpandedSession(
                expandedSession === session.id ? null : session.id
              )}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default TrainerSessionsPanel;
