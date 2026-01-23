import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth, useProgress } from '../App';

export default function ProfileScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { progress, updateProgress } = useProgress();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(progress?.profile?.name || '');
  const [saving, setSaving] = useState(false);

  const handleSignOut = async () => {
    await signOut(auth);
    navigate('/auth');
  };

  const handleSave = async () => {
    setSaving(true);
    await updateProgress({
      profile: { ...progress?.profile, name },
    });
    setSaving(false);
    setIsEditing(false);
  };

  const roleLabels = {
    team_lead: 'Team Lead',
    manager: 'Manager',
    director: 'Director/VP',
    executive: 'Executive',
    aspiring: 'Aspiring Leader',
    entrepreneur: 'Entrepreneur/Founder',
  };

  const challengeLabels = {
    confidence: 'Building Confidence',
    communication: 'Communication',
    difficult_people: 'Difficult Conversations',
    time: 'Time & Priorities',
    delegation: 'Delegation',
    influence: 'Influence',
  };

  return (
    <div className="min-h-screen bg-reppy-cream safe-area-top safe-area-bottom">
      {/* Header */}
      <div className="bg-gradient-to-br from-reppy-teal to-reppy-navy px-6 pt-6 pb-16 text-white">
        {/* LeaderReps Logo */}
        <div className="flex items-center justify-center mb-4">
          <img 
            src="/leaderreps-logo.svg" 
            alt="LeaderReps" 
            className="h-5 opacity-90"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
        </div>
        
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/')}
            className="p-2 -ml-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold">Profile</h1>
        </div>

        {/* Avatar and name */}
        <div className="text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">
              {progress?.profile?.name?.[0]?.toUpperCase() || '👤'}
            </span>
          </div>
          {isEditing ? (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white/20 text-white text-center text-xl font-semibold rounded-lg px-4 py-2 w-full max-w-xs mx-auto placeholder:text-white/50"
              placeholder="Your name"
              autoFocus
            />
          ) : (
            <h2 className="text-xl font-semibold">
              {progress?.profile?.name || 'Leader'}
            </h2>
          )}
          <p className="text-white/70 text-sm mt-1">{user?.email}</p>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 -mt-8 pb-24">
        {/* Edit/Save button */}
        <div className="flex justify-end mb-4">
          {isEditing ? (
            <div className="flex gap-2">
              <button
                onClick={() => { setIsEditing(false); setName(progress?.profile?.name || ''); }}
                className="px-4 py-2 text-sm text-reppy-navy/60"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-reppy-teal text-white text-sm font-medium rounded-lg"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-white text-reppy-teal text-sm font-medium rounded-lg shadow-sm"
            >
              Edit Profile
            </button>
          )}
        </div>

        {/* Profile info */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h3 className="font-semibold text-reppy-navy mb-4">About You</h3>
          
          <div className="space-y-4">
            <div>
              <p className="text-xs text-reppy-navy/60 mb-1">Role</p>
              <p className="text-reppy-navy">
                {roleLabels[progress?.profile?.role] || 'Not set'}
              </p>
            </div>
            
            <div>
              <p className="text-xs text-reppy-navy/60 mb-1">Current Challenge</p>
              <p className="text-reppy-navy">
                {challengeLabels[progress?.profile?.challenge] || 'Not set'}
              </p>
            </div>
            
            <div>
              <p className="text-xs text-reppy-navy/60 mb-1">Leadership Goal</p>
              <p className="text-reppy-navy">
                {progress?.profile?.goal || 'Not set'}
              </p>
            </div>
            
            <div>
              <p className="text-xs text-reppy-navy/60 mb-1">Daily Commitment</p>
              <p className="text-reppy-navy">
                {progress?.profile?.commitment ? `${progress.profile.commitment} minutes` : 'Not set'}
              </p>
            </div>
          </div>
        </div>

        {/* Stats summary */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h3 className="font-semibold text-reppy-navy mb-4">Your Journey</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-reppy-teal-light rounded-xl p-4">
              <p className="text-2xl font-bold text-reppy-teal">
                {progress?.completedSessions?.length || 0}
              </p>
              <p className="text-sm text-reppy-navy/60">Sessions completed</p>
            </div>
            <div className="bg-reppy-teal-light rounded-xl p-4">
              <p className="text-2xl font-bold text-reppy-teal">
                {progress?.totalMinutes || 0}
              </p>
              <p className="text-sm text-reppy-navy/60">Minutes invested</p>
            </div>
            <div className="bg-reppy-teal-light rounded-xl p-4">
              <p className="text-2xl font-bold text-reppy-teal">
                {progress?.streakCount || 0}
              </p>
              <p className="text-sm text-reppy-navy/60">Day streak</p>
            </div>
            <div className="bg-reppy-teal-light rounded-xl p-4">
              <p className="text-2xl font-bold text-reppy-teal">
                {progress?.currentSession || 1}
              </p>
              <p className="text-sm text-reppy-navy/60">Next session</p>
            </div>
          </div>
        </div>

        {/* Account */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="font-semibold text-reppy-navy mb-4">Account</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-reppy-navy/60">Email</span>
              <span className="text-reppy-navy text-sm">{user?.email}</span>
            </div>
            
            <div className="flex items-center justify-between py-2">
              <span className="text-reppy-navy/60">Member since</span>
              <span className="text-reppy-navy text-sm">
                {progress?.createdAt 
                  ? new Date(progress.createdAt).toLocaleDateString('en-US', { 
                      month: 'long', 
                      year: 'numeric' 
                    })
                  : 'Today'
                }
              </span>
            </div>
          </div>
          
          <button
            onClick={handleSignOut}
            className="w-full mt-6 py-3 text-red-600 font-medium text-center"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 safe-area-bottom">
        <div className="flex justify-around">
          <button 
            onClick={() => navigate('/')}
            className="flex flex-col items-center gap-1 text-reppy-navy/40"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs">Home</span>
          </button>
          <button 
            onClick={() => navigate('/progress')}
            className="flex flex-col items-center gap-1 text-reppy-navy/40"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-xs">Progress</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-reppy-teal">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
            <span className="text-xs font-medium">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
}
