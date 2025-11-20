import React, { useState } from 'react';
import { ToggleLeft, ToggleRight, FlaskConical } from 'lucide-react';

const FeatureManager = () => {
  const [featureGroups, setFeatureGroups] = useState([
    {
      id: 'dashboard',
      title: 'Dashboard 3 (The Arena)',
      items: [
        { id: 'gamification', name: 'Gamification Engine', enabled: false, description: 'Arena Mode logic, streaks, coins, and leaderboards.' },
        { id: 'exec-summary', name: 'Executive Summary Widget', enabled: false, description: 'High-level view of leadership growth.' },
        { id: 'calendar-sync', name: 'Calendar Integration', enabled: false, description: 'Sync Daily Reps and coaching sessions to Outlook/Google.' },
      ]
    },
    {
      id: 'content',
      title: 'Content',
      items: [
        { id: 'reading-hub', name: 'Professional Reading Hub', enabled: false, description: 'Curated book summaries and leadership articles.' },
        { id: 'course-library', name: 'Course Library', enabled: false, description: 'Structured video modules for deep-dive learning.' },
        { id: 'strat-templates', name: 'Strategic Templates', enabled: false, description: 'Downloadable worksheets and tools.' },
      ]
    },
    {
      id: 'community',
      title: 'Community',
      items: [
        { id: 'mastermind', name: 'Peer Mastermind Groups', enabled: false, description: 'Automated matching for accountability squads.' },
        { id: 'mentor-match', name: 'Mentor Match', enabled: false, description: 'Connect aspiring leaders with senior executives.' },
        { id: 'live-events', name: 'Live Event Streaming', enabled: false, description: 'Integrated video player for town halls and workshops.' },
      ]
    },
    {
      id: 'coaching',
      title: 'Coaching',
      items: [
        { id: 'ai-roleplay', name: 'AI Roleplay Scenarios', enabled: false, description: 'Interactive practice for difficult conversations.' },
        { id: '360-feedback', name: '360 Feedback Tool', enabled: false, description: 'Aggregate anonymous feedback from real-world teams.' },
        { id: 'roi-report', name: 'Executive ROI Report', enabled: false, description: 'Automated reports showing progress and value.' },
      ]
    }
  ]);

  const toggleFeature = (groupId, featureId) => {
    setFeatureGroups(prevGroups => prevGroups.map(group => {
      if (group.id !== groupId) return group;
      return {
        ...group,
        items: group.items.map(item => 
          item.id === featureId ? { ...item, enabled: !item.enabled } : item
        )
      };
    }));
  };

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
              {group.items.map((feature) => (
                <div key={feature.id} className="flex items-center justify-between p-6 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex items-center gap-3">
                      <h4 className="font-bold text-corporate-navy text-lg">{feature.name}</h4>
                      {feature.enabled ? (
                        <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-bold rounded-full uppercase">Active</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-full uppercase">Disabled</span>
                      )}
                    </div>
                    <p className="text-gray-500 mt-1">{feature.description}</p>
                  </div>
                  
                  <button 
                    onClick={() => toggleFeature(group.id, feature.id)}
                    className={`
                      transition-colors duration-200
                      ${feature.enabled ? 'text-corporate-teal' : 'text-gray-300 hover:text-gray-400'}
                    `}
                  >
                    {feature.enabled ? (
                      <ToggleRight className="w-10 h-10" />
                    ) : (
                      <ToggleLeft className="w-10 h-10" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-sm text-yellow-800">
        <strong>Note:</strong> Feature toggles currently only affect your local session in this demo. To persist these globally, we need to connect this to a Firestore 'config' collection.
      </div>
    </div>
  );
};

export default FeatureManager;
