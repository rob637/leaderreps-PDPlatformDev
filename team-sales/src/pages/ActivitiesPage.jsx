import { useState, useEffect } from 'react';
import { 
  Mail, Phone, Linkedin, MessageSquare, Plus, Filter, 
  Calendar, User, Building2
} from 'lucide-react';
import { useOutreachStore, CHANNELS, OUTCOMES } from '../stores/outreachStore';
import { useProspectsStore } from '../stores/prospectsStore';
import { useAuthStore } from '../stores/authStore';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';

const CHANNEL_ICONS = {
  email: Mail,
  linkedin: Linkedin,
  call: Phone,
  text: MessageSquare,
};

const OUTCOME_COLORS = {
  sent: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300',
  opened: 'bg-blue-100 text-blue-700',
  clicked: 'bg-blue-100 text-blue-700',
  replied: 'bg-green-100 text-green-700',
  meeting_booked: 'bg-purple-100 text-purple-700',
  not_interested: 'bg-red-100 text-red-700',
  bounced: 'bg-red-100 text-red-700',
  no_answer: 'bg-amber-100 text-amber-700',
  voicemail: 'bg-amber-100 text-amber-700',
  connected: 'bg-green-100 text-green-700',
};

export default function ActivitiesPage() {
  const { user } = useAuthStore();
  const { activities, activitiesLoading, initialize, cleanup, logActivity, getActivityStats } = useOutreachStore();
  const { prospects } = useProspectsStore();
  
  const [showLogModal, setShowLogModal] = useState(false);
  const [filterChannel, setFilterChannel] = useState('all');
  const [filterOutcome, setFilterOutcome] = useState('all');
  
  const stats = getActivityStats();
  
  useEffect(() => {
    initialize();
    return () => cleanup();
  }, [initialize, cleanup]);
  
  // Filter and group activities
  const filteredActivities = activities.filter(a => {
    if (filterChannel !== 'all' && a.channel !== filterChannel) return false;
    if (filterOutcome !== 'all' && a.outcome !== filterOutcome) return false;
    return true;
  });
  
  // Group by date
  const groupedActivities = filteredActivities.reduce((groups, activity) => {
    const date = activity.createdAt?.toDate?.() || new Date(activity.createdAt);
    let key;
    if (isToday(date)) key = 'Today';
    else if (isYesterday(date)) key = 'Yesterday';
    else if (isThisWeek(date)) key = 'This Week';
    else key = format(date, 'MMMM d, yyyy');
    
    if (!groups[key]) groups[key] = [];
    groups[key].push(activity);
    return groups;
  }, {});
  
  const handleLogActivity = async (data) => {
    await logActivity(data, user.uid, user.displayName || user.email);
    setShowLogModal(false);
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Activities</h1>
          <p className="text-slate-600 dark:text-slate-400">Track all your outreach activities</p>
        </div>
        <button
          onClick={() => setShowLogModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90"
        >
          <Plus className="w-4 h-4" />
          Log Activity
        </button>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-400">Today</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.today}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-400">This Week</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.thisWeek}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-400">Reply Rate</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.replyRate}%</p>
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <select
            value={filterChannel}
            onChange={(e) => setFilterChannel(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg text-sm focus:ring-2 focus:ring-brand-teal focus:border-transparent"
          >
            <option value="all">All Channels</option>
            {CHANNELS.map(ch => (
              <option key={ch.value} value={ch.value}>{ch.label}</option>
            ))}
          </select>
        </div>
        
        <select
          value={filterOutcome}
          onChange={(e) => setFilterOutcome(e.target.value)}
          className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg text-sm focus:ring-2 focus:ring-brand-teal focus:border-transparent"
        >
          <option value="all">All Outcomes</option>
          {OUTCOMES.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        
        <span className="text-sm text-slate-500 dark:text-slate-400 ml-auto">
          {filteredActivities.length} activities
        </span>
      </div>
      
      {/* Activities List */}
      {activitiesLoading ? (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400">Loading activities...</div>
      ) : filteredActivities.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <Calendar className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">No activities yet</h3>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Log your first outreach activity</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedActivities).map(([dateKey, dateActivities]) => (
            <div key={dateKey}>
              <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">{dateKey}</h3>
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-200 dark:divide-slate-700">
                {dateActivities.map((activity) => {
                  const ChannelIcon = CHANNEL_ICONS[activity.channel] || Mail;
                  const prospect = prospects.find(p => p.id === activity.prospectId);
                  const timestamp = activity.createdAt?.toDate?.() || new Date(activity.createdAt);
                  
                  return (
                    <div key={activity.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg ${
                          activity.channel === 'email' ? 'bg-blue-100 text-blue-600' :
                          activity.channel === 'linkedin' ? 'bg-sky-100 text-sky-600' :
                          activity.channel === 'call' ? 'bg-green-100 text-green-600' :
                          'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                        }`}>
                          <ChannelIcon className="w-5 h-5" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-slate-900 dark:text-slate-100">
                              {CHANNELS.find(c => c.value === activity.channel)?.label}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded ${OUTCOME_COLORS[activity.outcome] || 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                              {OUTCOMES.find(o => o.value === activity.outcome)?.label || activity.outcome}
                            </span>
                          </div>
                          
                          {prospect && (
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-1">
                              <User className="w-3 h-3" />
                              <span>{prospect.name}</span>
                              {prospect.company && (
                                <>
                                  <span className="text-slate-400 dark:text-slate-500">•</span>
                                  <Building2 className="w-3 h-3" />
                                  <span>{prospect.company}</span>
                                </>
                              )}
                            </div>
                          )}
                          
                          {activity.notes && (
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{activity.notes}</p>
                          )}
                          
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                            <span>{format(timestamp, 'h:mm a')}</span>
                            <span>by {activity.ownerName}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Log Activity Modal */}
      {showLogModal && (
        <LogActivityModal
          prospects={prospects}
          onClose={() => setShowLogModal(false)}
          onSave={handleLogActivity}
        />
      )}
    </div>
  );
}

// Log Activity Modal Component
function LogActivityModal({ prospects, onClose, onSave }) {
  const [formData, setFormData] = useState({
    prospectId: '',
    channel: 'email',
    outcome: 'sent',
    notes: '',
  });
  const [searchProspect, setSearchProspect] = useState('');
  const [showProspectDropdown, setShowProspectDropdown] = useState(false);
  
  const filteredProspects = prospects.filter(p => 
    p.name?.toLowerCase().includes(searchProspect.toLowerCase()) ||
    p.company?.toLowerCase().includes(searchProspect.toLowerCase())
  ).slice(0, 10);
  
  const selectedProspect = prospects.find(p => p.id === formData.prospectId);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Log Activity</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:bg-slate-700 rounded">
            <span className="text-xl">&times;</span>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Prospect Search */}
          <div className="relative">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Prospect
            </label>
            {selectedProspect ? (
              <div className="flex items-center justify-between px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700">
                <div>
                  <span className="font-medium">{selectedProspect.name}</span>
                  {selectedProspect.company && (
                    <span className="text-slate-500 dark:text-slate-400 text-sm ml-2">at {selectedProspect.company}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, prospectId: '' }));
                    setSearchProspect('');
                  }}
                  className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:text-slate-400"
                >
                  &times;
                </button>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  value={searchProspect}
                  onChange={(e) => {
                    setSearchProspect(e.target.value);
                    setShowProspectDropdown(true);
                  }}
                  onFocus={() => setShowProspectDropdown(true)}
                  placeholder="Search by name or company..."
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-transparent"
                />
                {showProspectDropdown && filteredProspects.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredProspects.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, prospectId: p.id }));
                          setShowProspectDropdown(false);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-slate-100 dark:bg-slate-700 flex items-center gap-2"
                      >
                        <div>
                          <div className="font-medium">{p.name}</div>
                          {p.company && <div className="text-sm text-slate-500 dark:text-slate-400">{p.company}</div>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Channel *
              </label>
              <select
                value={formData.channel}
                onChange={(e) => setFormData(prev => ({ ...prev, channel: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-transparent"
                required
              >
                {CHANNELS.map(ch => (
                  <option key={ch.value} value={ch.value}>{ch.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Outcome *
              </label>
              <select
                value={formData.outcome}
                onChange={(e) => setFormData(prev => ({ ...prev, outcome: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-transparent"
                required
              >
                {OUTCOMES.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Any additional details..."
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90"
            >
              Log Activity
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
