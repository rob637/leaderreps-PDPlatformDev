import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Calendar, Clock, User, Plus, Search,
  Edit, Trash2, ChevronRight, Phone, Video, Mail,
  Users, Target, FileText, RefreshCw, Tag, Filter,
  CheckCircle, Circle, MoreVertical, Mic, Save, X
} from 'lucide-react';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy, where } from 'firebase/firestore';
import { db } from '../../../firebase';

/**
 * Meeting Notes & Activity Log
 * 
 * Features:
 * - Log meetings, calls, emails per prospect
 * - Rich meeting notes with attendees
 * - Activity timeline
 * - Follow-up reminders
 * - Tag system for categorization
 * - Search across all activities
 */

const ACTIVITY_TYPES = {
  call: { label: 'Call', icon: Phone, color: 'text-green-500', bg: 'bg-green-100' },
  meeting: { label: 'Meeting', icon: Video, color: 'text-blue-500', bg: 'bg-blue-100' },
  email: { label: 'Email', icon: Mail, color: 'text-purple-500', bg: 'bg-purple-100' },
  note: { label: 'Note', icon: FileText, color: 'text-amber-500', bg: 'bg-amber-100' },
  task: { label: 'Task', icon: Target, color: 'text-red-500', bg: 'bg-red-100' }
};

const TAGS = [
  { id: 'follow-up', name: 'Follow-up', color: 'bg-amber-100 text-amber-700' },
  { id: 'decision-maker', name: 'Decision Maker', color: 'bg-blue-100 text-blue-700' },
  { id: 'pricing', name: 'Pricing', color: 'bg-green-100 text-green-700' },
  { id: 'objection', name: 'Objection', color: 'bg-red-100 text-red-700' },
  { id: 'demo', name: 'Demo', color: 'bg-purple-100 text-purple-700' },
  { id: 'contract', name: 'Contract', color: 'bg-slate-100 text-slate-700' }
];

const MeetingNotes = () => {
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);
  const [prospects, setProspects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterProspect, setFilterProspect] = useState('all');
  const [showNewActivity, setShowNewActivity] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [formData, setFormData] = useState({
    type: 'meeting',
    title: '',
    prospectId: '',
    notes: '',
    attendees: '',
    duration: 30,
    tags: [],
    followUpDate: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch activities
      const activitiesSnap = await getDocs(
        query(collection(db, 'corporate_activities'), orderBy('createdAt', 'desc'))
      );
      const activitiesData = activitiesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setActivities(activitiesData);

      // Fetch prospects for linking
      const prospectsSnap = await getDocs(collection(db, 'corporate_prospects'));
      const prospectsData = prospectsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setProspects(prospectsData);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const prospect = prospects.find(p => p.id === formData.prospectId);
      const activityData = {
        ...formData,
        prospectName: prospect?.company || 'General',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      if (editingActivity) {
        await updateDoc(doc(db, 'corporate_activities', editingActivity), {
          ...activityData,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'corporate_activities'), activityData);
      }

      setShowNewActivity(false);
      setEditingActivity(null);
      resetForm();
      fetchData();
    } catch (err) {
      console.error("Error saving activity:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this activity?')) return;
    try {
      await deleteDoc(doc(db, 'corporate_activities', id));
      fetchData();
    } catch (err) {
      console.error("Error deleting activity:", err);
    }
  };

  const handleEdit = (activity) => {
    setFormData({
      type: activity.type,
      title: activity.title || '',
      prospectId: activity.prospectId || '',
      notes: activity.notes || '',
      attendees: activity.attendees || '',
      duration: activity.duration || 30,
      tags: activity.tags || [],
      followUpDate: activity.followUpDate || ''
    });
    setEditingActivity(activity.id);
    setShowNewActivity(true);
  };

  const resetForm = () => {
    setFormData({
      type: 'meeting',
      title: '',
      prospectId: '',
      notes: '',
      attendees: '',
      duration: 30,
      tags: [],
      followUpDate: ''
    });
  };

  const toggleTag = (tagId) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tagId) 
        ? prev.tags.filter(t => t !== tagId)
        : [...prev.tags, tagId]
    }));
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = 
      activity.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.prospectName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || activity.type === filterType;
    const matchesProspect = filterProspect === 'all' || activity.prospectId === filterProspect;
    return matchesSearch && matchesType && matchesProspect;
  });

  // Group by date
  const groupedActivities = filteredActivities.reduce((groups, activity) => {
    const date = activity.createdAt?.toDate?.()?.toDateString() || 'Unknown';
    if (!groups[date]) groups[date] = [];
    groups[date].push(activity);
    return groups;
  }, {});

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="w-8 h-8 animate-spin text-corporate-teal" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-corporate-navy">Meeting Notes & Activities</h1>
          <p className="text-slate-500 mt-1">Log calls, meetings, and follow-ups for all prospects</p>
        </div>
        <button 
          onClick={() => {
            resetForm();
            setEditingActivity(null);
            setShowNewActivity(true);
          }}
          className="bg-corporate-teal text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-teal-600"
        >
          <Plus size={18} /> Log Activity
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        {Object.entries(ACTIVITY_TYPES).map(([key, type]) => {
          const count = activities.filter(a => a.type === key).length;
          const Icon = type.icon;
          return (
            <div 
              key={key}
              onClick={() => setFilterType(filterType === key ? 'all' : key)}
              className={`bg-white rounded-xl border shadow-sm p-4 cursor-pointer transition ${
                filterType === key ? 'border-corporate-teal ring-2 ring-corporate-teal/20' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${type.bg} flex items-center justify-center`}>
                  <Icon className={type.color} size={20} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-800">{count}</div>
                  <div className="text-xs text-slate-500">{type.label}s</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg"
            />
          </div>
          <select
            value={filterProspect}
            onChange={(e) => setFilterProspect(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm"
          >
            <option value="all">All Prospects</option>
            {prospects.map(p => (
              <option key={p.id} value={p.id}>{p.company}</option>
            ))}
          </select>
          <button 
            onClick={fetchData}
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        {Object.entries(groupedActivities).length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
            <MessageSquare className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <h3 className="font-medium text-slate-600 mb-1">No activities yet</h3>
            <p className="text-sm text-slate-400">Log your first meeting or call to get started</p>
          </div>
        ) : (
          Object.entries(groupedActivities).map(([date, dayActivities]) => (
            <div key={date}>
              <div className="flex items-center gap-4 mb-4">
                <div className="text-sm font-medium text-slate-500">{date}</div>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
              <div className="space-y-3">
                {dayActivities.map(activity => {
                  const typeInfo = ACTIVITY_TYPES[activity.type] || ACTIVITY_TYPES.note;
                  const Icon = typeInfo.icon;
                  return (
                    <div 
                      key={activity.id}
                      className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:shadow-md transition group"
                    >
                      <div className="flex gap-4">
                        <div className={`w-10 h-10 rounded-lg ${typeInfo.bg} flex items-center justify-center flex-shrink-0`}>
                          <Icon className={typeInfo.color} size={20} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium text-slate-800">{activity.title || `${typeInfo.label} with ${activity.prospectName}`}</h4>
                              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                                <span className="flex items-center gap-1">
                                  <Clock size={12} /> {activity.duration || 0} min
                                </span>
                                <span className="flex items-center gap-1">
                                  <Target size={12} /> {activity.prospectName || 'General'}
                                </span>
                                {activity.attendees && (
                                  <span className="flex items-center gap-1">
                                    <Users size={12} /> {activity.attendees}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                              <button 
                                onClick={() => handleEdit(activity)}
                                className="p-1.5 hover:bg-slate-100 rounded"
                              >
                                <Edit size={14} className="text-slate-400" />
                              </button>
                              <button 
                                onClick={() => handleDelete(activity.id)}
                                className="p-1.5 hover:bg-red-50 rounded"
                              >
                                <Trash2 size={14} className="text-red-400" />
                              </button>
                            </div>
                          </div>
                          {activity.notes && (
                            <p className="text-sm text-slate-600 mt-3 whitespace-pre-wrap">{activity.notes}</p>
                          )}
                          {activity.tags?.length > 0 && (
                            <div className="flex gap-2 mt-3">
                              {activity.tags.map(tagId => {
                                const tag = TAGS.find(t => t.id === tagId);
                                return tag ? (
                                  <span key={tagId} className={`text-xs px-2 py-0.5 rounded-full ${tag.color}`}>
                                    {tag.name}
                                  </span>
                                ) : null;
                              })}
                            </div>
                          )}
                          {activity.followUpDate && (
                            <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-amber-600 flex items-center gap-1">
                              <Calendar size={12} /> Follow-up: {activity.followUpDate}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Activity Modal */}
      {showNewActivity && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-corporate-navy">
                  {editingActivity ? 'Edit Activity' : 'Log New Activity'}
                </h3>
                <button 
                  onClick={() => {
                    setShowNewActivity(false);
                    setEditingActivity(null);
                  }}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Activity Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Activity Type</label>
                <div className="flex gap-2">
                  {Object.entries(ACTIVITY_TYPES).map(([key, type]) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setFormData({ ...formData, type: key })}
                        className={`flex-1 py-2 px-3 rounded-lg border text-sm flex items-center justify-center gap-2 transition ${
                          formData.type === key 
                            ? `${type.bg} ${type.color} border-transparent` 
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <Icon size={16} />
                        {type.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                  placeholder="Quick sync about pricing"
                />
              </div>

              {/* Prospect */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Prospect</label>
                <select
                  value={formData.prospectId}
                  onChange={(e) => setFormData({ ...formData, prospectId: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                >
                  <option value="">Select prospect...</option>
                  {prospects.map(p => (
                    <option key={p.id} value={p.id}>{p.company}</option>
                  ))}
                </select>
              </div>

              {/* Duration & Attendees */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Duration (min)</label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Attendees</label>
                  <input
                    type="text"
                    value={formData.attendees}
                    onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                    placeholder="John, Sarah"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg h-32 resize-none"
                  placeholder="Meeting notes, key takeaways, action items..."
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {TAGS.map(tag => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`text-xs px-3 py-1 rounded-full border transition ${
                        formData.tags.includes(tag.id) 
                          ? tag.color + ' border-transparent' 
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Follow-up */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Follow-up Date</label>
                <input
                  type="date"
                  value={formData.followUpDate}
                  onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewActivity(false);
                    setEditingActivity(null);
                  }}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-corporate-teal text-white rounded-lg hover:bg-teal-600 flex items-center justify-center gap-2"
                >
                  <Save size={16} />
                  {editingActivity ? 'Update' : 'Save Activity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingNotes;
