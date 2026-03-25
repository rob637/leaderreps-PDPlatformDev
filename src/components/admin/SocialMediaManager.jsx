// src/components/admin/SocialMediaManager.jsx
// Admin panel for managing social media monitoring subscriptions

import React, { useState, useEffect } from 'react';
import {
  Mail, Plus, Trash2, Edit2, Save, X, Check,
  Globe, MessageSquare, BookOpen, Code, HelpCircle,
  Rss, Rocket, Clock, Calendar, Users, Play, Send,
  AlertCircle, CheckCircle,
} from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useAppServices } from '../../services/useAppServices';

// Available platforms to monitor
const PLATFORMS = [
  { id: 'reddit', label: 'Reddit', icon: MessageSquare, description: 'Leadership subreddits' },
  { id: 'hackernews', label: 'Hacker News', icon: Globe, description: 'Tech leadership discussions' },
  { id: 'medium', label: 'Medium', icon: BookOpen, description: 'Leadership articles' },
  { id: 'devto', label: 'Dev.to', icon: Code, description: 'Tech career content' },
  { id: 'stackexchange', label: 'Stack Exchange', icon: HelpCircle, description: 'Workplace Q&A' },
  { id: 'rss', label: 'Leadership Blogs', icon: Rss, description: 'HBR, First Round, etc.' },
  { id: 'indiehackers', label: 'Indie Hackers', icon: Rocket, description: 'Startup leadership' },
];

// Frequency options
const FREQUENCIES = [
  { id: 'daily', label: 'Once Daily', description: 'Single digest each day' },
  { id: 'twice-daily', label: 'Twice Daily', description: 'Morning & evening digest' },
  { id: 'weekly', label: 'Weekly Summary', description: 'Weekend rollup' },
];

// Time options (for delivery)
const TIMES = [
  '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
  '6:00 PM', '7:00 PM', '8:00 PM',
];

const COLLECTION_PATH = 'config/social-monitor-subscriptions';

const SocialMediaManager = () => {
  const { db } = useAppServices();
  
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    platforms: ['reddit', 'hackernews', 'stackexchange'],
    frequency: 'daily',
    deliveryTime: '8:00 AM',
    enabled: true,
  });

  // Load subscriptions from Firestore
  useEffect(() => {
    const loadSubscriptions = async () => {
      try {
        const docRef = doc(db, COLLECTION_PATH);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSubscriptions(data.subscriptions || []);
        }
      } catch (error) {
        console.error('Error loading subscriptions:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadSubscriptions();
  }, [db]);

  // Save subscriptions to Firestore
  const saveSubscriptions = async (newSubscriptions) => {
    setSaving(true);
    try {
      const docRef = doc(db, COLLECTION_PATH);
      await setDoc(docRef, {
        subscriptions: newSubscriptions,
        updatedAt: new Date().toISOString(),
      });
      setSubscriptions(newSubscriptions);
    } catch (error) {
      console.error('Error saving subscriptions:', error);
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Run monitor now
  const handleRunNow = async (forceResendParam) => {
    // Ensure forceResend is a boolean (not an event object from onClick)
    const forceResend = forceResendParam === true;
    
    setRunning(true);
    setRunResult(null);
    
    try {
      // Get auth token for the current user
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        throw new Error('You must be logged in to run the monitor');
      }
      const token = await user.getIdToken();
      
      // Get project ID from the current Firebase app
      const projectId = auth.app.options.projectId;
      const functionUrl = `https://us-central1-${projectId}.cloudfunctions.net/runSocialMediaMonitor`;
      
      // Call the function directly via fetch
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          data: { testMode: false, forceResend }
        }),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error?.message || responseData.message || 'Function call failed');
      }
      
      const { postsFound, newPosts, emailsSent, recipients } = responseData.result || responseData;
      
      let message;
      if (newPosts === 0) {
        message = `Found ${postsFound} posts, but all have already been sent. Click "Force Resend" to send again.`;
      } else if (newPosts < postsFound) {
        message = `Found ${postsFound} posts total, ${newPosts} new. Sent to ${emailsSent} recipient(s): ${recipients?.join(', ')}`;
      } else {
        message = `Found ${newPosts} new posts. Sent to ${emailsSent} recipient(s): ${recipients?.join(', ')}`;
      }
      
      setRunResult({
        success: newPosts > 0,
        message,
        data: responseData.result || responseData,
        noNewPosts: newPosts === 0,
      });
    } catch (error) {
      console.error('Error running monitor:', error);
      setRunResult({
        success: false,
        message: error.message || 'Failed to run monitor',
      });
    } finally {
      setRunning(false);
    }
  };

  // Add new subscription
  const handleAdd = async () => {
    if (!formData.email || !formData.email.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }
    
    // Check for duplicate email
    if (subscriptions.some(s => s.email.toLowerCase() === formData.email.toLowerCase())) {
      alert('This email is already subscribed');
      return;
    }
    
    const newSub = {
      id: Date.now().toString(),
      ...formData,
      createdAt: new Date().toISOString(),
    };
    
    await saveSubscriptions([...subscriptions, newSub]);
    resetForm();
  };

  // Update existing subscription
  const handleUpdate = async () => {
    const updated = subscriptions.map(sub =>
      sub.id === editingId ? { ...sub, ...formData } : sub
    );
    await saveSubscriptions(updated);
    resetForm();
  };

  // Delete subscription
  const handleDelete = async (id) => {
    if (!confirm('Remove this subscription?')) return;
    const filtered = subscriptions.filter(s => s.id !== id);
    await saveSubscriptions(filtered);
  };

  // Toggle enabled status
  const handleToggle = async (id) => {
    const updated = subscriptions.map(sub =>
      sub.id === id ? { ...sub, enabled: !sub.enabled } : sub
    );
    await saveSubscriptions(updated);
  };

  // Start editing
  const startEdit = (sub) => {
    setFormData({
      email: sub.email,
      platforms: sub.platforms,
      frequency: sub.frequency,
      deliveryTime: sub.deliveryTime,
      enabled: sub.enabled,
    });
    setEditingId(sub.id);
    setShowAddForm(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      email: '',
      platforms: ['reddit', 'hackernews', 'stackexchange'],
      frequency: 'daily',
      deliveryTime: '8:00 AM',
      enabled: true,
    });
    setEditingId(null);
    setShowAddForm(false);
  };

  // Toggle platform selection
  const togglePlatform = (platformId) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platformId)
        ? prev.platforms.filter(p => p !== platformId)
        : [...prev.platforms, platformId],
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-corporate-teal"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-corporate-navy dark:text-white flex items-center gap-2">
            <Globe className="w-6 h-6 text-corporate-teal" />
            Social Media Monitor
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure email digests for leadership content across social platforms
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Run Now Button */}
          <button
            onClick={handleRunNow}
            disabled={running}
            className="flex items-center gap-2 px-4 py-2 bg-corporate-orange text-white rounded-lg hover:bg-corporate-orange/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {running ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Running...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run Now
              </>
            )}
          </button>
          
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-corporate-teal text-white rounded-lg hover:bg-corporate-teal/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Subscription
            </button>
          )}
        </div>
      </div>

      {/* Run Result Feedback */}
      {runResult && (
        <div className={`rounded-lg p-4 ${
          runResult.noNewPosts
            ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
            : runResult.success 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
        }`}>
          <div className="flex items-start gap-3">
            {runResult.noNewPosts ? (
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            ) : runResult.success ? (
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            )}
            <div className={`flex-1 text-sm ${
              runResult.noNewPosts
                ? 'text-amber-800 dark:text-amber-200'
                : runResult.success 
                  ? 'text-green-800 dark:text-green-200' 
                  : 'text-red-800 dark:text-red-200'
            }`}>
              <p className="font-medium">
                {runResult.noNewPosts ? 'No New Posts' : runResult.success ? 'Monitor Complete' : 'Monitor Failed'}
              </p>
              <p className="mt-1">{runResult.message}</p>
              {runResult.noNewPosts && (
                <button
                  onClick={() => handleRunNow(true)}
                  disabled={running}
                  className="mt-2 text-xs px-3 py-1 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors disabled:opacity-50"
                >
                  Force Resend All
                </button>
              )}
            </div>
            <button
              onClick={() => setRunResult(null)}
              className="ml-auto text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex gap-3">
          <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium">How it works</p>
            <p className="mt-1 text-blue-700 dark:text-blue-300">
              The monitor scans 7 platforms for leadership discussions. Each subscriber receives 
              ONE consolidated email with all matched posts organized by platform, plus AI-generated 
              response suggestions featuring LeaderReps and the Coaching the Coaches webinar.
            </p>
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-corporate-navy dark:text-white">
              {editingId ? 'Edit Subscription' : 'New Subscription'}
            </h3>
            <button
              onClick={resetForm}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="name@company.com"
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-corporate-teal focus:border-transparent"
              />
            </div>

            {/* Platforms */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                Platforms to Monitor
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {PLATFORMS.map((platform) => {
                  const Icon = platform.icon;
                  const isSelected = formData.platforms.includes(platform.id);
                  return (
                    <button
                      key={platform.id}
                      onClick={() => togglePlatform(platform.id)}
                      className={`
                        flex items-start gap-3 p-3 rounded-lg border-2 text-left transition-all
                        ${isSelected
                          ? 'border-corporate-teal bg-corporate-teal/5'
                          : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'}
                      `}
                    >
                      <div className={`
                        w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                        ${isSelected ? 'bg-corporate-teal text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}
                      `}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-slate-900 dark:text-white text-sm">
                          {platform.label}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {platform.description}
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-corporate-teal flex-shrink-0 ml-auto" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Frequency & Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Frequency */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Frequency
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-corporate-teal"
                >
                  {FREQUENCIES.map((freq) => (
                    <option key={freq.id} value={freq.id}>
                      {freq.label} — {freq.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Delivery Time */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Delivery Time
                </label>
                <select
                  value={formData.deliveryTime}
                  onChange={(e) => setFormData({ ...formData, deliveryTime: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-corporate-teal"
                >
                  {TIMES.map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={resetForm}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingId ? handleUpdate : handleAdd}
                disabled={saving || formData.platforms.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-corporate-teal text-white rounded-lg hover:bg-corporate-teal/90 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {editingId ? 'Update' : 'Add'} Subscription
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subscriptions List */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-slate-400" />
          <h3 className="font-semibold text-slate-700 dark:text-slate-300">
            Active Subscriptions ({subscriptions.length})
          </h3>
        </div>

        {subscriptions.length === 0 ? (
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 p-8 text-center">
            <Mail className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400">No subscriptions yet</p>
            <p className="text-sm text-slate-400 dark:text-slate-500">
              Add team members to receive leadership content digests
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {subscriptions.map((sub) => (
              <div
                key={sub.id}
                className={`
                  bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4
                  ${!sub.enabled ? 'opacity-60' : ''}
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-corporate-teal/10 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-corporate-teal" />
                    </div>
                    
                    <div>
                      {/* Email */}
                      <div className="font-medium text-slate-900 dark:text-white">
                        {sub.email}
                      </div>
                      
                      {/* Meta */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {FREQUENCIES.find(f => f.id === sub.frequency)?.label || sub.frequency}
                          {' at '}
                          {sub.deliveryTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <Globe className="w-3.5 h-3.5" />
                          {sub.platforms.length} platforms
                        </span>
                      </div>
                      
                      {/* Platform badges */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {sub.platforms.map((platformId) => {
                          const platform = PLATFORMS.find(p => p.id === platformId);
                          if (!platform) return null;
                          const Icon = platform.icon;
                          return (
                            <span
                              key={platformId}
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-xs"
                            >
                              <Icon className="w-3 h-3" />
                              {platform.label}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {/* Toggle */}
                    <button
                      onClick={() => handleToggle(sub.id)}
                      className={`
                        relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                        ${sub.enabled ? 'bg-corporate-teal' : 'bg-slate-300 dark:bg-slate-600'}
                      `}
                      title={sub.enabled ? 'Disable' : 'Enable'}
                    >
                      <span
                        className={`
                          inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                          ${sub.enabled ? 'translate-x-6' : 'translate-x-1'}
                        `}
                      />
                    </button>
                    
                    {/* Edit */}
                    <button
                      onClick={() => startEdit(sub)}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4 text-slate-400" />
                    </button>
                    
                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(sub.id)}
                      className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer note */}
      <div className="text-xs text-slate-400 dark:text-slate-500 pt-4 border-t border-slate-200 dark:border-slate-700">
        <p>
          Note: The social media monitor runs on a scheduled Cloud Function. 
          Changes here update the subscription list that the function reads.
        </p>
      </div>
    </div>
  );
};

export default SocialMediaManager;
