import React, { useState, useEffect } from 'react';
import { ToggleLeft, ToggleRight, FlaskConical, ArrowUp, ArrowDown, Edit3, Plus, Trash2, RefreshCw, Save } from 'lucide-react';
import { useFeatures } from '../../providers/FeatureProvider';
import WidgetEditorModal from './WidgetEditorModal';

const FeatureManager = () => {
  const { features, toggleFeature, updateFeatureOrder, saveFeature, deleteFeature, isFeatureEnabled } = useFeatures();
  const [editingWidget, setEditingWidget] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newWidget, setNewWidget] = useState({ name: '', id: '', group: 'dashboard', description: '' });

  const WIDGET_TEMPLATES = {
    'identity-builder': `
<section className="text-left w-full">
  <div className="flex items-center gap-2 mb-4">
    <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
      <Flame className="w-5 h-5" />
    </div>
    <h2 className="text-xl font-bold text-[#002E47]">
      Identity Builder
    </h2>
  </div>
  <div className="space-y-3 text-left">
    {hasLIS ? (
      <Checkbox 
        checked={lisRead}
        onChange={() => handleHabitCheck('readLIS', !lisRead)}
        label="Grounding Rep: Read LIS"
        subLabel="Center yourself on your identity."
      />
    ) : (
      <div className="p-4 rounded-xl border-2 border-dashed border-orange-300 bg-orange-50 flex items-center justify-between">
        <div>
          <p className="font-semibold text-orange-800">Grounding Rep: Read LIS</p>
          <p className="text-xs text-orange-600">No Identity Statement set yet.</p>
        </div>
        <button 
          onClick={() => setIsAnchorModalOpen(true)}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-bold hover:bg-orange-600 transition-colors"
        >
          Enter / Save
        </button>
      </div>
    )}
  </div>
</section>
    `,
    'exec-summary': `
<div className="bg-corporate-navy text-white p-6 rounded-2xl shadow-lg flex items-center justify-between w-full">
  <div>
    <h2 className="text-lg font-bold mb-1">Executive Summary</h2>
    <p className="text-blue-200 text-sm">Your leadership impact at a glance.</p>
  </div>
  <div className="flex gap-8 text-center">
    <div>
      <div className="text-2xl font-bold text-corporate-teal">94%</div>
      <div className="text-xs text-blue-200 uppercase">Consistency</div>
    </div>
    <div>
      <div className="text-2xl font-bold text-corporate-orange">12</div>
      <div className="text-xs text-blue-200 uppercase">Reps Done</div>
    </div>
  </div>
</div>
    `
  };
  
  const FEATURE_METADATA = {
    // Dashboard
    'identity-builder': { name: 'Identity Builder', description: 'Grounding Rep & Identity Statement tools.' },
    'habit-stack': { name: 'Habit Stack', description: 'Daily Rep tracking and habit formation.' },
    'win-the-day': { name: 'AM Bookend (Win The Day)', description: 'AM Bookend 1-2-3 priority setting.' },
    'gamification': { name: 'Gamification Engine', description: 'Arena Mode logic, streaks, coins, and leaderboards.' },
    'exec-summary': { name: 'Executive Summary Widget', description: 'High-level view of leadership growth.' },
    'calendar-sync': { name: 'Calendar Integration', description: 'Sync Daily Reps and coaching sessions to Outlook/Google.' },
    'weekly-focus': { name: 'Weekly Focus', description: 'Display current development plan focus area.' },
    'notifications': { name: 'Notifications', description: 'Alerts and reminders widget.' },
    'scorecard': { name: 'Today Scorecard', description: 'Daily progress summary and streak display.' },
    'pm-bookend': { name: 'PM Bookend', description: 'Evening reflection and journaling.' },
    
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

  const initialGroups = {
    dashboard: ['identity-builder', 'habit-stack', 'win-the-day', 'gamification', 'exec-summary', 'calendar-sync', 'weekly-focus', 'notifications', 'scorecard', 'pm-bookend'],
    content: ['course-library', 'reading-hub', 'leadership-videos', 'strat-templates'],
    community: ['community-feed', 'my-discussions', 'mastermind', 'mentor-match', 'live-events'],
    coaching: ['practice-history', 'progress-analytics', 'ai-roleplay', 'scenario-sim', 'feedback-gym', 'roi-report']
  };

  // Group features dynamically
  const groups = {
    dashboard: [],
    content: [],
    community: [],
    coaching: []
  };

  // Merge DB features with metadata for display
  Object.entries(features).forEach(([id, data]) => {
    const group = data.group || (initialGroups.dashboard.includes(id) ? 'dashboard' : 
                                 initialGroups.content.includes(id) ? 'content' :
                                 initialGroups.community.includes(id) ? 'community' : 
                                 initialGroups.coaching.includes(id) ? 'coaching' : 'dashboard');
    
    const meta = FEATURE_METADATA[id] || {};
    
    if (groups[group]) {
      groups[group].push({
        id,
        name: data.name || meta.name || id,
        description: data.description || meta.description || '',
        enabled: data.enabled,
        order: data.order ?? 999,
        code: data.code || WIDGET_TEMPLATES[id] || ''
      });
    }
  });

  // Sort groups
  Object.keys(groups).forEach(key => {
    groups[key].sort((a, b) => a.order - b.order);
  });

  const handleSyncDefaults = async () => {
    if (!window.confirm('This will populate the database with default widgets. Continue?')) return;
    
    for (const [id, meta] of Object.entries(FEATURE_METADATA)) {
       if (!features[id] || !features[id].name) {
         await saveFeature(id, {
           name: meta.name,
           description: meta.description,
           code: WIDGET_TEMPLATES[id] || '',
           group: initialGroups.dashboard.includes(id) ? 'dashboard' : 
                  initialGroups.content.includes(id) ? 'content' :
                  initialGroups.community.includes(id) ? 'community' : 'coaching',
           enabled: true,
           order: 999
         });
       }
    }
    alert('Defaults synced!');
  };

  const handleAddWidget = async () => {
    if (!newWidget.name || !newWidget.id) return;
    await saveFeature(newWidget.id, {
      ...newWidget,
      code: '// New widget code',
      enabled: true,
      order: 999
    });
    setIsAdding(false);
    setNewWidget({ name: '', id: '', group: 'dashboard', description: '' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this widget?')) {
      await deleteFeature(id);
    }
  };

  const handleMove = (groupKey, index, direction) => {
    const currentList = [...groups[groupKey]];
    if (direction === 'up' && index > 0) {
      [currentList[index], currentList[index - 1]] = [currentList[index - 1], currentList[index]];
    } else if (direction === 'down' && index < currentList.length - 1) {
      [currentList[index], currentList[index + 1]] = [currentList[index + 1], currentList[index]];
    } else {
      return;
    }
    
    // Update orders
    currentList.forEach((item, idx) => {
        saveFeature(item.id, { ...features[item.id], order: idx });
    });
  };

  const groupTitles = {
    dashboard: 'Dashboard',
    content: 'Content',
    community: 'Community',
    coaching: 'Coaching'
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-corporate-navy font-serif">Widget Lab</h2>
          <p className="text-gray-500 text-sm">Manage, design, and deploy widgets for each module.</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => setIsAdding(true)}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg flex items-center gap-2 hover:bg-teal-700 transition-colors"
            >
                <Plus className="w-4 h-4" /> Add Widget
            </button>
            <button 
                onClick={handleSyncDefaults}
                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg flex items-center gap-2 hover:bg-slate-200 transition-colors"
                title="Restore default widgets to database"
            >
                <RefreshCw className="w-4 h-4" /> Sync Defaults
            </button>
        </div>
      </div>

      {/* Add Widget Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl w-96 space-y-4">
                <h3 className="font-bold text-lg">Add New Widget</h3>
                <input 
                    className="w-full p-2 border rounded" 
                    placeholder="Widget Name" 
                    value={newWidget.name}
                    onChange={e => setNewWidget({...newWidget, name: e.target.value, id: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                />
                <input 
                    className="w-full p-2 border rounded" 
                    placeholder="Widget ID" 
                    value={newWidget.id}
                    onChange={e => setNewWidget({...newWidget, id: e.target.value})}
                />
                <select 
                    className="w-full p-2 border rounded"
                    value={newWidget.group}
                    onChange={e => setNewWidget({...newWidget, group: e.target.value})}
                >
                    <option value="dashboard">Dashboard</option>
                    <option value="content">Content</option>
                    <option value="community">Community</option>
                    <option value="coaching">Coaching</option>
                </select>
                <textarea 
                    className="w-full p-2 border rounded" 
                    placeholder="Description" 
                    value={newWidget.description}
                    onChange={e => setNewWidget({...newWidget, description: e.target.value})}
                />
                <div className="flex justify-end gap-2">
                    <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                    <button onClick={handleAddWidget} className="px-4 py-2 bg-teal-600 text-white rounded">Add</button>
                </div>
            </div>
        </div>
      )}

      <div className="space-y-8">
        {Object.keys(groups).map((groupKey) => (
          <div key={groupKey} className="space-y-4">
            <h3 className="text-lg font-bold text-gray-700 border-b border-gray-200 pb-2">
              {groupTitles[groupKey]}
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {groups[groupKey].length === 0 && (
                  <p className="text-gray-400 italic">No widgets in this group.</p>
              )}
              {groups[groupKey].map((feature, index) => (
                  <div key={feature.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
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
                          disabled={index === groups[groupKey].length - 1}
                          className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-corporate-navy disabled:opacity-30"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>

                      <div>
                        <div className="flex items-center gap-3">
                          <h4 
                            className="font-bold text-corporate-navy text-lg cursor-pointer hover:text-teal-600 hover:underline decoration-dotted underline-offset-4"
                            onClick={() => setEditingWidget(feature)}
                            title="Click to edit widget design"
                          >
                            {feature.name}
                          </h4>
                          <button 
                            onClick={() => setEditingWidget(feature)}
                            className="p-1 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-full transition-colors"
                            title="Edit Widget Design"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {feature.enabled ? (
                            <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-bold rounded-full uppercase">Active</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-full uppercase">Disabled</span>
                          )}
                        </div>
                        <p className="text-gray-500 mt-1 text-sm">{feature.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <button 
                        onClick={() => toggleFeature(feature.id, !feature.enabled)}
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
                        <button 
                            onClick={() => handleDelete(feature.id)}
                            className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                            title="Delete Widget"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-sm text-yellow-800">
        <strong>Note:</strong> Feature toggles and order are persisted globally via Firestore. Changes affect all users immediately.
      </div>

      {/* Widget Editor Modal */}
      {editingWidget && (
        <WidgetEditorModal
          isOpen={!!editingWidget}
          onClose={() => setEditingWidget(null)}
          widgetId={editingWidget.id}
          widgetName={editingWidget.name}
          initialCode={editingWidget.code}
          onSave={async (code) => {
              await saveFeature(editingWidget.id, { ...features[editingWidget.id], code });
          }}
        />
      )}
    </div>
  );
};

export default FeatureManager;
