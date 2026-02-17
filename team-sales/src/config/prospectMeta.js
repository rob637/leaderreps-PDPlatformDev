// LinkedIn connection statuses
export const LINKEDIN_STATUSES = [
  { id: 'none', label: 'Not Connected', color: '#94a3b8', icon: 'UserX' },
  { id: 'pending', label: 'Request Sent', color: '#f59e0b', icon: 'Clock' },
  { id: 'connected', label: 'Connected', color: '#22c55e', icon: 'UserCheck' },
  { id: 'following', label: 'Following', color: '#3b82f6', icon: 'Eye' },
];

// Default prospect tags
export const DEFAULT_TAGS = [
  { id: 'hot-lead', label: 'Hot Lead', color: '#ef4444' },
  { id: 'enterprise', label: 'Enterprise', color: '#8b5cf6' },
  { id: 'smb', label: 'SMB', color: '#3b82f6' },
  { id: 'decision-maker', label: 'Decision Maker', color: '#f59e0b' },
  { id: 'influencer', label: 'Influencer', color: '#ec4899' },
  { id: 'referral', label: 'Referral', color: '#22c55e' },
  { id: 'competitor', label: 'Competitor', color: '#64748b' },
  { id: 'partner', label: 'Partner', color: '#06b6d4' },
  { id: 'inbound', label: 'Inbound', color: '#10b981' },
  { id: 'outbound', label: 'Outbound', color: '#6366f1' },
  { id: 'event', label: 'Event Lead', color: '#f97316' },
  { id: 'champion', label: 'Champion', color: '#eab308' },
];

// Apollo sequence statuses
export const APOLLO_SEQUENCE_STATUSES = [
  { id: 'not_in_sequence', label: 'Not in Sequence', color: '#94a3b8' },
  { id: 'active', label: 'Active in Sequence', color: '#22c55e' },
  { id: 'paused', label: 'Sequence Paused', color: '#f59e0b' },
  { id: 'finished', label: 'Sequence Finished', color: '#3b82f6' },
  { id: 'replied', label: 'Replied', color: '#8b5cf6' },
  { id: 'bounced', label: 'Bounced', color: '#ef4444' },
];

// Activity types for logging
export const ACTIVITY_TYPES = [
  { id: 'call', label: 'Phone Call', icon: 'Phone', color: '#8b5cf6', hasOutcome: true, hasDuration: true },
  { id: 'email_sent', label: 'Email Sent', icon: 'Send', color: '#3b82f6', hasSubject: true },
  { id: 'email_received', label: 'Email Received', icon: 'Inbox', color: '#22c55e', hasSubject: true },
  { id: 'meeting', label: 'Meeting', icon: 'Calendar', color: '#f59e0b', hasOutcome: true, hasDuration: true },
  { id: 'linkedin_connect', label: 'LinkedIn Connect', icon: 'UserPlus', color: '#0077b5' },
  { id: 'linkedin_message', label: 'LinkedIn Message', icon: 'MessageCircle', color: '#0077b5' },
  { id: 'linkedin_inmail', label: 'LinkedIn InMail', icon: 'Mail', color: '#0077b5' },
  { id: 'sms', label: 'Text Message', icon: 'MessageSquare', color: '#10b981' },
  { id: 'note', label: 'Note', icon: 'FileText', color: '#64748b' },
  { id: 'stage_change', label: 'Stage Changed', icon: 'ArrowRight', color: '#6366f1', system: true },
  { id: 'task_completed', label: 'Task Completed', icon: 'CheckCircle', color: '#10b981', system: true },
];

// Call outcomes
export const CALL_OUTCOMES = [
  { id: 'connected', label: 'Connected', color: '#22c55e', icon: 'PhoneCall' },
  { id: 'voicemail', label: 'Left Voicemail', color: '#f59e0b', icon: 'Voicemail' },
  { id: 'no_answer', label: 'No Answer', color: '#94a3b8', icon: 'PhoneMissed' },
  { id: 'busy', label: 'Busy', color: '#ef4444', icon: 'PhoneOff' },
  { id: 'wrong_number', label: 'Wrong Number', color: '#6b7280', icon: 'XCircle' },
  { id: 'callback_scheduled', label: 'Callback Scheduled', color: '#3b82f6', icon: 'Calendar' },
];

// Meeting outcomes
export const MEETING_OUTCOMES = [
  { id: 'completed', label: 'Completed', color: '#22c55e' },
  { id: 'no_show', label: 'No Show', color: '#ef4444' },
  { id: 'rescheduled', label: 'Rescheduled', color: '#f59e0b' },
  { id: 'cancelled', label: 'Cancelled', color: '#6b7280' },
  { id: 'follow_up_needed', label: 'Follow-up Needed', color: '#3b82f6' },
];

// Meeting types
export const MEETING_TYPES = [
  { id: 'discovery', label: 'Discovery Call' },
  { id: 'demo', label: 'Demo' },
  { id: 'follow_up', label: 'Follow-up' },
  { id: 'proposal', label: 'Proposal Review' },
  { id: 'negotiation', label: 'Negotiation' },
  { id: 'onboarding', label: 'Onboarding' },
  { id: 'check_in', label: 'Check-in' },
  { id: 'other', label: 'Other' },
];

// Helper functions
export const getLinkedInStatus = (id) => {
  return LINKEDIN_STATUSES.find(s => s.id === id) || LINKEDIN_STATUSES[0];
};

export const getTag = (id) => {
  return DEFAULT_TAGS.find(t => t.id === id);
};

export const getApolloSequenceStatus = (id) => {
  return APOLLO_SEQUENCE_STATUSES.find(s => s.id === id) || APOLLO_SEQUENCE_STATUSES[0];
};

export const getActivityType = (id) => {
  return ACTIVITY_TYPES.find(t => t.id === id) || ACTIVITY_TYPES.find(t => t.id === 'note');
};

export const getCallOutcome = (id) => {
  return CALL_OUTCOMES.find(o => o.id === id);
};

export const getMeetingOutcome = (id) => {
  return MEETING_OUTCOMES.find(o => o.id === id);
};

export const getMeetingType = (id) => {
  return MEETING_TYPES.find(t => t.id === id);
};

// Get user-selectable activity types (exclude system types)
export const getUserActivityTypes = () => {
  return ACTIVITY_TYPES.filter(t => !t.system);
};
