import React, { useState, useEffect } from 'react';
import { 
  X, Phone, Mail, Calendar, Linkedin, MessageSquare, FileText,
  Send, Inbox, UserPlus, Clock, Check, Plus
} from 'lucide-react';
import { useActivitiesStore } from '../../stores/prospectActivitiesStore';
import { useTasksStore } from '../../stores/tasksStore';
import { useAuthStore } from '../../stores/authStore';
import useGmailStore from '../../stores/gmailStore';
import * as gmail from '../../lib/gmail';
import { 
  ACTIVITY_TYPES, 
  CALL_OUTCOMES, 
  MEETING_OUTCOMES, 
  MEETING_TYPES,
  getUserActivityTypes,
  getActivityType,
  getCallOutcome,
  getMeetingOutcome
} from '../../config/prospectMeta';
import toast from 'react-hot-toast';

// Map activity type to icon component
const getIconForType = (type) => {
  const icons = {
    call: Phone,
    email_sent: Send,
    email_received: Inbox,
    meeting: Calendar,
    linkedin_connect: UserPlus,
    linkedin_message: MessageSquare,
    linkedin_inmail: Mail,
    sms: MessageSquare,
    note: FileText,
  };
  return icons[type] || FileText;
};

const QuickLogModal = ({ prospect, initialType = null, onClose }) => {
  const { user } = useAuthStore();
  const { addActivity } = useActivitiesStore();
  const { addTask } = useTasksStore();
  const { connectedAccounts, loadConnectedAccounts } = useGmailStore();
  
  const [activeType, setActiveType] = useState(initialType || 'call');
  const [saving, setSaving] = useState(false);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [sendMode, setSendMode] = useState('send'); // 'send' = send & log, 'log' = log only
  const [selectedSender, setSelectedSender] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    // Common fields
    content: '',
    
    // Call fields
    callOutcome: 'connected',
    callDuration: '',
    
    // Email fields
    emailSubject: '',
    emailBody: '', // Actual email body for sending
    
    // Meeting fields
    meetingType: 'discovery',
    meetingOutcome: 'completed',
    meetingDuration: '30',
    attendees: '',
  });

  // Load Gmail accounts on mount
  useEffect(() => {
    loadConnectedAccounts();
  }, [loadConnectedAccounts]);

  // Set default sender when accounts load
  useEffect(() => {
    if (connectedAccounts.length > 0 && !selectedSender) {
      setSelectedSender(connectedAccounts[0].email);
    }
  }, [connectedAccounts, selectedSender]);
  
  // Follow-up task state
  const [followUpTask, setFollowUpTask] = useState({
    enabled: false,
    title: '',
    dueDate: '',
  });

  // Get display name
  const prospectName = prospect?.firstName 
    ? `${prospect.firstName} ${prospect.lastName || ''}`.trim()
    : prospect?.name || 'Prospect';

  const userActivityTypes = getUserActivityTypes();
  const selectedType = getActivityType(activeType);

  const handleSubmit = async () => {
    if (!formData.content.trim() && activeType !== 'linkedin_connect') {
      toast.error('Please add notes about this interaction');
      return;
    }
    
    setSaving(true);
    
    try {
      // Build activity data based on type
      const activityData = {
        prospectId: prospect.id,
        prospectName,
        type: activeType,
        content: formData.content,
      };
      
      // Add type-specific fields
      if (activeType === 'call') {
        activityData.outcome = formData.callOutcome;
        activityData.duration = formData.callDuration ? parseInt(formData.callDuration) : null;
        const outcome = getCallOutcome(formData.callOutcome);
        activityData.content = `${outcome?.label || 'Call'}${formData.callDuration ? ` (${formData.callDuration} min)` : ''}\n\n${formData.content}`;
      } else if (activeType === 'email_sent' || activeType === 'email_received') {
        activityData.subject = formData.emailSubject;
        activityData.channel = 'email';
        
        // Actually send the email via Gmail if in send mode
        if (activeType === 'email_sent' && sendMode === 'send' && prospect?.email && selectedSender) {
          try {
            const result = await gmail.sendEmailAsTeamAccount({
              to: prospect.email,
              subject: formData.emailSubject,
              body: formData.emailBody || formData.content,
            }, selectedSender);
            
            activityData.outcome = 'sent';
            activityData.gmailMessageId = result?.id;
            activityData.gmailThreadId = result?.threadId;
            activityData.fromEmail = selectedSender;
            activityData.toEmail = prospect.email;
            activityData.content = `Email sent: "${formData.emailSubject}"\n\n${formData.emailBody || formData.content}`;
          } catch (sendError) {
            console.error('Error sending email:', sendError);
            toast.error(`Failed to send: ${sendError.message}`);
            setSaving(false);
            return;
          }
        } else {
          if (formData.emailSubject) {
            activityData.content = `Subject: ${formData.emailSubject}\n\n${formData.content}`;
          }
        }
      } else if (activeType === 'meeting') {
        activityData.meetingType = formData.meetingType;
        activityData.outcome = formData.meetingOutcome;
        activityData.duration = formData.meetingDuration ? parseInt(formData.meetingDuration) : null;
        activityData.attendees = formData.attendees;
        const meetingTypeName = MEETING_TYPES.find(t => t.id === formData.meetingType)?.label || 'Meeting';
        const outcome = getMeetingOutcome(formData.meetingOutcome);
        activityData.content = `${meetingTypeName}${formData.meetingDuration ? ` (${formData.meetingDuration} min)` : ''} - ${outcome?.label || ''}\n\n${formData.content}`;
      } else if (activeType === 'linkedin_connect') {
        activityData.content = formData.content || 'Sent LinkedIn connection request';
      }
      
      await addActivity(activityData, user.email, user.displayName || user.email.split('@')[0]);
      
      // Add follow-up task if enabled
      if (followUpTask.enabled && followUpTask.title.trim()) {
        await addTask({
          title: followUpTask.title,
          type: 'follow_up',
          priority: 'medium',
          dueDate: followUpTask.dueDate || '',
          prospectId: prospect.id,
          prospectName,
        }, user.email);
        toast.success('Activity logged with follow-up task');
      } else {
        toast.success('Activity logged');
      }
      
      onClose();
    } catch (error) {
      console.error('Error logging activity:', error);
      toast.error('Failed to log activity');
    } finally {
      setSaving(false);
    }
  };

  // Suggest follow-up based on call outcome
  useEffect(() => {
    if (activeType === 'call' && formData.callOutcome === 'voicemail') {
      setFollowUpTask(prev => ({
        ...prev,
        title: prev.title || `Follow up with ${prospectName}`,
      }));
    } else if (activeType === 'call' && formData.callOutcome === 'callback_scheduled') {
      setFollowUpTask(prev => ({
        ...prev,
        enabled: true,
        title: prev.title || `Callback: ${prospectName}`,
      }));
    }
  }, [activeType, formData.callOutcome, prospectName]);

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg max-h-[90vh] overflow-hidden">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-elevated flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Log Interaction</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{prospectName}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Activity Type Tabs */}
          <div className="px-6 py-3 border-b border-slate-200 overflow-x-auto">
            <div className="flex gap-1 min-w-max">
              {userActivityTypes.map(type => {
                const Icon = getIconForType(type.id);
                const isActive = activeType === type.id;
                return (
                  <button
                    key={type.id}
                    onClick={() => setActiveType(type.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                      isActive 
                        ? 'bg-slate-900 text-white' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Call-specific fields */}
            {activeType === 'call' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Call Outcome
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {CALL_OUTCOMES.map(outcome => (
                      <button
                        key={outcome.id}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, callOutcome: outcome.id }))}
                        className={`px-3 py-2 rounded-lg text-sm font-medium border transition ${
                          formData.callOutcome === outcome.id
                            ? 'border-transparent text-white'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                        style={formData.callOutcome === outcome.id ? { backgroundColor: outcome.color } : {}}
                      >
                        {outcome.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={formData.callDuration}
                    onChange={(e) => setFormData(prev => ({ ...prev, callDuration: e.target.value }))}
                    className="w-32 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-teal focus:border-brand-teal outline-none"
                    placeholder="5"
                  />
                </div>
              </>
            )}

            {/* Email-specific fields */}
            {(activeType === 'email_sent' || activeType === 'email_received') && (
              <>
                {activeType === 'email_sent' && prospect?.email && connectedAccounts.length > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSendMode('send')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                          sendMode === 'send'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                        }`}
                      >
                        <Send className="w-3 h-3 inline mr-1" />
                        Send & Log
                      </button>
                      <button
                        type="button"
                        onClick={() => setSendMode('log')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                          sendMode === 'log'
                            ? 'bg-slate-700 text-white'
                            : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                        }`}
                      >
                        Log Only
                      </button>
                    </div>
                    {sendMode === 'send' && (
                      <div className="flex items-center gap-2 ml-auto">
                        <span className="text-xs text-slate-500 dark:text-slate-400">From:</span>
                        <select
                          value={selectedSender}
                          onChange={(e) => setSelectedSender(e.target.value)}
                          className="text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded px-2 py-1 text-slate-700 dark:text-slate-200"
                        >
                          {connectedAccounts.map(a => (
                            <option key={a.email} value={a.email}>{a.email}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500 dark:text-slate-400 w-12">To:</span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{prospect?.email || 'No email'}</span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    value={formData.emailSubject}
                    onChange={(e) => setFormData(prev => ({ ...prev, emailSubject: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-brand-teal focus:border-brand-teal outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    placeholder="Subject..."
                  />
                </div>
                {sendMode === 'send' && activeType === 'email_sent' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                      Email Body
                    </label>
                    <textarea
                      value={formData.emailBody}
                      onChange={(e) => setFormData(prev => ({ ...prev, emailBody: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-brand-teal focus:border-brand-teal outline-none min-h-[120px] resize-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      placeholder="Write your email..."
                      autoFocus
                    />
                  </div>
                )}
              </>
            )}

            {/* Meeting-specific fields */}
            {activeType === 'meeting' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Meeting Type
                    </label>
                    <select
                      value={formData.meetingType}
                      onChange={(e) => setFormData(prev => ({ ...prev, meetingType: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-teal outline-none bg-white"
                    >
                      {MEETING_TYPES.map(type => (
                        <option key={type.id} value={type.id}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Duration (min)
                    </label>
                    <select
                      value={formData.meetingDuration}
                      onChange={(e) => setFormData(prev => ({ ...prev, meetingDuration: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-teal outline-none bg-white"
                    >
                      <option value="15">15 min</option>
                      <option value="30">30 min</option>
                      <option value="45">45 min</option>
                      <option value="60">60 min</option>
                      <option value="90">90 min</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Outcome
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {MEETING_OUTCOMES.map(outcome => (
                      <button
                        key={outcome.id}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, meetingOutcome: outcome.id }))}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
                          formData.meetingOutcome === outcome.id
                            ? 'border-transparent text-white'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                        style={formData.meetingOutcome === outcome.id ? { backgroundColor: outcome.color } : {}}
                      >
                        {outcome.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Attendees
                  </label>
                  <input
                    type="text"
                    value={formData.attendees}
                    onChange={(e) => setFormData(prev => ({ ...prev, attendees: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-teal focus:border-brand-teal outline-none"
                    placeholder="John, Sarah, Mike (optional)"
                  />
                </div>
              </>
            )}

            {/* Notes (all types) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {activeType === 'note' ? 'Note' : 'Notes'}
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-teal focus:border-brand-teal outline-none min-h-24 resize-none"
                placeholder={
                  activeType === 'call' ? 'Key points discussed, next steps...' :
                  activeType === 'meeting' ? 'Meeting summary, decisions made, action items...' :
                  activeType === 'note' ? 'Add your note...' :
                  'Add notes about this interaction...'
                }
              />
            </div>

            {/* Follow-up Task Section */}
            <div className="border-t border-slate-200 pt-4">
              <div 
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => setShowFollowUp(!showFollowUp)}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFollowUpTask(prev => ({ ...prev, enabled: !prev.enabled }));
                  }}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${
                    followUpTask.enabled 
                      ? 'bg-brand-teal border-brand-teal' 
                      : 'border-slate-300 hover:border-slate-400'
                  }`}
                >
                  {followUpTask.enabled && <Check className="w-3 h-3 text-white" />}
                </button>
                <span className="text-sm font-medium text-slate-700">Add follow-up task</span>
              </div>
              
              {(showFollowUp || followUpTask.enabled) && (
                <div className="mt-3 pl-8 space-y-3">
                  <input
                    type="text"
                    value={followUpTask.title}
                    onChange={(e) => setFollowUpTask(prev => ({ ...prev, title: e.target.value, enabled: true }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-teal focus:border-brand-teal outline-none"
                    placeholder="Follow up on proposal..."
                  />
                  <input
                    type="date"
                    value={followUpTask.dueDate}
                    onChange={(e) => setFollowUpTask(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-40 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-teal outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 border-t border-slate-200 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className={`flex-1 px-4 py-2 text-white rounded-lg text-sm font-medium transition disabled:opacity-50 ${
                activeType === 'email_sent' && sendMode === 'send' && prospect?.email
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-brand-teal hover:bg-brand-teal/90'
              }`}
            >
              {saving 
                ? 'Saving...' 
                : activeType === 'email_sent' && sendMode === 'send' && prospect?.email
                  ? '✉ Send & Log'
                  : 'Log Activity'
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickLogModal;
