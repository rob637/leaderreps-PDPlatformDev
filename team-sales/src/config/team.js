// Team configuration for the Sales Hub
// This defines team members, their roles, and visibility permissions

// Email aliases - map alternate emails to primary account
// Key = alias email, Value = primary/canonical email
export const EMAIL_ALIASES = {
  'rob@leaderreps.com': 'rob@sagecg.com',
};

// Resolve an email to its canonical form (for data storage/lookup)
export const getCanonicalEmail = (email) => {
  if (!email) return null;
  const lower = email.toLowerCase();
  return EMAIL_ALIASES[lower] || lower;
};

// Check if two emails represent the same user
export const isSameUser = (email1, email2) => {
  if (!email1 || !email2) return false;
  return getCanonicalEmail(email1) === getCanonicalEmail(email2);
};

export const TEAM_MEMBERS = [
  {
    email: 'rob@sagecg.com',
    aliases: ['rob@leaderreps.com'],
    name: 'Rob',
    role: 'admin',
    color: '#3B82F6', // Blue
    initials: 'RB'
  },
  {
    email: 'ryan@leaderreps.com',
    name: 'Ryan',
    role: 'member',
    color: '#8B5CF6', // Purple
    initials: 'RY'
  },
  {
    email: 'jeff@leaderreps.com',
    name: 'Jeff',
    role: 'member',
    color: '#F59E0B', // Amber
    initials: 'JF'
  },
  {
    email: 'cristina@leaderreps.com',
    name: 'Cristina',
    role: 'member',
    color: '#EC4899', // Pink
    initials: 'CR'
  }
];

// Helper functions
export const getTeamMember = (email) => {
  if (!email) return null;
  const canonical = getCanonicalEmail(email);
  return TEAM_MEMBERS.find(m => 
    m.email.toLowerCase() === canonical ||
    m.aliases?.some(a => a.toLowerCase() === email.toLowerCase())
  );
};

export const getTeamMemberByName = (name) => {
  if (!name) return null;
  return TEAM_MEMBERS.find(m => m.name.toLowerCase() === name.toLowerCase());
};

export const isAdmin = (email) => {
  const member = getTeamMember(email);
  return member?.role === 'admin';
};

export const getTeamMemberColor = (email) => {
  return getTeamMember(email)?.color || '#64748B'; // Default slate
};

export const getTeamMemberInitials = (email) => {
  const member = getTeamMember(email);
  if (member) return member.initials;
  // Fallback: first letter of email
  return email?.charAt(0).toUpperCase() || '?';
};

// Pipeline stages
export const PIPELINE_STAGES = [
  { id: 'new', label: 'New', color: '#3B82F6', bgColor: 'bg-blue-500' },
  { id: 'contacted', label: 'Contacted', color: '#8B5CF6', bgColor: 'bg-purple-500' },
  { id: 'qualified', label: 'Qualified', color: '#F59E0B', bgColor: 'bg-amber-500' },
  { id: 'demo', label: 'Demo', color: '#10B981', bgColor: 'bg-emerald-500' },
  { id: 'proposal', label: 'Proposal', color: '#6366F1', bgColor: 'bg-indigo-500' },
  { id: 'negotiation', label: 'Negotiation', color: '#EC4899', bgColor: 'bg-pink-500' },
  { id: 'won', label: 'Won', color: '#22C55E', bgColor: 'bg-green-500' },
  { id: 'lost', label: 'Lost', color: '#EF4444', bgColor: 'bg-red-500' },
];

export const getStageInfo = (stageId) => {
  return PIPELINE_STAGES.find(s => s.id === stageId) || PIPELINE_STAGES[0];
};

// View modes
export const VIEW_MODES = {
  MY_PROSPECTS: 'my',      // Show only current user's prospects
  TEAM_PROSPECTS: 'team',  // Show all team prospects (admin only)
};

// Default filter presets
export const FILTER_PRESETS = [
  { id: 'my-active', label: 'My Active', filters: { owner: 'me', excludeStages: ['won', 'lost'] } },
  { id: 'my-won', label: 'My Won', filters: { owner: 'me', stage: 'won' } },
  { id: 'needs-followup', label: 'Needs Follow-up', filters: { owner: 'me', staledays: 7 } },
  { id: 'team-pipeline', label: 'Team Pipeline', filters: { owner: 'all', excludeStages: ['won', 'lost'] }, adminOnly: true },
];
