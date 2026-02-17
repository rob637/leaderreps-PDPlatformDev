import React, { useState, useEffect } from 'react';
import { 
  X, Phone, Mail, Calendar, Linkedin, MessageSquare, FileText,
  Send, Inbox, UserPlus, Clock, Check, Plus
} from 'lucide-react';
import { useActivitiesStore } from '../../stores/prospectActivitiesStore';
import { useTasksStore } from '../../stores/tasksStore';
import { useAuthStore } from '../../stores/authStore';
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
  
  const [activeType, setActiveType] = useState(initialType || 'call');
  const [saving, setSaving] = useState(false);
  const [showFollowUp, setShowFollowUp] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    // Common fields
    content: '',
    
    // Call fields
    callOutcome: 'connected',
    callDuration: '',
    
    // Email fields
    emailSubject: '',
    
    // Meeting fields
    meetingType: 'discovery',
    meetingOutcome: 'completed',
    meetingDuration: '30',
    attendees: '',
  });
  
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
        if (formData.emailSubject) {
          activityData.content = `Subject: ${formData.emailSubject}\n\n${formData.content}`;
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
        <div className="bg-white rounded-xl shadow-elevated flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Log Interaction</h2>
              <p className="text-sm text-slate-500">{prospectName}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition"
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
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={formData.emailSubject}
                  onChange={(e) => setFormData(prev => ({ ...prev, emailSubject: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-teal focus:border-brand-teal outline-none"
                  placeholder="Re: LeaderReps Partnership"
                />
              </div>
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
              className="flex-1 px-4 py-2 bg-brand-teal text-white rounded-lg text-sm font-medium hover:bg-brand-teal/90 transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Log Activity'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickLogModal;
