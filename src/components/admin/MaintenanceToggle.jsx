// src/components/admin/MaintenanceToggle.jsx
// Admin control for maintenance mode

import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Wrench, Shield, Save, Plus, X, AlertTriangle } from 'lucide-react';
import { useAppServices } from '../../services/useAppServices';

/**
 * Admin component to toggle maintenance mode on/off and manage bypass emails.
 * 
 * Controls config/maintenance document:
 * {
 *   enabled: boolean,
 *   message: string,
 *   bypassEmails: string[]
 * }
 */
export default function MaintenanceToggle() {
  const { db } = useAppServices();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState('');
  const [bypassEmails, setBypassEmails] = useState(['rob@sagecg.com']);
  const [newEmail, setNewEmail] = useState('');
  const [lastSaved, setLastSaved] = useState(null);

  // Load current maintenance settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const maintenanceRef = doc(db, 'config', 'maintenance');
        const snapshot = await getDoc(maintenanceRef);
        
        if (snapshot.exists()) {
          const data = snapshot.data();
          setEnabled(data.enabled || false);
          setMessage(data.message || '');
          setBypassEmails(data.bypassEmails || ['rob@sagecg.com']);
        }
      } catch (error) {
        console.error('Error loading maintenance settings:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, [db]);

  // Save settings
  const handleSave = async () => {
    setSaving(true);
    try {
      const maintenanceRef = doc(db, 'config', 'maintenance');
      await setDoc(maintenanceRef, {
        enabled,
        message,
        bypassEmails,
        updatedAt: new Date()
      });
      setLastSaved(new Date());
    } catch (error) {
      console.error('Error saving maintenance settings:', error);
      alert('Failed to save settings: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Add email to bypass list
  const handleAddEmail = () => {
    const email = newEmail.trim().toLowerCase();
    if (email && !bypassEmails.includes(email)) {
      setBypassEmails([...bypassEmails, email]);
      setNewEmail('');
    }
  };

  // Remove email from bypass list
  const handleRemoveEmail = (emailToRemove) => {
    // Don't allow removing rob@sagecg.com (primary admin)
    if (emailToRemove === 'rob@sagecg.com') {
      alert('Cannot remove primary admin email');
      return;
    }
    setBypassEmails(bypassEmails.filter(e => e !== emailToRemove));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-corporate-teal"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
          <Wrench className="w-6 h-6 text-orange-600 dark:text-orange-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-corporate-navy dark:text-white">
            Maintenance Mode
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Control app access during maintenance
          </p>
        </div>
      </div>

      {/* Warning Banner */}
      {enabled && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800 dark:text-red-300">Maintenance Mode is ACTIVE</p>
            <p className="text-sm text-red-600 dark:text-red-400">
              All users except those in the bypass list are blocked from accessing the app.
            </p>
          </div>
        </div>
      )}

      {/* Main Toggle */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-corporate-navy dark:text-white">
              Enable Maintenance Mode
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Block all users from accessing the app
            </p>
          </div>
          <button
            onClick={() => setEnabled(!enabled)}
            className={`
              relative inline-flex h-8 w-14 items-center rounded-full transition-colors
              ${enabled ? 'bg-red-500' : 'bg-slate-300 dark:bg-slate-600'}
            `}
          >
            <span
              className={`
                inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform
                ${enabled ? 'translate-x-7' : 'translate-x-1'}
              `}
            />
          </button>
        </div>

        {/* Custom Message */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Custom Message (optional)
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="We're performing scheduled maintenance to improve your experience. We'll be back shortly!"
            rows={3}
            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-corporate-teal focus:border-transparent"
          />
        </div>
      </div>

      {/* Bypass Emails */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-corporate-teal" />
          <h3 className="font-semibold text-corporate-navy dark:text-white">
            Bypass Emails
          </h3>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          These users can access the app even when maintenance mode is active.
        </p>

        {/* Email List */}
        <div className="space-y-2 mb-4">
          {bypassEmails.map((email) => (
            <div
              key={email}
              className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-700 rounded-lg"
            >
              <span className="text-sm text-slate-700 dark:text-slate-300">{email}</span>
              {email !== 'rob@sagecg.com' && (
                <button
                  onClick={() => handleRemoveEmail(email)}
                  className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {email === 'rob@sagecg.com' && (
                <span className="text-xs text-slate-400 dark:text-slate-500">Primary admin</span>
              )}
            </div>
          ))}
        </div>

        {/* Add Email */}
        <div className="flex gap-2">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddEmail()}
            placeholder="Add email to bypass list..."
            className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-corporate-teal focus:border-transparent"
          />
          <button
            onClick={handleAddEmail}
            className="px-4 py-2 bg-corporate-teal text-white rounded-lg hover:bg-corporate-teal/90 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between">
        <div>
          {lastSaved && (
            <p className="text-sm text-green-600 dark:text-green-400">
              ✓ Saved at {lastSaved.toLocaleTimeString()}
            </p>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-corporate-navy dark:bg-corporate-teal text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
}
