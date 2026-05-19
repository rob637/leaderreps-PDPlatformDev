// src/components/admin/crm/config/dealMeta.js
//
// Stage / tier / source metadata for the new accounts + deals data model.

export const DEAL_STAGES = [
  { id: 'prospect',     label: 'Prospect',     color: '#94a3b8', probability: 10 },
  { id: 'qualified',    label: 'Qualified',    color: '#3b82f6', probability: 25 },
  { id: 'proposal',     label: 'Proposal',     color: '#8b5cf6', probability: 50 },
  { id: 'negotiation',  label: 'Negotiation',  color: '#f59e0b', probability: 75 },
  { id: 'closed_won',   label: 'Closed Won',   color: '#10b981', probability: 100 },
  { id: 'closed_lost',  label: 'Closed Lost',  color: '#ef4444', probability: 0   },
];

export const OPEN_DEAL_STAGES = ['prospect', 'qualified', 'proposal', 'negotiation'];
export const CLOSED_DEAL_STAGES = ['closed_won', 'closed_lost'];

export const ACCOUNT_TIERS = [
  { id: 'strategic',     label: 'Strategic',     color: '#7c3aed' },
  { id: 'growth',        label: 'Growth',        color: '#10b981' },
  { id: 'standard',      label: 'Standard',      color: '#3b82f6' },
  { id: 'low_priority',  label: 'Low Priority',  color: '#94a3b8' },
];

export const DEAL_SOURCES = [
  'Inbound',
  'Outbound',
  'Referral',
  'Partner',
  'Event',
  'Cold Email',
  'LinkedIn',
  'Other',
];

export const LOST_REASONS = [
  'Budget',
  'Timing',
  'Competitor',
  'No decision',
  'Lost contact',
  'Bad fit',
  'Other',
];

export const getDealStage = (id) =>
  DEAL_STAGES.find((s) => s.id === id) || DEAL_STAGES[0];

export const getAccountTier = (id) =>
  ACCOUNT_TIERS.find((t) => t.id === id) || ACCOUNT_TIERS[2];

// Extract a primary domain from an email or website string.
export const extractDomain = (str) => {
  if (!str) return '';
  const s = String(str).trim().toLowerCase();
  if (s.includes('@')) return s.split('@').pop().split('?')[0];
  return s
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]
    .split('?')[0];
};

// Normalize a company name for fuzzy match (lowercase, strip suffixes/punct).
export const normalizeCompanyName = (name) => {
  if (!name) return '';
  return String(name)
    .toLowerCase()
    .replace(/[\u2018\u2019\u201c\u201d]/g, "'")
    .replace(/&/g, 'and')
    .replace(/\b(inc|incorporated|llc|llp|ltd|limited|corp|corporation|co|company|gmbh|sa|plc|pllc)\.?\b/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};
