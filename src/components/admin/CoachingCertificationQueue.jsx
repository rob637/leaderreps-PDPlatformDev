import React, { useState, useEffect, useCallback } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  User, 
  AlertCircle,
  Check,
  X,
  Video,
  Calendar,
  Users,
  Search,
  Loader,
  ChevronDown,
  ChevronUp,
  Award,
  Download,
  ExternalLink
} from 'lucide-react';
import { useAppServices } from '../../services/useAppServices';
import { 
  collection, 
  getDocs, 
  query, 
  where,
  doc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { Card } from '../ui';
import { 
  COACHING_REGISTRATIONS_COLLECTION, 
  COACHING_SESSIONS_COLLECTION,
  REGISTRATION_STATUS 
} from '../../data/Constants';
import { generateSessionCalendarLinks } from '../../services/calendarUtils';

/**
 * CoachingCertificationQueue Component
 * 
 * Admin/Facilitator tool to:
 * 1. View recent coaching sessions with registrants
 * 2. Mark participants as attended
 * 3. Certify participants for milestone progression
 */
const CoachingCertificationQueue = () => {
  const { db, user } = useAppServices();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [expandedSession, setExpandedSession] = useState(null);
  const [processing, setProcessing] = useState(null);
  const [certificationNotes, setCertificationNotes] = useState('');
  const [filter, setFilter] = useState('needs-review'); // 'needs-review', 'all'
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch sessions with registrations
  const fetchSessions = useCallback(async () => {
    if (!db) return;
    setLoading(true);
    
    try {
      // Get all sessions
      const sessionsRef = collection(db, COACHING_SESSIONS_COLLECTION);
      const sessionsSnap = await getDocs(sessionsRef);
      
      const sessionList = [];
      const now = new Date();
      
      for (const sessionDoc of sessionsSnap.docs) {
        const session = { id: sessionDoc.id, ...sessionDoc.data() };
        const sessionDate = new Date(session.date);
        
        // Get registrations for this session
        const regsRef = collection(db, COACHING_REGISTRATIONS_COLLECTION);
        const regsQuery = query(regsRef, where('sessionId', '==', session.id));
        const regsSnap = await getDocs(regsQuery);
        
        const registrations = regsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // Skip sessions with no registrations
        if (registrations.length === 0) continue;
        
        // Count by status
        const statusCounts = {
          registered: registrations.filter(r => r.status === REGISTRATION_STATUS.REGISTERED).length,
          attended: registrations.filter(r => r.status === REGISTRATION_STATUS.ATTENDED).length,
          certified: registrations.filter(r => r.status === REGISTRATION_STATUS.CERTIFIED).length,
          noShow: registrations.filter(r => r.status === REGISTRATION_STATUS.NO_SHOW).length
        };
        
        sessionList.push({
          ...session,
          registrations,
          statusCounts,
          isPast: sessionDate < now,
          needsReview: statusCounts.registered > 0 || statusCounts.attended > 0
        });
      }
      
      // Sort by date descending (most recent first)
      sessionList.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      setSessions(sessionList);
    } catch (error) {
      console.error('[CoachingCertificationQueue] Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Mark participant as attended
  const handleMarkAttended = async (sessionId, userId) => {
    if (!db || !user?.uid) return;
    setProcessing(`${sessionId}_${userId}_attended`);
    
    try {
      const regId = `${sessionId}_${userId}`;
      const regRef = doc(db, COACHING_REGISTRATIONS_COLLECTION, regId);
      
      await updateDoc(regRef, {
        status: REGISTRATION_STATUS.ATTENDED,
        attendedAt: serverTimestamp(),
        markedAttendedBy: user.uid
      });
      
      // Refresh data
      await fetchSessions();
    } catch (error) {
      console.error('[CoachingCertificationQueue] Error marking attended:', error);
      alert('Failed to mark as attended');
    } finally {
      setProcessing(null);
    }
  };

  // Certify participant
  const handleCertify = async (sessionId, userId) => {
    if (!db || !user?.uid) return;
    setProcessing(`${sessionId}_${userId}_certify`);
    
    try {
      const regId = `${sessionId}_${userId}`;
      const regRef = doc(db, COACHING_REGISTRATIONS_COLLECTION, regId);
      
      await updateDoc(regRef, {
        status: REGISTRATION_STATUS.CERTIFIED,
        certifiedAt: serverTimestamp(),
        certifiedBy: user.uid,
        certificationNotes: certificationNotes || ''
      });
      
      setCertificationNotes('');
      // Refresh data
      await fetchSessions();
    } catch (error) {
      console.error('[CoachingCertificationQueue] Error certifying:', error);
      alert('Failed to certify participant');
    } finally {
      setProcessing(null);
    }
  };

  // Mark as no-show
  const handleNoShow = async (sessionId, userId) => {
    if (!db || !user?.uid) return;
    if (!confirm('Mark this participant as no-show?')) return;
    
    setProcessing(`${sessionId}_${userId}_noshow`);
    
    try {
      const regId = `${sessionId}_${userId}`;
      const regRef = doc(db, COACHING_REGISTRATIONS_COLLECTION, regId);
      
      await updateDoc(regRef, {
        status: REGISTRATION_STATUS.NO_SHOW,
        markedNoShowAt: serverTimestamp(),
        markedNoShowBy: user.uid
      });
      
      // Refresh data
      await fetchSessions();
    } catch (error) {
      console.error('[CoachingCertificationQueue] Error marking no-show:', error);
      alert('Failed to mark as no-show');
    } finally {
      setProcessing(null);
    }
  };

  // Filter sessions
  const filteredSessions = sessions.filter(session => {
    if (filter === 'needs-review' && !session.needsReview) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (!session.title?.toLowerCase().includes(term)) return false;
    }
    return true;
  });

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Unknown';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case REGISTRATION_STATUS.REGISTERED:
        return <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 rounded-full">Registered</span>;
      case REGISTRATION_STATUS.ATTENDED:
        return <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 rounded-full">Attended</span>;
      case REGISTRATION_STATUS.CERTIFIED:
        return <span className="px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 rounded-full flex items-center gap-1"><Award className="w-3 h-3" /> Certified</span>;
      case REGISTRATION_STATUS.NO_SHOW:
        return <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 rounded-full">No Show</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-full">{status}</span>;
    }
  };

  if (loading) {
    return (
      <Card title="Leader Certification" icon={Award} accent="TEAL">
        <div className="flex items-center justify-center py-12">
          <Loader className="w-6 h-6 animate-spin text-corporate-teal" />
        </div>
      </Card>
    );
  }

  return (
    <Card title="Leader Certification" icon={Award} accent="TEAL">
      <div className="space-y-4">
        {/* Header Info */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Review coaching session attendance and issue Leader Certifications.
            Once certified, participants can view and acknowledge their certificate to complete the milestone.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search sessions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-corporate-teal focus:border-transparent"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="needs-review">Needs Review</option>
            <option value="all">All Sessions</option>
          </select>
        </div>

        {/* Sessions List */}
        {filteredSessions.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-300" />
            <p>No sessions need review</p>
            <p className="text-sm mt-1">All participants have been certified</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSessions.map(session => (
              <div 
                key={session.id}
                className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden"
              >
                {/* Session Header */}
                <button
                  onClick={() => setExpandedSession(expandedSession === session.id ? null : session.id)}
                  className="w-full flex items-center gap-3 p-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors text-left"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    session.needsReview 
                      ? 'bg-amber-100 dark:bg-amber-900/40' 
                      : 'bg-emerald-100 dark:bg-emerald-900/40'
                  }`}>
                    <Video className={`w-5 h-5 ${
                      session.needsReview 
                        ? 'text-amber-600 dark:text-amber-400' 
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white truncate">
                      {session.title || 'Coaching Session'}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(session.date)}</span>
                      <span>•</span>
                      <Users className="w-3 h-3" />
                      <span>{session.registrations.length} registrants</span>
                    </div>
                  </div>

                  {/* Status Summary */}
                  <div className="flex items-center gap-2">
                    {session.statusCounts.attended > 0 && (
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                        {session.statusCounts.attended} attended
                      </span>
                    )}
                    {session.statusCounts.certified > 0 && (
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        {session.statusCounts.certified} certified
                      </span>
                    )}
                    {session.needsReview && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 rounded-full">
                        Review
                      </span>
                    )}
                  </div>

                  {expandedSession === session.id ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </button>

                {/* Expanded Registrations */}
                {expandedSession === session.id && (
                  <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 p-4">
                    <div className="space-y-2">
                      {session.registrations.map(reg => {
                        // Generate calendar links for this registration
                        const calendarLinks = generateSessionCalendarLinks(session, reg);
                        
                        return (
                        <div 
                          key={reg.id}
                          className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                        >
                          <div className="w-8 h-8 rounded-full bg-corporate-teal/10 flex items-center justify-center">
                            <User className="w-4 h-4 text-corporate-teal" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-slate-900 dark:text-white truncate">
                              {reg.userName || reg.userEmail || 'Unknown'}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {reg.userEmail}
                            </p>
                          </div>

                          {getStatusBadge(reg.status)}

                          {/* Calendar Buttons */}
                          <div className="flex items-center gap-1 border-r border-slate-200 dark:border-slate-600 pr-2 mr-1">
                            <a
                              href={calendarLinks.google}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-slate-400 hover:text-corporate-teal hover:bg-teal-50 dark:hover:bg-teal-900/30 rounded-lg transition-colors"
                              title="Add to Google Calendar"
                            >
                              <Calendar className="w-4 h-4" />
                            </a>
                            <button
                              onClick={() => calendarLinks.downloadICS()}
                              className="p-1.5 text-slate-400 hover:text-corporate-teal hover:bg-teal-50 dark:hover:bg-teal-900/30 rounded-lg transition-colors"
                              title="Download ICS file"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1">
                            {reg.status === REGISTRATION_STATUS.REGISTERED && session.isPast && (
                              <>
                                <button
                                  onClick={() => handleMarkAttended(session.id, reg.userId)}
                                  disabled={processing === `${session.id}_${reg.userId}_attended`}
                                  className="px-3 py-1.5 text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-400 dark:hover:bg-blue-800/60 rounded-lg transition-colors disabled:opacity-50"
                                >
                                  {processing === `${session.id}_${reg.userId}_attended` ? (
                                    <Loader className="w-3 h-3 animate-spin" />
                                  ) : (
                                    'Mark Attended'
                                  )}
                                </button>
                                <button
                                  onClick={() => handleNoShow(session.id, reg.userId)}
                                  disabled={!!processing}
                                  className="px-3 py-1.5 text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-400 dark:hover:bg-red-800/60 rounded-lg transition-colors disabled:opacity-50"
                                >
                                  No Show
                                </button>
                              </>
                            )}
                            
                            {reg.status === REGISTRATION_STATUS.ATTENDED && (
                              <button
                                onClick={() => handleCertify(session.id, reg.userId)}
                                disabled={processing === `${session.id}_${reg.userId}_certify`}
                                className="px-3 py-1.5 text-xs font-medium bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:hover:bg-emerald-800/60 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                              >
                                {processing === `${session.id}_${reg.userId}_certify` ? (
                                  <Loader className="w-3 h-3 animate-spin" />
                                ) : (
                                  <>
                                    <Award className="w-3 h-3" />
                                    Certify
                                  </>
                                )}
                              </button>
                            )}

                            {reg.status === REGISTRATION_STATUS.CERTIFIED && (
                              <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4" />
                                Certified
                              </span>
                            )}
                          </div>
                        </div>
                      );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

export default CoachingCertificationQueue;
