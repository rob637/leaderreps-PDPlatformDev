import { useState, useEffect, useCallback } from 'react';
import {
  Users, Plus, Rocket, Loader2, Check, AlertCircle,
  Phone, Mail, ChevronRight, UserPlus, RefreshCw, Smartphone,
  FastForward, MessageCircle, ChevronDown, ChevronUp,
} from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { functions, db, auth } from '../../config/firebase.js';
import collections from '../../config/collections.js';
import { useNavigation } from '../../providers/NavigationProvider.jsx';
import { SCREENS } from '../../config/navigation.js';

export default function AdminScreen() {
  const { navigate } = useNavigation();
  const [cohorts, setCohorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [message, setMessage] = useState(null);

  // Forms
  const [showCreateCohort, setShowCreateCohort] = useState(false);
  const [showAddMember, setShowAddMember] = useState(null); // cohortId
  const [cohortForm, setCohortForm] = useState({ name: '', startDate: '', weekCount: 6 });
  const [memberForm, setMemberForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', engagementLevel: 2,
  });

  const loadCohorts = useCallback(async () => {
    setLoading(true);
    try {
      const ref = collection(db, collections.cohorts || 'll-cohorts');
      const snap = await getDocs(query(ref, orderBy('createdAt', 'desc')));
      const list = [];
      for (const doc of snap.docs) {
        const data = doc.data();
        // Load members
        const membersSnap = await getDocs(
          collection(db, `${collections.cohorts || 'll-cohorts'}/${doc.id}/members`)
        );
        const members = membersSnap.docs.map((m) => ({ id: m.id, ...m.data() }));
        list.push({ id: doc.id, ...data, members });
      }
      setCohorts(list);
    } catch (err) {
      showMessage('Failed to load cohorts: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCohorts();
  }, [loadCohorts]);

  function showMessage(text, type = 'success') {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  }

  async function handleCreateCohort(e) {
    e.preventDefault();
    if (!cohortForm.name || !cohortForm.startDate) return;
    setActionLoading('create');
    try {
      const fn = httpsCallable(functions, 'labSetupCohort');
      await fn({
        name: cohortForm.name,
        startDate: cohortForm.startDate,
        weekCount: parseInt(cohortForm.weekCount) || 6,
        facilitatorIds: auth.currentUser ? [auth.currentUser.uid] : [],
      });
      showMessage(`Cohort "${cohortForm.name}" created!`);
      setCohortForm({ name: '', startDate: '', weekCount: 6 });
      setShowCreateCohort(false);
      await loadCohorts();
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleAddMember(e) {
    e.preventDefault();
    if (!memberForm.firstName || !memberForm.phone) return;
    setActionLoading('addMember');
    try {
      // Auto-format phone to E.164
      let phone = memberForm.phone.replace(/[\s\-().]/g, '');
      if (!phone.startsWith('+')) {
        phone = phone.startsWith('1') ? `+${phone}` : `+1${phone}`;
      }

      const fn = httpsCallable(functions, 'labAddParticipant');
      await fn({
        cohortId: showAddMember,
        firstName: memberForm.firstName,
        lastName: memberForm.lastName,
        email: memberForm.email,
        phone,
        engagementLevel: parseInt(memberForm.engagementLevel) || 2,
      });
      showMessage(`${memberForm.firstName} ${memberForm.lastName} added and welcome SMS sent!`);
      setMemberForm({ firstName: '', lastName: '', email: '', phone: '', engagementLevel: 2 });
      setShowAddMember(null);
      await loadCohorts();
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleStartCohort(cohortId, cohortName) {
    if (!window.confirm(`Start "${cohortName}" now? This will send kickoff texts to all enrolled participants.`)) {
      return;
    }
    setActionLoading(`start-${cohortId}`);
    try {
      const fn = httpsCallable(functions, 'labStartCohort');
      await fn({ cohortId });
      showMessage(`"${cohortName}" is live! Kickoff texts sent.`);
      await loadCohorts();
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleUnlockApp(memberId, memberName) {
    setActionLoading(`unlock-${memberId}`);
    try {
      const fn = httpsCallable(functions, 'labUnlockApp');
      const result = await fn({ memberId });
      showMessage(`App unlock link sent to ${memberName}! Link expires ${new Date(result.data.expiresAt).toLocaleDateString()}.`);
      await loadCohorts();
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleAdvanceWeek(memberId, memberName, targetWeek, cohortId) {
    setActionLoading(`advance-${memberId}`);
    try {
      const fn = httpsCallable(functions, 'labTestAdvanceWeek');
      const result = await fn({ memberId, targetWeek, completeOnboarding: true, cohortId });
      showMessage(`${memberName}: Week ${result.data.previousWeek} → ${result.data.newWeek}`);
      await loadCohorts();
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleTriggerOnboarding(memberId, memberName) {
    setActionLoading(`onboard-${memberId}`);
    try {
      const fn = httpsCallable(functions, 'labTestTriggerOnboarding');
      const result = await fn({ memberId });
      if (result.data.alreadyOnboarded) {
        showMessage(`${memberName} already completed onboarding.`);
      } else if (result.data.alreadyExists) {
        showMessage(`${memberName} already has an onboarding conversation.`);
      } else {
        showMessage(`Onboarding conversation created for ${memberName}! They can now chat via the app.`);
      }
      await loadCohorts();
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-lab-teal" size={24} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 px-4 pt-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-lab-navy">Manage</h1>
        <button
          onClick={() => setShowCreateCohort(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-lab-teal text-white rounded-xl text-sm font-medium hover:bg-lab-teal/90 transition-colors"
        >
          <Plus size={16} />
          New Cohort
        </button>
      </div>

      {/* Status Message */}
      {message && (
        <div className={`mb-4 p-3 rounded-xl text-sm flex items-center gap-2 ${
          message.type === 'error'
            ? 'bg-red-50 text-red-700 border border-red-200'
            : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {message.type === 'error' ? <AlertCircle size={16} /> : <Check size={16} />}
          {message.text}
        </div>
      )}

      {/* Create Cohort Form */}
      {showCreateCohort && (
        <div className="glass-card p-5 mb-4">
          <h3 className="font-semibold text-lab-navy mb-4">Create New Cohort</h3>
          <form onSubmit={handleCreateCohort} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">Cohort Name</label>
              <input
                type="text"
                value={cohortForm.name}
                onChange={(e) => setCohortForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g., Spring 2026 Cohort"
                className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-lab-teal"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">Start Date</label>
              <input
                type="date"
                value={cohortForm.startDate}
                onChange={(e) => setCohortForm((p) => ({ ...p, startDate: e.target.value }))}
                className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-lab-teal"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">Duration (weeks)</label>
              <input
                type="number"
                value={cohortForm.weekCount}
                onChange={(e) => setCohortForm((p) => ({ ...p, weekCount: e.target.value }))}
                min="1"
                max="12"
                className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-lab-teal"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={actionLoading === 'create'}
                className="flex-1 px-4 py-2.5 bg-lab-teal text-white rounded-xl text-sm font-medium hover:bg-lab-teal/90 disabled:opacity-50"
              >
                {actionLoading === 'create' ? 'Creating...' : 'Create Cohort'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateCohort(false)}
                className="px-4 py-2.5 bg-stone-100 text-stone-600 rounded-xl text-sm font-medium hover:bg-stone-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Member Form */}
      {showAddMember && (
        <div className="glass-card p-5 mb-4">
          <h3 className="font-semibold text-lab-navy mb-4">Add Participant</h3>
          <form onSubmit={handleAddMember} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">First Name</label>
                <input
                  type="text"
                  value={memberForm.firstName}
                  onChange={(e) => setMemberForm((p) => ({ ...p, firstName: e.target.value }))}
                  placeholder="Rob"
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-lab-teal"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">Last Name</label>
                <input
                  type="text"
                  value={memberForm.lastName}
                  onChange={(e) => setMemberForm((p) => ({ ...p, lastName: e.target.value }))}
                  placeholder="Miller"
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-lab-teal"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">
                <Phone size={12} className="inline mr-1" />Phone (required for SMS)
              </label>
              <input
                type="tel"
                value={memberForm.phone}
                onChange={(e) => setMemberForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="+1 703-623-8835"
                className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-lab-teal"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">
                <Mail size={12} className="inline mr-1" />Email (optional)
              </label>
              <input
                type="email"
                value={memberForm.email}
                onChange={(e) => setMemberForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="rob@company.com"
                className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-lab-teal"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">
                Text Frequency
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[{ value: 1, label: 'Light', desc: '2-3/wk' }, { value: 2, label: 'Medium', desc: '~5/wk' }, { value: 3, label: 'Heavy', desc: '~10/wk' }].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setMemberForm((p) => ({ ...p, engagementLevel: opt.value }))}
                    className={`px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${
                      memberForm.engagementLevel === opt.value
                        ? 'bg-lab-teal text-white border-lab-teal'
                        : 'bg-white text-stone-600 border-stone-200 hover:border-lab-teal'
                    }`}
                  >
                    {opt.label}
                    <span className="block text-xs opacity-75">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={actionLoading === 'addMember'}
                className="flex-1 px-4 py-2.5 bg-lab-teal text-white rounded-xl text-sm font-medium hover:bg-lab-teal/90 disabled:opacity-50"
              >
                {actionLoading === 'addMember' ? 'Adding...' : 'Add & Send Welcome SMS'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddMember(null)}
                className="px-4 py-2.5 bg-stone-100 text-stone-600 rounded-xl text-sm font-medium hover:bg-stone-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Cohort List */}
      {cohorts.length === 0 ? (
        <div className="text-center py-16 text-stone-400">
          <Users className="mx-auto mb-3 text-stone-300" size={40} />
          <p className="font-medium text-stone-500 mb-1">No cohorts yet</p>
          <p className="text-sm">Create your first cohort to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {cohorts.map((cohort) => (
            <CohortCard
              key={cohort.id}
              cohort={cohort}
              onAddMember={() => setShowAddMember(cohort.id)}
              onStart={() => handleStartCohort(cohort.id, cohort.name)}
              onViewWarRoom={() => navigate(SCREENS.WAR_ROOM, { cohortId: cohort.id })}
              onUnlockApp={handleUnlockApp}
              onAdvanceWeek={handleAdvanceWeek}
              onTriggerOnboarding={handleTriggerOnboarding}
              actionLoading={actionLoading}
            />
          ))}
        </div>
      )}

      {/* Refresh */}
      <button
        onClick={loadCohorts}
        className="w-full mt-6 flex items-center justify-center gap-2 py-2 text-sm text-stone-400 hover:text-stone-600 transition-colors"
      >
        <RefreshCw size={14} />
        Refresh
      </button>
    </div>
  );
}

function CohortCard({ cohort, onAddMember, onStart, onViewWarRoom, onUnlockApp, onAdvanceWeek, onTriggerOnboarding, actionLoading }) {
  const [expandedMember, setExpandedMember] = useState(null);
  const isActive = cohort.isActive || cohort.phase === 'active';
  const isPrep = cohort.phase === 'prep' || (!cohort.phase && !cohort.isActive);
  const isPost = cohort.phase === 'post';

  const statusLabel = isActive ? 'Active' : isPost ? 'Completed' : 'Prep';
  const statusColor = isActive
    ? 'bg-green-100 text-green-700'
    : isPost
      ? 'bg-stone-100 text-stone-500'
      : 'bg-amber-100 text-amber-700';

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="p-5 pb-3">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-lab-navy text-lg">{cohort.name || 'Untitled Cohort'}</h3>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor}`}>
            {statusLabel}
          </span>
        </div>
        <p className="text-xs text-stone-400">
          {cohort.startDate
            ? `Starts ${cohort.startDate.toDate ? cohort.startDate.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : cohort.startDate}`
            : 'No start date'}
          {' · '}
          {cohort.weekCount || 6} weeks
          {cohort.currentWeek ? ` · Week ${cohort.currentWeek}` : ''}
        </p>
      </div>

      {/* Members */}
      <div className="px-5 pb-3">
        <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">
          {cohort.members?.length || 0} Participant{cohort.members?.length === 1 ? '' : 's'}
        </p>
        {cohort.members?.length > 0 && (
          <div className="space-y-1">
            {cohort.members.map((m) => {
              const memberName = m.name || m.firstName || m.id;
              const isExpanded = expandedMember === m.id;
              return (
                <div key={m.id} className="border border-stone-100 rounded-lg">
                  <div className="flex items-center justify-between text-sm px-2 py-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          m.status === 'active' || m.onboardingComplete
                            ? 'bg-green-400'
                            : 'bg-amber-400'
                        }`}
                        role="img"
                        aria-label={m.onboardingComplete ? 'Status: Active' : 'Status: Pending'}
                      />
                      <span className="text-stone-700">{memberName}</span>
                      <span className="text-xs text-stone-400">
                        {m.appUnlocked ? 'app' : m.onboardingComplete ? 'onboarded' : m.status || 'enrolled'}
                        {m.currentWeek != null ? ` · wk ${m.currentWeek}` : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {!m.appUnlocked && (
                        <button
                          onClick={() => onUnlockApp(m.id, memberName)}
                          disabled={actionLoading === `unlock-${m.id}`}
                          className="flex items-center gap-1 px-2 py-1 text-xs text-lab-teal hover:bg-lab-teal/10 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {actionLoading === `unlock-${m.id}` ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Smartphone size={12} />
                          )}
                          Unlock
                        </button>
                      )}
                      {m.appUnlocked && (
                        <span className="flex items-center gap-1 text-xs text-green-500">
                          <Smartphone size={12} />
                        </span>
                      )}
                      <button
                        onClick={() => setExpandedMember(isExpanded ? null : m.id)}
                        className="p-1 text-stone-400 hover:text-stone-600 rounded transition-colors"
                        title="Test controls"
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="px-3 pb-2 pt-1 border-t border-stone-100 bg-stone-50/50 rounded-b-lg">
                      <p className="text-[10px] uppercase text-stone-400 font-medium tracking-wider mb-1.5">Test Controls</p>
                      <div className="flex flex-wrap gap-1.5">
                        {!m.onboardingComplete && (
                          <button
                            onClick={() => onTriggerOnboarding(m.id, memberName)}
                            disabled={!!actionLoading}
                            className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs hover:bg-amber-100 disabled:opacity-50 transition-colors"
                          >
                            {actionLoading === `onboard-${m.id}` ? (
                              <Loader2 size={11} className="animate-spin" />
                            ) : (
                              <MessageCircle size={11} />
                            )}
                            Start Onboarding
                          </button>
                        )}
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((wk) => (
                          <button
                            key={wk}
                            onClick={() => onAdvanceWeek(m.id, memberName, wk, cohort.id)}
                            disabled={!!actionLoading || m.currentWeek === wk}
                            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs border transition-colors disabled:opacity-50 ${
                              m.currentWeek === wk
                                ? 'bg-lab-teal/10 text-lab-teal border-lab-teal/30 font-medium'
                                : wk > 5
                                  ? 'bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100'
                                  : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                            }`}
                          >
                            {actionLoading === `advance-${m.id}` ? (
                              <Loader2 size={11} className="animate-spin" />
                            ) : (
                              <FastForward size={11} />
                            )}
                            {wk > 5 ? `A${wk - 5}` : `Wk ${wk}`}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="border-t border-stone-100 px-5 py-3 flex gap-2">
        {isPrep && (
          <>
            <button
              onClick={onAddMember}
              className="flex items-center gap-1.5 px-3 py-2 bg-stone-100 text-stone-700 rounded-lg text-xs font-medium hover:bg-stone-200 transition-colors"
            >
              <UserPlus size={14} />
              Add Participant
            </button>
            <button
              onClick={onStart}
              disabled={actionLoading === `start-${cohort.id}` || !cohort.members?.length}
              className="flex items-center gap-1.5 px-3 py-2 bg-lab-teal text-white rounded-lg text-xs font-medium hover:bg-lab-teal/90 disabled:opacity-50 transition-colors"
            >
              {actionLoading === `start-${cohort.id}` ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Rocket size={14} />
              )}
              Start Program
            </button>
          </>
        )}
        {isActive && (
          <>
            <button
              onClick={onAddMember}
              className="flex items-center gap-1.5 px-3 py-2 bg-stone-100 text-stone-700 rounded-lg text-xs font-medium hover:bg-stone-200 transition-colors"
            >
              <UserPlus size={14} />
              Add Participant
            </button>
            <button
              onClick={onViewWarRoom}
              className="flex items-center gap-1.5 px-3 py-2 bg-lab-navy text-white rounded-lg text-xs font-medium hover:bg-lab-navy/90 transition-colors"
            >
              War Room
              <ChevronRight size={14} />
            </button>
          </>
        )}
        {isPost && (
          <button
            onClick={onViewWarRoom}
            className="flex items-center gap-1.5 px-3 py-2 bg-stone-100 text-stone-700 rounded-lg text-xs font-medium hover:bg-stone-200 transition-colors"
          >
            View Results
            <ChevronRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
