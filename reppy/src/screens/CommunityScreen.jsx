import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProgress, useTheme } from '../App';
import { 
  CIRCLE_DISCUSSION_GUIDES, 
  COACHING_TOPICS, 
  COMMUNITY_CHALLENGES,
  ACCOUNTABILITY_PROMPTS,
  getCurrentCircleGuide,
} from '../data/communityContent';

export default function CommunityScreen() {
  const navigate = useNavigate();
  const { progress } = useProgress();
  const { isDark } = useTheme();
  
  const [activeTab, setActiveTab] = useState('circles');
  const [showCircleDetail, setShowCircleDetail] = useState(null);
  const [showCoachingSession, setShowCoachingSession] = useState(null);
  const [showChallenge, setShowChallenge] = useState(null);
  
  const profile = progress?.profile || {};
  const name = profile.name || 'Leader';
  const completedSessions = progress?.completedSessions?.length || 0;
  const currentWeek = Math.floor(completedSessions / 7) + 1;
  
  // Get current circle guide based on progress
  const currentCircleGuide = getCurrentCircleGuide(currentWeek);
  
  // Community stats (simulated for now - would come from Firestore)
  const communityStats = {
    activeMembers: 247,
    circlesThisWeek: 34,
    reflectionsShared: 1892,
    challengesCompleted: 456,
  };

  // Tab button component
  const TabButton = ({ id, label, icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex-1 py-3 px-2 text-sm font-medium rounded-xl transition-all ${
        activeTab === id
          ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
          : isDark 
            ? 'bg-white/5 text-white/60 hover:text-white/80'
            : 'bg-gray-100 text-gray-600 hover:text-gray-800'
      }`}
    >
      <span className="mr-1">{icon}</span>
      {label}
    </button>
  );

  // ============================================================================
  // LEADER CIRCLES TAB
  // ============================================================================
  const renderCirclesTab = () => (
    <div className="space-y-6">
      {/* This Week's Circle */}
      <div className={`rounded-2xl p-5 ${isDark ? 'bg-gradient-to-br from-blue-500/20 to-indigo-600/20 border border-blue-500/30' : 'bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200'}`}>
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-2xl shadow-lg">
            {currentCircleGuide.icon}
          </div>
          <div className="flex-1">
            <div className={`text-xs font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
              This Week's Circle • Week {currentWeek}
            </div>
            <h3 className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {currentCircleGuide.title}
            </h3>
            <p className={`text-sm mb-3 ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
              {currentCircleGuide.duration} • {currentCircleGuide.objectives.length} objectives
            </p>
            <button
              onClick={() => setShowCircleDetail(currentCircleGuide)}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-medium rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              View Discussion Guide
            </button>
          </div>
        </div>
      </div>

      {/* All Circle Guides */}
      <div>
        <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          All Discussion Guides
        </h3>
        <div className="space-y-3">
          {CIRCLE_DISCUSSION_GUIDES.map((guide, index) => (
            <button
              key={guide.id}
              onClick={() => setShowCircleDetail(guide)}
              className={`w-full p-4 rounded-xl text-left transition-all ${
                isDark 
                  ? 'bg-white/5 hover:bg-white/10 border border-white/10'
                  : 'bg-white hover:bg-gray-50 border border-gray-200 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                  index + 1 === currentWeek 
                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                    : isDark ? 'bg-white/10' : 'bg-gray-100'
                }`}>
                  {guide.icon}
                </div>
                <div className="flex-1">
                  <div className={`text-xs font-medium mb-0.5 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
                    Week {index + 1}
                  </div>
                  <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {guide.title}
                  </div>
                </div>
                <svg className={`w-5 h-5 ${isDark ? 'text-white/30' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // ============================================================================
  // COACHING TAB
  // ============================================================================
  const renderCoachingTab = () => (
    <div className="space-y-6">
      {/* AI Coach Banner */}
      <div className={`rounded-2xl p-5 ${isDark ? 'bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-500/30' : 'bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200'}`}>
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
            <span className="text-2xl">🤖</span>
          </div>
          <div className="flex-1">
            <div className={`text-xs font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>
              Your AI Coach
            </div>
            <h3 className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Hey {name}, I'm Here For You
            </h3>
            <p className={`text-sm mb-3 ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
              I remember your journey. Let's work through what's on your mind.
            </p>
            <button
              onClick={() => navigate('/session?type=growth')}
              className="px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-medium rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              Start Coaching Session
            </button>
          </div>
        </div>
      </div>

      {/* Coaching Topics */}
      <div>
        <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          What's On Your Mind?
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {COACHING_TOPICS.map((topic) => (
            <button
              key={topic.id}
              onClick={() => setShowCoachingSession(topic)}
              className={`p-4 rounded-xl text-left transition-all ${
                isDark 
                  ? 'bg-white/5 hover:bg-white/10 border border-white/10'
                  : 'bg-white hover:bg-gray-50 border border-gray-200 shadow-sm'
              }`}
            >
              <div className="text-2xl mb-2">{topic.icon}</div>
              <div className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {topic.title}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Schedule Human Coaching (Coming Soon) */}
      <div className={`rounded-2xl p-5 ${isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-gray-200'}`}>
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
            <span className="text-2xl">👤</span>
          </div>
          <div className="flex-1">
            <div className={`text-xs font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
              Coming Soon
            </div>
            <h3 className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              1:1 Executive Coaching
            </h3>
            <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
              Book sessions with certified leadership coaches.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // ============================================================================
  // ACCOUNTABILITY TAB
  // ============================================================================
  const renderAccountabilityTab = () => (
    <div className="space-y-6">
      {/* Partner Status */}
      <div className={`rounded-2xl p-5 ${isDark ? 'bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border border-emerald-500/30' : 'bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200'}`}>
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
            <span className="text-2xl">🤝</span>
          </div>
          <div className="flex-1">
            <div className={`text-xs font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
              Accountability Partner
            </div>
            <h3 className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Find Your Partner
            </h3>
            <p className={`text-sm mb-3 ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
              Pair up with another leader for weekly check-ins and mutual support.
            </p>
            <button
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-medium rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              Get Matched (Coming Soon)
            </button>
          </div>
        </div>
      </div>

      {/* Weekly Check-In Questions */}
      <div>
        <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Weekly Partner Questions
        </h3>
        <div className="space-y-3">
          {ACCOUNTABILITY_PROMPTS.weekly.map((prompt, index) => (
            <div
              key={prompt.id}
              className={`p-4 rounded-xl ${
                isDark 
                  ? 'bg-white/5 border border-white/10'
                  : 'bg-white border border-gray-200 shadow-sm'
              }`}
            >
              <div className={`flex items-center gap-2 mb-2`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'
                }`}>
                  {index + 1}
                </span>
                <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {prompt.question}
                </span>
              </div>
              <p className={`text-sm pl-8 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                Follow-up: {prompt.followUp}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Prompts */}
      <div>
        <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Daily Quick Check-Ins
        </h3>
        <div className="flex flex-wrap gap-2">
          {ACCOUNTABILITY_PROMPTS.daily.map((prompt, index) => (
            <div
              key={index}
              className={`px-3 py-2 rounded-lg text-sm ${
                isDark 
                  ? 'bg-white/5 text-white/70'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {prompt}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ============================================================================
  // CHALLENGES TAB
  // ============================================================================
  const renderChallengesTab = () => (
    <div className="space-y-6">
      {/* Active Challenge Banner */}
      <div className={`rounded-2xl p-5 ${isDark ? 'bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30' : 'bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200'}`}>
        <div className="text-center">
          <div className="text-4xl mb-3">🏆</div>
          <h3 className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Community Challenges
          </h3>
          <p className={`text-sm mb-3 ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
            Push yourself with weekly leadership challenges. Earn points. Grow together.
          </p>
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${isDark ? 'bg-white/10' : 'bg-white shadow-sm'}`}>
            <span className="text-lg">⭐</span>
            <span className={`font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
              {communityStats.challengesCompleted}
            </span>
            <span className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
              completed this month
            </span>
          </div>
        </div>
      </div>

      {/* Challenge Cards */}
      <div>
        <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Available Challenges
        </h3>
        <div className="space-y-3">
          {COMMUNITY_CHALLENGES.map((challenge) => (
            <button
              key={challenge.id}
              onClick={() => setShowChallenge(challenge)}
              className={`w-full p-4 rounded-xl text-left transition-all ${
                isDark 
                  ? 'bg-white/5 hover:bg-white/10 border border-white/10'
                  : 'bg-white hover:bg-gray-50 border border-gray-200 shadow-sm'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                  {challenge.icon}
                </div>
                <div className="flex-1">
                  <div className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {challenge.title}
                  </div>
                  <div className={`text-sm mb-2 ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                    {challenge.description}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-white/10 text-white/60' : 'bg-gray-100 text-gray-600'}`}>
                      {challenge.duration}
                    </span>
                    <span className={`text-xs font-semibold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                      +{challenge.points} pts
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // ============================================================================
  // CIRCLE DETAIL MODAL
  // ============================================================================
  const renderCircleDetailModal = () => {
    if (!showCircleDetail) return null;
    const guide = showCircleDetail;
    
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 animate-fade-in">
        <div className={`w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl ${isDark ? 'bg-gray-900' : 'bg-white'} animate-slide-up`}>
          {/* Header */}
          <div className="sticky top-0 px-6 py-4 border-b border-white/10 bg-inherit z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{guide.icon}</span>
                <div>
                  <div className={`text-xs font-medium ${isDark ? 'text-white/40' : 'text-gray-400'}`}>Week {CIRCLE_DISCUSSION_GUIDES.indexOf(guide) + 1}</div>
                  <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{guide.title}</h2>
                </div>
              </div>
              <button
                onClick={() => setShowCircleDetail(null)}
                className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}
              >
                <svg className={`w-5 h-5 ${isDark ? 'text-white/70' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Content */}
          <div className="px-6 py-5 space-y-6">
            {/* Objectives */}
            <div>
              <h3 className={`text-sm font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                Objectives
              </h3>
              <ul className="space-y-2">
                {guide.objectives.map((obj, i) => (
                  <li key={i} className={`flex items-start gap-2 text-sm ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                    <span className="text-blue-500 mt-0.5">✓</span>
                    {obj}
                  </li>
                ))}
              </ul>
            </div>

            {/* Icebreaker */}
            <div className={`p-4 rounded-xl ${isDark ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-200'}`}>
              <div className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                🧊 Icebreaker • {guide.icebreaker.duration}
              </div>
              <p className={`${isDark ? 'text-white' : 'text-gray-900'}`}>
                {guide.icebreaker.question}
              </p>
            </div>

            {/* Main Discussion */}
            <div className={`p-4 rounded-xl ${isDark ? 'bg-violet-500/10 border border-violet-500/20' : 'bg-violet-50 border border-violet-200'}`}>
              <div className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>
                💬 Main Discussion • {guide.mainDiscussion.duration}
              </div>
              <p className={`font-medium mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {guide.mainDiscussion.prompt}
              </p>
              <div className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                <div className="font-medium mb-1">Follow-up questions:</div>
                <ul className="space-y-1 pl-4">
                  {guide.mainDiscussion.followUps.map((q, i) => (
                    <li key={i} className="list-disc">{q}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Peer Exercise */}
            <div className={`p-4 rounded-xl ${isDark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-200'}`}>
              <div className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                🎯 {guide.peerExercise.title} • {guide.peerExercise.duration}
              </div>
              <p className={`${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                {guide.peerExercise.instructions}
              </p>
            </div>

            {/* Closing */}
            <div className={`p-4 rounded-xl ${isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'}`}>
              <div className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                🎬 Closing Commitment • {guide.closing.duration}
              </div>
              <p className={`${isDark ? 'text-white' : 'text-gray-900'}`}>
                {guide.closing.commitment}
              </p>
            </div>
          </div>
          
          {/* Footer */}
          <div className="sticky bottom-0 px-6 py-4 border-t border-white/10 bg-inherit">
            <button
              onClick={() => setShowCircleDetail(null)}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl"
            >
              Got It!
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // COACHING TOPIC MODAL
  // ============================================================================
  const renderCoachingModal = () => {
    if (!showCoachingSession) return null;
    const topic = showCoachingSession;
    
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 animate-fade-in">
        <div className={`w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl ${isDark ? 'bg-gray-900' : 'bg-white'} animate-slide-up`}>
          <div className="px-6 py-5">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{topic.icon}</span>
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{topic.title}</h2>
              </div>
              <button
                onClick={() => setShowCoachingSession(null)}
                className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}
              >
                <svg className={`w-5 h-5 ${isDark ? 'text-white/70' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <p className={`mb-6 ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
              Explore these questions with your AI coach or bring them to your next coaching session:
            </p>
            
            <div className="space-y-3 mb-6">
              {topic.questions.map((q, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-gray-200'}`}
                >
                  <span className={`${isDark ? 'text-white' : 'text-gray-900'}`}>{q}</span>
                </div>
              ))}
            </div>
            
            <button
              onClick={() => {
                setShowCoachingSession(null);
                navigate('/session?type=growth');
              }}
              className="w-full py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold rounded-xl"
            >
              Discuss with AI Coach
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // CHALLENGE MODAL
  // ============================================================================
  const renderChallengeModal = () => {
    if (!showChallenge) return null;
    const challenge = showChallenge;
    
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 animate-fade-in">
        <div className={`w-full max-w-lg rounded-t-3xl sm:rounded-3xl ${isDark ? 'bg-gray-900' : 'bg-white'} animate-slide-up`}>
          <div className="px-6 py-6 text-center">
            <div className="text-5xl mb-4">{challenge.icon}</div>
            <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {challenge.title}
            </h2>
            <p className={`mb-4 ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
              {challenge.description}
            </p>
            
            <div className={`inline-flex items-center gap-4 px-5 py-3 rounded-xl mb-6 ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
              <div className="text-center">
                <div className={`text-xs ${isDark ? 'text-white/40' : 'text-gray-400'}`}>Duration</div>
                <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{challenge.duration}</div>
              </div>
              <div className={`w-px h-8 ${isDark ? 'bg-white/10' : 'bg-gray-300'}`} />
              <div className="text-center">
                <div className={`text-xs ${isDark ? 'text-white/40' : 'text-gray-400'}`}>Points</div>
                <div className={`font-semibold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>+{challenge.points}</div>
              </div>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => setShowChallenge(null)}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-xl"
              >
                Accept Challenge
              </button>
              <button
                onClick={() => setShowChallenge(null)}
                className={`w-full py-3 rounded-xl font-medium ${isDark ? 'bg-white/10 text-white/70' : 'bg-gray-100 text-gray-600'}`}
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-950' : 'bg-gray-50'} safe-area-top safe-area-bottom`}>
      {/* Header with Tabs */}
      <div className={`px-5 py-4 ${isDark ? 'border-b border-white/10' : 'border-b border-gray-200'}`}>
        <div className="mb-4">
          <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} text-center`}>Community</h1>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-2">
          <TabButton id="circles" label="Circles" icon="👥" />
          <TabButton id="coaching" label="Coach" icon="🧭" />
          <TabButton id="accountability" label="Partner" icon="🤝" />
          <TabButton id="challenges" label="Challenges" icon="🏆" />
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-6 pb-24">
        {activeTab === 'circles' && renderCirclesTab()}
        {activeTab === 'coaching' && renderCoachingTab()}
        {activeTab === 'accountability' && renderAccountabilityTab()}
        {activeTab === 'challenges' && renderChallengesTab()}
      </div>

      {/* Modals */}
      {renderCircleDetailModal()}
      {renderCoachingModal()}
      {renderChallengeModal()}
    </div>
  );
}
