// src/components/widgets/NotificationSetupWidget.jsx
// Prep-phase widget for notification setup - matches LeaderProfileWidget/BaselineAssessmentWidget pattern
import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, ChevronRight, Zap, Shield, Clock } from 'lucide-react';
import { Card } from '../ui';
import { useAppServices } from '../../services/useAppServices';
import { doc, getDoc } from 'firebase/firestore';
import NotificationPreferencesWidget from './NotificationPreferencesWidget';

/**
 * Notification Setup Widget for Dashboard / Prep Phase
 * Shows during Prep Phase to encourage notification setup
 */
const NotificationSetupWidget = () => {
  const { user, db } = useAppServices();
  const [loading, setLoading] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [settings, setSettings] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Load notification settings to check completion
  useEffect(() => {
    const loadSettings = async () => {
      if (!user || !db) {
        setLoading(false);
        return;
      }
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          const ns = data.notificationSettings;
          // Only consider complete if prepStatus.notifications is set
          // Previously checked ns.strategy but that was triggered by defaults from Leader Profile
          if (data.prepStatus?.notifications) {
            setSettings(ns);
            setIsComplete(true);
          } else if (ns && ns.strategy) {
            // Has settings but not explicitly completed - show partial state
            setSettings(ns);
          }
        }
      } catch (error) {
        console.error('Error loading notification settings:', error);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, [user, db]);

  const handleComplete = () => {
    setShowForm(false);
    setIsComplete(true);
  };

  if (loading) {
    return (
      <Card accent="TEAL" className="animate-pulse">
        <div className="h-24 bg-slate-100 dark:bg-slate-700 rounded-lg" />
      </Card>
    );
  }

  // Notification setup is complete - show success state
  if (isComplete) {
    const strategyNames = {
      smart_escalation: 'Smart Escalation',
      push_only: 'Push Only',
      full_accountability: 'Full Accountability',
      email_only: 'Email Only',
      disabled: 'Notifications Off'
    };
    const strategyName = strategyNames[settings?.strategy] || 'Smart Escalation';

    return (
      <>
        <Card accent="TEAL">
          <div className="flex items-center gap-4 p-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-corporate-navy dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                Notifications Configured
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400" style={{ fontFamily: 'var(--font-body)' }}>
                {strategyName} — reminders are ready to keep you on track.
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="text-sm font-medium text-corporate-teal hover:text-corporate-teal/80 hover:underline transition-colors"
            >
              View or Update
            </button>
          </div>
        </Card>

        {/* Modal for editing */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 pb-safe bg-black/50 backdrop-blur-sm overflow-y-auto">
            <div className="relative w-full max-w-xl my-auto">
              <NotificationPreferencesWidget 
                onComplete={handleComplete}
                onClose={() => setShowForm(false)}
              />
            </div>
          </div>
        )}
      </>
    );
  }

  // Notification setup incomplete - show CTA
  return (
    <>
      <Card accent="ORANGE">
        <div className="p-4">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="w-12 h-12 bg-corporate-orange/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Bell className="w-6 h-6 text-corporate-orange" />
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-corporate-navy dark:text-white mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
                Set Up Notifications
              </h3>
              
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-3" style={{ fontFamily: 'var(--font-body)' }}>
                Choose how you want to be reminded. Smart escalation helps you build habits.
              </p>

              {/* Benefits */}
              <div className="flex flex-wrap gap-2 mb-4">
                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-full">
                  <Zap className="w-3 h-3 text-corporate-orange" />
                  Smart reminders
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-full">
                  <Shield className="w-3 h-3 text-corporate-teal" />
                  Accountability
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-full">
                  <Clock className="w-3 h-3 text-corporate-navy" />
                  ~1 min
                </div>
              </div>

              {/* CTA Button */}
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center justify-center gap-2 px-5 py-2.5 
                  bg-corporate-orange hover:bg-corporate-orange/90
                  text-white font-semibold rounded-lg shadow-sm hover:shadow 
                  transition-all text-sm"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Configure Notifications
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 pb-safe bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-xl my-auto">
            <NotificationPreferencesWidget 
              onComplete={handleComplete}
              onClose={() => setShowForm(false)}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default NotificationSetupWidget;
