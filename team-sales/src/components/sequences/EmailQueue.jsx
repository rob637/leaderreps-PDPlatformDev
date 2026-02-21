/**
 * LR-Instantly - Email Queue (Approval Queue)
 * 
 * Review upcoming emails before they're sent.
 * Provides full personalized preview and send/skip/edit controls.
 * 
 * Workflow:
 * 1. When a sequence step is due, it appears here
 * 2. Review the personalized email
 * 3. Send, Skip, or Edit & Send
 * 4. Enrollment advances to next step
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Send,
  SkipForward,
  Edit3,
  Eye,
  Mail,
  Clock,
  User,
  Building2,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  RefreshCw,
  AlertCircle,
  Loader2,
  ExternalLink,
  Copy,
  CheckCircle,
  AlertTriangle,
  Inbox
} from 'lucide-react';
import { useSequenceStore, substituteVariables } from '../../stores/sequenceStore';
import { useOutreachStore } from '../../stores/outreachStore';
import { useGmailStore } from '../../stores/gmailStore';
import { sendEmailAsTeamAccount } from '../../lib/gmail';
import { checkAllAccountsForReplies } from '../../services/replyDetectionService';
import { formatDistanceToNow, format, isToday, isTomorrow, isPast, addDays } from 'date-fns';
import toast from 'react-hot-toast';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function EmailQueue() {
  const { 
    enrollments, 
    enrollmentsLoading,
    initialize,
    cleanup
  } = useSequenceStore();
  
  const { 
    sequences, 
    templates,
    initialize: initOutreach,
    cleanup: cleanupOutreach
  } = useOutreachStore();
  
  const {
    connectedAccounts,
    accountsLoaded,
    loadConnectedAccounts
  } = useGmailStore();
  
  const [expandedEmail, setExpandedEmail] = useState(null);
  const [sendingId, setSendingId] = useState(null);
  const [editingEmail, setEditingEmail] = useState(null);
  const [editedSubject, setEditedSubject] = useState('');
  const [editedBody, setEditedBody] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [selectedSender, setSelectedSender] = useState('');
  const [checkingReplies, setCheckingReplies] = useState(false);
  
  // Handle check for replies
  const handleCheckReplies = async () => {
    setCheckingReplies(true);
    try {
      const result = await checkAllAccountsForReplies(7);
      if (result.newReplies > 0) {
        toast.success(result.message);
      } else {
        toast(result.message, { icon: '📧' });
      }
    } catch (error) {
      console.error('Error checking replies:', error);
      toast.error('Failed to check for replies');
    } finally {
      setCheckingReplies(false);
    }
  };
  
  // Initialize stores on mount
  useEffect(() => {
    initialize();
    initOutreach();
    loadConnectedAccounts();
    return () => {
      cleanup();
      cleanupOutreach();
    };
  }, [initialize, cleanup, initOutreach, cleanupOutreach, loadConnectedAccounts]);
  
  // Set initial sender when accounts load — default to jeff@leaderreps.biz
  useEffect(() => {
    if (connectedAccounts.length > 0 && !selectedSender) {
      const jeff = connectedAccounts.find(a => a.email === 'jeff@leaderreps.biz');
      setSelectedSender(jeff ? jeff.email : connectedAccounts[0].email);
    }
  }, [connectedAccounts, selectedSender]);
  
  // Compute pending emails from active enrollments
  const pendingEmails = useMemo(() => {
    if (!enrollments.length || !sequences.length) return [];
    
    const emails = [];
    
    enrollments
      .filter(e => e.status === 'active')
      .forEach(enrollment => {
        // Find the sequence
        const sequence = sequences.find(s => s.id === enrollment.sequenceId);
        if (!sequence || !sequence.steps?.length) return;
        
        // Get current step
        const step = sequence.steps[enrollment.currentStep];
        if (!step) return;
        
        // Get template content if available
        const template = step.templateId 
          ? templates.find(t => t.id === step.templateId)
          : null;
        
        // Personalize content
        const variables = enrollment.variables || {};
        const subject = substituteVariables(
          step.subject || template?.subject || '[No Subject]', 
          variables
        );
        const body = substituteVariables(
          template?.content || step.content || '', 
          variables
        );
        
        // Get send time
        const nextSendAt = enrollment.nextSendAt?.toDate 
          ? enrollment.nextSendAt.toDate() 
          : enrollment.nextSendAt 
            ? new Date(enrollment.nextSendAt) 
            : new Date();
        
        emails.push({
          id: enrollment.id,
          enrollmentId: enrollment.id,
          prospectId: enrollment.prospectId,
          prospectEmail: enrollment.prospectEmail,
          prospectName: enrollment.prospectName,
          sequenceId: enrollment.sequenceId,
          sequenceName: enrollment.sequenceName,
          stepNumber: enrollment.currentStep + 1,
          totalSteps: sequence.steps.length,
          subject,
          body,
          channel: step.channel || 'email',
          nextSendAt,
          isPastDue: isPast(nextSendAt),
          isDueToday: isToday(nextSendAt),
          isDueTomorrow: isTomorrow(nextSendAt),
          variables,
          templateId: step.templateId,
          ownerId: enrollment.ownerId,
          ownerName: enrollment.ownerName
        });
      });
    
    // Sort by due date (past due first, then today, then future)
    return emails.sort((a, b) => a.nextSendAt - b.nextSendAt);
  }, [enrollments, sequences, templates]);
  
  // Send an email (advance enrollment)
  const handleSend = async (email, customSubject, customBody) => {
    // Check if sender is selected
    if (!selectedSender) {
      toast.error('Please select a Gmail account to send from');
      return;
    }
    
    setSendingId(email.id);
    
    try {
      const subject = customSubject || email.subject;
      const body = customBody || email.body;
      
      // Actually send the email via Gmail
      await sendEmailAsTeamAccount({
        to: email.prospectEmail,
        subject,
        body
      }, selectedSender);
      
      // Log the activity (email sent)
      await addDoc(collection(db, 'outreach_activities'), {
        prospectId: email.prospectId,
        prospectEmail: email.prospectEmail,
        prospectName: email.prospectName,
        channel: 'email',
        outcome: 'sent',
        type: 'sequence_email',
        sequenceId: email.sequenceId,
        sequenceName: email.sequenceName,
        stepNumber: email.stepNumber - 1, // 0-indexed
        subject,
        contentPreview: body?.substring(0, 200),
        ownerId: email.ownerId,
        ownerName: email.ownerName,
        sentFrom: selectedSender,
        createdAt: serverTimestamp(),
        manualSend: true // Distinguish from automated sends
      });
      
      // Get the sequence to determine next step
      const sequence = sequences.find(s => s.id === email.sequenceId);
      const nextStepIndex = email.stepNumber; // stepNumber is already 1-indexed, so this is next step index
      
      if (nextStepIndex >= sequence.steps.length) {
        // Sequence complete!
        await updateDoc(doc(db, 'sequence_enrollments', email.enrollmentId), {
          status: 'completed',
          completedAt: serverTimestamp(),
          emailsSent: email.stepNumber,
          lastSentAt: serverTimestamp()
        });
        
        // Update sequence stats
        await updateDoc(doc(db, 'outreach_sequences', email.sequenceId), {
          totalCompleted: (sequence.totalCompleted || 0) + 1
        });
        
        toast.success(`Sent! Sequence complete for ${email.prospectName}`);
      } else {
        // Calculate next send time
        const nextStep = sequence.steps[nextStepIndex];
        const currentStep = sequence.steps[nextStepIndex - 1];
        const daysUntilNext = (nextStep.day || 0) - (currentStep.day || 0);
        const nextSendAt = addDays(new Date(), Math.max(daysUntilNext, 1));
        
        await updateDoc(doc(db, 'sequence_enrollments', email.enrollmentId), {
          currentStep: nextStepIndex,
          nextSendAt: Timestamp.fromDate(nextSendAt),
          emailsSent: email.stepNumber,
          lastSentAt: serverTimestamp()
        });
        
        toast.success(`Sent! Next email in ${daysUntilNext || 1} day(s)`);
      }
      
      // Clear edit state
      setEditingEmail(null);
      setExpandedEmail(null);
      
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email');
    } finally {
      setSendingId(null);
    }
  };
  
  // Skip this step
  const handleSkip = async (email) => {
    setSendingId(email.id);
    
    try {
      // Get the sequence to determine next step
      const sequence = sequences.find(s => s.id === email.sequenceId);
      const nextStepIndex = email.stepNumber; // stepNumber is 1-indexed
      
      // Log skip activity
      await addDoc(collection(db, 'outreach_activities'), {
        prospectId: email.prospectId,
        prospectEmail: email.prospectEmail,
        prospectName: email.prospectName,
        channel: 'email',
        outcome: 'skipped',
        type: 'sequence_email',
        sequenceId: email.sequenceId,
        sequenceName: email.sequenceName,
        stepNumber: email.stepNumber - 1,
        subject: email.subject,
        ownerId: email.ownerId,
        ownerName: email.ownerName,
        createdAt: serverTimestamp()
      });
      
      if (nextStepIndex >= sequence.steps.length) {
        // Sequence complete
        await updateDoc(doc(db, 'sequence_enrollments', email.enrollmentId), {
          status: 'completed',
          completedAt: serverTimestamp()
        });
        toast.success(`Skipped. Sequence complete for ${email.prospectName}`);
      } else {
        // Move to next step
        const nextStep = sequence.steps[nextStepIndex];
        const currentStep = sequence.steps[nextStepIndex - 1];
        const daysUntilNext = (nextStep.day || 0) - (currentStep.day || 0);
        const nextSendAt = addDays(new Date(), Math.max(daysUntilNext, 1));
        
        await updateDoc(doc(db, 'sequence_enrollments', email.enrollmentId), {
          currentStep: nextStepIndex,
          nextSendAt: Timestamp.fromDate(nextSendAt)
        });
        
        toast.success('Skipped. Moved to next step.');
      }
      
    } catch (error) {
      console.error('Error skipping:', error);
      toast.error('Failed to skip');
    } finally {
      setSendingId(null);
    }
  };
  
  // Start editing an email
  const handleEdit = (email) => {
    setEditingEmail(email.id);
    setEditedSubject(email.subject);
    setEditedBody(email.body);
    setExpandedEmail(email.id);
  };
  
  // Cancel editing
  const handleCancelEdit = () => {
    setEditingEmail(null);
    setEditedSubject('');
    setEditedBody('');
  };
  
  // Copy email content to clipboard
  const handleCopy = async (email) => {
    try {
      const text = `Subject: ${email.subject}\n\n${email.body}`;
      await navigator.clipboard.writeText(text);
      setCopiedId(email.id);
      setTimeout(() => setCopiedId(null), 2000);
      toast.success('Copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy');
    }
  };
  
  // Send all pending (bulk action)
  const handleSendAll = async () => {
    const pastDueEmails = pendingEmails.filter(e => e.isPastDue || e.isDueToday);
    if (!pastDueEmails.length) {
      toast.error('No emails due today or past due');
      return;
    }
    
    if (!confirm(`Send ${pastDueEmails.length} email(s)?`)) return;
    
    for (const email of pastDueEmails) {
      await handleSend(email);
    }
  };
  
  // Get due label
  const getDueLabel = (email) => {
    if (email.isPastDue) return { text: 'Past Due', color: 'red' };
    if (email.isDueToday) return { text: 'Due Today', color: 'amber' };
    if (email.isDueTomorrow) return { text: 'Tomorrow', color: 'blue' };
    return { text: formatDistanceToNow(email.nextSendAt, { addSuffix: true }), color: 'slate' };
  };
  
  if (enrollmentsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-brand-teal" />
      </div>
    );
  }
  
  const pastDueCount = pendingEmails.filter(e => e.isPastDue).length;
  const dueTodayCount = pendingEmails.filter(e => e.isDueToday && !e.isPastDue).length;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Email Queue</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Review and send upcoming emails
            </p>
          </div>
        </div>
        
        {/* From Selector + Bulk Actions */}
        <div className="flex items-center gap-4">
          {/* Gmail Account Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">From:</span>
            {connectedAccounts.length > 0 ? (
              <select
                value={selectedSender}
                onChange={(e) => setSelectedSender(e.target.value)}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-900 dark:text-slate-100"
              >
                {connectedAccounts.map(account => (
                  <option key={account.id || account.email} value={account.email}>
                    {account.email}
                  </option>
                ))}
              </select>
            ) : (
              <span className="flex items-center gap-1 text-sm text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-4 h-4" />
                No Gmail connected
              </span>
            )}
          </div>
          
          {/* Check Replies Button */}
          <button
            onClick={handleCheckReplies}
            disabled={checkingReplies || connectedAccounts.length === 0}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Check for prospect replies"
          >
            <Inbox className={`w-4 h-4 ${checkingReplies ? 'animate-pulse' : ''}`} />
            {checkingReplies ? 'Checking...' : 'Check Replies'}
          </button>
          
          {/* Bulk Actions */}
          {pendingEmails.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">
                {pendingEmails.length} pending
              </span>
              {(pastDueCount > 0 || dueTodayCount > 0) && (
                <button
                  onClick={handleSendAll}
                  disabled={!selectedSender}
                  className="flex items-center gap-2 px-3 py-1.5 bg-brand-teal text-white text-sm rounded-lg hover:bg-brand-teal/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  Send All Due ({pastDueCount + dueTodayCount})
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-2xl font-bold text-red-700 dark:text-red-400">{pastDueCount}</span>
          </div>
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">Past Due</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            <span className="text-2xl font-bold text-amber-700 dark:text-amber-400">{dueTodayCount}</span>
          </div>
          <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">Due Today</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-500" />
            <span className="text-2xl font-bold text-blue-700 dark:text-blue-400">
              {pendingEmails.length - pastDueCount - dueTodayCount}
            </span>
          </div>
          <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">Upcoming</p>
        </div>
      </div>
      
      {/* Email List */}
      {pendingEmails.length === 0 ? (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
          <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No pending emails</p>
          <p className="text-sm mt-1">Enroll prospects in sequences to see upcoming emails here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingEmails.map((email) => {
            const dueLabel = getDueLabel(email);
            const isExpanded = expandedEmail === email.id;
            const isEditing = editingEmail === email.id;
            const isSending = sendingId === email.id;
            
            return (
              <div
                key={email.id}
                className={`bg-white dark:bg-slate-800 rounded-xl border transition-all ${
                  email.isPastDue 
                    ? 'border-red-300 dark:border-red-700' 
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                {/* Header Row */}
                <div 
                  className="p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-t-xl"
                  onClick={() => setExpandedEmail(isExpanded ? null : email.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full bg-${dueLabel.color}-100 dark:bg-${dueLabel.color}-900/30 text-${dueLabel.color}-700 dark:text-${dueLabel.color}-300`}>
                          {dueLabel.text}
                        </span>
                        <span className="text-xs text-slate-400">
                          Step {email.stepNumber}/{email.totalSteps}
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-400">{email.sequenceName}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          {email.prospectName}
                        </span>
                        <span className="text-sm text-slate-500 truncate">
                          ({email.prospectEmail})
                        </span>
                      </div>
                      
                      <p className="text-sm text-slate-700 dark:text-slate-300 mt-1 font-medium truncate">
                        {email.subject}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-slate-200 dark:border-slate-700">
                    {/* Email Preview/Edit */}
                    <div className="p-4 space-y-4">
                      {isEditing ? (
                        <>
                          {/* Edit Subject */}
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                              Subject
                            </label>
                            <input
                              type="text"
                              value={editedSubject}
                              onChange={(e) => setEditedSubject(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                            />
                          </div>
                          
                          {/* Edit Body */}
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                              Body
                            </label>
                            <textarea
                              value={editedBody}
                              onChange={(e) => setEditedBody(e.target.value)}
                              rows={10}
                              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-mono text-sm"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Preview Subject */}
                          <div>
                            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">
                              Subject
                            </label>
                            <p className="text-slate-900 dark:text-slate-100 font-medium">
                              {email.subject}
                            </p>
                          </div>
                          
                          {/* Preview Body */}
                          <div>
                            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">
                              Body
                            </label>
                            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap max-h-64 overflow-y-auto">
                              {email.body || '(No body content)'}
                            </div>
                          </div>
                        </>
                      )}
                      
                      {/* Variables Used */}
                      <div>
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">
                          Variables
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(email.variables || {}).map(([key, value]) => (
                            value && (
                              <span 
                                key={key}
                                className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs"
                              >
                                <span className="text-slate-500">{key}:</span>{' '}
                                <span className="text-slate-700 dark:text-slate-300">{value}</span>
                              </span>
                            )
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="px-4 py-3 bg-slate-50 dark:bg-slate-700/50 rounded-b-xl border-t border-slate-200 dark:border-slate-600 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={handleCancelEdit}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-sm"
                            >
                              <X className="w-4 h-4" />
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSend(email, editedSubject, editedBody)}
                              disabled={isSending}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-teal text-white rounded-lg text-sm hover:bg-brand-teal/90 disabled:opacity-50"
                            >
                              {isSending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Send className="w-4 h-4" />
                              )}
                              Send Edited
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEdit(email)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-sm"
                            >
                              <Edit3 className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleCopy(email)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-sm"
                            >
                              {copiedId === email.id ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                              Copy
                            </button>
                          </>
                        )}
                      </div>
                      
                      {!isEditing && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSkip(email)}
                            disabled={isSending}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-sm disabled:opacity-50"
                          >
                            <SkipForward className="w-4 h-4" />
                            Skip
                          </button>
                          <button
                            onClick={() => handleSend(email)}
                            disabled={isSending}
                            className="flex items-center gap-1.5 px-4 py-1.5 bg-brand-teal text-white rounded-lg text-sm hover:bg-brand-teal/90 disabled:opacity-50"
                          >
                            {isSending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                            Send Now
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
