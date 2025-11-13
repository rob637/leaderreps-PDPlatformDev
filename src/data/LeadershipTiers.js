// src/data/LeadershipTiers.js

/**
 * Defines the core leadership tiers used throughout the application.
 * This object serves as the single source of truth for tier metadata.
 */
export const LEADERSHIP_TIERS = {
  T1: { name: 'Foundational Leadership', icon: 'Trello', hex: '#47A88D' },
  T2: { name: 'Directional Leadership', icon: 'Compass', hex: '#2563EB' },
  T3: { name: 'Influential Leadership', icon: 'Users', hex: '#E04E1B' },
  T4: { name: 'Strategic Leadership', icon: 'Briefcase', hex: '#7C3AED' },
};

/**
 * Maps complexity levels (from content like Business Readings) to leadership tiers.
 * This provides a heuristic link between content difficulty and development level.
 * Used in: BusinessReadings.jsx
 */
export const COMPLEXITY_TO_TIER_MAP = {
  Low: 'T1',
  Medium: 'T2',
  High: 'T3',
};

/**
 * Maps assessment dimensions (from self-assessments) to leadership tiers.
 * This connects self-rated dimensions directly to the tiered development framework.
 * Used in: ExecutiveReflection.jsx
 */
export const DIMENSION_TO_TIER_MAP = {
  'Self-Management': 'T1',
  'Communication': 'T1',
  'Problem Solving': 'T2',
  'Team Leadership': 'T2',
  'Influence': 'T3',
  'Change Leadership': 'T3',
  'Strategic Thinking': 'T4',
  'Business Acumen': 'T4',
};
