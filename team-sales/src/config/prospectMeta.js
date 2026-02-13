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
  { id: 'note', label: 'Note', icon: 'FileText', color: '#64748b' },
  { id: 'email_sent', label: 'Email Sent', icon: 'Send', color: '#3b82f6' },
  { id: 'email_received', label: 'Email Received', icon: 'Inbox', color: '#22c55e' },
  { id: 'call', label: 'Phone Call', icon: 'Phone', color: '#8b5cf6' },
  { id: 'meeting', label: 'Meeting', icon: 'Calendar', color: '#f59e0b' },
  { id: 'linkedin_connect', label: 'LinkedIn Connect', icon: 'Linkedin', color: '#0077b5' },
  { id: 'linkedin_message', label: 'LinkedIn Message', icon: 'MessageCircle', color: '#0077b5' },
  { id: 'stage_change', label: 'Stage Changed', icon: 'ArrowRight', color: '#6366f1' },
  { id: 'task_completed', label: 'Task Completed', icon: 'CheckCircle', color: '#10b981' },
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
  return ACTIVITY_TYPES.find(t => t.id === id) || ACTIVITY_TYPES[0];
};
