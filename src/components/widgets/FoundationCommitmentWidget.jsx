/**
 * FoundationCommitmentWidget - Commitment acknowledgment for Foundation program
 * 
 * Displays the Foundation Expectations and allows users to acknowledge and commit
 * to the program requirements before starting.
 * 
 * Styled to match LeaderProfileFormSimple, BaselineAssessmentSimple, and NotificationPreferencesWidget.
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckCircle, 
  FileSignature, 
  AlertTriangle,
  Target,
  Users,
  X,
  Loader
} from 'lucide-react';
import { Button } from '../ui';
import { useAppServices } from '../../services/useAppServices';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

export default function FoundationCommitmentWidget({ onComplete, onClose, isModal = true }) {
  const { db, user } = useAppServices();
  const formRef = useRef(null);
  
  const [acknowledged, setAcknowledged] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);

  // Scroll to top when form mounts
  useEffect(() => {
    if (formRef.current) {
      formRef.current.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  }, []);

  // Load existing commitment if any
  useEffect(() => {
    const loadCommitment = async () => {
      if (!user || !db) return;
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          if (data.foundationCommitment?.acknowledged) {
            setAlreadyCompleted(true);
            setAcknowledged(true);
            setName(data.foundationCommitment.name || user.displayName || '');
          } else {
            // Pre-populate name from user profile
            setName(user.displayName || '');
          }
        }
      } catch (error) {
        console.error('Error loading commitment:', error);
      }
    };
    loadCommitment();
  }, [user, db]);

  const handleSubmit = async () => {
    if (!acknowledged || !name.trim() || !user || !db) return;
    
    setSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        foundationCommitment: {
          acknowledged: true,
          name: name.trim(),
          acknowledgedAt: new Date().toISOString()
        },
        'prepStatus.foundationCommitment': true
      });
      
      setShowSuccess(true);
      setTimeout(() => {
        if (onComplete) {
          onComplete();
        } else if (onClose) {
          onClose();
        }
      }, 1500);
    } catch (error) {
      console.error('Error saving commitment:', error);
    } finally {
      setSaving(false);
    }
  };

  // Success state
  if (showSuccess) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700">
        <div className="flex flex-col items-center justify-center py-16 px-8 text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h3 className="text-xl font-bold text-corporate-navy dark:text-white mb-3">Commitment Confirmed</h3>
          <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
            Welcome to Foundation! Let's begin your leadership journey.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={formRef} className={`bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col ${isModal ? 'max-h-[70dvh] md:max-h-[85vh]' : ''}`}>
      {/* Header — navy gradient, consistent with other interactive modals */}
      <div className="p-5 pb-4 bg-gradient-to-r from-corporate-navy to-corporate-navy/90 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileSignature className="w-5 h-5 text-white/90" />
            <h3 className="text-lg font-bold text-white">Foundation Expectations</h3>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2.5 -mr-1 bg-transparent hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <div className="mt-1 text-sm text-white/70">Review and commit to program expectations</div>
      </div>

      {/* Content — Scrollable */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Intro */}
        <p className="text-sm font-medium text-corporate-navy dark:text-white">
          I understand and acknowledge that during Foundation:
        </p>

        {/* Expectation 1 - Real Reps */}
        <div className="flex gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-corporate-teal/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-corporate-teal" />
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm text-slate-700 dark:text-slate-200">
              I am expected to complete required <strong>Real Reps</strong> and provide acceptable evidence.
            </p>
          </div>
        </div>

        {/* Expectation 2 - Progression */}
        <div className="flex gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm text-slate-700 dark:text-slate-200">
              Program progression is based on <strong>demonstrated behavior</strong> and may be paused if reps are incomplete or below standard.
            </p>
          </div>
        </div>

        {/* Expectation 3 - Trainers */}
        <div className="flex gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm text-slate-700 dark:text-slate-200">
              Trainers will coach, challenge, and hold standards. They will <strong>not take ownership</strong> of my work.
            </p>
          </div>
        </div>

        {/* Acknowledgment Section */}
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-4 border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-700 dark:text-slate-200">
              I understand what is expected of me and take responsibility for my engagement, execution, and follow-through during Foundation.
            </p>

            {/* Checkbox */}
            <div 
              onClick={() => !alreadyCompleted && setAcknowledged(!acknowledged)}
              className={`flex items-center gap-3 cursor-pointer group ${alreadyCompleted ? 'cursor-not-allowed opacity-75' : ''}`}
            >
              <div className={`flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                acknowledged 
                  ? 'bg-corporate-teal border-corporate-teal' 
                  : 'border-corporate-teal/60 dark:border-corporate-teal/50 group-hover:border-corporate-teal bg-white dark:bg-slate-700'
              }`}>
                {acknowledged && <CheckCircle className="w-4 h-4 text-white" />}
              </div>
              <span className="text-sm text-slate-700 dark:text-slate-200">
                I acknowledge and accept these expectations.
              </span>
            </div>

            {/* Name Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => !alreadyCompleted && setName(e.target.value)}
                disabled={alreadyCompleted}
                placeholder="Enter your full name"
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all
                  ${alreadyCompleted 
                    ? 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 cursor-not-allowed opacity-75' 
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-corporate-teal'
                  }
                  text-slate-900 dark:text-white
                  focus:outline-none focus:ring-4 focus:ring-corporate-teal/20`}
              />
            </div>
          </div>
        </div>

        {alreadyCompleted && (
          <div className="flex items-center gap-2 p-3 bg-corporate-teal/10 rounded-xl border border-corporate-teal/20">
            <CheckCircle className="w-5 h-5 text-corporate-teal flex-shrink-0" />
            <span className="text-sm font-medium text-corporate-teal">
              You have already acknowledged these expectations
            </span>
          </div>
        )}
      </div>

      {/* Footer — consistent gray bar with action buttons */}
      <div className="px-5 py-4 border-t border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 flex-shrink-0">
        <div className="flex items-center justify-between gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
          )}
          <div className="flex-1" />
          {alreadyCompleted ? (
            <Button
              onClick={onClose || onComplete}
              className="flex items-center gap-2 bg-corporate-teal hover:bg-corporate-teal/90"
            >
              <CheckCircle className="w-4 h-4" />
              Done
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={saving || !acknowledged || !name.trim()}
              className="flex items-center gap-2 bg-corporate-teal hover:bg-corporate-teal/90 disabled:opacity-50"
            >
              {saving ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              {saving ? 'Saving...' : 'Confirm Commitment'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
