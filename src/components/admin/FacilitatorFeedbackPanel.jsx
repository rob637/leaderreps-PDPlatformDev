// src/components/admin/FacilitatorFeedbackPanel.jsx
// Advisory facilitator feedback on individual conditioning reps
// Stored on the rep document — does not gate milestone sign-off

import React, { useState, useEffect } from 'react';
import { useAppServices } from '../../services/useAppServices';
import conditioningService from '../../services/conditioningService';
import {
  MessageSquare, Send, CheckCircle, Eye,
  ThumbsUp, Lightbulb, Target, Loader,
} from 'lucide-react';

const STATUS_BADGES = {
  sent: { label: 'Sent', icon: Send, bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700' },
  viewed: { label: 'Viewed', icon: Eye, bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700' },
  acknowledged: { label: 'Acknowledged', icon: CheckCircle, bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700' },
};

const FacilitatorFeedbackPanel = ({ repId, repOwnerId, onFeedbackSaved }) => {
  const { db, user } = useAppServices();
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [strength, setStrength] = useState('');
  const [improvement, setImprovement] = useState('');
  const [nextRepSuggestion, setNextRepSuggestion] = useState('');

  // Load existing feedback
  useEffect(() => {
    const loadFeedback = async () => {
      if (!db || !repOwnerId || !repId) {
        setLoading(false);
        return;
      }
      try {
        const existing = await conditioningService.getFacilitatorFeedback(db, repOwnerId, repId);
        setFeedback(existing);
      } catch (err) {
        console.error('Error loading facilitator feedback:', err);
      } finally {
        setLoading(false);
      }
    };
    loadFeedback();
  }, [db, repOwnerId, repId]);

  const handleSubmit = async () => {
    if (!strength.trim() && !improvement.trim() && !nextRepSuggestion.trim()) return;

    setSaving(true);
    try {
      await conditioningService.saveFacilitatorFeedback(db, repOwnerId, repId, {
        facilitatorId: user.uid,
        facilitatorEmail: user.email,
        strength: strength.trim(),
        improvement: improvement.trim(),
        nextRepSuggestion: nextRepSuggestion.trim(),
      });

      const updated = await conditioningService.getFacilitatorFeedback(db, repOwnerId, repId);
      setFeedback(updated);
      setShowForm(false);
      setStrength('');
      setImprovement('');
      setNextRepSuggestion('');
      onFeedbackSaved?.();
    } catch (err) {
      console.error('Error saving facilitator feedback:', err);
      alert('Failed to save feedback. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-3 text-sm text-slate-500">
        <Loader className="w-4 h-4 animate-spin" />
        Loading feedback...
      </div>
    );
  }

  // ---- Existing feedback display ----
  if (feedback && !showForm) {
    const statusConfig = STATUS_BADGES[feedback.status] || STATUS_BADGES.sent;
    const StatusIcon = statusConfig.icon;
    const feedbackDate = feedback.createdAt?.toDate?.()
      ? feedback.createdAt.toDate().toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
        })
      : 'Recently';

    return (
      <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
        <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2.5 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-corporate-teal" />
            <span className="text-sm font-medium text-corporate-navy dark:text-white">Trainer Feedback</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${statusConfig.bg} ${statusConfig.text}`}>
              <StatusIcon className="w-3 h-3" />
              {statusConfig.label}
            </span>
            <button
              onClick={() => {
                setStrength(feedback.strength || '');
                setImprovement(feedback.improvement || '');
                setNextRepSuggestion(feedback.nextRepSuggestion || '');
                setShowForm(true);
              }}
              className="text-xs text-corporate-teal hover:underline"
            >
              Edit
            </button>
          </div>
        </div>
        <div className="p-4 space-y-3">
          {feedback.strength && (
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <ThumbsUp className="w-3.5 h-3.5 text-green-600" />
                <span className="text-xs font-medium text-green-700">Strength</span>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300">{feedback.strength}</p>
            </div>
          )}
          {feedback.improvement && (
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-xs font-medium text-amber-700">Area to Develop</span>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300">{feedback.improvement}</p>
            </div>
          )}
          {feedback.nextRepSuggestion && (
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Target className="w-3.5 h-3.5 text-corporate-teal" />
                <span className="text-xs font-medium text-corporate-teal">Next Rep Focus</span>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300">{feedback.nextRepSuggestion}</p>
            </div>
          )}
          {feedback.leaderResponse && (
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
              <div className="text-xs font-medium text-slate-500 mb-1">Leader&apos;s Response</div>
              <p className="text-sm text-slate-700 dark:text-slate-300 italic">&ldquo;{feedback.leaderResponse}&rdquo;</p>
            </div>
          )}
          <div className="text-xs text-slate-400 pt-1">
            By {feedback.facilitatorEmail} &bull; {feedbackDate}
          </div>
        </div>
      </div>
    );
  }

  // ---- Feedback form / trigger ----
  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
      <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2.5 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-corporate-teal" />
          <span className="text-sm font-medium text-corporate-navy dark:text-white">
            {feedback ? 'Edit Feedback' : 'Trainer Feedback'}
          </span>
        </div>
        {showForm && (
          <button
            onClick={() => setShowForm(false)}
            className="text-xs text-slate-500 hover:text-slate-700"
          >
            Cancel
          </button>
        )}
      </div>

      {!showForm ? (
        <div className="p-4">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 text-sm text-corporate-teal hover:text-corporate-teal/80 transition-colors"
          >
            <Send className="w-4 h-4" />
            Provide feedback on this rep
          </button>
        </div>
      ) : (
        <div className="p-4 space-y-3">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-green-700 mb-1">
              <ThumbsUp className="w-3.5 h-3.5" />
              What went well?
            </label>
            <textarea
              value={strength}
              onChange={(e) => setStrength(e.target.value)}
              placeholder="Acknowledge specific strengths..."
              rows={2}
              className="w-full text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-corporate-teal/20 focus:border-corporate-teal outline-none resize-none bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-amber-700 mb-1">
              <Lightbulb className="w-3.5 h-3.5" />
              Area to develop
            </label>
            <textarea
              value={improvement}
              onChange={(e) => setImprovement(e.target.value)}
              placeholder="Coaching observation or growth area..."
              rows={2}
              className="w-full text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-corporate-teal/20 focus:border-corporate-teal outline-none resize-none bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-corporate-teal mb-1">
              <Target className="w-3.5 h-3.5" />
              Suggested next rep focus
            </label>
            <textarea
              value={nextRepSuggestion}
              onChange={(e) => setNextRepSuggestion(e.target.value)}
              placeholder="What should they focus on next week?"
              rows={2}
              className="w-full text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-corporate-teal/20 focus:border-corporate-teal outline-none resize-none bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
            />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleSubmit}
              disabled={saving || (!strength.trim() && !improvement.trim() && !nextRepSuggestion.trim())}
              className="flex items-center gap-2 px-4 py-2 bg-corporate-teal text-white text-sm font-medium rounded-lg hover:bg-corporate-teal/90 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {saving ? 'Saving...' : feedback ? 'Update Feedback' : 'Send Feedback'}
            </button>
            <span className="text-xs text-slate-400">Advisory only — does not block sign-off</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacilitatorFeedbackPanel;
