// src/components/admin/SessionAttendanceQueue.jsx
// Facilitator tool for marking session attendance (Deliberate Practice sessions)
// This handles attendance verification for live sessions that only facilitators can confirm

import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  User, 
  Users,
  Check,
  ChevronDown,
  ChevronUp,
  Search,
  Loader,
  Calendar,
  BookOpen
} from 'lucide-react';
import { useAppServices } from '../../services/useAppServices';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  serverTimestamp,
  query,
  where,
  orderBy,
  getDoc
} from 'firebase/firestore';
import { Card } from '../ui';

// Session definitions - which sessions require facilitator verification
// Sessions unlock specific rep types when attendance is marked:
// Session 1 → SCE, DRF | Session 2 → FUW, LWV | Session 3 → RED, CTL | Session 4 → HPB, HTL, BEC | Session 5 → Ascent
const FACILITATOR_SESSIONS = {
  1: {
    id: 'action-s1-deliberate-practice',
    name: 'Session 1: Deliberate Practice',
    milestone: 1,
    description: 'First live deliberate practice session',
    unlocksReps: ['Set Clear Expectations', 'Deliver Reinforcing Feedback']
  },
  2: {
    id: 'action-s2-deliberate-practice',
    name: 'Session 2: 1:1 Coaching',
    milestone: 2,
    description: '1:1 Coaching Session attendance',
    unlocksReps: ['Follow-up on Work', 'Lead with Vulnerability']
  },
  3: {
    id: 'action-s3-deliberate-practice',
    name: 'Session 3: Open Gym Redirecting Feedback',
    milestone: 3,
    description: 'Open gym practice session',
    unlocksReps: ['Deliver Redirecting Feedback', 'Close the Loop']
  },
  4: {
    id: 'action-s4-deliberate-practice',
    name: 'Session 4: Open Gym Handling Pushback',
    milestone: 4,
    description: 'Open gym practice session',
    unlocksReps: ['Handle Pushback', 'Hold the Line', 'Be Curious']
  },
  5: {
    id: 'action-s5-deliberate-practice',
    name: 'Session 5: Graduation',
    milestone: 5,
    description: 'Graduation session - unlocks Ascent phase',
    unlocksReps: null // Unlocks Ascent, not specific reps
  }
};

const SessionAttendanceQueue = () => {
  const { db, user } = useAppServices();
  const [loading, setLoading] = useState(true);
  const [cohorts, setCohorts] = useState([]);
  const [selectedCohort, setSelectedCohort] = useState('');
  const [participants, setParticipants] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSession, setFilterSession] = useState('all');
  const [expandedUser, setExpandedUser] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Fetch cohorts on mount
  useEffect(() => {
    fetchCohorts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db]);

  // Fetch participants when cohort changes
  useEffect(() => {
    if (selectedCohort) {
      fetchParticipants(selectedCohort);
    } else {
      setParticipants([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCohort]);

  const fetchCohorts = async () => {
    if (!db) return;
    
    try {
      const cohortsRef = collection(db, 'cohorts');
      const q = query(cohortsRef, orderBy('startDate', 'desc'));
      const snapshot = await getDocs(q);
      
      const cohortList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setCohorts(cohortList);
      
      // Auto-select first active cohort
      const activeCohort = cohortList.find(c => c.status === 'active') || cohortList[0];
      if (activeCohort) {
        setSelectedCohort(activeCohort.id);
      }
    } catch (error) {
      console.error('Error fetching cohorts:', error);
    }
  };

  const fetchParticipants = async (cohortId) => {
    if (!db) return;
    setLoading(true);
    
    try {
      // Fetch all users in this cohort
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('cohortId', '==', cohortId));
      const snapshot = await getDocs(q);
      
      const participantList = [];
      
      for (const userDoc of snapshot.docs) {
        const userData = userDoc.data();
        const sessionAttendance = userData.sessionAttendance || {};
        const milestoneProgress = userData.milestoneProgress || {};
        
        // Build session status for each facilitator session
        const sessions = [];
        for (const [sessionNum, sessionDef] of Object.entries(FACILITATOR_SESSIONS)) {
          const attended = sessionAttendance[sessionDef.id]?.attended === true;
          const markedAt = sessionAttendance[sessionDef.id]?.markedAt?.toDate?.() || null;
          const markedBy = sessionAttendance[sessionDef.id]?.markedBy || null;
          
          sessions.push({
            sessionNumber: parseInt(sessionNum),
            ...sessionDef,
            attended,
            markedAt,
            markedBy
          });
        }
        
        // Find current milestone
        let currentMilestone = 1;
        for (let m = 1; m <= 5; m++) {
          const mData = milestoneProgress[`milestone_${m}`] || {};
          if (mData.signedOff === true) {
            currentMilestone = m + 1;
          }
        }
        if (currentMilestone > 5) currentMilestone = 5;
        
        const attendedCount = sessions.filter(s => s.attended).length;
        
        participantList.push({
          id: userDoc.id,
          email: userData.email || 'Unknown',
          displayName: userData.displayName || userData.email?.split('@')[0] || 'Unknown User',
          photoURL: userData.photoURL,
          currentMilestone,
          sessions,
          attendedCount,
          joinedAt: userData.createdAt?.toDate?.() || null
        });
      }
      
      // Sort by current milestone, then by name
      participantList.sort((a, b) => {
        if (a.currentMilestone !== b.currentMilestone) {
          return a.currentMilestone - b.currentMilestone;
        }
        return a.displayName.localeCompare(b.displayName);
      });
      
      setParticipants(participantList);
    } catch (error) {
      console.error('Error fetching participants:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark attendance for a participant
  const handleMarkAttendance = async (participantId, sessionId, attended) => {
    if (!db || !user) return;
    
    setProcessingId(`${participantId}-${sessionId}`);
    
    try {
      const userRef = doc(db, 'users', participantId);
      
      // Update session attendance
      await updateDoc(userRef, {
        [`sessionAttendance.${sessionId}`]: {
          attended,
          markedAt: serverTimestamp(),
          markedBy: user.email || user.uid
        }
      });
      
      // Show success message
      const participant = participants.find(p => p.id === participantId);
      const session = Object.values(FACILITATOR_SESSIONS).find(s => s.id === sessionId);
      
      setSuccessMessage({
        userName: participant?.displayName,
        sessionName: session?.name,
        attended
      });
      
      // Refresh participants
      setTimeout(() => {
        fetchParticipants(selectedCohort);
        setSuccessMessage(null);
      }, 2000);
      
    } catch (error) {
      console.error('Error marking attendance:', error);
      alert('Failed to update attendance. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  // Filter participants
  const filteredParticipants = useMemo(() => {
    return participants.filter(p => {
      // Search filter
      const matchesSearch = !searchTerm || 
        p.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Session filter - show users missing attendance for this session
      let matchesSession = true;
      if (filterSession !== 'all') {
        const sessionNum = parseInt(filterSession);
        const session = p.sessions.find(s => s.sessionNumber === sessionNum);
        // Show users who haven't attended this session yet
        matchesSession = session && !session.attended;
      }
      
      return matchesSearch && matchesSession;
    });
  }, [participants, searchTerm, filterSession]);

  const formatDate = (date) => {
    if (!date) return '';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(date);
  };

  // Participant row component
  const ParticipantRow = ({ participant }) => {
    const isExpanded = expandedUser === participant.id;
    
    return (
      <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
        {/* Header row */}
        <button
          onClick={() => setExpandedUser(isExpanded ? null : participant.id)}
          className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            {participant.photoURL ? (
              <img 
                src={participant.photoURL} 
                alt="" 
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-corporate-teal/10 flex items-center justify-center">
                <User className="w-5 h-5 text-corporate-teal" />
              </div>
            )}
            <div>
              <div className="font-medium text-slate-800 dark:text-white">
                {participant.displayName}
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                {participant.email}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Attendance summary */}
            <div className="text-sm text-slate-600 dark:text-slate-400">
              <span className="font-medium text-corporate-teal">{participant.attendedCount}</span>/5 sessions
            </div>
            
            {/* Current milestone badge */}
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
              M{participant.currentMilestone}
            </span>
            
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </div>
        </button>
        
        {/* Expanded content - session list */}
        {isExpanded && (
          <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4">
            <div className="space-y-3">
              {participant.sessions.map((session) => {
                const isProcessing = processingId === `${participant.id}-${session.id}`;
                const isCurrentMilestone = session.milestone === participant.currentMilestone;
                
                return (
                  <div 
                    key={session.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      session.attended 
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                        : isCurrentMilestone
                          ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {session.attended ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <Clock className="w-5 h-5 text-slate-400" />
                      )}
                      <div>
                        <div className="font-medium text-slate-800 dark:text-white text-sm">
                          {session.name}
                        </div>
                        {session.attended && session.markedAt && (
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            Marked {formatDate(session.markedAt)} by {session.markedBy}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {session.attended ? (
                        <button
                          onClick={() => handleMarkAttendance(participant.id, session.id, false)}
                          disabled={isProcessing}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
                        >
                          {isProcessing ? (
                            <Loader className="w-4 h-4 animate-spin" />
                          ) : (
                            'Undo'
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleMarkAttendance(participant.id, session.id, true)}
                          disabled={isProcessing}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-corporate-teal text-white hover:bg-corporate-teal/90 disabled:opacity-50 transition-colors flex items-center gap-1"
                        >
                          {isProcessing ? (
                            <Loader className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              Mark Attended
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading && !participants.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-corporate-teal" />
        <span className="ml-3 text-slate-500">Loading participants...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-corporate-teal" />
            Session Attendance
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Mark attendance for Deliberate Practice and Coaching sessions
          </p>
        </div>
      </div>
      
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
          <span className="text-green-700 dark:text-green-300">
            {successMessage.attended 
              ? `Marked ${successMessage.userName} as attended for ${successMessage.sessionName}`
              : `Removed attendance for ${successMessage.userName} from ${successMessage.sessionName}`
            }
          </span>
        </div>
      )}
      
      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Cohort selector */}
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-500" />
            <select
              value={selectedCohort}
              onChange={(e) => setSelectedCohort(e.target.value)}
              className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
            >
              <option value="">Select Cohort</option>
              {cohorts.map(cohort => (
                <option key={cohort.id} value={cohort.id}>
                  {cohort.name || cohort.id} {cohort.status === 'active' && '(Active)'}
                </option>
              ))}
            </select>
          </div>
          
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder:text-slate-400"
            />
          </div>
          
          {/* Session filter */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <select
              value={filterSession}
              onChange={(e) => setFilterSession(e.target.value)}
              className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
            >
              <option value="all">All Sessions</option>
              {Object.entries(FACILITATOR_SESSIONS).map(([num, session]) => (
                <option key={num} value={num}>
                  Missing: Session {num}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Stats summary */}
        {participants.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-wrap gap-4 text-sm">
            <span className="text-slate-600 dark:text-slate-400">
              <span className="font-medium text-slate-800 dark:text-white">{participants.length}</span> participants
            </span>
            {Object.entries(FACILITATOR_SESSIONS).map(([num, session]) => {
              const attendedCount = participants.filter(p => 
                p.sessions.find(s => s.sessionNumber === parseInt(num))?.attended
              ).length;
              return (
                <span key={num} className="text-slate-600 dark:text-slate-400">
                  S{num}: <span className="font-medium text-corporate-teal">{attendedCount}</span>/{participants.length}
                </span>
              );
            })}
          </div>
        )}
      </Card>
      
      {/* Participant list */}
      {!selectedCohort ? (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
          Select a cohort to view participants
        </div>
      ) : filteredParticipants.length === 0 ? (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
          {participants.length === 0 
            ? 'No participants in this cohort'
            : 'No participants match your filters'
          }
        </div>
      ) : (
        <div className="space-y-3">
          {filteredParticipants.map(participant => (
            <ParticipantRow key={participant.id} participant={participant} />
          ))}
        </div>
      )}
    </div>
  );
};

export default SessionAttendanceQueue;
