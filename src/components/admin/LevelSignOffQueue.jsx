import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  User, 
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Loader,
  Lock,
  Award,
  Users,
  GraduationCap,
  FileCheck,
  Info,
  X,
  Zap,
  BookOpen,
  Target
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
  orderBy
} from 'firebase/firestore';
import { Card } from '../ui';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../lib/firebase';
import conditioningService from '../../services/conditioningService';

// ============================================
// INFO PANEL - Explains what Level Sign-Off means
// ============================================
const SignOffInfo = ({ onClose }) => (
  <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-xl p-4 mb-4">
    <div className="flex items-start justify-between">
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">What is Level Sign-Off?</h3>
          <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
            Level Sign-Off confirms a leader has demonstrated competency at their current level and is ready to advance. 
            This is a <strong>trainer verification</strong> that certifies the leader has:
          </p>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
            <li>Completed required conditioning reps with quality debriefs</li>
            <li>Attended the associated deliberate practice session</li>
            <li>Shown consistent application of leadership skills</li>
          </ul>
          <p className="text-sm text-blue-600 dark:text-blue-400 mt-3 italic">
            Signing off unlocks the next level&apos;s content, rep types, and certification.
          </p>
        </div>
      </div>
      <button onClick={onClose} className="text-blue-400 hover:text-blue-600 p-1">
        <X className="w-4 h-4" />
      </button>
    </div>
  </div>
);

// ============================================
// LEVEL PROGRESS BUBBLES - Horizontal indicators
// ============================================
const LevelProgressBubbles = ({ levelDetails, currentLevel, isGraduated }) => (
  <div className="flex items-center gap-1.5">
    {[1, 2, 3, 4, 5].map(lvl => {
      const detail = levelDetails[lvl - 1];
      const isComplete = detail?.signedOff;
      const isCurrent = lvl === currentLevel && !isGraduated;
      const levelData = LEVELS[lvl];
      
      return (
        <div
          key={lvl}
          className={`relative w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
            isComplete
              ? 'bg-emerald-500 text-white shadow-sm'
              : isCurrent
              ? 'bg-corporate-teal text-white ring-2 ring-corporate-teal ring-offset-2 shadow-md'
              : 'bg-slate-200 dark:bg-slate-600 text-slate-400 dark:text-slate-500'
          }`}
          title={`${levelData.name}: ${isComplete ? 'Complete' : isCurrent ? 'Current' : 'Locked'}`}
        >
          {isComplete ? <Check className="w-4 h-4" /> : levelData.shortName}
        </div>
      );
    })}
  </div>
);

// Reps required per level
const LEVEL_REPS = {
  1: ['set_clear_expectations', 'deliver_reinforcing_feedback'],
  2: ['follow_up_on_work', 'lead_with_vulnerability'],
  3: ['deliver_redirecting_feedback', 'close_the_loop'],
  4: ['handle_pushback', 'hold_the_line', 'be_curious'],
  5: []
};

// ============================================
// ACCOMPLISHMENT CHECKLIST - Shows what's done/not done
// ============================================
const AccomplishmentChecklist = ({ levelNumber, repStats, sessionsAttended }) => {
  const requiredReps = LEVEL_REPS[levelNumber] || [];
  const sessionAttended = sessionsAttended?.[`action-s${levelNumber}-deliberate-practice`]?.attended;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 mt-4">
      <h4 className="font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
        <Target className="w-4 h-4 text-corporate-teal" />
        Level {levelNumber} Accomplishments
      </h4>
      
      <div className="space-y-3">
        {/* Session Attendance */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className={`w-4 h-4 ${sessionAttended ? 'text-emerald-500' : 'text-slate-400'}`} />
            <span className="text-sm text-slate-700 dark:text-slate-300">Session {levelNumber} Attendance</span>
          </div>
          {sessionAttended ? (
            <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium rounded-full">
              ✓ Attended
            </span>
          ) : (
            <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-medium rounded-full">
              Not yet
            </span>
          )}
        </div>
        
        {/* Rep Completion */}
        {requiredReps.length > 0 ? (
          requiredReps.map(repType => {
            const completed = (repStats?.[repType] || 0) > 0;
            const count = repStats?.[repType] || 0;
            const repLabel = repType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            
            return (
              <div key={repType} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className={`w-4 h-4 ${completed ? 'text-emerald-500' : 'text-slate-400'}`} />
                  <span className="text-sm text-slate-700 dark:text-slate-300">{repLabel}</span>
                </div>
                {completed ? (
                  <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium rounded-full">
                    ✓ {count} done
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 text-xs font-medium rounded-full">
                    0 reps
                  </span>
                )}
              </div>
            );
          })
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400 italic">
            No specific rep requirements for graduation level
          </p>
        )}
      </div>
    </div>
  );
};

// Level metadata - 5-level structure
const LEVELS = {
  1: { name: 'Reinforcing', shortName: 'L1', emoji: '📍', color: 'emerald', description: 'Set Clear Expectations & Reinforcing Feedback' },
  2: { name: 'One-on-One', shortName: 'L2', emoji: '🎯', color: 'blue', description: 'Follow-up & Lead with Vulnerability' },
  3: { name: 'Redirecting', shortName: 'L3', emoji: '💡', color: 'amber', description: 'Redirecting Feedback & Close the Loop' },
  4: { name: 'Readiness', shortName: 'L4', emoji: '🚀', color: 'purple', description: 'Handle Pushback & Hold the Line' },
  5: { name: 'Graduate', shortName: 'Grad', emoji: '🏆', color: 'rose', description: 'Program completion & ongoing development' }
};

// For backward compatibility
const MILESTONES = LEVELS;

const LevelSignOffQueue = () => {
  const { db, user } = useAppServices();
  const [loading, setLoading] = useState(true);
  const [cohorts, setCohorts] = useState([]);
  const [selectedCohort, setSelectedCohort] = useState('');
  const [participants, setParticipants] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [expandedUser, setExpandedUser] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [signOffSuccess, setSignOffSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'graduated'
  const [showInfo, setShowInfo] = useState(false);

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
        const milestoneProgress = userData.milestoneProgress || {};
        
        // Find current milestone (first unsigned one, or 5 if all signed)
        let currentMilestone = 1;
        let signedOffCount = 0;
        const milestoneDetails = [];
        
        for (let m = 1; m <= 5; m++) {
          const mData = milestoneProgress[`milestone_${m}`] || {};
          const isSignedOff = mData.signedOff === true;
          
          if (isSignedOff) {
            signedOffCount++;
            if (m === currentMilestone) {
              currentMilestone = m + 1;
            }
          }
          
          milestoneDetails.push({
            number: m,
            signedOff: isSignedOff,
            signedOffAt: mData.signOffApprovedAt?.toDate?.() || null,
            signedOffBy: mData.signedOffBy || null,
            completedItems: mData.completedItems || 0,
            totalItems: mData.totalItems || 10, // Default estimate
            certificateViewed: mData.certificateViewed || false
          });
        }
        
        // Cap current milestone at 5
        if (currentMilestone > 5) currentMilestone = 5;
        
        // Get incomplete actions for current milestone
        const incompleteActions = getIncompleteActionsForMilestone(currentMilestone, userData);
        
        // Get rep completion stats
        let repStats = {};
        try {
          repStats = await conditioningService.getCompletedRepCounts(db, userDoc.id);
        } catch (e) {
          console.warn('Could not fetch rep stats for', userDoc.id);
        }
        
        // Get session attendance data
        const sessionAttendance = userData.sessionAttendance || {};
        
        participantList.push({
          id: userDoc.id,
          email: userData.email || 'Unknown',
          displayName: userData.displayName || userData.email?.split('@')[0] || 'Unknown User',
          photoURL: userData.photoURL,
          currentMilestone,
          signedOffCount,
          isGraduated: signedOffCount === 5,
          milestoneDetails,
          incompleteActions,
          repStats,
          sessionAttendance,
          joinedAt: userData.createdAt?.toDate?.() || null
        });
      }
      
      // Sort: active users first (by current milestone), then graduated
      participantList.sort((a, b) => {
        if (a.isGraduated !== b.isGraduated) return a.isGraduated ? 1 : -1;
        return a.currentMilestone - b.currentMilestone;
      });
      
      setParticipants(participantList);
    } catch (error) {
      console.error('Error fetching participants:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get incomplete actions for a specific milestone
  const getIncompleteActionsForMilestone = (milestone, userData) => {
    const mData = userData.milestoneProgress?.[`milestone_${milestone}`] || {};
    const incompleteItems = [];
    
    // Check coaching requirement
    const coachingComplete = mData.coachingComplete || false;
    if (!coachingComplete) {
      incompleteItems.push({
        id: `coaching-m${milestone}`,
        label: '1:1 Coaching Session',
        type: 'coaching',
        required: true
      });
    }
    
    // Check certification view (previous milestone's cert if applicable)
    if (milestone > 1) {
      const prevMilestone = userData.milestoneProgress?.[`milestone_${milestone - 1}`] || {};
      if (prevMilestone.signedOff && !prevMilestone.certificateViewed) {
        incompleteItems.push({
          id: `cert-view-m${milestone - 1}`,
          label: `View ${MILESTONES[milestone - 1]?.name} Certificate`,
          type: 'certificate',
          required: false
        });
      }
    }
    
    // Check daily content progress - simplified check
    const contentProgress = mData.contentProgress || 0;
    if (contentProgress < 100) {
      incompleteItems.push({
        id: `content-m${milestone}`,
        label: `Weekly Content (${contentProgress}% complete)`,
        type: 'content',
        required: true
      });
    }
    
    return incompleteItems;
  };

  const handleSignOff = async (participant, milestoneNumber) => {
    if (!db || !user) return;
    
    const processingKey = `${participant.id}_m${milestoneNumber}`;
    setProcessingId(processingKey);
    
    try {
      const userRef = doc(db, 'users', participant.id);
      
      // Update milestone as signed off
      const updates = {
        [`milestoneProgress.milestone_${milestoneNumber}.signedOff`]: true,
        [`milestoneProgress.milestone_${milestoneNumber}.signOffApprovedAt`]: serverTimestamp(),
        [`milestoneProgress.milestone_${milestoneNumber}.signedOffBy`]: user.email,
        [`milestoneProgress.milestone_${milestoneNumber}.certificateGenerated`]: true,
        [`milestoneProgress.milestone_${milestoneNumber}.certificateGeneratedAt`]: serverTimestamp()
      };
      
      // Unlock next milestone if not the last one
      if (milestoneNumber < 5) {
        updates[`milestoneProgress.milestone_${milestoneNumber + 1}.unlocked`] = true;
        updates[`milestoneProgress.milestone_${milestoneNumber + 1}.unlockedAt`] = serverTimestamp();
      }
      
      // Mark as graduated if this is milestone 5
      if (milestoneNumber === 5) {
        updates['graduated'] = true;
        updates['graduatedAt'] = serverTimestamp();
      }
      
      await updateDoc(userRef, updates);
      
      // Send email notification
      try {
        const sendMilestoneEmail = httpsCallable(functions, 'sendMilestoneCompletionEmail');
        await sendMilestoneEmail({
          userId: participant.id,
          userEmail: participant.email,
          userName: participant.displayName,
          milestone: milestoneNumber,
          milestoneName: MILESTONES[milestoneNumber]?.name,
          isGraduation: milestoneNumber === 5
        });
      } catch (emailError) {
        console.warn('Failed to send milestone email (non-critical):', emailError);
      }
      
      // Show success message
      setSignOffSuccess({
        userName: participant.displayName,
        milestone: milestoneNumber,
        isGraduation: milestoneNumber === 5
      });
      
      // Refresh participants
      setTimeout(() => {
        fetchParticipants(selectedCohort);
        setSignOffSuccess(null);
      }, 2000);
      
    } catch (error) {
      console.error('Error signing off level:', error);
      alert('Failed to sign off level. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  // Filter participants
  const filteredParticipants = useMemo(() => {
    return participants.filter(p => {
      // Tab filter
      if (activeTab === 'graduated' && !p.isGraduated) return false;
      if (activeTab === 'active' && p.isGraduated) return false;
      
      // Search filter
      const matchesSearch = !searchTerm || 
        p.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Level filter
      const matchesLevel = filterLevel === 'all' || 
        p.currentMilestone === parseInt(filterLevel);
      
      return matchesSearch && matchesLevel;
    });
  }, [participants, activeTab, searchTerm, filterLevel]);

  const activeCount = participants.filter(p => !p.isGraduated).length;
  const graduatedCount = participants.filter(p => p.isGraduated).length;

  const formatDate = (date) => {
    if (!date) return 'Unknown';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  const getColorClasses = (color, variant = 'badge') => {
    const colors = {
      emerald: {
        badge: 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-300',
        button: 'bg-emerald-500 hover:bg-emerald-600 text-white'
      },
      blue: {
        badge: 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300',
        button: 'bg-blue-500 hover:bg-blue-600 text-white'
      },
      amber: {
        badge: 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-300',
        button: 'bg-amber-500 hover:bg-amber-600 text-white'
      },
      purple: {
        badge: 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/30 dark:border-purple-700 dark:text-purple-300',
        button: 'bg-purple-500 hover:bg-purple-600 text-white'
      },
      rose: {
        badge: 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-900/30 dark:border-rose-700 dark:text-rose-300',
        button: 'bg-rose-500 hover:bg-rose-600 text-white'
      }
    };
    return colors[color]?.[variant] || colors.emerald[variant];
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
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-6 h-6 text-corporate-teal" />
              Level Sign-Off
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Review leader progress and sign off on completed levels
            </p>
          </div>
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
          >
            <Info className="w-4 h-4" />
            What is this?
          </button>
        </div>
        
        {/* Info Panel */}
        {showInfo && <SignOffInfo onClose={() => setShowInfo(false)} />}

        {/* Cohort Selector */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-400" />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Cohort:</span>
          </div>
          <select
            value={selectedCohort}
            onChange={(e) => setSelectedCohort(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium focus:ring-2 focus:ring-corporate-teal min-w-[200px]"
          >
            <option value="">Select a cohort...</option>
            {cohorts.map(cohort => (
              <option key={cohort.id} value={cohort.id}>
                {cohort.name || cohort.id} ({cohort.status || 'active'})
              </option>
            ))}
          </select>
          {selectedCohort && (
            <div className="flex items-center gap-3 ml-4">
              <span className="text-sm text-slate-500">
                {activeCount} active • {graduatedCount} graduated
              </span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'active'
                ? 'bg-corporate-teal text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <User className="w-4 h-4 inline-block mr-2" />
            Active ({activeCount})
          </button>
          <button
            onClick={() => setActiveTab('graduated')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'graduated'
                ? 'bg-amber-500 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <GraduationCap className="w-4 h-4 inline-block mr-2" />
            Graduated ({graduatedCount})
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-700 border-0 rounded-lg text-sm focus:ring-2 focus:ring-corporate-teal"
            />
          </div>
          {activeTab === 'active' && (
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="px-3 py-2 bg-slate-100 dark:bg-slate-700 border-0 rounded-lg text-sm focus:ring-2 focus:ring-corporate-teal"
              >
                <option value="all">All Levels</option>
                {Object.entries(MILESTONES).map(([num, data]) => (
                  <option key={num} value={num}>
                    {data.emoji} Level {num}: {data.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {!selectedCohort ? (
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg font-medium">Select a Cohort</p>
            <p className="text-slate-400 text-sm mt-1">
              Choose a cohort above to view participants
            </p>
          </div>
        ) : filteredParticipants.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              {activeTab === 'graduated' ? (
                <GraduationCap className="w-8 h-8 text-amber-500" />
              ) : (
                <User className="w-8 h-8 text-slate-400" />
              )}
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">
              {activeTab === 'graduated' 
                ? 'No graduated participants yet' 
                : 'No active participants'}
            </p>
            <p className="text-slate-400 text-sm mt-1">
              {activeTab === 'graduated'
                ? 'Participants who complete all 5 levels will appear here'
                : 'No participants match your filters'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredParticipants.map(participant => {
              const currentMilestoneData = MILESTONES[participant.currentMilestone];
              const isExpanded = expandedUser === participant.id;
              
              return (
                <Card 
                  key={participant.id}
                  className="border border-slate-200 dark:border-slate-700 overflow-hidden"
                >
                  {/* Main Row */}
                  <div 
                    className="p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    onClick={() => setExpandedUser(isExpanded ? null : participant.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className="w-12 h-12 bg-corporate-navy rounded-full flex items-center justify-center overflow-hidden">
                          {participant.photoURL ? (
                            <img src={participant.photoURL} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-white font-bold text-lg">
                              {participant.displayName.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        
                        {/* User Info */}
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-white">
                            {participant.displayName}
                          </h3>
                          <p className="text-sm text-slate-500">{participant.email}</p>
                        </div>
                      </div>
                      
                      {/* Progress & Actions */}
                      <div className="flex items-center gap-4">
                        {participant.isGraduated ? (
                          <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                            <GraduationCap className="w-5 h-5 text-amber-600" />
                            <span className="font-semibold text-amber-700 dark:text-amber-300">Graduated</span>
                          </div>
                        ) : (
                          <>
                            {/* Level Progress Bubbles */}
                            <LevelProgressBubbles 
                              levelDetails={participant.milestoneDetails}
                              currentLevel={participant.currentMilestone}
                              isGraduated={participant.isGraduated}
                            />
                            
                            {/* Current Level Badge */}
                            <div className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${getColorClasses(currentMilestoneData?.color)}`}>
                              <span>{currentMilestoneData?.emoji}</span>
                              <span>{currentMilestoneData?.name}</span>
                            </div>
                          </>
                        )}
                        
                        {/* Expand/Collapse */}
                        <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4">
                      {/* Milestone Timeline */}
                      <div className="grid grid-cols-5 gap-3 mb-6">
                        {participant.milestoneDetails.map((mDetail, idx) => {
                          const mData = MILESTONES[idx + 1];
                          const isCurrent = idx + 1 === participant.currentMilestone && !participant.isGraduated;
                          const processingKey = `${participant.id}_m${idx + 1}`;
                          
                          return (
                            <div
                              key={idx}
                              className={`p-3 rounded-lg border ${
                                mDetail.signedOff
                                  ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700'
                                  : isCurrent
                                  ? 'bg-white dark:bg-slate-700 border-corporate-teal shadow-sm'
                                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-600 opacity-60'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">{mData.emoji}</span>
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                  {mData.name}
                                </span>
                              </div>
                              
                              {mDetail.signedOff ? (
                                <div className="text-xs text-emerald-600 dark:text-emerald-400">
                                  <CheckCircle2 className="w-3 h-3 inline-block mr-1" />
                                  Signed off {formatDate(mDetail.signedOffAt)}
                                </div>
                              ) : isCurrent ? (
                                <div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSignOff(participant, idx + 1);
                                    }}
                                    disabled={processingId === processingKey}
                                    className={`w-full mt-2 px-3 py-2 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-1 ${getColorClasses(mData.color, 'button')} disabled:opacity-50`}
                                  >
                                    {processingId === processingKey ? (
                                      <Loader className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <>
                                        <FileCheck className="w-4 h-4" />
                                        Sign Off
                                      </>
                                    )}
                                  </button>
                                </div>
                              ) : (
                                <div className="text-xs text-slate-400 flex items-center gap-1">
                                  <Lock className="w-3 h-3" />
                                  Locked
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Incomplete Actions for Current Milestone */}
                      {!participant.isGraduated && participant.incompleteActions.length > 0 && (
                        <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700">
                          <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-2 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            Pending Items for {MILESTONES[participant.currentMilestone]?.name}
                          </h4>
                          <ul className="space-y-1">
                            {participant.incompleteActions.map(action => (
                              <li key={action.id} className="text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
                                <Clock className="w-3 h-3" />
                                {action.label}
                                {!action.required && <span className="text-xs opacity-70">(optional)</span>}
                              </li>
                            ))}
                          </ul>
                          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 italic">
                            You can still sign off if the leader has demonstrated competency
                          </p>
                        </div>
                      )}
                      
                      {/* Accomplishment Checklist - Shows reps/sessions completed */}
                      {!participant.isGraduated && (
                        <AccomplishmentChecklist 
                          levelNumber={participant.currentMilestone}
                          repStats={participant.repStats}
                          sessionsAttended={participant.sessionAttendance}
                        />
                      )}
                      
                      {/* Sign-off History */}
                      {participant.milestoneDetails.some(m => m.signedOff) && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                            Sign-off History
                          </h4>
                          <div className="space-y-1">
                            {participant.milestoneDetails.filter(m => m.signedOff).map((mDetail) => (
                              <div key={mDetail.number} className="text-sm text-slate-500 flex items-center gap-2">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                <span className="font-medium">{MILESTONES[mDetail.number]?.name}</span>
                                <span>— {formatDate(mDetail.signedOffAt)} by {mDetail.signedOffBy}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Success Toast */}
      {signOffSuccess && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4">
          <div className="bg-emerald-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3">
            {signOffSuccess.isGraduation ? (
              <GraduationCap className="w-6 h-6" />
            ) : (
              <CheckCircle2 className="w-6 h-6" />
            )}
            <div>
              <p className="font-semibold">
                {signOffSuccess.isGraduation ? '🎉 Graduation!' : 'Level Signed Off!'}
              </p>
              <p className="text-sm text-emerald-100">
                {signOffSuccess.userName} — {MILESTONES[signOffSuccess.milestone]?.name}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LevelSignOffQueue;
