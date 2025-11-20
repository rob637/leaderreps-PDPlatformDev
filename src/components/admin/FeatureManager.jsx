import React from 'react';
import { ToggleLeft, ToggleRight, FlaskConical } from 'lucide-react';
import { useFeatures } from '../../providers/FeatureProvider';

const FeatureManager = () => {
  const { features, toggleFeature } = useFeatures();

  const featureGroups = [
    {
      id: 'dashboard',
      title: 'Dashboard 3 (The Arena)',
      items: [
        { id: 'identity-builder', name: 'Identity Builder', description: 'Grounding Rep & Identity Statement tools.' },
        { id: 'habit-stack', name: 'Habit Stack', description: 'Daily Rep tracking and habit formation.' },
        { id: 'win-the-day', name: 'Win The Day', description: 'AM Bookend 1-2-3 priority setting.' },
        { id: 'gamification', name: 'Gamification Engine', description: 'Arena Mode logic, streaks, coins, and leaderboards.' },
        { id: 'exec-summary', name: 'Executive Summary Widget', description: 'High-level view of leadership growth.' },
        { id: 'calendar-sync', name: 'Calendar Integration', description: 'Sync Daily Reps and coaching sessions to Outlook/Google.' },
      ]
    },
    {
      id: 'content',
      title: 'Content',
      items: [
        { id: 'reading-hub', name: 'Professional Reading Hub', description: 'Curated book summaries and leadership articles.' },
        { id: 'course-library', name: 'Course Library', description: 'Structured video modules for deep-dive learning.' },
        { id: 'strat-templates', name: 'Strategic Templates', description: 'Downloadable worksheets and tools.' },
      ]
    },
    {
      id: 'community',
      title: 'Community',
      items: [
        { id: 'mastermind', name: 'Peer Mastermind Groups', description: 'Automated matching for accountability squads.' },
        { id: 'mentor-match', name: 'Mentor Match', description: 'Connect aspiring leaders with senior executives.' },
        { id: 'live-events', name: 'Live Event Streaming', description: 'Integrated video player for town halls and workshops.' },
      ]
    },
    {
      id: 'coaching',
      title: 'Coaching',
      items: [
        { id: 'ai-roleplay', name: 'AI Roleplay Scenarios', description: 'Interactive practice for difficult conversations.' },
        { id: 'scenario-sim', name: 'Scenario Sim', description: 'Complex leadership simulations and decision trees.' },
        { id: 'feedback-gym', name: 'Feedback Gym', description: 'Instant feedback on communication style.' },
        { id: 'roi-report', name: 'Executive ROI Report', description: 'Automated reports showing progress and value.' },
      ]
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-corporate-navy font-serif">Feature Lab</h2>
          <p className="text-gray-500 text-sm">Toggle experimental features and modules.</p>
        </div>
        <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
          <FlaskConical className="w-6 h-6" />
        </div>
      </div>

      <div className="space-y-8">
        {featureGroups.map((group) => (
          <div key={group.id} className="space-y-4">
            <h3 className="text-lg font-bold text-gray-700 border-b border-gray-200 pb-2">
              {group.title}
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {group.items.map((feature) => {
                const isEnabled = features[feature.id] || false;
                return (
                  <div key={feature.id} className="flex items-center justify-between p-6 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
                    <div>
                      <div className="flex items-center gap-3">
                        <h4 className="font-bold text-corporate-navy text-lg">{feature.name}</h4>
                        {isEnabled ? (
                          <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-bold rounded-full uppercase">Active</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-full uppercase">Disabled</span>
                        )}
                      </div>
                      <p className="text-gray-500 mt-1">{feature.description}</p>
                    </div>
                    
                    <button 
                      onClick={() => toggleFeature(feature.id, !isEnabled)}
                      className={`
                        transition-colors duration-200
                        ${isEnabled ? 'text-corporate-teal' : 'text-gray-300 hover:text-gray-400'}
                      `}
                    >
                      {isEnabled ? (
                        <ToggleRight className="w-10 h-10" />
                      ) : (
                        <ToggleLeft className="w-10 h-10" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-sm text-yellow-800">
        <strong>Note:</strong> Feature toggles are now persisted globally via Firestore. Changes affect all users immediately.
      </div>
    </div>
  );
export default FeatureManager;

export default FeatureManager;
