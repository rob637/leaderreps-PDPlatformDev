import React, { useState, useEffect } from 'react';
import { useAppServices } from '../../services/useAppServices';
import { 
  collection, query, orderBy, onSnapshot, getDocs,
  doc, setDoc, updateDoc, deleteDoc, serverTimestamp 
} from 'firebase/firestore';
import { Card, Button } from '../ui';
import { 
  Megaphone, Plus, Edit2, Trash2, Save, X, 
  AlertTriangle, Info, CheckCircle, Bell,
  Calendar, Eye, EyeOff, ExternalLink, Users
} from 'lucide-react';

/**
 * AnnouncementsManager - Admin interface for posting announcements to the dashboard
 * 
 * Announcements appear in the NotificationsWidget on user dashboards.
 * Supports different types (alert, info, success, announcement), date ranges, 
 * priority ordering, and dismissibility.
 */

const ANNOUNCEMENT_TYPES = [
  { id: 'announcement', label: 'Announcement', icon: Megaphone, color: 'orange' },
  { id: 'info', label: 'Information', icon: Info, color: 'blue' },
  { id: 'success', label: 'Success/Celebration', icon: CheckCircle, color: 'green' },
  { id: 'alert', label: 'Important Alert', icon: AlertTriangle, color: 'red' }
];

const AnnouncementsManager = () => {
  const { db } = useAppServices();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [cohorts, setCohorts] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'announcement',
    priority: 0,
    active: true,
    dismissible: true,
    link: '',
    startDate: '',
    endDate: '',
    targetCohortId: ''
  });
  const [saving, setSaving] = useState(false);

  // Fetch announcements
  useEffect(() => {
    if (!db) return;

    const announcementsRef = collection(db, 'announcements');
    const q = query(announcementsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          startDate: data.startDate?.toDate?.() || data.startDate,
          endDate: data.endDate?.toDate?.() || data.endDate
        });
      });
      setAnnouncements(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db]);

  // Fetch cohorts for targeting
  useEffect(() => {
    if (!db) return;
    const loadCohorts = async () => {
      try {
        const cohortsRef = collection(db, 'cohorts');
        const q = query(cohortsRef, orderBy('startDate', 'desc'));
        const snapshot = await getDocs(q);
        const items = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...docSnap.data() });
        });
        setCohorts(items);
      } catch (err) {
        console.error('Error loading cohorts:', err);
      }
    };
    loadCohorts();
  }, [db]);

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      type: 'announcement',
      priority: 0,
      active: true,
      dismissible: true,
      link: '',
      startDate: '',
      endDate: '',
      targetCohortId: ''
    });
    setEditingId(null);
  };

  const handleEdit = (announcement) => {
    setEditingId(announcement.id);
    setFormData({
      title: announcement.title || '',
      message: announcement.message || '',
      type: announcement.type || 'announcement',
      priority: announcement.priority || 0,
      active: announcement.active !== false,
      dismissible: announcement.dismissible !== false,
      link: announcement.link || '',
      startDate: announcement.startDate ? new Date(announcement.startDate).toISOString().split('T')[0] : '',
      endDate: announcement.endDate ? new Date(announcement.endDate).toISOString().split('T')[0] : '',
      targetCohortId: announcement.targetCohortId || ''
    });
  };

  const handleSave = async () => {
    if (!db || !formData.title.trim()) return;

    setSaving(true);
    try {
      const data = {
        title: formData.title.trim(),
        message: formData.message.trim(),
        type: formData.type,
        priority: parseInt(formData.priority) || 0,
        active: formData.active,
        dismissible: formData.dismissible,
        link: formData.link.trim() || null,
        startDate: formData.startDate ? new Date(formData.startDate) : null,
        endDate: formData.endDate ? new Date(formData.endDate) : null,
        targetCohortId: formData.targetCohortId || null,
        updatedAt: serverTimestamp()
      };

      if (editingId) {
        // Update existing
        await updateDoc(doc(db, 'announcements', editingId), data);
      } else {
        // Create new
        const newId = `ann_${Date.now()}`;
        await setDoc(doc(db, 'announcements', newId), {
          ...data,
          createdAt: serverTimestamp()
        });
      }

      resetForm();
    } catch (error) {
      console.error('Error saving announcement:', error);
      alert('Error saving announcement: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this announcement?')) return;
    
    try {
      await deleteDoc(doc(db, 'announcements', id));
    } catch (error) {
      console.error('Error deleting announcement:', error);
      alert('Error deleting: ' + error.message);
    }
  };

  const handleToggleActive = async (announcement) => {
    try {
      await updateDoc(doc(db, 'announcements', announcement.id), {
        active: !announcement.active,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error toggling announcement:', error);
    }
  };

  const getTypeConfig = (typeId) => {
    return ANNOUNCEMENT_TYPES.find(t => t.id === typeId) || ANNOUNCEMENT_TYPES[0];
  };

  const getTypeColorClasses = (color) => {
    const colors = {
      orange: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
      blue: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
      green: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
      red: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
    };
    return colors[color] || colors.orange;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-corporate-orange/10 flex items-center justify-center">
            <Megaphone className="w-5 h-5 text-corporate-orange" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Announcements</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Post announcements visible on user dashboards
            </p>
          </div>
        </div>
      </div>

      {/* Create/Edit Form */}
      <Card className="p-5 bg-white dark:bg-slate-800">
        <h3 className="font-semibold text-slate-800 dark:text-white mb-4">
          {editingId ? 'Edit Announcement' : 'Create New Announcement'}
        </h3>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Brief announcement title"
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg 
                       bg-white dark:bg-slate-900 text-slate-800 dark:text-white
                       focus:ring-2 focus:ring-corporate-teal focus:border-transparent"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Message (optional)
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Additional details..."
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg 
                       bg-white dark:bg-slate-900 text-slate-800 dark:text-white
                       focus:ring-2 focus:ring-corporate-teal focus:border-transparent resize-none"
            />
          </div>

          {/* Type & Priority & Cohort Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg 
                         bg-white dark:bg-slate-900 text-slate-800 dark:text-white
                         focus:ring-2 focus:ring-corporate-teal focus:border-transparent"
              >
                {ANNOUNCEMENT_TYPES.map(type => (
                  <option key={type.id} value={type.id}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Target Cohort
              </label>
              <select
                value={formData.targetCohortId}
                onChange={(e) => setFormData(prev => ({ ...prev, targetCohortId: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg 
                         bg-white dark:bg-slate-900 text-slate-800 dark:text-white
                         focus:ring-2 focus:ring-corporate-teal focus:border-transparent"
              >
                <option value="">All Cohorts</option>
                {cohorts.map(c => (
                  <option key={c.id} value={c.id}>{c.name || c.id}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Priority (higher = shown first)
              </label>
              <input
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                min="0"
                max="100"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg 
                         bg-white dark:bg-slate-900 text-slate-800 dark:text-white
                         focus:ring-2 focus:ring-corporate-teal focus:border-transparent"
              />
            </div>
          </div>

          {/* Date Range Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Start Date (optional)
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg 
                         bg-white dark:bg-slate-900 text-slate-800 dark:text-white
                         focus:ring-2 focus:ring-corporate-teal focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                End Date (optional)
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg 
                         bg-white dark:bg-slate-900 text-slate-800 dark:text-white
                         focus:ring-2 focus:ring-corporate-teal focus:border-transparent"
              />
            </div>
          </div>

          {/* Link */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Link URL (optional)
            </label>
            <input
              type="url"
              value={formData.link}
              onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
              placeholder="https://..."
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg 
                       bg-white dark:bg-slate-900 text-slate-800 dark:text-white
                       focus:ring-2 focus:ring-corporate-teal focus:border-transparent"
            />
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                className="w-4 h-4 rounded border-slate-300 text-corporate-teal focus:ring-corporate-teal"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">Active (visible to users)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.dismissible}
                onChange={(e) => setFormData(prev => ({ ...prev, dismissible: e.target.checked }))}
                className="w-4 h-4 rounded border-slate-300 text-corporate-teal focus:ring-corporate-teal"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">Users can dismiss</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving || !formData.title.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-corporate-teal text-white rounded-lg
                       hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : editingId ? 'Update' : 'Create Announcement'}
            </button>
            {editingId && (
              <button
                onClick={resetForm}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600
                         text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Existing Announcements */}
      <Card className="p-5 bg-white dark:bg-slate-800">
        <h3 className="font-semibold text-slate-800 dark:text-white mb-4">
          All Announcements ({announcements.length})
        </h3>

        {loading ? (
          <div className="text-center py-8 text-slate-500">Loading...</div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            No announcements yet. Create one above!
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((announcement) => {
              const typeConfig = getTypeConfig(announcement.type);
              const TypeIcon = typeConfig.icon;
              const isActive = announcement.active;
              
              return (
                <div 
                  key={announcement.id}
                  className={`p-4 rounded-xl border ${
                    isActive 
                      ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700' 
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`p-2 rounded-lg ${getTypeColorClasses(typeConfig.color)}`}>
                        <TypeIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="font-medium text-slate-800 dark:text-white">
                            {announcement.title}
                          </p>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            isActive 
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                              : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                          }`}>
                            {isActive ? 'Active' : 'Inactive'}
                          </span>
                          {announcement.priority > 0 && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                              Priority: {announcement.priority}
                            </span>
                          )}
                          {announcement.targetCohortId && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {cohorts.find(c => c.id === announcement.targetCohortId)?.name || announcement.targetCohortId}
                            </span>
                          )}
                        </div>
                        {announcement.message && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                            {announcement.message}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-500">
                          {announcement.createdAt && (
                            <span>
                              Created: {new Date(announcement.createdAt).toLocaleDateString()}
                            </span>
                          )}
                          {announcement.startDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              From: {new Date(announcement.startDate).toLocaleDateString()}
                            </span>
                          )}
                          {announcement.endDate && (
                            <span>
                              Until: {new Date(announcement.endDate).toLocaleDateString()}
                            </span>
                          )}
                          {announcement.link && (
                            <a 
                              href={announcement.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-corporate-teal hover:underline"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Link
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleActive(announcement)}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        title={isActive ? 'Deactivate' : 'Activate'}
                      >
                        {isActive ? (
                          <Eye className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                      <button
                        onClick={() => handleEdit(announcement)}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      </button>
                      <button
                        onClick={() => handleDelete(announcement.id)}
                        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

export default AnnouncementsManager;
