import React, { useState, useEffect } from 'react';
import { ToggleLeft, ToggleRight, FlaskConical, ArrowUp, ArrowDown } from 'lucide-react';
import { useFeatures } from '../../providers/FeatureProvider';

const FeatureManager = () => {
  const { features, toggleFeature, updateFeatureOrder, getFeatureOrder, isFeatureEnabled } = useFeatures();
  
  // Define the static metadata for features
  const FEATURE_METADATA = {
    // Dashboard
    'identity-builder': { name: 'Identity Builder', description: 'Grounding Rep & Identity Statement tools.' },
    'habit-stack': { name: 'Habit Stack', description: 'Daily Rep tracking and habit formation.' },
    'win-the-day': { name: 'Win The Day', description: 'AM Bookend 1-2-3 priority setting.' },
    'gamification': { name: 'Gamification Engine', description: 'Arena Mode logic, streaks, coins, and leaderboards.' },
    'exec-summary': { name: 'Executive Summary Widget', description: 'High-level view of leadership growth.' },
    'calendar-sync': { name: 'Calendar Integration', description: 'Sync Daily Reps and coaching sessions to Outlook/Google.' },
    
    // Content
    'course-library': { name: 'Course Library', description: 'Structured video modules for deep-dive learning.' },
    'reading-hub': { name: 'Professional Reading Hub', description: 'Curated book summaries and leadership articles.' },
    'leadership-videos': { name: 'Leadership Videos (Media)', description: 'Video content, leader talks, and multimedia resources.' },
    'strat-templates': { name: 'Strategic Templates', description: 'Downloadable worksheets and tools.' },
    
    // Community
    'community-feed': { name: 'Community Feed', description: 'Main discussion stream and posting interface.' },
    'my-discussions': { name: 'My Discussions', description: 'Filter view for user-owned threads.' },
    'mastermind': { name: 'Peer Mastermind Groups', description: 'Automated matching for accountability squads.' },
    'mentor-match': { name: 'Mentor Match', description: 'Connect aspiring leaders with senior executives.' },
    'live-events': { name: 'Live Event Streaming', description: 'Integrated video player for town halls and workshops.' },
    
    // Coaching
    'practice-history': { name: 'Practice History', description: 'Review past performance and scores.' },
    'progress-analytics': { name: 'Progress Analytics', description: 'Track performance trends and strengths.' },
    'ai-roleplay': { name: 'AI Roleplay Scenarios', description: 'Interactive practice for difficult conversations.' },
    'scenario-sim': { name: 'Scenario Sim', description: 'Complex leadership simulations and decision trees.' },
    'feedback-gym': { name: 'Feedback Gym', description: 'Instant feedback on communication style.' },
    'roi-report': { name: 'Executive ROI Report', description: 'Automated reports showing progress and value.' },
  };

  // Initial groups structure (ids only)
  const initialGroups = {
    dashboard: ['identity-builder', 'habit-stack', 'win-the-day', 'gamification', 'exec-summary', 'calendar-sync'],
    content: ['course-library', 'reading-hub', 'leadership-videos', 'strat-templates'],
    community: ['community-feed', 'my-discussions', 'mastermind', 'mentor-match', 'live-events'],
    coaching: ['ai-roleplay', 'scenario-sim', 'feedback-gym', 'practice-history', 'progress-analytics', 'roi-report']
  };

  // State to hold the sorted list of IDs for each group
  const [sortedGroups, setSortedGroups] = useState(initialGroups);

  // Effect to sort groups based on persisted order
  useEffect(() => {
    const newSortedGroups = {};
    Object.keys(initialGroups).forEach(groupKey => {
      const unsortedIds = initialGroups[groupKey];
      // Sort based on getFeatureOrder
      const sorted = [...unsortedIds].sort((a, b) => {
        const orderA = getFeatureOrder(a);
        const orderB = getFeatureOrder(b);
        // If orders are equal (e.g. both 999), maintain original relative order
        if (orderA === orderB) return unsortedIds.indexOf(a) - unsortedIds.indexOf(b);
        return orderA - orderB;
      });
      newSortedGroups[groupKey] = sorted;
    });
    setSortedGroups(newSortedGroups);
  }, [features]); // Re-run when features context updates

  const handleMove = (groupKey, index, direction) => {
    const currentList = [...sortedGroups[groupKey]];
    if (direction === 'up' && index > 0) {
      [currentList[index], currentList[index - 1]] = [currentList[index - 1], currentList[index]];
    } else if (direction === 'down' && index < currentList.length - 1) {
      [currentList[index], currentList[index + 1]] = [currentList[index + 1], currentList[index]];
    } else {
      return;
    }
    
    // Optimistic update
    setSortedGroups(prev => ({ ...prev, [groupKey]: currentList }));
    
    // Persist new order
    // We only need to update the order for the items in this group
    // But updateFeatureOrder expects a map of { id: order } or list of ids?
    // The provider implementation I wrote takes an array of IDs and assigns index as order.
    // So we just pass the new list.
    updateFeatureOrder(currentList);
  };

  const groupTitles = {
    dashboard: 'Dashboard 3 (The Arena)',
    content: 'Content',
    community: 'Community',
    coaching: 'Coaching'
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-corporate-navy font-serif">Feature Lab</h2>
          <p className="text-gray-500 text-sm">Toggle and reorder features for each module.</p>
        </div>
        <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
          <FlaskConical className="w-6 h-6" />
        </div>
      </div>

      <div className="space-y-8">
        {Object.keys(sortedGroups).map((groupKey) => (
          <div key={groupKey} className="space-y-4">
            <h3 className="text-lg font-bold text-gray-700 border-b border-gray-200 pb-2">
              {groupTitles[groupKey]}
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {sortedGroups[groupKey].map((featureId, index) => {
                const meta = FEATURE_METADATA[featureId] || { name: featureId, description: '' };
                const isEnabled = isFeatureEnabled(featureId);
                
                return (
                  <div key={featureId} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      {/* Reorder Controls */}
                      <div className="flex flex-col gap-1">
                        <button 
                          onClick={() => handleMove(groupKey, index, 'up')}
                          disabled={index === 0}
                          className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-corporate-navy disabled:opacity-30"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleMove(groupKey, index, 'down')}
                          disabled={index === sortedGroups[groupKey].length - 1}
                          className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-corporate-navy disabled:opacity-30"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>

                      <div>
                        <div className="flex items-center gap-3">
                          <h4 className="font-bold text-corporate-navy text-lg">{meta.name}</h4>
                          {isEnabled ? (
                            <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-bold rounded-full uppercase">Active</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-full uppercase">Disabled</span>
                          )}
                        </div>
                        <p className="text-gray-500 mt-1 text-sm">{meta.description}</p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => toggleFeature(featureId, !isEnabled)}
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
        <strong>Note:</strong> Feature toggles and order are persisted globally via Firestore. Changes affect all users immediately.
      </div>
    </div>
  );
};

export default FeatureManager;
